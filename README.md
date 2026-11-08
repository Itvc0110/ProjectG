# ProjectG — Neon Divide

**Web FPS chiến thuật theo round, lấy cảm hứng từ lối chơi đặt/gỡ bomb của CS, chơi ngay trên trình duyệt — không cần cài đặt.**

Bạn thuộc đội tấn công trên bản đồ gốc **Neon Divide**: mua vũ khí trong buy phase, phối hợp cùng 3 bot đồng minh chống lại 5 bot địch, đặt bomb tại site A/B (hoặc tiêu diệt toàn bộ đối thủ) và thắng 6 round để giành trận. Điểm khác biệt của ProjectG là hệ thống **8 Operator**, mỗi người có bộ kỹ năng Q / E / Ultimate riêng theo phong cách hero shooter — và bạn có thể **đổi Operator ngay giữa trận** tại khu vực spawn trong buy phase.

Game là **một file `index.html` duy nhất** chạy bằng [Three.js](https://threejs.org/) — toàn bộ vật lý, AI bot, recoil pattern và âm thanh đều tự cài đặt, không dùng engine ngoài.

> **Trạng thái bản phát hành (08/11/2026):** bản đang chạy trên nhánh chính / staging là **v3.5** (đẩy lên nhánh `muse/fps-abilities-v1` ngày 08/11/2026 theo quyết định của Sharon; playtest thật + 2 điểm chờ C12 vẫn còn nợ). Bản **v3.5** (gộp 8 tích hợp W2 + 2 sửa lỗi chặn) đã qua tester độc lập — kết luận **GO có điều kiện**, còn chờ playtest 1 vòng round thật, duyệt 2 điểm chờ, rồi mới merge/push. Đợt **W11** (14:28→14:55) đã gộp xong **v3.6 thống nhất** (`dev-v46-v36`, 8.940 dòng — content + core + lockfix + i18n trên nền v3.5): run-all 35/11, không hồi quy mới; trong lúc gộp đã phát hiện và sửa lỗi kế thừa nghiêm trọng `t` che hàm dịch trong 6 hàm Q/E/X/đổi operator. Bản **dev-v46-audiofile** (lớp file-first audio dán vào bản đích) cũng xong ở W11. Bốn bản sửa W10 đều qua tester độc lập ở W11: rankfix **GO**, lockfix **GO**, tutorialfix và i18n **GO có điều kiện**. Shim scoreT/scoreCT đã gỡ xong; D39 GOAP A2 đã chốt semantics Q và port reorderPlan (test 229/0). Vẫn **chưa merge/push** bản nào. Các mode mới, map mới, hệ thống meta, GOAP và multiplayer dưới đây đều là **bản dev đã kiểm chứng bằng test Node, chưa gộp vào bản chính, chưa playtest bằng mắt trên trình duyệt thật** — xem mục [Trạng thái từng mode](#trạng-thái-từng-mode) và [Chưa làm / nợ đã biết](#chưa-làm--nợ-đã-biết).

---

## Chơi ngay

### Cách 1 — Docker (khuyên dùng)

Yêu cầu: Docker Desktop (Windows/macOS) hoặc Docker Engine + Compose (Linux), và kết nối Internet (trình duyệt cần tải Three.js và model 3D từ CDN).

```bash
git clone -b muse/fps-abilities-v1 https://github.com/Itvc0110/ProjectG.git
cd ProjectG
docker compose up -d --build
```

Mở trình duyệt tại **http://localhost:8080**. Cập nhật bản mới: `git pull` rồi chạy lại lệnh `docker compose up -d --build`, tải lại trang (F5) — server đã cấu hình không cache. Dừng game: `docker compose down`. Chi tiết thêm trong [DOCKER.md](DOCKER.md).

### Cách 2 — Không cần Docker

Chỉ cần Python 3, tại thư mục chứa `index.html`:

```bash
python -m http.server 8080
```

Rồi mở **http://localhost:8080**. (Không mở trực tiếp file bằng `file://` — trình duyệt sẽ chặn nạp module/model.)

### Cách 3 — Bản dev (chỉ dành cho kiểm thử)

Các bản dev nằm trong thư mục phát triển (`dev-v40-*`, `dev-v41-*`, …), mỗi bản là một bản sao `index.html` + module kèm theo — chạy bằng cùng một lệnh `python -m http.server` tại thư mục của bản đó. Riêng bản đo hiệu năng `dev-v39-perf` / `dev-v42-perf2` hỗ trợ tham số **`?profile=1`** (tự chạy driver đo: chọn FLARE, mua rifle, bắn bot, đặt bomb rồi xuất JSON kết quả ra `window.__profileResult` + console `[PROFILE]`); thêm `&overdraw=1` để chạy kịch bản đo overdraw khói. Tham số này **không có trong bản chính v3.4/v3.5**.

> Lưu ý: game chưa từng được kiểm chứng hình ảnh đầy đủ trên trình duyệt thật — các bản phát hành đều qua kiểm tra cú pháp, toàn vẹn DOM id và mô phỏng logic bằng Node, cộng một bộ smoke Playwright chạy trên SwiftShader (xem [CHANGELOG.md](CHANGELOG.md)). Nếu gặp lỗi hiển thị, hãy mở issue kèm ảnh chụp màn hình.

---

## Tính năng theo phiên bản

| Phiên bản | Nội dung chính | Trạng thái |
|---|---|---|
| **v1** | Khung game hoàn chỉnh: map Neon Divide (3 lane, 2 site), round/bomb/economy kiểu CS, 5 bot địch + 3 bot đồng minh, HUD/minimap/killfeed, âm thanh WebAudio tổng hợp | Đã phát hành |
| **v1.1** | Chuẩn hoá nhịp trận: round 115 giây, đặt bomb 3,2 giây, headshot ×4 | Đã phát hành |
| **v2** | Đủ **8 Operator** (FLARE, PRISM, BASTION, WHISPER, TETHER, NULL, AEGIS, DRIFT), mỗi người có Q/E/Ultimate + nội tại; cấu trúc phá huỷ được có HP (tường PRISM, barricade BASTION…), hệ thống zone | Đã phát hành |
| **v2.x (UI)** | Làm lại giao diện phong cách esports/neon: thẻ Operator, HUD kính mờ, vòng cooldown, hiệu ứng thông báo/killfeed | Đã phát hành |
| **v3** | Cơ chế bắn kiểu CS: **recoil pattern** cố định, độ tản theo vận tốc (counter-strafe ~70 ms là bắn chuẩn), di chuyển bằng gia tốc, tagging khi trúng đạn, bot phản ứng/giới hạn tốc độ quay như người, tuỳ chỉnh độ nhạy + FOV | Đã phát hành |
| **v3.1** | Thêm 5 vũ khí (roster 7 súng) và **Hero-swap**: đổi Operator trong buy phase tại spawn, tối đa 1 lần/round, 3 lần/trận | Đã phát hành |
| **v3.2** | Bot dùng **model lính 3D thật** (Soldier GLB) với animation Idle/Walk/Run, visor nhuộm màu theo phe/Operator; hitbox giữ nguyên | Đã phát hành |
| **v3.3** | Bản hợp nhất + **hoàn thiện roster 7 súng đầu-cuối**: mua theo slot súng chính/phụ, đổi súng bằng phím 1/2, SR-50 ngắm bằng chuột phải, SG-12 bắn đúng 8 viên đạn ghém, thưởng hạ gục theo từng súng; thêm **Killcam** (xem lại 4 giây trước khi gục từ góc kẻ hạ) và **Replay round cuối** có timeline tua; vá lỗi mua đồ giữa giao tranh, gỡ bomb cộng dồn và 2 điểm spawn chồng vật cản | Đã phát hành |
| **v3.4** *(bản chính hiện tại)* | **Dao cận chiến KN-9** (slot 3: chém/đâm/backstab, thưởng $1.000); **đổi súng kiểu CS** (phím 1/2/3, vòng lăn chuột, phím V về súng trước, thời gian rút súng theo lớp vũ khí); **menu mua kiểu CS:GO** (lưới 6 cột, mua phím số 2 nhịp); **ESC = pause thật** (đóng băng game) + settings mở rộng (âm lượng 3 bus, đảo trục Y, tuỳ biến tâm ngắm); **map Neon Divide HD**: vật liệu PBR + ánh sáng HDRI, choke point chuẩn hoá 3,0 m, cover nửa chiều cao, shadow 2048 tĩnh; pack âm thanh súng + bước chân theo bề mặt; cân bằng thưởng SG-12 $900→$600 | **Đang chạy trên staging** |
| **v3.5** | Gộp 8 tích hợp: event log + thống kê sau trận, crosshair tuỳ biến kiểu CS2 (14 preset, mã chia sẻ), HUD P0 (viền tối crosshair/hitmarker đạt ≥3:1, cảnh báo hết đạn, cụm đạn ≤600px, tỉ lệ HUD 0,8–1,2), damage falloff theo khoảng cách, đổi màu Operator, font Be Vietnam Pro + i18n VI/EN 311 key, sửa lỗi bắn + economy (sprint #5), độ tin cậy (dispose GPU, watchdog khi CDN fail, reset phím khi Alt-Tab). Sửa 2 lỗi chặn do tester tìm ra: `ReferenceError: reason` ở cuối round và biến cục bộ `t` che hàm dịch trong 6 hàm đổi Operator/kỹ năng | **Đã push lên nhánh `muse/fps-abilities-v1` (08/11/2026)** theo quyết định của Sharon — tester độc lập GO có điều kiện; playtest thật + 2 điểm chờ C12 vẫn còn nợ (xem CHANGELOG) |
| **v3.6** *(gộp thống nhất, chưa phát hành)* | Gộp core + content + lockfix + i18n thành một bản duy nhất (`dev-v46-v36`, 8.940 dòng, nền v3.5 5.706 dòng): r187 + GOAP + perf-harness + mapsel/Neonfix + audio-weapons-v2/footsteps + pointer-lock `.catch` + i18n 533 key; sửa lỗi kế thừa `t` che hàm dịch trong 6 hàm Q/E/X/đổi operator (mang theo từ nhánh mapsel); bản audio riêng `dev-v46-audiofile` dán lớp file-first (loader 429 dòng, 19 điểm móc, assets/audio ship kèm) | **Đã kiểm chứng, chưa merge/push** — run-all 35/11 (không hồi quy mới so với baseline 27/9); test-pause-settings 208/0 trên v46 (đã sửa cho panel crosshair v3.6 ở W12); cần playtest B5 bắt buộc + nghe thử audio/footsteps bằng tai trước khi GO hẳn |

### Roster vũ khí (v3.4 / v3.5)

| Vũ khí | Loại | Giá | Đặc điểm |
|---|---|---|---|
| P9 | Pistol (mặc định) | — | Súng khởi đầu, cơ động nhất nhì game |
| DP-50 "Búa" | Pistol mạnh | $700 | 53 dmg — "rifle bỏ túi" cho round eco |
| SM-11 "Bão" | SMG | $1.250 | 900 RPM, thưởng hạ $600 — vua anti-eco |
| SG-12 "Cổng" | Shotgun | $1.100 | 8 pellet × 14 dmg, thưởng hạ **$600** (đã hạ từ $900 ở v3.4 vì farm tiền quá nhanh), giữ cửa/site chật |
| VK-7 | Rifle | $1.500 | Recoil pattern chuẩn, cân bằng mọi tình huống |
| SR-50 "Mắt Mèo" | Sniper nhẹ | $2.200 | Chuột phải để scope, headshot 320 dmg |
| MG-75 "Trâu" | LMG | $3.400 | Băng 100 viên, xuyên vật mỏng tốt nhất, đổi lại chạy chậm và nạp lâu |
| KN-9 "Vết Nứt" | Dao (slot 3) | — | Chém 40 / đâm 65 / backstab 90–180 dmg, thưởng hạ $1.000, chạy nhanh nhất game |

Kinh tế: khởi đầu $2.000 · hạ gục $300–$1.000 tuỳ súng (dao $1.000, SG-12/SM-11 $600, còn lại $300) · đặt bomb +$300 · thắng round +$1.400 / thua +$800 · trần $9.999. Từ v3.5, sát thương giảm theo khoảng cách (falloff): P9 headshot 25 m vẫn one-tap (104 dmg) nhưng 45 m chỉ còn 78 dmg.

---

## Trạng thái từng mode

| Mode / hệ thống | Bản dev | Kết quả kiểm chứng (test Node) | Trạng thái |
|---|---|---|---|
| Chuẩn — bomb 5v5 bot, Neon Divide | v3.4 / v3.5 (`dev-v42-v35merged`) | v3.5: harness endround 16/16, killcam 23/23, hero-swap 80/0, test-economy 107/0, test-abilities 139/139; run-all 25/11 (FAIL còn lại đều có sẵn trên bản cha) | **GO có điều kiện** — còn playtest thật + duyệt 2 điểm chờ rồi merge |
| Retakes 3v3 (freeze 5s, plant sẵn 35s, thắng 4 round) | `dev-v41-retakes-fix` | test-retakes 120/120; mô phỏng 800/800 round bot thủ đúng site | **GO** — chưa gộp, cần playtest tay 1 trận |
| Wingman 2v2 (chỉ site B, thắng 5 round) | `dev-v41-wingman` | test-wingman 109/109 | **GO có điều kiện** — chưa gộp, cần playtest tay |
| Arms Race FFA (thang 8 nấc, 480s, dao giáng nấc) | `dev-v41-armsrace` | test-armsrace 159/159 | **GO có điều kiện** — chưa gộp, cần playtest tay |
| Map FOUNDRY + HARBOR + chọn map | `dev-v42-mapsel` / `dev-v44-mapsel-neon` | test-mapsel 62/62; test-maps 415/1 (FAIL duy nhất: sightline chéo Neon 73,8 m đã biết); validator FOUNDRY/HARBOR PASS | **GO có điều kiện** — chưa gộp, cần playtest tay (bot trên map mới, minimap từng map); tester W10 cho mapsel-neon GO có điều kiện (FSM chuyển 3 map 119/119; map-validator 150 boxes / 2 vi phạm / 35,4 m giống hệt dev-v43) |
| Progression (XP/cấp/nhiệm vụ/uy tín) | `dev-v43-prog` | test-progression 49/49 | **GO có điều kiện** — chưa gộp, cần playtest tay |
| Solo Rank (9 bậc, ΔRP, placement 5 trận) | `dev-v43-rank` → `dev-v44-rankfix` | test-rank 48/48; test mới test-rankfix-v44 25/0 | **GO có điều kiện** — F1/F2 **đã sửa ở W10**: leaver khi đang dẫn nay luôn bị ghi thua (dẫn 5–4: W = −14, ΔRP < 0); clutch 1vX giữ điểm khi đặt bomb rồi gục (1v2→4 CP, 1v3→6 CP, 1v5→10 CP). Tester độc lập W11 **GO** (verify-v44-rankfix: 25/0; đối chứng âm dev-v43-rank 11/14 đúng 2 lỗi). Còn playtest thật |
| Skins (58 bản ghi, chỉ cosmetic, gate chống trường gameplay) | `dev-v43-skins` | test-skins 59/59; 31 trường gameplay lạ đều bị từ chối | **GO có điều kiện** — chưa gộp; mở khoá cuối trận chưa nối progression |
| Neon Pass (30 bậc + Epilogue, Free/Premium) | `dev-v43-neonpass` | test-neon-pass 68/68 | **GO có điều kiện** — chưa gộp, cần playtest tay |
| Tutorial 6 bài + Practice Range | `dev-v43-tutorial` → `dev-v44-tutorialfix` | test-tutorial 87/87 | **GO có điều kiện** — chưa gộp; text Bài 5 đã sửa [E]→[Q] ở W10 (test riêng 87/87); tester độc lập W11 **GO có điều kiện** (verify-v44-tutorialfix: 87/87, 6 bài ×2 lượt tới TỔNG KẾT, grep '[E]' = 0 trong runner + index.html). Còn playtest thật |
| GOAP — bot lập kế hoạch (forward-A*, think loop A1–A6, kill-switch về legacy) | `dev-v42-goap` | test-goap-integration 52/52; test-goap-mini 71/71 sau khi sửa bug A4 backoff | **GO có điều kiện** — chưa gộp; forward-validation bước 1 đã xong ở W10 (validate 5/5, lệch duy nhất Δmoney +$300 ở Engage); D39 A2 đã xong ở W11: chốt semantics Q (C51 — giữ nguyên UseAbilityQ, Q là "kỹ năng làm địch yếu đi", không phải entry skill) + port reorderPlan vào `goap-validate.js` (test mới 229/0, parity S1–S10: 16/16 plan validate OK); đính chính: thực tế 16 plan không-null, không phải 18/18; còn A1/A3–A6 |
| Three.js r160 → r187 | `dev-v39-three187` | run-all 26/4 (0 regression so với baseline 25/4); killcam 23/23 | **GO có điều kiện** — chưa gộp; cần playtest mắt (bóng đổ PCF, menu orbit) |
| Model bot Quaternius UBC+UAL (CC0) | `dev-v41-quat2` | test-model-loader 49/49; ual-lite.glb 1,63 MB, tải lần đầu 17,69→6,46 MB | **GO có điều kiện** — chưa gộp, cần playtest mắt (hướng mặt, vị trí visor); GLB chỉ có local, chưa push được |
| Âm thanh vũ khí v2 + footsteps theo bề mặt | `dev-v44-audio` / `dev-v44-footsteps` | test-audio-weapons-v2 66/66; test-footsteps 73/73; tester W10 cả hai đều GO có điều kiện | **GO có điều kiện** — chưa gộp, chưa nghe thử bằng tai; tiếng súng thật (Freesound) chưa tải được, Kenney chỉ là placeholder laser; lớp file-first đã dán vào bản đích `dev-v46-audiofile` ở W11 (test 56/56 — weapons/ đúng 12 file, không phải 14); preset asphalt/wet đã đồng bộ vào module `audio-footsteps.js` gốc ở W11 (test mới 91/91) |
| v3.6-core (r187 + abilities DRIFT/NULL + GOAP + perf-harness) | `dev-v45-v36core` | run-all 29/11 (baseline tự chạy lại 26/10; +1 FAIL là test-pause-settings — harness cũ đặt đích sai nên baseline PASS giả, không phải hồi quy); test-three187 18/18, test-goap-integration 52/52, killcam 23/23 | **GO có điều kiện** — đã gộp vào `dev-v46-v36` ở W11 (xem hàng v3.6 thống nhất dưới đây); cần playtest B5 bắt buộc (console/deprecation, 1 round, so ảnh H1–H3, bóng PCFShadowMap, killcam/replay; `?profile=1&profileSecs=120` trên PC thật) |
| v3.6-content (mapsel-neon + audio-weapons-v2 + footsteps) | `dev-v45-v36content` | run-all 29/11 (baseline 26/10; +1 FAIL duy nhất là test-maps sightline chéo 73,8 m đã biết); test-maps 415/1, test-mapsel 62/62, audio 66/66, footsteps 73/73, hero-swap 80/0 | **GO có điều kiện** — đã gộp vào `dev-v46-v36` ở W11 (xem hàng v3.6 thống nhất dưới đây); cần playtest thật cả 3 map + nghe thử bằng tai; xung đột spawn footsteps (±44,0) vs Neonfix (T −11 / CT 52) đã xử lý bằng tra động |
| v3.6 thống nhất — core + content + lockfix + i18n | `dev-v46-v36` | run-all 35/11 (46 test; baseline chạy lại 27/9 — không hồi quy mới, tập FAIL giống hệt từng dòng); maps 415/1, mapsel 62/62, audio-weapons-v2 66/66, footsteps 73/73, GOAP 52/52, emp-drift-fix 21/21, killcam 23/23, hero-swap 80/0, parity i18n 533/533 (inline 533 = module 533, đã gồm menu.mapTitle + reason.teamWipedPlanted), three187 18/18, perf-v45 17/17, lockfix 14/14, round-flow 59/59; test-map-lanes riêng 367/2 | **GO có điều kiện** — chưa merge/push; tester độc lập W12 đang kiểm chứng lại (đặc biệt 6 hàm vừa sửa lỗi t-shadow); còn playtest B5 bắt buộc + nghe thử audio/footsteps bằng tai; test-pause-settings 208/0 trên v46 (đã sửa ở W12); perf-budget 5/8 (geometry 65 / material 45 vượt trần v3 do game 3 map — cần chốt trần mới) |
| Âm thanh file-first (dán vào bản đích) | `dev-v46-audiofile` | test-audio-file-loader 56/56, test-audio-weapons-v2 66/66, test-footsteps 73/73 (không hồi quy); node --check 4/4; loader 429 dòng dán nguyên văn, 19 điểm móc, assets/audio 43 OGG ship kèm trong build; dp50_shot.ogg 404 theo thiết kế (chưa có file, vẫn synth v2) | **GO có điều kiện** — chưa gộp, chưa nghe thử bằng tai (checklist 13 mục trong REPORT, phiên chính); gap đã biết: impact:* chưa có synth fallback (nhưng game chưa có điểm gọi impact nào), sting round_win/lose chưa chốt ngữ nghĩa |
| GOAP D39 A2 — chốt semantics Q + port reorderPlan | `dev-loop/modules/goap-validate.js` | test-goap-validate 229/0 ×2 lần (parity S1–S10: 16/16 plan validate OK; defects backward 9→0, forward S3 1→0; validator bắt 7/7 ca phá hoại); không hồi quy (goap-mini 71/0, dynamic-cost 43/43, integration 52/0) | **Đã xong** — Q giữ nguyên trong domain production (C51); đính chính: thực tế 16 plan không-null, không phải 18/18; còn A1/A3–A6 |
| Flipbook smoke (module mới, chưa tích hợp vào game) | `dev-loop/modules/flipbook-smoke.js` | test-flipbook-smoke 56/56 ×2 lần (atlas 4×4 = 16 frame, seam max 0,0001, discard 0,30–0,54/frame, checksum e126f9d2); test-modules 140/0 | **Đã xong** — chưa tích hợp vào game; cổng A/B: chỉ đổi mặc định khi p95 pose P2 giảm ≥5%, P1/P3 không tăng >1%, quad khói −50% |
| QA — sửa kỳ vọng test cũ (W11) | `dev-loop/tests/` | test-round-flow 53/6 → 59/0; test-hero-swap 80/0 (A2 theo từng bản, T_SPAWN −11); test-bot-peek-v40 32/0; run-all harness gộp 25/11 → 27/9; test-pause-settings 208/0 trên v35merged (×2 lần) nhưng 201/7 trên v46 — test viết cho panel crosshair v3.5 (W12 đã sửa → 208/0 trên v46, ×2 lần); test-fx-pool 2/22 hoá ra báo động giả (đích mặc định cũ repo-staging chưa có fx-pool), đã sửa test → work/ 24/24, dev-v40-perfgc 24/24; test-emp-drift-fix đã xác minh vị trí + copy vào dev-loop/tests/, 21/21 trên v36core | **Đã xong** — sửa test-pause-settings cho panel crosshair v3.6 trên v46 (W12 đã xong — 208/0 trên v46) |
| QA sweep toàn bộ test (W10) | `dev-loop/audits/QA-SWEEP-W10.md` | run-all chính 47/9 (56 test); không hồi quy game mới; FAIL mới duy nhất test-round-flow 53/6 do test regex cũ (game nay dùng reason key i18n, hành vi không đổi) | **Đã xong** — khoảng trống đã đóng ở W11: file test-emp-drift-fix đã xác minh vị trí (bản chuẩn trong tests-v45-v36core) + copy vào `dev-loop/tests/`, chạy 21/21 trên v36core; test-round-flow đã sửa về 59/0 ở W11 |
| Multiplayer alpha nội bộ (Colyseus) | `dev-loop/multiplayer/` | lobby→game smoke 17/17, rejoin 9/9, hostile-client lobby VERDICT PASS, matchEnd E2E 33/33, filter-test 59/59, latency LS-01…LS-06 đạt (sim) | **Alpha nội bộ** — server chạy thật, nhưng chưa có UI lobby trong game chính, chưa rate-limit message, bot chưa đặt bomb |

---

## Điều khiển

| Phím / Chuột | Hành động |
|---|---|
| **W A S D** | Di chuyển |
| **Chuột** | Ngắm (game dùng raw input nếu trình duyệt hỗ trợ) |
| **Click trái** | Bắn |
| **Giữ chuột phải** | Bật/tắt scope (chỉ SR-50) |
| **Shift** | Chạy nhanh |
| **Space** | Nhảy · bỏ qua Killcam · tạm dừng/tiếp tục Replay |
| **Ctrl / C** | Ngồi xổm |
| **R** | Nạp đạn |
| **1 / 2 / 3** | Đổi sang súng chính / súng phụ / dao đang sở hữu |
| **V** | Quay về súng trước đó |
| **Lăn chuột** | Đổi súng |
| **B** | Mở menu mua đồ + đổi Operator (chỉ trong buy phase) |
| **Giữ F** (trong site) | Đặt bomb / gỡ bomb |
| **Q / E** | Kỹ năng 1 / 2 của Operator |
| **X** | Ultimate (khi đủ 100 năng lượng) |
| **ESC** | Pause thật (đóng băng game) + settings |

Cài đặt độ nhạy chuột (0,50–2,50) và FOV (68–80) nằm ở màn hình chính, lưu tự động trên máy (localStorage). Hãy tắt "Enhance pointer precision" trong Windows để ngắm chuẩn nhất. Từ v3.5: chuyển ngôn ngữ VI/EN nóng bằng nút `#btn-lang` (font Be Vietnam Pro, đủ dấu tiếng Việt); tâm ngắm tuỳ biến kiểu CS2 (14 preset, mã chia sẻ).

---

## Kiến trúc thư mục (repo)

```
ProjectG/
├── index.html            # Toàn bộ game: engine, AI, UI, âm thanh — 1 file duy nhất
├── Dockerfile            # nginx:1.27-alpine phục vụ game
├── docker-compose.yml    # service "game", cổng 8080:80
├── nginx.conf            # cấu hình không cache cho trang game
├── DOCKER.md             # Hướng dẫn chạy bằng Docker
├── assets/
│   ├── models/           # Model 3D (khi chạy local; bản online tự fallback sang CDN)
│   └── audio/            # Pack âm thanh CC0 (43 file OGG Kenney + manifest; xem dưới)
└── docs/
    ├── RESEARCH_AND_DESIGN.md       # Tài liệu thiết kế game đầy đủ (8 Operator, map, luật)
    ├── FPS_OPEN_SOURCE_LANDSCAPE.md  # Khảo sát mã nguồn mở FPS/phụ trợ và giấy phép
    └── mechanics/                    # Đặc tả cơ chế: recoil, peeking, vũ khí, aiming,
                                      # độ chính xác–di chuyển, hero-swap
```

**Nguyên tắc kỹ thuật:** game không build step, không framework — mở file là chạy. Mọi hằng số gameplay cốt lõi (round 115s, plant 3,2s, headshot ×4, thắng 6 round) được giữ bất biến giữa các phiên bản và có test hồi quy đi kèm trong quy trình phát triển. Bản chính v3.4 ~273 KB, bản v3.5 ~366 KB (một file `index.html` + 3 module ESM kèm theo).

---

## Giấy phép tài sản (assets)

ProjectG **không** dùng bất kỳ tài sản nào của Valve/CS hay studio khác. Toàn bộ nội dung gốc (map, Operator, giao diện) do dự án tự thiết kế; tài sản bên thứ ba đều là **CC0 / miễn phí hợp lệ**:

| Tài sản | Nguồn | Giấy phép |
|---|---|---|
| Model lính (Soldier GLB, bản v3.2+) | three.js examples | MIT (three.js) — nạp qua CDN hoặc file local trong `assets/models/` |
| Gói nhân vật & animation (thay thế, đã kiểm chứng) | Quaternius UBC + Universal Animation Library (43 clip, 65 xương khớp nhau, không cần retarget) | **CC0 1.0** |
| Gói âm thanh (43 file OGG ship) | Kenney — 6 pack (Impact, Sci-Fi, RPG Audio, Digital Audio, Interface, Music Jingles) | **CC0 1.0** |
| Texture PBR & HDRI (map HD) | Poly Haven, ambientCG | **CC0 1.0** |
| Thư viện 3D | Three.js r160 qua CDN (bản chính); r187 đã kiểm chứng ở bản dev riêng | MIT |

Chi tiết từng gói và file license gốc được tổng hợp trong thư mục phát triển của dự án (`assets/audio/MANIFEST.md`, `assets/audio/LICENSES/`). Tài sản của Mixamo (Adobe) **không** được phân phối trong repo này vì giấy phép của Adobe không cho phép chia sẻ file thô. Lưu ý trung thực: tiếng súng trong pack Kenney chỉ là placeholder (laser sci-fi cắt ngắn) — tiếng súng thật nằm trong 13 file Freesound (CC0/CC-BY) chưa tải được vì cần tài khoản; game hiện vẫn dùng âm thanh tổng hợp (synth) làm mặc định; module nạp file CC0 (`dev-loop/modules/audio-file-loader.js`, test 56/56) đã dán vào bản đích `dev-v46-audiofile` ở W11 (loader 429 dòng, 19 điểm móc, test 56/56 + 66/66 + 73/73 trên bản đích). Đối chiếu 12 vs 14: `assets/audio/weapons/` đúng là 12 file (120.367 B), tổng ship 43 file / 506.291 B khớp MANIFEST — số 14 trong REPORT của builder là lỗi đếm.

---

## Chưa làm / nợ đã biết

Những điểm này đã được đo và ghi lại, chưa phải là tính năng hoàn thiện — không nên quảng cáo ngược lại:

- **Chưa playtest bằng mắt trên trình duyệt thật hàng loạt.** Mọi bản dev mới (v3.5, Retakes, Wingman, Arms Race, map mới, meta, GOAP, Quaternius, audio) mới chỉ qua test Node + tester độc lập đọc code. Bộ smoke Playwright lần đầu xanh hoàn toàn 3/3 ở W9 — nhưng chạy trên SwiftShader (0,2–1,4 fps), chưa chạy trên PC có GPU thật.
- **Chưa có số đo hiệu năng thật.** `?profile=1` và perf-harness đã gắn xong (test 33/33) nhưng chưa chạy trên PC thật nên chưa có p95/fps1Low/draw call thật; draw call 55→38 (instancing) và per-frame-alloc 17→6 (diệt GC) mới là số đếm tĩnh từ code.
- **SG-12 vẫn snowball ở $600.** Mô phỏng cân bằng chạy lại ở $600: cờ SNOWBALL vẫn bật cả 4 kịch bản, vẫn chạm trần $9.999 ở 3/4 kịch bản; chỉ cắt xuống ≲$346 mới tắt được cờ trong mô hình KPR farm 1,4 cố định. Quyết định hiện tại: giữ $600, đo KPR thực tế bằng playtest trước khi cắt tiếp. Chạy lại ở W10 trên bản gộp (đã có falloff) cho kinh tế **giống hệt** báo cáo $600 — thu kill $13.680–$15.840/24 round, 2,29–2,66× VK-7, KPR suy ra ~0,95 (chưa phải KPR đo thật); P9 one-tap hết ở ~28,1 m (sightline Neon 25–35 m vẫn chồng vùng one-tap 25–28 m ở round pistol); không có mất cân bằng mới P0/P1.
- **Map Neon gốc còn lệch.** test-maps đo thật 8 FAIL: tâm site nằm trong crate, lane trùng barrier, sightline 88,5 m, lệch phe 11–14 s. Bản sửa `dev-v43-neonfix` đã xong 7/8 (lệch phe còn ΔA 4,65 s / ΔB 4,63 s, đạt chuẩn ≤5 s); còn 1 FAIL: sightline chéo 73,8 m — đã chấp nhận như giới hạn của chuẩn đo, không lát thêm cover. Tester độc lập W10 **GO có điều kiện**: xác minh bằng probe riêng, sightline chéo 73,75 m từ (−14,25, −41,25) hướng (0,92, 0,38) là **thật** (5.082 tia >35 m quét 16 hướng); lưu ý: câu "chỉ còn tia chéo" chưa chính xác tuyệt đối — còn 277 tia dọc/ngang >35 m (max 54,5 m, sượt mép crate 0,05 m), nhưng phình bán kính agent 0,55 m thì còn max 35,25 m, khớp validator. Mâu thuẫn còn mở (P0 duy nhất theo QA sweep W10): tuyên bố "dev-v44 đạt 35,4 m" (validator) vs phép đo sightline 73,8 m (test-maps) — cần đối chiếu trước phát hành.
- **Rank F1/F2 đã sửa ở W10** (`dev-v44-rankfix`, test mới 25/0) — còn playtest thật trước khi đưa rank vào v3.6; tutorial text Bài 5 đã sửa [E]→[Q] (`dev-v44-tutorialfix`, 87/87), còn playtest thật.
- **Skins chưa mở khoá thật cuối trận** (chưa nối progression/stats-tracker); charm/sticker chưa có mesh hiển thị.
- **i18n: 47 key mới đã gắn ở W10** (`dev-v45-i18n`, parity 531/531, key thực sự định tuyến 243→290/531 = 54,6%) — nhưng 177 key chưa gắn được vì tính năng (mode/meta) chưa có trong bản này; các key đã nằm sẵn trong từ điển inline nên khi tích hợp chỉ việc gọi `t('…')`. Còn hardcode có lý do: ghi chú "Thu/phóng toàn bộ cụm HUD…" chưa có key trong module (cần thêm key → 532/532); watchdog boot chạy trước module. Tester độc lập W11 **GO có điều kiện** (verify-v45-i18n: inline 532/532, parity 531/531, smoke t() 442/442 + 94/94). **Đã bổ sung vào module ở W12: 2 key menu.mapTitle và reason.teamWipedPlanted** (trước đó chỉ có trong inline của bản v46 — parity nay 533/533).
- **GOAP chưa xong hẳn.** Forward-validation bước 1 đã xong ở W10 (validate 5/5; lệch duy nhất Δmoney +$300 ở Engage — planner không mô hình hoá kill reward); D39 A2 đã xong ở W11: chốt semantics Q (C51 — giữ nguyên UseAbilityQ, Q là "kỹ năng làm địch yếu đi", không phải entry skill) + port reorderPlan vào `goap-validate.js` (test 229/0, 16/16 plan validate OK; đính chính: thực tế 16 plan không-null, không phải 18/18 như topic ghi); còn A1/A3–A6 (thứ tự: A3 → A1 → A4 → A5 → A6); cổng kẹt nhảy nhầm 4/8 bot trong vòng kín (bot về legacy vẫn chiến đấu được).
- **Multiplayer chưa phải sản phẩm.** Chưa rate-limit message/giây; bot chưa đặt bomb (GOAP chưa có goal Plant); chưa có UI lobby trong game chính; chuyển carrier khi carrier bị bắn chết chưa có luật; endpoint mint token rejoin mới nối xong ở tầng transport. GameBridge đã đổi sang scoreAtk/scoreDef ở W10 (5 file, matchend-e2e 33/33, round 6 qua WebSocket thật gfA={"scoreAtk":6,"scoreDef":0}); shim legacy scoreT/scoreCT **đã gỡ xong ở W11** (GameRoom.js endRound() dòng 910–918 cũ → 910–913; matchend-e2e 33/33 sau gỡ; chỉ còn comment lịch sử trong State.js + GameRoom.js:911 + events.js). D-7 đã chốt ở W11: giữ kết nối lobby mở suốt trận là hành vi chuẩn, rời lobby khi vào game chỉ là phương án dự phòng R5.
- **Nợ nhỏ khác:** fallback `canvas.requestPointerLock()` đã có `.catch` ở W10 (`dev-v45-lockfix`, test 14/14 — bản gốc sinh 1 unhandledRejection NotAllowedError, bản sửa 0); tester độc lập W11 **GO** (verify-v45-lockfix: bản sửa 0 unhandledRejection ở cả 4 tình huống, kể cả TH2 primary throw đồng bộ mà builder chưa phát hiện); comment cũ "SG-12 $900" còn sót trong `repo-staging/index.html:2474` và trên bản gộp dòng 3819; biển 3D T/CT-SPAWN vẫn ở vị trí spawn cũ sau khi dời spawn ở Neonfix.
- **Lỗi t-shadow đã sửa trong lúc gộp v46 (W11):** nhánh mapsel mang theo `const t = nowS()` che hàm dịch `t()` trong 6 hàm castQ/castDriftQ/castE/castX/doSwap/updateEffects — bấm Q/E/X sẽ ném TypeError; đã khôi phục nguyên văn 6 hàm từ base/core (tNow = 53 lần, khớp hệt base/core); lỗi của nguồn content (tNow=0), không phải do gộp sai; tester W12 kiểm chứng lại (đặc biệt bấm Q/E/X cả 8 operator).
- **test-pause-settings trên v46 đã về 208/0 ở W12** (trước đó 201/7 — C16, D9–D13, D19 — test viết cho panel crosshair v3.5/inline, chưa theo panel module #ch-panel của v3.6; đã sửa cho panel crosshair v3.6, chạy ×2 lần giống hệt); trên v35merged đã về 208/0 ở W11 (cả dev-v37, dev-v39-three187, dev-v35 đều 208/0).
- **Trần perf-budget chưa chốt cho game 3 map:** trên v46 perf-budget 5/8 (vector3 66 ĐẠT, renderer-info 9 ĐẠT; geometry 65 / material 45 vượt trần v3 do builder 3 map) — W12 đang chốt trần mới (audit perf-budget-3maps.md).

---

## Lộ trình (roadmap)

Đã xong trong chiến dịch 10 giờ ngày 08/11/2026 (W1–W11, xem [CHANGELOG.md](CHANGELOG.md)):

- [x] **v3.5**: gộp 8 tích hợp + sửa 2 lỗi chặn — đã kiểm chứng, chờ merge/push
- [x] **Retakes 3v3 / Wingman 2v2 / Arms Race FFA** — đã build + tester GO (có điều kiện), chờ gộp + playtest
- [x] **Map FOUNDRY + HARBOR + chọn map** (Neonfix đồng bộ) — đã build + tester GO (có điều kiện)
- [x] **Hệ thống meta**: progression / rank / skins / Neon Pass / tutorial — đã build + tester GO (có điều kiện), rank F1/F2 đã sửa ở W10 (tester W11 GO), tutorial Bài 5 đã sửa ở W10 (tester W11 GO có điều kiện)
- [x] **GOAP** (bot lập kế hoạch + kill-switch) và **Three.js r187** — đã build + tester GO (có điều kiện); D39 A2 đã xong ở W11 (chốt semantics Q + port reorderPlan, test 229/0)
- [x] **Model Quaternius CC0 + audio CC0 (43 OGG) + i18n 533 key** — đã kiểm chứng; file-first audio đã dán vào bản đích `dev-v46-audiofile` ở W11
- [x] **Multiplayer alpha nội bộ**: lobby↔game, token HMAC, rejoin 60 s, chống wallhack (view/tag), latency-sim; shim scoreT/scoreCT đã gỡ xong ở W11; D-7 lobby keep-mode đã chốt ở W11
- [x] **W10 tổng kiểm tra & chuẩn bị v3.6**: QA sweep run-all chính 47/9, không hồi quy game mới; rank F1/F2 + tutorial Bài 5 + pointer-lock `.catch` đã sửa; gộp v3.6-core và v3.6-content (đều GO có điều kiện, run-all 29/11); i18n gắn 47 key (parity 531/531); audio file-first (test 56/56); GameBridge scoreAtk/scoreDef; D39 forward-validation bước 1 (5/5)
- [x] **W11 gộp v3.6 thống nhất** (`dev-v46-v36`, 8.940 dòng, GO có điều kiện, run-all 35/11) + file-first audio (`dev-v46-audiofile`) — đã kiểm chứng, chờ merge/push; sửa lỗi t-shadow kế thừa trong lúc gộp; 4 tester độc lập (rankfix GO, lockfix GO, tutorialfix + i18n GO có điều kiện); sửa kỳ vọng test cũ (round-flow 59/0, hero-swap 80/0, bot-peek 32/0; run-all 27/9); test-pause-settings 208/0 trên v35merged; gỡ shim scoreT/scoreCT; chốt D-7; flipbook smoke module (56/56); đồng bộ preset asphalt/wet (91/91); README/CHANGELOG W10

Tiếp theo (v3.6, theo thứ tự tránh xung đột):

- [ ] Merge/push v3.5 (sau playtest thật + duyệt 2 điểm chờ)
- [ ] Merge/push **v3.6 thống nhất** (`dev-v46-v36`, đã gộp xong ở W11) sau playtest B5 bắt buộc + nghe thử audio/footsteps bằng tai + quyết 2 điểm chờ duyệt; port meta (progression/rank/skins/pass/tutorial) + Wingman/Arms Race lên nền v3.6 (dev-v46-v36)
- [ ] Playtest trình duyệt thật hàng loạt + chạy `?profile=1` đo p95 thật trên PC
- [ ] Sửa test-pause-settings cho panel crosshair v3.6 trên v46 (đã xong ở W12 — 208/0); thêm 2 key i18n (menu.mapTitle, reason.teamWipedPlanted) vào module (đã xong ở W12 — parity 533/533); đính chính topic goap (16/16, không phải 18/18); chốt trần geometry/material mới cho game 3 map; đối chiếu "dev-v44 đạt 35,4 m" vs phép đo sightline 73,8 m
- [ ] GOAP reorder (D39: A2 đã xong ở W11 — semantics Q đã chốt; còn A1/A3–A6); multiplayer: rate-limit, UI lobby trong game, bot đặt bomb

---

*ProjectG là dự án học tập/phát triển cá nhân, không liên kết với Valve hay Riot Games. CS/Valorant chỉ là nguồn tham chiếu nguyên tắc thiết kế; mọi nội dung trong game là nguyên bản.*
