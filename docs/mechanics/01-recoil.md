# 01 — Cơ chế RECOIL (độ giật): nghiên cứu & đề xuất cài đặt cho ProjectG

> Phạm vi: mô hình độ giật của CS2/CSGO, Valorant, Apex Legends, Call of Duty/Warzone — và đề xuất cài đặt cụ thể cho ProjectG (Three.js, tactical FPS trên web).
> Quy ước dùng trong tài liệu: **pitch** = độ giật dọc (dương = nòng súng ngóc lên), **yaw** = độ giật ngang (dương = lệch phải), đơn vị **độ (°)**. "Bù giật" (compensation) là chuyển động chuột ngược hướng pattern.
> Tài liệu thiết kế nội bộ liên quan: `RESEARCH_AND_DESIGN.md` Phần 6 (bảng vũ khí VK-7/VK-5/P9/DP-50/SR-99 và phác thảo pattern mục 6.x) — tài liệu này mở rộng và thay thế phác thảo pattern ở đó bằng mảng số đầy đủ 30 viên.

---

## 1. Khái niệm nền: recoil ≠ spread

Hai thứ hoàn toàn khác nhau và phải cài riêng:

- **Recoil (giật)** tác động lên *camera/tâm ngắm*: súng bắn → góc nhìn bị xoay lên/ngang một lượng xác định. Người chơi **nhìn thấy** và **bù được bằng chuột**.
- **Spread/inaccuracy (tán xạ)** tác động lên *đường đạn*: đạn bay ngẫu nhiên trong một nón (cone) quanh hướng ngắm. Kích thước nón thì xác định, nhưng vị trí đạn trong nón là ngẫu nhiên từng phát — **không bù được**, chỉ giảm được bằng cách đứng yên, ngắt bắn chờ hồi.

Nguồn: phân tích tổng quan cơ chế recoil/spread của NoRecoil — https://www.norecoil.de/en/blog/how-recoil-works-in-fps-games

ProjectG hiện tại (code `repo-staging/index.html`, dòng ~770): chỉ có `kick` cố định mỗi phát (rifle 0,011 rad ≈ 0,63°, pistol 0,007 rad) cộng dồn vào pitch, cộng spread ngẫu nhiên đều `spread + spreadBloom` (bloom tăng 0,006/phát, trần 0,02 rad, hồi 0,03/giây). Tức là game **chưa có pattern** (mọi phát giật giống hệt nhau, không có thành phần ngang), và bloom hồi quá chậm/tuyến tính. Phần 7 của tài liệu này đề xuất thay bằng mô hình pattern + recoil index theo kiểu CS.

---

## 2. CS2 / CSGO — pattern cố định, học thuộc được

### 2.1. Ba lớp cơ chế chồng nhau

1. **Recoil pattern cố định theo từng súng.** Mỗi khẩu có một dãy offset góc cố định cho từng viên trong băng; viên thứ *n* của mọi lần spray đều đi theo cùng một đường (chỉ cộng thêm nhiễu inaccuracy nhỏ). Đây là lý do spray control trong CS là kỹ năng học thuộc được chứ không phải may rủi.
2. **Recoil index (bộ đếm giật).** Engine giữ một chỉ số: mỗi phát bắn +1, khi nhả cò chỉ số **hồi (decay) dần về 0 theo thời gian** — không reset theo băng đạn mà reset theo *thời gian ngừng bắn*. Nhả cò quá sớm rồi bắn tiếp → loạt mới **tiếp nối pattern từ vị trí cũ**, đây là lỗi phổ biến nhất khiến loạt thứ hai bay qua đầu đối thủ.
3. **Inaccuracy cone riêng.** Ngoài pattern, mỗi phát còn có tán xạ ngẫu nhiên trong nón; nón phình ra theo số phát đã bắn và theo chuyển động, thu lại theo *recovery time* của súng.

Nguồn: https://www.norecoil.de/en/blog/how-recoil-works-in-fps-games và https://www.norecoil.de/en/blog/cs2-spray-patterns-ak47-m4a1s-aug

### 2.2. Nguồn gốc pattern trong game file (CSGO kinh điển)

Trong CSGO, pattern không lưu dạng bảng từng viên mà **sinh ra từ seed cố định của súng**: mỗi vũ khí có `recoil_seed`, `recoil_angle` + `recoil_angle_variance` (ví dụ Deagle: angle 0, variance 60), `recoil_magnitude` + `recoil_magnitude_variance` (Deagle: 48,2 / 18, seed 1454). Vì seed cố định theo súng nên dãy sinh ra **giống hệt nhau mỗi lần** → pattern "cố định" thực chất là pseudo-random tất định. Đây là một lựa chọn cài đặt đáng học: chỉ cần vài tham số + seed là có pattern cho mọi súng, thay vì lưu bảng 30 viên.

Nguồn: trích xuất `items_game.txt` của CSGO — https://deepwiki.com/manicogaming/CSGOBetterBots/7.2-weapon-definitions

### 2.3. Số liệu AK-47 (từ weapon file của CS2, qua csdb.gg)

| Thông số | Giá trị |
|---|---|
| Tốc độ bắn | 600 RPM (chu kỳ 0,10 s) |
| Băng đạn | 30 viên |
| Damage thân | 36 (ProjectG dùng 34), headshot ×4 |
| Inaccuracy đứng yên | 0,00641 |
| Inaccuracy cúi (crouch) | 0,0048 |
| Inaccuracy chạy bộ tối đa | 0,17506 — **gấp ~27 lần** đứng yên |
| Recovery time (đứng) | **0,368 s** (M4A4: 0,339 s) |
| Recoil magnitude / variance | 30 / 70 |
| Tổng độ leo (climb) của pattern | **≈ 11,7°** (điểm cao nhất trên điểm ngắm, theo dữ liệu đo Artanis-RCS, sai số ~±10%) |
| Bán kính inaccuracy ở viên thứ 10, cự ly 20 m | ≈ 60 cm (≈ 1,7°) |

Nguồn: https://csdb.gg/weapon/ak-47/ , https://csdb.gg/how-to-aim-in-cs2/ , https://www.xbitlabs.com/cs2-spray-trainer/

**Hệ quả thiết kế quan trọng nhất:** chu kỳ bắn 0,10 s nhưng recovery 0,368 s — một phát bắn "reset hoàn toàn" tốn thời gian bằng ~3,7 phát bắn. Toàn bộ nhịp điệu tap/burst/spray của CS được sinh ra từ tỉ lệ này.

### 2.4. Hình dạng pattern AK-47 theo pha (dữ liệu đo cộng đồng, xbitlabs/Artanis-RCS)

Hướng dưới đây là hướng **đạn bay** (impact); hướng kéo chuột bù là ngược lại:

| Viên | Hướng đạn | Kéo chuột bù |
|---|---|---|
| 2–8 | Leo gần như thẳng đứng (~11,7° tổng leo tập trung ở đoạn này và viên 9–10) | Kéo thẳng xuống |
| 9–15 | Lệch dần sang **phải** | Kéo xuống + sang trái |
| 16–26 | Quét sang **trái** (đoạn ngang dài nhất) | Kéo sang phải, giữ lực kéo xuống nhẹ |
| 27–30 | Đá trở lại **phải** | Kéo sang trái |

Tại sens 1.0 / 800 DPI, kéo bù trọn băng AK ≈ **5 cm chuột**; pattern tính bằng độ nên không đổi theo sens/DPI/FOV — chỉ lượng chuột cần kéo là đổi (CS2: 0,022°/count ở sens 1.0).

Nguồn: https://www.xbitlabs.com/cs2-spray-trainer/

### 2.5. Visual recoil vs actual recoil trong CS (aim punch)

CS tách bạch hai thứ mà người chơi thường tưởng là một:

- `actual_recoil = mAimPunchAngle × weapon_recoil_scale` (mặc định scale = **2,0**) — đây là độ lệch thật của đường đạn.
- `visual_recoil = mViewPunchAngle + mAimPunchAngle × weapon_recoil_scale × view_recoil_tracking` (tracking mặc định = **0,45**) — tâm ngắm/camera chỉ *hiển thị* một phần độ giật thật; đạn thực tế bay cao hơn chỗ crosshair đang chỉ trong lúc spray.

Nguồn: phân tích kỹ thuật aim punch của David Durst (CSKnow) — https://davidbdurst.com/blog/csknow_recoil.html

> Lưu ý cho ProjectG: trên web dùng PointerLock, crosshair luôn ở giữa màn hình và đạn đi theo hướng camera — **không thể** tách visual/actual kiểu CS mà không gây cảm giác "đạn không đi theo tâm". Khuyến nghị ở Phần 7: visual = actual (WYSIWYG), và bù lại bằng view-model kick thuần thẩm mỹ.

### 2.6. Tapping / burst / spray / spray transfer

- **Tapping (xa):** bắn từng phát, chờ ≥ recovery time (AK ~0,37 s) giữa hai phát để giữ first-shot accuracy. Phát đầu của súng đã "nghỉ" có inaccuracy nhỏ nhất.
- **Burst (trung):** 3–6 viên — nằm trong đoạn leo thẳng của pattern, chỉ cần kéo xuống đều; nghỉ giữa các burst phải đủ lâu để recoil index hồi, nếu không burst sau nối tiếp pattern cũ.
- **Spray (gần):** giữ cò hết băng, bù cả 4 pha; chỉ khả thi khi mục tiêu đủ to (cự ly gần) vì inaccuracy cone ở các viên cuối rất lớn bất kể bù pattern chuẩn.
- **Spray transfer:** đang spray mục tiêu A, chuyển sang mục tiêu B *mà không nhả cò* — recoil index **không reset**, người chơi phải biết mình đang ở viên thứ mấy/pha nào của pattern để đặt tâm đón đầu B đúng vị trí bù. Đây là kỹ năng trần cao nhất của hệ CS và chỉ tồn tại được vì pattern tất định + index liên tục.

Nguồn: https://csdb.gg/how-to-aim-in-cs2/ , https://www.norecoil.de/en/blog/cs2-spray-patterns-ak47-m4a1s-aug

### 2.7. Cách người chơi bù giật (để đối chiếu khi thiết kế độ khó)

Kéo chuột theo **nghịch đảo pattern**: xuống trong pha leo → xuống-trái khi đạn lệch phải → phải khi đạn quét trái → trái ở cuối. Học theo từng đoạn (1–5, 1–10, rồi cả băng), không học cả 30 viên một lúc; đa số pha đấu súng kết thúc trong 5–7 viên đầu nên đoạn leo là phần đáng học nhất.

Nguồn: https://csdb.gg/how-to-aim-in-cs2/

---

## 3. Valorant — pattern "nửa ngẫu nhiên": dọc tất định, ngang RNG

### 3.1. Cấu trúc

- **Đoạn mở đầu tất định:** ~4–5 viên đầu của rifle leo dọc gần như giống hệt nhau mỗi lần; đây là vùng burst hiệu quả và là nơi quyết định phần lớn pha đấu súng.
- **Đoạn ngang ngẫu nhiên:** sau đoạn leo, hướng lệch ngang (trái hay phải trước) được **chọn ngẫu nhiên mỗi lần spray**, rồi đổi chiều sau một số viên không cố định. Không thể học thuộc; người chơi giỏi *phản ứng* theo hướng súng/tracer thay vì nhớ pattern. Hệ quả meta: spray dài ngoài cự ly gần là canh bạc, burst 4 viên ở cự ly trung là lựa chọn tỉ lệ thắng cao nhất.
- **Không có first-shot accuracy tuyệt đối:** Vandal có first-shot inaccuracy **0,25°**, Phantom **0,2°** (Vandal khi ADS: 0,157°) — ở cự ly rất xa, phát đầu tiên vẫn có thể trượt đầu dù tâm đặt chuẩn; đây là quyết định cân bằng để súng chuyên tầm xa (Marshal/Operator) còn đất diễn.

Nguồn: https://www.norecoil.de/en/blog/valorant-vandal-vs-phantom-spray-control , https://www.calendar-uk.co.uk/frequently-asked-questions/does-vandal-have-100-accuracy

### 3.2. Gun Recovery Time & Tap Efficiency (số liệu chính thức từ Riot)

Riot công khai hai khái niệm trong patch notes 0.50:

- **Gun Recovery Time**: thời gian phải chờ sau khi bắn để inaccuracy hồi hoàn toàn; bắn lại trước khi hết giờ này thì inaccuracy **cộng dồn**. Patch 0.50 rút Vandal xuống **0,375 s**, một số rifle khác từ 0,55 s → 0,35 s.
- **Tap Efficiency**: tốc độ cộng dồn inaccuracy khi bắn lại sớm — chỉ số càng cao, tap nhanh càng ít bị phạt (Vandal: 4 → 6 ở patch 0.50).
- **Deadzone accuracy:** khi tốc độ di chuyển dưới **30% tốc độ tối đa**, súng được tính là chính xác hoàn toàn — đây là nền của kỹ thuật counter-strafe/deadzone: bắn đúng khoảnh khắc vừa khựng lại.
- **Movement error** (số liệu cộng đồng đo): đứng yên ~0,2°, đi bộ ~3°, chạy ~6,2°, ngồi ~0,17° — phạt di chuyển nặng hơn CS nhiều, ép người chơi phải dừng hẳn.
- **Shooting Error graph** tích hợp trong settings: biểu đồ trực quan tách *firing error* (xanh dương) khỏi *movement error* (cam) theo từng phát — công cụ debug/aim-train ngay trong game.

Nguồn: patch notes chính thức của Riot — https://playvalorant.com/en-us/news/game-updates/valorant-patch-notes-0-50/ ; số movement error: https://www.linegames.org/news/n/view-L3ZhbG9yYW50LWd1bi1tZWNoYW5pY3MtZXphbGxlYW5kLW1vdmVtZW50Lw (nguồn cộng đồng, độ tin cậy trung bình)

### 3.3. Bài học từ Valorant

Ngẫu nhiên hoá hướng ngang **hạ trần kỹ năng spray** nhưng **tăng tính công bằng cảm nhận** cho người mới (không ai "học thuộc" hơn ai ở viên 15+) và chống macro/script bù giật. Cái giá: spray dài mất tính biểu diễn kỹ năng, meta dồn về burst/tap. Với ProjectG (tactical kiểu CS, đối tượng muốn học sâu), chỉ nên mượn *một chút* ngẫu nhiên (jitter nhỏ, xem Phần 7) chứ không mượn toàn bộ mô hình này.

---

## 4. Apex Legends — pattern cố định mềm + recoil là bài toán tracking

### 4.1. Cơ chế

- Pattern mỗi súng **gần như cố định** theo từng lần spray, chỉ có dao động (wobble) nhỏ phủ lên — đủ ổn định để học và kéo bù, nhưng không "sạch" như CS.
- **Attachments thay đổi pattern:** barrel stabilizer giảm biên độ giật; optic **không** đổi pattern thật, chỉ phóng đại cảm giác giật theo độ zoom (visual ≠ actual ở tầng hiển thị).
- Ví dụ (số liệu cộng đồng): R-99 bắn **1080 RPM** — trọn băng 27 viên hết trong ~1,5 s, pattern leo rất nhanh rồi zigzag; R-301 dễ nhất lớp AR: leo 4 viên rồi trôi phải ~8 viên, rồi trái ~4 viên. Flatline: 7 viên đầu giật dọc nặng rồi đá ngang mạnh.

Nguồn: https://www.norecoil.de/en/blog/apex-legends-recoil-r301-flatline-havoc , https://www.ruinerlabs.com/apex-legends-recoil-patterns , bảng drill cộng đồng: https://fpsaim.com/apex-legends-aim-training-controller-vs-mouse-2026.html

### 4.2. Recoil smoothing — điểm khác biệt lớn nhất

Vì TTK cao và mục tiêu liên tục strafe, cộng đồng Apex phát triển kỹ thuật **recoil smoothing**: khi người chơi xoay camera ngang đủ nhanh/đều (tracking theo mục tiêu hoặc strafe ngược hướng), thành phần giật *dọc hiển thị* bị triệt tiêu phần lớn — thay vì kéo xuống thuần tuý, người chơi "trộn" lực kéo xuống vào chuyển động tracking ngang thành một chuyển động liền mạch. Bài học thiết kế: trong game di chuyển nhanh, recoil nên được thiết kế như **bài toán tracking** chứ không phải bài toán thuộc lòng; và visual shake có thể (vô tình hay cố ý) bị ảnh hưởng bởi input của người chơi.

Nguồn: https://pley.gg/apex-legends/aim-guide/

### 4.3. Áp dụng cho ProjectG

ProjectG là tactical (TTK thấp, đứng yên bắn) nên không sao chép recoil smoothing; nhưng nên học Apex ở điểm: **pattern + wobble nhỏ** (giữ 90% tất định) và **attachments/optic chỉ đổi cảm giác, không đổi số** nếu sau này có mod/skin.

---

## 5. Call of Duty / Warzone — visual recoil tách rời actual recoil

CoD là cực đối ngược với CS về triết lý hiển thị:

- **Gun kick**: cú giật *hình ảnh* ban đầu của mô hình súng khi khai hoả — một thông số riêng trong bảng stat của Warzone, tách khỏi vertical/horizontal recoil (độ leo/trôi thật của đường đạn). Attachments/optics trong CoD chỉnh cả ba thông số này độc lập, nên hai build cùng "độ giật thật" có thể *trông* khác hẳn nhau.
- **Visual recoil/view kick**: rung lắc của ống ngắm và thân súng mang tính thẩm mỹ; một phần rung **không di chuyển điểm đạn rơi** — bù theo phần rung này thực tế lại kéo đạn ra khỏi mục tiêu. Các bản Warzone gần đây từng giảm visual recoil/gun kick toàn cục vì cộng đồng phàn nàn súng "khó đọc".
- Pattern đạn thật của Warzone: vẫn có hướng leo/trôi theo súng nhưng bị attachments bẻ hình và có **phương sai ngang** (horizontal variance) — không học thuộc chi li như CS được, người chơi chủ yếu kéo xuống đều + bám mục tiêu (game thiên tracking, TTK trung bình, có ADS và aim assist tay cầm).

Nguồn: định nghĩa stat/gun kick của CoDMunity — https://codmunity.gg/weapon-stats/warzone?selection=%7B%22weapon%22%3A%22TYR%22%2C%22attachments%22%3A%5B%7B%22name%22%3A%22Corio+Eagleseye+2.5x%22%2C%22slot%22%3A%22Optic%22%7D%2C%7B%22name%22%3A%22ZEHMN35+Compensated+Flash+Hider%22%2C%22slot%22%3A%22Muzzle%22%7D%2C%7B%22name%22%3A%22Huntlock+Light%22%2C%22slot%22%3A%22Barrel%22%7D%2C%7B%22name%22%3A%22Ivanov+Support+Brace%22%2C%22slot%22%3A%22Stock%22%7D%2C%7B%22name%22%3A%2212.7x55MM+High+Grain+Rounds%22%2C%22slot%22%3A%22Ammunition%22%7D%5D%7D ; phân biệt visual recoil thuần thẩm mỹ và actual recoil: https://www.norecoil.de/en/blog/how-recoil-works-in-fps-games

> Bài học cho ProjectG: giữ view-model kick (súng giật lên/xoay nhẹ) **thuần thẩm mỹ, biên độ nhỏ và không liên quan tới đường đạn**, để game "có lực" mà không phá tính đọc được của crosshair. Đừng đi xa như CoD — ProjectG không có aim assist và người chơi cần tin crosshair tuyệt đối.

---

## 6. Bảng so sánh tổng hợp

| Tiêu chí | CS2/CSGO | Valorant | Apex Legends | CoD/Warzone | **Đề xuất ProjectG** |
|---|---|---|---|---|---|
| Pattern | Cố định 100% theo súng (seed tất định) | Dọc tất định ~5 viên đầu, ngang RNG | Gần cố định + wobble nhỏ | Có hướng chung, bị attachments bẻ + phương sai ngang | **Cố định theo súng + jitter tất định ±0,03°** |
| Recoil index & reset | Có; hồi theo thời gian (AK recovery 0,368 s) | Gun Recovery Time (Vandal 0,375 s) + Tap Efficiency | Không nhấn index; tính theo băng đang bắn | Không công khai index | **Có index; hồi hàm mũ, ~0,38 s cho burst ngắn** |
| First-shot accuracy | Rất cao khi súng đã nghỉ + đứng yên | Không tuyệt đối (Vandal 0,25°) | Cao khi ADS | Trung bình, phụ thuộc ADS | **Gần tuyệt đối khi index = 0 (0,08°)** |
| Visual vs actual | Visual ≈ 0,45× actual (view_recoil_tracking) + view punch riêng | Khá khớp; có Shooting Error graph | Optic phóng đại cảm giác; recoil smoothing triệt giật dọc hiển thị | Tách hẳn: gun kick/visual recoil phần lớn thẩm mỹ | **Visual = actual (WYSIWYG) + view-model kick thẩm mỹ riêng** |
| Phạt di chuyển | Rất nặng (AK chạy ≈ 27× đứng yên) | Nặng nhất (chạy ~6,2°), có deadzone 30% | Nhẹ hơn, bắn-khi-strafe là meta | Nhẹ; slide/jump bắn là meta | **Nặng kiểu CS (theo tài liệu cơ chế di chuyển riêng)** |
| Kỹ năng trần | Học thuộc pattern 30 viên, spray transfer | Phản ứng hướng ngang, burst kỷ luật | Tracking + smoothing | Tracking + build súng | **Học pattern (đoạn 1–10 là chính) + kỷ luật burst** |
| Chống macro/script | Yếu (pattern cố định = script bù được) | Tốt (RNG ngang) | Trung bình | Trung bình | Jitter tất định theo seed của loạt bắn (đổi mỗi lần reset) làm script kém hiệu quả mà người chơi không nhận ra khác biệt |

---

## 7. ĐỀ XUẤT CÀI ĐẶT CHO ProjectG (phần quan trọng nhất)

### 7.1. Mô hình tổng thể: thay `kick + spreadBloom` bằng `pattern + recoilIndex`

Giữ nguyên khung hiện tại (hitscan, `player.pitch` cộng giật, crosshair nở theo bloom) nhưng thay 3 biến rời rạc bằng **một nguồn sự thật duy nhất** — `recoilIndex`:

```
recoilIndex (float, 0..30)
 ├─► PATTERN[floor(recoilIndex)]  → cộng vào pitch/yaw của camera (phần học thuộc được)
 ├─► coneRadius = base + 0,075° × recoilIndex → tán xạ ngẫu nhiên của đường đạn (phần không bù được)
 └─► crosshairGap = 6px + 1,5px × recoilIndex → hiển thị cho người chơi (phần đọc được)
```

Mỗi phát bắn: `recoilIndex += 1` (kẹp trần = số viên trong pattern), áp offset của viên tương ứng, cộng cone. Khi ngừng bắn: index **hồi hàm mũ** về 0 (mục 7.3). Người chơi kéo chuột ngược pattern để bù — giống hệt vòng lặp kỹ năng của CS, nhưng biên độ đã hiệu chỉnh cho web (mục 7.2).

Nguyên tắc rút ra từ 4 game đã nghiên cứu:

1. **Pattern tất định là xương sống** (CS/Apex) — đừng dùng kick đều như hiện tại: kick đều không tạo ra kỹ năng, chỉ tạo rung.
2. **Chỉ mượn Valorant một chút ngẫu nhiên**: jitter rất nhỏ, tất định theo seed của từng loạt bắn (mục 7.2) — đủ làm macro bù giật kém hiệu quả, không đủ để người chơi cảm thấy "RNG".
3. **Visual = actual** (khác CS và CoD): trên web, crosshair ở giữa màn hình và đạn theo camera; tách hai thứ này sẽ phá niềm tin vào crosshair. "Lực" của súng lấy từ view-model kick + rung màn hình rất nhẹ, thuần thẩm mỹ (bài học CoD, dùng có liều lượng).
4. **Một biến index điều khiển cả ba** (pattern, cone, crosshair) — người chơi đọc được trạng thái súng qua crosshair, đúng triết lý Shooting Error graph của Valorant.

### 7.2. Pattern VK-7 — mảng 30 viên cụ thể

Thiết kế theo hình dạng AK-47 đã đo (tổng leo ≈ 11,7°, pha phải 9–15, pha trái 16–26, đá phải 27–30 — nguồn: https://www.xbitlabs.com/cs2-spray-trainer/) nhưng **phân bổ lại cho web**: AK dồn gần hết 11,7° vào 10 viên đầu (pitch ~1,3–1,5°/viên — quá gắt cho người chơi trình duyệt); VK-7 trải đều hơn — 10 viên đầu leo 9,56°, phần còn lại tiệm cận đủ 11,70° ở viên 30. Biên độ ngang tổng 2,18° (hẹp hơn AK) để spray transfer khả thi ở cự ly map Neon Divide (đa số giao tranh 10–35 m).

Quy ước: `PATTERN[i] = { pitch, yaw }` là **độ xoay camera cộng thêm khi viên i+1 khai hoả** (viên 1 cũng giật, ảnh hưởng viên 2 — đúng mô hình aim punch). Cột "Σ pitch / Σ yaw" là vị trí tích luỹ của tâm ngắm nếu người chơi **không** di chuột — tức hình pattern khi spray vào tường.

| Viên | pitch (°) | yaw (°) | Σ pitch (°) | Σ yaw (°) | Pha |
|---:|---:|---:|---:|---:|---|
| 1 | 1,04 | 0,00 | 1,04 | 0,00 | Leo |
| 2 | 1,08 | +0,01 | 2,12 | +0,01 | Leo |
| 3 | 1,08 | +0,02 | 3,20 | +0,03 | Leo |
| 4 | 1,04 | +0,03 | 4,24 | +0,06 | Leo |
| 5 | 1,00 | +0,04 | 5,24 | +0,10 | Leo |
| 6 | 0,96 | +0,05 | 6,20 | +0,15 | Leo |
| 7 | 0,92 | +0,07 | 7,12 | +0,22 | Leo |
| 8 | 0,88 | +0,10 | 8,00 | +0,32 | Leo |
| 9 | 0,84 | +0,16 | 8,84 | +0,48 | Sang phải |
| 10 | 0,72 | +0,20 | 9,56 | +0,68 | Sang phải |
| 11 | 0,50 | +0,24 | 10,06 | +0,92 | Sang phải |
| 12 | 0,38 | +0,26 | 10,44 | +1,18 | Sang phải |
| 13 | 0,28 | +0,26 | 10,72 | +1,44 | Sang phải |
| 14 | 0,20 | +0,24 | 10,92 | +1,68 | Sang phải |
| 15 | 0,14 | +0,20 | 11,06 | **+1,88** | Cực phải |
| 16 | 0,10 | −0,22 | 11,16 | +1,66 | Quét trái |
| 17 | 0,09 | −0,27 | 11,25 | +1,39 | Quét trái |
| 18 | 0,08 | −0,30 | 11,33 | +1,09 | Quét trái |
| 19 | 0,07 | −0,30 | 11,40 | +0,79 | Quét trái |
| 20 | 0,06 | −0,28 | 11,46 | +0,51 | Quét trái |
| 21 | 0,05 | −0,24 | 11,51 | +0,27 | Quét trái |
| 22 | 0,04 | −0,19 | 11,55 | +0,08 | Quét trái |
| 23 | 0,03 | −0,14 | 11,58 | −0,06 | Quét trái |
| 24 | 0,03 | −0,11 | 11,61 | −0,17 | Quét trái |
| 25 | 0,02 | −0,08 | 11,63 | −0,25 | Quét trái |
| 26 | 0,02 | −0,05 | 11,65 | **−0,30** | Cực trái |
| 27 | 0,02 | +0,10 | 11,67 | −0,20 | Đá phải |
| 28 | 0,01 | +0,14 | 11,68 | −0,06 | Đá phải |
| 29 | 0,01 | +0,17 | 11,69 | +0,11 | Đá phải |
| 30 | 0,01 | +0,19 | **11,70** | **+0,30** | Đá phải |

Dạng code, dán thẳng vào `CONFIG.WEAPONS.VK7`:

```js
// pitch/yaw theo độ; yaw dương = lệch phải. Xem bảng trên để biết Σ tích luỹ.
recoilPattern: [
  [1.04, 0.00], [1.08, 0.01], [1.08, 0.02], [1.04, 0.03], [1.00, 0.04],
  [0.96, 0.05], [0.92, 0.07], [0.88, 0.10], [0.84, 0.16], [0.72, 0.20],
  [0.50, 0.24], [0.38, 0.26], [0.28, 0.26], [0.20, 0.24], [0.14, 0.20],
  [0.10,-0.22], [0.09,-0.27], [0.08,-0.30], [0.07,-0.30], [0.06,-0.28],
  [0.05,-0.24], [0.04,-0.19], [0.03,-0.14], [0.03,-0.11], [0.02,-0.08],
  [0.02,-0.05], [0.02, 0.10], [0.01, 0.14], [0.01, 0.17], [0.01, 0.19],
],
recoilScale: 1.0,   // núm chỉnh toàn cục khi playtest (0,85 = dễ hơn 15%)
```

**Jitter (mượn Valorant có liều lượng):** khi một loạt bắn bắt đầu (index đi từ 0), sinh `spraySeed`; jitter của viên i được suy tất định từ seed: `jitterPitch ∈ ±0,02°`, `jitterYaw ∈ ±0,03°`, tính một lần và lưu vào mảng tạm 30 phần tử cho cả loạt. Loạt sau seed khác. Người chơi không cảm nhận được (nhỏ hơn 3% biên độ pattern), nhưng macro/script ghi sẵn một đường kéo cố định sẽ luôn lệch nhẹ.

**Hệ số tư thế** (kế thừa phác thảo ở `RESEARCH_AND_DESIGN.md` Phần 6): nhân vào cả pattern lẫn cone — ngồi ×0,85; đang di chuyển ×1,15; trên không ×1,50. (Phạt *tán xạ* khi di chuyển thuộc tài liệu cơ chế di chuyển riêng; ở đây chỉ là hệ số giật.)

**View-model kick (thuần thẩm mỹ, bài học CoD):** mô hình súng giật lùi 0,02–0,03 m và xoay pitch +0,6° mỗi phát, hồi bằng lò xo (spring) trong 60–80 ms; cộng rung FOV +0,25° khi bắn liên thanh. Không thành phần nào trong số này chạm vào đường đạn hay camera thật.

### 7.3. Recovery — thông số hồi giật

Mô hình: hồi **hàm mũ** sau một khoảng trễ ngắn, thay cho bloom hồi tuyến tính hiện tại (hồi tuyến tính làm viên thứ 25 hồi nhanh bằng viên thứ 2 — sai cảm giác của cả CS lẫn Valorant).

```js
// mỗi frame, nếu đã ngừng bắn quá RECOIL_DELAY:
recoilIndex *= Math.exp(-dt / RECOIL_TAU);   // VK-7: TAU = 0,13 s (đứng), 0,11 s (ngồi)
if (recoilIndex < 0.5) recoilIndex = 0;      // dưới ngưỡng này coi như đã reset: pattern về viên 1, seed mới
```

| Tham số | VK-7 | P9 | Ghi chú / mốc tham chiếu |
|---|---:|---:|---|
| `RECOIL_DELAY` (trễ trước khi bắt đầu hồi) | 0,07 s | 0,05 s | Ngang ~1 chu kỳ bắn, tránh hồi xen giữa hai phát auto |
| `RECOIL_TAU` đứng / ngồi | 0,13 / 0,11 s | — (xem dưới) | Hằng số thời gian của hàm mũ |
| Thời gian burst 5 viên hồi về < 0,5 | **≈ 0,37 s** | — | Khớp AK CS2 0,368 s và Vandal 0,375 s — nhịp burst chuẩn của cả hai game hội tụ về ~0,37 s |
| Thời gian trọn băng 30 viên hồi về < 0,5 | ≈ 0,60 s | — | Phạt spray hết băng nhưng không "khoá" người chơi quá lâu |
| Recovery pistol | — | **0,20 s cố định** | P9 không có index/pattern: sau 0,20 s không bắn, kick và spread cộng thêm reset sạch (khớp phác thảo nội bộ ở Phần 6) |

Kiểm chứng nhanh công thức: index 5 → sau 0,37 s còn 5·e^(−0,37/0,13) ≈ 0,29 < 0,5 ✓; index 30 → sau 0,60 s còn 30·e^(−0,60/0,13) ≈ 0,30 < 0,5 ✓.

**Nhịp bắn khuyến nghị mà thông số này tạo ra** (ghi vào tutorial trong game sau này): tap chuẩn ≥ 0,37 s/phát ở tầm xa; burst 3–5 viên, nghỉ ~0,37 s; spray chỉ < 15 m; spray transfer giữ nguyên index — không có "ưu đãi" khi đổi mục tiêu.

### 7.4. Cone tán xạ đi kèm index (thay `spread + spreadBloom`)

```
coneRadiusDeg = stanceBase + 0,075 × recoilIndex        (kẹp trần 1,9°)
  stanceBase: đứng 0,08° · ngồi 0,06° · (di chuyển/trên không do tài liệu movement nhân thêm)
```

- Viên 1 (index 0→1): đạn đi trong nón 0,08–0,16° — gần như trúng tâm ở 30 m (lệch ≤ ~8 cm), giữ được cảm giác "phát đầu ăn headshot" của CS mà không cần first-shot tuyệt đối kiểu Valorant tranh cãi.
- Viên 10: nón ≈ 0,83° — bằng ~một nửa mốc CS (AK viên 10 ≈ 1,7° ở 20 m, nguồn https://www.xbitlabs.com/cs2-spray-trainer/): chủ đích dễ hơn CS vì người chơi web ít giờ luyện hơn.
- Thay code hiện tại: bỏ `spreadBloom` (tăng 0,006/phát, hồi 0,03/s) và hằng số `spread: 0.016` rad; hướng đạn = hướng camera + mẫu ngẫu nhiên đều trong nón `coneRadiusDeg` (đổi sang rad khi dùng), cộng sau khi đã áp pattern vào camera.

### 7.5. Crosshair nở theo recoilIndex

Nguyên tắc: **crosshair là đồng hồ đo recoilIndex** — nở tức thì theo index, co lại đúng tốc độ index hồi, người chơi học nhịp burst bằng mắt mà không cần nhìn số.

```js
// thay công thức hiện tại: sp = 8 + spreadBloom * 900 + (moving ? 5 : 0)
gapPx = clamp(6 + recoilIndex * 1.5 + movePenaltyPx, 6, 40)
// movePenaltyPx: đứng 0 · đi bộ 6 · chạy 12 · trên không 20 (tinh chỉnh cùng tài liệu movement)
```

| recoilIndex | 0 | 3 | 5 | 10 | 15 | 20 | 30 |
|---|---:|---:|---:|---:|---:|---:|---:|
| gap (px, đứng yên) | 6 | 10,5 | 13,5 | 21 | 28,5 | 36 | 40 (trần) |

- Tâm ngắm 4 gạch + chấm giữa giữ nguyên; gạch nở **ngay trong frame của phát bắn** (không lerp chiều nở — phản hồi phải tức thì), chiều co dùng chính giá trị index đã decay nên tự khớp.
- Khi index về 0 hoàn toàn, gạch đổi sắc độ nhẹ (vd sáng hơn 15%) trong 100 ms — tín hiệu "súng đã nghỉ, tap được" thay cho việc người chơi phải đoán 0,37 s.
- **Tuỳ chọn nâng cao (mượn Valorant):** chế độ luyện tập hiện thêm *firing-error bar* cạnh crosshair — cột dọc cao theo `coneRadiusDeg`, tô màu theo nguồn lỗi (phần do index màu xanh, phần do di chuyển màu cam). Valorant chứng minh công cụ này rút ngắn thời gian học nhịp bắn rõ rệt (nguồn: https://playvalorant.com/en-us/news/game-updates/valorant-patch-notes-0-50/ và tính năng Shooting Error trong game).

### 7.6. P9 pistol — không pattern, chỉ kick + recovery

Đúng bản chất pistol của CS (hồi theo thời gian, không học pattern — nguồn: https://plg.bet/blog/cs-go-spray-patterns/):

```js
P9: {
  kickPitch: 0.55,          // độ/phát, cộng vào camera, hồi lò xo về 0 trong 0,12 s sau mỗi phát
  kickYaw: ±0,05,           // ngẫu nhiên tất định luân phiên dấu, chỉ để có "cảm giác"
  recoveryTime: 0.20,       // s — bắn lại trước mốc này: phát đó chịu spreadPenalty
  rapidSpreadPenalty: 0.25, // độ cộng thêm vào cone cho mỗi phát "vội", cộng dồn, trần +1,20°
  // spam ở tốc độ tối đa 320 RPM (chu kỳ 0,1875 s < recovery 0,20 s): phát 2+ luôn hơi vội —
  // spam liên tục 5 phát → cone phình thêm ~1,0°: đủ để spam thua tap có nhịp ở >15 m, vẫn dùng được ở gần.
}
```

### 7.7. Tiêu chí nghiệm thu khi cài vào code

1. Spray không bù vào tường ở 15 m: hình đạn tái hiện bảng Σ của mục 7.2 trong sai số jitter (±0,03°/viên).
2. Spray có bù (kéo nghịch pattern bằng tay/script test): chụm đạn trọn băng ≤ 0,5 m đường kính ở 15 m.
3. Tap VK-7 đều nhịp 0,40 s: 10/10 phát trong nón 0,16° (không phát nào bị tính là burst nối pattern).
4. Burst 5 viên → chờ 0,37 s → burst tiếp: loạt hai bắt đầu lại từ viên 1 của pattern (index đã < 0,5).
5. Crosshair: gap đo được khớp bảng 7.5 tại index 0/5/10/20 khi đứng yên.
6. Spam P9 tối đa tốc độ ở 20 m vào bia người đứng: tỉ lệ trúng thân thấp hơn rõ rệt so với tap nhịp 0,25 s (đúng chủ đích thiết kế).

---

## 8. Danh sách nguồn

| # | Nguồn | Dùng cho |
|---|---|---|
| 1 | https://www.norecoil.de/en/blog/how-recoil-works-in-fps-games | Khung khái niệm recoil vs spread, recoil index, visual recoil thẩm mỹ, bảng so sánh các game |
| 2 | https://www.norecoil.de/en/blog/cs2-spray-patterns-ak47-m4a1s-aug | Cấu trúc 3 lớp của CS2, hình dạng pattern AK/M4, burst theo súng |
| 3 | https://www.xbitlabs.com/cs2-spray-trainer/ | Dữ liệu pattern đo thực tế (Artanis-RCS): leo 11,7°, pha bù theo viên, 0,022°/count, spread viên 10 |
| 4 | https://csdb.gg/how-to-aim-in-cs2/ | Số liệu weapon file CS2: recovery AK 0,368 s, chu kỳ 0,10 s, inaccuracy đứng/chạy |
| 5 | https://csdb.gg/weapon/ak-47/ | Bảng stat AK-47 đầy đủ từ game file (damage 36, recoil magnitude 30/variance 70…) |
| 6 | https://davidbdurst.com/blog/csknow_recoil.html | Công thức actual vs visual recoil: weapon_recoil_scale 2,0, view_recoil_tracking 0,45 |
| 7 | https://deepwiki.com/manicogaming/CSGOBetterBots/7.2-weapon-definitions | Thuộc tính recoil seed/angle/magnitude trong items_game của CSGO |
| 8 | https://www.norecoil.de/en/blog/valorant-vandal-vs-phantom-spray-control | Valorant: dọc tất định đoạn đầu, ngang ngẫu nhiên, meta burst 4 viên |
| 9 | https://www.calendar-uk.co.uk/frequently-asked-questions/does-vandal-have-100-accuracy | First-shot inaccuracy Vandal 0,25° / Phantom 0,2° / ADS 0,157° |
| 10 | https://playvalorant.com/en-us/news/game-updates/valorant-patch-notes-0-50/ | Riot chính thức: Gun Recovery Time (Vandal 0,375 s), Tap Efficiency, deadzone 30% |
| 11 | https://www.norecoil.de/en/blog/apex-legends-recoil-r301-flatline-havoc | Apex: pattern + attachments, optic chỉ đổi cảm giác |
| 12 | https://www.ruinerlabs.com/apex-legends-recoil-patterns | Apex: pattern gần như lặp lại, wobble nhỏ, hình dạng theo súng |
| 13 | https://pley.gg/apex-legends/aim-guide/ | Recoil smoothing trong Apex |
| 14 | https://codmunity.gg/weapon-stats/warzone?selection=%7B%22weapon%22%3A%22TYR%22%2C%22attachments%22%3A%5B%7B%22name%22%3A%22Corio+Eagleseye+2.5x%22%2C%22slot%22%3A%22Optic%22%7D%2C%7B%22name%22%3A%22ZEHMN35+Compensated+Flash+Hider%22%2C%22slot%22%3A%22Muzzle%22%7D%2C%7B%22name%22%3A%22Huntlock+Light%22%2C%22slot%22%3A%22Barrel%22%7D%2C%7B%22name%22%3A%22Ivanov+Support+Brace%22%2C%22slot%22%3A%22Stock%22%7D%2C%7B%22name%22%3A%2212.7x55MM+High+Grain+Rounds%22%2C%22slot%22%3A%22Ammunition%22%7D%5D%7D | Định nghĩa gun kick / vertical / horizontal recoil / flinch trong Warzone |
| 15 | `RESEARCH_AND_DESIGN.md` Phần 6 (tài liệu nội bộ ProjectG) | Stat gốc VK-7 (dmg 34, 600 RPM, băng 30), hệ số tư thế ×0,85/×1,15/×1,50, thời gian hồi P9 0,20 s |
