/* ============================================================================
 * Neon Divide — crosshair-customizer.js  (tuỳ biến tâm ngắm, KHÔNG sửa game)
 * ProjectG dev-loop/modules
 *
 * Cấu trúc crosshair THẬT của game (repo-staging/index.html, khớp dev-v34):
 *   <div id="crosshair">
 *     <div class="ch-line" id="ch-t"></div><div class="ch-line" id="ch-b"></div>
 *     <div class="ch-line" id="ch-l"></div><div class="ch-line" id="ch-r"></div>
 *   </div>
 *   - Vị trí 4 vạch tính từ biến CSS `--sp` (khoảng hở tâm, px) mà game ghi
 *     MỖI FRAME trong refreshHUD():
 *       sp = clamp(6 + recoilPx + movePx, 6, 40)   // mechanics/01 §7.5
 *       $('crosshair').style.setProperty('--sp', sp + 'px')
 *   - Mặc định cứng trong CSS game: vạch dài 10px, dày 2px; chấm tâm là
 *     `#crosshair::after` 3px màu #a9ffdf; vạch gradient #a9ffdf → #4dffb0.
 *
 * Module này:
 *   1) validate/sanitize cấu hình (màu, dài, dày, hở cộng thêm, chấm tâm,
 *      viền, độ trong suốt, tâm động theo spread) + preset màu thường và
 *      preset mù màu Okabe–Ito.
 *   2) toCSS(cfg)  — xuất stylesheet GHI ĐÈ các rule crosshair của game bằng
 *      biến --ch-* (đọc tiếp var(--sp) của game nên bloom/recoil vẫn chạy,
 *      kể cả khi game không sửa một dòng JS nào).
 *   3) applyTo(el, cfg) / injectCSS(cfg) — áp cấu hình vào #crosshair thật.
 *   4) gapForSpread() + createSpreadDriver() — hook tâm động: đọc hệ số tản
 *      hiện tại của game (chính là giá trị sp game tự tính) và scale/cố định
 *      lại theo cấu hình khi cần can thiệp sâu hơn CSS thuần.
 *   5) drawPreview(ctx, ...) — vẽ xem trước trực tiếp lên <canvas>.
 *   6) Lưu localStorage ở key RIÊNG 'neondivide-crosshair' — KHÔNG giẫm
 *      'neondivide-settings' {sens, fov} của game hay 'neondivide-settings-plus'.
 *   7) encodeConfig/decodeConfig — mã chia sẻ cấu hình dạng chuỗi.
 *
 * Thuần ESM, không chạm DOM/localStorage ở top-level (chỉ khi gọi API),
 * import được cả trong trình duyệt lẫn Node (để test).
 * ==========================================================================*/

export const CROSSHAIR_VERSION = 1;
export const STORAGE_KEY = 'neondivide-crosshair';
export const SHARE_PREFIX = 'NDCH1.';

/* ============================================================================
 * 1) PRESET MÀU
 * - Preset thường: gồm màu mặc định của game + các màu FPS kinh điển.
 * - Preset mù màu: bảng Okabe–Ito (8 màu phân biệt được với cả 3 dạng mù
 *   màu phổ biến) — dùng nguyên hex chuẩn của bảng.
 * `color` là đầu gradient (sáng), `color2` là cuối gradient (đậm/phát sáng).
 * Để đơn sắc: đặt color === color2 qua preset hoặc cấu hình tay.
 * ==========================================================================*/
export const COLOR_PRESETS = Object.freeze({
  // Mặc định đúng diện mạo game hiện tại
  neon:      { label: 'Neon Divide (mặc định game)', color: '#a9ffdf', color2: '#4dffb0' },
  classic:   { label: 'Xanh lá kinh điển',           color: '#00ff00', color2: '#00ff00' },
  cyan:      { label: 'Cyan',                        color: '#00ffff', color2: '#00e5ff' },
  red:       { label: 'Đỏ',                          color: '#ff3b30', color2: '#ff3b30' },
  white:     { label: 'Trắng',                       color: '#ffffff', color2: '#ffffff' },
  pink:      { label: 'Hồng',                        color: '#ff7ad9', color2: '#ff4fc3' },
  // --- Okabe–Ito (thân thiện mù màu) ---
  oi_orange:    { label: 'Okabe–Ito Cam',        color: '#e69f00', color2: '#e69f00' },
  oi_sky:       { label: 'Okabe–Ito Xanh trời',  color: '#56b4e9', color2: '#56b4e9' },
  oi_green:     { label: 'Okabe–Ito Lục lam',    color: '#009e73', color2: '#009e73' },
  oi_yellow:    { label: 'Okabe–Ito Vàng',       color: '#f0e442', color2: '#f0e442' },
  oi_blue:      { label: 'Okabe–Ito Dương',      color: '#0072b2', color2: '#0072b2' },
  oi_vermillion:{ label: 'Okabe–Ito Đỏ son',     color: '#d55e00', color2: '#d55e00' },
  oi_purple:    { label: 'Okabe–Ito Tím đỏ',     color: '#cc79a7', color2: '#cc79a7' },
  oi_black:     { label: 'Okabe–Ito Đen',        color: '#000000', color2: '#000000' },
});

/* ============================================================================
 * 2) CẤU HÌNH MẶC ĐỊNH + GIỚI HẠN
 * gap ở đây là khoảng hở CỘNG THÊM lên trên --sp động của game (game đã tự
 * cho 6–40px theo recoil/di chuyển) — để 0 là giữ nguyên cảm giác gốc.
 * Đơn vị: px (CSS), alpha/spreadScale là số thực.
 * ==========================================================================*/
export const LIMITS = Object.freeze({
  length:       { min: 1,  max: 40,  def: 10 },   // dài mỗi vạch
  thickness:    { min: 1,  max: 12,  def: 2 },    // dày mỗi vạch
  gap:          { min: 0,  max: 40,  def: 0 },    // hở cộng thêm lên --sp
  opacity:      { min: 0.1, max: 1,  def: 1 },    // độ trong suốt của vạch + chấm
  dotSize:      { min: 0,  max: 10,  def: 3 },    // 0 = tắt chấm tâm
  outlineWidth: { min: 0,  max: 4,   def: 0 },    // 0 = không viền
  spreadScale:  { min: 0,  max: 2,   def: 1 },    // hệ số nhân độ nở tâm động
  fixedSpread:  { min: 0,  max: 40,  def: 10 },   // --sp cố định khi dynamic=false
});

export const DEFAULT_CONFIG = Object.freeze({
  preset: 'neon',
  color: '#a9ffdf',        // đầu gradient / màu chấm tâm
  color2: '#4dffb0',       // cuối gradient
  length: 10,
  thickness: 2,
  gap: 0,
  opacity: 1,
  dot: true,
  dotSize: 3,
  outlineWidth: 0,
  outlineColor: '#000000',
  dynamic: true,           // tâm nở theo spread của game
  spreadScale: 1,
  fixedSpread: 10,
});

/* ============================================================================
 * 3) VALIDATE / SANITIZE
 * validate(input) -> { ok, errors: [...], value }
 *   - Số ngoài khoảng: CLAMP về biên + ghi lỗi (không văng).
 *   - Màu sai định dạng: rơi về mặc định + ghi lỗi.
 *   - Key lạ: bỏ qua. Trường thiếu: lấy mặc định.
 * `ok` = true khi value dùng được (kể cả đã clamp); ok=false chỉ khi input
 * không phải object.
 * ==========================================================================*/
const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function normalizeHex(v) {
  if (typeof v !== 'string' || !HEX_RE.test(v.trim())) return null;
  let h = v.trim().slice(1).toLowerCase();
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  return '#' + h;
}

function clampNum(errors, input, key) {
  const lim = LIMITS[key];
  const raw = input[key];
  if (raw === undefined || raw === null) return lim.def;
  const n = Number(raw);
  if (!Number.isFinite(n)) { errors.push(key + ': không phải số, dùng mặc định ' + lim.def); return lim.def; }
  const c = Math.min(lim.max, Math.max(lim.min, n));
  if (c !== n) errors.push(key + ': ' + n + ' ngoài khoảng [' + lim.min + '–' + lim.max + '], đã kẹp về ' + c);
  return c;
}

function colorField(errors, input, key, def) {
  const raw = input[key];
  if (raw === undefined || raw === null) return def;
  const h = normalizeHex(raw);
  if (!h) { errors.push(key + ': màu không hợp lệ ("' + raw + '"), dùng ' + def); return def; }
  return h;
}

export function validate(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, errors: ['cấu hình phải là object'], value: { ...DEFAULT_CONFIG } };
  }
  const errors = [];
  const value = {};
  // preset: nếu preset hợp lệ và người dùng KHÔNG truyền color/color2 riêng
  // thì lấy màu từ preset; truyền tay luôn thắng.
  const presetName = typeof input.preset === 'string' && COLOR_PRESETS[input.preset]
    ? input.preset : 'neon';
  if (input.preset !== undefined && presetName !== input.preset) {
    errors.push('preset: "' + input.preset + '" không tồn tại, dùng "neon"');
  }
  value.preset = presetName;
  const pc = COLOR_PRESETS[presetName];
  value.color  = colorField(errors, input, 'color',  pc.color);
  value.color2 = colorField(errors, input, 'color2', pc.color2);
  for (const k of Object.keys(LIMITS)) value[k] = clampNum(errors, input, k);
  value.outlineColor = colorField(errors, input, 'outlineColor', DEFAULT_CONFIG.outlineColor);
  value.dot = input.dot === undefined ? DEFAULT_CONFIG.dot : !!input.dot;
  value.dynamic = input.dynamic === undefined ? DEFAULT_CONFIG.dynamic : !!input.dynamic;
  if (!value.dot) value.dotSize = 0; // tắt chấm thì kích thước vô nghĩa — ép 0 cho CSS nhất quán
  return { ok: true, errors, value };
}

/** Áp một preset màu vào cấu hình (giữ nguyên thông số hình học). */
export function withPreset(cfg, presetName) {
  const base = validate(cfg || {}).value;
  if (!COLOR_PRESETS[presetName]) return base;
  return { ...base, preset: presetName, color: COLOR_PRESETS[presetName].color, color2: COLOR_PRESETS[presetName].color2 };
}

/* ============================================================================
 * 4) TÂM ĐỘNG THEO SPREAD (hook đọc hệ số tản hiện tại của game)
 * Game tự tính sp (px) mỗi frame: clamp(6 + recoilPx + movePx, 6, 40) —
 * gồm recoilIndex/p9Penalty theo recoilType + phạt tốc độ/air (mechanics/05).
 * Module KHÔNG tính lại spread (tránh lệch nguồn sự thật); nó chỉ biến đổi:
 *   dynamic=true  -> gapCuối = gap + spGame * spreadScale
 *   dynamic=false -> gapCuối = gap + fixedSpread        (tâm tĩnh)
 * ==========================================================================*/
export function gapForSpread(spreadPx, cfg) {
  const c = validate(cfg || {}).value;
  const sp = Number.isFinite(Number(spreadPx)) ? Number(spreadPx) : 0;
  const inner = c.dynamic ? sp * c.spreadScale : c.fixedSpread;
  return Math.round((c.gap + inner) * 100) / 100;
}

/**
 * Driver rAF (chỉ trình duyệt): đọc spread qua getter phía game rồi ghi
 * --sp đã biến đổi vào #crosshair. Dùng KHI game muốn spreadScale/tâm tĩnh;
 * nếu chỉ cần gap cộng thêm thì CSS thuần (mục 5) là đủ, khỏi cần driver.
 *   const drv = createSpreadDriver(el, () => currentGameSpreadPx, cfg);
 *   drv.start(); ... drv.stop(); drv.step(); // step: chạy tay 1 nhịp (test)
 */
export function createSpreadDriver(el, getSpread, cfg) {
  let current = validate(cfg || {}).value;
  let rafId = null;
  const step = () => {
    if (!el || !el.style) return null;
    const g = gapForSpread(typeof getSpread === 'function' ? getSpread() : 0, current);
    el.style.setProperty('--sp', g + 'px');
    return g;
  };
  return {
    step,
    start() {
      if (rafId !== null || typeof requestAnimationFrame !== 'function') { step(); return; }
      const loop = () => { step(); rafId = requestAnimationFrame(loop); };
      rafId = requestAnimationFrame(loop);
    },
    stop() {
      if (rafId !== null && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(rafId);
      rafId = null;
    },
    setConfig(next) { current = validate(next || {}).value; },
    getConfig() { return { ...current }; },
  };
}

/* ============================================================================
 * 5) XUẤT CSS — ghi đè rule crosshair của game bằng biến --ch-*
 * Thứ tự nạp: stylesheet này phải đứng SAU <style> của game (cùng/trên
 * specificity + thắng theo thứ tự). Mọi vị trí vạch đều tính từ
 * calc(var(--sp) + var(--ch-gap)) nên bloom của game giữ nguyên tác dụng.
 * Viền (outline) làm bằng box-shadow spread 0 blur — bám đúng hình chữ nhật
 * của vạch; kèm glow mờ theo màu chính như bản gốc.
 * ==========================================================================*/
export function cssVars(cfg) {
  const c = validate(cfg || {}).value;
  return {
    '--ch-c1': c.color,
    '--ch-c2': c.color2,
    '--ch-len': c.length + 'px',
    '--ch-th': c.thickness + 'px',
    '--ch-gap': c.gap + 'px',
    '--ch-a': String(c.opacity),
    '--ch-dot': (c.dot ? c.dotSize : 0) + 'px',
    '--ch-ow': c.outlineWidth + 'px',
    '--ch-oc': c.outlineColor,
  };
}

export function toCSS(cfg) {
  const vars = cssVars(cfg);
  const decl = Object.entries(vars).map(([k, v]) => '  ' + k + ': ' + v + ';').join('\n');
  return [
    '/* Neon Divide — crosshair custom (crosshair-customizer.js) — nạp SAU style game */',
    '#crosshair {',
    decl,
    '  filter: drop-shadow(0 0 3px var(--ch-c2));',
    '}',
    '#crosshair::after {',
    '  width: var(--ch-dot); height: var(--ch-dot);',
    '  left: calc(var(--ch-dot) / -2); top: calc(var(--ch-dot) / -2);',
    '  background: var(--ch-c1); opacity: var(--ch-a); border-radius: 50%;',
    '  box-shadow: 0 0 0 var(--ch-ow) var(--ch-oc);',
    '}',
    '#crosshair .ch-line {',
    '  background: linear-gradient(var(--ch-c1), var(--ch-c2));',
    '  opacity: var(--ch-a); border-radius: 2px;',
    '  box-shadow: 0 0 0 var(--ch-ow) var(--ch-oc), 0 0 5px var(--ch-c2);',
    '}',
    '#crosshair #ch-t, #crosshair #ch-b { width: var(--ch-th); height: var(--ch-len); left: calc(var(--ch-th) / -2); }',
    '#crosshair #ch-t { top: calc(-1 * (var(--sp, 10px) + var(--ch-gap)) - var(--ch-len)); }',
    '#crosshair #ch-b { top: calc(var(--sp, 10px) + var(--ch-gap)); }',
    '#crosshair #ch-l, #crosshair #ch-r { width: var(--ch-len); height: var(--ch-th); top: calc(var(--ch-th) / -2); background: linear-gradient(90deg, var(--ch-c1), var(--ch-c2)); }',
    '#crosshair #ch-l { left: calc(-1 * (var(--sp, 10px) + var(--ch-gap)) - var(--ch-len)); }',
    '#crosshair #ch-r { left: calc(var(--sp, 10px) + var(--ch-gap)); }',
  ].join('\n');
}

/** Áp cấu hình vào phần tử #crosshair thật (đặt biến --ch-* inline). */
export function applyTo(el, cfg) {
  if (!el || !el.style) return false;
  const c = validate(cfg || {}).value;
  for (const [k, v] of Object.entries(cssVars(c))) el.style.setProperty(k, v);
  el.dataset.chPreset = c.preset;
  el.dataset.chDynamic = c.dynamic ? '1' : '0';
  return true;
}

/** Chèn/cập nhật <style id="neondivide-crosshair-css"> trong document. */
export function injectCSS(cfg, doc) {
  const d = doc || (typeof document !== 'undefined' ? document : null);
  if (!d || !d.head) return null;
  let tag = d.getElementById ? d.getElementById('neondivide-crosshair-css') : null;
  if (!tag) {
    tag = d.createElement('style');
    tag.id = 'neondivide-crosshair-css';
    d.head.appendChild(tag); // đứng sau style game trong <head> -> thắng cascade
  }
  tag.textContent = toCSS(cfg);
  return tag;
}

/* ============================================================================
 * 6) XEM TRƯỚC TRỰC TIẾP — vẽ lên canvas 2D, không cần DOM game
 * drawPreview(ctx, size, cfg, spreadPx): vẽ nền trong suốt, tâm ở giữa,
 * spreadPx = độ nở mô phỏng (truyền giá trị game 6–40 để xem tâm động).
 * ==========================================================================*/
export function drawPreview(ctx, size, cfg, spreadPx) {
  if (!ctx || typeof ctx.fillRect !== 'function') return false;
  const c = validate(cfg || {}).value;
  const s = Number(size) > 0 ? Number(size) : 120;
  const ctr = s / 2;
  const gap = gapForSpread(spreadPx === undefined ? 10 : spreadPx, c);
  ctx.clearRect(0, 0, s, s);
  ctx.globalAlpha = c.opacity;
  const line = (x, y, w, h, vertical) => {
    if (c.outlineWidth > 0) {
      ctx.fillStyle = c.outlineColor;
      ctx.fillRect(x - c.outlineWidth, y - c.outlineWidth, w + c.outlineWidth * 2, h + c.outlineWidth * 2);
    }
    if (typeof ctx.createLinearGradient === 'function') {
      const g = vertical ? ctx.createLinearGradient(0, y, 0, y + h) : ctx.createLinearGradient(x, 0, x + w, 0);
      g.addColorStop(0, c.color); g.addColorStop(1, c.color2);
      ctx.fillStyle = g;
    } else ctx.fillStyle = c.color2;
    ctx.fillRect(x, y, w, h);
  };
  const th = c.thickness, len = c.length, half = th / 2;
  line(ctr - half, ctr - gap - len, th, len, true);   // trên
  line(ctr - half, ctr + gap, th, len, true);         // dưới
  line(ctr - gap - len, ctr - half, len, th, false);  // trái
  line(ctr + gap, ctr - half, len, th, false);        // phải
  if (c.dot && c.dotSize > 0) {
    const d = c.dotSize;
    if (c.outlineWidth > 0) {
      ctx.fillStyle = c.outlineColor;
      ctx.fillRect(ctr - d / 2 - c.outlineWidth, ctr - d / 2 - c.outlineWidth, d + c.outlineWidth * 2, d + c.outlineWidth * 2);
    }
    ctx.fillStyle = c.color;
    ctx.fillRect(ctr - d / 2, ctr - d / 2, d, d);
  }
  ctx.globalAlpha = 1;
  return true;
}

/* ============================================================================
 * 7) LƯU / TẢI — localStorage key riêng, nhận storage tiêm vào (để test)
 * ==========================================================================*/
function defaultStorage() {
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch (e) { return null; }
}

export function save(cfg, storage) {
  const st = storage || defaultStorage();
  if (!st) return false;
  const { value } = validate(cfg || {});
  try { st.setItem(STORAGE_KEY, JSON.stringify({ v: CROSSHAIR_VERSION, cfg: value })); return true; }
  catch (e) { return false; }
}

/** Trả cấu hình đã validate; dữ liệu hỏng/thiếu -> mặc định. */
export function load(storage) {
  const st = storage || defaultStorage();
  if (!st) return { ...DEFAULT_CONFIG };
  try {
    const raw = st.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw);
    return validate(parsed && parsed.cfg ? parsed.cfg : {}).value;
  } catch (e) { return { ...DEFAULT_CONFIG }; }
}

export function reset(storage) {
  const st = storage || defaultStorage();
  if (st) { try { st.removeItem(STORAGE_KEY); } catch (e) { /* bỏ qua */ } }
  return { ...DEFAULT_CONFIG };
}

/* ============================================================================
 * 8) MÃ CHIA SẺ CẤU HÌNH — 'NDCH1.' + base64url(JSON gọn)
 * ==========================================================================*/
function b64urlEncode(str) {
  if (typeof Buffer !== 'undefined') return Buffer.from(str, 'utf8').toString('base64url');
  return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(str) {
  if (typeof Buffer !== 'undefined') return Buffer.from(str, 'base64url').toString('utf8');
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  return decodeURIComponent(escape(atob(b64)));
}

export function encodeConfig(cfg) {
  const { value } = validate(cfg || {});
  return SHARE_PREFIX + b64urlEncode(JSON.stringify(value));
}

/** Giải mã; sai tiền tố/hỏng -> null. */
export function decodeConfig(code) {
  if (typeof code !== 'string' || !code.startsWith(SHARE_PREFIX)) return null;
  try { return validate(JSON.parse(b64urlDecode(code.slice(SHARE_PREFIX.length)))).value; }
  catch (e) { return null; }
}
