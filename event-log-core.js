// ============================================================================
// event-log-core.js — Nhật ký sự kiện trận đấu có cấu trúc cho ProjectG
// ----------------------------------------------------------------------------
// Mục đích: ghi lại MỌI sự kiện quan trọng của trận (bắn / trúng / hạ /
// đặt-gỡ-nổ bom / kỹ năng / công trình / vòng đời round-trận) dưới dạng bản
// ghi bất biến, phục vụ 2 nhu cầu đã có trong backlog:
//   1) Replay / killcam: phát lại trận từ dòng sự kiện + vị trí theo thời gian.
//   2) Thống kê sau round/trận (mechanics/04): accuracy, headshot %, sát
//      thương theo người bắn — qua computeStats() có sẵn trong module này.
//
// Tính chất:
//   - KHÔNG phụ thuộc THREE.js / DOM / game: module thuần dữ liệu, nạp được
//     cả trong trình duyệt (ES module) lẫn Node (test/CI). Game chỉ việc gọi
//     các hàm phát sự kiện tại đúng điểm móc liệt kê trong INTEGRATION-events.md.
//   - Vòng đệm (ring buffer) dung lượng cố định: ghi đè sự kiện cũ nhất khi
//     đầy, đếm số sự kiện bị rơi (dropped) để bên tiêu thụ biết dữ liệu thiếu.
//   - Mỗi sự kiện được đóng băng (Object.freeze) ngay khi ghi: nhật ký là
//     bằng chứng, không ai sửa ngược được.
//   - Đồng hồ trận do game bơm vào (hàm now), khớp G.time của game — KHÔNG
//     dùng Date.now() để replay/stats luôn nhất quán với thời gian trong trận.
//
// Schema một sự kiện:
//   { seq, t, round, phase, type, actor, data }
//     seq   : số thứ tự tăng đơn điệu trong trận, bắt đầu từ 1.
//     t     : thời gian trận (giây) tại lúc ghi — game truyền nowS().
//     round : round hiện tại (game bơm qua setContext hoặc beginRound).
//     phase : G.phase tại lúc ghi ('buy' | 'live' | 'planted' | 'end' | ...).
//     type  : một trong EVENT_TYPES bên dưới.
//     actor : định danh người gây ra sự kiện: 'player' hoặc tên bot đúng như
//             game dùng ('Địch · FLARE', 'Đồng đội · AEGIS'...). Sự kiện hệ
//             thống (round/trận/bom nổ) dùng actor = 'system'.
//     data  : payload riêng theo type (xem PAYLOADS trong INTEGRATION-events.md
//             và chú thích tại từng hàm phát sự kiện rút gọn bên dưới).
// ============================================================================

export const EVENT_LOG_VERSION = 1;

export const EVENT_TYPES = Object.freeze({
  MATCH_START: 'match_start',     // startMatch()
  ROUND_START: 'round_start',     // startRound()
  ROUND_END: 'round_end',         // endRound(usWin, reason)
  MATCH_END: 'match_end',         // endMatch()
  SHOT: 'shot',                   // tryShoot() (người chơi) / botShoot() (bot)
  HIT: 'hit',                     // damageBot() / damagePlayer() — đạn trúng người
  KILL: 'kill',                   // killBot() / onPlayerDeath()
  ABILITY: 'ability',             // spendAbility(kind) thành công (castQ/E/X)
  BOMB_PLANT: 'bomb_plant',       // plantBomb(site)
  BOMB_DEFUSE: 'bomb_defuse',     // updateBot(): defuseProgress >= 5
  BOMB_EXPLODE: 'bomb_explode',   // explodeBomb()
  STRUCTURE_HIT: 'structure_hit', // damageStructure(fx, dmg), công trình còn HP
  STRUCTURE_DESTROY: 'structure_destroy', // damageStructure(): fx.hp <= 0
  RELOAD: 'reload',               // startReload()
  BUY: 'buy',                     // các nút mua trong buy menu
});

const KNOWN_TYPES = new Set(Object.values(EVENT_TYPES));

const DEFAULT_CAPACITY = 8192; // ~1–2 MB JSON cho cả trận dài; xem INTEGRATION.

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

// Chuẩn hoá vị trí về {x, z} thuần số (game truyền THREE.Vector3 cũng được —
// chỉ đọc .x/.z, module không giữ tham chiếu tới object của game).
function normPos(p) {
  if (!p) return null;
  const x = Number(p.x), z = Number(p.z);
  if (!Number.isFinite(x) || !Number.isFinite(z)) return null;
  return { x: Math.round(x * 100) / 100, z: Math.round(z * 100) / 100 };
}

export class MatchEventLog {
  /**
   * @param {object} [opts]
   * @param {number} [opts.capacity=8192]  Số sự kiện tối đa giữ trong vòng đệm.
   * @param {function} [opts.now]          Hàm trả thời gian trận (giây).
   *                                       Game truyền () => G.time (== nowS()).
   *                                       Mặc định: đồng hồ nội bộ tự tăng theo
   *                                       thời gian thực kể từ lúc tạo log.
   * @param {string} [opts.matchId]        Định danh trận (tuỳ chọn, vào export).
   * @param {boolean} [opts.strict=false]  true = ném lỗi khi log() gặp type lạ;
   *                                       false = vẫn ghi, đánh dấu data._unknown.
   */
  constructor(opts = {}) {
    const cap = Math.floor(opts.capacity ?? DEFAULT_CAPACITY);
    this.capacity = Number.isFinite(cap) && cap > 0 ? cap : DEFAULT_CAPACITY;
    this.matchId = opts.matchId ?? null;
    this.strict = !!opts.strict;
    this._t0 = Date.now();
    this._now = typeof opts.now === 'function'
      ? opts.now
      : () => (Date.now() - this._t0) / 1000;
    this._buf = new Array(this.capacity);
    this._head = 0;      // vị trí ghi tiếp theo trong vòng đệm
    this._size = 0;      // số sự kiện đang giữ (<= capacity)
    this._seq = 0;       // seq của sự kiện gần nhất
    this.dropped = 0;    // số sự kiện đã bị ghi đè vì đầy vòng đệm
    this._round = 0;
    this._phase = 'menu';
  }

  /** Bơm ngữ cảnh hiện tại của trận; game gọi mỗi khi round/phase đổi. */
  setContext(ctx = {}) {
    if (Number.isFinite(ctx.round)) this._round = ctx.round;
    if (typeof ctx.phase === 'string') this._phase = ctx.phase;
    return this;
  }

  beginMatch(matchId) {
    if (matchId !== undefined) this.matchId = matchId;
    this.setContext({ round: 1 });
    return this.log(EVENT_TYPES.MATCH_START, 'system', {});
  }

  beginRound(round) {
    this.setContext({ round });
    return this.log(EVENT_TYPES.ROUND_START, 'system', { round: this._round });
  }

  /**
   * Ghi một sự kiện. Trả về bản ghi đã đóng băng, hoặc null nếu bị strict từ chối.
   * data được sao chép nông + đóng băng: sửa object gốc sau khi log không
   * làm thay đổi nhật ký.
   */
  log(type, actor, data = {}) {
    if (!KNOWN_TYPES.has(type)) {
      if (this.strict) throw new Error(`[event-log] type lạ: ${String(type)}`);
      data = { ...data, _unknown: String(type) };
      type = 'unknown';
    }
    if (!isPlainObject(data)) data = { value: data };
    const ev = Object.freeze({
      seq: ++this._seq,
      t: Math.round(this._now() * 1000) / 1000,
      round: this._round,
      phase: this._phase,
      type,
      actor: actor ?? 'system',
      data: Object.freeze({ ...data }),
    });
    if (this._size === this.capacity) this.dropped++;
    else this._size++;
    this._buf[this._head] = ev;
    this._head = (this._head + 1) % this.capacity;
    return ev;
  }

  // --------------------------------------------------------------------------
  // Hàm phát sự kiện rút gọn — mỗi hàm ứng với đúng một điểm móc trong game
  // (số dòng & hàm gốc: xem INTEGRATION-events.md).
  // --------------------------------------------------------------------------

  /** tryShoot() / botShoot(b, found): một phát bắn đã rời nòng. */
  shot(actor, { weapon, pos, target = null, recoilIndex = null } = {}) {
    return this.log(EVENT_TYPES.SHOT, actor, {
      weapon: weapon ?? null,
      pos: normPos(pos),
      target,
      recoilIndex,
    });
  }

  /** damageBot() / damagePlayer(): một viên đạn trúng một người. */
  hit(actor, { target, weapon = null, part = 'body', dmg, hpAfter = null, pos = null } = {}) {
    return this.log(EVENT_TYPES.HIT, actor, {
      target: target ?? null,
      weapon,
      part, // 'head' | 'body'
      dmg: Math.round(Number(dmg) * 10) / 10,
      hpAfter: hpAfter === null ? null : Math.max(0, Math.round(hpAfter)),
      pos: normPos(pos),
    });
  }

  /** killBot(bot, attackerName, isHead) / onPlayerDeath(). */
  kill(actor, { victim, weapon = null, headshot = false, pos = null } = {}) {
    return this.log(EVENT_TYPES.KILL, actor, {
      victim: victim ?? null,
      weapon,
      headshot: !!headshot,
      pos: normPos(pos),
    });
  }

  /** spendAbility(kind) trả true: kỹ năng đã trừ năng lượng thành công. */
  ability(actor, { op, kind, name = null, cost = null } = {}) {
    return this.log(EVENT_TYPES.ABILITY, actor, {
      op: op ?? null,
      kind: kind ?? null, // 'q' | 'e' | 'x'
      name,
      cost,
    });
  }

  /** plantBomb(site): bomb đã đặt xong sau PLANT_TIME. */
  bombPlant(actor, { site, pos, bombTime = null } = {}) {
    return this.log(EVENT_TYPES.BOMB_PLANT, actor, {
      site: site ?? null,
      pos: normPos(pos),
      bombTime,
    });
  }

  /** updateBot() nhánh gỡ bom: defuseProgress >= 5. */
  bombDefuse(actor, { site = null, pos = null } = {}) {
    return this.log(EVENT_TYPES.BOMB_DEFUSE, actor, { site, pos: normPos(pos) });
  }

  /** explodeBomb(). */
  bombExplode({ site = null, pos = null } = {}) {
    return this.log(EVENT_TYPES.BOMB_EXPLODE, 'system', { site, pos: normPos(pos) });
  }

  /** damageStructure(fx, dmg): destroyed=true khi fx.hp <= 0 sau khi trừ. */
  structure(actor, { kind, dmg, hpAfter, destroyed = false, pos = null } = {}) {
    return this.log(
      destroyed ? EVENT_TYPES.STRUCTURE_DESTROY : EVENT_TYPES.STRUCTURE_HIT,
      actor,
      { kind: kind ?? null, dmg, hpAfter: Math.max(0, Math.round(hpAfter ?? 0)), pos: normPos(pos) },
    );
  }

  /** endRound(usWin, reason) — kèm tỉ số sau round. */
  roundEnd({ win, reason = null, pScore = null, eScore = null } = {}) {
    return this.log(EVENT_TYPES.ROUND_END, 'system', {
      round: this._round, win: !!win, reason, pScore, eScore,
    });
  }

  /** endMatch(). */
  matchEnd({ pScore = null, eScore = null, rounds = null, op = null } = {}) {
    return this.log(EVENT_TYPES.MATCH_END, 'system', { pScore, eScore, rounds, op });
  }

  /** startReload(). */
  reload(actor, { weapon = null } = {}) {
    return this.log(EVENT_TYPES.RELOAD, actor, { weapon });
  }

  /** Buy menu: mua thành công một món. */
  buy(actor, { item, cost = null, moneyAfter = null } = {}) {
    return this.log(EVENT_TYPES.BUY, actor, { item: item ?? null, cost, moneyAfter });
  }

  // --------------------------------------------------------------------------
  // Truy vấn — luôn trả bản sao mảng theo đúng thứ tự thời gian (seq tăng dần).
  // --------------------------------------------------------------------------

  get size() { return this._size; }
  get lastSeq() { return this._seq; }

  all() {
    const out = new Array(this._size);
    const start = (this._head - this._size + this.capacity) % this.capacity;
    for (let i = 0; i < this._size; i++) out[i] = this._buf[(start + i) % this.capacity];
    return out;
  }

  /** Sự kiện kể từ seq cho trước (không gồm chính nó) — cho bên đọc tăng dần như replay. */
  since(seq) {
    return this.all().filter(ev => ev.seq > seq);
  }

  byType(type) {
    return this.all().filter(ev => ev.type === type);
  }

  byRound(round) {
    return this.all().filter(ev => ev.round === round);
  }

  byActor(actor) {
    return this.all().filter(ev => ev.actor === actor);
  }

  last(n = 1) {
    const a = this.all();
    return a.slice(Math.max(0, a.length - n));
  }

  clear() {
    this._buf.fill(undefined);
    this._head = 0;
    this._size = 0;
    this._seq = 0;
    this.dropped = 0;
  }

  // --------------------------------------------------------------------------
  // Thống kê — nền cho màn hình tổng kết sau round/trận (mechanics/04).
  // Chỉ tính trên phần sự kiện còn trong vòng đệm; nếu dropped > 0, số liệu
  // là "tối thiểu đã ghi được" và bên hiển thị nên ghi chú.
  // --------------------------------------------------------------------------

  computeStats() {
    const per = new Map();
    const blank = () => ({
      shots: 0, hits: 0, kills: 0, deaths: 0, headshots: 0, headshotKills: 0,
      damageDealt: 0, abilitiesUsed: 0, plants: 0,
    });
    const row = name => {
      if (!per.has(name)) per.set(name, blank());
      return per.get(name);
    };
    for (const ev of this.all()) {
      const d = ev.data;
      switch (ev.type) {
        case EVENT_TYPES.SHOT:
          row(ev.actor).shots++;
          break;
        case EVENT_TYPES.HIT: {
          const r = row(ev.actor);
          r.hits++;
          r.damageDealt += Number(d.dmg) || 0;
          if (d.part === 'head') r.headshots++;
          break;
        }
        case EVENT_TYPES.KILL: {
          const r = row(ev.actor);
          r.kills++;
          // headshots (viên trúng đầu) đếm ở HIT; ở đây chỉ đếm kill-bằng-headshot
          // riêng — hai số khác nhau, đừng cộng gộp.
          if (d.headshot) r.headshotKills++;
          if (d.victim) row(d.victim).deaths++;
          break;
        }
        case EVENT_TYPES.ABILITY:
          row(ev.actor).abilitiesUsed++;
          break;
        case EVENT_TYPES.BOMB_PLANT:
          row(ev.actor).plants++;
          break;
        default:
          break;
      }
    }
    const out = {};
    for (const [name, r] of per) {
      out[name] = {
        ...r,
        damageDealt: Math.round(r.damageDealt * 10) / 10,
        accuracy: r.shots > 0 ? Math.round((r.hits / r.shots) * 1000) / 1000 : null,
        headshotRate: r.hits > 0 ? Math.round((r.headshots / r.hits) * 1000) / 1000 : null,
      };
    }
    return {
      matchId: this.matchId,
      eventsKept: this._size,
      eventsDropped: this.dropped,
      actors: out,
    };
  }

  // --------------------------------------------------------------------------
  // Xuất / nhập JSON — định dạng ổn định, có version để công cụ replay đọc lại.
  // --------------------------------------------------------------------------

  toJSON() {
    return {
      version: EVENT_LOG_VERSION,
      matchId: this.matchId,
      capacity: this.capacity,
      dropped: this.dropped,
      exportedSeq: this._seq,
      events: this.all(),
    };
  }

  toJSONString(pretty = false) {
    return JSON.stringify(this.toJSON(), null, pretty ? 2 : 0);
  }

  /**
   * Dựng lại một log từ object đã xuất (công cụ replay/offline dùng).
   * Sự kiện được nạp nguyên trạng (giữ seq gốc); seq mới phát sinh sau đó
   * tiếp nối từ exportedSeq để không trùng.
   */
  static fromJSON(obj, opts = {}) {
    if (!isPlainObject(obj) || !Array.isArray(obj.events)) {
      throw new Error('[event-log] dữ liệu nhập không hợp lệ: thiếu events[]');
    }
    if (obj.version !== EVENT_LOG_VERSION) {
      throw new Error(`[event-log] version không khớp: ${obj.version} != ${EVENT_LOG_VERSION}`);
    }
    const log = new MatchEventLog({
      capacity: Math.max(obj.events.length, opts.capacity ?? DEFAULT_CAPACITY),
      matchId: obj.matchId ?? null,
      now: opts.now,
      strict: opts.strict,
    });
    for (const raw of obj.events) {
      const ev = Object.freeze({ ...raw, data: Object.freeze({ ...(raw.data || {}) }) });
      log._buf[log._head] = ev;
      log._head = (log._head + 1) % log.capacity;
      log._size++;
      log._seq = Math.max(log._seq, ev.seq || 0);
      if (Number.isFinite(ev.round)) log._round = ev.round;
    }
    log.dropped = obj.dropped || 0;
    return log;
  }
}

export default MatchEventLog;
