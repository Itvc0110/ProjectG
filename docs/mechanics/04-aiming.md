# 04 — Cơ chế Aiming (ngắm bắn) cho ProjectG

> Tài liệu nghiên cứu cho team ProjectG (Neon Divide). Phần 1 giải thích cơ chế aim của FPS tactical kèm số liệu và nguồn. Phần 2 là đề xuất áp dụng cụ thể vào code/settings của ProjectG.
> Ngày tổng hợp: 2026-11-08. Mọi khẳng định chính đều có URL nguồn ở cuối mỗi mục và trong danh mục nguồn cuối tài liệu.

**TL;DR**

- Aim giỏi trong tactical FPS = **crosshair placement + pre-aim** quan trọng hơn tốc độ flick thô: đặt tâm đúng tầm đầu, đúng góc địch sắp xuất hiện giúp "phản ứng" hiệu quả giảm từ ~400 ms xuống ~150 ms.
- Flick là chuyển động *ballistic* (mở vòng, không sửa giữa chừng), tracking là *closed-loop* (sửa liên tục, bị giới hạn bởi độ trễ thị giác–vận động 150–250 ms), micro-adjustment là cú sửa nhỏ cuối flick quyết định phát bắn trúng đầu hay trượt vài pixel.
- Pro CS2 (dữ liệu ProSettings, ~820–920 người): **eDPI trung vị 800–830**, phân vị giữa (IQR) khoảng **704–960**, tương đương **~47 cm/360°**; DPI 400 và 800 chiếm ~93–94%.
- ProjectG hiện tại: sensitivity cố định `0.0021 rad/count` (≈ **9,5 cm/360 ở 800 DPI** — nhanh gấp ~5 lần dải pro), FOV dọc 78° (≈110° ngang ở 16:9), bot **không có reaction delay** và xoay tâm tức thì (`lookAt`). Cả ba điểm này đều cần sửa theo đề xuất ở Phần 2.

---

## PHẦN 1 — GIẢI THÍCH CƠ CHẾ

### 1.1 Crosshair placement & pre-aim: kỹ năng "aim mà không cần aim"

**Crosshair placement** là thói quen luôn giữ tâm ngắm (a) ở **tầm đầu** của địch và (b) ở **vị trí địch có khả năng xuất hiện nhất**, trong mọi thời điểm di chuyển — không chỉ khi sắp bắn. Vì chiều cao đầu thay đổi theo khoảng cách/địa hình, người chơi giỏi cho tâm "trượt" dọc theo các mốc ngang tầm đầu: mép thùng, lan can, bậu cửa sổ, nóc tường thấp.

**Pre-aim** là bước nâng cao: đặt tâm sẵn vào *từng góc cụ thể* (cạnh cửa, sau thùng, góc cua) *trước khi* góc đó mở ra hoặc trước khi địch peek, dựa trên hiểu biết map. Thứ tự dọn góc (angle clearing) biến mỗi pha đấu súng thành "chỉ cần click" thay vì "thấy địch → lia tâm → sửa → click".

Hiệu quả đo được bằng thời gian: hướng dẫn aim CS2 của SwapGG mô tả placement tốt là khác biệt giữa phản ứng **150 ms** và **400 ms**; đứng ở **off-angle** (vị trí địch ít pre-aim tới) cho người thủ thêm **200–400 ms** vì đối thủ phải lia tâm xa hơn dự kiến. Ngược lại, ngắm tầm ngực thay vì tầm đầu "tặng" đối thủ **100–150 ms** lợi thế. Đây là hệ quả trực tiếp của định luật Fitts (mục 1.4): khoảng cách lia càng ngắn, thời gian chạm mục tiêu càng ngắn — placement tốt là cách rút ngắn khoảng cách đó về gần 0.

Nguồn:
- https://swap.gg/blog/how-to-get-good-aim-in-cs2
- http://csdb.gg/guide-to-crosshair-placement/

### 1.2 Flick, tracking, micro-adjustment: ba kỹ năng vận động khác nhau

| Kỹ năng | Bản chất vận động | Tình huống điển hình | Điểm nghẽn |
|---|---|---|---|
| **Flick** | Ballistic, *open-loop*: não tính trước toàn bộ quỹ đạo rồi "phóng" một lần, gần như không sửa giữa đường | Địch bất ngờ xuất hiện ngoài tâm; one-tap; sniper flick | Độ chính xác của "bản đồ khoảng cách" tay↔màn hình (muscle memory), phụ thuộc tuyệt đối vào sensitivity ổn định |
| **Tracking** | *Closed-loop*: sửa lỗi liên tục theo phản hồi thị giác trong lúc mục tiêu di chuyển | Bắn theo địch strafe, súng full-auto tầm gần (Apex/Overwatch nặng tracking; tactical FPS nhẹ hơn) | Độ trễ thị giác–vận động của người ~**150–250 ms**; tâm luôn "đuổi theo" vị trí quá khứ của mục tiêu |
| **Micro-adjustment** | Cú sửa nhỏ (cổ tay/ngón tay) ngay sau flick hoặc khi giữ góc | Flick đáp lệch vài pixel khỏi đầu; địch jiggle-peek làm lệch tâm vài cm | Độ mịn của sensitivity (cm/360 càng lớn càng dễ sửa nhỏ), độ căng tay |

Hệ quả huấn luyện: giỏi flick **không tự động** giỏi tracking vì hai kỹ năng dùng hai vòng điều khiển thần kinh khác nhau. Lỗi flick phổ biến nhất là luyện tốc độ trước độ chính xác — một cú flick trượt là một "rep" dạy sai bản đồ khoảng cách; khuyến nghị giữ tỉ lệ trúng **~80–90%** rồi mới tăng tốc. Lỗi tracking phổ biến là biến tracking thành chuỗi micro-flick đuổi theo mục tiêu, thay vì di chuyển mượt và *đi cùng* hướng strafe.

Trong tactical FPS (CS/Valorant — và ProjectG), tỉ trọng thực chiến áng chừng: placement/pre-aim > flick + micro-adjust >> tracking, vì TTK thấp và đấu súng thường kết thúc trong 1–5 viên đầu khi hai bên gần như đứng yên (counter-strafe).

Nguồn:
- https://fpsaim.com/flick-vs-tracking-aim-training.html
- https://flicktrainer.com/articles/flick-vs-tracking-aim.html
- https://fpstrain.us/aim-training-science-research-summary-2026.html (visuomotor delay 150–250 ms)

### 1.3 Yếu tố con người: thời gian phản ứng

- **Phản xạ thị giác đơn giản** (thấy tín hiệu → bấm): sàn sinh lý khoảng **~200 ms** ở người chưa luyện, nén xuống ~**150 ms** khi đã luyện; giá trị dưới 100 ms gần như luôn là *dự đoán trước* (anticipation), không phải phản ứng thuần (tổng hợp nghiên cứu của FPSTrain dựa trên Welford 1980 và các nghiên cứu click-to-fire).
- **Thời gian "thấy địch → bắn trúng" trong game** cao hơn nhiều vì cộng thêm lia tâm (Fitts) và sửa lỗi: các bài aim test cộng đồng cho thấy người mới ~600–800 ms/mục tiêu, người chơi thường ~480–600 ms, người chơi thi đấu ~300–400 ms, elite <320 ms.
- Kết luận thiết kế quan trọng: **đừng thiết kế quanh phản xạ <150 ms** — đó là vùng phi thực tế với người. Game nên thưởng dự đoán/placement (audio, thông tin, pre-aim) thay vì đòi phản xạ thô. Đây cũng là cơ sở để mô phỏng bot ở Phần 2.2: bot "giống người" phải có reaction ≥150 ms.

Nguồn:
- https://fpstrain.us/aim-training-science-research-summary-2026.html
- https://humanbenchmark.now/tests/aim-trainer

### 1.4 Định luật Fitts áp dụng vào flick

Fitts (1954), dạng Shannon (MacKenzie 1992, chuẩn ISO 9241-9):

```
ID = log2(D/W + 1)          (Index of Difficulty, đơn vị: bit)
MT = a + b × ID             (Movement Time)
```

- `D` = khoảng cách lia tâm tới mục tiêu, `W` = bề rộng mục tiêu (cùng đơn vị, trong FPS nên dùng **độ góc**).
- Với chuột, `a` ≈ 50–100 ms, `b` ≈ 100–150 ms/bit là các hằng số thực nghiệm thường gặp trong HCI; throughput chuột ~4–5 bit/s.

**Ví dụ tính cho ProjectG** (đầu bot rộng 0,42 m — đúng kích thước head box trong code):

- Ở 20 m, đầu rộng góc `W = 2·atan(0,21/20) ≈ 1,2°`.
- Flick từ lệch **15°**: ID = log2(15/1,2 + 1) ≈ 3,75 bit → MT ≈ 100 + 120×3,75 ≈ **550 ms** để *chạm chính xác* vào đầu (gồm cả pha sửa cuối).
- Nếu placement tốt, tâm chỉ lệch **2°**: ID = log2(2/1,2 + 1) ≈ 1,42 bit → MT ≈ **270 ms**.
- Chênh lệch ~**280 ms** — khớp với các con số 150 vs 400 ms mà các guide CS2 quan sát được (mục 1.1).

Hệ quả rút ra cho thiết kế:
1. Mỗi lần **giảm một nửa** khoảng cách lia (D) tiết kiệm ~1 bit ≈ **100–150 ms** — placement là "buff" lớn nhất và miễn phí.
2. Mục tiêu nhỏ dần theo khoảng cách (W giảm) khiến đấu súng xa thiên về tap/burst chậm rãi; súng và map nên tôn trọng điều này (đừng ép spray xa).
3. Sensitivity quá cao làm tăng nhiễu ở pha micro-adjust (tương đương giảm W hiệu dụng) — lý do pro tactical FPS chọn cm/360 lớn (mục 1.5).

Nguồn:
- https://www.textbookofusability.com/chapter/motor-control-and-fitts-law.html
- https://fpstrain.us/aim-training-science-research-summary-2026.html

### 1.5 Sensitivity: DPI, eDPI, cm/360

**Định nghĩa**

- **DPI**: số count chuột báo về trên 1 inch di chuyển vật lý.
- **eDPI = DPI × sensitivity trong game** — chỉ so sánh được *trong cùng một game* (vì mỗi game có hệ số yaw khác nhau: CS2/Apex yaw 0,022°/count, Valorant 0,07°/count).
- **cm/360°**: quãng đường vật lý để xoay 360°, là thước đo *xuyên game* duy nhất:

```
cm/360 = (360 / yaw_deg) / (DPI × sens) × 2,54
```

**Số liệu pro (kiểm chứng chéo 2 cơ sở dữ liệu)**

| Nhóm | DPI phổ biến | eDPI trung vị | cm/360 điển hình |
|---|---|---|---|
| CS2 pro (ProSettings, 920 pro, 5/2026) | 400 (66%), 800 (28%), 1600 (5%) | **830** | ~47 cm (trung vị) |
| CS2 pro (cơ sở dữ liệu 820 pro đang thi đấu, 10/2026) | 400 (47%), 800 (46%) | **800** (IQR 704–960; chỉ ~6% trên 1.200) | ~52 cm ở 800 eDPI |
| CS2 — theo vai trò | — | Rifler 800, AWPer 840, IGL 802 | — |
| Valorant pro | 400–800 | ~240 (theo thang Valorant; tương đương ~33–40 cm/360) | ~33–40 cm |
| Apex pro | 800 | ~1.100 (theo thang CS) | ~26 cm |

Ví dụ cá nhân (CS2): NiKo 720 eDPI / 57,7 cm — ZywOo 760–800 / ~52–55 cm — m0NESY, device 920 / 45,2 cm — donk 1.000 / 41,6 cm — s1mple 1.236 / 33,6 cm. Tức **toàn bộ dải pro CS2 nằm trong ~34–58 cm/360**.

**Đọc số đúng cách**: không có "sens thần thánh". Dải hợp lý cho tactical FPS là **~35–55 cm/360** (cân bằng flick 180° và micro-adjust); dưới ~25 cm/360 micro-adjust bắt đầu rung, trên ~65 cm/360 xoay người khẩn cấp phải nhấc chuột nhiều lần. Người mới nên bắt đầu giữa dải (~45 cm/360) và **giữ nguyên ít nhất 1–2 tuần** trước khi chỉnh ±5–10%.

Nguồn:
- https://steamdb.com/en/articles/cs2-best-settings-for-competitive
- https://turbosmurfs.gg/article/best-cs2-mouse-settings
- https://smart-calculators.net/en-US/tools/cs2-edpi-calculator
- https://sensconverter.app/apex-pro-settings/

### 1.6 Raw input & mouse acceleration

- **Mouse acceleration** làm quãng lia phụ thuộc *tốc độ* vung chuột, phá vỡ ánh xạ 1:1 tay↔tâm — kẻ thù của muscle memory (cùng một động tác tay, nhanh/chậm cho kết quả khác nhau).
- Dữ liệu pro 2026: **98,8%** pro CS2 khảo sát (244/247) dùng input tuyến tính, không accel; số ít dùng accel là người chơi gốc Quake đã quen 15–20 năm.
- Ba lớp cần tắt: (1) Windows "Enhance pointer precision" (bật mặc định), (2) accel trong game (CS2: `m_customaccel 0`), (3) accel/smoothing trong phần mềm chuột.
- **Raw input**: game đọc trực tiếp dữ liệu chuột, bỏ qua xử lý của OS. CS2 **luôn** dùng raw input (Windows pointer settings không ảnh hưởng trong game). Với game web như ProjectG: Pointer Lock API đã cho `movementX/Y` theo count chuột; trên Chromium có thể yêu cầu thêm `requestPointerLock({ unadjustedMovement: true })` để lấy input chưa qua chỉnh sửa của OS — nên dùng kèm fallback khi trình duyệt không hỗ trợ.

Nguồn:
- https://fpstrain.us/aim-training-mouse-acceleration-debate-2026.html
- https://turbosmurfs.gg/article/best-cs2-mouse-settings

### 1.7 ADS vs hipfire: ba game, ba triết lý

| | CS2 | Valorant | Apex Legends |
|---|---|---|---|
| ADS cho súng thường | **Không có.** Chỉ scope cho sniper/AUG/SG-553. "Hipfire" của CS chính xác như ADS ở game khác *khi đứng yên* — độ chính xác đến từ **đứng yên/counter-strafe + ngồi**, không đến từ ngắm qua thước ngắm | Có ADS cho rifle/SMG: **giảm spread viên đầu rõ rệt** (một số súng chỉ đạt "0 spread viên đầu" khi ADS/scope, vd Guardian, Marshal, Operator); đổi lại **tốc độ bắn −10%** ở đa số súng và di chuyển chậm hơn | Có ADS mọi súng: giảm spread mạnh, là chuẩn ở tầm trung/xa; **hipfire vẫn rất mạnh ở tầm gần** (<~3–5 m) vì giữ được tốc độ di chuyển/strafe |
| Hệ số sens khi zoom | Zoom sens multiplier (mặc định 1,0) cho scope | **Hai hệ số riêng**: ADS multiplier và Scoped multiplier, mặc định 1,0; khuyến nghị bắt đầu 1,0, overshoot thì hạ 0,85–0,95 | ADS multiplier **theo từng mức zoom** (1x–10x); đại đa số pro để **1,0** cho mọi mức để giữ một muscle memory duy nhất |
| Khi nào không nên ADS/scope | — (không áp dụng) | Tầm gần: mất 10% DPS và chậm di chuyển; sniper không scope lệch tới 5° (Operator) | Tầm gần: ADS làm chậm strafe và thu hẹp tầm nhìn ngoại vi |
| FOV | Khóa: 106,26° ngang ở 16:9 (dọc 73,74°) | Khóa: **103°** ngang | Slider **70–110** (thang 4:3; ≈124° ngang ở 16:9 khi max), pro thường 100–110 |

Điểm cốt lõi cho ProjectG (baseline CS): **độ chính xác nên gắn với trạng thái di chuyển, không gắn với ADS**. Thêm ADS kiểu CoD/Apex sẽ phá vỡ nhịp counter-strafe–dừng–bắn mà toàn bộ thiết kế map/round đang dựa vào.

Nguồn:
- https://csdb.gg/counter-strike-vs-call-of-duty-comparison/
- https://valorant.fandom.com/wiki/Weapons
- https://gear-rank.com/guides/valorant-mouse-settings-dpi-edpi
- https://sensconverter.app/apex-pro-settings/
- https://aimbetween.games/glossary/field-of-view

### 1.8 Luyện aim (aim routine) — cho người chơi và cho thiết kế tính năng hỗ trợ

- Hệ phân loại chuẩn cộng đồng (Voltaic / Aim Lab Benchmarks): **clicking** (tĩnh & động), **tracking** (mượt & phản ứng), **target switching** (tốc độ & chính xác). Ba nhóm này là khung để xây chế độ luyện tập trong game.
- Liều lượng hiệu quả: buổi **25–35 phút**, 4–6 buổi/tuần; **luyện rải rác thắng luyện dồn** (distributed practice — 5 buổi × 30 phút hơn 1 buổi 150 phút với cùng tổng thời gian). Quá ~45 phút/ngày, mỏi tay làm rep chất lượng xấu đi.
- Quy tắc **60/40**: 60% thời gian cho kỹ năng game chính cần (tactical FPS = clicking/flick + micro-adjust), 40% cho hai nhóm còn lại.
- Nguyên tắc trong buổi: accuracy trước speed (giữ 80–90% trúng), giữ nguyên sensitivity trong suốt chu kỳ luyện (đổi sens liên tục = phá bản đồ khoảng cách đang hình thành), benchmark lại mỗi tuần một lần trong cùng điều kiện.
- Trong game thật: deathmatch và đi lại pre-aim route trên map quen thuộc chuyển giao tốt hơn aim trainer thuần tuý đối với placement — placement là *kiến thức map*, không phải kỹ năng chuột.

Nguồn:
- https://fpstrain.us/flick-vs-tracking-vs-target-switching-aim-training-routines.html
- https://fpstrain.us/tracking-vs-flicking-vs-clicking-aim-training-balance.html

---

## PHẦN 2 — ÁP DỤNG CHO PROJECTG

> Hiện trạng code (đã kiểm chứng trong `dev-v2/index.html` ngày 2026-11-08):
> - Chuột: `player.yaw -= e.movementX * 0.0021` — hệ số **cố định 0,0021 rad/count**, không có setting.
> - Camera: `THREE.PerspectiveCamera(78, ...)` — FOV **dọc** 78° ≈ **110,4° ngang** ở 16:9.
> - Crosshair: 4 vạch CSS, biến `--sp` nở theo spreadBloom + di chuyển (dynamic-only), không tuỳ chỉnh được.
> - Bot bắn: `hitChance = clamp(0,52 − 0,008 × dist, 0,12, 0,50)`, burst 3 viên/0,17 s, nghỉ 0,75–1,3 s; điểm ngắm lệch ngẫu nhiên ±0,4 m; **bot xoay mặt tức thì bằng `lookAt` và bắn ngay khi có LOS — reaction = 0 ms**.

### 2.1 Settings chuột trong game

#### a) Sensitivity slider — thông số cụ thể

Đổi hằng số `0.0021` thành hệ số tính từ slider. Đơn vị nội bộ giữ nguyên rad/count:

```
effectiveRadPerCount = 0.00045 × sensSlider
```

Kiểm chứng: ở 800 DPI, slider 1,00 → counts/360 = 2π/0,00045 ≈ 13.963 → cm/360 = 13.963/800 × 2,54 ≈ **44,3 cm/360** — đúng giữa dải pro tactical (mục 1.5).

| Thuộc tính slider | Giá trị đề xuất |
|---|---|
| Khoảng | **0,50 – 2,50** |
| Bước | 0,01 (kèm ô nhập số trực tiếp) |
| Mặc định | **1,00** (≈44 cm/360 ở 800 DPI; ≈88,6 cm ở 400 DPI; ≈22,2 cm ở 1600 DPI) |
| Ánh xạ nhanh | 0,75 ≈ 59 cm/360 · 1,00 ≈ 44 cm · 1,30 ≈ 34 cm · 1,75 ≈ 25 cm (đều ở 800 DPI) |

Bắt buộc kèm theo:

1. **Ô nhập DPI chuột** (preset 400 / 800 / 1600 + nhập tay 100–6400, mặc định 800) — chỉ để *hiển thị* cm/360 trực tiếp cạnh slider theo công thức `cm/360 = (2π / effectiveRadPerCount) / DPI × 2,54`. Người chơi phải nhìn thấy cm/360 của mình, không phải một con số trừu tượng.
2. **Hệ số sens khi zoom (scoped multiplier)**: 0,80–1,20, mặc định **1,00** — áp dụng cho scope của sniper về sau (và operator có zoom). Theo mẫu Valorant/Apex: tách riêng khỏi sens thường, mặc định 1,0 để giữ một muscle memory.
3. **Đảo trục Y** (invert Y): checkbox, mặc định tắt.
4. **Raw input**: giữ Pointer Lock; gọi `canvas.requestPointerLock({ unadjustedMovement: true })` trong try/catch, fallback về pointer lock thường nếu trình duyệt từ chối (Firefox không hỗ trợ tham số này). **Không** cài bất kỳ smoothing/làm mượt nào lên `movementX/Y` — áp dụng trực tiếp trong sự kiện mousemove như hiện tại. Ghi chú trong UI settings: "Game luôn dùng raw input; hãy tắt Enhance pointer precision trong Windows".
5. **Không** làm slider theo kiểu "độ nhạy 1–10" vô định — người chơi tactical FPS chuyển game dựa vào cm/360.
6. Lưu settings vào `localStorage`, áp dụng ngay không cần restart.

#### b) ADS — quyết định thiết kế

**Không thêm ADS cho súng trường/SMG** (giữ triết lý CS: chính xác đến từ dừng di chuyển + counter-strafe). Chỉ giữ:

- Scope 2 mức cho sniper (khi vũ khí này được thêm): khi scope, áp scoped multiplier (mục a.2) và giảm spread về ~0 như chuẩn Valorant/CS.
- Nếu sau này muốn "ngắm tinh" cho súng bán tự động kiểu Guardian: dạng ADS nhẹ — spread viên đầu ×0,6, tốc độ di chuyển ×0,65, **không** zoom FOV quá 1,25×, tốc độ bắn −10% (đúng cái giá Valorant thu). Đặt sau flag thử nghiệm, không bật mặc định.

#### c) FOV slider

Camera Three.js dùng FOV **dọc**. Quy đổi ở 16:9: vFOV 68° ≈ 100° ngang · 74° ≈ 106,3° ngang (bằng CS2) · 78° ≈ 110,4° ngang (hiện tại) · 80° ≈ 112° ngang.

| Thuộc tính | Giá trị đề xuất |
|---|---|
| Khoảng (dọc) | **68 – 80°** |
| Mặc định | **74°** (= 106,3° ngang, chuẩn CS2 — mục tiêu ở xa to hơn hiện tại ~4%, dễ micro-adjust hơn) |
| Ghi chú UI | Hiển thị cả số ngang tương đương theo aspect hiện tại: `hFOV = 2·atan(tan(vFOV/2) × aspect)` |

Lưu ý kỹ thuật: cm/360 **không đổi** theo FOV (góc xoay vật lý giữ nguyên), chỉ *cảm giác* tốc độ lia thay đổi — vì vậy không tự động scale sensitivity theo FOV; người chơi tự bù bằng scoped multiplier khi zoom.

### 2.2 Độ khó bot: mô phỏng người ở những điểm nào

Bot hiện tại "phi nhân" ở 3 điểm: phản ứng 0 ms, xoay tâm tức thì vô hạn tốc độ, và điểm ngắm đã chốt ngay khi thấy mục tiêu. Bổ sung 4 tham số cho mỗi bot (theo bậc độ khó) để bot thua/thắng *vì những lý do giống người*:

#### a) Reaction delay trước phát bắn đầu tiên (sau khi có LOS liên tục)

| Bậc | Reaction (ms) | Căn cứ |
|---|---|---|
| Dễ — "người mới" | **380–480** (ngẫu nhiên trong khoảng) | Người mới: phản xạ đơn 270–320 ms + lia/sửa |
| Trung bình — "Gold/Plat" | **280–350** | Người chơi thường: aim test ~480–600 ms/mục tiêu gồm cả lia |
| Khó — "Diamond+" | **210–270** | Người chơi kinh nghiệm: phản xạ 200–240 ms |
| Ác mộng — "Pro" | **160–200** | Sát sàn người đã luyện (~150 ms); **không bao giờ < 150 ms** |

Cách cài: khi bot mới thấy mục tiêu, đặt `b.aimReadyAt = t + reaction/1000`; chỉ bắn khi `t ≥ aimReadyAt`; mất LOS > 0,25 s thì reset. Cộng thêm: nếu mục tiêu *vừa peek ra* từ góc bot đang pre-aim (bot đang giữ góc đó), giảm reaction 25% — mô phỏng lợi thế placement ở cả phía bot.

#### b) Tốc độ xoay tâm (thay `lookAt` tức thì)

Giới hạn tốc độ quay hướng mặt của bot (`turnRate`) và cho bot quay *về phía* mục tiêu theo từng frame:

| Bậc | Turn rate | Overshoot flick |
|---|---|---|
| Dễ | 300°/s | Vượt tâm 10–20% quãng lia, sửa sau 120–180 ms |
| Trung bình | 480°/s | Vượt 6–12%, sửa sau 100–140 ms |
| Khó | 720°/s | Vượt 3–8%, sửa sau 80–110 ms |
| Ác mộng | 1080°/s | Vượt 0–5%, sửa sau 60–90 ms |

#### c) Độ lệch tâm khi flick (aim error)

Thay điểm lệch ngẫu nhiên đều ±0,4 m hiện tại bằng **phân phối Gauss theo góc**, cộng lỗi tăng khi mục tiêu đang strafe:

| Bậc | σ lệch góc | Tỉ lệ chủ động ngắm đầu | Trễ tracking (aim vào vị trí quá khứ của người chơi) |
|---|---|---|---|
| Dễ | 2,8° | 20% (còn lại ngắm ngực) | 250 ms |
| Trung bình | 1,9° | 40% | 200 ms |
| Khó | 1,2° | 60% | 170 ms |
| Ác mộng | 0,7° | 80% | 150 ms (đúng sàn visuomotor delay của người) |

Cách cài trễ tracking: lưu vòng đệm vị trí người chơi ~300 ms; khi bot bắn người đang di chuyển, điểm ngắm lấy từ vị trí tại `t − trackDelay` rồi cộng nhiễu Gauss σ ở trên. Người chơi counter-strafe/đổi hướng sẽ né được đạn bot *đúng như né người* — đây là điểm khiến bot "có vẻ người" nhất.

#### d) Tinh chỉnh công thức trúng hiện tại

Giữ khung `hitChance = clamp(0,52 − 0,008·dist, 0,12, 0,50)` nhưng nhân hệ số bậc: Dễ ×0,55 · Trung bình ×0,80 · Khó ×1,00 · Ác mộng ×1,15 (kẹp trần 0,60). Giữ nguyên burst 3 viên/0,17 s và nghỉ 0,75–1,3 s (nhịp này đã giống người); ở bậc Dễ tăng nghỉ lên 1,1–1,7 s. **Không** tăng damage theo bậc — độ khó phải đến từ hành vi, không từ số máu trừ bất công.

### 2.3 Hỗ trợ người chơi mới

#### a) Tuỳ chỉnh crosshair (mẫu CS2 — thông số pro đã kiểm chứng)

Pro CS2 overwhelmingly dùng crosshair **tĩnh (style 4), nhỏ, màu xanh lá/cyan**: length 1–2, gap −4…−1, thickness 0,5–1,5 (thang CS). Ánh xạ sang pixel CSS của ProjectG:

| Setting | Khoảng | Mặc định | Ghi chú |
|---|---|---|---|
| Màu | Preset: xanh lá `#00FF00`, cyan `#00FFFF`, vàng `#FFFF00`, hồng `#FF00FF`, trắng, đỏ + ô hex tuỳ ý | Cyan | Màu phải nổi trên nền map Neon Divide (tông tối/xanh) |
| Length (dài vạch) | 3–20 px | 9 px | Dài quá che đầu ở tầm xa |
| Gap (khoảng hở giữa, trước bloom) | 0–14 px | 6 px | Hiện code đang hard-code nền 8 px trong công thức `--sp` |
| Thickness (dày vạch) | 1–5 px | 2 px | — |
| Center dot | Bật/tắt + cỡ 1–4 px | Tắt | Nhiều pro rifle tắt dot, sniper thích bật |
| Outline | Bật/tắt (viền đen 1 px) | Bật | Cứu visibility trên nền sáng |
| Kiểu T (ẩn vạch trên) | Bật/tắt | Tắt | Tuỳ chọn phổ biến trong CS |
| Dynamic (nở theo spread/di chuyển) | Tĩnh / Động / Lai | **Lai** | "Lai": bloom bị kẹp tối đa +10 px và có tuỳ chọn tắt hẳn — người mới cần feedback độ chính xác, pro sẽ tự chuyển Tĩnh |
| Alpha | 40–100% | 100% | — |

Kèm theo: **preview trực tiếp** trong menu settings (vẽ crosshair trên nền map mẫu sáng + tối), **3 preset** ("Pro nhỏ — cyan tĩnh", "Mặc định", "Tầm xa — có dot"), và **mã chia sẻ** dạng chuỗi ngắn (JSON → base64url, phong cách mã `CSGO-xxxxx` của CS) để người chơi gửi nhau. Lưu `localStorage`.

#### b) Feedback độ chính xác khi bắn

- Giữ hitmarker như hiện tại; thêm tuỳ chọn **hiện số/gạch "shooting error"**: crosshair đổi màu (hoặc vòng ngoài mờ dần) khi độ chính xác chưa hồi phục — tương đương biểu đồ shooting error của Valorant, giúp người mới *nhìn thấy* lý do viên đầu trượt khi đang di chuyển.
- Sau mỗi round, màn hình tổng kết nhỏ: tỉ lệ headshot, tỉ lệ viên-đầu-trúng đích (first-bullet accuracy). Hai con số này là chỉ số placement chuẩn nhất để người mới tự theo dõi tiến bộ.

#### c) Chế độ luyện tập (Practice Range trên chính map Neon Divide)

1. **Pre-aim route**: chế độ đi bộ không có bot bắn trả; tại mỗi góc phổ biến trên 3 lane, hiện "bóng ma" đầu địch ở tầm đầu đúng vị trí peek — dạy placement theo đúng map (placement là kiến thức map, mục 1.8).
2. **Bot tập bắn theo bậc**: bot tĩnh → bot strafe → bot peek, dùng đúng thang reaction/σ của mục 2.2; hiển thị thời gian từ lúc bot xuất hiện đến phát bắn trúng đầu tiên của người chơi (ms) — chính là chỉ số Fitts thực chiến.
3. **Sensitivity finder tích hợp** (phương pháp PSA rút gọn): game cho người chơi flick giữa 2 mục tiêu ở 7 mức sens quanh mức hiện tại, mỗi mức 10 lần, rồi đề xuất mức có thời gian-trúng đích thấp nhất; nhắc người chơi **khóa sens ít nhất 1 tuần** sau khi chốt.
4. **Gợi ý routine** hiển thị trong menu luyện tập: 25–35 phút/ngày (10' flick tĩnh, 10' pre-aim route, 10' deathmatch với bot), nguyên tắc accuracy 80–90% trước tốc độ — theo khung Voltaic ở mục 1.8.

---

## DANH MỤC NGUỒN

Crosshair placement & pre-aim:
- https://swap.gg/blog/how-to-get-good-aim-in-cs2
- http://csdb.gg/guide-to-crosshair-placement/

Flick / tracking / micro-adjustment & khoa học luyện aim:
- https://fpsaim.com/flick-vs-tracking-aim-training.html
- https://flicktrainer.com/articles/flick-vs-tracking-aim.html
- https://fpstrain.us/aim-training-science-research-summary-2026.html
- https://fpstrain.us/flick-vs-tracking-vs-target-switching-aim-training-routines.html
- https://fpstrain.us/tracking-vs-flicking-vs-clicking-aim-training-balance.html
- https://humanbenchmark.now/tests/aim-trainer

Định luật Fitts & yếu tố con người:
- https://www.textbookofusability.com/chapter/motor-control-and-fitts-law.html
- https://fpstrain.us/aim-training-science-research-summary-2026.html

Sensitivity / eDPI / cm/360 (số liệu pro):
- https://steamdb.com/en/articles/cs2-best-settings-for-competitive
- https://turbosmurfs.gg/article/best-cs2-mouse-settings
- https://smart-calculators.net/en-US/tools/cs2-edpi-calculator
- https://sensconverter.app/apex-pro-settings/

Raw input & mouse acceleration:
- https://fpstrain.us/aim-training-mouse-acceleration-debate-2026.html
- https://turbosmurfs.gg/article/best-cs2-mouse-settings

ADS vs hipfire & FOV:
- https://csdb.gg/counter-strike-vs-call-of-duty-comparison/
- https://valorant.fandom.com/wiki/Weapons
- https://gear-rank.com/guides/valorant-mouse-settings-dpi-edpi
- https://sensconverter.app/apex-pro-settings/
- https://aimbetween.games/glossary/field-of-view

Crosshair customization:
- https://csdb.gg/guides/crosshair-guide/
- https://csdb.gg/guides/config-guide/

*Lưu ý độ tin cậy: số liệu eDPI/cm/360 được đối chiếu giữa hai cơ sở dữ liệu pro settings độc lập (ProSettings qua SteamDB guide và cơ sở dữ liệu 820 pro của TurboSmurfs) — hai nguồn lệch nhau ~4% ở trung vị (800 vs 830), tài liệu ghi cả hai. Các hằng số Fitts (a, b) là khoảng thực nghiệm HCI điển hình, dùng để ước lượng thiết kế, không phải thông số đo trực tiếp trong ProjectG.*
