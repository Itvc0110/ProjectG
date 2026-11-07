# 03 — Hệ thống vũ khí (Weapon Classes) — Nghiên cứu & Áp dụng cho ProjectG

> Agent nghiên cứu hệ thống vũ khí. Ngày tổng hợp: 2026-11-08.
> Nguyên tắc xuyên suốt rút ra từ CS2/Valorant: **súng không được phân tầng bằng "sức mạnh tuyệt đối" mà bằng bộ ba (giá mua × kill reward × cửa sổ khoảng cách hiệu quả)**. Súng yếu hơn ở tầm xa được trả kill reward cao hơn để tự tạo vai trò kinh tế (anti-eco), súng áp đảo (AWP) bị cắt kill reward xuống đáy để không tự nuôi được chính nó.

---

## 1. CS2 — hệ phân lớp tham chiếu chuẩn của thể loại tactical

### 1.1. Cách CS2 tự phân lớp

Loadout screen của CS2 dùng 7 nhóm: **Starting Pistol, Other Pistols, Mid-Tier, Rifles, Heavy, Grenades, Equipment**. Điểm thiết kế quan trọng nhất: trong item definitions của Valve, **SMG + shotgun + machine gun nằm chung một block "Mid-Tier"** — vì chúng cùng là "súng khi có tiền nhưng chưa đủ mua rifle" và cùng mang kill reward cao bất thường (CSDB Weapons Guide).

| Lớp | Vai trò cốt lõi | Đặc trưng số học |
|---|---|---|
| **Pistol** | Súng round 1 (pistol round), súng eco/force phụ, súng rút khi rifle hết đạn | Rẻ ($200–$700), armor pen phân cực rất mạnh: từ 47% (Glock) tới 93,2% (Deagle/R8) — pistol đắt tiền được thiết kế để "xuyên giáp như rifle" |
| **SMG** (Mid-Tier) | Anti-eco, force-buy tầm gần, run-and-gun | RPM 667–857, tốc độ di chuyển 220–240 (cao nhất nhóm súng chính), armor pen thấp 57,5–69%, falloff nặng |
| **Shotgun** (Mid-Tier/Heavy) | Giữ vị trí chật (doorway/site nhỏ), ambush | Damage tính **theo pellet**; vô dụng ngoài ~7–10m; kill reward cao nhất nhóm súng |
| **Rifle** | Xương sống full-buy | Lớp duy nhất cân bằng cả 3: damage chết người + tầm xa + spray pattern học được; armor pen 70–100% |
| **Sniper** | Khóa góc dài, ép đối thủ tốn utility | Pen power cao nhất (250); AWP là súng duy nhất one-shot thân qua giáp |
| **Machine gun / Heavy** | Suppression, wallbang diện rộng — thực tế là niche/meme trong competitive | Negev $1.700 (spin-up, càng bắn càng chính xác), M249 $5.200 (đắt nhất game, gần như không ai mua nghiêm túc) |
| **Grenade/Equipment** | Không phải súng nhưng chiếm slot ngân sách: kevlar $650, kevlar+helmet $1.000, defuse kit $400 | "Người mới cắt utility đầu tiên, người giỏi cắt cuối cùng" (CSDB) |

### 1.2. Bốn "trục" phân tầng mà lớp nào cũng bị chi phối

**(a) Armor penetration (%)** — tỉ lệ damage giữ lại khi bắn trúng hitbox có giáp (damage qua giáp ≈ base × armor pen, trước các hệ số khác):

| Vũ khí | Armor pen | Vũ khí | Armor pen |
|---|---|---|---|
| SG 553 | **100%** | AK-47 / Galil | 77,5% |
| AWP | 97,5% | M4A4 / M4A1-S / FAMAS | 70% |
| Desert Eagle / R8 | 93,2% | P90 | 69% |
| Five-SeveN / Tec-9 | 91,1% / 90,6% | SMG phổ thông | 57,5–65% |
| SSG 08 | 85% | Nova | 50% |
| M249 / Negev | 80% / 71% | Glock-18 | 47% |

Hệ quả thiết kế: armor pen là công cụ để **pistol rẻ vẫn đe dọa được full-buy** (Five-SeveN $500 giữ 91% damage qua kevlar → headshot qua mũ vẫn one-tap ở cự ly thực tế), trong khi SMG bị khóa pen thấp để không thay thế rifle khi đối thủ có giáp.

**(b) Kill reward theo lớp** — cố ý *nghịch* với sức mạnh (CSDB Economy Guide, Hotspawn, esblitz đều khớp số):

| Lớp / vũ khí | Kill reward | Ngoại lệ |
|---|---|---|
| Knife | **$1.500** | — |
| Shotgun (Nova, MAG-7, Sawed-Off) | **$900** | XM1014 chỉ $600 |
| SMG | **$600** | P90 chỉ $300 (vì giá $2.350, định vị như rifle) |
| Rifle, pistol, sniper thường, LMG | $300 | CZ75-Auto $100 |
| **AWP** | **$100** | Thấp nhất nhóm súng — "power is the payment" |

Ví dụ kinh tế kinh điển: MP9 $1.250 ăn 3 kill anti-eco = $1.800 (hơn giá súng), trong khi AWPer ăn 4 kill chỉ được $400 — đội có AWP phải để các vị trí khác "gánh" kinh tế.

**(c) Wall penetration (penetration power)** — khác hẳn armor pen: quyết định đạn giữ bao nhiêu damage khi xuyên vật liệu (gỗ dễ xuyên, bê tông/kim loại khó; tối đa 4 bề mặt):

| Pen power | Lớp |
|---|---|
| 100 | SMG, shotgun, hầu hết pistol |
| 200 | Rifle, LMG, Desert Eagle, R8 |
| 250 | Mọi sniper (CS:GO cũ là 300, CS2 hạ còn 250) |

**(d) Damage falloff** — công thức chuẩn Source: `Damage = Base × RangeModifier^(Distance_units / 500)`, 500 units ≈ 12,7m. Hệ số hitgroup: Đầu ×4 (trừ Deagle ×3,9, M4A1-S ×3,475), Ngực ×1,0, Bụng ×1,25, Chân ×0,75.

### 1.3. Vai trò theo trạng thái economy của round

| Trạng thái | Định nghĩa | Lớp súng chủ đạo |
|---|---|---|
| **Pistol round** | Round 1 mỗi half, $800 khởi điểm | Pistol mặc định; nâng cấp tối đa P250/Deagle + giáp nhẹ nếu hy sinh utility |
| **Eco** | Không mua (hoặc gần như không) để round sau full-buy | Pistol mặc định; mục tiêu là plant/cướp súng, không phải thắng bằng hỏa lực |
| **Force-buy** | Tiêu gần hết tiền dù không đủ full-buy, khi round có giá trị chiến lược cao | SMG + giáp, shotgun giữ site, Galil $1.800 / FAMAS $1.950 (rifle giảm giá), Deagle |
| **Half-buy / bonus** | Mua lưng chừng có chủ đích, giữ đủ tiền full-buy round sau | SMG ($600/kill tự nuôi), SSG 08 $1.700 |
| **Full-buy** | Rifle/AWP + giáp đầy đủ + utility (T ≈ $4.600–5.100, CT ≈ $4.800–5.900/người) | Rifle chính; tối đa thường 1 AWP/đội vì giá $4.750 + kit đi kèm ~$6.000 |
| **Anti-eco** | Biết đối thủ đang eco | Cố ý *không* mang súng đắt nhất: SMG/shotgun để farm kill reward $600/$900 và tránh rơi AWP/rifle cho đối thủ nhặt |

### 1.4. Bảng số liệu mẫu CS2 (các khẩu được yêu cầu + đối chứng)

Damage tính theo công thức falloff của CSDB Damage Calculator từ base damage/falloff % của Tradeit (kiểm chứng chéo CSDB Weapons Guide — số làm tròn, **không giáp**; "thân có giáp 0m" ≈ base × armor pen):

| Vũ khí | Lớp | Giá | Base dmg | Đầu/Thân 0m | Thân 15m | Thân 30m | Thân 50m | Thân có giáp 0m | Armor pen | RPM | Băng | Kill reward | Pen power |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| AK-47 | Rifle | $2.700 | 36 | 144 / 36 | 35 | 34 | 33 | ~28 | 77,5% | 600 | 30 | $300 | 200 |
| M4A4 | Rifle | $2.900 | 33 | 132 / 33 | 32 | 31 | 29 | ~23 | 70% | 667 | 30 | $300 | 200 |
| AWP | Sniper | $4.750 | 115 | 460 / 115 | 114 | 112 | 111 | ~112 | 97,5% | 41 | 5 | **$100** | 250 |
| Desert Eagle | Pistol | $700 | 53 | 207 / 53 | 44 | 36 | 28 | ~49 | 93,2% | 267 | 7 | $300 | 200 |
| P90 | SMG | $2.350 | 26 | 104 / 26 | 22 | 18 | 14 | ~18 | 69% | 857 | 50 | $300 (ngoại lệ) | 100 |
| MP9 (đối chứng SMG "chuẩn") | SMG | $1.250 | 26 | 104 / 26 | 22 | 19 | 15 | ~16 | 60% | 857 | 30 | **$600** | 100 |
| Nova (mỗi pellet ×9) | Shotgun | $1.050 | 26/viên | 104 / 26 | 17 | 11 | 6 | ~13/viên | 50% | 68 | 8 | **$900** | 100 |

Đọc bảng này cần thấy 3 đường cong: rifle *gần như phẳng* theo khoảng cách (AK còn 33/36 ở 50m), pistol mạnh/SMG *dốc* (Deagle mất ~47% ở 50m), shotgun *sập* (Nova pellet còn 6 ở 50m — và pellet còn tản, nên damage thực tế còn thấp hơn nhiều).

---

## 2. Valorant — cùng khung lớp, khác triết lý tiền tệ

Phân lớp chính thức (shop): **Sidearm / SMG / Shotgun / Rifle / Sniper Rifle / Machine Gun** (+ melee). Khác biệt cốt lõi so với CS2:

- **Không có kill reward theo lớp.** Kinh tế Valorant chạy bằng win/loss bonus + thưởng plant/spike cố định → lớp súng được phân tầng thuần túy bằng **giá × damage band theo khoảng cách × wall penetration (Low/Medium/High)**. Hệ quả: không có meta "farm tiền bằng SMG", SMG tồn tại nhờ giá rẻ + tốc độ + bắn xuyên khói tốt.
- Damage khai báo theo **dải khoảng cách rời rạc** (0–15m, 15–30m, 30–50m…) thay vì hàm mũ liên tục.
- Giáp (shield 25/50) hấp thụ **66%** damage tới khi vỡ — breakpoint "số viên đạn tới chết" được Riot tính quanh mốc 150 HP (100 + heavy shield).

| Vũ khí | Lớp | Giá (credits) | Damage Đầu / Thân theo dải | RPM | Băng | Pen |
|---|---|---|---|---|---|---|
| Ghost | Sidearm | 500 | 0–30m: 105/30 · 30–50m: ~87/25 | 405 (6,75/s) | 15 | Medium |
| Sheriff | Sidearm | 800 | 0–30m: 159/55 · 30–50m: 145/50 | 240 (4/s) | 6 | **High** |
| Spectre | SMG | 1.600 | 0–20m: 78/26 · 20–50m: 66/22 | 800 (13,33/s) | 30 | Low |
| Judge | Shotgun | 1.850 | 34/viên ×9 (0–10m), tụt nhanh sau 10m | 210 (3,5/s, full-auto) | 5–7 | Low |
| Phantom | Rifle | 2.900 | 0–15m: 156/39 · 15–30m: 140/35 · 30–50m: 124/31 | 660 (11/s) | 30 | Medium |
| Vandal | Rifle | 2.900 | **160/40 ở mọi khoảng cách** (không falloff) | 585 (9,75/s) | 25 | Medium |
| Marshal | Sniper | 950 | 202/101 mọi dải | 90 (1,5/s) | 5 | Medium |
| Outlaw | Sniper | 2.400 | 238/140 mọi dải | 165 (2,75/s) | 2 | High |
| Operator | Sniper | 4.700 | 255/150 mọi dải (chân 120) | ~41 (0,75/s) | 5 | High |
| Odin | Machine gun | 3.200 | 0–30m: 95/38 · 30–50m: 77/31 | 720→936 (spin-up) | 100 | **High** |

Bài học rút ra cho ProjectG: (1) cặp rifle "một khẩu không falloff headshot / một khẩu falloff nhưng RPM + băng + nòng giảm thanh" (Vandal/Phantom) là mẫu thiết kế 2-rifle rẻ mà sâu; (2) **sniper 2 tầng giá** (Marshal $950 bắn thân 101 — giết không giáp nhưng không giết có giáp; Outlaw $2.400 thân 140 — giết giáp nhẹ) tạo nấc thang kinh tế mà CS2 chỉ có ở SSG 08/AWP; (3) Odin chứng minh LMG khả thi khi được định vị bằng **wall penetration High + suppression** thay vì damage thô.

---

## 3. Hero shooter — khi vũ khí gắn với nhân vật

| Mô hình | Game tiêu biểu | Hệ quả lên hệ thống vũ khí |
|---|---|---|
| **Vũ khí khóa cứng theo hero** | Overwatch 2, Marvel Rivals, TF2 (theo class) | Không có economy mua súng; mỗi hero = 1 vũ khí chính là một phần của kit (Widowmaker = sniper, Tracer = dual SMG tầm gần…). Cân bằng làm trên *tổng kit* (vũ khí + ability + HP class), không cân bằng súng độc lập. Đổi hero giữa trận = đổi luôn vũ khí. |
| **Vũ khí dùng chung, hero chỉ là ability** | Apex Legends | Súng là loot dùng chung (phân lớp theo ammo: light/heavy/energy/sniper + tier phụ kiện); hero khác nhau ở passive/tactical/ultimate. Lớp súng và lớp nhân vật tách rời hoàn toàn. |
| **Lai (hybrid)** | Valorant | Súng mua dùng chung theo economy kiểu CS + agent có ability; một số agent có "súng chữ ký" dạng ultimate (Chamber: Tour De Force = Operator tùy biến; Jett: Blade Storm = dao phi). |

Áp dụng cho ProjectG (vốn là lai CS + operator): **không khóa súng theo operator** (sẽ phá economy), nhưng nên cho mỗi operator một *khuyến khích mềm* với một lớp súng — ví dụ giảm giá 10–15% cho lớp "chữ ký" hoặc giảm spread khi dùng đúng lớp — để lớp súng và lớp nhân vật giao nhau mà không phá buy menu dùng chung. Ultimate dạng vũ khí (kiểu Chamber) là hướng mở rộng tốt cho 1–2 operator về sau.

---

## 4. ÁP DỤNG — Roster vũ khí cho ProjectG giai đoạn tới

### 4.0. Hiện trạng (đối chiếu code `dev-v2/index.html` và Phần 6 của `RESEARCH_AND_DESIGN.md`)

- Code hiện có đúng 2 khẩu theo format: `rifle: { name:'VK-7 RIFLE', dmg:34, headMult:4, rpm:600, mag:30, reload:2.1, spread:0.016, auto:true, kick:0.011 }` và `pistol: { name:'P9 PISTOL', dmg:26, headMult:4, rpm:320, mag:12, reload:1.5, spread:0.011, auto:false, kick:0.007 }`. Kill reward hiện **phẳng $300/mọi kill**, giá VK-7 trong buy menu hiện $1.500.
- Phần 6 của tài liệu thiết kế đã spec sẵn nhưng **chưa implement**: VK-5 (rifle rẻ $2.000), DP-50 (pistol nặng $700, dmg 53), SR-99 (sniper $4.750, dmg 112, kill reward $100), K-0 (knife $1.500/kill).
- ⚠️ Lệch số cần chốt khi implement loạt này: giá VK-7 code $1.500 vs spec $2.700; P9 dmg code 26/rpm 320/mag 12 vs spec 25/400/15. **Đề xuất: chuẩn hóa theo Phần 6 (khung giá CS-scale)** vì toàn bộ bảng dưới đây và buy grid 6 nhóm trong tài liệu đều đã neo trên khung đó.

### 4.1. Nguyên tắc thiết kế roster mới (rút từ Phần 1–3)

1. Kill reward theo lớp kiểu CS2: SMG $600, shotgun $900, rifle/pistol/LMG $300, sniper nặng $100, sniper nhẹ $300.
2. Mỗi lớp chiếm một cửa sổ khoảng cách không chồng lấp: shotgun <8m, SMG 5–20m, rifle 10–50m, DMR/scout 25–60m, sniper 30m+, LMG = suppression/wallbang thay vì cửa sổ riêng.
3. Armor pen phân cực: pistol nặng và sniper xuyên giáp cao; SMG/shotgun thấp — để giáp $650 của đối thủ thực sự "tắt" được eco súng rẻ ở tầm xa.
4. Thêm 2 field vào format hiện tại: `price`, `killReward` (và giữ `penetrationPower` theo thang tài liệu: 0 = không xuyên, 1 = xuyên ThinProp −50%, 2 = xuyên tốt nhất; v1 vẫn để đạn dừng ở bề mặt đầu tiên).

### 4.2. Roster đề xuất — 5 khẩu mới (đủ yêu cầu tối thiểu) + 1 khẩu kéo từ spec

Định dạng bám đúng mẫu code hiện tại (`dmg` = damage thân 0m, không giáp; STK tính trên 100 HP):

| Mã | Lớp | dmg | headMult | rpm | mag | reload | spread | auto | kick | Giá | Kill reward | Pen power |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **SM-11 "Bão"** | SMG | 24 | 4 | 900 | 32 | 2,0s | 0,021 | true | 0,006 | $1.250 | **$600** | 1 |
| **SG-12 "Cổng"** | Shotgun (pump, 8 pellet × 14 dmg) | 14/viên | 4 | 68 | 7 (nạp từng viên) | 0,7s + 0,5s/viên | 0,045 (nón pellet) | false | 0,045 | $1.100 | **$900** | 0 |
| **SR-50 "Mắt Mèo"** | Sniper nhẹ (scout) | 80 | 4 | 55 | 6 | 3,0s | 0,001 (scope) / 0,06 (no-scope) | false (bolt) | 0,05 | $2.200 | $300 | 2 |
| **DP-50 "Búa"** *(đã có spec Phần 6 — implement)* | Pistol mạnh | 53 | 4 | 267 | 7 | 2,0s | 0,013 | false | 0,016 | $700 | $300 | 1 |
| **MG-75 "Trâu"** | LMG | 32 | 4 | 750 | 100 | 5,2s | 0,026 | true | 0,010 | $3.400 | $300 | 2 |
| *(tham chiếu — đã có)* VK-7 | Rifle | 34 | 4 | 600 | 30 | 2,4s* | 0,016 | true | 0,011 | $2.700* | $300 | 1 |
| *(tham chiếu — đã có)* P9 | Pistol | 25* | 4 | 400* | 15* | 1,8s* | 0,011 | false | 0,007 | $0 | $300 | 1 |

\* VK-7/P9: giá trị có dấu * là số **chuẩn hóa theo Phần 6** (khác số đang chạy trong code — xem 4.0).

**Snippet CONFIG sẵn sàng để code (đúng format object hiện tại, bổ sung 2 field mới):**

```js
smg:      { name: 'SM-11 SMG',     dmg: 24, headMult: 4, rpm: 900, mag: 32,  reload: 2.0, spread: 0.021, auto: true,  kick: 0.006, price: 1250, killReward: 600, penetrationPower: 1 },
shotgun:  { name: 'SG-12 SHOTGUN', dmg: 14, headMult: 4, rpm: 68,  mag: 7,   reload: 3.4, spread: 0.045, auto: false, kick: 0.045, price: 1100, killReward: 900, penetrationPower: 0, pellets: 8 },
scout:    { name: 'SR-50 SCOUT',   dmg: 80, headMult: 4, rpm: 55,  mag: 6,   reload: 3.0, spread: 0.001, auto: false, kick: 0.050, price: 2200, killReward: 300, penetrationPower: 2, scoped: true },
deagle:   { name: 'DP-50 PISTOL',  dmg: 53, headMult: 4, rpm: 267, mag: 7,   reload: 2.0, spread: 0.013, auto: false, kick: 0.016, price: 700,  killReward: 300, penetrationPower: 1 },
lmg:      { name: 'MG-75 LMG',     dmg: 32, headMult: 4, rpm: 750, mag: 100, reload: 5.2, spread: 0.026, auto: true,  kick: 0.010, price: 3400, killReward: 300, penetrationPower: 2 },
```

**Falloff & spread tư thế bổ sung cho khẩu mới (cùng quy ước Phần 6.2/6.4 của tài liệu thiết kế):**

| Khẩu | R0 falloff | Hệ số/10m | Damage thân 50m | Spread đứng/ngồi/di chuyển/nhảy (°) |
|---|---|---|---|---|
| SM-11 | 10m | 0,90 | ~14 | 0,42 / 0,28 / 1,60 / 3,00 |
| SG-12 | 5m | 0,70 | ~2/viên (hết hiệu quả sau ~15m) | nón pellet 2,6° cố định, gần như không phụ thuộc tư thế |
| SR-50 | 40m | 0,99 | ~79 | 0,03 / 0,02 / 0,90 / 2,20 (có scope); no-scope 4,50° |
| DP-50 | 15m | 0,94 | 42 (theo Phần 6) | 0,45 / 0,28 / 1,60 / 3,00 (theo Phần 6) |
| MG-75 | 18m | 0,95 | ~27 | 0,55 / 0,35 / 2,40 / 3,80; 5 viên đầu spread ×1,4 rồi ổn định (mô phỏng spin-up kiểu Negev, tùy chọn) |

**Breakpoint kiểm chứng nhanh (100 HP, không giáp / có giáp theo mô hình giáp hiện tại của bản build — giáp hấp thụ 50% khi còn giáp):**

- SM-11: 5 viên thân (4 đầu = chết ở phát đầu nếu trúng đầu 96 dmg + 1 viên bất kỳ); không one-tap đầu — đúng vai trò SMG.
- SG-12: đủ 8 pellet trúng thân ở <5m = 112 dmg → one-shot không giáp; qua giáp còn ~56 → cần 2 phát. Đúng mẫu Nova/MAG-7.
- SR-50: thân 80 → 2 phát; đầu 320 → 1 phát mọi giáp. Cố ý **không** one-shot thân qua giáp để chừa đất cho SR-99 ($4.750, kill reward $100) ở tier trên — đúng nấc thang Marshal→Operator / SSG→AWP.
- DP-50: 2 viên thân, 1 đầu (212) — "rifle bỏ túi" cho eco/force, đánh đổi bằng 7 viên + kick lớn.
- MG-75: 4 viên thân, TTK thô ngang VK-7 nhưng thắng ở băng 100 + pen power 2 (wallbang ThinProp ở v2) và thua ở reload 5,2s + spread di chuyển — suppression chứ không phải rifle thay thế.

### 4.3. Vai trò của roster mới trong economy của ProjectG

| Trạng thái round | Lựa chọn từ roster |
|---|---|
| Pistol round | P9 (mặc định) hoặc DP-50 $700 cho người aim tốt (đúng mẫu Deagle/Sheriff round 1) |
| Eco | P9; đội thua nhiều có thể "đánh bạc" 1 SG-12 giữ góc chật — 1 kill = $900 tự nuôi round sau |
| Force-buy | SM-11 + giáp ($1.250 + $650), hoặc SR-50 cho người giữ góc dài khi không đủ $2.700 mua VK-7 |
| Anti-eco | SM-11/SG-12 để farm kill reward $600/$900 thay vì mang VK-7/SR-99 ra "cho không" đối thủ nhặt |
| Full-buy | VK-7 chủ lực; tối đa 1 SR-99 (kill reward $100 — người cầm phải được đội "nuôi"); MG-75 chỉ khi có kế hoạch giữ choke/wallbang cụ thể |
| Bonus round | Giữ SM-11/SG-12 đã mua từ round trước để tích tiền, chỉ nâng cấp khi thua |

Việc cần làm ở tầng code khi implement: (1) thay kill reward phẳng $300 bằng `WEAPONS[x].killReward`; (2) buy menu mở từ 1 nút rifle thành lưới theo 6 nhóm đã spec ở Phần 8 của tài liệu thiết kế (Pistol / SMG / Rifle / Súng nặng / Trang bị / Hỗ trợ); (3) bot AI cần bảng chọn súng theo tiền (eco → P9/DP-50, anti-eco → SM-11/SG-12, full → VK-7, 1 bot được phân vai SR-99/SR-50 theo map angle).

### 4.4. Rủi ro cân bằng cần playtest

- SG-12 + kill reward $900 trong map Neon Divide nhiều góc chật: theo dõi tỉ lệ thắng của đội thủ site khi cầm shotgun — nếu >55% ở rank ngang nhau, giảm pellet xuống 7 hoặc tăng giá lên $1.300 (mẫu MAG-7).
- MG-75 pen power 2 + băng 100 có thể biến thành "Odin wallbang" áp chế Mid; nếu xảy ra, hạ pen xuống 1 trước khi đụng vào damage.
- SR-50 ở $2.200 dễ lấn VK-5 ($2.000, rifle rẻ đã spec): ranh giới là SR-50 chỉ mạnh khi đứng yên scope ở góc dài, no-scope spread 4,50° phải giữ nguyên để không thành rifle đa năng.

---

## 5. Nguồn

**CS2 — số liệu & economy:**
- CSDB — Counter-Strike Weapons Guide (số liệu trích từ weapon data files của CS2): https://csdb.gg/counter-strike-weapons-guide/
- Tradeit — CS2 Weapon Stats (bảng đầy đủ 34 súng: damage, armor pen, falloff/500u, RPM, kill reward, penetration power): https://tradeit.gg/blog/cs2-weapon-stats/
- CSDB — CS2 Economy Guide (kill reward theo lớp, ngưỡng full/half/force-buy): https://csdb.gg/guides/economy-guide/
- CSDB — CS2 Damage Calculator (công thức falloff `Base × RangeModifier^(distance/500)`, hitgroup ×4/×1/×1,25/×0,75): https://csdb.gg/damage-calculator/
- Key-Drop — Wallbangs in CS2 (penetration power 100/200/250 theo lớp): https://key-drop.com/blog/wallbangs-cs2/
- ESBlitz — CS2 Economy Guide (giá súng, ví dụ full-buy T $4.600 / CT $4.800): https://www.esblitz.com/en/poleznoe/cs2-economy-guide

**Valorant:**
- Dot Esports — All weapons in VALORANT (giá + headshot damage toàn roster): https://dotesports.com/valorant/news/all-weapons-in-valorant-so-far
- Dot Esports — VALORANT weapon damage stats (bảng damage theo dải khoảng cách): https://dotesports.com/valorant/news/damage-stats-for-all-weapons-in-valorant
- FoxNGame — Damage rates and stats for all VALORANT weapons (head/body/leg theo dải, wall penetration): https://www.foxngame.com/en/amp/content/damage-rates-and-stats-for-all-valorant-weapons
- 1v9 — VALORANT Weapon Tier List Patch 13.05 (vai trò + penetration Low/Medium/High, kiểm chứng với Riot Arsenal): https://1v9.gg/blog/valorant-weapon-tier-list-best-guns/
- Hotspawn — All weapons in VALORANT (damage theo dải cho Ghost/Sheriff/Marshal/Outlaw): https://www.hotspawn.com/valorant/guide/valorant-all-weapons

**Hero shooter / vũ khí gắn nhân vật:**
- TV Tropes — Hero Shooter (định nghĩa thể loại: vũ khí + ability khóa theo character; ngoại lệ Apex dùng vũ khí nhặt chung): http://tvtropes.org/pmwiki/pmwiki.php/Main/HeroShooter
- Strafe — Overwatch 2 vs Apex Legends (Overwatch: mỗi hero một vũ khí cố định; Apex: loot vũ khí dùng chung, hero chỉ khác ability): https://www.strafe.com/esports-betting/news/overwatch-2-vs-apex-legends-2026/

**Nội bộ ProjectG:**
- `~/workspace/projectg-fps/RESEARCH_AND_DESIGN.md` — Phần 6 (bảng VK-7/VK-5/P9/DP-50/SR-99/K-0, spread, recoil pattern, falloff) và Phần 8 (lưới buy menu 6 nhóm).
- `~/workspace/projectg-fps/dev-v2/index.html` — object `WEAPONS` đang chạy (VK-7/P9) và buy menu hiện tại.

*Lưu ý độ tin cậy: số liệu CS2 lấy từ 2 cơ sở dữ liệu trích xuất game files (CSDB, Tradeit) và đối chiếu chéo — hai nguồn khớp nhau ở mọi khẩu trong bảng mẫu. Số liệu Valorant dao động nhẹ giữa các patch (ví dụ Ghost head 105 vs 107 ở các bản), bảng trên ghi theo dải của Dot Esports/FoxNGame tại thời điểm tra cứu 2026-11-08; khi Riot/Valve ra patch cân bằng, cần kiểm tra lại trước khi dùng làm chuẩn tuyệt đối.*
