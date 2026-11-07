# 05 — Các hạn chế độ chính xác & di chuyển (Accuracy Penalties) cho ProjectG

> Phạm vi: inaccuracy theo trạng thái di chuyển (đứng / chạy / nhảy / tiếp đất / thang), ngưỡng tốc độ đạt độ chính xác tối đa, counter-strafe, tagging, crouch, penalty khi scope — đối chiếu CS2/CS:GO (dữ liệu game-file) và Valorant (patch notes chính thức của Riot + wiki dữ liệu), rồi suy ra công thức spread áp dụng cho ProjectG.
> Ngày tổng hợp: 2026-11-08. Mọi con số của CS đều lấy từ CS2 Weapon Spreadsheet (dữ liệu trích từ game build 18/03/2026) và các trang dữ liệu trích xuất game-file; đơn vị inaccuracy của spreadsheet là giá trị engine ×1000.

---

## 1. Mô hình inaccuracy của CS — cấu trúc nền

CS không có một "độ lệch" duy nhất. Mỗi vũ khí có một bộ hệ số riêng trong game file (`items_game`), và độ lệch tổng là **tổng cộng dồn** của các thành phần đang áp dụng:

| Trường game-file | Ý nghĩa |
|---|---|
| `inaccuracy_stand` | Độ lệch cơ bản khi đứng yên |
| `inaccuracy_crouch` | Độ lệch cơ bản khi ngồi (thay thế stand, luôn thấp hơn) |
| `inaccuracy_move` | Cộng thêm khi di chuyển — **chỉ bắt đầu tính khi tốc độ vượt ngưỡng ~34% tốc độ tối đa của vũ khí**, và tăng dần theo tốc độ tới giá trị đầy đủ ở tốc độ tối đa |
| `inaccuracy_jump_initial` | Ngay khi rời đất (rất lớn, VD Desert Eagle ≈ 548) |
| `inaccuracy_jump` | Trong lúc trên không (phụ thuộc tốc độ rơi/leo) |
| `inaccuracy_jump_apex` | Tại đỉnh cú nhảy — điểm chính xác nhất khi đang bay, nhưng vẫn rất tệ với hầu hết súng |
| `inaccuracy_land` | Cộng thêm sau khi chạm đất, hồi dần theo recovery time |
| `inaccuracy_ladder` | Trên thang — gần như tệ nhất trong mọi trạng thái |
| `inaccuracy_fire` | Cộng thêm sau mỗi phát bắn; mỗi phát hồi riêng theo `recovery_time_stand` / `recovery_time_crouch` (thường ~0,3–0,4 s) |

Hệ quả thiết kế quan trọng: đứng yên vẫn có độ lệch nền (không súng nào bắn trúng 100% tâm ở mọi cự ly), và **penalty di chuyển lớn hơn bonus crouch khoảng 2 bậc độ lớn** (xem mục 4).

## 2. Bảng số liệu CS2 theo vũ khí (game build 18/03/2026)

Đơn vị inaccuracy: giá trị spreadsheet (×1000 so với giá trị engine dạng thập phân, VD AK-47 stand 7,01 ≈ 0,00701). Mobility = tốc độ tối đa (u/s) khi cầm vũ khí đó.

| Vũ khí | Mobility (u/s) | Tagging | Stand | Crouch | Run (full speed) | Ladder | Jump apex | Sau tiếp đất | Fire/ phát | Recovery crouch / stand (s) |
|---|---|---|---|---|---|---|---|---|---|---|
| AK-47 | 215 | 60% | 7,01 | 5,41 | 182,07 | 280,60 | 147,77 | 33,63 | 7,80 | 0,305 / 0,368 |
| M4A4 | 225 | 60% | 5,50 | 4,70 | 143,38 | 222,59 | 102,77 | 21,66 | 7,00 | 0,242 / 0,339 |
| Desert Eagle | 230 | 60% | 6,20 | 4,18 | 54,30 | 306,00 | 378,30 | 27,00 | 72,23 | 0,450 / 0,811 |
| MP9 (SMG) | 240 | 100% | 9,60 | 8,60 | 38,64 | 298,43 | 59,60 | 13,02 | 3,70 | 0,184 / 0,258 |
| AWP (không scope) | 200 | 65% | 81,00 | 60,80 | 257,48 | 273,20 | 214,83 | 105,61 | 53,85 | 0,247 / 0,345 |
| AWP (scoped) | **100** | — | 2,20 | 1,70 | 178,68 | 273,20 | 136,03 | 20,02 | — | — |
| SSG 08 (không scope) | 230 | 65% | 31,98 | 24,06 | 155,43 | 191,26 | **37,70** | 32,30 | 22,92 | 0,056 / 0,142 |
| SSG 08 (scoped) | 230 | — | 3,23 | 3,03 | 126,68 | 191,21 | **8,95** | 3,55 | — | — |

Đọc bảng này rút ra 5 quy luật:

1. **Chạy = thảm họa với rifle**: AK-47 từ 7,01 (đứng) lên 182,07 (chạy hết tốc) — gấp ~26 lần. SMG chạy tốt hơn hẳn (MP9: 38,64, chỉ ~4 lần stand) — đây là "bản sắc di chuyển" của từng lớp súng.
2. **Thang còn tệ hơn chạy** với đa số súng (AK 280,60; Deagle 306,00).
3. **Nhảy**: đỉnh nhảy vẫn rất lệch (AK 147,77 ≈ 21 lần stand). Ngoại lệ nổi tiếng là SSG 08: jump-apex scoped chỉ 8,95 — gần bằng đứng yên, tạo nên lối chơi "jump scout".
4. **Tiếp đất** bị phạt thêm một nhịp riêng (AK +33,63) rồi mới hồi — bắn ngay khi vừa chạm đất vẫn lệch.
5. **AWP hai chế độ khác nhau hoàn toàn**: không scope thì accurate range chỉ ~1,9 m (stand 81,00 — bắn mò), scope thì 2,20 (chính xác nhất game) nhưng tốc độ bị khóa 100 u/s.

## 3. Ngưỡng tốc độ 34% và counter-strafe

### 3.1. Ngưỡng "accuracy speed"

Trong CS, penalty di chuyển **không tính từ 0**: khi tốc độ ngang còn dưới **~34% tốc độ tối đa của vũ khí đang cầm**, phát bắn giữ nguyên độ chính xác như đứng yên. Vượt ngưỡng này penalty mới tăng dần tới `inaccuracy_move` đầy đủ ở tốc độ tối đa.

| Vũ khí | Tốc độ tối đa | Ngưỡng 34% (u/s) |
|---|---|---|
| AK-47 | 215 | ≈ 73,1 |
| M4A4 | 225 | ≈ 76,5 |
| Knife / C4 | 250 | ≈ 85,0 |
| AWP (scoped) | 100 | ≈ 34,0 |

Hệ quả: jiggle/ADAD ở biên độ nhỏ (chưa vượt ngưỡng) vẫn bắn chính xác; và khi bị tagging làm chậm xuống dưới ngưỡng, người bị bắn *bỗng dưng chính xác trở lại* — lỗi thiết kế "tag into accuracy" mà Valorant phải sửa ở patch 3.0 (xem mục 6), ProjectG phải tránh ngay từ đầu (xem mục 8.4).

### 3.2. Vật lý dừng: friction / acceleration

CS2 dùng các hằng số Source (mô phỏng bởi Counter-Strafe Trainer của xbitlabs, đọc từ console game):

| Hằng số | Giá trị |
|---|---|
| `sv_friction` | 5,2 |
| `sv_accelerate` | 5,5 |
| `sv_stopspeed` | 80 u/s |
| `sv_maxspeed` | 320 u/s (trần server; vũ khí khống chế thấp hơn) |

Thời gian dừng đo bằng mô phỏng 1 ms từ tốc độ tối đa của AK-47 (215 u/s):

| Cách dừng | Tới ngưỡng chính xác (≤73,1 u/s) | Dừng hẳn (0 u/s) |
|---|---|---|
| **Counter-strafe** (thả phím cũ + bấm phím ngược) | **~75 ms** | **~120 ms** |
| Chỉ thả phím (ma sát tự nhiên) | ~207 ms | lâu hơn đáng kể |

Tức counter-strafe rút ngắn thời gian "được bắn chính xác" khoảng **130 ms** — đúng bằng một duel ở tầm pro. Khoảng hở giữa thả phím và bấm phím ngược lý tưởng là 0 ms; giữ cả hai phím cùng lúc làm thời gian dừng phình lên ~200 ms.

## 4. Crouch trong CS

- Mỗi súng có `inaccuracy_crouch` riêng: AK-47 giảm ~23–25% (7,01 → 5,41 theo spreadsheet; 0,00641 → 0,00481 theo bộ dữ liệu trích xuất khác), M4A4 giảm ~15–16% (5,50 → 4,70). Khoảng chung cho rifle: **hệ số ×0,75–0,85**.
- Giá trị lớn hơn nằm ở **recovery**: thời gian hồi inaccuracy sau khi bắn khi ngồi nhanh hơn đứng 17–29% ở rifle (AK 0,305 s vs 0,368 s; M4A4 0,242 s vs 0,339 s) — crouch giúp tap/burst nhịp nhanh chính xác hơn, không chỉ viên đầu.
- Nhưng crouch khóa di chuyển: penalty chạy (gấp ~26 lần) lớn hơn bonus crouch (~105 lần theo độ lớn tuyệt đối ở AK) — crouch chỉ có ý nghĩa **sau khi đã dừng**.
- Engine giới hạn spam duck: `sv_timebetweenducks` mặc định 0,4 s.

## 5. Penalty tốc độ khi scope (CS)

| Trạng thái | Tốc độ (u/s) | Ghi chú |
|---|---|---|
| Knife / C4 | 250 | Nhanh nhất game |
| SSG 08 (kể cả scoped) | 230 | Ngoại lệ: scope không giảm tốc |
| AK-47 / M4A4 | 215 / 225 | Rifle tiêu chuẩn |
| AWP không scope | 200 | |
| AUG / SG 553 scoped | 150 | Từ 220 / 210 |
| **AWP scoped** | **100** | = 40% tốc độ knife, 50% tốc độ cầm AWP thường |
| Negev | 150 | Súng máy hạng nặng |

Từ 10/2025, CS2 còn hiển thị inaccuracy trực tiếp trong ống ngắm của sniper — người chơi *nhìn thấy* khi nào mình đã đủ chậm để bắn trúng.

## 6. Tagging — bị bắn thì chậm bao nhiêu?

### 6.1. CS

- Cơ chế (từ release notes chính thức của Valve, bản cập nhật tagging): độ chậm **dựa trên vũ khí nạn nhân đang cầm** (mobility càng cao → bị tag càng nhẹ), tính qua chỉ số **Tagging Power của vũ khí bắn trúng**, và **cộng dồn nhẹ** nếu trúng nhiều phát liên tiếp trong thời gian ngắn; trúng HE cũng gây tag theo damage.
- Tagging Power theo spreadsheet CS2: pistol 50–60%, **rifle 60%**, AWP/SSG 65%, **SMG 100%**, shotgun 60%, LMG 60%.
- Ở tầng engine CS:GO cũ, hệ số tốc độ khi bị tag là `FlinchVelocityModifierLarge 0,40` (trúng thân trên) / `FlinchVelocityModifierSmall 0,55` (chi dưới) — tức tốc độ bị ép xuống còn ~40–55% tối đa tại thời
...[truncated 15821 chars]