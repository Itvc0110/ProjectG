"use strict";
// lobby-client.js — Client trình duyệt cho lobby ProjectG (W6-09 / G8).
//
// Nối: màn hình chính → phòng lobby → countdown 3 s → phòng game → hết trận
// về lobby. Đây là MODULE ES RIÊNG, load tách khỏi game single-file
// (W6-PLAN §3 S7): game chỉ cần `import { createLobbyClient, mountLobbyUI }`
// rồi gọi `client.onEnterGame(...)` để bàn giao phòng game cho NetAdapter
// (CLIENT-ADAPTER.md) — module này KHÔNG chạy sim, KHÔNG render game.
//
// ── Quyết định kỹ thuật (đọc trước khi sửa file này) ─────────────────────
// D-9 (SDK lấy ở đâu): mặc định load `@colyseus/sdk@0.18.9` qua CDN ESM
//   (jsdelivr, fallback unpkg). Lý do: game là single-file offline, lobby là
//   module tách rời nên không bundle SDK vào game. Nếu triển khai offline
//   hoàn toàn, truyền `sdkUrl` trỏ tới bản bundle local (vd.
//   `/vendor/colyseus-sdk.mjs`, copy từ
//   `dev-loop/multiplayer/node_modules/@colyseus/sdk/build/index.mjs`) hoặc
//   inject trực tiếp `Client` qua option `Client` (cách smoke test Node làm).
//   KHÔNG tự viết WebSocket client — Colyseus handshake/state/input chỉ đi
//   qua SDK chính thức.
// D-7 (giữ hay rời kết nối lobby trong trận) — ĐỌC KỸ, có hai phương án:
//   * Mặc định `lobbyDuringMatch: "keep"` = GIỮ KẾT NỐI LOBBY MỞ SUỐT TRẬN.
//     Đây mới là nội dung thật của D-7 trong W6-PLAN §3.1 ("Client giữ cả hai
//     kết nối", "LobbyRoom là service room nên giữ kết nối rẻ") và đã được
//     kiểm chứng bằng smoke 17/17 (check 13: kết nối lobby vẫn mở lúc chơi).
//     Lợi: slot/đội/operator/vương miện host được giữ nguyên; `game_finished`
//     về qua kênh lobby ngay khi trận xong; hết trận về lobby không cần join
//     lại; `finishGame` + reset ready của server vẫn thấy đủ thành viên.
//   * Phương án `"leave"` = RỜI LOBBY KHI VÀO GAME, JOIN LẠI SAU. Đây là
//     phương án dự phòng nêu trong W6-PLAN §5.2 R5 ("nếu SDK gây khó"), KHÔNG
//     phải nội dung D-7 — bản brief đợt W7 ghi nhầm D-7 thành phương án này,
//     nên file này hiện thực CẢ HAI và mặc định theo D-7 đã kiểm chứng.
//     Hậu quả của "leave" (ghi rõ để khỏi bất ngờ): `leave_room` có chủ ý
//     XOÁ SLOT khỏi phòng lobby ngay (LobbyManager.leaveRoom); vương miện
//     host chuyển cho người vào sớm nhất còn lại; khi hết trận client join
//     lại bằng mã phòng thì nhận SLOT MỚI (playerId mới, ready=false, chưa
//     chọn đội/operator — phải chọn lại); `game_finished` KHÔNG về được qua
//     lobby (đã rời) nên client phát hiện hết trận qua state phòng game
//     (`phase === "matchEnd"`) hoặc khi phòng game bị ngắt. Chỉ dùng "leave"
//     khi môi trường cấm hai WebSocket song song.
// D-2 (reconnect): transport reconnect = 60 s ở cả hai room (SDK tự thử lại
//   khi rớt bất ngờ qua `room.onDrop`/`room.onReconnect`; `client.reconnect(
//   reconnectionToken)` là đường thủ công). Token rejoin trận = 120 s theo
//   SCHEMA §7 — endpoint mint token rejoin giữa trận ĐÃ CÓ từ W8
//   (`LobbyManager.requestRejoinToken`, qua message `request_rejoin_token`
//   trên kết nối lobby đang mở, W9 đã nối transport + client): khi token
//   gốc sắp hết hạn (còn < 30 s) client tự xin token mới qua
//   `requestRejoinToken()`; `rejoinGame()` gặp token hết hạn thì xin token
//   mới rồi thử lại 1 lần thay vì báo `rejoin-token-expired` ngay — chỉ báo
//   event đó khi mint cũng thất bại (vd. đã rời lobby ở leave-mode, hoặc
//   trận đã kết thúc). Token mới chỉ giữ TRONG BỘ NHỚ như token gốc.
// D-1/D-4 (identity): token HMAC mang playerId/team/operator; client KHÔNG
//   bao giờ tự suy ra team/spawn/carrier — đọc từ `game_starting.assignments`
//   và state phòng game sau khi join. Spawn T z=+24 / CT z=-24 và carrier là
//   người T đầu tiên do SERVER quyết (smoke đã kiểm chứng).
// D-6 (server-driven start): client KHÔNG BAO GIỜ gửi `startMatch`. Server tự
//   start khi đủ người hoặc hết countdown. Gửi `startMatch` từ client đã bị
//   khoá ở server (chỉ host lobby, có log) — đừng gọi lại.
// D-8 (thiếu người): nếu countdown hết mà < 2 người join game, bridge huỷ
//   trận, lobby nhận `game_aborted` và về phase `lobby` — client ở lại màn
//   hình lobby, host bấm bắt đầu lại.
//
// Bảo mật phía client (alpha nội bộ): token chỉ giữ TRONG BỘ NHỚ, không ghi
// localStorage/sessionStorage (token hết hạn sau 120 s; lưu đĩa chỉ tạo cơ
// hội replay token cũ). Tên hiển thị lưu localStorage như LOBBY.md §1.
// Server mới là nguồn sự thật: mọi `room_state`/`room_patch` đều render lại
// từ snapshot server gửi; client không tự quyết "trận đã bắt đầu".
//
// Cách dùng tối thiểu (trong trang game):
//   import { createLobbyClient, mountLobbyUI } from "./lobby-client.js";
//   const lobby = createLobbyClient({ endpoint: "ws://localhost:2567" });
//   mountLobbyUI(lobby, document.getElementById("lobby-root"));
//   lobby.on("enter-game", ({ gameRoom }) => netAdapter.attachGameRoom(gameRoom));
//   lobby.on("match-finished", ({ scoreAtk, scoreDef }) => showResults(scoreAtk, scoreDef));
// Headless (Node/smoke): createLobbyClient({ endpoint, Client }) rồi gọi các
// method — không cần DOM, không gọi mountLobbyUI().
// ─────────────────────────────────────────────────────────────────────────

// --- Hằng số (mirror src/lobby/constants.js — client chỉ đọc, không sửa) ---
export const LOBBY_CLIENT_VERSION = "w9-rejoin-1";
export const TOKEN_TTL_MS = 120_000; // D-1: join token hết hạn sau 120 s
export const RECONNECT_WINDOW_MS = 60_000; // D-2: cửa sổ reconnect 60 s
export const COUNTDOWN_SECONDS = 3;
export const POST_GAME_MS = 15_000;
export const MAX_PLAYERS = 10;
export const MIN_NAME_LENGTH = 2;
export const MAX_NAME_LENGTH = 16;

export const OPERATORS = [
  "flare", "prism", "bastion", "whisper",
  "tether", "null", "aegis", "drift",
];
export const OPERATOR_NAMES = {
  flare: "FLARE", prism: "PRISM", bastion: "BASTION", whisper: "WHISPER",
  tether: "TETHER", null: "NULL", aegis: "AEGIS", drift: "DRIFT",
};
export const MAPS = [
  { id: "neon-divide", name: "Neon Divide", sites: 2, wip: false },
  { id: "foundry", name: "Foundry", sites: 2, wip: true },
  { id: "harbor", name: "Harbor", sites: 2, wip: true },
];
export const DEFAULT_MAP_ID = "neon-divide";
export const TEAMS = ["attack", "defense"];
export const TEAM_NAMES = { attack: "Tấn công", defense: "Phòng thủ", auto: "Tự động" };

export const SDK_VERSION = "0.18.9";
export const SDK_CDN_URLS = [
  `https://cdn.jsdelivr.net/npm/@colyseus/sdk@${SDK_VERSION}/build/index.mjs`,
  `https://unpkg.com/@colyseus/sdk@${SDK_VERSION}/build/index.mjs`,
];

export const ERROR_MESSAGES = {
  ROOM_NOT_FOUND: "Phòng không tồn tại hoặc đã đóng.",
  ROOM_FULL: "Phòng đã đầy (tối đa 10 người).",
  GAME_ALREADY_STARTED: "Trận đã bắt đầu.",
  NOT_HOST: "Chỉ host mới làm được việc này.",
  NOT_ALL_READY: "Chưa đủ người chơi Sẵn sàng.",
  NAME_INVALID: "Tên hiển thị phải có 2–16 ký tự.",
  OPERATOR_REQUIRED: "Chọn operator trước khi Sẵn sàng.",
  OPERATOR_INVALID: "Operator không tồn tại.",
  MAP_NOT_AVAILABLE: "Map không khả dụng.",
  TEAM_INVALID: "Đội không hợp lệ.",
  KICKED: "Bạn đã bị host mời ra khỏi phòng.",
  ROOM_EXPIRED: "Phòng đã hết hạn (30 phút không bắt đầu).",
  START_ABORTED: "Không tạo được phòng game, thử bắt đầu lại.",
};

/** Lỗi client ném ra khi thao tác lobby/game thất bại (kèm mã server nếu có). */
export class LobbyError extends Error {
  constructor(code, message) {
    super(message || ERROR_MESSAGES[code] || code || "Lỗi lobby.");
    this.name = "LobbyError";
    this.code = code || "UNKNOWN";
  }
}

function errorMessage(err) {
  if (!err) return "Lỗi không xác định.";
  if (err instanceof LobbyError) return err.message;
  const msg = String((err && err.message) || err);
  for (const [code, text] of Object.entries(ERROR_MESSAGES)) {
    if (msg.includes(code)) return text;
  }
  return msg;
}

/** Tên hiển thị: cắt khoảng trắng, server validate lại 2–16 ký tự. */
export function normalizeDisplayName(name) {
  return String(name || "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH);
}

/** Mã phòng: uppercase, bỏ khoảng trắng (LOBBY.md §3). */
export function normalizeRoomCode(code) {
  return String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

// --- Nạp SDK ---------------------------------------------------------------
async function loadSdkClient(options) {
  if (options.Client) return options.Client;
  const urls = options.sdkUrl ? [options.sdkUrl] : SDK_CDN_URLS;
  let lastErr = null;
  for (const url of urls) {
    try {
      const mod = await import(/* @vite-ignore */ url);
      if (mod && mod.Client) return mod.Client;
      throw new Error(`SDK ở ${url} không export Client`);
    } catch (err) {
      lastErr = err;
    }
  }
  throw new LobbyError(
    "SDK_LOAD_FAILED",
    `Không nạp được @colyseus/sdk ${SDK_VERSION} (CDN lỗi?). ` +
    `Truyền option Client hoặc sdkUrl trỏ tới bản bundle local. Chi tiết: ${lastErr && lastErr.message ? lastErr.message : lastErr}`
  );
}

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}
function storeGet(key) {
  try { return isBrowser() ? window.localStorage.getItem(key) : null; } catch { return null; }
}
function storeSet(key, value) {
  try { if (isBrowser()) window.localStorage.setItem(key, value); } catch { /* private mode: bỏ qua */ }
}

// --- Event emitter tối giản -------------------------------------------------
function createEmitter() {
  const handlers = new Map();
  return {
    on(event, cb) {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event).add(cb);
      return () => handlers.get(event).delete(cb);
    },
    emit(event, payload) {
      const set = handlers.get(event);
      if (!set) return;
      for (const cb of [...set]) {
        try { cb(payload); } catch (err) { console.error(`[lobby-client] handler ${event} lỗi:`, err); }
      }
    },
  };
}

// ===========================================================================
// createLobbyClient — máy trạng thái lobby ↔ game (headless, không cần DOM)
// ===========================================================================
//
// Luồng trạng thái:
//   idle → lobby (trong phòng) → countdown → in-game → post-game → lobby
//                                       ↘ (leave-mode: rời lobby ở đây,
//                                          join lại sau khi hết trận)
//
// Sự kiện emit (client.on(event, cb)):
//   "room-state"      { room }            — snapshot phòng mới (vào/reconnect/patch gộp)
//   "room-patch"      { patch }           — patch tăng dần từ server
//   "error"           { code, message }   — lỗi server (mã chuẩn LOBBY.md §7)
//   "countdown"       { secondsLeft, mapId, assignments, gameRoomId }
//   "enter-game"      { gameRoom, gameRoomId, token, assignment, assignments, mapId }
//   "game-state"      { phase, round, ... } — phase trận đổi (state phòng game)
//   "game-message"    { type, payload }   — event rời rạc từ phòng game
//   "game-left"       { reason }          — đã rời phòng game
//   "match-finished"  { scoreAtk, scoreDef, gameRoomId } — hết trận (game_finished
//                                          qua lobby, hoặc phase matchEnd khi ở leave-mode)
//   "lobby-reconnected" { room }          — reconnect lobby thành công trong 60 s
//   "lobby-reconnect-failed" { reason }   — hết 60 s, slot đã bị xoá
//   "game-reconnected" { sessionId, team, operatorId, hp } — reconnect game xong,
//                                          entity giữ nguyên (hp là số server đang có)
//   "game-reconnect-failed" { reason }    — hết 60 s, ghế đã mất
//   "rejoin-token-refreshed" { gameRoomId, expiresAt } — server vừa cấp
//                                          token rejoin mới qua message
//                                          `rejoin_token` (tự xin khi sắp
//                                          hết hạn, hoặc xin trong
//                                          `rejoinGame()`); token trong bộ
//                                          nhớ đã được thay bằng token mới.
//   "rejoin-token-expired" {}             — token gốc hết 120 s VÀ xin token
//                                          mới cũng thất bại (đã rời lobby ở
//                                          leave-mode, hoặc trận đã kết thúc)
//                                          → phải chờ trận sau.
//   "connection-lost" { which: "lobby"|"game" } — rớt 1 trong 2 kết nối
//   "left-lobby"      {}                  — đã rời phòng lobby (leave-mode / rời tay)
//
// Lưu ý về reconnect của SDK 0.18.9 (đã đọc typings build/Room.d.ts):
//   - Rớt bất ngờ: SDK TỰ thử reconnect (room.onDrop → room.onReconnect);
//     client này chỉ theo dõi + báo cáo, không tự mở socket thứ hai đè lên.
//   - `room.leave(false)` = đóng không đồng ý → server coi là rớt, auto-
//     reconnect vẫn chạy; `room.leave()` (mặc định) = rời có chủ ý, huỷ reconnect.
//   - Đường thủ công khi auto-reconnect bỏ cuộc: `client.reconnect(
//     room.reconnectionToken)` trong cửa sổ 60 s.
export function createLobbyClient(options = {}) {
  const endpoint = options.endpoint || "ws://localhost:2567";
  const lobbyDuringMatch = options.lobbyDuringMatch === "leave" ? "leave" : "keep"; // D-7: mặc định "keep"
  const autoJoinGame = options.autoJoinGame !== false; // nhận game_starting là join ngay
  const autoReconnect = options.autoReconnect !== false; // SDK tự reconnect khi rớt (tắt khi test reconnect thủ công)
  const emitter = createEmitter();

  const state = {
    phase: "idle", // idle | lobby | countdown | in-game | post-game
    displayName: options.displayName || storeGet("projectg.displayName") || "",
    room: null,           // snapshot room_state mới nhất (server là nguồn sự thật)
    code: null,
    gameRoomId: null,
    joinToken: null,      // CHỈ TRONG BỘ NHỚ — không ghi localStorage (xem header)
    tokenReceivedAt: 0,
    assignments: null,
    mapId: DEFAULT_MAP_ID,
    myAssignment: null,   // { playerId, team, operatorId, isHost } của mình
    myPlayerId: null,
    gamePhase: null,      // phase phòng game: waiting | buy | live | planted | roundEnd | matchEnd
    scores: null,
  };

  let ClientClass = options.Client || null;
  let sdkClient = null;
  let lobbyRoom = null;   // Room "lobby" (Colyseus)
  let gameRoom = null;    // Room "game" (Colyseus)
  let lastCode = null;    // mã phòng gần nhất (giữ lại cả khi state.code bị
                          // xoá bởi leaveRoom — để rejoinLobbyAfterMatch vẫn
                          // tìm được phòng; join sai mã vẫn bị server từ chối)
  let countdownTimer = null;
  let countdownLeft = 0;
  let inputTimer = null;
  let inputSeq = 0;
  let disposed = false;
  // Token reconnect giữ lại sau khi room onLeave (auto-reconnect của SDK đã
  // kiệt sức): reconnectLobby()/reconnectGame() dùng chúng để nối lại trong
  // cửa sổ 60 s. Rời có chủ ý (CloseCode.CONSENTED = 4000) thì xoá.
  let lastLobbyToken = null;
  let lastGameToken = null;
  let leavingLobbyConsented = false;
  let leavingGameConsented = false;
  // Mint token rejoin đang chờ phản hồi (chống xin trùng khi timer tự xin
  // và rejoinGame() xin cùng lúc) + timer tự xin khi token sắp hết hạn.
  let mintInFlight = false;
  let rejoinRefreshTimer = null;

  const log = (...a) => { if (options.debug) console.log("[lobby-client]", ...a); };

  // --- helpers -------------------------------------------------------------
  function mySlot() {
    if (!state.room || !lobbyRoom) return null;
    return state.room.players.find((p) => p.sessionId === lobbyRoom.sessionId) || null;
  }
  function myGamePlayer() {
    if (!gameRoom || !gameRoom.state || !gameRoom.state.players) return null;
    try { return gameRoom.state.players.get(gameRoom.sessionId) || null; }
    catch { return null; }
  }
  function applyPatch(patch) {
    if (!state.room || !patch || typeof patch !== "object") return;
    const room = state.room;
    switch (patch.type) {
      case "player_joined":
        if (patch.player && !room.players.some((p) => p.sessionId === patch.player.sessionId)) {
          room.players.push(patch.player);
        }
        break;
      case "player_left":
        room.players = room.players.filter((p) => p.sessionId !== patch.sessionId);
        break;
      case "player_updated":
        if (patch.player) {
          const i = room.players.findIndex((p) => p.sessionId === patch.player.sessionId);
          if (i >= 0) room.players[i] = patch.player; else room.players.push(patch.player);
        }
        break;
      case "map_changed":
        room.mapId = patch.mapId; state.mapId = patch.mapId;
        break;
      case "phase_changed":
        room.phase = patch.phase;
        break;
      case "host_changed":
        room.hostId = patch.hostId;
        for (const p of room.players) p.isHost = p.sessionId === patch.hostId;
        break;
      default:
        break;
    }
    emitter.emit("room-state", { room: snapshotRoom() });
  }
  function snapshotRoom() {
    return state.room ? JSON.parse(JSON.stringify(state.room)) : null;
  }
  function stopCountdown() {
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
  }

  // --- SDK -----------------------------------------------------------------
  async function ensureClient() {
    if (sdkClient) return sdkClient;
    if (!ClientClass) ClientClass = await loadSdkClient(options);
    sdkClient = new ClientClass(endpoint);
    return sdkClient;
  }

  // --- Lobby: vào / ra ------------------------------------------------------
  function attachLobbyRoom(room) {
    lobbyRoom = room;
    if (!autoReconnect && room.reconnection) room.reconnection.enabled = false;
    room.onMessage("room_state", (s) => {
      state.room = s;
      state.code = s.code;
      if (s.code) lastCode = s.code;
      state.mapId = s.mapId;
      state.phase = s.phase === "lobby" ? "lobby" : state.phase;
      const me = mySlot();
      state.myPlayerId = me ? me.playerId : state.myPlayerId;
      emitter.emit("room-state", { room: snapshotRoom() });
    });
    room.onMessage("room_patch", (patch) => {
      applyPatch(patch);
      emitter.emit("room-patch", { patch });
    });
    room.onMessage("game_starting", (payload) => { void onGameStarting(payload); });
    room.onMessage("rejoin_token", (payload) => {
      // Token rejoin mới do server mint RIÊNG cho mình (W8/W9): thay token
      // trong bộ nhớ ngay, kể cả khi chưa rớt mạng — lần rejoin sau (nếu có)
      // sẽ dùng token mới này. CHỈ TRONG BỘ NHỚ, không ghi đĩa (như token gốc).
      if (payload && payload.joinToken) {
        state.joinToken = payload.joinToken;
        state.tokenReceivedAt = Date.now();
        emitter.emit("rejoin-token-refreshed", {
          gameRoomId: payload.gameRoomId || state.gameRoomId,
          expiresAt: payload.expiresAt || null,
        });
        log("nhận rejoin_token mới, đã thay token trong bộ nhớ");
      }
    });
    room.onMessage("game_aborted", (payload) => {
      stopCountdown();
      state.phase = "lobby";
      state.gameRoomId = null; state.joinToken = null; state.assignments = null;
      emitter.emit("room-state", { room: snapshotRoom() });
      emitter.emit("error", { code: "START_ABORTED", message: (payload && payload.reason) || ERROR_MESSAGES.START_ABORTED });
    });
    room.onMessage("game_finished", (payload) => {
      onMatchFinished(payload || {});
    });
    room.onMessage("room_expired", () => {
      state.phase = "idle"; state.room = null; state.code = null;
      emitter.emit("error", { code: "ROOM_EXPIRED", message: ERROR_MESSAGES.ROOM_EXPIRED });
    });
    room.onMessage("error", (e) => {
      emitter.emit("error", { code: (e && e.code) || "UNKNOWN", message: (e && e.message) || errorMessage(e) });
    });
    room.onDrop(() => {
      emitter.emit("connection-lost", { which: "lobby" });
      log("lobby connection dropped — SDK auto-reconnect đang chạy");
    });
    room.onReconnect(() => {
      // SDK nối lại cùng sessionId: server gửi lại room_state đầy đủ
      // (LobbyManager.reconnect) — slot/đội/operator được giữ nguyên.
      lastLobbyToken = null;
      emitter.emit("lobby-reconnected", { room: snapshotRoom() });
      log("lobby reconnected, session giữ nguyên");
    });
    room.onLeave((code) => {
      // Mọi đường rời đều qua đây. Phân biệt:
      // - Rời có chủ ý: code 4000 (CloseCode.CONSENTED) hoặc cờ
      //   leavingLobbyConsented (leave-mode khi vào game / rời tay) →
      //   không reconnect, không báo lỗi.
      // - Auto-reconnect kiệt sức (rớt mạng quá 60 s): giữ lại mã phòng +
      //   reconnectionToken để UI cho nối lại thủ công (reconnectLobby) hoặc
      //   vào lại bằng mã (slot cũ đã bị server xoá sau 60 s).
      if (disposed) return;
      const consented = code === 4000 || leavingLobbyConsented;
      leavingLobbyConsented = false;
      const wasInGame = state.phase === "in-game" || state.phase === "countdown" || state.phase === "post-game";
      lastLobbyToken = consented ? null : (room.reconnectionToken || null);
      lobbyRoom = null;
      if (consented) {
        if (!wasInGame) {
          state.phase = "idle"; state.room = null; state.code = null;
        }
        emitter.emit("left-lobby", {});
      } else {
        emitter.emit("lobby-reconnect-failed", {
          reason: "Mất kết nối lobby quá 60 s, slot đã bị xoá.",
          code: state.code, // giữ mã để UI cho "Vào lại phòng" (slot mới)
        });
      }
      log("lobby room left, code=", code, "consented=", consented);
    });
    room.onError((code, message) => {
      emitter.emit("error", { code: String(code), message: message || "Lỗi kết nối lobby." });
    });
  }

  async function createRoom(displayName) {
    const name = normalizeDisplayName(displayName || state.displayName);
    if (name.length < MIN_NAME_LENGTH) throw new LobbyError("NAME_INVALID", ERROR_MESSAGES.NAME_INVALID);
    state.displayName = name;
    storeSet("projectg.displayName", name);
    await leaveCurrentLobbyRoom();
    state.room = null; state.code = null; state.myPlayerId = null; // tránh waitFor ăn snapshot cũ
    const client = await ensureClient();
    // Fail-fast: server từ chối create/join bằng message "error" (vd.
    // ROOM_NOT_FOUND) — room join service vẫn thành công nên joinOrCreate
    // không throw; phải bắt message lỗi thay vì chờ room_state tới timeout.
    let joinErr = null;
    const offErr = emitter.on("error", (e) => { if (!joinErr) joinErr = e; });
    try {
      const room = await client.joinOrCreate("lobby", { create: 1, name });
      attachLobbyRoom(room);
      // room_state về async qua onMessage; chờ snapshot đầu tiên.
      await waitFor(() => (state.room && state.room.code) || joinErr, 8000, "room_state sau create_room");
      if (joinErr) throw new LobbyError(joinErr.code || "JOIN_FAILED", joinErr.message || "Không tạo được phòng.");
    } finally {
      offErr();
    }
    storeSet("projectg.lastRoomCode", state.code);
    return snapshotRoom();
  }

  async function joinRoom(code, displayName) {
    const cleanCode = normalizeRoomCode(code);
    if (cleanCode.length !== 6) throw new LobbyError("ROOM_NOT_FOUND", "Mã phòng phải có 6 ký tự.");
    const name = normalizeDisplayName(displayName || state.displayName);
    if (name.length < MIN_NAME_LENGTH) throw new LobbyError("NAME_INVALID", ERROR_MESSAGES.NAME_INVALID);
    state.displayName = name;
    storeSet("projectg.displayName", name);
    await leaveCurrentLobbyRoom();
    state.room = null; state.code = null; state.myPlayerId = null; // tránh waitFor ăn snapshot cũ
    const client = await ensureClient();
    // Fail-fast khi server từ chối join (xem createRoom).
    let joinErr = null;
    const offErr = emitter.on("error", (e) => { if (!joinErr) joinErr = e; });
    try {
      const room = await client.joinOrCreate("lobby", { room: cleanCode, name });
      attachLobbyRoom(room);
      await waitFor(() => (state.room && state.room.code) || joinErr, 8000, "room_state sau join_room");
      if (joinErr) throw new LobbyError(joinErr.code || "JOIN_FAILED", joinErr.message || "Không vào được phòng.");
    } finally {
      offErr();
    }
    storeSet("projectg.lastRoomCode", state.code);
    return snapshotRoom();
  }

  /** Rời phòng lobby có chủ ý (nút [Rời phòng] / leave-mode khi vào game). */
  async function leaveRoom() {
    await leaveCurrentLobbyRoom();
    state.phase = "idle"; state.room = null; state.code = null;
    emitter.emit("left-lobby", {});
  }

  /** Rời lobby room hiện tại (nếu có) trước khi tạo/join phòng khác. */
  async function leaveCurrentLobbyRoom() {
    if (!lobbyRoom) return;
    const room = lobbyRoom;
    lobbyRoom = null;
    leavingLobbyConsented = true;
    try { await room.leave(); } catch { /* đã rời */ }
  }

  /** Rời lobby KHÔNG đồng ý (đóng socket, server giữ slot 60 s) — chỉ dùng cho test.
   * LƯU Ý SDK: `room.leave(false)` trả về promise chỉ settle khi room thật
   * sự kết thúc (onLeave) — reconnect thành công KHÔNG resolve nó (probe
   * đã chứng minh: promise treo tới khi rời có chủ ý). Vì vậy KHÔNG await
   * ở đây: chỉ đóng socket rồi trả về ngay, reconnect tự chạy nền. */
  async function dropLobbyConnection() {
    if (!lobbyRoom) return;
    try { void lobbyRoom.leave(false).catch(() => {}); } catch { /* đã rớt */ }
  }

  /** Rớt kết nối phòng game KHÔNG đồng ý (server giữ ghế 60 s) — chỉ dùng cho test.
   * (Cùng lưu ý SDK như dropLobbyConnection: không await leave(false).) */
  async function dropGameConnection() {
    if (!gameRoom) return;
    try { void gameRoom.leave(false).catch(() => {}); } catch { /* đã rớt */ }
  }

  // --- Lobby: thao tác trong phòng ------------------------------------------
  function requireLobbyRoom() {
    if (!lobbyRoom) throw new LobbyError("ROOM_NOT_FOUND", "Bạn chưa ở trong phòng nào.");
    return lobbyRoom;
  }
  function setTeam(team) {
    const t = team === "auto" ? "auto" : team;
    if (t !== "attack" && t !== "defense" && t !== "auto") throw new LobbyError("TEAM_INVALID", ERROR_MESSAGES.TEAM_INVALID);
    requireLobbyRoom().send("set_team", { team: t });
  }
  function setOperator(operatorId) {
    if (!OPERATORS.includes(operatorId)) throw new LobbyError("OPERATOR_INVALID", ERROR_MESSAGES.OPERATOR_INVALID);
    requireLobbyRoom().send("set_operator", { operatorId });
  }
  function setReady(ready) {
    requireLobbyRoom().send("set_ready", { ready: !!ready });
  }
  function setMap(mapId) {
    requireLobbyRoom().send("set_map", { mapId });
  }
  function startGame() {
    requireLobbyRoom().send("start_game", {});
  }
  function kick(sessionId) {
    requireLobbyRoom().send("kick", { sessionId });
  }

  // --- Countdown → vào game --------------------------------------------------
  async function onGameStarting(payload) {
    const countdownSeconds = Number(payload.countdownSeconds ?? COUNTDOWN_SECONDS) || COUNTDOWN_SECONDS;
    state.gameRoomId = payload.gameRoomId || null;
    state.joinToken = payload.joinToken || null;
    state.tokenReceivedAt = Date.now();
    state.assignments = payload.assignments || null;
    state.mapId = payload.mapId || state.mapId;
    state.phase = "countdown";
    // Trận mới bắt đầu khi phòng game cũ chưa rời kịp (host start lại nhanh
    // sau post-game): rời phòng cũ trước khi join phòng mới.
    if (gameRoom && state.gameRoomId && gameRoom.roomId !== state.gameRoomId) {
      await leaveGame();
    }
    countdownLeft = countdownSeconds;
    const me = mySlot();
    state.myAssignment = (state.assignments || []).find((a) => (me && a.playerId === me.playerId) || (me && a.sessionId === me.sessionId)) || null;
    emitter.emit("countdown", {
      secondsLeft: countdownLeft, mapId: state.mapId,
      assignments: state.assignments, gameRoomId: state.gameRoomId,
    });
    stopCountdown();
    countdownTimer = setInterval(() => {
      countdownLeft = Math.max(0, countdownLeft - 1);
      emitter.emit("countdown", {
        secondsLeft: countdownLeft, mapId: state.mapId,
        assignments: state.assignments, gameRoomId: state.gameRoomId,
      });
      if (countdownLeft <= 0) stopCountdown();
    }, 1000);

    if (autoJoinGame) {
      // Join NGAY trong countdown (R4/D-8): đừng đợi đếm ngược xong — server
      // start trận khi đủ người hoặc hết countdown, ai join chậm vẫn vào
      // được ở buy phase bằng token (TTL 120 s).
      try {
        await joinGame();
      } catch (err) {
        stopCountdown();
        state.phase = "lobby";
        emitter.emit("error", { code: (err && err.code) || "JOIN_GAME_FAILED", message: `Không vào được phòng game: ${errorMessage(err)} Ở lại lobby, host bấm bắt đầu lại.` });
      }
    }
  }

  /** Join phòng game bằng token từ `game_starting` (joinById + HMAC token). */
  async function joinGame() {
    if (gameRoom) return gameRoom;
    if (!state.gameRoomId) throw new LobbyError("JOIN_GAME_FAILED", "Chưa nhận được game_starting (thiếu gameRoomId).");
    if (!state.joinToken) throw new LobbyError("JOIN_GAME_FAILED", "Chưa nhận được join token.");
    const client = await ensureClient();
    const room = await client.joinById(state.gameRoomId, { token: state.joinToken });
    attachGameRoom(room);
    state.phase = "in-game";
    stopCountdown();
    startRejoinTokenRefresh(); // tự xin token mới khi token sắp hết hạn (< 30 s)
    // D-7: mặc định GIỮ lobby mở (keep). Chỉ rời khi lobbyDuringMatch="leave".
    if (lobbyDuringMatch === "leave" && lobbyRoom) {
      await leaveCurrentLobbyRoom();
      emitter.emit("left-lobby", {});
      log("leave-mode: đã rời lobby khi vào game (slot bị xoá, host có thể đổi tay)");
    }
    emitter.emit("enter-game", {
      gameRoom: room, gameRoomId: state.gameRoomId, token: state.joinToken,
      assignment: state.myAssignment, assignments: state.assignments, mapId: state.mapId,
    });
    return room;
  }

  function attachGameRoom(room) {
    gameRoom = room;
    if (!autoReconnect && room.reconnection) room.reconnection.enabled = false;
    room.onStateChange((s) => {
      const phase = s && s.phase;
      if (phase && phase !== state.gamePhase) {
        state.gamePhase = phase;
        emitter.emit("game-state", {
          phase, round: s.round,
          scoreAtk: s.scoreAtk, scoreDef: s.scoreDef,
          roundTimeLeft: s.roundTimeLeft,
          buyTimeLeft: s.buyTimeLeft, bombTimeLeft: s.bombTimeLeft,
        });
        if (phase === "matchEnd") {
          // Leave-mode: không còn kênh lobby nên đây là tín hiệu hết trận
          // duy nhất → bàn giao cho onMatchFinished (sẽ join lại lobby).
          // W10: onMatchFinished/game_finished nay dùng tên mới
          // (scoreAtk/scoreDef) — xem GameBridge.onMatchEnded.
          onMatchFinished({ scoreAtk: s.scoreAtk, scoreDef: s.scoreDef, gameRoomId: state.gameRoomId, via: "game-state" });
        }
      }
    });
    room.onMessage("*", (type, payload) => {
      emitter.emit("game-message", { type, payload });
    });
    room.onDrop(() => {
      emitter.emit("connection-lost", { which: "game" });
      log("game connection dropped — SDK auto-reconnect đang chạy");
    });
    room.onReconnect(() => {
      // Cùng sessionId nối lại: entity giữ nguyên (GameRoom.allowReconnection
      // resolve → connected=true + rebuild view). HP là số server đang có —
      // có thể đã thấp hơn lúc rớt nếu bị bắn trong lúc vắng mặt.
      lastGameToken = null;
      const me = myGamePlayer();
      emitter.emit("game-reconnected", {
        sessionId: room.sessionId,
        team: me ? me.team : null,
        operatorId: me ? me.operatorId : null,
        hp: me ? me.hp : null,
      });
      log("game reconnected, session giữ nguyên");
    });
    room.onLeave((code) => {
      stopInputStream();
      const consented = code === 4000 || leavingGameConsented;
      leavingGameConsented = false;
      const wasMatchEnd = state.gamePhase === "matchEnd";
      lastGameToken = consented ? null : (room.reconnectionToken || null);
      gameRoom = null;
      state.gamePhase = null;
      if (wasMatchEnd || consented) {
        emitter.emit("game-left", { reason: wasMatchEnd ? "match-end" : "consented" });
      } else if (state.phase === "in-game") {
        // Auto-reconnect kiệt sức giữa trận: ghế vẫn còn trên server trong
        // 60 s (allowReconnection) — UI cho nối lại thủ công (reconnectGame)
        // hoặc rejoin bằng token (rejoinGame, nếu token còn hạn).
        emitter.emit("game-reconnect-failed", {
          reason: "Mất kết nối phòng game quá 60 s.",
          canReconnect: !!lastGameToken,
          canRejoinWithToken: !!state.joinToken && (Date.now() - state.tokenReceivedAt) < TOKEN_TTL_MS,
        });
        emitter.emit("game-left", { reason: `game room closed (code ${code})` });
      } else {
        emitter.emit("game-left", { reason: `game room closed (code ${code})` });
      }
    });
    room.onError((code, message) => {
      emitter.emit("error", { code: String(code), message: message || "Lỗi kết nối phòng game." });
    });
  }

  /** Rời phòng game có chủ ý (nút rời trận / sau khi hết trận). */
  async function leaveGame() {
    stopInputStream();
    stopRejoinTokenRefresh();
    if (gameRoom) {
      const room = gameRoom;
      gameRoom = null;
      leavingGameConsented = true;
      try { await room.leave(); } catch { /* đã rời */ }
    }
    state.gamePhase = null;
    if (state.phase === "in-game") state.phase = "lobby";
  }

  // --- Hết trận ---------------------------------------------------------------
  async function onMatchFinished(payload) {
    if (state.phase === "post-game") return; // game_finished + matchEnd có thể về cả hai đường
    state.phase = "post-game";
    state.scores = { scoreAtk: payload.scoreAtk ?? null, scoreDef: payload.scoreDef ?? null };
    stopInputStream();
    stopRejoinTokenRefresh();
    emitter.emit("match-finished", {
      scoreAtk: payload.scoreAtk ?? null, scoreDef: payload.scoreDef ?? null,
      gameRoomId: payload.gameRoomId || state.gameRoomId,
    });
    // Rời phòng game (giữ lobby ở keep-mode; leave-mode thì join lại lobby).
    if (gameRoom) {
      const room = gameRoom;
      gameRoom = null;
      leavingGameConsented = true;
      try { await room.leave(); } catch { /* bridge đã ngắt */ }
    }
    state.gamePhase = null;
    if (lobbyDuringMatch === "leave") {
      // Leave-mode: join lại lobby bằng mã phòng đã lưu. Nhận SLOT MỚI
      // (playerId mới, chưa chọn đội/operator) vì slot cũ đã bị xoá khi rời.
      await rejoinLobbyAfterMatch();
      return;
    }
    // Keep-mode: ở lại lobby, server tự đưa phòng về phase lobby sau 15 s
    // (post-game) + reset ready — client chỉ cần chờ room_state mới.
    state.phase = "lobby";
  }

  /** Leave-mode: join lại lobby bằng mã phòng sau khi hết trận. */
  async function rejoinLobbyAfterMatch() {
    // Ưu tiên mã phòng hiện tại; rơi về mã gần nhất nếu state.code đã bị
    // xoá (vd. người chơi bấm [Rời phòng] giữa chừng). Phòng đã giải tán
    // hoặc đang in_game thì server từ chối như thường (ROOM_NOT_FOUND /
    // GAME_ALREADY_STARTED) — hàm trả null + emit error, không throw.
    const code = state.code || lastCode;
    if (!code) {
      state.phase = "idle";
      emitter.emit("error", { code: "ROOM_NOT_FOUND", message: "Không còn mã phòng để join lại. Về màn hình chính." });
      return null;
    }
    try {
      const room = await joinRoom(code, state.displayName);
      state.phase = "lobby";
      emitter.emit("room-state", { room });
      return room;
    } catch (err) {
      state.phase = "idle";
      emitter.emit("error", { code: (err && err.code) || "ROOM_NOT_FOUND", message: `Không join lại được phòng ${code}: ${errorMessage(err)}` });
      return null;
    }
  }

  // --- Reconnect thủ công (khi SDK auto-reconnect bỏ cuộc) --------------------
  async function reconnectLobby() {
    if (lobbyRoom) return lobbyRoom;
    if (!sdkClient) throw new LobbyError("RECONNECT_FAILED", "Chưa từng kết nối lobby.");
    const token = lastLobbyToken;
    if (!token) throw new LobbyError("RECONNECT_FAILED", "Không còn reconnection token (đã rời có chủ ý hoặc hết 60 s).");
    const room = await sdkClient.reconnect(token);
    lastLobbyToken = null;
    attachLobbyRoom(room);
    emitter.emit("lobby-reconnected", { room: snapshotRoom() });
    return room;
  }

  async function reconnectGame() {
    if (gameRoom) return gameRoom;
    if (!sdkClient) throw new LobbyError("RECONNECT_FAILED", "Chưa từng kết nối phòng game.");
    const token = lastGameToken;
    if (!token) throw new LobbyError("RECONNECT_FAILED", "Không còn reconnection token (đã rời có chủ ý hoặc hết 60 s).");
    const room = await sdkClient.reconnect(token);
    lastGameToken = null;
    attachGameRoom(room);
    state.phase = "in-game";
    const me = myGamePlayer();
    emitter.emit("game-reconnected", {
      sessionId: room.sessionId,
      team: me ? me.team : null, operatorId: me ? me.operatorId : null, hp: me ? me.hp : null,
    });
    return room;
  }

  /**
   * Xin token rejoin MỚI qua kết nối lobby đang mở (W8/W9, D-2).
   * Gửi message `request_rejoin_token`; server mint token mới (TTL 120 s)
   * và trả về qua message `rejoin_token` RIÊNG cho mình — handler trong
   * attachLobbyRoom() thay token trong bộ nhớ rồi resolve. Lỗi server
   * (trận chưa bắt đầu / xin quá nhanh / trận đã kết thúc) về qua message
   * `error` chuẩn. Cần kết nối lobby còn mở (keep-mode); ở leave-mode
   * lobbyRoom đã null → throw REJOIN_FAILED. Server throttle 1 mint / 10 s.
   */
  async function requestRejoinToken() {
    const room = requireLobbyRoom();
    if (!state.gameRoomId) throw new LobbyError("REJOIN_FAILED", "Chưa có trận đang chạy để xin token rejoin.");
    if (mintInFlight) throw new LobbyError("REJOIN_IN_FLIGHT", "Đang chờ token rejoin, thử lại sau.");
    mintInFlight = true;
    try {
      return await new Promise((resolve, reject) => {
        let done = false;
        const timer = setTimeout(() => finish(new LobbyError("TIMEOUT", "Hết thời gian chờ token rejoin từ server.")), 5000);
        const offOk = emitter.on("rejoin-token-refreshed", (p) => finish(null, p));
        const offErr = emitter.on("error", (e) => {
          // Chỉ các mã mà endpoint mint có thể trả mới tính là lỗi mint;
          // lỗi khác (vd. lỗi lobby chung) không liên quan thì bỏ qua, chờ tiếp.
          if (e && ["GAME_ALREADY_STARTED", "START_ABORTED", "TOO_MANY_REQUESTS", "ROOM_NOT_FOUND"].includes(e.code)) {
            finish(new LobbyError(e.code, e.message || "Không xin được token rejoin."));
          }
        });
        function finish(err, payload) {
          if (done) return;
          done = true;
          clearTimeout(timer); offOk(); offErr();
          if (err) reject(err); else resolve(payload);
        }
        try { room.send("request_rejoin_token", {}); }
        catch (err) { finish(new LobbyError("REJOIN_FAILED", `Không gửi được request_rejoin_token: ${err && err.message ? err.message : err}`)); }
      });
    } finally {
      mintInFlight = false;
    }
  }

  /** Xin token mới, best-effort không throw: true = đã thay token trong bộ nhớ. */
  async function tryMintRejoinToken() {
    if (!lobbyRoom) return false;
    try { await requestRejoinToken(); return true; }
    catch (err) { log("xin token rejoin thất bại:", err && err.message); return false; }
  }

  /** Tự xin token mới khi token sắp hết hạn (< 30 s) trong lúc đang chơi. */
  function startRejoinTokenRefresh() {
    stopRejoinTokenRefresh();
    // Chỉ có ý nghĩa ở keep-mode (lobby còn mở để gửi request_rejoin_token).
    if (lobbyDuringMatch !== "keep" || !lobbyRoom) return;
    rejoinRefreshTimer = setInterval(() => {
      if (disposed || state.phase !== "in-game" || !lobbyRoom || !state.joinToken) return;
      const remaining = TOKEN_TTL_MS - (Date.now() - state.tokenReceivedAt);
      if (remaining > 0 && remaining < 30_000) {
        void tryMintRejoinToken();
      }
    }, 10_000);
    // Node (smoke test): không giữ process sống chỉ vì timer này.
    if (typeof rejoinRefreshTimer.unref === "function") rejoinRefreshTimer.unref();
  }
  function stopRejoinTokenRefresh() {
    if (rejoinRefreshTimer) { clearInterval(rejoinRefreshTimer); rejoinRefreshTimer = null; }
  }

  /**
   * Rejoin trận bằng token với session MỚI (D-2, đường token rejoin).
   * Dùng token hiện có trong bộ nhớ (gốc hoặc đã được làm mới). Nếu token
   * đã hết hạn theo đồng hồ client, hoặc server từ chối vì EXPIRED (lệch
   * đồng hồ), thì xin token mới qua lobby (`requestRejoinToken()`) rồi thử
   * lại ĐÚNG 1 LẦN. Chỉ khi mint cũng thất bại mới emit
   * "rejoin-token-expired" và throw TOKEN_EXPIRED — phải chờ trận sau.
   * Đừng retry vô hạn (server throttle 1 mint / 10 s).
   */
  async function rejoinGame() {
    if (gameRoom) return gameRoom;
    if (!state.gameRoomId || !state.joinToken) {
      throw new LobbyError("REJOIN_FAILED", "Không có token/gameRoomId để rejoin.");
    }
    const client = await ensureClient();
    // Token đã hết hạn theo đồng hồ client → xin token mới TRƯỚC khi join.
    if (Date.now() - (state.tokenReceivedAt || 0) >= TOKEN_TTL_MS) {
      if (!(await tryMintRejoinToken())) {
        emitter.emit("rejoin-token-expired", {});
        throw new LobbyError("TOKEN_EXPIRED", "Join token đã hết hạn 120 s và xin token mới không thành công — chờ trận sau.");
      }
    }
    let room;
    try {
      room = await client.joinById(state.gameRoomId, { token: state.joinToken });
    } catch (err) {
      const msg = err && err.message ? err.message : "";
      if (/EXPIRED/i.test(msg)) {
        // Server báo hết hạn (lệch đồng hồ client/server) → xin token mới
        // rồi thử lại đúng 1 lần; mint thất bại thì báo hết hạn.
        if (!(await tryMintRejoinToken())) {
          emitter.emit("rejoin-token-expired", {});
          throw new LobbyError("TOKEN_EXPIRED", "Join token đã hết hạn 120 s và xin token mới không thành công — chờ trận sau.");
        }
        room = await client.joinById(state.gameRoomId, { token: state.joinToken });
      } else {
        throw err;
      }
    }
    attachGameRoom(room);
    state.phase = "in-game";
    startRejoinTokenRefresh();
    const me = myGamePlayer();
    emitter.emit("game-reconnected", {
      sessionId: room.sessionId, team: me ? me.team : null,
      operatorId: me ? me.operatorId : null, hp: me ? me.hp : null, via: "token",
    });
    return room;
  }

  // --- Input stream 60 Hz (bàn giao cho NetAdapter) ---------------------------
  // GameRoom dùng defineInput 60 Hz (CLIENT-ADAPTER §0): mỗi tick stage một
  // frame rồi send(). Client KHÔNG BAO GIỜ gửi vị trí/kết quả — chỉ intent.
  function startInputStream(frameProvider, opts = {}) {
    if (!gameRoom) throw new LobbyError("NO_GAME_ROOM", "Chưa vào phòng game.");
    stopInputStream();
    const hz = opts.hz || 60;
    const input = gameRoom.input();
    const intervalMs = 1000 / hz;
    inputTimer = setInterval(() => {
      if (!gameRoom) { stopInputStream(); return; }
      let frame;
      try { frame = frameProvider() || {}; } catch { return; }
      inputSeq += 1;
      input.data.seq = inputSeq;
      input.data.moveX = clampAxis(frame.moveX);
      input.data.moveZ = clampAxis(frame.moveZ);
      input.data.sprint = !!frame.sprint;
      input.data.crouch = !!frame.crouch;
      input.data.jump = !!frame.jump;
      input.data.yaw = Number(frame.yaw) || 0;
      input.data.pitch = Number(frame.pitch) || 0;
      input.data.fire = !!frame.fire;
      input.data.reload = !!frame.reload;
      input.data.abilityQ = !!frame.abilityQ;
      input.data.abilityE = !!frame.abilityE;
      input.data.abilityX = !!frame.abilityX;
      input.data.weaponSlot = Number.isInteger(frame.weaponSlot) ? frame.weaponSlot : -1;
      input.send();
    }, intervalMs);
    return () => stopInputStream();
  }
  function stopInputStream() {
    if (inputTimer) { clearInterval(inputTimer); inputTimer = null; }
  }
  function clampAxis(v) {
    const n = Number(v) || 0;
    return Math.max(-1, Math.min(1, n));
  }

  /** Intent rời rạc sang phòng game (plant, selectOperator, buy, …). */
  function sendGameMessage(type, payload) {
    if (!gameRoom) throw new LobbyError("NO_GAME_ROOM", "Chưa vào phòng game.");
    gameRoom.send(type, payload);
  }

  /** Ping RTT qua clock của SDK (chỉ có ở phòng game, sau handshake input). */
  function gameRtt() {
    if (!gameRoom || !gameRoom.clock) return null;
    try { return gameRoom.clock.rtt(); } catch { return null; }
  }

  function dispose() {
    disposed = true;
    stopCountdown();
    stopInputStream();
    stopRejoinTokenRefresh();
    lastLobbyToken = null;
    lastGameToken = null;
    if (gameRoom) { leavingGameConsented = true; try { void gameRoom.leave(); } catch { /* bỏ qua */ } gameRoom = null; }
    if (lobbyRoom) { leavingLobbyConsented = true; try { void lobbyRoom.leave(); } catch { /* bỏ qua */ } lobbyRoom = null; }
  }

  function waitFor(cond, timeoutMs, what) {
    const deadline = Date.now() + timeoutMs;
    return new Promise((resolve, reject) => {
      const poll = () => {
        let ok = false;
        try { ok = !!cond(); } catch { /* chưa sẵn sàng */ }
        if (ok) return resolve(true);
        if (Date.now() >= deadline) return reject(new LobbyError("TIMEOUT", `Hết thời gian chờ ${what}.`));
        setTimeout(poll, 50);
      };
      poll();
    });
  }

  return {
    // trạng thái (đọc, không sửa trực tiếp)
    get phase() { return state.phase; },
    get room() { return snapshotRoom(); },
    get code() { return state.code; },
    get lastCode() { return lastCode; },
    get displayName() { return state.displayName; },
    get gameRoomId() { return state.gameRoomId; },
    get gameRoom() { return gameRoom; },
    get lobbyRoom() { return lobbyRoom; },
    get myPlayerId() { return state.myPlayerId; },
    get myAssignment() { return state.myAssignment; },
    get assignments() { return state.assignments; },
    get gamePhase() { return state.gamePhase; },
    get scores() { return state.scores; },
    get lobbyDuringMatch() { return lobbyDuringMatch; },
    get isHost() { const me = mySlot(); return !!(me && me.isHost); },
    get mySlot() { return mySlot(); },
    get myGamePlayer() { return myGamePlayer(); },
    // token còn hiệu lực ước tính (ms) — tính từ lúc nhận, trừ trễ mạng
    get tokenRemainingMs() {
      if (!state.joinToken) return 0;
      return Math.max(0, TOKEN_TTL_MS - (Date.now() - state.tokenReceivedAt));
    },
    on: emitter.on,
    createRoom, joinRoom, leaveRoom, dropLobbyConnection, dropGameConnection,
    setTeam, setOperator, setReady, setMap, startGame, kick,
    joinGame, leaveGame, rejoinGame, rejoinLobbyAfterMatch, requestRejoinToken,
    reconnectLobby, reconnectGame,
    startInputStream, stopInputStream, sendGameMessage, gameRtt,
    dispose,
  };
}

// ===========================================================================
// mountLobbyUI — UI lobby tối thiểu (LOBBY.md §8), DOM thuần, không framework
// ===========================================================================
//
// 4 màn hình trong cùng một container: home → lobby phòng → countdown overlay
// → trong trận (bảng trạng thái nhỏ — game thật sẽ thay bằng HUD của nó) →
// post-game (15 s) → về lobby. Mọi nút gọi đúng method của lobby client;
// mọi thay đổi hiển thị đều từ event/server snapshot, không tự suy diễn.
//
// Tích hợp vào game: game mount UI này vào một div phủ màn hình menu; khi
// nhận event "enter-game", game ẩn container lobby và bật canvas + NetAdapter
// (CLIENT-ADAPTER.md). Khi hết trận, game hiện lại container (UI đã ở màn
// post-game). Không sửa index.html của game trong đợt này — mount là opt-in.
export function mountLobbyUI(lobby, container, uiOptions = {}) {
  if (typeof document === "undefined") {
    throw new Error("mountLobbyUI chỉ chạy trong trình duyệt (cần document).");
  }
  if (!container) throw new Error("mountLobbyUI cần container element.");
  const showDevMaps = !!uiOptions.showDevMaps;

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  };

  const style = document.createElement("style");
  style.textContent = `
.pg-lobby { font-family: Inter, system-ui, sans-serif; color: #e8f4ff; background: #0a0f1e;
  border: 1px solid #1e3a5f; border-radius: 12px; padding: 20px; max-width: 720px; margin: 0 auto; }
.pg-lobby h1 { font-size: 22px; margin: 0 0 4px; letter-spacing: 1px; }
.pg-lobby h2 { font-size: 16px; margin: 16px 0 8px; color: #7fd4ff; }
.pg-lobby .sub { color: #8fa8c0; font-size: 13px; margin-bottom: 16px; }
.pg-lobby input, .pg-lobby select { background: #101a2e; color: #e8f4ff; border: 1px solid #2a4a6b;
  border-radius: 6px; padding: 8px 10px; font-size: 14px; }
.pg-lobby button { background: #1565c0; color: #fff; border: 0; border-radius: 6px; padding: 9px 16px;
  font-size: 14px; cursor: pointer; }
.pg-lobby button:hover:not(:disabled) { background: #1e88e5; }
.pg-lobby button:disabled { background: #334155; color: #94a3b8; cursor: not-allowed; }
.pg-lobby button.ghost { background: transparent; border: 1px solid #2a4a6b; color: #bcd7ef; }
.pg-lobby button.danger { background: #7f1d1d; }
.pg-lobby .row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin: 8px 0; }
.pg-lobby .err { color: #ff8a80; font-size: 13px; min-height: 18px; margin: 6px 0; }
.pg-lobby .ok { color: #69f0ae; font-size: 13px; min-height: 18px; margin: 6px 0; }
.pg-lobby .code-big { font-size: 34px; letter-spacing: 6px; font-weight: 700; color: #7fd4ff; }
.pg-lobby .teams { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.pg-lobby .team-col { border: 1px solid #1e3a5f; border-radius: 8px; padding: 10px; }
.pg-lobby .team-col h3 { margin: 0 0 8px; font-size: 14px; }
.pg-lobby .player { display: flex; gap: 6px; align-items: center; padding: 4px 0; font-size: 14px; }
.pg-lobby .player .tag { font-size: 11px; color: #8fa8c0; }
.pg-lobby .player .off { color: #f9a825; }
.pg-lobby .ops { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.pg-lobby .op { padding: 10px 4px; text-align: center; border: 1px solid #2a4a6b; border-radius: 8px;
  background: #101a2e; cursor: pointer; font-size: 13px; }
.pg-lobby .op.sel { border-color: #7fd4ff; background: #12365a; color: #fff; }
.pg-lobby .cd-big { font-size: 96px; font-weight: 800; text-align: center; color: #7fd4ff; line-height: 1.1; }
.pg-lobby .center { text-align: center; }
`;
  container.appendChild(style);
  const root = el("div", "pg-lobby");
  container.appendChild(root);

  let currentScreen = null;
  let errorLine = null;
  let statusLine = null;
  let countdownNum = null;
  let unsubs = [];

  function setError(msg) { if (errorLine) errorLine.textContent = msg || ""; }
  function setStatus(msg) { if (statusLine) statusLine.textContent = msg || ""; }
  function roomCodeOf() { return (lobby.room && lobby.room.code) || lobby.code || ""; }

  function showHome() {
    currentScreen = "home";
    root.replaceChildren();
    root.appendChild(el("h1", null, "PROJECTG — Chơi mạng (alpha)"));
    root.appendChild(el("div", "sub", "Tạo phòng, chia sẻ mã 6 ký tự, sẵn sàng rồi vào trận. Alpha nội bộ: tối đa 10 người/phòng."));
    const nameLabel = el("div", null, "Tên hiển thị (2–16 ký tự)");
    const nameInput = el("input"); nameInput.value = lobby.displayName || "";
    nameInput.placeholder = "VD: An"; nameInput.maxLength = MAX_NAME_LENGTH;
    const codeLabel = el("div", null, "Mã phòng (nếu vào phòng có sẵn)");
    const codeInput = el("input"); codeInput.placeholder = "VD: K7QX2M"; codeInput.maxLength = 6;
    codeInput.style.textTransform = "uppercase";
    // Link chia sẻ ?room=CODE tự điền mã (LOBBY.md §3).
    try {
      const q = new URLSearchParams(window.location.search);
      if (q.get("room")) codeInput.value = normalizeRoomCode(q.get("room"));
    } catch { /* bỏ qua */ }
    const btnCreate = el("button", null, "Tạo phòng");
    const btnJoin = el("button", null, "Vào phòng");
    const lastCode = storeGet("projectg.lastRoomCode");
    const row1 = el("div", "row"); row1.append(nameLabel, nameInput);
    const row2 = el("div", "row"); row2.append(btnCreate);
    const row3 = el("div", "row"); row3.append(codeLabel, codeInput, btnJoin);
    root.append(row1, row2, row3);
    if (lastCode) {
      const quick = el("button", "ghost", `Vào lại phòng gần nhất (${lastCode})`);
      quick.addEventListener("click", async () => {
        setError("");
        try { await lobby.joinRoom(lastCode, nameInput.value); }
        catch (err) { setError(errorMessage(err)); }
      });
      root.appendChild(el("div", "row", "")).appendChild(quick);
    }
    errorLine = el("div", "err"); root.appendChild(errorLine);
    statusLine = el("div", "ok"); root.appendChild(statusLine);
    btnCreate.addEventListener("click", async () => {
      setError("");
      try { await lobby.createRoom(nameInput.value); }
      catch (err) { setError(errorMessage(err)); }
    });
    btnJoin.addEventListener("click", async () => {
      setError("");
      try { await lobby.joinRoom(codeInput.value, nameInput.value); }
      catch (err) { setError(errorMessage(err)); }
    });
  }

  function showLobby() {
    currentScreen = "lobby";
    const room = lobby.room;
    root.replaceChildren();
    if (!room) { showHome(); return; }
    root.appendChild(el("h1", null, `Phòng ${room.code}`));
    const codeRow = el("div", "row");
    codeRow.appendChild(el("span", "code-big", room.code));
    const btnCopyCode = el("button", "ghost", "Sao chép mã");
    btnCopyCode.addEventListener("click", () => copyText(room.code, "Đã sao chép mã phòng."));
    const btnCopyLink = el("button", "ghost", "Sao chép link");
    btnCopyLink.addEventListener("click", () => {
      const link = `${window.location.origin}${window.location.pathname}?room=${room.code}`;
      copyText(link, "Đã sao chép link phòng.");
    });
    codeRow.append(btnCopyCode, btnCopyLink);
    root.appendChild(codeRow);
    root.appendChild(el("div", "sub", `Map: ${mapName(room.mapId)} · ${room.players.length}/${room.settings ? room.settings.maxPlayers : MAX_PLAYERS} người · Host: ${hostName(room)}`));

    // Hai cột đội (LOBBY.md §5.3) + người chưa chọn đội ("Tự động").
    const teams = el("div", "teams");
    for (const team of ["attack", "defense"]) {
      const col = el("div", "team-col");
      col.appendChild(el("h3", null, team === "attack" ? "⚔ Tấn công" : "🛡 Phòng thủ"));
      const members = room.players.filter((p) => p.team === team);
      if (!members.length) col.appendChild(el("div", "sub", "— trống —"));
      for (const p of members) col.appendChild(playerRow(room, p));
      teams.appendChild(col);
    }
    root.appendChild(teams);
    const autoPlayers = room.players.filter((p) => !p.team);
    if (autoPlayers.length) {
      const autoDiv = el("div", "sub", "Tự động (server cân đội khi bắt đầu): ");
      autoDiv.appendChild(el("span", null, autoPlayers.map((p) => p.name).join(", ")));
      root.appendChild(autoDiv);
    }

    // Chọn đội + operator.
    const me = lobby.mySlot;
    root.appendChild(el("h2", null, "Đội của bạn"));
    const teamRow = el("div", "row");
    for (const [value, label] of [["attack", "Tấn công"], ["defense", "Phòng thủ"], ["auto", "Tự động"]]) {
      const b = el("button", (me && (me.team || "auto") === value) ? null : "ghost", label);
      b.addEventListener("click", () => { try { lobby.setTeam(value); } catch (err) { setError(errorMessage(err)); } });
      teamRow.appendChild(b);
    }
    root.appendChild(teamRow);
    root.appendChild(el("h2", null, "Operator (đổi operator sẽ huỷ Sẵn sàng)"));
    const ops = el("div", "ops");
    for (const op of OPERATORS) {
      const b = el("div", `op${me && me.operatorId === op ? " sel" : ""}`, OPERATOR_NAMES[op]);
      b.addEventListener("click", () => { try { lobby.setOperator(op); } catch (err) { setError(errorMessage(err)); } });
      ops.appendChild(b);
    }
    root.appendChild(ops);

    // Map (chỉ host) + nút sẵn sàng/bắt đầu + rời phòng.
    const mapRow = el("div", "row");
    mapRow.appendChild(el("span", null, "Map:"));
    const mapSel = el("select");
    for (const m of MAPS) {
      if (m.wip && !showDevMaps) continue;
      const opt = document.createElement("option");
      opt.value = m.id; opt.textContent = m.wip ? `${m.name} (WIP)` : m.name;
      if (room.mapId === m.id) opt.selected = true;
      mapSel.appendChild(opt);
    }
    mapSel.disabled = !lobby.isHost;
    mapSel.addEventListener("change", () => { try { lobby.setMap(mapSel.value); } catch (err) { setError(errorMessage(err)); } });
    mapRow.appendChild(mapSel);
    root.appendChild(mapRow);

    const actionRow = el("div", "row");
    if (lobby.isHost) {
      const readyCount = room.players.filter((p) => p.ready).length;
      const canStart = room.players.length >= 2 && room.players.every((p) => p.ready);
      const btnStart = el("button", null, `Bắt đầu trận (${readyCount}/${room.players.length} sẵn sàng)`);
      btnStart.disabled = !canStart;
      btnStart.title = !canStart ? "Cần ít nhất 2 người và mọi người đều Sẵn sàng." : "";
      btnStart.addEventListener("click", () => { try { lobby.startGame(); } catch (err) { setError(errorMessage(err)); } });
      actionRow.appendChild(btnStart);
    } else {
      const btnReady = el("button", null, me && me.ready ? "Huỷ sẵn sàng" : "Sẵn sàng");
      btnReady.disabled = !(me && me.operatorId);
      btnReady.title = !(me && me.operatorId) ? "Chọn operator trước khi Sẵn sàng." : "";
      btnReady.addEventListener("click", () => { try { lobby.setReady(!(me && me.ready)); } catch (err) { setError(errorMessage(err)); } });
      actionRow.appendChild(btnReady);
    }
    const btnLeave = el("button", "danger", "Rời phòng");
    btnLeave.addEventListener("click", async () => { try { await lobby.leaveRoom(); } catch (err) { setError(errorMessage(err)); } });
    actionRow.appendChild(btnLeave);
    root.appendChild(actionRow);
    errorLine = el("div", "err"); root.appendChild(errorLine);
    statusLine = el("div", "ok"); root.appendChild(statusLine);
  }

  function playerRow(room, p) {
    const row = el("div", "player");
    row.appendChild(el("span", null, `${p.isHost ? "👑 " : ""}${p.name}`));
    row.appendChild(el("span", "tag", p.operatorId ? OPERATOR_NAMES[p.operatorId] || p.operatorId : "chưa chọn op"));
    if (p.ready) row.appendChild(el("span", null, "✓"));
    if (!p.connected) row.appendChild(el("span", "off", "đang reconnect…"));
    if (lobby.isHost && !p.isHost) {
      const kick = el("button", "ghost", "Kick");
      kick.style.padding = "2px 8px";
      kick.addEventListener("click", () => { try { lobby.kick(p.sessionId); } catch (err) { setError(errorMessage(err)); } });
      row.appendChild(kick);
    }
    return row;
  }

  function hostName(room) {
    const h = room.players.find((p) => p.sessionId === room.hostId);
    return h ? h.name : "—";
  }
  function mapName(mapId) {
    const m = MAPS.find((x) => x.id === mapId);
    return m ? m.name : mapId;
  }

  function showCountdown(secondsLeft) {
    if (currentScreen !== "countdown") {
      currentScreen = "countdown";
      root.replaceChildren();
      root.appendChild(el("h1", "center", "Trận sắp bắt đầu"));
      root.appendChild(el("div", "sub center", `Map: ${mapName(lobby.room ? lobby.room.mapId : DEFAULT_MAP_ID)} · ${TEAM_NAMES[(lobby.myAssignment && lobby.myAssignment.team) || "auto"] || ""} · Operator: ${(lobby.myAssignment && OPERATOR_NAMES[lobby.myAssignment.operatorId]) || "—"}`));
      countdownNum = el("div", "cd-big", String(secondsLeft));
      root.appendChild(countdownNum);
      root.appendChild(el("div", "center sub", "Đang vào phòng game…"));
      errorLine = el("div", "err"); root.appendChild(errorLine);
      statusLine = el("div", "ok"); root.appendChild(statusLine);
    } else if (countdownNum) {
      countdownNum.textContent = String(secondsLeft);
    }
  }

  function showInGame() {
    currentScreen = "in-game";
    root.replaceChildren();
    root.appendChild(el("h1", null, "Đang trong trận"));
    const g = lobby.myGamePlayer;
    root.appendChild(el("div", "sub", g ? `Bạn: ${TEAM_NAMES[g.team === "T" ? "attack" : "defense"] || g.team} · ${g.operatorId} · HP ${g.hp}` : "Đang tải trạng thái trận…"));
    const row = el("div", "row");
    const btnLeave = el("button", "danger", "Rời trận (về lobby)");
    btnLeave.addEventListener("click", async () => {
      try { await lobby.leaveGame(); showLobby(); } catch (err) { setError(errorMessage(err)); }
    });
    row.appendChild(btnLeave);
    root.appendChild(row);
    root.appendChild(el("div", "sub", "Màn hình này chỉ là bảng trạng thái của lobby-client — game thật thay bằng HUD/canvas khi nhận event enter-game."));
    errorLine = el("div", "err"); root.appendChild(errorLine);
    statusLine = el("div", "ok"); root.appendChild(statusLine);
  }

  function showPostGame(scores) {
    currentScreen = "post-game";
    root.replaceChildren();
    root.appendChild(el("h1", "center", "Kết thúc trận"));
    const s = scores || lobby.scores || {};
    root.appendChild(el("div", "center", `Tấn công ${s.scoreAtk ?? "?"} — ${s.scoreDef ?? "?"} Phòng thủ`));
    root.appendChild(el("div", "sub center", lobby.lobbyDuringMatch === "leave"
      ? "Đang join lại phòng lobby…"
      : "Phòng sẽ tự về lobby sau 15 giây (Sẵn sàng được reset, trừ host)."));
    errorLine = el("div", "err"); root.appendChild(errorLine);
    statusLine = el("div", "ok"); root.appendChild(statusLine);
  }

  async function copyText(text, okMsg) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text; document.body.appendChild(ta); ta.select();
        document.execCommand("copy"); document.body.removeChild(ta);
      }
      setStatus(okMsg);
    } catch {
      setError("Không sao chép được — copy tay: " + text);
    }
  }

  // --- Nối event lobby → màn hình -------------------------------------------
  unsubs.push(lobby.on("room-state", ({ room }) => {
    if (!room) { if (currentScreen !== "home") showHome(); return; }
    if (room.phase === "lobby" || room.phase === "post_game") {
      if (currentScreen !== "lobby" || true) showLobby();
    }
  }));
  unsubs.push(lobby.on("countdown", ({ secondsLeft }) => showCountdown(secondsLeft)));
  unsubs.push(lobby.on("enter-game", () => showInGame()));
  unsubs.push(lobby.on("match-finished", (scores) => showPostGame(scores)));
  unsubs.push(lobby.on("game-left", ({ reason }) => {
    if (reason === "match-end") return; // post-game đã hiện
    if (currentScreen === "in-game") { setError(`Đã rời trận: ${reason}`); showLobby(); }
  }));
  unsubs.push(lobby.on("error", ({ code, message }) => {
    setError(message || ERROR_MESSAGES[code] || code);
  }));
  unsubs.push(lobby.on("connection-lost", ({ which }) => {
    setStatus(which === "lobby" ? "Mất kết nối lobby — đang tự nối lại trong 60 s…" : "Mất kết nối phòng game — đang tự nối lại trong 60 s…");
  }));
  unsubs.push(lobby.on("lobby-reconnected", () => setStatus("Đã nối lại lobby — slot/đội/operator giữ nguyên.")));
  unsubs.push(lobby.on("game-reconnected", ({ team, operatorId, hp }) => {
    setStatus(`Đã nối lại trận — ${team || "?"} / ${operatorId || "?"} / HP ${hp ?? "?"}.`);
    if (currentScreen === "in-game") showInGame();
  }));
  unsubs.push(lobby.on("lobby-reconnect-failed", ({ reason, code }) => {
    setError(`${reason} ${code ? `Bấm "Vào phòng" với mã ${code} để vào lại (slot mới).` : ""}`);
    showHome();
  }));
  unsubs.push(lobby.on("game-reconnect-failed", () => {
    setError("Mất kết nối phòng game quá 60 s — ghế đã mất. Về lobby chờ trận sau.");
    showLobby();
  }));
  unsubs.push(lobby.on("rejoin-token-expired", () => {
    setError("Token rejoin đã hết hạn — chưa có cách xin token mới, chờ trận sau.");
  }));
  unsubs.push(lobby.on("left-lobby", () => {
    if (currentScreen !== "in-game" && currentScreen !== "countdown" && currentScreen !== "post-game") showHome();
  }));

  showHome();

  return {
    unmount() {
      for (const off of unsubs) { try { off(); } catch { /* bỏ qua */ } }
      unsubs = [];
      container.replaceChildren();
    },
  };
}
