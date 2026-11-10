# 06 — Cơ chế đổi tướng giữa trận (Hero Swap)

> Tài liệu nghiên cứu + thiết kế cho ProjectG (tactical FPS theo round, economy, ult tính bằng **năng lượng 100**).
> Số liệu về game khác được kiểm chứng từ patch notes/wiki vào ngày **2026-11-08**; URL nguồn ở cuối file.
> Trạng thái: **luật chơi đã chốt ở Mục 6 — sẵn sàng để code.**

---

## 1. Marvel Rivals — swap tự do tại spawn, giữ tối đa 50% ult

Cách Marvel Rivals (NetEase) vận hành swap:

- **Đổi tướng bất cứ lúc nào trong trận, không giới hạn số lần**, với điều kiện duy nhất: người chơi phải đang đứng trong **phòng spawn (spawn room)** của đội mình. Không tốn tiền, không cooldown, không khoá vai trò (game ra mắt với open queue — không role lock, người chơi tự cân đội hình).
- **Chi phí duy nhất là ult:** khi đổi tướng, *tối đa 50% Ultimate Charge được mang sang* tướng mới. Hiểu đúng cơ chế: đây là **trần (cap)**, không phải tỉ lệ — đang có 100% thì còn 50%, đang có 40% thì giữ nguyên 40% (vì 40% < trần 50%). Ult trong Marvel Rivals tính bằng năng lượng tuyệt đối theo từng tướng (chi phí ult khác nhau theo tướng), và % mang sang được tính trên thang % của tướng mới.
- Hệ quả chiến thuật cộng đồng rút ra ("golden rule"): **chỉ swap khi ult đang thấp** (thường khuyên dưới ~50–75%); thời điểm swap tự nhiên nhất là **ngay sau khi chết** — đằng nào cũng đang ở spawn và ult chưa tích được bao nhiêu.
- **Team-Up abilities** (kỹ năng hợp tác phụ thuộc cặp tướng cụ thể trong đội) tự **bật/tắt theo đội hình hiện tại** — swap không chỉ đổi 1 kit mà còn có thể kích hoạt hoặc làm mất synergy của cả đội. Đây là lớp counter-pick thứ hai ngoài matchup cá nhân.
- Giữa các round competitive, ult **reset về 0** (trừ mode Domination mang ult qua round) — tức swap rẻ nhất là swap ở đầu round, khi chưa có gì để mất.

## 2. Overwatch 2 — swap tại spawn, retention bị nerf liên tục 30% → 25% → 15%

Overwatch là game "thiết kế quanh hero swapping" (đổi tướng trong spawn room, không giới hạn lần, chỉ swap được trong vai trò đã queue ở Role Queue), và lịch sử cân bằng của nó là bài học quan trọng nhất cho ProjectG:

| Thời điểm | Retention khi swap | Nguồn |
|---|---|---|
| OW1 (2016–2022) | **0%** — swap là mất sạch ult | — (luật gốc) |
| OW2 ra mắt, 10/2022 | **giữ tới 30%** ult charge | Patch ghi chú hero passives OW2 |
| Season 3, 07/02/2023 | giảm 30% → **25%** | Patch notes chính thức Blizzard: *"Maximum ultimate charge retained when swapping heroes reduced from 30 to 25%"* |
| Season 8, 05/12/2023 | giảm 25% → **15%** | Patch notes Season 8: *"Maximum ultimate charge preserved on hero swap reduced from 25 to 15%"* |
| Hiện tại (kiểm chứng 2026-11-08) | **15%**, tính theo **điểm ult tuyệt đối**: giữ số điểm đã tích, tối đa bằng 15% chi phí ult của tướng mới | Overwatch Wiki — Ultimate ability |

Hai trích dẫn từ chính Blizzard cho thấy triết lý dao động của họ:

- Khi giảm xuống 15%, giám đốc game Aaron Keller: cơ chế giữ ult *"removes friction when switching heroes"* (giảm ma sát khi đổi tướng — mục tiêu giữ lại), nhưng *"there is a perception that it's almost always an advantage to counter-swap upon dying"* (cộng đồng cảm nhận counter-swap sau khi chết **gần như luôn có lợi**) nên họ hạ retention để xem tỉ lệ swap có giảm không.
- Patch Season 8 ghi: *"Swapping heroes is fundamental to the gameplay of Overwatch"* — swap là nền tảng, vấn đề chỉ là **định giá** nó bao nhiêu.

> **Lưu ý kiểm chứng:** con số "25%" thường được trích dẫn cho Overwatch 2 chỉ đúng ở Season 3–7 (02/2023–12/2023). Con số hiện hành là **15%**. Xu hướng 7 năm của Blizzard là **swap càng ngày càng đắt** — bằng chứng thực nghiệm rằng retention quá hào phóng làm counter-swap trở thành đáp án mặc định ("Counterwatch").

### Trường hợp đặc biệt: Overwatch — Stadium (2025)

Mode round-based best-of-7 của chính Overwatch 2 lại **khoá tướng cả trận, cấm swap hoàn toàn**, và thay swap bằng **economy**: mỗi round người chơi nhận Stadium Cash (bắt đầu 3.500) để mua Items/Powers nâng cấp chính tướng đã khoá trong Armory giữa các round. Blizzard xác nhận trong patch notes Season 16 (04/2025): *"Heroes selected are locked in for the entire match."* Đây là tiền lệ trực tiếp nhất cho ProjectG: **khi game đã có round + economy, nhà thiết kế Overwatch chọn khoá tướng và để economy làm công cụ thích ứng thay cho swap.**

## 3. Nhóm khoá tướng cả trận — Valorant, Apex Legends

- **Valorant (Riot):** chọn agent trước trận, **không thể đổi agent trong suốt trận** — kể cả giữa các round. Thiết kế này gắn với cấu trúc tactical one-life-per-round giống CS: agent là một cam kết chiến thuật, đối thủ phải đọc đội hình và thích ứng bằng **economy + cách dùng utility theo round**, không bằng đổi người. Nó cũng bảo vệ tính toàn vẹn của vòng lặp mua đồ: giá ability/ult point được cân bằng trên giả định kit cố định cả trận.
- **Apex Legends (Respawn):** Legend bị khoá cho cả trận battle royale (đội không trùng Legend). BR không có spawn room an toàn để swap và không có round — đổi tướng giữa trận
...[truncated 13571 chars]