# 02 — Peeking & Giao Tranh Góc (ProjectG)

Nghiên cứu cơ chế peek cho FPS tactical kiểu CS, phục vụ thiết kế bot, map **Neon Divide** (84×60, site A (−27,−19) / B (27,−19) theo tài liệu thiết kế) và việc nâng cấp movement của ProjectG từ "tốc độ hằng số" sang mô hình acceleration/friction để counter-strafe có ý nghĩa.

Quy ước đơn vị: CS dùng *unit* (1 unit ≈ 1 inch ≈ 2,54 cm). ProjectG dùng mét của Three.js; tốc độ chạy tối đa theo tài liệu thiết kế hiện tại là **5,5 u/s** (ở đây hiểu là m/s trong world scale của game).

---

## 1. Nền tảng: vì sao peek thắng "giữ góc đứng yên"

Một pha đấu góc được quyết định bởi 3 lớp lợi thế cộng dồn:

1. **Chủ động (intent):** người peek chọn thời điểm, biết mình sẽ nhìn vào đâu, đã pre-aim sẵn và đang ở tốc độ tối đa; người giữ góc phải *phản ứng* từ trạng thái chờ. Riêng phản xạ thị giác đơn giản của người bình thường đã là **~200–250 ms**, người chơi FPS thuần thục ~180–220 ms, pro ~150–200 ms — và một pha đấu thật còn cộng thêm thời gian nhận diện + quyết định + di chuyển tâm ngắm (thêm ~100–250 ms). Người peek loại bỏ gần hết các khoản này bằng pre-aim và dự đoán. (Nguồn: https://fpsaim.com/reaction-time-test.html, https://csdb.gg/the-cs2-peekers-advantage/)
2. **Hình học tầm nhìn:** vị trí đứng so với góc quyết định ai thấy ai trước và mục tiêu hiện ra "nhanh" cỡ nào trên màn hình (mục 3).
3. **Netcode (khi online):** peeker's advantage do độ trễ mạng + interpolation + lag compensation (mục 4). ProjectG hiện là single-player với bot nên lớp này chưa áp dụng trực tiếp, nhưng nó quyết định độ khó bot cần mô phỏng (mục 6.1).

**Counter-strafing là kỹ năng nền của mọi peek:** trong CS, đạn chỉ chính xác khi gần như đứng yên; counter-strafe = bấm phím ngược hướng di chuyển để hãm vận tốc về 0 nhanh hơn nhiều so với thả phím. Số liệu mô phỏng theo thông số mặc định của CS2 (`sv_friction 5.2`, `sv_accelerate 5.5`, `sv_stopspeed 80`): súng chỉ chính xác khi tốc độ ≤ **34% tốc độ tối đa** (AK-47: ≤ ~73 u/s trên tối đa 215 u/s); counter-strafe đưa tốc độ từ tối đa xuống ngưỡng chính xác trong **~75 ms** và dừng hẳn trong **~120 ms**, trong khi thả phím phải chờ **~207 ms** mới chính xác. (Nguồn: https://www.xbitlabs.com/counter-strafe-trainer/, https://csdb.gg/guides/movement-guide/)

---

## 2. Các kỹ thuật peek

### 2.1 Shoulder peek (peek vai — mồi phát bắn)
- **Cách làm:** đứng sát góc, lộ ra rồi rút vào ngay, chỉ để hở một phần vai/model — thậm chí không cần thấy địch.
- **Vì sao hiệu quả:** mục tiêu không phải lấy thông tin cho mình mà là **bẫy đối thủ khai hỏa** — đặc biệt là sniper (AWP): dụ được một phát bắn trượt thì có cửa sổ ~**1,5 giây** lúc súng ngắm chưa bắn lại được để wide-peek phản công. Cũng dùng để ép địch lộ vị trí qua tiếng súng.
- **Nguyên lý:** thời gian lộ diện cực ngắn < thời gian phản ứng tối thiểu của người giữ (~200 ms+), và phần thân lộ ra là phần khó trúng nhất.
- (Nguồn: https://csdb.gg/guides/advanced-mechanics-guide/, https://skinvault.gg/blog/how-to-peek-correctly-in-cs2-the-complete-guide/)

### 2.2 Jiggle peek (peek rung — lấy thông tin / mồi đạn)
- **Cách làm:** strafe ra–vào liên tục ở mép góc, mỗi lần lộ **~100–200 ms** rồi counter-strafe quay về cover; lặp lại tới khi có thông tin hoặc dụ được phát bắn.
- **Vì sao hiệu quả:** 100–200 ms ngắn hơn thời gian phản ứng của đa số người chơi nên rất khó bị bắn trúng, nhưng đủ để *mắt mình* quét được vị trí địch (mình biết trước mình sẽ nhìn vào đâu). Biến thể nâng cao: jiggle 2 lần rồi bất ngờ wide swing ở nhịp thứ 3 — phá nhịp dự đoán của người giữ.
- **Lưu ý:** jiggle bằng phím A/D thuần túy; counter-strafe ở cả hai đầu (ra và về) để không bị "trôi" ra khỏi cover.
- (Nguồn: https://csdb.gg/guides/advanced-mechanics-guide/, https://boostroom.com/blog/cs2-peeking-guide-swinging-jiggle-peeking-and-prefires)

### 2.3 Wide swing / wide peek (vung rộng — chủ động đấu súng)
- **Cách làm:** chạy hết tốc độ, swing ra **xa khỏi góc** — đi quá điểm mà người giữ đang pre-aim (thường là sát mép góc) thêm 1–2 bước người, rồi counter-strafe dừng và bắn.
- **Vì sao hiệu quả:** (a) người giữ phải **flick** tâm ngắm một quãng lớn thay vì chờ bạn đi vào tâm — mỗi lần flick cộng thêm thời gian + sai số; (b) ở tốc độ tối đa, model của bạn quét qua màn hình địch với vận tốc góc lớn, khó tracking; (c) kết hợp được với prefire khi đã biết vị trí địch. Đổi lại: lộ toàn thân, cam kết hẳn vào pha đấu — nên đi kèm đồng đội trade (mục 5) hoặc utility.
- (Nguồn: https://skinvault.gg/blog/how-to-peek-correctly-in-cs2-the-complete-guide/, https://boostroom.com/blog/cs2-peeking-guide-swinging-jiggle-peeking-and-prefires)

### 2.4 "Ferrari peek" và "Xantares peek"
- **Ferrari peek:** wide swing ở **tốc độ tối đa ngay từ khung hình đầu tiên lộ diện** — đạt được bằng cách lấy đà chạy ngang *từ xa góc* (không đứng sát góc rồi mới chạy), để khi vừa ló khỏi góc đã ở max speed, rồi counter-strafe + headshot gần như tức thì. Người giữ thấy một mục tiêu "nhảy" vào tầm nhìn ở tốc độ tối đa rồi dừng đột ngột — bộ não dự đoán mục tiêu còn tiếp tục di chuyển nên rất dễ bắn trượt theo quán tính.
- **Xantares peek:** biến thể gắn với pro player XANTARES — về bản chất là wide swing tốc độ tối đa kết hợp **crouch ngay lúc dừng + prefire** vào vị trí phổ biến, khiến head-level của model sụp xuống khỏi đường pre-aim của địch trong đúng khoảnh khắc đấu súng.
- **Điều kiện tiên quyết về movement:** cả hai chỉ tồn tại khi game có *gia tốc* — cần một quãng lấy đà để đạt max speed. Đây là lý do trực tiếp ProjectG cần acceleration (mục 6.3): engine tốc độ hằng số hiện tại khiến mọi peek đều là "Ferrari" và mất hẳn lớp kỹ năng này.
- (Nguồn: https://www.ggrecon.com/guides/cs2-peekers-advantage/, https://steamcommunity.com/sharedfiles/filedetails/?l=latam&id=3044534522)

### 2.5 Jump peek (nhảy peek — trinh sát / mồi AWP)
- **Cách làm:** chạy và *nhảy ngang qua* khe sightline (qua cửa, qua khe giữa hai cover), tiếp đất sau cover phía bên kia.
- **Vì sao hiệu quả:** trong lúc bay, model di chuyển theo quỹ đạo parabol với tốc độ ngang tối đa — cực khó bị bắn trúng, đặc biệt là một phát AWP duy nhất; đổi lại người nhảy **không bắn chính xác được khi đang bay** nên đây thuần túy là peek lấy thông tin hoặc mồi phát bắn để đồng đội trade. Thường dùng theo cặp: người 1 jump peek dụ AWP bắn → người 2 swing ra hạ AWP trong cửa sổ ~1,5 s súng chưa sẵn sàng.
- (Nguồn: https://www.hltv.org/forums/threads/2741379/which-peek-is-the-best, https://www.clubtsp.com/how-to-peek-in-cs2-different-types-of-peeks-guide-by-scope-gg.html)

### 2.6 Crouch peek (peek ngồi)
- **Cách làm:** wide swing và **bấm crouch đúng khoảnh khắc dừng** (hoặc crouch-peek chậm khi không bị phát hiện, trong clutch).
- **Vì sao hiệu quả:** đầu của model tụt xuống khỏi đường ngang đầu mà địch pre-aim (hitbox đầu dịch chuyển theo chiều dọc trong vài chục ms), ép địch phải chỉnh tâm xuống — trong khi tâm của *mình* vẫn ở head-level của địch đứng. Đánh đổi: tốc độ khi crouch chỉ còn ~1/3 tốc độ chạy, và nếu lạm dụng sẽ tự hạ tâm ngắm của mình và dễ bị đọc bài; nhiều pro khuyên chỉ dùng như biến thể bất ngờ, không dùng mặc định.
- (Nguồn: https://cs.money/blog/esports/based-movement-in-csgo/, https://www.hltv.org/forums/threads/2741379/which-peek-is-the-best)

### 2.7 Counter-peek (phía người giữ góc)
- Người giữ không đứng yên chờ: khi nghe/đoán địch sắp swing, chủ động **lùi vào cover phá sightline rồi re-peek ra ngay lúc địch commit** — biến mình thành peeker, địch thành người phải phản ứng. Kết hợp jiggle-hold: strafe qua lại sau cover và re-peek mỗi ~1,5–2,5 s thay vì đứng tĩnh 15 s.
- (Nguồn: https://www.1v1.co.uk/2026/09/strategic-guide-defensive-edits-and.html, https://www.gamevault.forum/articles/peekers-advantage-rtt-jitter-lag-compensation-fps-netcode-mathematics)

---

## 3. Hình học góc: gần góc vs xa góc, off-angle, pre-aim

### 3.1 Ai thấy ai trước — quy tắc xa góc
Khi hai người ở hai phía của một góc, **người đứng XA góc hơn sẽ thấy đối thủ trước**. Hình học: đường ngắm (sightline) từ mắt bạn phải "mở" qua mép góc; người ở gần góc có trường nhìn bị mép góc cắt hẹp, và model của họ thò qua mặt phẳng góc sớm hơn — tức là người ở xa đã thấy vai/thân của người gần trong khi người gần chưa thấy gì. Hệ quả thực hành:

- **Khi peek:** đừng áp sát tường/góc. Lùi lại **một–hai bước người (~1–2 m)** khỏi cover rồi mới swing — vừa có quãng lấy đà đạt tốc độ cao, vừa thắng hình học, vừa lộ thân ít hơn ở khung hình đầu.
- **Khi giữ góc:** đứng xa góc (deep angle) để địch phải lộ nhiều thân hơn trước khi thấy bạn; tránh đứng sát góc — đó là vị trí bị thấy trước và bị utility "nướng" đầu tiên.
- **Vận tốc góc:** mục tiêu ở gần bạn quét qua màn hình với vận tốc góc lớn hơn mục tiêu ở xa (cùng tốc độ tuyến tính). Đứng xa góc khiến peeker "chậm lại" trên màn hình của bạn → dễ tracking hơn; ngược lại peeker nên swing qua các góc mà địch ở gần góc của họ.
- **Peek phải vs trái (riêng CS):** camera/vũ khí lệch phải khiến peek từ phía phải của góc lộ ít thân hơn cho cùng một tầm nhìn — chi tiết engine-specific, ProjectG dùng camera trung tâm nên không cần mô phỏng, chỉ ghi nhận.
- (Nguồn: https://skinvault.gg/blog/how-to-peek-correctly-in-cs2-the-complete-guide/, https://boosteria.org/guides/peeking-angle-holding-techniques-cs2, http://csdb.gg/guide-to-crosshair-placement/)

### 3.2 Off-angle
Vị trí giữ **lệch khỏi điểm mà mọi người pre-aim theo thói quen** (không đứng đúng vị trí "chuẩn" sau thùng/góc mà lệch sang một khoảng, đứng cao/thấp bất thường…). Hiệu quả vì nó đánh bại crosshair placement: địch clear góc với tâm đặt sẵn ở vị trí chuẩn, bạn không ở đó → họ tốn thêm một lần flick + nhận diện (~100–300 ms lợi thế dự đoán theo các bài phân tích phản xạ). Đánh đổi: off-angle thường là vị trí hình học *kém* hơn (dễ bị thấy trước nếu địch không pre-aim mà quét rộng), và "cháy" sau một lần dùng — là change-up, không phải mặc định.
(Nguồn: http://csdb.gg/guide-to-crosshair-placement/, https://www.ggrecon.com/guides/cs2-peekers-advantage/)

### 3.3 Pre-aim & "cắt góc" (slicing the pie)
- **Pre-aim:** đặt tâm ngắm sẵn ở head-level, đúng điểm địch sẽ xuất hiện, *trước khi* thấy địch; khi di chuyển dọc hành lang, tâm "trượt" dọc theo tường theo hình học thay vì nhìn thẳng hướng đi.
- **Slicing the pie:** clear từng lát mỏng — mỗi bước strafe chỉ mở thêm đúng **một** sightline mới, tâm đặt sẵn lên lát đó, dừng, rồi mới đi tiếp. Tuyệt đối tránh swing một phát lộ ra trước 2–3 góc cùng lúc (bị crossfire).
- (Nguồn: http://csdb.gg/guide-to-crosshair-placement/, https://counterstrike.shockwave.gg/wiki/sight-lines)

---

## 4. Peeker's advantage dưới góc độ netcode

Công thức trực giác (Riot Games, bài kỹ thuật chính thức về VALORANT): lợi thế của peeker ≈ thời gian thông tin "địch đã ló ra" đi từ client của peeker → server → client của người giữ, cộng buffer xử lý hai đầu và interpolation. Riot đo mức cơ sở là **~141 ms** lợi thế phản ứng cho peeker; sau khi tối ưu (server 128-tick, giảm buffer client xuống ~1 frame, hạ ping mục tiêu 35 ms cho 70% người chơi) giảm ~40 ms còn **~100 ms**, và ở 144 FPS còn **~71 ms** — không bao giờ bằng 0. Riot cũng ghi nhận chênh lệch chỉ **10 ms** đã đủ lật kết quả các pha đấu ngang trình trong test mù nội bộ.
(Nguồn: https://www.riotgames.com/en/news/peeking-valorants-netcode)

Ba thành phần, theo phân tích của CSDB về CS2:
1. **Latency:** input của peeker và snapshot của server đều mất thời gian truyền; không engine nào xoá được.
2. **Interpolation:** client cố ý render người chơi khác *chậm hơn dữ liệu mới nhất* một khoảng (CS2 phơi ra qua `cl_net_buffer_ticks`) để chuyển động mượt — khoảng chậm này đánh đúng vào thứ người giữ đang chờ thấy.
3. **Lag compensation:** server "tua ngược" thế giới về thời điểm người bắn nhìn thấy để xét hit (CS2 giới hạn qua `sv_maxunlag` = 0,2 s) — bảo vệ người bắn, khiến người giữ đôi lúc chết dù đã vào cover trên màn hình của mình.
Sub-tick của CS2 ghi lại thời điểm chính xác của input trong tick, giảm phần trễ do chờ tick, nhưng không chạm được vào latency vật lý và interpolation.
(Nguồn: https://csdb.gg/the-cs2-peekers-advantage/, https://www.codebrew.ai/how/shot-behind-wall)

**Hàm ý cho ProjectG:** bản hiện tại là offline với bot — peeker's advantage "thật" bằng 0 vì mọi thứ cùng một máy/một clock. Muốn bot đấu góc có cảm giác công bằng như online, phải *mô phỏng* nó trong độ trễ phản ứng của bot giữ góc (mục 6.1), thay vì để bot giữ góc phản ứng tức thời 0 ms (sẽ mạnh phi lý) hoặc phản ứng đều như nhau ở mọi tình huống.

---

## 5. Trading (đổi mạng) — phần của giao tranh góc

Trade kill = đồng đội hạ ngay kẻ vừa hạ bạn, biến pha đấu 1v1 bất lợi thành trao đổi có lãi. Điều kiện để trade xảy ra:
- Đồng đội thứ hai ở **gần phía sau** người entry (không quá xa, không cùng một sightline để tránh bị spray transfer 1 băng 2 mạng) và **swing ra ngay khi nghe tiếng súng/thấy đồng đội ngã** — cửa sổ trade hiệu quả chỉ ~**0,3–1 giây** sau contact; chậm hơn thì địch đã counter-strafe về cover hoặc đổi vị trí.
- Người thứ hai không peek cùng lúc cùng một góc (đó là double-peek — một biến thể khác, dùng khi muốn áp đảo bằng hai mục tiêu đồng thời, thường kết hợp jump peek mồi AWP).
- Người giữ góc chống trade bằng cách: hạ xong người đầu thì **đổi vị trí ngay / lùi sâu**, hoặc giữ off-angle mà đường swing trade không pre-aim tới.
(Nguồn: https://boostroom.com/blog/cs2-peeking-guide-swinging-jiggle-peeking-and-prefires, https://www.1v1.co.uk/2026/09/strategic-guide-defensive-edits-and.html)

---

## 6. Đề xuất áp dụng cho ProjectG

### 6.1 Bot: peek, né và giữ góc
Bot hiện tại cần một lớp "duel behavior" gắn trên state machine sẵn có:

1. **Accuracy gate theo vận tốc của chính bot (quan trọng nhất):** bot chỉ được bắn chính xác khi tốc độ của nó < **34% tốc độ tối đa** (như CS). Bot đang strafe mà bắn thì áp spread phạt như người chơi. Đây là điều kiện để counter-strafe của *người chơi* có giá trị và để bot không "vừa chạy vừa laser".
2. **Bot peek theo kịch bản khi clear góc chưa biết thông tin:**
   - ~40%: **jiggle peek** 1–2 nhịp (lộ 120–200 ms) để quét trước khi commit.
   - Khi đã có thông tin vị trí địch (tiếng súng, đồng đội báo, ping từ WHISPER…): **wide swing** hết tốc độ + dừng counter-strafe tại điểm dừng đã chọn trước (điểm dừng = vị trí pre-aim của bot).
   - Gặp góc nghi có sniper giữ: **shoulder peek** mồi 1 lần; nếu nghe tiếng sniper bắn trượt → swing ngay trong cửa sổ 1,5 s.
   - Thi thoảng (theo độ khó/tính cách bot): **crouch khi dừng** (Xantares-style) để phá head-level của người chơi đang pre-aim.
3. **Bot giữ góc không đứng tĩnh:** chọn vị trí **xa góc** và **off-angle** (lệch 0,5–1,5 m khỏi vị trí pre-aim phổ biến, xem 6.2), thỉnh thoảng **jiggle-hold / re-peek** mỗi 1,5–2,5 s. Thời gian phản ứng của bot giữ góc phải **cộng thêm mô phỏng peeker's advantage 60–120 ms** khi mục tiêu swing ở tốc độ tối đa (giảm dần theo độ khó: bot khó ~+40 ms, bot dễ ~+150 ms), trong khi bot đang re-peek thì không cộng — khuyến khích người chơi chủ động peek thay vì giữ bị động, đúng meta CS.
4. **Bot né (defensive):** khi bị peek bất ngờ mà chưa sẵn sàng (đang reload/đang di chuyển), bot ưu tiên **counter-strafe về cover gần nhất** thay vì đứng bắn trả; khi bị flash/ability ép góc thì lùi sâu đổi góc.
5. **Trading:** khi bot đồng đội ngã trong tầm nghe/thấy và kẻ bắn còn trong cửa sổ **≤1 s**, bot thứ hai ở khoảng cách **2–4 m phía sau** (không cùng sightline) lập tức swing ra vị trí kẻ bắn vừa lộ. Đây là hành vi cần thiết để người chơi không thể wide-peek "free" từng người một.

### 6.2 Map Neon Divide: độ rộng cửa/choke để peek có ý nghĩa
Player model giả định rộng ~0,65 m, tốc độ tối đa 5,5 m/s ⇒ mỗi giây đi 5,5 m; một jiggle lộ 150 ms ≈ di chuyển ~0,8 m. Từ đó:

| Hạng mục | Đề xuất | Lý do |
|---|---|---|
| Cửa/lối đơn (doorway phụ, connector) | **1,6–2,0 m** | Rộng ~2,5–3× thân người: đủ jiggle ra–vào và shoulder peek mà không bị "kẹt khung cửa"; hẹp hơn → peek nào cũng thành full-commit |
| Choke chính (mid, cửa vào lane) | **2,4–3,2 m** | Đủ cho wide swing + 1 đồng đội trade phía sau lệch sightline; vẫn đủ hẹp để 1 người giữ góc quan sát |
| Cửa vào site A/B | **3,5–4,5 m** (hoặc 2 cửa 1,8–2,2 m tách nhau) | Entry vào site cần swing đồng thời nhiều hướng; cửa đơn <3 m biến site thành "phễu tử thần" không trade được |
| Quãng lấy đà trước mỗi góc quan trọng | **≥ 2,5–3 m** sàn trống dọc tường trước góc | Để đạt ~max speed trước khi ló (Ferrari/Xantares peek) với gia tốc ở 6.3; góc nào cũng "cụt" <1,5 m thì mọi peek đều chậm như nhau |
| Khoảng lùi sau góc (peek depth phía người giữ) | **≥ 2 m** không gian sau cover của defender | Để defender đứng *xa góc* + off-angle được; cover dính sát tường sau = defender bị ép đứng gần góc = bị thấy trước |
| Lệch off-angle quanh vị trí giữ phổ biến | chừa **ô sàn 1–2 m** bên cạnh vị trí "chuẩn" sau thùng | Tạo lựa chọn off-angle thật, không phải trang trí |
| Chiều dài sightline dài (cho sniper) | **25–35 m**, tránh > 40 m | Ở 35 m và 5,5 m/s, peeker mất ~0,45 s để swing qua 2,5 m đường swing — đủ lâu để sniper bắn 1 phát quyết định nhưng không thành hành lang chết |
| Thùng/crate cạnh góc | đặt **lệch 0,5–1 m** so với đường pre-aim chuẩn | Phá crosshair placement mặc định, tạo duel không đối xứng |

Thêm: mỗi góc quan trọng cần **hai lớp cover liên tiếp** cách nhau 2–4 m để có chuỗi "peek → rút về cover 2" và jump peek qua khe giữa chúng; tránh góc 90° trơ trọi giữa hành lang dài không cover phụ.

### 6.3 Movement: acceleration / friction để counter-strafe khả thi
Hiện tại ProjectG di chuyển tốc độ hằng số (bấm là chạy max, thả là dừng ngay) — counter-strafe không tồn tại, jiggle nào cũng hoàn hảo, và độ chính xác khi di chuyển không có "giá". Đề xuất chuyển sang mô hình **Source-lite** (đơn giản hoá từ CS2: `sv_accelerate 5.5`, `sv_friction 5.2`, `sv_stopspeed 80`, ngưỡng chính xác 34% tốc độ tối đa), dịch sang đơn vị mét/giây của ProjectG:

```js
const MOVE = {
  maxSpeed: { knife: 5.5, pistol: 5.28, smg: 5.17, rifle: 4.73, shotgun: 4.84, sniper: 4.40 },
  // tỉ lệ từ CS: dao 250, pistol 240, AK 215, AWP 200 u/s — nhân với 5.5/250
  groundAccel: 42,        // m/s^2 — đạt ~95% max speed sau ~0,15-0,20 s (CS: ~0,5 s tới max hẳn, nhanh ở đầu)
  groundFriction: 9.5,    // hệ số giảm tốc mũ khi không có input ngược: vel *= max(0, 1 - friction*dt)
  stopSpeed: 0.9,         // m/s — dưới ngưỡng này friction tác dụng mạnh để dừng hẳn, tránh trượt vô hạn
  airAccel: 10,           // m/s^2 trong không khí, airCap: 0.85 m/s — giữ air-strafe nhẹ, không bhop tăng tốc
  walkFactor: 0.52,       // shift-đi bộ (theo CS)
  crouchFactor: 0.34,     // ngồi (theo CS ~1/3)
  accurateRatio: 0.34,    // chỉ chính xác khi speed < 34% maxSpeed của vũ khí đang cầm
};
```

Cách tích phân mỗi frame (đủ cho engine web, chạy ở fixed timestep 120 Hz hoặc substep trong `requestAnimationFrame`):

1. **Friction trước:** `speed *= max(0, 1 - groundFriction * dt)` khi đang trên mặt đất và speed > stopSpeed (dưới stopSpeed thì friction nhân đôi để "dính" hẳn).
2. **Gia tốc theo wishdir:** cộng `groundAccel * dt` theo hướng input, nhưng không cho thành phần vận tốc theo wishdir vượt maxSpeed (project-and-clamp như Source `Accelerate()`).
3. **Counter-strafe tự nhiên xuất hiện:** bấm phím ngược = wishdir ngược → gia tốc 42 m/s² trừ thẳng vào vận tốc, cộng thêm friction → từ 4,73 m/s (rifle) về ngưỡng chính xác (1,61 m/s) trong **~80–100 ms**, dừng hẳn ~140 ms; thả phím trơn chỉ có friction → ~200–230 ms mới chính xác. Chênh lệch ~2× này chính là "skill counter-strafe" cần tạo ra — khớp tỉ lệ CS (75 ms so với 207 ms).
4. **Accuracy coupling:** spread nhân thêm hệ số theo `speed / (accurateRatio * maxSpeed)`: ≤1 → spread gốc; vượt → spread phình tỉ lệ (và jump = spread tối đa). Không có coupling này thì acceleration chỉ là cảm giác, không thành cơ chế peek.
5. **Giữ trần tốc độ cứng** ở maxSpeed của vũ khí (không bhop/air-strafe tăng tốc như CS hardcore) để bot và người chơi cùng một luật, dễ cân bằng trên web.

Với các số trên, thông số peek suy ra cho cân bằng bot/map: quãng lấy đà tới ~max speed ≈ **1,2–1,8 m** (khớp yêu cầu ≥2,5 m sàn trống ở 6.2 tính cả biên an toàn), jiggle lộ 150 ms đi được ~0,7 m ở tốc độ đã lấy đà — vừa đủ lộ vai/thân trên qua cửa 1,6 m mà vẫn rút về kịp.

---

## 7. Tóm tắt 3 đề xuất quan trọng nhất

1. **Thay movement tốc độ hằng số bằng mô hình Source-lite ở 6.3** (groundAccel 42 m/s², friction 9,5, ngưỡng chính xác 34% tốc độ) — đây là điều kiện tiên quyết: không có nó thì counter-strafe, Ferrari peek và toàn bộ lớp kỹ năng peek đều không tồn tại trong ProjectG.
2. **Bot phải bị accuracy-gate theo vận tốc của chính nó và bot giữ góc phải cộng 60–120 ms "peeker's advantage mô phỏng" khi địch swing max speed** — nếu không, bot giữ góc phản ứng 0 ms sẽ mạnh phi lý và người chơi học sai hoàn toàn cơ chế đấu góc.
3. **Map phải cho peek "đất diễn":** cửa đơn 1,6–2,0 m, choke chính 2,4–3,2 m, cửa site 3,5–4,5 m, và bắt buộc ≥2,5 m quãng lấy đà + ≥2 m khoảng lùi xa góc ở mọi góc quan trọng của Neon Divide.

---

## Nguồn

- Riot Games — *Peeking into VALORANT's Netcode* (141 ms, tối ưu còn ~100 ms / 71 ms ở 144 FPS): https://www.riotgames.com/en/news/peeking-valorants-netcode
- CSDB — *The CS2 Peeker's Advantage* (latency / interpolation / lag compensation, `sv_maxunlag` 0,2 s): https://csdb.gg/the-cs2-peekers-advantage/
- CSDB — *CS2 Advanced Mechanics Guide* (jiggle lộ 100–200 ms, shoulder peek vs AWP ~1,5 s): https://csdb.gg/guides/advanced-mechanics-guide/
- CSDB — *CS2 Movement Guide* (tốc độ theo vũ khí: dao 250, AK 215, AWP 200 u/s…): https://csdb.gg/guides/movement-guide/
- XBitLabs — *Counter-Strafe Trainer* (mô phỏng sv_friction 5.2 / sv_accelerate 5.5 / sv_stopspeed 80; chính xác ≤34% tốc độ; counter-strafe ~75 ms vs thả phím ~207 ms): https://www.xbitlabs.com/counter-strafe-trainer/
- SkinVault — *How to Peek Correctly in CS2* (đứng xa góc thắng hình học, wide peek phá pre-aim): https://skinvault.gg/blog/how-to-peek-correctly-in-cs2-the-complete-guide/
- BoostRoom — *CS2 Peeking Guide: Swing, Jiggle & Prefire* (jiggle = thông tin, wide swing = commit + trade): https://boostroom.com/blog/cs2-peeking-guide-swinging-jiggle-peeking-and-prefires
- CSDB — *Guide to Crosshair Placement* (pre-aim, slicing the pie, off-angle): http://csdb.gg/guide-to-crosshair-placement/
- Boosteria — *CS2 Peeking and Angle Holding* (đứng gần góc = lộ sớm và rộng hơn): https://boosteria.org/guides/peeking-angle-holding-techniques-cs2
- GGRecon — *What is peeker's advantage in CS2?* (Ferrari/Xantares peek, chống bằng off-angle/đứng xa góc): https://www.ggrecon.com/guides/cs2-peekers-advantage/
- CS.MONEY — *Movement in CS2* (tăng tốc phi tuyến: 0→50 u/s trong 0,032 s; 250 u/s = 6,35 m/s; crouch = 1/3 tốc độ): https://cs.money/blog/esports/based-movement-in-csgo/
- FPSAim — *Reaction Time Test / benchmarks* (phản xạ thị giác: trung bình 200–250 ms, pro 150–200 ms): https://fpsaim.com/reaction-time-test.html
- GameVault — *Peeker's Advantage & Lag Compensation Mathematics* (công thức cửa sổ hiển thị, jiggle-hold mỗi ~1,5 s): https://www.gamevault.forum/articles/peekers-advantage-rtt-jitter-lag-compensation-fps-netcode-mathematics
- 1v1.co.uk — *Defensive Edits and Counter-Peeks* (counter-peek, trade theo nhịp counter-strafe): https://www.1v1.co.uk/2026/09/strategic-guide-defensive-edits-and.html
