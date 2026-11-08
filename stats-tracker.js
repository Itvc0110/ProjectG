// ============================================================================
// stats-tracker.js — Thống kê trận đấu cho ProjectG, tiêu thụ event-log-core
// ----------------------------------------------------------------------------
// Mục đích: biến dòng sự kiện của `event-log-core.js` (MatchEventLog) thành
// số liệu tổng kết cho màn hình kết thúc trận / sau round (backlog
// mechanics/04): K/D/A, tỉ lệ headshot, độ chính xác, sát thương theo súng
// và theo operator, kinh tế theo round — kèm xuất JSON và bảng tổng kết
// dạng text sẵn sàng hiển thị.
//
// Tính chất:
//   - THUẦN DỮ LIỆU: không phụ thuộc THREE / DOM / game, không import gì cả.
//     Chạy được trong trình duyệt (ES module) lẫn Node (test/CI/offline).
//   - Nguồn vào duy nhất là sự kiện đúng schema của event-log-core:
//       { seq, t, round, phase, type, actor, data }
//     Nhận 4 dạng nguồn: instance MatchEventLog (duck-type .all()), object
//     JSON đã xuất bằng log.toJSON(), mảng sự kiện thô, hoặc chuỗi JSON.
//   - NHẬN DIỆN SÚNG của hit/kill: điểm móc hiện tại (INTEGRATION-events.md)
//     KHÔNG truyền weapon vào hit()/kill(). Tracker suy ra theo phát bắn gần
//     nhất của chính actor đó (last-shot join) — đúng bản chất dữ liệu game
//     đang ghi; nếu payload sau này có weapon thì ưu tiên weapon trong payload.
//   - HỖ TRỢ (assist) không có sự kiện riêng trong log: tính suy luận —
//     actor gây sát thương lên nạn nhân trong vòng `assistWindow` giây trước
//     khi nạn nhân gục (cùng round, không phải kẻ hạ, tổng sát thương >=
//     `assistMinDamage`) thì được 1 assist, mỗi người tối đa 1 assist/nạn nhân.
//   - KINH TẾ chỉ đầy đủ cho 'player': hiện chỉ buy menu của người chơi phát
//     sự kiện `buy` (bot mua đồ không qua log — xem INTEGRATION-events.md §2).
//     Tracker vẫn tổng hợp cho mọi actor có sự kiện buy.
//
// Cách dùng nhanh:
//   import { StatsTracker } from './stats-tracker.js';
//   const tracker = new StatsTracker({ operators: { player: player.opKey } });
//   tracker.ingestFrom(EVLOG);            // gọi ở endRound()/endMatch()
//   const s = tracker.summary();          // object cho UI tự dựng DOM
//   endscreenEl.textContent = tracker.formatTable();  // hoặc bảng text sẵn
// Điểm móc chi tiết: xem INTEGRATION-stats.md cùng thư mục.
//
// KIỂM CHỨNG (chạy thật trên Node v24, bản sao .mjs trong /tmp vì gói .js
// chưa khai type=module — cùng cách kiểm chứng các module anh em):
//   node --check stats-tracker.mjs -> đạt (cú pháp ESM hợp lệ)
//   Test khói (smoke.mjs, 40+ assert): nạp event-log-core THẬT, bơm trận
//   giả 2 round (player: 6 phát, 3 hit, 2 kill; AEGIS gây 30 dmg -> assist;
//   buy rifle $1500; ability FLARE; plant A) -> PASS toàn bộ: player
//   K/D/A 2/1/0, accuracy 50%, HS 66.7% (2/3 hit), dmg 200, ADR 100,
//   byWeapon rifle/smg mỗi khẩu 100 dmg + 1 kill (suy súng qua last-shot),
//   operators.FLARE dmg 200, eco round 1 spent $1500/endMoney $500,
//   rounds[0].win=true; fromLog(instance) + fromLog(JSON export) +
//   ingestFrom gọi 2 lần (không trùng số) + tracker rỗng đều đạt.
// ============================================================================

export const STATS_TRACKER_VERSION = 1;

const round1 = v => Math.round(v * 10) / 10;          // 1 chữ số thập phân
const round3 = v => Math.round(v * 1000) / 1000;      // tỉ lệ: 3 chữ số
const ratio = (a, b) => (b > 0 ? round3(a / b) : null); // null = chưa có mẫu

function blankWeapon() {
  return { shots: 0, hits: 0, kills: 0, headshots: 0, damage: 0 };
}

function blankPlayer() {
  return {
    kills: 0, deaths: 0, assists: 0,
    shots: 0, hits: 0, headshots: 0, headshotKills: 0,
    damageDealt: 0, damageTaken: 0,
    abilitiesUsed: 0, plants: 0, defuses: 0, reloads: 0,
    structuresDestroyed: 0, spent: 0,
    byWeapon: {}, // weaponKey -> blankWeapon()
  };
}

function blankRoundPlayer() {
  return {
    kills: 0, deaths: 0, assists: 0, shots: 0, hits: 0,
    headshots: 0, damageDealt: 0, damageTaken: 0, spent: 0,
  };
}

export class StatsTracker {
  /**
   * @param {object} [opts]
   * @param {number} [opts.assistWindow=5]    Cửa sổ giây tính assist.
   * @param {number} [opts.assistMinDamage=1] Tổng sát thương tối thiểu để tính assist.
   * @param {Object<string,string>} [opts.operators] Ánh xạ actor -> operator
   *        (vd { player: 'FLARE' }). Tracker còn TỰ HỌC thêm từ sự kiện
   *        `ability` (data.op) trong lúc nạp.
   * @param {string} [opts.matchId]
   */
  constructor(opts = {}) {
    this.assistWindow = Number.isFinite(opts.assistWindow) ? opts.assistWindow : 5;
    this.assistMinDamage = Number.isFinite(opts.assistMinDamage) ? opts.assistMinDamage : 1;
    this.matchId = opts.matchId ?? null;
    this.dropped = 0; // kế thừa từ nguồn (log.dropped) khi nạp qua fromLog/ingestFrom

    this._players = new Map();     // actor -> blankPlayer() (toàn trận)
    this._rounds = new Map();      // round -> bản ghi round (xem _roundRec)
    this._actorOp = new Map();     // actor -> opKey
    this._lastWeapon = new Map();  // actor -> weapon của phát bắn gần nhất
    this._ledger = new Map();      // victim -> [{t, round, attacker, dmg}]
    this._roundsCompleted = 0;     // số sự kiện round_end đã nạp
    this._maxRound = 0;
    this._firstT = null;
    this._lastT = null;
    this._lastSeq = 0;             // seq cao nhất đã nạp (cho ingestFrom tăng dần)
    this.eventsIngested = 0;

    if (opts.operators) {
      for (const [actor, op] of Object.entries(opts.operators)) {
        if (op) this._actorOp.set(actor, op);
      }
    }
  }

  // --------------------------------------------------------------------------
  // Nạp sự kiện
  // --------------------------------------------------------------------------

  _player(name) {
    if (!this._players.has(name)) this._players.set(name, blankPlayer());
    return this._players.get(name);
  }

  _roundRec(round) {
    if (!this._rounds.has(round)) {
      this._rounds.set(round, {
        round,
        win: null, reason: null, pScore: null, eScore: null,
        firstT: null, lastT: null,
        players: new Map(),  // actor -> blankRoundPlayer()
        economy: new Map(),  // actor -> {spent, purchases, items:[{item,cost}], endMoney}
      });
    }
    return this._rounds.get(round);
  }

  _roundPlayer(rec, name) {
    if (!rec.players.has(name)) rec.players.set(name, blankRoundPlayer());
    return rec.players.get(name);
  }

  _weaponOf(actor, data) {
    if (data && typeof data.weapon === 'string' && data.weapon) return data.weapon;
    return this._lastWeapon.get(actor) || 'unknown';
  }

  _weaponRow(playerRec, key) {
    if (!playerRec.byWeapon[key]) playerRec.byWeapon[key] = blankWeapon();
    return playerRec.byWeapon[key];
  }

  /** Nạp 1 sự kiện (đúng schema event-log-core). Bỏ qua lặng lẽ nếu hỏng. */
  ingest(ev) {
    if (!ev || typeof ev !== 'object' || typeof ev.type !== 'string') return this;
    const d = ev.data && typeof ev.data === 'object' ? ev.data : {};
    const actor = typeof ev.actor === 'string' ? ev.actor : 'system';
    const t = Number(ev.t) || 0;
    const round = Number.isFinite(ev.round) ? ev.round : 0;

    this.eventsIngested++;
    if (Number.isFinite(ev.seq)) this._lastSeq = Math.max(this._lastSeq, ev.seq);
    if (this._firstT === null) this._firstT = t;
    this._lastT = t;
    if (round > 0) {
      this._maxRound = Math.max(this._maxRound, round);
      const rec = this._roundRec(round);
      if (rec.firstT === null) rec.firstT = t;
      rec.lastT = t;
    }

    switch (ev.type) {
      case 'shot': {
        const p = this._player(actor);
        p.shots++;
        const w = typeof d.weapon === 'string' && d.weapon ? d.weapon : 'unknown';
        this._lastWeapon.set(actor, w);
        this._weaponRow(p, w).shots++;
        if (round > 0) this._roundPlayer(this._roundRec(round), actor).shots++;
        break;
      }
      case 'hit': {
        const p = this._player(actor);
        const dmg = Number(d.dmg) || 0;
        p.hits++;
        p.damageDealt += dmg;
        if (d.part === 'head') p.headshots++;
        const wr = this._weaponRow(p, this._weaponOf(actor, d));
        wr.hits++;
        wr.damage += dmg;
        if (d.part === 'head') wr.headshots++;
        if (typeof d.target === 'string' && d.target) {
          this._player(d.target).damageTaken += dmg;
          // sổ sát thương phục vụ suy luận assist khi nạn nhân gục
          if (!this._ledger.has(d.target)) this._ledger.set(d.target, []);
          this._ledger.get(d.target).push({ t, round, attacker: actor, dmg });
          if (round > 0) this._roundPlayer(this._roundRec(round), d.target).damageTaken += dmg;
        }
        if (round > 0) {
          const rp = this._roundPlayer(this._roundRec(round), actor);
          rp.hits++;
          rp.damageDealt += dmg;
          if (d.part === 'head') rp.headshots++;
        }
        break;
      }
      case 'kill': {
        const p = this._player(actor);
        p.kills++;
        if (d.headshot) p.headshotKills++;
        this._weaponRow(p, this._weaponOf(actor, d)).kills++;
        const victim = typeof d.victim === 'string' ? d.victim : null;
        if (round > 0) {
          const rp = this._roundPlayer(this._roundRec(round), actor);
          rp.kills++;
        }
        if (victim) {
          this._player(victim).deaths++;
          if (round > 0) this._roundPlayer(this._roundRec(round), victim).deaths++;
          this._settleAssists(victim, actor, t, round);
        }
        break;
      }
      case 'ability': {
        this._player(actor).abilitiesUsed++;
        if (d.op) this._actorOp.set(actor, d.op); // tự học operator của actor
        break;
      }
      case 'bomb_plant':
        this._player(actor).plants++;
        break;
      case 'bomb_defuse':
        this._player(actor).defuses++;
        break;
      case 'structure_destroy':
        this._player(actor).structuresDestroyed++;
        break;
      case 'reload':
        this._player(actor).reloads++;
        break;
      case 'buy': {
        const cost = Number(d.cost) || 0;
        this._player(actor).spent += cost;
        if (round > 0) {
          const rec = this._roundRec(round);
          if (!rec.economy.has(actor)) {
            rec.economy.set(actor, { spent: 0, purchases: 0, items: [], endMoney: null });
          }
          const eco = rec.economy.get(actor);
          eco.spent += cost;
          eco.purchases++;
          eco.items.push({ item: d.item ?? null, cost });
          if (Number.isFinite(d.moneyAfter)) eco.endMoney = d.moneyAfter;
          this._roundPlayer(rec, actor).spent += cost;
        }
        break;
      }
      case 'round_end': {
        this._roundsCompleted++;
        const rNum = Number.isFinite(d.round) ? d.round : round;
        if (rNum > 0) {
          const rec = this._roundRec(rNum);
          rec.win = !!d.win;
          rec.reason = d.reason ?? null;
          rec.pScore = d.pScore ?? null;
          rec.eScore = d.eScore ?? null;
        }
        break;
      }
      default:
        // match_start / round_start / match_end / bomb_explode /
        // structure_hit / unknown: chỉ đóng góp mốc thời gian & round.
        break;
    }
    return this;
  }

  /** Khi nạn nhân gục: cộng assist cho người đã gây sát thương gần đây. */
  _settleAssists(victim, killer, killT, round) {
    const entries = this._ledger.get(victim);
    if (!entries) return;
    const totals = new Map();
    for (const e of entries) {
      if (e.round !== round) continue;
      if (e.attacker === killer || e.attacker === victim) continue;
      if (killT - e.t > this.assistWindow || e.t > killT) continue;
      totals.set(e.attacker, (totals.get(e.attacker) || 0) + e.dmg);
    }
    for (const [attacker, dmg] of totals) {
      if (dmg >= this.assistMinDamage) {
        this._player(attacker).assists++;
        if (round > 0) this._roundPlayer(this._roundRec(round), attacker).assists++;
      }
    }
    // Dọn sổ của nạn nhân tới thời điểm này (đợt sống mới tính lại từ đầu).
    this._ledger.set(victim, entries.filter(e => e.round > round || e.t > killT));
  }

  /** Nạp một mảng sự kiện (thứ tự bất kỳ — nên truyền theo seq tăng dần). */
  ingestAll(events) {
    if (Array.isArray(events)) for (const ev of events) this.ingest(ev);
    return this;
  }

  /**
   * Nạp tăng dần từ một MatchEventLog: chỉ lấy sự kiện sau seq đã nạp.
   * Gọi lặp lại an toàn ở endRound()/endMatch() — không trùng số liệu.
   */
  ingestFrom(log) {
    if (!log || typeof log.since !== 'function' || typeof log.all !== 'function') {
      throw new Error('[stats-tracker] ingestFrom cần MatchEventLog (có .since/.all)');
    }
    if (log.matchId != null && this.matchId === null) this.matchId = log.matchId;
    if (Number.isFinite(log.dropped)) this.dropped = log.dropped;
    return this.ingestAll(log.since(this._lastSeq));
  }

  /**
   * Dựng tracker từ một nguồn hoàn chỉnh:
   * MatchEventLog | object log.toJSON() | mảng sự kiện | chuỗi JSON.
   */
  static fromLog(source, opts = {}) {
    const tracker = new StatsTracker(opts);
    let events = null;
    if (typeof source === 'string') source = JSON.parse(source);
    if (Array.isArray(source)) {
      events = source;
    } else if (source && typeof source.all === 'function') {
      events = source.all();
      if (source.matchId != null) tracker.matchId = source.matchId;
      if (Number.isFinite(source.dropped)) tracker.dropped = source.dropped;
    } else if (source && Array.isArray(source.events)) {
      events = source.events;
      if (source.matchId != null) tracker.matchId = source.matchId;
      if (Number.isFinite(source.dropped)) tracker.dropped = source.dropped;
    }
    if (!events) throw new Error('[stats-tracker] nguồn không hợp lệ: cần log, object xuất JSON, hoặc mảng sự kiện');
    return tracker.ingestAll(events);
  }

  // --------------------------------------------------------------------------
  // Tổng hợp
  // --------------------------------------------------------------------------

  get roundsPlayed() {
    return this._roundsCompleted || this._maxRound;
  }

  _playerSummary(name, p) {
    const byWeapon = {};
    for (const [w, r] of Object.entries(p.byWeapon)) {
      byWeapon[w] = {
        shots: r.shots, hits: r.hits, kills: r.kills, headshots: r.headshots,
        damage: round1(r.damage),
        accuracy: ratio(r.hits, r.shots),
        headshotPct: ratio(r.headshots, r.hits),
      };
    }
    const rounds = this.roundsPlayed;
    return {
      name,
      operator: this._actorOp.get(name) ?? null,
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      kd: p.deaths > 0 ? round3(p.kills / p.deaths) : p.kills,
      shots: p.shots,
      hits: p.hits,
      accuracy: ratio(p.hits, p.shots),
      headshots: p.headshots,                    // số hit trúng đầu
      headshotPct: ratio(p.headshots, p.hits),   // % hit là headshot
      headshotKills: p.headshotKills,
      headshotKillPct: ratio(p.headshotKills, p.kills),
      damageDealt: round1(p.damageDealt),
      damageTaken: round1(p.damageTaken),
      adr: rounds > 0 ? round1(p.damageDealt / rounds) : null, // sát thương TB/round
      abilitiesUsed: p.abilitiesUsed,
      plants: p.plants,
      defuses: p.defuses,
      reloads: p.reloads,
      structuresDestroyed: p.structuresDestroyed,
      spent: p.spent,
      byWeapon,
    };
  }

  /**
   * Object tổng kết toàn trận — nguồn sự thật cho UI màn hình kết thúc.
   * complete=false khi log đã tràn vòng đệm (dropped > 0): số liệu là
   * phần ghi được, UI nên ghi chú thay vì khẳng định tuyệt đối.
   */
  summary() {
    const players = {};
    for (const [name, p] of this._players) players[name] = this._playerSummary(name, p);

    // Sát thương/kill theo operator: suy từ tổng của actor theo op đã biết
    // (tính ở thời điểm tổng hợp nên sự kiện ability đến muộn vẫn khớp).
    const operators = {};
    for (const [name, p] of this._players) {
      const op = this._actorOp.get(name);
      if (!op) continue;
      if (!operators[op]) operators[op] = { damage: 0, kills: 0, headshotKills: 0, abilitiesUsed: 0, actors: [] };
      operators[op].damage += p.damageDealt;
      operators[op].kills += p.kills;
      operators[op].headshotKills += p.headshotKills;
      operators[op].abilitiesUsed += p.abilitiesUsed;
      operators[op].actors.push(name);
    }
    for (const op of Object.values(operators)) op.damage = round1(op.damage);

    // Tổng theo súng (mọi actor) — phục vụ cân bằng vũ khí.
    const weapons = {};
    for (const p of this._players.values()) {
      for (const [w, r] of Object.entries(p.byWeapon)) {
        if (!weapons[w]) weapons[w] = blankWeapon();
        weapons[w].shots += r.shots;
        weapons[w].hits += r.hits;
        weapons[w].kills += r.kills;
        weapons[w].headshots += r.headshots;
        weapons[w].damage += r.damage;
      }
    }
    for (const w of Object.values(weapons)) {
      w.damage = round1(w.damage);
      w.accuracy = ratio(w.hits, w.shots);
      w.headshotPct = ratio(w.headshots, w.hits);
    }

    const rounds = [...this._rounds.values()]
      .sort((a, b) => a.round - b.round)
      .map(rec => {
        const rp = {};
        for (const [name, r] of rec.players) rp[name] = { ...r, damageDealt: round1(r.damageDealt), damageTaken: round1(r.damageTaken) };
        const eco = {};
        for (const [name, e] of rec.economy) eco[name] = { spent: e.spent, purchases: e.purchases, items: e.items, endMoney: e.endMoney };
        return {
          round: rec.round,
          win: rec.win, reason: rec.reason, pScore: rec.pScore, eScore: rec.eScore,
          durationSec: rec.firstT !== null && rec.lastT !== null ? round1(rec.lastT - rec.firstT) : null,
          players: rp,
          economy: eco,
        };
      });

    return {
      version: STATS_TRACKER_VERSION,
      matchId: this.matchId,
      complete: this.dropped === 0,
      eventsIngested: this.eventsIngested,
      eventsDropped: this.dropped,
      roundsPlayed: this.roundsPlayed,
      durationSec: this._firstT !== null && this._lastT !== null ? round1(this._lastT - this._firstT) : null,
      players,
      rounds,
      operators,
      weapons,
    };
  }

  /** Hàng cho bảng tổng kết: sắp xếp kills giảm dần, hoà thì sát thương. */
  summaryRows() {
    const s = this.summary();
    return Object.values(s.players)
      .sort((a, b) => (b.kills - a.kills) || (b.damageDealt - a.damageDealt))
      .map(p => ({
        name: p.name, operator: p.operator,
        kills: p.kills, deaths: p.deaths, assists: p.assists, kd: p.kd,
        headshotPct: p.headshotPct, accuracy: p.accuracy,
        adr: p.adr, damage: p.damageDealt,
      }));
  }

  toJSON() { return this.summary(); }

  toJSONString(pretty = false) {
    return JSON.stringify(this.summary(), null, pretty ? 2 : 0);
  }

  // --------------------------------------------------------------------------
  // Bảng text cho màn hình kết thúc (game có thể dùng thẳng hoặc tự dựng DOM
  // từ summary()/summaryRows()).
  // --------------------------------------------------------------------------

  formatTable() {
    const rows = this.summaryRows();
    const pctFmt = v => (v === null ? '  — ' : String(Math.round(v * 100)).padStart(3) + '%');
    const nameFmt = n => (n.length > 18 ? n.slice(0, 17) + '…' : n).padEnd(18);
    const lines = [
      'NGƯỜI CHƠI         K  D  A   K/D   HS%  ACC   ADR',
      '─'.repeat(52),
    ];
    for (const r of rows) {
      lines.push(
        nameFmt(r.name) + ' ' +
        String(r.kills).padStart(2) + ' ' +
        String(r.deaths).padStart(2) + ' ' +
        String(r.assists).padStart(2) + ' ' +
        String(r.kd).padStart(5) + ' ' +
        pctFmt(r.headshotPct) + ' ' +
        pctFmt(r.accuracy) + ' ' +
        String(r.adr ?? '—').padStart(5),
      );
    }
    return lines.join('\n');
  }

  /** Một dòng tóm tắt mỗi round: kết quả, tỉ số, dòng K/D/A + chi tiêu của 'player'. */
  formatRounds(playerName = 'player') {
    const s = this.summary();
    return s.rounds.map(r => {
      const me = r.players[playerName];
      const eco = r.economy[playerName];
      const kda = me ? `${me.kills}/${me.deaths}/${me.assists}` : '—';
      const score = r.pScore !== null && r.eScore !== null ? ` · ${r.pScore}—${r.eScore}` : '';
      const result = r.win === null ? '—' : (r.win ? 'THẮNG' : 'THUA');
      const spend = eco ? ` · chi $${eco.spent}` : '';
      return `Round ${r.round}: ${result}${r.reason ? ' (' + r.reason + ')' : ''}${score} · Bạn ${kda}${spend}`;
    }).join('\n');
  }
}

export default StatsTracker;
