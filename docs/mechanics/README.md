# Cơ chế game — tổng hợp nghiên cứu (6 mảng)

Tài liệu tổng hợp từ 6 agent nghiên cứu song song (2026-11-08). Chi tiết đầy đủ nằm ở từng file 01–06 trong thư mục này; trang này chốt các quyết định sẽ áp dụng vào ProjectG.

## 1. Recoil (`01-recoil.md`)
Thay mô hình `kick + spreadBloom` bằng **pattern + recoilIndex** kiểu CS: VK-7 có mảng pattern 30 viên cụ thể (tổng leo ≈ 11,7°, trải đều hơn AK-47 cho hợp người chơi web), có recovery và crosshair nở theo recoilIndex. P9 chỉ dùng kick + recovery 0,20s.

## 2. Peeking (`02-peeking.md`)
Điều kiện tiên quyết: **movement có gia tốc** (groundAccel ≈ 42 m/s², friction ≈ 9,5) và ngưỡng chính xác 34% maxSpeed — không có thì counter-strafe và Ferrari peek không tồn tại. Bot giữ góc phải cộng 60–120 ms "peeker's advantage mô phỏng"; bot biết jiggle/shoulder-bait/wide-swing và trade trong ≤1s. Chuẩn hoá cửa map: cửa đơn 1,6–2,0 m, choke 2,4–3,2 m, cửa site 3,5–4,5 m, quãng lấy đà ≥2,5 m trước góc.

## 3. Vũ khí (`03-weapons.md`)
Roster mở rộng đề xuất (đúng format `WEAPONS` hiện tại): **SM-11 "Bão"** SMG $1.250 (kill reward $600), **SG-12 "Cổng"** shotgun $1.100 (reward $900), **SR-50 "Mắt Mèo"** sniper nhẹ $2.200, **DP-50 "Búa"** pistol mạnh $700, **MG-75 "Trâu"** LMG $3.400. Kill reward theo từng súng thay cho $300 phẳng. Không khoá súng theo operator — chỉ "khuyến khích mềm".

## 4. Aiming (`04-aiming.md`)
Lệch chuẩn lớn nhất hiện tại: sensitivity cố định ≈ 9,5 cm/360 — nhanh gấp ~5 lần dải pro (trung vị eDPI 800–830, ≈47 cm/360). Chuẩn mới: hệ số `0.00045 × slider`, slider 0,50–2,50 mặc định 1,00 (≈44,3 cm/360 ở 800 DPI), raw input `unadjustedMovement`, FOV mặc định 74° dọc. Bot phải "như người": reaction 160–480 ms theo bậc, không bao giờ <150 ms, có overshoot và lỗi Gauss.

## 5. Độ chính xác & di chuyển (`05-accuracy-movement.md`)
Công thức chốt: `spread = (base + moveTerm + airTerm + landTerm + bloom) × adsFactor`, deadzone 34% tốc độ, trên không +0,085 rad, tagging tốc độ ×0,55 trong 0,35s khi trúng đạn rifle, vật lý dừng: accel 40 / ma sát 17 / counter-strafe 46 m/s² (đạt ngưỡng chính xác ~75 ms).

## 6. Đổi tướng giữa trận (`06-hero-swap.md`)
Chốt **Phương án B — đổi tướng giữa các round**: chỉ trong buy phase tại spawn, tối đa 1 lần/round và 3 lần/trận, lần đầu miễn phí, sau đó $400/lần, năng lượng ult sau swap = `min(25, floor(energy × 0.25))`, giữ súng/giáp/tiền, Q/E của tướng mới chịu nửa cooldown đầu round. (Tham chiếu: Marvel Rivals swap tự do giữ ult trần 50%; Overwatch 2 hiện giữ 15%; Stadium của chính OW2 khoá tướng và dùng economy.)

## Lộ trình áp dụng
- **v3 (đang làm):** recoil pattern + recoilIndex, spread theo vận tốc + vật lý gia tốc/counter-strafe + tagging, sửa sensitivity + slider/FOV, bot phản ứng như người.
- **v3.1 (tiếp theo):** roster 5 súng mới + kill reward theo súng, luật hero-swap Phương án B, chuẩn hoá kích thước cửa/choke trên map theo mục Peeking.
