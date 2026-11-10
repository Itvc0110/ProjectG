# ProjectG — Nhật ký cập nhật (CHANGELOG)

Game FPS chiến thuật trên trình duyệt (bản đồ gốc "Neon Divide", 8 operator, đấu bot theo round kiểu CS).
Mục mới nhất nằm trên cùng. File này được sinh tự động bởi `dev-loop/tools/changelog.js`
từ lịch sử commit đã đẩy lên GitHub — chạy lại tool để cập nhật sau mỗi bản phát hành.

> **Lưu ý:** các mục **v3.5** và **bản dev đã kiểm chứng** dưới đây là ghi chép thủ công từ chiến dịch
> 10 giờ ngày 2026-11-08 — các bản này đã qua tester độc lập bằng test Node nhưng **chưa merge/push
> lên GitHub**, nên chưa có trong lịch sử commit mà tool changelog đọc. Chỉ ghi những gì đã kiểm
> chứng, kèm nguồn kiểm chứng (test nào, PASS bao nhiêu).

## v3.5 — ĐÃ PUSH LÊN NHÁNH `muse/fps-abilities-v1` (2026-11-08)

Ngày: 2026-11-08, theo quyết định của Sharon lúc 15:37 ("Push v3.5 ngay khi W9 chốt"). Nội dung push = bản gộp `dev-v42-v35merged` (`index.html` 5.706 dòng, md5 `5d15195d…`) + 3 module ESM đi kèm ở thư mục gốc (`event-log-core.js`, `stats-tracker.js`, `crosshair-customizer.js` — hai file đầu là import cứng của `index.html`, thiếu là game không boot). Kiểm chứng trước push: node --check đạt, endRound harness 16/16, killcam 23/23, hero-swap 80/0, test-pause-settings 208/0, run-all không hồi quy mới so với các bản tiền nhiệm. Vẫn còn nợ: playtest 1 vòng trên trình duyệt thật + quyết 2 điểm C12 (`BOT_FALLOFF_KEY='rifle'`, crosshair `outlineWidth` mặc định 0).

## W11 — Gộp v3.6 thống nhất + dọn dẹp P1 (ĐÃ KIỂM CHỨNG, CHƯA MERGE/PUSH)

Ngày: 2026-11-08, 14:28→14:55 · Nguồn: `CAMPAIGN-LOG.md` (mục W11) + các báo cáo `dev-v46-v36/REPORT.md`, `dev-v46-audiofile/REPORT.md`, `dev-loop/audits/verify-v44-*.md`, `dev-loop/audits/verify-v45-*.md`

**Gộp v3.6 thống nhất — BẢN DUY NHẤT, GO CÓ ĐIỀU KIỆN.**
- ✨ `dev-v46-v36/index.html` (8.940 dòng, md5 `b311ed0e…`, nền v3.5 5.706 dòng → +3.234; diff vs nền 227 xoá / 3.461 thêm): gộp content → core → lockfix → i18n bằng git merge-file 3 chiều theo nền chung, script giải quyết xung đột có assert tại `dev-loop/work/merge-v46-v36/`. Xung đột đã xử lý: updateBot (giữ trích xuất GOAP của core + bọc botPathDest của content vào cả 3 điểm + giữ botFootsteps, xoá 1 return); điểm gọi buildMap() cuối file (giữ driver ?profile=1 của core + savedMapKey()/buildMap(savedMapKey()) của content); nhãn crosshair cạnh checkbox GOAP (giữ khối GOAP + nhãn bọc data-i18n settings.xhLabel). 2 điểm chờ duyệt giữ nguyên (BOT_FALLOFF_KEY='rifle', outlineWidth mặc định 0); đệm spawn footsteps giữ tra động T_SPAWN/CT_SPAWN.
- 🔧 **LỖI KẾ THỪA NGHIÊM TRỌNG — phát hiện khi kiểm chứng, ĐÃ SỬA trong lúc gộp:** nhánh mapsel mang theo `const t = nowS()` che hàm dịch `t()` trong 6 hàm castQ/castDriftQ/castE/castX/doSwap/updateEffects — bấm Q/E/X sẽ ném TypeError; đã khôi phục nguyên văn 6 hàm từ base/core (khác biệt duy nhất là tên biến; tNow = 53 lần, khớp hệt base/core); lỗi của nguồn content (tNow=0), không phải do gộp sai. Tester W12 kiểm chứng lại (đặc biệt bấm Q/E/X cả 8 operator).
- Kiểm chứng: node --check 3 khối script 4/4, constants 17/17; **run-all 35/11** (46 test) vs baseline chạy lại 27/9 (36 test) — không hồi quy mới (tập FAIL giống hệt từng dòng; retakes còn tốt hơn baseline 1 check; test-bot-v40 FAIL trong run-all là flaky, chạy lại 2 lần đều 49/0); maps 415/1 (FAIL duy nhất sightline chéo 73,8 m), mapsel 62/62, audio-weapons-v2 66/66, footsteps 73/73, GOAP 52/52, emp-drift-fix 21/21, killcam 23/23, hero-swap 80/0, parity i18n 531/531 (inline 533 = 531 + menu.mapTitle + reason.teamWipedPlanted; test mới test-i18n-inline.js 13/13), three187 18/18, perf-v45 17/17, lockfix 14/14, round-flow 59/59; test-map-lanes riêng 367/2. 11 FAIL gồm 9 FAIL có sẵn + maps sightline + pause-settings 201/7 (C16, D9–D13, D19 — test viết cho panel crosshair v3.5, cần đợt sau); perf-budget 5/8 (vector3 66 ĐẠT, renderer-info 9 ĐẠT; geometry 65 / material 45 vượt trần v3 do builder 3 map — cần chốt trần mới). Harness `dev-loop/tests-v46-v36/` đã re-point toàn bộ đích về v46 (phát hiện: harness content cũ vẫn đo bản gộp gốc ở 15 test generic). Việc còn lại: playtest trình duyệt thật BẮT BUỘC trước GO hẳn (checklist B5 r187, nghe thử audio/footsteps, bấm Q/E/X cả 8 operator — đặc biệt 6 hàm vừa sửa t-shadow, đổi VI↔EN không reload); chạy ?profile=1 trên PC 120–144 Hz lấy baseline p95/draw call; FAIL đã biết để đợt sau (sightline Neon, timing map-lanes, trần geometry/material cho game 3 map, 2 key i18n thiếu trong module). Báo cáo: `dev-v46-v36/REPORT.md`.

**Dán lớp file-first audio vào bản đích — GO CÓ ĐIỀU KIỆN.**
- ✨ `dev-v46-audiofile/index.html` (7.262 dòng, copy dev-v45-v36content 6.762 dòng; md5 nguồn nguyên `23ae5225…`): module audio-file-loader.js dán nguyên văn (429 dòng) vào block { } riêng; loader tạo 1 lần trong AudioSys.ensure(), basePath 'assets/audio/', preload ở gesture đầu + đầu mỗi round; adapter fileFirstSynth (tầng 2): shot/dryfire/reload/knife/deploy/holster/scope → AudioWeaponsV2, footstep → AudioFootsteps; 19 điểm móc (17 phương thức AudioSys + hook bước chân player/bot giữ surfaceAtMap/nhịp/pan/tắt >45m + hum_loop phát ở startRound, dừng ở endRound/endMatch); assets/audio/ ship (43 OGG + MANIFEST + 6 license Kenney, md5 khớp 1-1) copy vào trong build; block gun-sound-pack v1 giữ nguyên chế độ A/B. Kiểm chứng trên bản đích: node --check 4/4, test-audio-file-loader 56/56, test-audio-weapons-v2 66/66, test-footsteps 73/73 (không hồi quy); bất biến nguyên; diff chỉ thay 12 dòng cũ (toàn anchor), còn lại dòng thêm; serve HTTP: index.html 200, vk7_shot.ogg 200, dp50_shot.ogg 404 theo thiết kế. Gap đã biết (ghi trong REPORT, không bịa fallback): impact:* chưa có synth fallback — nhưng game hiện chưa có điểm gọi impact nào; bomb:explosion cùng họ gap; file có sẵn chưa có điểm móc: sting:slowmo_sting, ambient:ability_shield, ambient:door_open; knife_swing.ogg chỉ 1 biến thể; DP-50 vẫn synth v2; sting round_win/lose chưa chốt ngữ nghĩa; weapons/ đúng 12 file. Mở bằng file:// rớt về synth là hành vi thiết kế. Chưa làm: nghe thử bằng tai 13 mục (checklist REPORT §6, phiên chính).

**Tester độc lập — 4 bản W10 đều qua (điều kiện chung: playtest bằng tai/mắt trên trình duyệt thật):**
- 🔧 `dev-v44-rankfix` — kết luận **GO**. Kiểm chứng: md5 dev-v37/dev-v43-rank nguyên; rank-core.js v43/v44 giống hệt; diff chỉ đúng 2 chỗ F1/F2 (+ comment): dòng 3320 ép leaver luôn 'loss', snapshot clutchWinEnemies lúc plantBomb (3472) + endRound dùng snapshot (3503–3505); test-rankfix-v44 25/0, test-rank-integration 48/48, syntax 4/4, constants 17/17, node --check đạt; đối chứng âm dev-v43-rank 11/14 — đúng 2 lỗi F1/F2 (leaver dẫn 5–4 vẫn thắng W=+18; clutch dừng 2 CP); kiểm tra tay: leaver loss W=−14, ΔRP < 0, winStreak=0; clutch 1v2→4, 1v3→6, 1v5→10 CP; bất biến nguyên. Báo cáo: `dev-loop/audits/verify-v44-rankfix.md`.
- 🔧 `dev-v44-tutorialfix` — kết luận **GO CÓ ĐIỀU KIỆN**. Kiểm chứng: md5 dev-v43-tutorial/dev-v37 nguyên; diff chỉ đúng các chỗ tuyên bố (runner dòng 108 [E]→[Q], index.html dòng 2528–2529 + 2770 ghi chú host, REPORT.md); test-tutorial-integration-v44 87/87 (6 bài ×2 lượt tới TỔNG KẾT), syntax 4/4, dom-ids 5/5 (153 id), constants 17/17; grep '[E]' = 0 trong runner + index.html (2 chỗ còn nhắc "E" chỉ là comment); id 'e'/notify key 'E' giữ có chủ đích, chỉ dùng nội bộ; runner không emit 'sim' (chỉ lesson-start/radio/lesson-pass/summary/...), doc dòng 30 đã sửa đúng; G.phase giữ 'menu' trong huấn luyện; bất biến nguyên. Điều kiện còn lại: playtest trình duyệt thật 6 bài (phiên chính). Ghi chú nhỏ: comment doc dòng 31 vẫn dẫn dev-v43-tutorial/index.html. Báo cáo: `dev-loop/audits/verify-v44-tutorialfix.md`.
- 🔧 `dev-v45-lockfix` — kết luận **GO**. Kiểm chứng: md5 dev-v42-v35merged nguyên (5d15195d…); diff chỉ trong lockPointer() dòng 5035–5044 (5706→5711 dòng: +5 comment, +1 helper tryLock, 2 dòng handler rút gọn); grep toàn file đúng 3 điểm gọi requestPointerLock() — tất cả có .catch/try-catch, 0 điểm gọi trong 3 file JS phụ; test-lockfix 14/14, syntax 4/4, constants 17/17, node --check đạt; harness đối chứng độc lập: bản gốc tái hiện 1 unhandledRejection NotAllowedError (TH1) + phát hiện thêm TH2 primary throw đồng bộ cũng rò 1; bản sửa 0 unhandledRejection ở cả 4 tình huống, lock thành công thì không gọi fallback; bất biến nguyên. Xác minh tuyên bố builder: test-pause-settings FAIL có sẵn 70/9 trên cả hai bản, output giống hệt (không hồi quy). Điều kiện còn lại: đưa test-pause-settings về PASS (agent riêng đã làm ở W11 — 208/0 trên v35merged, xem dưới) + phiên chính duyệt/merge. Báo cáo: `dev-loop/audits/verify-v45-lockfix.md`.
- 🔧 `dev-v45-i18n` — kết luận **GO CÓ ĐIỀU KIỆN**. Kiểm chứng: md5 dev-v42-v35merged nguyên (5d15195d…); inline 532/532 = 531 key module + duy nhất reason.teamWipedPlanted, 0 key thiếu/lệch/trùng, đúng 221 key đã chèn so với inline gốc 312/312; số key đã gắn: literal 226→273 (+47 đúng tuyên bố: 31 data-i18n + 16 t() động), tổng định tuyến 290/531 (54,6%), +64 op.* = 354/531 (66,7%); parity 531/531, smoke t() 221 key chèn 442/442 + 47 key gắn 94/94; stats.roundSummary VI khớp từng ký tự; syntax 4/4, constants 17/17; ability.energyOf đã xoá khỏi cả hai dict (chỉ còn 2 lần trong comment, 0 tham chiếu t()); 6 hàm doSwap/castQ/castDriftQ/castE/castX/updateEffects không còn biến cục bộ `t` (43 lần gọi t() an toàn); tuyên bố 177 key W9 chưa gắn được là ĐÚNG (0 chuỗi đặc trưng mode/meta ngoài từ điển, 0 chuỗi UI thật bị bỏ sót); coverage 84,2% khớp builder (giảm là dương tính giả phép đo). Điều kiện còn lại: (1) reason.teamWipedPlanted vẫn thiếu trong module — cần thêm để parity 532/532; (2) ghi chú tỉ lệ HUD chưa có key; (3) settings.xhPreviewNote mất in đậm <b> sau applyI18n; (4) playtest trình duyệt thật (phiên chính). Báo cáo: `dev-loop/audits/verify-v45-i18n.md`.

**Sửa kỳ vọng test cũ (chỉ sửa file test, không sửa game/build):**
- 🔧 test-round-flow: 53/6 → 59/0 trên dev-v42-v35merged và dev-v44-mapsel-neon (6 regex chấp nhận cả chuỗi VI cũ lẫn reason key i18n + chữ ký endRound(usWin, reasonKey, reasonParams) + thiết kế B5 theo reason.teamWipedPlanted; FSM S1–S10 giữ nguyên; đối chứng repo-staging giữ 59/0).
- 🔧 test-hero-swap: A2 theo từng bản (bản có MAPS kỳ vọng T (−11,0,0) + đối chiếu MAPS.neon.spawns.T; bản đơn-map giữ (−44,0,0)) — mapsel-neon 79/1 → 80/0, v35merged/dev-v37 giữ 80/0.
- 🔧 test-bot-peek-v40: GUARDS nạp theo map (trích tọa độ A/B/MID từ cả const GUARDS cũ lẫn MAPS.neon.guards mới, đòi trùng tuyệt đối, không nới ngưỡng) — mapsel-neon 31/1 → 32/0, các bản khác giữ 32/0.
- Run-all: harness gộp 25/11 → 27/9 (chỉ giảm FAIL); harness chính 54/9 → 54/10 (64 file — 3 file sửa PASS cả hai lượt; xê dịch còn lại: test-bot/test-bot-v40 flaky gauss đã biết + test-goap-validate lật PASS + thêm test-flipbook-smoke.js mới của agent khác). Md5 4 bản build nguyên vẹn, bất biến nguyên.
- 🔧 test-pause-settings về 208/0 trên dev-v42-v35merged (×2 lần giống hệt), chỉ sửa file test. Bảng FAIL trước sửa: B4 kỳ vọng timer.getDelta() (r187) trong khi game r160 dùng clock.getDelta(); mục E crash (await import top-level trong khối SETTINGS trích xuất) nên test dừng ở 70 PASS; C16 lấy nhầm listener visibilitychange đầu tiên (bản gộp có thêm resetInputState ở trước); D9–D13/D19/D20: control tâm ngắm inline v3.5 đã chuyển sang module crosshair-customizer.js v3.6 (panel #ch-panel, id ch-*, key neondivide-crosshair). Cách sửa: B4 kỳ vọng theo bản (clock r160 / timer r187, mẫu per-build như t(?:Now)?); C16 quét mọi listener visibilitychange lấy đúng cái gọi openPause(); D9–D13/D19/D20 nhánh theo bản (module: ch-length/ch-gap/ch-dot, #ch-panel/#ch-preview/#ch-preset, STORAGE_KEY neondivide-crosshair; inline giữ kiểm cũ); E lược await import thành null trong khối SETTINGS trích xuất; F thêm stub resetInputState() + t() i18n cho sandbox. Kết quả: v35merged 208/0, dev-v37 208/0 (trước 207/1), dev-v39-three187 208/0, dev-v35 208/0; run-all trước/sau không đổi tập FAIL (54/9 chính, 26/10 harness v42), chỉ giảm FAIL; test-bot-v40 flaky gauss() 1 lần không liên quan. File sửa: `dev-loop/tests/test-pause-settings.js` + bản sao tests-v42-v35merged/ đồng bộ. **Còn dở: trên dev-v46-v36 test này chỉ 201/7** (C16, D9–D13, D19 — test viết cho panel crosshair v3.5, cần đợt sau sửa cho panel v3.6).
- 🔧 Điều tra test-fx-pool 2/22 — **báo động giả, đã sửa test** (chỉ phía test, không chạm game/build). Nguyên nhân gốc: QA-SWEEP-W10 chạy test-fx-pool.js KHÔNG tham số nên rơi vào đích mặc định cũ repo-staging (chưa hề có fx-pool) → 2 PASS vacuous; work/ KHÔNG mất tích hợp fx-pool (createFxPool vẫn inline đầy đủ, các sprint 1012–1412 đều từ chối sao chép lại từ staging để khỏi xoá fx-pool); dev-v40-perfgc CÓ fx-pool thật nhưng ở biến thể import module (dòng 688) thay vì inline nên test cũ FAIL 12/24 dù tính năng đủ. Đã sửa test-fx-pool.js: đích mặc định đổi sang ../work/index.html + chấp nhận cả 2 biến thể tích hợp hợp lệ (inline và import module), vẫn khẳng định cùng tính chất (ủy thác pool, 0 cấp phát/phát, 64/32/512, frustumCulled=false, 6 điểm gọi tracer). Kết quả (×2 lần giống hệt): work/ 24/24 (trước cũng 24/24 khi chỉ đích đúng), dev-v40-perfgc 12/24 → 24/24, repo-staging đối chứng âm 2/24 → 1/24 (1 PASS còn lại chỉ là bất biến tracer, không phải tính chất pool). Ghi nhận: sparks ở cả nhánh pellet SG-12 (4 điểm thay vì 2, ồn hơn doc sprint 0912) — việc riêng cho sprint port nếu phiên chính muốn đồng bộ. KHÔNG cần sprint port lại fx-pool vì lý do này.
- 🔧 Xác minh vị trí test-emp-drift-fix — **khoảng trống QA sweep W10 đã đóng.** Hai bản là CÙNG một test — bản chuẩn là dev-loop/tests-v45-v36core/test-emp-drift-fix.js (diff 3 điểm thích ứng có chủ đích cho bản gộp: neo H1, check đếm damageBot 3→5 điểm; bản v39 cũ FAIL 2/21 trên bản gộp nhưng PASS 21/21 trên bản v39 gốc). Nguyên nhân QA sweep W10 không thấy: sweep chỉ tìm trong dev-loop/tests/, modules/, BACKLOG, knowledge/ — file khi đó chỉ sống trong harness theo bản, chưa vào dev-loop/tests/ và chưa có trong EXPECTED_TESTS. Đã copy bản chuẩn vào dev-loop/tests/test-emp-drift-fix.js + thêm 1 dòng vào EXPECTED_TESTS của run-all.js (chỉ thêm file test, không sửa game/build). Kết quả (×2 lần giống hệt): trên dev-v45-v36core 21/21; đối chứng âm dev-v37 FAIL 10/21 (không phải 9 như builder W3 ghi — check đếm damage kỳ vọng 5 điểm nên FAIL thêm, hành vi đúng); test-abilities 139/139 cả hai bản; run-all sau khi thêm test: 51 PASS / 10 FAIL / 0 MISSING (61 test), test mới PASS 21/21; 10 FAIL gồm 9 FAIL trùng W10 + test-bot flaky gauss() (chạy lại trực tiếp PASS 49/0). md5 các bản nguồn không đổi.

**Hệ thống khác:**
- ✨ Gỡ shim scoreT/scoreCT trong GameRoom.js — **đổi tên điểm nay hoàn tất xuyên suốt code + tool.** Diff: GameRoom.js endRound() (dòng 910–918 cũ → 910–913): xoá 2 dòng scoreT/scoreCT + comment shim D-3, thay bằng comment W11 2 dòng; payload match-ended nay chỉ còn {lobbyCode, gameRoomId, scoreAtk, scoreDef}; events.js cập nhật comment payload; không sửa gì khác trong GameRoom.js, không chạm LobbyRoom.js/State.js; node --check OK. Grep: không còn code nào trong dev-loop/multiplayer/ đọc/ghi scoreT/scoreCT (chỉ còn comment lịch sử State.js:17,106,107 + GameRoom.js:911 + events.js). Hồi quy tuần tự: matchend-e2e 33/33 (gfA={"scoreAtk":6,"scoreDef":0} round 6, t=324,6s), smoke-lobby-game ALL GATING CHECKS PASSED (18 dòng PASS + INFO hitscan skipped vì phase=buy — W10 đếm 19 vì hitscan chạy được lần đó, không phải fail), smoke-lobby-d8-rejoin 9/9, filter-test 59/59 gating, rejoin-token-check 26/26, hostile-client standalone 1/5 PASS 0 FAIL 4 SKIP, lobby mode verdict PASS gate 17/21 0 FAIL 4 SKIP. Sau suite các cổng 2569/2571/2573/2574/2580/2593 đều trống. Tài liệu: GAMEBRIDGE-SCORE-RENAME.md thêm §5 (W11 xong), §4 mục 1–2 hoàn tất.
- ✨ D39 GOAP A2 — chốt semantics Q + port reorderPlan. Quyết định C51: GIỮ NGUYÊN UseAbilityQ trong domain production (pre {abilityReady, enemyVisible}, effect {abilityReady:false, enemyWeak:true}) — Q là "kỹ năng làm địch yếu đi", KHÔNG phải entry skill; entryWindow chỉ tồn tại trong domain nghiên cứu, không có trong production; enemyWeak là fact thế giới có thật (sensor đặt true khi địch lộ diện còn <40 HP); planner tối ưu không bao giờ chọn Q nên vô hại, chỉ tốn node tìm kiếm; không sửa effect thành entryWindow (bịa semantics), không xoá Q (phá parity 18 action + mất móc nối backlog #37). Module mới `dev-loop/modules/goap-validate.js` (366 dòng): port reorderPlan từ validate-reorder.mjs (DAG producer-consumer-threat + Kahn theo phase + anchor entry + fail-safe trả plan gốc) + validatePlanFull + tacticalDefects + pipeline validateAndReorder + normalizeActions (cả hai hình dạng domain); không sửa goap-mini.js / validate-reorder.mjs gốc / file game. Test mới test-goap-validate.js (603 dòng): PASS 229 | FAIL 0 ×2 lần — parity S1–S10: 16/16 plan validate OK, defects backward 9→0, forward S3 1→0, validator bắt 7/7 ca phá hoại, bẫy Purge-sau-Wall sửa được, tiền eo hẹp báo FAIL đúng; không hồi quy (goap-mini 71/0, dynamic-cost 43/43, integration 52/0). **ĐÍNH CHÍNH TRUNG THỰC:** topic ghi sai số lượng plan — thực tế chỉ 16 plan không-null (forward 7 + backward 9; 20 slot − 4 null: S6/S10 forward CAP, S8 cả hai EXHAUSTED), forward bị reorder 3/7 (không phải 3/9); các số khác của topic khớp; file topic vẫn ghi 18/18 — cần 1 dòng đính chính khi phiên chính chạm tới. Nhánh CYCLE trong reorderPlan là phòng thủ không tới được qua API công khai. Còn lại A1/A4/A5/A6; BACKLOG #4 chưa cập nhật (để điều phối/main).
- ✨ Chốt D-7 lobby keep-mode (chỉ docs). Xác minh code thật: lobby-client.js:253 mặc định lobbyDuringMatch "keep"; LobbyRoom.js:92–96 onLeave dùng code === CloseCode.CONSENTED (4000, bug W7 đã sửa ở W8); bằng chứng: smoke-lobby-client 26 check PASS (reconnect lobby 60s PASS ×2), G7 matchEnd E2E 33/33 giữ lobby mở. Đã đổi 4 file: W6-PLAN.md §3.1 thêm khối CHỐT W11 (D-7 = keep là chuẩn, leave chỉ là R5 dự phòng, brief W7 ghi sai C38); LOBBY.md 4 chỗ (§11.1 chốt keep, §9 checkbox reconnect ≤60s → [x], §11.3 rớt lobby ≤60s → ĐÃ ĐẠT, §12.1 ghi ĐÃ SỬA ở W8); BACKLOG.md mục P1 D-7 → [x] (ghi ngày + file); CHANGELOG.md mục 7 chờ quyết → ĐÃ CHỐT (suýt xoá ý "thứ tự v3.6" cùng dòng — đã khôi phục thành mục 8 riêng). Grep "rời lobby khi vào game" còn 7 hit, tất cả đúng vai trò (file lịch sử ghi rõ BRIEF SAI / mô tả R5 / mục đã chốt).
- ✨ Module flipbook smoke mới + test (không tích hợp vào game). Module `dev-loop/modules/flipbook-smoke.js`: atlas 4×4 = 16 frame, 128px/frame, value noise 2D FBM 4 octave + domain warp 1,4 + radial falloff 1−r^2,2 + remap contrast, seed cố định 'projectg-smoke' (mulberry32/FNV-1a tự cài, 0 dependency); API generateAtlasPixels/createSmokeAtlas/generateAtlasLazy (chunk qua requestIdleCallback, fallback setTimeout, onProgress + cancel())/createAtlasBuilder/frameForAge/frameUV/uvForAge/alphaAt/isDiscarded/discardStats/edgeSeamError/frameDifference/atlasChecksum; không phụ thuộc THREE/DOM (canvas qua factory). Test mới test-flipbook-smoke.js: 56/56 PASS ×2 lần — 16 frame khác nhau (120 cặp diff min 0,067), tile không vỡ biên (seam max 0,0001), frame theo tuổi đúng thứ tự + startFrame + loop=false, discard 0,30–0,54/frame (góc = 0), lazy 8 chunk không block (mỗi chunk <250ms, checksum = bản đồng bộ) + cancel, seeded RNG byte-identical 2 lần. Số đo Node: atlas 16×128px ≈187ms (~12ms/frame), chunk mặc định 2 frame ≈23ms, 256px ≈419ms (nên chunkFrames: 1), checksum e126f9d2. Tài liệu INTEGRATION-flipbook-smoke.md: điểm móc createSmoke (dev-v35:2390, MeshStandardMaterial 0x9fb4cc opacity 0,55), thứ tự áp 5 bước, cổng A/B (chỉ đổi mặc định khi p95 pose P2 giảm ≥5%, P1/P3 không tăng >1%, quad khói −50%). Kiểm chứng: node --check đạt, test-modules 140/0 không hồi quy, run-all test mới PASS 56/56 (8 FAIL còn lại từ trước, không liên quan flipbook).
- ✨ Đồng bộ preset asphalt/wet vào module audio-footsteps.js gốc. Chỉ sửa 2 file (không chạm game/build): `dev-loop/modules/audio-footsteps.js` (+ preset asphalt/wet, alias nhua/nuoc/puddle, hằng vùng FOOTSTEP_* + surfaceAtMap, export mới) + test mới `dev-loop/tests/test-footsteps.js` (file này trước đây chưa tồn tại). Port trích đúng từ dev-v44-footsteps: preset asphalt/wet byte-identical, surfaceAtMap byte-identical trừ 2 khác biệt có chủ ý (chữ ký (x, z, sites?) vì module không dựa vào biến toàn cục SITES + hằng FOOTSTEP_SITES mặc định = tọa độ SITES game); API cũ tương thích ngược (concrete hardcode, surfaceAt, play/strideInterval). Test mới 91/91 PASS ×2 lần diff rỗng: 26 điểm đặt tên, quét lưới 9.879 ô = asphalt 9.157 / concrete 668 / wet 54 (khớp đúng số builder W9), nhịp bước 2,5 m/s → 0,488s / 5,3 m/s → 0,340s; 1 FAIL lần đầu ở điểm đúng r=8,2m do sai số float ~1e-15 (đã sửa test dùng điểm sát mép 40.199m như builder). Kiểm chứng: node --check đạt, test-modules 138/0 bằng đúng baseline; md5 dev-v44-footsteps không đổi.
- ✨ README + CHANGELOG — chỉ sửa 2 file docs (REPO-README.md 202→206 dòng, CHANGELOG.md 302→~470 dòng: thêm kết quả W10 vào đoạn trạng thái + bảng mode (5 hàng cập nhật, 3 hàng mới: v3.6-core, v3.6-content, QA sweep 47/9) + mục nợ đã biết; lộ trình W1–W9 → W1–W10). Lưu ý: sửa đồng thời với agent D-7 trên CHANGELOG.md — agent đã đọc lại bản hiện tại và giữ nguyên ghi chú chốt D-7. Mọi con số trích từ CAMPAIGN-LOG/báo cáo W10.

## W10 — Tổng kiểm tra & chuẩn bị v3.6 (ĐÃ KIỂM CHỨNG, CHƯA MERGE/PUSH)

Ngày: 2026-11-08, 13:58→14:27 · Nguồn: `dev-loop/audits/QA-SWEEP-W10.md` + các báo cáo `verify-v4*.md`, `dev-v44-rankfix/REPORT.md`, `dev-v45-v36core/REPORT.md`, `dev-v45-v36content/REPORT.md`, `dev-loop/audits/goap-forward-validation-step1.md`, `dev-loop/multiplayer/GAMEBRIDGE-SCORE-RENAME.md`, `dev-loop/tools/balance-sim-report.md`

**QA sweep toàn bộ test — KHÔNG có hồi quy game mới.** Run-all chính 47/9 (56 test); harness
`dev-v42-v35merged` 26/10 (khớp baseline); `dev-v44-audio` 27/10 (thêm test audio PASS);
`dev-v44-footsteps` 26/10 (test-footsteps 73/0); `dev-v44-mapsel-neon` 24/12. Bất biến nguyên vẹn cả 4
bản; md5 bản gộp không đổi. FAIL mới duy nhất so với dev-v37: test-round-flow 53/6 — test regex đòi chuỗi
lý do tiếng Việt cũ, game nay dùng reason key i18n + thiết kế B5 có chủ đích; hành vi không đổi, FSM mô
phỏng vẫn PASS. Test mới W5–W9 đều PASS (tutorial 87/0, model-loader 49/0, perf-harness 33/0, goap-mini
71/0, goap-integration 52/0, neon-pass 68/0, skins 59/0…). Wingman/Arms Race/Retakes vẫn FAIL do 3 mode
chưa gộp vào bản gộp/v44 (đúng chỗ). Khoảng trống: file test-emp-drift-fix KHÔNG tồn tại trong
`dev-loop/tests/` — sửa EMP-drift chưa có test chuyên biệt để kiểm chứng lại (xem mục "Quyết định còn chờ").

**Tester độc lập — 4 bản đều GO CÓ ĐIỀU KIỆN** (điều kiện chung: playtest bằng tai/mắt trên trình duyệt thật):
- 🔧 `dev-v43-neonfix` (nợ từ W8 đã trả): 7/8 FAIL đã sửa (test-maps 386/30 — 29 FAIL Lớp 2 do bản này
  là copy dev-v37 không có chọn map, ngoài phạm vi + 1 sightline chéo); lệch phe ΔA 4,65 s / ΔB 4,63 s
  (chuẩn ≤5 s); bot tới được cả 2 site 0 FAIL (dev-v37: 22 FAIL). Sightline chéo còn lại xác minh bằng
  probe riêng: **73,75 m là thật** (5.082 tia >35 m quét 16 hướng); còn 277 tia dọc/ngang >35 m
  (max 54,5 m) nhưng phình bán kính agent 0,55 m thì còn max 35,25 m, khớp validator.
- 🔧 `dev-v44-audio`: audio-weapons-v2 66/66, weapon-switch 105/105, melee-knife 93/93, toàn suite v44
  27/10 — đúng 10 FAIL cũ, không FAIL mới; module dán nguyên văn 583/583 dòng, đủ 11/11 ủy quyền v2 qua
  sfxBus, shim scout/deagle đã xoá; pack CC0 43 file OGG khớp MANIFEST, 0 mp3, 0 rỗng.
- 🔧 `dev-v44-footsteps`: test-footsteps 73/73 ×2 lần; logic bề mặt đúng số đo buildMap() (5 vũng wet,
  đệm site/concrete, ưu tiên wet > concrete > asphalt; quét lưới 9.879 ô); hook player + botFootsteps đủ
  (pan stereo, cutoff 45 m, guard killcam/replay); diff chỉ 109 dòng. Phát hiện: bản v44 KHÔNG tham chiếu
  file âm nào (toàn synth WebAudio); pack thiếu đúng 2 file asphalt + wet (2 bề mặt chiếm gần hết map đi
  được) — việc thay thân play() bằng phát mẫu thuộc sprint file-first riêng.
- 🔧 `dev-v44-mapsel-neon`: test-maps 415/1 ×2 lần (FAIL duy nhất sightline chéo 73,8 m đã biết),
  test-mapsel 62/62, FSM chuyển 3 map 119/119, map-validator 150 boxes / 2 vi phạm / 35,4 m giống hệt
  dev-v43; đủ 7 thay đổi Neonfix đối chiếu từng tọa độ. Xác minh độc lập lỗi test fnBody là thật (logic cũ
  trúng comment buildMap dòng 3079; đối chứng dev-v42 cho 413/3 đúng tuyên bố).

**Sửa lỗi đã kiểm chứng:**
- 🔧 Rank F1/F2 (`dev-v44-rankfix`, copy dev-v43-rank): F1 — `rankBuildRecord()` ép leaver luôn 'loss'
  (leaver dẫn 5–4: W = −14, ΔRP < 0, winStreak = 0; trước sửa W = +18); F2 — snapshot clutchEnemies lúc
  plantBomb, endRound dùng snapshot (1v2 → 4 CP, 1v3 → 6 CP, 1v5 → 10 CP; trước sửa đều dừng ở 2).
  Test mới test-rankfix-v44.js 25/0 (trên dev-v43: 11/14 — tái hiện đúng 2 lỗi); test-rank-integration
  48/48. Còn tồn đọng: bỏ trận sớm (<10 round, chưa ai chạm 6) vẫn không bị phạt theo thiết kế module.
- 🔧 Tutorial Bài 5 (`dev-v44-tutorialfix`, copy dev-v43-tutorial): runner sửa label/banner sang [Q],
  2 ghi chú host sửa theo; INTEGRATION-tutorial.md sửa thành lesson-start + lessonId 'bomb' (runner không
  emit 'sim'); test riêng 87/87. Quyết định: giữ id nội bộ 'e'/notify key 'E' (không hiển thị).
- 🔧 Fallback pointer-lock (`dev-v45-lockfix`, copy dev-v42-v35merged): helper tryLock() bọc try/catch +
  .catch cho cả 3 đường gọi lockPointer() (dòng 5035–5044); test-lockfix.js mock mới 14/14 (đối chứng bản
  gốc sinh 1 unhandledRejection NotAllowedError, bản sửa 0). Lưu ý: test-pause-settings FAIL có sẵn trên
  cả bản gốc v42-v35merged (viết cho dev-v35, lệch từ trước), không phải hồi quy.

**Gộp v3.6 — 2 bản riêng, đều GO CÓ ĐIỀU KIỆN:**
- ✨ v3.6-core (`dev-v45-v36core/index.html`, 7.427 dòng, nền v3.5 5.706 dòng; diff 68 xoá / 1.789 thêm):
  (1) Three.js r187 (importmap 0.187.0, HDRLoader, THREE.Timer + setAnimationLoop, PCFShadowMap;
  test-three187 18/18); (2) 2 lỗi Cao audit-abilities — DRIFT X lộ diện, NULL EMP phá storm/chain/decoy
  (test-emp-drift-fix 21/21 — nhưng xem khoảng trống QA sweep về vị trí file); (3) GOAP goap-mini +
  kill-switch (test-goap-integration 52/52; vòng kín S7 planCalls 260 vs S0 1.524, kills 35 vs 33; GOAP
  tắt → log gọi hàm giống hệt bản gộp); (4) perf-harness + ?profile=1 (test-perf-v45 mới 17/17,
  test-perf-harness 33/33). Run-all: baseline 26/10 → 29/11 (4 test mới đều PASS; killcam 23/0;
  test-perf-budget 4/8 → 5/8 nhờ harness; +1 FAIL là test-pause-settings — harness cũ đặt đích mặc định
  sai dev-v39-three187 nên baseline PASS giả, chạy trực tiếp lên bản gộp gốc cũng FAIL y hệt; trên v45 là
  201/7). Xung đột đã xử lý: GOAP KHÔNG lấy nguyên văn dev-v42-goap — trích lại botDefuseDuty/botCombat/
  botTravel từ updateBot bản gộp để giữ B11 (bán kính gỡ 2,4 m, EVLOG.bombDefuse, reason.defused) và
  BUG-05 hysteresis. 2 điểm chờ duyệt giữ nguyên (BOT_FALLOFF_KEY='rifle', outlineWidth: 0). Việc còn lại:
  playtest B5 bắt buộc trước GO hẳn.
- ✨ v3.6-content (`dev-v45-v36content/index.html`, 6.762 dòng, nền v3.5 5.706 dòng; 5 bản nguồn md5
  nguyên): (1) mapsel + Neonfix — sau bước 1 byte-identical với dev-v44-mapsel-neon, test-maps 415/1,
  test-mapsel 62/62; (2) audio-weapons-v2 — 8/8 hunk áp sạch, test 66/66; (3) footsteps — 8/11 hunk qua
  patch, 3 hunk xử lý tay, test thích ứng 73/73. Xung đột chính mapsel × footsteps đã xử lý: đệm spawn
  footsteps hardcode (±44,0) vs spawn Neonfix (T −11 / CT 52) — surfaceAtMap giờ tra động
  [T_SPAWN.x, CT_SPAWN.x], đúng cả FOUNDRY/HARBOR khi chuyển map; test-hero-swap A2 chốt cứng T_SPAWN
  (−44,0,0) đã cập nhật sang (−11,0,0) trong bản copy test v45 → 80/0. Run-all: baseline 26/10 → 29/11
  (10 FAIL y hệt baseline + 1 test-maps.js do sightline chéo 73,8 m đã biết, không phải regression); bất
  biến nguyên; âm thanh synth thuần, 0 tham chiếu assets/audio/. Còn lại: playtest thật cả 3 map + kiểm
  chứng bằng tai; sau khi nghe đạt mới xoá block gun-sound-pack cũ.

**Hệ thống khác:**
- ✨ Gắn key i18n 531 (`dev-v45-i18n`, copy dev-v42-v35merged): từ điển inline trong bản chỉ có 312 key
  trong khi module W9 đã 531 key — đã chèn 221 key thiếu (copy nguyên văn, 0 giá trị lệch); inline nay 532
  key = 531 module + reason.teamWipedPlanted (key riêng bản này, thiếu trong module, ghi lại đợt sau); xoá
  ability.energyOf khỏi inline theo quyết định W5. Gắn 47 key có chuỗi hardcode thật (31 tĩnh data-i18n,
  16 động qua t()): settings 22, share 9, boot 8, stats 4, end 2, ctl.switchOperator,
  pause.restartConfirm. Kiểm chứng trên đúng bản đích: parity 531/531, test-syntax 4/4, test-constants
  17/17, smoke t() 46/46 key mới dịch được VI+EN; key thực sự định tuyến 243 → 290/531 (54,6%; 66,7% nếu
  tính op.* động). Lưu ý: coverage tool 85,6% → 84,2% là dương tính giả của phép đo (gắn key xong literal
  biến mất nên tử + mẫu cùng giảm; đơn vị 284→266) — không phải thụt lùi. 177 key W9 không gắn được vì
  tính năng chưa có trong bản này (mode/arms/retakes/wingman, rank, prog, pass, skins, tut, practice) —
  key đã có sẵn trong từ điển inline nên khi tích hợp chỉ việc gọi t('key').
- ✨ Lớp file-first cho audio CC0 — module mới `dev-loop/modules/audio-file-loader.js` (tra EVENT_MAP 43
  URL, tải OGG local fetch + decodeAudioData, cache AudioBuffer, luân phiên round-robin, fallback synth qua
  callback, play() luôn resolve file/synth/none, không bao giờ throw; preload chia đợt 8, stopLoops cho
  hum_loop; gain theo công thức v2); test mới test-audio-file-loader.js 56/56 PASS (mock fetch +
  AudioContext giả + đối chiếu đĩa thật); test-modules 138/138. **Đối chiếu 12 vs 14 — KẾT LUẬN ĐÚNG LÀ
  12**: weapons/ có 12 file / 120.367 B, tổng ship 43 file / 506.291 B khớp từng file + kích thước với
  MANIFEST.md; con số 14 là lỗi đếm trong tiêu đề §4 của dev-v44-audio/REPORT.md (bảng liệt kê ngay dưới
  chỉ có 12 tên distinct; script build chỉ sinh 12 file) — không có file thừa/thiếu; đã ghi mục đối chiếu
  vào MANIFEST.md. File còn thiếu thật (không tải thêm): dp50_shot.ogg, knife_draw/knife_hit_*, reload theo
  bước, deploy/holster, scope_in/out, footstep metal/wet — đều đi thẳng synth v2; gap: impact:* chưa có
  synth fallback (file phủ đủ 5 loại, nếu file lỗi sẽ im lặng). Còn lại: dán module vào bản đích + nghe
  thử (chốt ngữ nghĩa round_win/round_lose, volume hum_loop); assets/audio/ phải serve qua http(s) —
  file:// rớt về synth. Không sửa file game/build.
- ✨ GameBridge đổi scoreAtk/scoreDef — đổi tên xuyên suốt 5 file (GameBridge.js, events.js,
  lobby-client.js, matchend-e2e.js, LOBBY.md §7); node --check đạt cả 4 file JS. Phát hiện quan trọng:
  State.js KHÔNG có shim code nào (chỉ 3 comment lịch sử D-3, giữ nguyên) — shim thật nằm ở GameRoom.js
  endRound() dòng 910–918; agent dừng đúng ở bước gỡ shim theo lệnh cấm sửa GameRoom.js/LobbyRoom.js
  (mtime xác minh 2 file không bị đụng). Hai key legacy còn trong payload event nội bộ nhưng không còn ai
  đọc. Test trước → sau không hồi quy: smoke-lobby-game 19/19, d8-rejoin 9/9, filter-test 59/59 gating,
  rejoin-token-check 26/26, hostile-client 1 PASS + 4 SKIP / lobby gate 17/0/4, matchend-e2e 33/33. Bằng
  chứng quyết định: round 6 sau sửa gfA={"scoreAtk":6,"scoreDef":0} qua WebSocket thật (trước:
  scoreT:6, scoreCT:0). **Còn dở: gỡ 2 dòng legacy scoreT/scoreCT trong GameRoom.js endRound() (dòng
  917–918) + comment 910–913 — cần đợt riêng hoặc phê duyệt vì chạm GameRoom.js đang freeze; sau khi gỡ
  chạy lại matchend-e2e.**
- ✨ Balance-sim chạy lại (WEAPONS thật từ dev-v42-v35merged, SG-12 killReward $600 đã nằm trong game;
  thêm dao KN-9 $1000/hạ; gắn falloff P9 tuyến tính): Python chạy 2 lần giống hệt, tự kiểm 8/8 PASS; đối
  chiếu JS 12/12 ô tiền khớp, TTK khớp (trừ 1 ô làm tròn hiển thị). Kết quả: kinh tế **GIỐNG HỆT** báo
  cáo $600 (W5) — snowball SG-12 đứng yên (thu kill $13.680–$15.840/24 round, 2,29–2,66× VK-7, KPR suy ra
  ~0,95 — chưa phải KPR đo thật); TTK chỉ P9 ở 40 m thay đổi (thân không giáp 4→5 phát, đầu không giáp
  1→2 phát); P9 one-tap hết ở ~28,1 m (còn phần dư P2: sightline Neon 25–35 m vẫn chồng vùng one-tap
  25–28 m ở round pistol); VK-7 vẫn $1.500 (spec $2.700); MG-75 pen 2 vẫn chỉ là dữ liệu. Không có mất
  cân bằng MỚI P0/P1 → không thêm mục LÀM LẠI. Nợ sổ sách: BACKLOG:77 falloff đã có trong merged nhưng
  vẫn để mở; comment stale "SG-12 $900" dòng 3819 vẫn còn (đã có BACKLOG:94).
- ✨ D39 GOAP forward-validation bước 1 — harness mới `dev-loop/tools/goap-forward-validate.js` (mô phỏng
  tiến độc lập, parity domain 18 action khớp goap-mini 18/18; SELF-CHECK 37/0 ×2 lần): validatePlan OK
  5/5, lượt sạch đạt goal 5/5, lệch duy nhất 1/13 bước — Δmoney +$300 ở Engage (kill reward tick() cộng
  nhưng planner không mô hình hoá; đề xuất cộng vào trajectory planner ~0,1 ngày, làm cùng A1); 0 lệch
  fact boolean; lượt nhiễu gãy đúng bước bị nhiễu 4/4 ca. Phát hiện phụ quan trọng: **UseAbilityQ là dead
  action** trong domain production (effect duy nhất enemyWeak không goal/action nào cần; goap-mini đã bỏ
  effect siteClear của Q so với topic 17 action) — ca S3 "flash entry" của topic không tái hiện trên
  goap-mini, cần chốt lại semantics Q trước khi port reorder (A2). Kết luận: plan đáng tin khi thế giới
  đứng yên; validation lúc plan không thay thế validation lúc chạy. Phần còn lại reorder + validation đầy
  đủ (A1–A6, ~2 ngày, thứ tự: chốt semantics Q → A2 → A3 → A1 → A4 → A5 → A6). goap-mini.js không sửa,
  không reorder, không chạm game/build.
- ✨ README + CHANGELOG — chỉ sửa 2 file docs (REPO-README.md viết lại theo trạng thái thật 08/11;
  CHANGELOG.md thêm mục v3.5 + bản dev đã kiểm chứng + 7 quyết định còn chờ). Ghi rõ: bản chính hiện tại
  v3.4 (staging), v3.5 đã kiểm chứng chưa merge/push; bảng trạng thái từng mode/hệ thống kèm số test thật;
  ?profile=1 chỉ có trên bản perf, không có trong bản chính; SG-12 $900→$600; kích thước file đo thật
  (v3.4 ~273KB, v3.5 ~366KB); mục nợ đã biết trung thực. Lưu ý: không có README.md ở gốc workspace —
  file README là REPO-README.md; repo-staging/README.md vẫn giữ nội dung v3.4 cũ, phiên chính đồng bộ
  khi merge v3.5; tài liệu này (mục W10 trên đây) được viết sau khi W10 về, cập nhật đầy đủ kết quả W10.

## v3.5 — Gộp 8 tích hợp W2 + sửa 2 lỗi chặn (ĐÃ KIỂM CHỨNG, CHƯA MERGE/PUSH)

Ngày: 2026-11-08 · Bản gộp duy nhất: `dev-v42-v35merged/index.html` (5.706 dòng, md5 `5d15195d…`,
nền `dev-v37` = v3.4; kèm 3 module ESM `event-log-core.js`, `stats-tracker.js`, `crosshair-customizer.js`)

**Kết luận tester độc lập (W8, `dev-loop/audits/verify-v42-v35merged.md`): GO CÓ ĐIỀU KIỆN.**
Diff kiểm chứng sạch: đúng 51 dòng đổi tên `t`→`tNow` so với `dev-v41-v35fix`, 0 thêm/xoá; kiểm tra
thuần đổi tên (sed `tNow`→`t` rồi diff) rỗng; harness endround 16/16; hero-swap 80/0; killcam 23/23;
test-constants 17/17; node --check đạt cả 3 block script; bất biến nguyên (WIN_SCORE 6, ROUND_TIME 115,
PLANT_TIME 3.2, headMult ×4). Điều kiện còn lại trước merge/push: (1) đồng bộ bản sao test-hero-swap
trong harness v42 — **ĐÃ XONG ở W9** (80/0 ×2 lần); (2) playtest trình duyệt thật 1 vòng round
(đổi operator + cast Q/E/X từng operator, xem announce đã dịch).

**Tính năng mới (8 tích hợp, mỗi bản đã qua tester độc lập GO ở W3):**
- ✨ Event log + thống kê sau trận (`dev-v38-stats`): hook vòng đời trận/combat/kỹ năng/kinh tế/nạp đạn;
  bảng tổng kết cuối trận + nút xuất JSON; HUD sau mỗi round hiện 4s. Kiểm chứng: smoke-test Node 22/22,
  test-event-log 85/85.
- ✨ Crosshair tuỳ biến kiểu CS2 (`dev-v38-crosshair`): 14 preset (6 thường + 8 Okabe–Ito), mã chia sẻ
  `NDCH1.…`, di trú 1 lần từ cài đặt cũ, fallback khi module lỗi. Kiểm chứng: test-modules B8 7/7,
  test-constants 17/17.
- ✨ HUD P0 (`dev-v38-hud`): viền tối crosshair/hitmarker (crosshair vs đen 18,06:1, vs xám giữa 3,40:1),
  cảnh báo sắp hết đạn (≤25% băng), cụm đạn ≤600px, tuỳ chọn tỉ lệ HUD 0,8–1,2 (lưu localStorage).
- ✨ Damage falloff theo khoảng cách (`dev-v38-falloff`): P9 headshot 25 m = 104 dmg (vẫn one-tap) →
  45 m = 78 (hết one-tap); VK-7 thân 3 viên ≤20 m → 4 viên ở 30 m. Kiểm chứng: test-falloff 111/111,
  test-falloff-verify 62/62.
- ✨ Đổi màu Operator (`dev-v38-recolor`): TETHER lime #9dff2e, DRIFT indigo #728cff, NULL magenta #ff3d7e,
  WHISPER #bd7dff, decoy minimap #7de8ff nhấp nháy, UI --cy #38b6ff, ult-ready trắng-nóng; grep hex cũ = 0.
  Chuẩn hoá ngược giá trị mới→cũ cho diff rỗng so với v37 — diff thuần giá trị màu, không đổi logic.
- ✨ Font Be Vietnam Pro + i18n 311 key (`dev-v38-i18n`): subset vietnamese U+1EA0 đủ dấu (Orbitron/Rajdhani
  giữ làm fallback); 310/311 key đã gắn; nút #btn-lang chuyển nóng không reload; parity 311/311.
  Bao phủ thật đo đúng bản đích là 82,4% (không phải 91,7% — con số cũ đo nhầm file chưa tích hợp).
- ✨ Sprint #5 bắn + economy (`dev-v38-econ`): sửa 12/16 lỗi audit-shooting (reload theo đồng hồ game,
  p9Penalty tự hồi, hitbox đầu 0,30→0,24 / thân 0,55→0,42) + 11/13 lỗi audit-bot-economy (chết mất
  primary+giáp, thưởng kill chỉ ở live/planted, plant bị ngắt khi di chuyển >0,5 m/s hoặc dính sát thương).
  Kiểm chứng: test-economy 107/0, test-abilities 139/139, test-pause-settings 208/0.
- ✨ Độ tin cậy (`dev-v38-robust`): dispose() cho destroyFx/tracer/spawnBots/bombMesh (dòng chứa "dispose"
  3→17); overlay #boot-error + watchdog 8s khi CDN fail; try/catch WebGLRenderer; reset phím khi
  blur/Alt-Tab/pointerlockchange. (Đính chính số liệu: 4.244 dòng / 99 thêm / 7 xoá, không phải 4.258/106.)

**Sửa lỗi chặn (tìm ra bởi tester W5, sửa ở W6, tester chạy lại GO):**
- 🔧 `ReferenceError: reason is not defined` ở cuối mọi round — `endRound()` dòng 4699 gọi
  `EVLOG.roundEnd({…, reason, …})` trong khi chữ ký sau i18n là `(usWin, reasonKey, reasonParams)`;
  event log thiếu sự kiện hết round, bảng thống kê sau round không render. Sửa 1 dòng
  (`reason` → `reason: reasonKey`, `dev-v41-v35fix`); harness mới 16/16 PASS, đối chứng bản gốc 10 FAIL.
- 🔧 Biến cục bộ `const t = nowS()` che hàm dịch `t()` toàn cục trong 6 hàm (doSwap, castQ, castDriftQ,
  castE, castX, updateEffects) → `TypeError: t is not a function` mỗi lần đổi operator/cast kỹ năng.
  Sửa 51 dòng đổi `t`→`tNow` (`dev-v41-tfix`); bản nền 6/6 TypeError → bản sửa 6/6 PASS;
  hero-swap 80/0 sau khi sửa 3 regex A6d/A6e/A6h trong test.

**2 điểm chờ duyệt — GIỮ NGUYÊN trong bản gộp (xem mục "Quyết định còn chờ" cuối file):**
- (a) falloff đạn bot giữ đường cong rifle (`BOT_FALLOFF_KEY='rifle'`, dòng 981) — trái đặc tả
  INTEGRATION-falloff §5; rủi ro: bot chỉ giao chiến ≤40 m nên damage giảm tối đa ~11,5%, nhưng
  hitChance bot đã giảm theo cự ly nên tầm xa phạt bot 2 lần; rollback chỉ cần xoá 2 điểm móc + 1 dòng key.
- (b) crosshair `outlineWidth` mặc định 0 (`crosshair-customizer.js:80,95`) — viền tối P0 mất lúc chạy
  vì `toCSS()` ghi đè box-shadow; bản sửa riêng `dev-v40-crosshair` đã đổi mặc định thành 1 (test 13/13),
  sẽ vào v3.6 dù v3.5 giữ 0.

## Bản dev đã kiểm chứng (chưa phát hành) — chiến dịch 10 giờ, 2026-11-08

Mỗi bản là một bản sao riêng, không sửa bản nền; tester độc lập đã kiểm chứng. **Chưa gộp vào bản
chính, chưa playtest bằng mắt trên trình duyệt thật.** Chi tiết đầy đủ trong `CAMPAIGN-LOG.md`.

### Chế độ chơi mới
- **Retakes 3v3** (`dev-v41-retakes-fix`) — freeze 5s, bomb đặt sẵn 35s, thắng 4 round, loadout theo tier,
  economy tắt. Tester W6 **GO**: test-retakes 120/120; mô phỏng 800/800 round bot thủ đúng site
  (bản trước NO-GO do bot thủ nhầm site — đã sửa bằng cách dời `pickRetakeSite()` lên trước `spawnBots()`).
- **Wingman 2v2** (`dev-v41-wingman`) — 1 ally NULL + 2 địch giữ site B, buy 10s / live 80s, thắng 5 round,
  tiền đầu $800, nửa map A khoá bằng 4 blocker. Tester W7 **GO CÓ ĐIỀU KIỆN**: test-wingman 109/109.
- **Arms Race FFA** (`dev-v41-armsrace`) — 6 người, 480s, thang 8 nấc (shotgun→rifle→deagle→lmg→smg→
  pistol→scout→knife), dao giáng nấc, respawn 1,2s, giáp 50, bảo vệ spawn 2s, regen 25 HP/s sau 4s.
  Tester W7 **GO CÓ ĐIỀU KIỆN**: test-armsrace 159/159; killcam/replay 23/23 trên bản này.

### Map mới + chọn map
- **Map FOUNDRY + HARBOR + chọn map** (`dev-v42-mapsel`, đồng bộ Neonfix ở `dev-v44-mapsel-neon`) —
  registry MAPS 3 key, `buildMap(mapKey)`, bot A* theo map, menu #map-grid, lưu lựa chọn localStorage.
  Tester W8 **GO CÓ ĐIỀU KIỆN**: test-mapsel 62/62; test-maps 415/1 (FAIL duy nhất: sightline chéo Neon
  73,8 m đã biết); validator FOUNDRY/HARBOR PASS. Sửa kèm 2 gốc rễ bot kẹt thật (epsilon 1mm khi đẩy
  khỏi collider; chỉ bỏ điểm cua khi đoạn thẳng thật sự thông).
- **Sửa map Neon** (`dev-v43-neonfix`) — dời spawn T (−44,0)→(−11,0), CT (44,0)→(52,0), tách khe giữa
  3,0 m, 8 màn chắn sightline, dời 2 crate khỏi tâm site. Lệch phe ΔA 4,65 s / ΔB 4,63 s (chuẩn ≤5 s);
  test-maps 386/30 (29 check Lớp 2 là bản copy dev-v37 không có selector — ngoài phạm vi). Còn 1 FAIL:
  sightline chéo 73,8 m (đã chấp nhận như giới hạn chuẩn đo).

### Hệ thống meta (build trên nền dev-v37, phải port lên nền v3.6 + nối cross-wiring)
- **Progression** (`dev-v43-prog`) — XP/cấp/nhiệm vụ ngày-tuần-sự nghiệp/uy tín; thắng 6 round/10 kill/
  3 assist/1 plant/MVP = 775 XP; rời sớm 0 XP −1 uy tín. Tester W9 **GO CÓ ĐIỀU KIỆN**: test 49/49.
- **Solo Rank** (`dev-v43-rank`) — 9 bậc (Sắt→Neon Legend), ΔRP = clamp([W+RD+PERF+streak]×K_diff, −32, +48),
  placement 5 trận, chống farm (trần Easy 599, cổng Hard lên Kim Cương+), decay Kim Cương+.
  Tester W9 **GO CÓ ĐIỀU KIỆN, 2 lỗi bắt buộc sửa trước khi GO hoàn toàn**: F1 leaver khi đang dẫn bị ghi
  thắng (chỉ −10 RP); F2 mất điểm clutch 1vX khi đặt bomb rồi gục. Test 48/48. **Đã sửa ở W10**
  (`dev-v44-rankfix`, test mới 25/0: leaver dẫn 5–4 nay W = −14, ΔRP < 0; clutch 1v2→4 CP, 1v3→6 CP,
  1v5→10 CP); còn playtest thật trước khi đưa rank vào v3.6.
- **Skins** (`dev-v43-skins`) — 58 bản ghi (16 weapon finish, 8 operator outfit, 6 charm, 12 sticker,
  16 Standard), chỉ cosmetic, `validateCatalog()` 0 lỗi; 31 trường gameplay lạ đều bị gate từ chối.
  Tester W9 **GO CÓ ĐIỀU KIỆN**: test 59/59. Giới hạn v1: mở khoá cuối trận chưa nối progression.
- **Neon Pass** (`dev-v43-neonpass`) — 30 bậc (tổng 70.800 XP) + Epilogue 5 bậc; Free/Premium (1.000 credits,
  hồi tố đầy đủ); anti-FOMO; thưởng chỉ cosmetic. Tester W9 **GO CÓ ĐIỀU KIỆN**: test 68/68.
- **Tutorial 6 bài + Practice Range** (`dev-v43-tutorial`) — chạy đủ 6 bài tới TỔNG KẾT, tiền giả lập $3700
  cô lập khỏi economy thật. Tester W9 **GO CÓ ĐIỀU KIỆN**: test 87/87. Sai lệch đã biết: text Bài 5
  ghi [E] trong khi vệt lửa do Q tạo — **đã sửa ở W10** ([E]→[Q], `dev-v44-tutorialfix`, test riêng
  87/87; giữ id nội bộ 'e'/notify key 'E').

### AI, hiệu năng, đồ hoạ
- **GOAP** (`dev-v42-goap`) — forward-A* + think loop A1–A6 (cache, backoff, wakeup), kill-switch 3 lớp
  (SETTINGS.goap mặc định bật + checkbox + fallback legacy sau 3 lần adopt không tiến triển).
  Tester W9 **GO CÓ ĐIỀU KIỆN**: test-goap-integration 52/52 (planCalls −82,5% vs legacy, kills 33→35);
  test-goap-mini 71/71 sau khi sửa bug A4 backoff ở W9 (thêm 1 dòng `bs.planGoal = goalName`, paste đã
  đồng bộ lại vào build). Bench: think −82,3%, plan calls −78,7%, goal-met +11,7%. Claim cũ "BFS chậm
  ~9×/19×" đã đính chính (đo thật: 0,7×–1,83×). Forward-validation bước 1 **đã xong ở W10**
  (validate 5/5, lệch duy nhất Δmoney +$300 ở Engage); phát hiện UseAbilityQ là dead action — cần chốt
  semantics Q trước khi reorder (D39, ~2 ngày, thứ tự: chốt semantics Q → A2 → A3 → A1 → A4 → A5 → A6).
  Chưa làm: reorder A1–A6 + validation đầy đủ.
- **Three.js r160 → r187** (`dev-v39-three187`) — RGBELoader→HDRLoader, Clock→Timer, PCFSoft→PCFShadowMap,
  setAnimationLoop. Tester **GO CÓ ĐIỀU KIỆN**: run-all 26/4 (baseline 25/4, 0 regression), killcam 23/23.
  Còn: playtest mắt (bóng đổ, menu orbit) + cập nhật test-pause-settings gốc.
- **Model bot Quaternius UBC+UAL, CC0** (`dev-v41-quat2`) — loader 2 file (thân + clip), clip map 5/5 khớp
  tên thật, tint thân 0,25, visor gắn xương Head; ual-lite.glb 1,63 MB (6 clip), tải lần đầu 17,69→6,46 MB.
  Tester W5 **GO CÓ ĐIỀU KIỆN**: test-model-loader 49/49. Phát hiện: model nhìn +Z đúng, không cần xoay bù
  như kế hoạch dự đoán. GLB chỉ có local, không push được bằng push-files text-only.
- **Hiệu năng** — diệt GC cụm bot (`dev-v40-perfgc`: 47 điểm cấp phát → 4, per-frame-alloc 17→6);
  feel di chuyển (`dev-v40-movefeel`: dừng thụ động 276 ms → 168 ms, sát mốc Valorant 160 ms; coyote
  0,09s, jump buffer 0,10s, FOV kick +4°); bot dùng kỹ năng operator (`dev-v40-botskills`: test 128/128);
  instancing (`dev-v40-instancing`: draw call 55→38, tester W5 GO có điều kiện); cân bằng map
  (`dev-v40-mapbal`: chênh CT–T 9,73–9,89 s → 5,49 s); bot peek (`dev-v40-peek`: test 32/32);
  sửa 2 lỗi Cao audit-abilities (`dev-v39-abilities`: DRIFT X bắn lộ diện, NULL EMP phá storm/chain/decoy —
  tester W4 GO, 181/181) + 14 lỗi TB/Thấp (`dev-v40-abilities2`: test mới 51/51); perf HUD
  (`dev-v41-perfhud`: test-perf-hud 15/15, tester GO có điều kiện — mặc định perf:false chờ phiên chính chốt);
  perf-harness + auto-driver `?profile=1` (`dev-v39-perf`: test 33/33) và overdraw-meter
  (`dev-v42-perf2`: test 33/33, tester GO có điều kiện — số trình duyệt thật vẫn chờ chạy).
- **Âm thanh** — pack CC0: 43 file OGG ship (~494 KiB), 6 pack Kenney CC0 đã kiểm chứng license
  (`assets/audio/`); 13 file Freesound cần tài khoản nên chưa lấy được (không dùng preview mp3).
  Tích hợp audio-weapons-v2 (`dev-v44-audio`: test 66/66) + footsteps theo bề mặt map HD
  (`dev-v44-footsteps`: test 73/73, asphalt/concrete/wet + tiếng bước chân bot theo khoảng cách/pan).
  Lưu ý: tiếng súng Kenney chỉ là placeholder laser — tiếng súng thật là 13 file Freesound; lớp file-first
  đã xong ở W10 (`dev-loop/modules/audio-file-loader.js`, test 56/56 — weapons/ đúng 12 file, không phải
  14) nhưng chưa dán vào bản đích, game vẫn dùng synth làm mặc định.
- **i18n** — từ điển 319 → **531 key** VI/EN (W9), parity 531/531, bao phủ thật đo đúng từng bản đích
  85,6–92,2%; không còn chuỗi UI thật nào chưa có key. **Đã gắn ở W10**: 47 key vào `dev-v45-i18n`
  (parity 531/531, key thực định tuyến 243→290/531); 177 key chưa gắn được vì tính năng (mode/meta) chưa
  có trong bản này — key đã nằm sẵn trong từ điển inline nên khi tích hợp chỉ việc gọi `t('…')`.

### Multiplayer alpha nội bộ (chưa phải sản phẩm)
- Server Colyseus 0.18 (`dev-loop/multiplayer/`): lobby↔game nối xong (token HMAC-SHA256, smoke lobby→game
  17/17, rejoin 9/9, matchEnd E2E 33/33 qua trận thật 6 round); chống wallhack bằng view/tag
  (filter-test 59/59, hostile-client lobby VERDICT PASS — phát hiện quan trọng: field đã tag fail-closed
  khi quên gán view, không rò rỉ im lặng như kế hoạch dự đoán); shot_id dedup + đo latency live
  (ALL GATING CHECKS PASSED); latency-sim LS-01…LS-06 đạt theo ngưỡng (sim, chưa live đầy đủ);
  D-3 căn chỉnh schema vs code (phase planted, 3 timer riêng, bomb 35s, buy 12s, input/tick 60Hz — toàn bộ
  suite PASS, không hồi quy). Còn thiếu: rate-limit message, UI lobby trong game chính, bot đặt bomb,
  chuyển carrier khi carrier bị bắn chết; GameBridge đã đổi sang scoreAtk/scoreDef ở W10 (5 file,
  matchend-e2e 33/33) — shim legacy scoreT/scoreCT còn trong GameRoom.js endRound() dòng 917–918, chờ
  phê duyệt gỡ (xem mục "Quyết định còn chờ").

### QA
- **Smoke Playwright slow-VM (W9): cả 3 test PASS lần đầu** trên SwiftShader VM (Test 2: 19,3 phút,
  Test 3: 22,6 phút, 0 console error/pageerror) — xem `SMOKE-REPORT.md` §11. Vẫn cần chạy lại trên PC
  có GPU thật. Phát hiện phụ: fallback `canvas.requestPointerLock()` thiếu `.catch` gây pageerror flaky
  ~2/5 lần — **đã sửa ở W10** (`dev-v45-lockfix`, test 14/14; bản gốc sinh 1 unhandledRejection,
  bản sửa 0).
- **QA sweep W10: không hồi quy game mới.** Run-all chính 47/9 (56 test); FAIL mới duy nhất
  test-round-flow 53/6 do test regex cũ (game dùng reason key i18n). Khoảng trống: file test-emp-drift-fix
  không có trong `dev-loop/tests/` — cần xác minh vị trí trước khi coi kết quả 21/21 của bản gộp core là
  bằng chứng.
- **Cân bằng SG-12 ở $600: snowball CÒN.** Mô phỏng chạy lại: thu nhập kill SG-12 giảm đúng 1/3
  (xen kẽ $20.520→$13.680), tỉ lệ SG-12/VK-7 từ ~3,8× xuống 2,3–2,7×, nhưng cờ SNOWBALL vẫn bật cả 4 kịch
  bản và vẫn chạm trần $9.999 ở 3/4 kịch bản; chỉ cắt ≲$346 mới tắt được cờ trong mô hình KPR farm 1,4
  cố định. Quyết định: giữ $600, đo KPR thực tế bằng playtest trước khi cắt tiếp. **Chạy lại ở W10 trên
  bản gộp (đã có falloff): kinh tế giống hệt báo cáo $600** — thu kill $13.680–$15.840/24 round,
  2,29–2,66× VK-7, KPR suy ra ~0,95; P9 one-tap hết ở ~28,1 m; không có mất cân bằng mới P0/P1.

## Quyết định còn chờ Sharon / phiên chính

*(Cập nhật ở W11: mục 7, 9, 11, 12 đã xong; thêm mục 13–16.)*

1. **v3.5 — 2 điểm chờ duyệt trước khi merge/push:** (a) falloff đạn bot giữ đường cong rifle
   (`BOT_FALLOFF_KEY='rifle'`) hay bỏ để bám đúng đặc tả §5; (b) crosshair `outlineWidth` mặc định 0
   (v3.5) hay 1 (bản sửa `dev-v40-crosshair` đã có, vào v3.6).
2. **Merge/push v3.5** từ `dev-v42-v35merged` (sau playtest 1 vòng round thật).
3. **Playtest trình duyệt thật hàng loạt** — v3.5, Retakes, Wingman, Arms Race, map FOUNDRY/HARBOR,
   Quaternius (hướng mặt/visor), instancing (biển/chữ site), movefeel (A/B 3 preset), GOAP, audio/footsteps
   bằng tai, checklist i18n §4, B5 r187; chạy `?profile=1` đo p95 thật trên PC; chạy smoke trên PC có GPU.
4. **Rank F1/F2** — **đã sửa ở W10** (`dev-v44-rankfix`, test 25/0); cần tester chạy lại + playtest thật
   trước khi đưa rank vào v3.6.
5. **Neon gốc**: chấp nhận sightline chéo 73,8 m như giới hạn chuẩn đo (đã xong 7/8 FAIL) hay lát thêm cover.
6. **SG-12 $600**: giữ và đo KPR thật, hay cắt tiếp về ~$450 (probe vẫn bật 3/4 cờ) — xem mục cân bằng trên.
7. **Multiplayer D-7**: ✅ ĐÃ CHỐT 2026-11-08 (đợt W11): giữ kết nối lobby mở suốt trận là hành vi chuẩn (mặc định đã kiểm chứng); rời lobby khi vào game chỉ là phương án dự phòng R5 — xem W6-PLAN §3.1 D-7 và LOBBY.md §11.1.
8. **Thứ tự v3.6** (core trước, meta sau, audio sau cùng).
9. **Gỡ shim scoreT/scoreCT trong GameRoom.js** — ✅ ĐÃ XONG ở W11 (đổi tên hoàn tất xuyên suốt code + tool; endRound dòng 910–918 cũ → 910–913; matchend-e2e 33/33 sau gỡ; chỉ còn comment lịch sử trong State.js + GameRoom.js:911 + events.js).
10. **Đối chiếu "dev-v44 đạt 35,4 m" vs phép đo sightline 73,8 m** — P0 duy nhất còn mở theo QA sweep W10:
    validator báo 35,4 m trong khi test-maps + probe độc lập đo sightline chéo 73,75 m thật; cần chốt xem
    con số nào là chuẩn đo đúng trước phát hành (lệch phe 13,24/14,41 s trong QA sweep cũng cần đối chiếu
    với ΔA 4,65 s / ΔB 4,63 s đã đo ở Neonfix).
11. **Vị trí file test-emp-drift-fix** — ✅ ĐÃ XÁC MINH ở W11 (bản chuẩn trong `dev-loop/tests-v45-v36core/`; đã copy vào `dev-loop/tests/`, chạy 21/21 trên v36core; đối chứng âm dev-v37 FAIL 10/21 — không phải 9 như builder W3 ghi).
12. **Gộp core+content thành v3.6 thống nhất** — ✅ ĐÃ XONG ở W11 (`dev-v46-v36`, 8.940 dòng, GO có điều kiện, run-all 35/11); còn playtest B5 bắt buộc + nghe thử audio/footsteps bằng tai trước khi merge/push v3.6.
13. **test-pause-settings trên v46 còn 201/7** (C16, D9–D13, D19 — test viết cho panel crosshair v3.5/inline, chưa theo panel module #ch-panel của v3.6) — W12 đang sửa; trên v35merged đã về 208/0 ở W11.
14. **2 key i18n thiếu trong module** (menu.mapTitle, reason.teamWipedPlanted — đã có trong inline của bản v46) — cần thêm vào module để parity 532/532 (W12 đang làm).
15. **Đính chính topic goap-forward-validation-reorder** — thực tế 16/16 plan không-null, không phải 18/18 (W12 đang sửa docs, chỉ 1 dòng đính chính).
16. **Chốt trần geometry/material mới cho game 3 map** — trên v46 perf-budget 5/8 (geometry 65 / material 45 vượt trần v3); W12 đang chốt trần mới (audit perf-budget-3maps.md); timing map-lanes (test-map-lanes 367/2) cũng để đợt sau.

## v3.4 — Dao cận chiến, đổi súng kiểu CS, menu mua CS:GO, pause thật & map HD

Ngày: 2026-11-08

**Tính năng mới:**
- ✨ Dao KN-9 "Vết Nứt" ở slot 3: chém 40 dmg, đâm chuột phải 65, đâm sau lưng (backstab) 90/180, thưởng hạ gục $1.000, tốc độ chạy nhanh nhất game.
- ✨ Đổi súng kiểu CS: phím 1 (súng chính) / 2 (súng phụ) / 3 (dao), vòng lăn chuột đổi súng, phím V quay về súng trước; mỗi lớp vũ khí có thời gian rút súng riêng và thanh deploy trên HUD.
- ✨ Menu mua phong cách CS:GO: lưới 6 cột (súng phụ / SMG / hạng nặng / rifle / sniper / trang bị), silhouette súng, mua nhanh bằng phím số 2 nhịp (chọn nhóm → chọn món).
- ✨ ESC mở menu pause thật — game đóng băng hoàn toàn; settings đầy đủ hơn: âm lượng tổng/SFX/UI tách riêng, đảo trục Y, tuỳ biến tâm ngắm (màu, dài, khoảng hở, chấm tâm).
- ✨ Map Neon Divide HD: vật liệu PBR (asphalt/bê tông/kim loại), ánh sáng môi trường HDRI, choke point chuẩn hoá 3,0 m, cửa phụ 1,9 m, cổng site 4,4 m, thêm cover nửa chiều cao, bóng đổ 2048; shadow tĩnh giúp giảm tải GPU đáng kể.
- ✨ Âm thanh: pack tiếng súng riêng cho từng vũ khí, tiếng bước chân theo bề mặt, âm dao/deploy/scope/mua đồ.

**Sửa lỗi & cân bằng:**
- 🔧 Không còn scope được trong lúc đang rút súng SR-50; dao không đâm xuyên tường/thùng mỏng.
- 🔧 Khi pause, game không còn nhận phím mở menu mua/đổi súng/nạp đạn/dùng kỹ năng; sửa phụ đề tỉ số trong menu pause.
- 🔧 Menu mua không còn rò trạng thái chọn nhóm (tránh mua nhầm ngay khi mở lại menu).
- 🔧 Viewmodel súng được giải phóng bộ nhớ đúng cách khi đổi súng; lỗi thư viện âm thanh không còn làm mất phát bắn.
- ⚖️ Thưởng hạ gục SG-12: $900 → $600 (mô phỏng cân bằng cho thấy SG-12 farm tiền nhanh gấp 3,8× VK-7).

## v3.3 — Killcam + hoàn thiện 7 vũ khí

Commit: [`81595c9`](https://github.com/Itvc0110/ProjectG/commit/81595c9cc7cf6d7757ab2dd45463c6d81f1f5e98) · Ngày: 2026-11-08

**Tính năng mới:**
- ✨ Killcam: sau khi bị hạ, xem lại 4 giây trước đó từ góc nhìn của đối thủ vừa hạ mình (nhấn Space để bỏ qua).
- ✨ Xem lại toàn bộ round cuối từ màn hình kết thúc trận: tua theo timeline, đổi tốc độ 0,5×/1×/2×.
- ✨ Hoàn thiện đầy đủ 7 vũ khí: mua theo ô súng chính/súng phụ, đổi súng bằng phím 1/2, SR-50 ngắm bằng chuột phải (không ngắm thì tản 4,5°), SG-12 bắn đúng 8 viên đạn ghém, tiền thưởng hạ gục tính theo từng loại súng.

**Sửa lỗi & cải thiện:**
- 🔧 Chặn mua đồ giữa lúc đang giao tranh (trước đây mở menu mua được ở mọi giai đoạn).
- 🔧 Gỡ bom không còn cộng dồn tốc độ khi nhiều bot đứng gần — chỉ 1 bot gỡ tại một thời điểm.
- 🔧 Sửa 2 điểm xuất phát của bot bị chồng lên thùng hàng trong bản đồ.
- 🔧 Độ giật của SMG/LMG áp đúng hệ số riêng, loại bỏ nguy cơ lỗi góc nhìn (NaN).

## v3.2 — Bot là lính 3D thật

Commit: [`6a3e61b`](https://github.com/Itvc0110/ProjectG/commit/6a3e61b32fef79b7eb54937771e411127ac638f8) · Ngày: 2026-11-08

**Tính năng mới:**
- ✨ Bot chuyển từ hình khối sang mô hình lính 3D thật với hoạt ảnh đứng yên / đi / chạy theo tốc độ di chuyển.
- ✨ Kính visor của lính phát sáng theo màu operator và màu đội (địch đỏ, ta xanh) để nhận diện nhanh.

**Sửa lỗi & cải thiện:**
- 🔧 Lưu ý kỹ thuật: file mô hình 3D không nằm trực tiếp trong repo (giới hạn công cụ đẩy file) — game tự nạp mô hình từ CDN khi chơi, có đường dẫn file local dự phòng.

## v3.1 — Thêm 5 vũ khí + đổi operator giữa trận

Commit: [`5d4d33e`](https://github.com/Itvc0110/ProjectG/commit/5d4d33e5092ec364762e76eb78bda6766ca9f6f1) · Ngày: 2026-11-08

**Tính năng mới:**
- ✨ Thêm 5 vũ khí mới: SM-11 "Bão" (SMG), SG-12 (shotgun), SR-50 (súng ngắm), DP-50 (pistol mạnh), MG-75 (súng máy) — nâng tổng số lên 7 loại vũ khí.
- ✨ Đổi operator giữa trận trong giai đoạn mua đồ (tại khu vực xuất phát): lần đầu miễn phí, tối đa 3 lần/trận.
- ✨ Bot tự mua vũ khí theo số tiền đang có; tốc độ di chuyển thay đổi theo vũ khí đang cầm.

**Sửa lỗi & cải thiện:**
- 🔧 Lưu ý: ở bản này một phần tính năng của 5 vũ khí mới chưa được nối hoàn chỉnh (mua/đổi súng/ống ngắm) — đã hoàn thiện đầy đủ ở v3.3 bên dưới.

## v3.0 — Cơ chế bắn kiểu CS

Commit: [`6c5d321`](https://github.com/Itvc0110/ProjectG/commit/6c5d321400c88f1247db53d193ac5be1a813b85a) · Ngày: 2026-11-08

**Tính năng mới:**
- ✨ Độ giật súng theo pattern cố định (học được, kiểm soát được) thay vì ngẫu nhiên hoàn toàn.
- ✨ Độ tản đạn phụ thuộc tốc độ di chuyển: đứng yên bắn chuẩn nhất, vừa chạy vừa bắn tản mạnh — có counter-strafe.
- ✨ Di chuyển có gia tốc dùng chung cho người chơi và bot; bot phản ứng và ngắm giống người hơn (thời gian phản ứng 220–380 ms).
- ✨ Thêm ngồi xổm (Ctrl/C).

**Sửa lỗi & cải thiện:**
- 🔧 Sửa độ nhạy chuột về thang chuẩn dễ chỉnh; thêm thanh trượt FOV 68–80; cài đặt được lưu lại cho lần chơi sau.
- 🔧 Bị bắn trúng sẽ bị chậm lại (tagging) giống các game bắn súng chiến thuật.

## Giao diện esports mới

Commit: [`622a8b8`](https://github.com/Itvc0110/ProjectG/commit/622a8b8c20cf89aeed47db333a8d579758028050) · Ngày: 2026-11-08

**Tính năng mới:**
- ✨ Làm lại giao diện theo phong cách esports/neon: thẻ operator có thanh chỉ số, HUD kính mờ, vòng tròn hồi chiêu.
- ✨ Thêm viền minimap, hiệu ứng mờ đỏ khi sắp hết máu, vòng cung chỉ hướng vừa bị bắn, killfeed và menu mua đồ có hoạt họa.

## v2.0 — Đủ 8 operator

Commit: [`d8986c4`](https://github.com/Itvc0110/ProjectG/commit/d8986c40eecf122fb80579bdc3fef7bdf63f2fa9) · Ngày: 2026-11-08

**Tính năng mới:**
- ✨ Đủ bộ 8 operator: FLARE, PRISM, BASTION, WHISPER, TETHER, NULL, AEGIS, DRIFT — mỗi người có kỹ năng Q, E, chiêu cuối (X) và nội tại riêng.
- ✨ Công trình dựng bằng kỹ năng (tường, barricade, pháo đài) có máu và phá hủy được.
- ✨ Hệ thống vùng hiệu ứng (zone) và khiên sinh học cho nhân vật.

## v1.1 — Chỉnh nhịp trận đấu

Commit: [`e5644a8`](https://github.com/Itvc0110/ProjectG/commit/e5644a854d4500cdc5fd3c1171ab7954e608c27a) · Ngày: 2026-11-08

**Sửa lỗi & cải thiện:**
- 🔧 Thời gian mỗi round tăng lên 115 giây, thời gian đặt bom rút còn 3,2 giây.
- 🔧 Bắn trúng đầu (headshot) nhân 4 lần sát thương — thưởng cho ngắm chuẩn.

## v1.0 — Bản chơi được đầu tiên

Commit: [`c2e5f60`](https://github.com/Itvc0110/ProjectG/commit/c2e5f60aac568dc2d33699dfdde254d2d66d01cc) · Ngày: 2026-11-08

**Tính năng mới:**
- ✨ Game FPS chạy ngay trên trình duyệt: vòng đấu chiến thuật kiểu CS — giai đoạn mua đồ, đặt/gỡ bom, tính điểm theo round.
- ✨ Bản đồ gốc "Neon Divide" (3 đường, 2 điểm đặt bom A/B).
- ✨ Đấu với bot: 5 địch + 3 đồng đội, có HUD, minimap, bảng tin hạ gục (killfeed).
- ✨ Âm thanh được tổng hợp trực tiếp trong game, không cần tải file ngoài.

## Hạ tầng & tài liệu

### Đóng gói Docker — [`a8fb053`](https://github.com/Itvc0110/ProjectG/commit/a8fb053560ad240e559e6e9e0354e9c1e0396024)
- Đóng gói game bằng Docker: chỉ cần chạy `docker compose up -d --build` rồi mở http://localhost:8080 là chơi.

### Tài liệu nghiên cứu mã nguồn mở — [`659bc66`](https://github.com/Itvc0110/ProjectG/commit/659bc66bf28c0de1ea9ee4f1a96520a992b0dae5)
- Thêm tài liệu khảo sát các dự án FPS mã nguồn mở dùng làm nền tham khảo phát triển (docs/FPS_OPEN_SOURCE_LANDSCAPE.md).

### Tài liệu cơ chế gameplay — [`3766548`](https://github.com/Itvc0110/ProjectG/commit/3766548a7bc6e74d0e1583ebb2b62fdd79836fbd)
- Thêm bộ tài liệu cơ chế (docs/mechanics/): độ giật súng, peek, vũ khí, ngắm bắn, độ chính xác khi di chuyển, đổi operator — là cơ sở cho bản v3.

---
Đang phát triển (chưa phát hành): v3.5 đã kiểm chứng, chờ merge/push (xem mục v3.5 ở đầu file);
W10 đã xong (QA sweep 47/9, rank F1/F2 + tutorial Bài 5 + pointer-lock `.catch` đã sửa, gộp v3.6-core
và v3.6-content riêng — đều GO có điều kiện, run-all 29/11); W11 đã xong (gộp v3.6 thống nhất
`dev-v46-v36`, 8.940 dòng, GO có điều kiện, run-all 35/11; file-first audio `dev-v46-audiofile`; 4 tester
độc lập — rankfix GO, lockfix GO, tutorialfix + i18n GO có điều kiện; sửa kỳ vọng test cũ run-all 27/9;
test-pause-settings 208/0 trên v35merged nhưng 201/7 trên v46 — còn dở; gỡ shim scoreT/scoreCT; D39 A2
chốt semantics Q + port reorderPlan 229/0; chốt D-7 lobby keep-mode; flipbook smoke module 56/56); còn
chờ: playtest trình duyệt thật hàng loạt (B5 r187 bắt buộc, Q/E/X 8 operator trên v46, nghe thử
audio/footsteps), merge/push v3.5 và v3.6, sửa test-pause-settings cho panel crosshair v3.6, thêm 2 key
i18n vào module, đính chính topic goap 16/16, chốt trần geometry/material cho game 3 map, đối chiếu
sightline 35,4 m vs 73,8 m, GOAP reorder (D39: A2 xong, còn A1/A3–A6); multiplayer: rate-limit, UI lobby
trong game, bot đặt bomb.
