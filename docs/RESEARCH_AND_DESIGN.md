# PROJECTG FPS — RESEARCH & DESIGN (Bản tổng hợp chính thức v1)

> **Dự án:** Game FPS tactical trên web — repo GitHub `Itvc0110/ProjectG`, nhánh đích khi code: `muse/fps-abilities-v1` (không commit/merge vào `main` khi chưa được duyệt).
> **Baseline:** Cơ chế chung của thể loại tactical shooter 5v5 đặt/gỡ bom (vòng round, economy, plant/defuse) — **chỉ học cơ chế chung**. Toàn bộ asset, map, tên nhân vật/vũ khí trong tài liệu này là **gốc 100%**, KHÔNG sao chép asset/map/tên riêng của CSGO/Valve.
> **Điểm khác biệt:** Mỗi người chơi chọn 1 trong 8 operator có kỹ năng đặc biệt (Q / E / X / passive) — xem Phần 4.
> **Cách tài liệu này ra đời:** 10 subagent nghiên cứu song song, 50 vai trò chuyên môn (5 vai trò/nhóm, không trùng lặp). Tài liệu này là bản tổng hợp + chuẩn hoá duy nhất để code theo.
> **Ngày:** 2026-11-08.

---

## MỤC LỤC

- [Phần 0 — Chuẩn hoá chung & 5 quyết định quan trọng nhất](#phần-0--chuẩn-hoá-chung--5-quyết-định-quan-trọng-nhất)
- [Phần 1 — Engine & Tech (Nhóm 1)](#phần-1--engine--tech-nhóm-1)
- [Phần 2 — Asset & Model Routes (Nhóm 2)](#phần-2--asset--model-routes-nhóm-2)
- [Phần 3 — Game Design: Mode đặt bom 5v5 (Nhóm 3)](#phần-3--game-design-mode-đặt-bom-5v5-nhóm-3)
- [Phần 4 — 8 Operator & Hệ thống kỹ năng (Nhóm 4)](#phần-4--8-operator--hệ-thống-kỹ-năng-nhóm-4)
- [Phần 5 — Bot AI (Nhóm 5)](#phần-5--bot-ai-nhóm-5)
- [Phần 6 — Weapons & Ballistics (Nhóm 6)](#phần-6--weapons--ballistics-nhóm-6)
- [Phần 7 — Map "Neon Divide" (Nhóm 7)](#phần-7--map-neon-divide-nhóm-7)
- [Phần 8 — Audio / UI / HUD (Nhóm 8)](#phần-8--audio--ui--hud-nhóm-8)
- [Phần 9 — Performance & QA (Nhóm 9)](#phần-9--performance--qa-nhóm-9)
- [Phần 10 — Kiến trúc code & Tích hợp (Nhóm 10)](#phần-10--kiến-trúc-code--tích-hợp-nhóm-10)
- [Phụ lục A — CONFIG tổng hợp (dán thẳng vào `src/core/config.js`)](#phụ-lục-a--config-tổng-hợp)
- [Phụ lục B — Bảng nguồn & license tổng hợp](#phụ-lục-b--bảng-nguồn--license-tổng-hợp)

---

## Phần 0 — Chuẩn hoá chung & 5 quyết định quan trọng nhất

Các nhóm nghiên cứu độc lập nên một số con số vênh nhau. Bảng dưới đây là **bản chuẩn hoá có hiệu lực trên toàn tài liệu** — khi code, nếu có mâu thuẫn, lấy cột "Chốt" (kèm điều chỉnh tương ứng trong từng phần).

### 0.1. Năm quyết định quan trọng nhất

1. **Engine: Three.js** (MIT, ~117.694 stars) + `PointerLockControls` chính thức + collision AABB tự viết + bắn hitscan. Babylon.js là phương án B, Godot Web bị loại cho v1 (xuất nhiều file `.wasm/.pck` ~15–40MB, không hợp mô hình repo web). Không fork bất kỳ repo FPS mẫu nào làm base — chỉ bám example pointer-lock chính thức của Three.js. *(Phần 1)*
2. **Cấu trúc code: `index.html` mỏng + ES Modules tách file, không bundler** (Nhóm 10), thay cho phương án 1-file: 10 nhóm cùng sửa 1 file sẽ xung đột liên tục và file HTML nguyên khối 150–300KB rất dễ vỡ khi push qua GitHub Contents API. `index.html` giữ < 300 dòng/< 15KB; mỗi file `src/*.js` < 800 dòng/< 40KB. *(Phần 10)*
3. **Map "Neon Divide" là nguồn tọa độ duy nhất**: 84×60 unit, T Spawn `(0,24)`, CT Spawn `(0,-24)`, Site A tâm `(-27,-19)`, Site B tâm `(27,-19)`, 68 khối hộp có tọa độ sẵn. Đồ thị waypoint của Bot AI (Phần 5) giữ nguyên topology nhưng **tọa độ được ánh xạ lại** theo map này (bảng 5.1b) — không dùng hệ 120×120 trong bản nháp của Nhóm 5. *(Phần 5, 7)*
4. **Ability không thay thế gunplay**: 8 operator gốc, mỗi người Q (tactical) / E (utility) / X (ultimate, 6–7 điểm) / passive. Mọi tường/công trình đều có HP và phá được bằng súng; recon không phải wallhack (chỉ ping 2 lần, không xuyên 2 tường); không ability nào 1-hit-kill hay tự thắng round. Vũ khí chuẩn CS-style vẫn quyết định 70–80% kết quả. *(Phần 4)*
5. **Một luật chơi — một đường ống**: Bot dùng **chung** hệ thống di chuyển + hitscan + `takeDamage()` với người chơi (bot chỉ trả về `InputState`). Chỉ `combat.js` được trừ HP, chỉ `game.js` được chuyển phase, chỉ `main.js` được có vòng lặp render và `THREE.Clock`. Đây là 3 quy tắc chống 90% lỗi tích hợp. *(Phần 5, 10)*

### 0.2. Bảng chuẩn hoá thông số xuyên nhóm

| Hạng mục | Chốt | Ghi chú điều chỉnh |
|---|---|---|
| Three.js version | **0.160.0** qua jsDelivr, importmap, module (không UMD) | Thống nhất snippet của Nhóm 9 & 10 |
| Thời gian 1 round (live) | **115s** | Theo Nhóm 3; ghi đè `TIME_ROUND=100` trong nháp Nhóm 10 và "round 100s" trong nháp Nhóm 4 |
| Freeze / buy phase | **15s**; được mua thêm trong **20s đầu live** nếu còn đứng trong spawn | Nhóm 3 |
| Plant / Defuse / Bomb timer | **3.2s / 5s (có kit) – 10s (không kit) / 40s** | Thống nhất 4 nhóm; ghi đè "3.5s" trong nháp Nhóm 5 |
| Round end | **7s** | Nhóm 3; ghi đè 5s trong nháp Nhóm 10/QA |
| Operator select | **20s**, hết giờ auto-pick | Nhóm 10; HUD (Nhóm 8) hiển thị theo `phaseTimer`, không tự đếm 30s |
| Format trận | **MR12**: 24 round, thắng 13, đổi phe sau round 12, OT MR3 (tiền $10.000) khi hoà 12–12 | Nhóm 3 |
| Tốc độ chạy tối đa (cầm dao) | **5.5 unit/s**; các vũ khí nhân hệ số % ở bảng Phần 6 (VK-7 = 79,6% → 4,38 u/s…) | Map (Nhóm 7) được cân bằng theo 5,5; ghi đè 4,8/5,0 trong nháp Nhóm 1/5. Đi bộ (Shift) 2,5 u/s; ngồi 1,7 u/s |
| Trọng lực / nhảy | Gravity **22 m/s²**, vận tốc nhảy **5,2 m/s** → cao ~0,61m | Đủ nhảy lên platform/barrier 0,6 (khối 25/27/39/40/64/67 Phần 7), không tự nhảy lên crate_half 1,1. Ghi đè 7,0 m/s của Nhóm 1 cho khớp hình học map |
| Player AABB | Rộng 0,7 × cao 1,8 × sâu 0,7m; mắt 1,62m; ngồi cao 1,35m, mắt 1,15m | Nhóm 1 |
| Headshot | **Theo từng vũ khí ở Phần 6**: hệ số vùng — Đầu ×4,0 / Ngực ×1,0 / Bụng ×1,25 / Chân ×0,75 (tính trên damage thân) | Ghi đè "×2,0" trong nháp Nhóm 9 (mục QA) & Nhóm 10 (API combat): `takeDamage` phải tra `headMult` từ `CONFIG.WEAPONS`, không hardcode |
| Giáp (armor) | Mua $650 (thân) / $1.000 (thân+mũ); giáp **hấp thụ 50% damage** (phần hấp thụ trừ vào điểm giáp) trong khi còn giáp | Nhóm 3 (giá) + Nhóm 10 (cơ chế). Mọi damage ở Phần 6 là **khi không giáp** |
| Defuse kit | **$400**, chỉ phe Thủ (DEF) | Nhóm 3; ghi đè "$200" trong ví dụ Buy Menu của Nhóm 8 |
| Slot kỹ năng | Chỉ **Q / E / X + passive** — không có slot C ở v1 | Nhóm 4 là chuẩn; API `castAbility` ở Phần 10 dùng `'Q'\|'E'\|'X'` |
| Điểm ultimate | Theo từng operator: **6 hoặc 7 điểm** (bảng Phần 4). Cộng điểm: Kill +1, Assist +1, Plant/Defuse +2, nhặt Orb ở Mid +1 (2 orb/round), đầu round +1 | Nhóm 4; ghi đè "X cần 7 điểm cố định" trong nháp Nhóm 10 |
| Tên hiển thị vũ khí | Dùng **tên mã nội bộ Phần 6** (VK-7, VK-5, P9, DP-50, SR-99, K-0) trên HUD/killfeed | Thay các placeholder kiểu "AK-47/AWP" trong nháp Nhóm 8 |
| Minimap | Canvas **210×150 px** (2,5 px/m cả 2 trục, không méo vì map 84×60 tỉ lệ 7:5): `px=(x+42)*2,5`, `py=(z+30)*2,5`, north-up, vẽ lại 20 FPS | Điều chỉnh từ nháp Nhóm 8 (vốn giả định map 60×60); giữ nguyên công thức tham số hoá theo `MAP_BOUNDS={minX:-42,maxX:42,minZ:-30,maxZ:30}` |
| File UI/Audio | Plain JS theo cây thư mục Phần 10: `src/audio/audio.js`; `src/ui/hud.js` (HUD+killfeed+hitmarker+crosshair), `src/ui/minimap.js`, `src/ui/menus.js` (buy menu + operator select) | Gộp bản nháp TypeScript của Nhóm 8 vào cấu trúc Nhóm 10; giữ nguyên toàn bộ thông số SFX/HUD của Nhóm 8 |
| Phe / ID | Team: `'ATK'` (Công, spawn Nam) \| `'DEF'` (Thủ, spawn Bắc). Người thật `'P1'`, bot `'B1'..'B9'`. Trục: +X = Đông (sang B), −X = Tây (sang A), +Z = Nam (về ATK), −Z = Bắc (về DEF) | Nhóm 7 + 10 |

---

## Phần 1 — Engine & Tech (Nhóm 1)

### 1.1. Chốt: Three.js

| Lựa chọn | Stars (snapshot 2026-11-08) | License | Bundle tối thiểu | Kết luận |
|---|---|---|---|---|
| **Three.js** — https://github.com/mrdoob/three.js/ | ~117.694 | **MIT** (https://github.com/mrdoob/three.js/blob/master/LICENSE) | ~556KB min / ~139KB gzip | **CHỌN cho v1** |
| Babylon.js — https://github.com/BabylonJS | ~26.303 | Apache-2.0 | ~1.516KB min / ~352KB gzip (nặng ~2,7×) | Phương án B nếu sau v1 cần physics/GUI/XR tích hợp |
| Godot — https://github.com/godotengine/godot | ~110.926+ | MIT | Web export ~15–40MB (`.wasm`+`.pck`), không ra 1 file, không mở `file://`, chỉ Compatibility renderer (WebGL2) | **Loại cho v1** |

Lý do chọn Three.js: nhẹ nhất; có example FPS chính thức `misc_controls_pointerlock` + `PointerLockControls` (chỉ lo pointer lock + mouse-look, WASD tự viết); geometry dựng bằng code; không build step; hệ sinh thái mẫu FPS lớn nhất.

Docs Godot web export (để đối chiếu): https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html

### 1.2. Repo FPS mẫu — chỉ tham khảo, KHÔNG fork làm base, KHÔNG copy asset

| Repo | URL | Stars | License | Đánh giá |
|---|---|---|---|---|
| mohsenheydari/three-fps | https://github.com/mohsenheydari/three-fps | 230 | MIT | Dùng ammo.js (physics nặng) — trái chủ trương nhẹ; asset mẫu có license riêng (CC BY 4.0/Mixamo). Chỉ học kiến trúc |
| BenDBSS/Riposte-Frontline-Source | https://github.com/BenDBSS/Riposte-Frontline-Source | 90 | MIT cho code, trừ NOTICE.md (tên/logo/nhạc/anim bị loại trừ) | Bằng chứng "Three.js gom 1 file HTML" làm được FPS thật; là snapshot, không fork |
| madeyexz/turfwar | https://github.com/madeyexz/turfwar | — | MIT | Round-based + economy gần hướng ProjectG, nhưng stack TypeScript + SpacetimeDB quá nặng cho v1 |
| weichu2002/ThreeJS_FPS_2.0 | https://github.com/weichu2002/threejs_fps_2.0 | 0 | MIT | Modular hoá example FPS gốc; chỉ tham khảo cách chia file |
| JamesLMilner/threejs-fps-controls | https://github.com/JamesLMilner/threejs-fps-controls | 16 | MIT | Từ 2016, coi như không còn maintained |
| pmndrs/cannon-es | https://github.com/pmndrs/cannon-es | 2.076 | MIT | Physics engine — v1 **không cần** (xem 1.4) |
| schteppe/cannon.js | https://github.com/schteppe/cannon.js/ | 5.012 | MIT | Bản gốc cũ của cannon-es — không dùng |

**Base đúng:** example pointer-lock chính thức của Three.js (MIT). Pointer Lock API: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API — gọi `requestPointerLock({unadjustedMovement:true})` để lấy raw input, fallback gọi không tham số khi bị reject.

### 1.3. Thông số kỹ thuật engine dùng ngay

- Renderer: `WebGLRenderer({antialias:true})`, `setPixelRatio(Math.min(devicePixelRatio,2))`.
- Camera: `PerspectiveCamera(75, aspect, 0.1, 300)` — FOV 75 chuẩn FPS.
- Pointer lock: `mousemove` khi locked: `yaw -= movementX*0.0022`, `pitch -= movementY*0.0022`, clamp pitch ±1,45 rad. Độ nhạy mặc định 0,0022 rad/px, chỉnh được 0,5×–2×. `Esc` thoát lock = pause (xem Phần 9). Xử lý promise reject khi lock lại quá nhanh sau Esc (~1,25s ở Chrome).
- Vòng lặp: **fixed-step 60Hz** cho logic (`STEP=1/60`, accumulator), render theo rAF; `dt = Math.min(clock.getDelta(), 0.05)`.
- Di chuyển (đã chuẩn hoá ở Phần 0): chạy 5,5 u/s là tốc độ tối đa khi cầm dao; ma sát mặt đất kiểu example chính thức (`velocity -= velocity*10*dt`); air control 0,10–0,15× mặt đất; gravity 22 m/s²; nhảy 5,2 m/s.
- Kỹ năng nhân vật = modifier trên các hằng số này (dash = impulse velocity 0,18–0,25s + cooldown; tăng tốc = hệ số nhân tốc độ) — không đổi hệ collision.

### 1.4. Physics/collision nhẹ — AABB tự viết, không engine vật lý

- Dữ liệu collision = dữ liệu dựng map: mỗi vật cản vừa tạo Mesh Box vừa đăng ký 1 `THREE.Box3` vào mảng `colliders`. Map chỉ gồm hộp thẳng trục → AABB là chính xác tuyệt đối.
- Player AABB 0,7×1,8×0,7m (half-extents 0,35/0,90/0,35); ngồi cao 1,35m — kiểm tra khoảng trống phía trên trước khi cho đứng dậy.
- Giải va chạm **tách trục X → Z → Y**: di chuyển từng trục, nếu `intersectsBox` thì clamp về điểm tiếp xúc; chạm đất khi rơi (trục Y) → `grounded=true`.
- Chống xuyên tường: clamp dt ≤ 0,05; nếu `|vel|*dt > 0,3m` thì chia substep. Số collider v1 < 200 → duyệt toàn bộ mỗi frame là đủ; > 500 mới cần uniform grid ô 4×4m.
- Bắn hitscan: tia từ tâm camera, tự test `ray.intersectsBox()` trên hitbox nhân vật + collider tường, lấy điểm gần nhất — tránh `intersectObjects(scene.children, true)`. Hitbox: thân 0,7×1,8×0,7; đầu là sub-box 0,45×0,45×0,45 ở độ cao 1,38–1,83m (xem thêm ngân sách raycast ở Phần 9).

---

## Phần 2 — Asset & Model Routes (Nhóm 2)

**Nguyên tắc:** Game gốc — không dùng asset CSGO/Valve. Mọi URL dưới đây lấy từ kết quả tìm kiếm đã kiểm chứng tại thời điểm nghiên cứu; khi tải asset thật phải giữ lại file license đi kèm và ghi vào `assets/README.md` / `CREDITS.md` của repo.

### 2.1. Bảng tổng hợp các route

| Route | Mạnh nhất cho | Định dạng dùng | License | Thương mại | Attribution |
|---|---|---|---|---|---|
| **Kenney** — https://kenney.nl/assets/blaster-kit (mirror: https://kenney-assets.itch.io/blaster-kit) | Weapon (Blaster Kit: 20+ blaster, target, crate…), map prop, UI | glTF/GLB, FBX, OBJ | **CC0 1.0** toàn site | ✅ | ❌ Không bắt buộc |
| **Quaternius** — https://quaternius.com/ (guns: https://quaternius.com/packs/ultimategun.html, character: https://quaternius.com/packs/rpgcharacters.html, sci-fi kit: https://quaternius.itch.io/sci-fi-essentials-kit) | **Character rigged + weapon + animation** (~13,7k tam giác/nhân vật, rig 62 joints, clip `Idle_Gun, Gun_Shoot, Run_Shoot, Death…`) | FBX, OBJ, Blend; pack mới có glTF | **CC0 1.0** đa số pack (*) | ✅ | ❌ |
| **Poly Pizza** — API docs: https://poly.pizza/docs/api/v1.1, key: https://poly.pizza/settings/api | Map prop low-poly lẻ (~10.600 model, mỗi model 1 file `.glb` tự chứa) | GLB duy nhất | Theo từng model: CC0 / CC-BY (~69% là CC-BY) | ✅ cả hai | CC0 ❌ / CC-BY ✅ bắt buộc |
| **Mixamo** — https://www.mixamo.com (FAQ: https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html) | **Animation humanoid** (2.000+ clip mocap) + character mẫu + auto-rig | FBX/DAE → phải chuyển GLB qua Blender | Royalty-free của Adobe (không phải CC) | ✅ khi **nhúng trong game** | ❌ |
| **Sketchfab** — https://help.sketchfab.com/en/articles/16152217-downloading-3d-models | Hero prop/weapon lẻ chất lượng cao | GLB/glTF + file gốc | Theo từng model: CC variants / Standard | Tùy variant | Trừ CC0/Standard đều ✅ |
| **OpenGameArt** — FAQ: https://opengameart.org/content/faq | Prop/texture lẻ | Blend/OBJ/FBX/glTF tùy file | Theo từng file: CC0, CC-BY, CC-BY-SA, OGA-BY, GPL | ✅ nếu tuân license file | Tùy file |
| **ambientCG** — license: https://docs.ambientcg.com/license/ (ví dụ asset: https://ambientcg.com/view?id=Bricks076C) | **Texture PBR cho map** (2.000+ material, HDRI) | JPG/PNG 1K–8K theo bộ map | **CC0 1.0** toàn site | ✅ | ❌ |

(*) Quaternius: có dấu hiệu license chung đã thay đổi theo thời gian — **bắt buộc giữ `LICENSE.txt` trong ZIP của từng pack tải về làm bằng chứng**, không suy luận license pack mới từ pack cũ.

### 2.2. Quy tắc lọc license cho ProjectG (bắt buộc)

- **Được dùng:** CC0; CC-BY / OGA-BY (ghi credit vào `CREDITS.md`: title + creator + URL model + license + nêu thay đổi).
- **Tránh:** CC-BY-SA và GPL (ép share-alike cho bản sửa/derivative), CC-BY-ND (cấm derivative — scale/re-rig/re-texture đều tính là derivative), mọi biến thể **NC** (cấm thương mại).
- Mixamo: không phân phối lại file gốc (chỉ nhúng vào game thành phẩm); chỉ rig được bipedal humanoid; không có API (thao tác tay); tải về phải lưu ngay (Mixamo chỉ giữ nhân vật dùng gần nhất).
- Poly Pizza API v1.1: base `https://api.poly.pizza/v1/`, header `X-Auth-Token`; lọc license dạng số: **`License 0 = CC-BY, 1 = CC0`** — lọc CC0 nếu muốn zero-attribution. CDN có thể chặn IP datacenter → tải tay từ trang model khi lỗi.
- Sketchfab: license tại thời điểm tải là license có hiệu lực; chỉ lấy model bật Downloadable, không dùng tool bóc file của model view-only (vi phạm ToS).

### 2.3. Import glTF/GLB vào Three.js — chuẩn của dự án

- **Đơn vị: 1 unit = 1 mét, Y-up** (cả glTF lẫn Three.js). Mục tiêu: nhân vật cao 1,8m, mắt ~1,62m, cửa 2,1m, rifle dài ~0,9–1,0m. Trong Blender trước khi export: Units = Metric, Unit Scale 1.0.
- Loader: `GLTFLoader` từ `three/addons/loaders/GLTFLoader.js` (kèm DRACO/KTX2 loader chỉ khi file nén tương ứng).
- **Normalize scale tự động cho mọi model** (Kenney không thống nhất scale giữa các pack; Poly Pizza scale tuỳ ý; Mixamo/FBX tính bằng centimet → nhân vật ~180 unit, phải chia 100): dùng `THREE.Box3().setFromObject(model)`, `model.scale.multiplyScalar(targetMeters / size.y)`, rồi dịch chân về `y=0`.
- Animation: mỗi nhân vật/bot 1 `THREE.AnimationMixer` riêng; clone skinned mesh cho nhiều bot phải dùng `SkeletonUtils.clone()`; đọc clip bằng **tên** (`gltf.animations.find(c => c.name === 'Idle')`), không dùng index; chuyển clip bằng `fadeIn/fadeOut 0,15s`; `mixer.update(dt)` trong vòng lặp chính.
- Pipeline Mixamo → GLB: trên Mixamo bật **In Place** cho clip locomotion, tải clip đầu **With Skin**, các clip sau **Without Skin**, 30 FPS; trong Blender ghép mọi action vào cùng armature, đổi tên clip sạch (`Idle, Walk, Run, Jump, Shoot, Reload, Hit, Death` — bỏ tiền tố `mixamorig:`), Apply All Transforms, export **1 file GLB duy nhất**. Đường tắt prototype: FBXLoader + scale 0,01 — file nặng hơn GLB 50–70%, bản ship phải là GLB.
- ambientCG → `MeshStandardMaterial`: `Color` → `map` (đặt `colorSpace = SRGBColorSpace` — chỉ map màu là sRGB); **luôn chọn `NormalGL`** cho `normalMap` (NormalDX sẽ ngược trục trong Three.js); `Roughness` → `roughnessMap` (roughness=1), `Metalness` → `metalnessMap` (metalness=1), `AmbientOcclusion` → `aoMap`; mọi map cùng `wrapS/wrapT = RepeatWrapping` và cùng repeat theo mét thật (1 tile = 2m×2m); bỏ `displacementMap` cho sàn phẳng.

### 2.4. Lộ trình asset

- **V1 (chốt):** Nhân vật/vũ khí/prop = hình khối nguyên thủy có chủ đích (`CapsuleGeometry` thân, `BoxGeometry` giáp/súng, mỗi operator 1 màu accent + 1 hình khối đặc trưng), `MeshStandardMaterial` flat color + `flatShading:true` — hitbox = chính hình khối. Map: box theo Phần 7 + texture ambientCG CC0 cho sàn/tường. Viewmodel súng: **Kenney Blaster Kit (CC0, glTF sẵn)**. Prop trang trí thiếu thì bổ sung Poly Pizza lọc CC0. Animation v1: bobbing súng + giật nòng bằng code.
- **Sau v1 (theo thứ tự):** (1) Quaternius Ultimate Animated Character + Ultimate Guns/Sci-Fi cho bot/đồng đội; (2) Mixamo bổ sung clip cho ability (dash, tung chiêu, death); (3) Sketchfab chỉ săn hero asset, lọc cứng CC0 (nới CC-BY + ghi CREDITS).

---

## Phần 3 — Game Design: Mode đặt bom 5v5 (Nhóm 3)

> Tên thiết bị nổ trong game này gọi generic là **Charge / Gói Nổ**. Mọi con số là thông số thiết kế đề xuất cho ProjectG ở mức phổ biến của thể loại.

### 3.1. Cấu trúc trận (MR12)

| Thông số | Giá trị |
|---|---|
| Đội | 5v5 |
| `max_rounds_regulation` | 24 (12 round/hiệp) |
| `rounds_to_win_match` | **13** (chạm 13 là dừng trận ngay) |
| Đổi phe | Sau round 12; round 13 là pistol round mới, tiền reset $800 |
| Hoà 12–12 | Overtime **MR3**: 6 round (3/hiệp OT), thắng 4 là thắng OT; hoà 3–3 thì lặp OT |
| `overtime_start_money` | $10.000 |
| Timeout | 3 lần/trận + 1 lần/OT, mỗi lần 30s |
| Warmup | 60s hoặc tới khi 10/10 ready |

### 3.2. Timeline 1 round

| Giai đoạn | Thời gian | Nội dung |
|---|---|---|
| Freeze Time | **15s** | Đứng yên tại spawn, mở Buy Menu, lên plan. Không di chuyển khỏi spawn/không bắn |
| Live Round | **115s** (`round_timer`) | Hết giờ mà bom chưa đặt → DEF thắng round |
| Buy Time phụ | 20s đầu Live | Còn ở spawn zone thì vẫn mua được, sau 20s khoá shop |
| Bomb Planted | **40s** (`bomb_timer` thay thế round_timer) | Bíp nhanh dần ở 10s cuối |
| Round End | **7s** | Hiện đội thắng, cộng tiền, người sống sót giữ vũ khí sang round sau |

### 3.3. Economy

| Thông số | Giá trị |
|---|---|
| Tiền khởi điểm | **$800** (round 1 và round 13) |
| Tiền tối đa | **$16.000** |
| Thắng round — tiêu diệt toàn bộ địch | $3.250 cả đội |
| Thắng bằng bom nổ (ATK) / gỡ bom (DEF) | $3.500 cả đội |
| Thắng bằng hết giờ (DEF) | $3.250 cả đội |
| Đặt bom thành công | +$300 cá nhân; đội ATK đặt được bom nhưng thua round vẫn +$800 cả đội |
| Gỡ bom thành công | +$250 cá nhân |
| Kill: rifle/pistol / SMG / shotgun / sniper hạng nặng / dao | $300 / $600 / $900 / $100 / $1.500 |
| Giết đồng đội / tự sát | −$300 |
| **Loss bonus** (thua liên tiếp 1/2/3/4/5+) | **$1.400 / 1.900 / 2.400 / 2.900 / 3.400** — thắng 1 round thì đếm lùi 1 bậc, không reset ngay |

Vòng eco chuẩn để test: `Pistol ($800) → thắng: full-buy round 3 (~$4.500–5.500) | thua: eco round 2 → full-buy round 4`.

### 3.4. Bảng giá (ngoài vũ khí ở Phần 6)

| Item (mã) | Giá | Item (mã) | Giá |
|---|---|---|---|
| Pistol nhẹ (`pistol_light`) | $300 | Giáp thân (`armor_body`) | **$650** |
| Song pistol (`pistol_dual`) | $400 | Giáp thân + mũ (`armor_body_helmet`) | **$1.000** |
| Pistol tự động (`pistol_auto`) | $500 | **Defuse kit** (`defuse_kit`, chỉ DEF) | **$400** |
| SMG: nhẹ / trung / nặng | $1.050 / 1.250 / 1.500 | Lựu mồi nhử / choáng / khói (18s) / nổ | $50 / 200 / 300 / 300 |
| Shotgun: bơm / tự động | $1.100 / 2.000 | Lựu lửa ATK / DEF (cháy 7s) | $400 / 500 |
| Sniper nhẹ (`sniper_scout`) | $1.700 | Sniper bán tự động | $5.000 |
| Máy hạng nặng (`mg_heavy`) | $5.200 | | |

Giới hạn mang lựu: tối đa 4/người, không quá 2 flash, mỗi loại còn lại tối đa 1. Rifle/Sniper chính: xem Phần 6 (VK-7 $2.700, VK-5 $2.000, DP-50 $700, SR-99 $4.750 — khớp khung giá của bảng này).

### 3.5. Plant / Defuse

| Thông số | Giá trị |
|---|---|
| `plant_time` | **3,2s** — giữ phím tương tác trong bombsite, đứng yên; di chuyển/đổi súng/bị ngắt → huỷ, tiến trình reset về 0 |
| `defuse_time` | **10,0s** không kit / **5,0s** có kit; nhả phím/bị giết → huỷ, bomb timer vẫn chạy |
| `bomb_timer` | **40,0s** |
| Bán kính nổ | Chết chắc ≤ 12m (dù full giáp); có damage giảm dần tới 22m (tính vật cản) |
| Rớt bom | Người mang bom chết → bom rớt tại chỗ, đồng đội ATK nhặt lại được; DEF không nhặt/giấu được |

### 3.6. Điều kiện thắng round (đủ để code win-condition)

| # | Trường hợp | Kết quả |
|---|---|---|
| 1 | Tiêu diệt toàn bộ địch, bom **chưa** plant | Đội tiêu diệt thắng, kết thúc ngay |
| 2 | Bom **đã** plant, ATK bị diệt hết | Round **chưa** kết thúc — DEF vẫn phải gỡ; bom nổ trước → ATK thắng |
| 3 | Bom nổ sau 40s | ATK thắng |
| 4 | Gỡ bom thành công | DEF thắng, kết thúc ngay |
| 5 | Hết 115s, bom chưa plant | DEF thắng |
| 6 | Bom đã plant, DEF bị diệt hết | ATK thắng ngay (không chờ nổ) |

Không respawn trong round — chết là xem tới round sau.

### 3.7. Vai trò chiến thuật trong đội (không khoá cứng class — khác với operator ở Phần 4)

| Vai trò | Nhiệm vụ ngắn |
|---|---|
| IGL (chỉ huy) | Call chiến thuật, quyết định đánh A/B/Mid, quản lý eco |
| Entry Fragger | Đầu tiên xông vào site, lấy thông tin/trade |
| Support/Trade | Đi thứ 2, ném utility che entry, trade kill |
| Sniper | Giữ góc dài Mid/lane dài, pick đầu round |
| Lurker (ATK) / Anchor (DEF) | Đi lẻ cắt rotate / neo 1 site một mình và câu giờ |

Phân bổ mặc định DEF đầu round: `2 A — 1 Mid — 2 B`. ATK default spread: `1 B — 2 Mid — 2 A` thăm dò ~30s đầu rồi gom execute 1 site. Timing rotate chuẩn để cân bằng map: rotate qua Mid/Connector 12–14s, qua spawn 17–19s; **không thiết kế tuyến rotate > 22s** (plant còn 40s, DEF cần kịp retake + defuse 5–10s). Mỗi site đúng **2 choke point** cho ATK, mỗi choke rộng 1–2 người (1 smoke che kín).

### 3.8. Config tóm tắt (đã chuẩn hoá — bản đầy đủ ở Phụ lục A)

```json
{ "mode": "bomb_defusal_5v5", "maxRounds": 24, "roundsToWin": 13, "halftimeAfter": 12,
  "freezeTimeSec": 15, "roundTimeSec": 115, "roundEndSec": 7, "buyTimeSec": 20,
  "bomb": { "plantSec": 3.2, "defuseKitSec": 5, "defuseNoKitSec": 10, "timerSec": 40 },
  "economy": { "startMoney": 800, "maxMoney": 16000, "overtimeStartMoney": 10000,
    "winElimination": 3250, "winBombExplode": 3500, "winDefuse": 3500,
    "lossBonus": [1400, 1900, 2400, 2900, 3400] },
  "overtime": { "format": "MR3", "roundsPerHalf": 3, "roundsToWin": 4 } }
```

Vòng lặp trận cho code: `Warmup 60s → Hiệp 1 (round 1–12: Freeze→Live→[Planted]→Round End, tiền/vũ khí mang sang) → Halftime (đổi phe, reset $800) → Hiệp 2 (round 13–24, chạm 13 dừng ngay; 12–12 → OT) → Match End (MVP, K/D/A, plant/defuse) → Lobby`.

---

## Phần 4 — 8 Operator & Hệ thống kỹ năng (Nhóm 4)

### 4.1. Hệ thống chung

- **Phím:** Q = Tactical (cooldown 25–45s, miễn phí), E = Utility/Signature (2 charge hoặc cooldown 35–50s; mua thêm charge ở Buy Phase $200/charge), X = Ultimate (theo **điểm**), còn lại là **Passive**.
- **Điểm ultimate:** Kill +1, Assist +1, Plant/Defuse +2, nhặt Orb ở Mid +1 (2 orb/round ở vị trí cố định), đầu mỗi round +1 tự động. Mỗi operator cần **6 hoặc 7 điểm**.
- **Triển khai Three.js:** chỉ dùng hình khối cơ bản — `Box, Sphere, Cylinder, Plane, RingGeometry, Points`, vật liệu `MeshBasicMaterial transparent`. Mọi hiệu ứng đều có telegraph (âm thanh/hình ảnh báo trước 0,6–1s).
- Unique pick: mỗi đội tối đa 1 operator trùng nhau. Đội hình mẫu cân bằng: 1 Duelist + 1 Controller + 1 Sentinel + 1 Recon/Initiator + 1 Support.

### 4.2. Tám operator

**1. KAITO "FLARE" REN — Duelist/Entry** *(nhiệt động năng)*
- *Passive — Động Năng Dư:* di chuyển liên tục 3s tích 1 stack Nhiệt (tối đa 3), mỗi stack +3% tốc độ (tối đa +9%); đứng yên 2s mất hết. Vệt hạt cam sau chân.
- *Q — Lướt Tàn Lửa:* CD **35s**. Lướt thẳng 6m trong 0,25s theo hướng nhìn ngang; vệt lửa rộng 1,5m dài 6m tồn tại **3s**, địch bước qua chịu 10 HP/s. Không lướt qua tường đặc/vật cao >1m. Tiếng *whoosh* báo trước 0,1s.
- *E — Bom Chói Nhiệt:* CD **40s**, 1 charge. Nổ sau 0,8s, bán kính chói **12m**, góc 120° trước mặt địch: mù 1,8s nếu nhìn thẳng, 0,9s nếu quay lưng. Không xuyên tường.
- *X — Bão Nhiệt Hạch Lỏng:* **7 điểm**. Cầu nhiệt bán kính **8m** quanh bản thân trong **6s** (di chuyển theo người chơi, bản thân chậm −20%): địch trong vùng −15 HP/s, mờ màn hình, −15% tốc độ. Chỉ tính line-of-sight từ tâm cầu, không xuyên nhà kín.
- *Counter:* khắc BASTION, AEGIS · bị khắc bởi NULL, PRISM.

**2. MIRA "PRISM" SOL — Controller** *(khúc xạ ánh sáng)*
- *Passive — Giác Quan Quang Học:* đứng yên 1,5s sau gương/tường của mình trong 3m → giảm 50% hiệu ứng flash lên bản thân.
- *Q — Tường Gương Khúc Xạ:* CD **30s**. Tường năng lượng (Box mỏng) 6m ngang × 2,5m cao, **HP 250**, tồn tại **12s**: chặn đạn + tầm nhìn, **không chặn người** (đi qua bị −20% tốc độ 1s + outline 1s). Phá bằng ~8 viên rifle.
- *E — Lăng Kính Đánh Lạc:* CD **45s**. Lăng kính (Cylinder) tồn tại 20s, kích hoạt tầm 10m: tạo hologram giả của PRISM chạy thẳng 4s, không damage, vỡ sau 1 viên đạn.
- *X — Nhà Gương:* **6 điểm**. Trong **10s**, 4 tường gương tạo hộp 10×10m tại điểm chỉ định (tầm ném 20m): đạn vào tường **nảy 1 lần, giảm 50% damage**. Cả 2 đội đều bị ảnh hưởng. Không chặn plant bên trong.
- *Counter:* khắc FLARE, DRIFT · bị khắc bởi NULL, WHISPER.

**3. DARIO "BASTION" FENN — Sentinel/Anchor** *(kiến trúc sư chiến trường)*
- *Passive — Gia Cố:* công trình của mình trong 5m quanh bản thân hồi 5 HP/s; bản thân −15% damage khi đứng sau công trình của mình.
- *Q — Chốt Chặn Cứng:* CD **25s**, 2 charge. Khối hộp 1,2×1,8×0,4m, **HP 400**, tồn tại tới hết round/bị phá; tối đa 2 khối cùng lúc; không dựng chồng lên bomb đã plant.
- *E — Bẫy Trọng Trường Nhẹ:* CD **35s**. Bẫy sàn bán kính **4m**, kích hoạt 1 lần: địch dẫm vào bị −40% tốc độ + cấm nhảy trong **2,5s**, phát tiếng *clank* lớn.
- *X — Pháo Đài Cuối:* **7 điểm**. Trụ năng lượng bán kính **5m**, cao 3m, **HP tổng 800**, tồn tại **15s**: đồng đội trong vùng +20% tốc độ nạp đạn; đạn **không xuyên qua theo cả 2 chiều** (muốn bắn phải bước ra) — dùng để plant/defuse an toàn.
- *Counter:* khắc DRIFT, FLARE · bị khắc bởi NULL, PRISM, TETHER.

**4. SABLE "WHISPER" NOOR — Recon/Infiltrator** *(sóng âm)*
- *Passive — Thính Giác Tuyệt Đối:* nghe bước chân xa hơn 30% (18m thay vì 14m); địch **chạy** trong 15m hiện vòng sóng mờ trên minimap (không qua 2 lớp tường đặc).
- *Q — Xung Quét Âm:* CD **40s**. Nón 120°, tầm **22m**, quét 1s: địch trúng bị ping **2 lần cách nhau 1,5s** trên minimap cho cả đội (không phải outline liên tục, không wallhack). Không xuyên vùng câm lặng của NULL, không xuyên 2 tường.
- *E — Vùng Câm Lặng:* CD **50s**. Cầu bán kính **6m**, **8s**: trong vùng không phát tiếng bước chân; tiếng plant lọt ra ngoài giảm 70%. Cả 2 đội đều bị ảnh hưởng.
- *X — Dàn Hợp Xướng Dội Âm:* **6 điểm**. Trong **8s**, mọi tiếng động của địch trong **25m** quanh WHISPER (súng, bước chân, reload, plant) hiện chấm trên minimap cho cả đội, cập nhật mỗi 1s, làm mờ vị trí ±2,5m (ô 5×5m).
- *Counter:* khắc PRISM, DRIFT · bị khắc bởi NULL, WHISPER địch, BASTION.

**5. ORIN "TETHER" KADE — Initiator/Support** *(dây neo trọng lực)*
- *Passive — Neo Giữ:* giảm 30% hiệu ứng làm chậm/đẩy lùi lên bản thân; đồng đội trong 4m được hưởng 15%.
- *Q — Dây Neo Kéo:* CD **30s**. Bắn dây thẳng tầm **18m**: trúng đồng đội → kéo họ về phía mình 70% khoảng cách; trúng địch → kéo địch lại gần 3m + −25% tốc độ 1,5s; trúng tường → tự kéo mình 5m (grapple nhẹ, không qua mái). Trượt (miss) chỉ tốn nửa cooldown (15s).
- *E — Mỏ Neo Trọng Lực:* CD **40s**. Vùng cầu bán kính **5m**, **5s**: mọi người trong vùng (cả 2 đội) bị hút nhẹ về tâm 1m/s, nhảy không quá 0,5m.
- *X — Xiềng Xích Liên Kết:* **6 điểm**. Liên kết 1 địch trong tầm nhìn 20m với địch gần nhất trong 6m của chúng, trong **6s**: 30% damage người này nhận chia sang người kia (tối đa chia 40 HP). Một người chết → đứt liên kết. Không tự gây damage.
- *Counter:* khắc BASTION, AEGIS · bị khắc bởi DRIFT, NULL, FLARE.

**6. VESPER "NULL" OKONKWO — Controller/Anti-Ability** *(nhiễu điện từ)*
- *Passive — Chống Nhiễu:* giảm 50% thời gian bị đánh dấu bởi recon; thiết bị điện tử địch trong 3m lộ outline mờ.
- *Q — Xung EMP Cục Bộ:* CD **45s** (dài nhất game). Cầu bán kính **7m** nổ sau 0,6s: phá ngay công trình năng lượng (tường PRISM vỡ, khối BASTION −300 HP, bẫy/lăng kính mất), tắt vệt lửa FLARE, cắt dây TETHER. Chỉ 5 HP tượng trưng lên người; không phá súng/đạn.
- *E — Vùng Chết Sóng:* CD **40s**. Trụ bán kính **4m** cao 3m, **10s**: bên trong **không dùng được Q/E (cả 2 đội)**; ult đã kích hoạt vẫn tiếp tục. Có viền đỏ rõ để né.
- *X — Sập Nguồn Toàn Cục:* **7 điểm**. Sau 1s vận sức (âm báo toàn map): EMP toàn map — phá/tắt mọi công trình & ability đang tồn tại của **cả 2 đội**, khoá Q/E mọi người (gồm cả NULL) trong **4s**; ult địch đang diễn ra bị giảm 50% thời lượng còn lại (không huỷ hẳn). EMP chỉ giảm 30% hiệu quả hồi máu sinh học của AEGIS (không tắt hẳn).
- *Counter:* khắc PRISM, BASTION, WHISPER, TETHER · điểm yếu: không damage/mobility, thua gunplay thuần.

**7. LYRA "AEGIS" CHEN — Support** *(nhịp sinh học)*
- *Passive — Nhịp Ổn Định:* đồng đội trong 5m hồi 1 HP/s khi ngoài giao tranh 5s, tối đa hồi tới **70 HP** (không vượt 70 bằng passive này).
- *Q — Hào Quang Hồi Phục:* CD **35s**. Cầu bán kính **5m** quanh bản thân, **6s**: đồng đội hồi 12 HP/s (tối đa 50 HP/người/lần), bản thân 6 HP/s; bản thân −10% tốc độ khi bật; bị bắn không ngắt hồi.
- *E — Khiên Sinh Học:* CD **30s**, 1 charge. Cho 1 đồng đội trong 12m hoặc bản thân **35 HP khiên tạm thời**, tồn tại **8s**, không cộng dồn quá 35. Headshot damage > 125 (SR-99) vẫn xuyên khiên giết.
- *X — Hồi Sinh Nhịp Tim:* **7 điểm**. Chỉ dùng trong **5s sau khi đồng đội chết**, trong tầm **8m** của xác: hồi sinh với **50 HP**, chỉ có pistol mặc định; vận sức 2s đứng yên + phát sáng lớn (bị giết khi vận sức = mất ult + mất điểm). Tối đa 1 lần/round; người được hồi sinh không được hồi sinh lại cùng round.
- *Counter:* khắc FLARE, WHISPER (chiến đấu kéo dài) · bị khắc bởi NULL, TETHER, DRIFT.

**8. RUNE "DRIFT" HALVORSEN — Duelist/Lurker** *(khói động/dịch chuyển ngắn)*
- *Passive — Bước Nhẹ:* tiếng bước chân −40% khi đi bộ/crouch (chạy vẫn bình thường); crouch đi chậm không kích hoạt bẫy BASTION (vẫn bị WHISPER quét).
- *Q — Dịch Khói Ngắn:* CD **35s**, 2 charge (2 lần dùng liên tiếp cách nhau ≥ 5s). Dịch chuyển tức thời tối đa **5m** theo hướng nhìn tới vị trí đứng được + có line-of-sight một phần — **không xuyên tường đặc**. Để lại khói 1m trong 2s ở cả 2 đầu + tiếng *phut* nhỏ trong 8m.
- *E — Màn Khói Động:* CD **45s**. Khói hộp 4×2,5×1m, tồn tại **10s**, trượt về phía trước 1m/s trong 3s đầu rồi đứng yên. Chặn tầm nhìn, không chặn đạn, không chặn sóng âm WHISPER.
- *X — Vô Ảnh:* **6 điểm**. Trong **7s**: mỗi kill làm mới 1 charge Q + tàng hình một phần (trong suốt 60%, hiện rõ khi bắn) trong **2s**. Bắn là lộ diện. Không bất tử, không tăng damage.
- *Counter:* khắc TETHER, BASTION, AEGIS · bị khắc bởi WHISPER, PRISM, NULL.

### 4.3. Ma trận counter 8×8

Hàng tấn công, cột đối thủ. `+` khắc chế, `−` bị khắc, `0` hoà.

|  | FLARE | PRISM | BASTION | WHISPER | TETHER | NULL | AEGIS | DRIFT |
|---|---|---|---|---|---|---|---|---|
| **FLARE** | 0 | − | + | 0 | 0 | − | + | 0 |
| **PRISM** | + | 0 | 0 | − | 0 | − | 0 | + |
| **BASTION** | − | 0 | 0 | 0 | − | − | 0 | − |
| **WHISPER** | 0 | + | 0 | 0 | 0 | − | 0 | + |
| **TETHER** | 0 | 0 | + | 0 | 0 | − | + | − |
| **NULL** | 0 | + | + | + | + | 0 | 0 | 0 |
| **AEGIS** | − | 0 | 0 | 0 | − | 0 | 0 | − |
| **DRIFT** | 0 | − | + | − | + | 0 | + | 0 |

### 4.4. Quy tắc cân bằng bắt buộc khi code

1. **Ult không thắng round một mình:** ult gây damage đều giới hạn DPS + telegraph 0,6–1s + âm thanh địch nghe được; ult hồi sinh chỉ cho 50 HP + pistol; ult EMP ảnh hưởng cả đội mình.
2. **Recon không phải wallhack:** ping tối đa 2 lần, có sai số, không xuyên 2 tường, không xuyên vùng NULL, tầm ≤ 25m; không ability nào hiện outline liên tục > 3s.
3. **Mọi tường/công trình đều có HP (250–800)** — rifle phá trong 2–4s focus fire. Không tường bất tử.
4. **Trần damage ability:** 1 ability không gây quá 50 HP tức thời lên người full giáp, trừ khi đứng trong vùng > 3s. Không ability 1-hit-kill.
5. **Counter cứng phải trả giá:** EMP CD dài nhất (45s); vùng chết sóng khoá cả đồng đội; ult NULL khoá cả đội mình 4s.
6. **Thông tin hai chiều:** mọi Q/E đều phát âm thanh trong 10–15m hoặc hiệu ứng sáng để địch phản ứng (trừ passive đi bộ của DRIFT/WHISPER).
7. **Không stack hồi/khiên:** khiên 35 + hồi tối đa 50/lần → trần 135 HP hiệu dụng.
8. **Cooldown không reset bằng kill** — ngoại lệ duy nhất: Q của DRIFT trong 7s ult của chính DRIFT.

---

## Phần 5 — Bot AI (Nhóm 5)

**Nguyên tắc bắt buộc:** Bot dùng **chung** hệ thống di chuyển + bắn hitscan với người chơi. Không teleport, không aim xuyên tường, không damage riêng. Bot chỉ ra quyết định rồi trả `InputState` (Phần 10) — pipeline chung xử lý như người thật.

### 5.1. Waypoint navigation

Định dạng dữ liệu:

```ts
type Zone = 'atk_spawn'|'ct_spawn'|'mid'|'a_lane'|'b_lane'|'a_site'|'b_site'|'connector';
interface Waypoint { id: string; x: number; z: number; zone: Zone;
  cover?: boolean; plant?: boolean; links: string[]; }  // links 2 chiều, phải đối xứng
findPath(fromId, toId): string[]   // A*, cost = dist + danger*trongSo (xem dưới)
nearestWaypoint(pos): string
```

**Bản nháp gốc của Nhóm 5** dùng hệ tọa độ 120×120 (spawn z=±52, site `(±36,−36)`, 30 node: `atk_01..03, a_lob_01, a_long_01/02, a_ent_01, a_site_01(plant)/02/03, ct_a_01, b_*` đối xứng, `mid_01/02/03, mid_top_01, a_short_01, conn_a_01, b_short_01, conn_b_01, ct_01/02/03`) với topology: spawn → lobby → long lane → entry → site; Mid nối 2 đầu + 2 connector chéo; CT spawn nối 2 site + Mid top. **Topology này giữ nguyên; tọa độ chuẩn hoá theo Neon Divide (Phần 7) như bảng 5.1b.**

#### 5.1b. Bảng waypoint ĐÃ ÁNH XẠ sang tọa độ Neon Divide (dùng bảng này để code)

| ID | x | z | Zone | Thuộc tính | Links |
|---|---|---|---|---|---|
| `t_spawn` | 0 | 24 | atk_spawn | — | `t_a`, `t_b`, `t_mid` |
| `t_a` | −13 | 20 | a_lane | — | `t_spawn`, `a_lane_s` |
| `t_b` | 13 | 20 | b_lane | — | `t_spawn`, `b_lane_s` |
| `t_mid` | 0 | 16 | mid | — | `t_spawn`, `mid_s` |
| `a_lane_s` | −26 | 16 | a_lane | — | `t_a`, `a_choke` |
| `a_choke` | −26 | 6 | a_lane | cover | `a_lane_s`, `a_ent`, `conn_a` |
| `a_ent` | −24 | −6 | a_site | — | `a_choke`, `a_site` |
| `a_site` | −27 | −19 | a_site | **plant** | `a_ent`, `a_cover`, `ct_link_a` |
| `a_cover` | −30 | −14 | a_site | cover | `a_site` |
| `b_lane_s` | 26 | 16 | b_lane | — | `t_b`, `b_choke` |
| `b_choke` | 26 | 6 | b_lane | cover | `b_lane_s`, `b_ent`, `conn_b` |
| `b_ent` | 24 | −6 | b_site | — | `b_choke`, `b_site` |
| `b_site` | 27 | −19 | b_site | **plant** | `b_ent`, `b_cover`, `ct_link_b` |
| `b_cover` | 30 | −14 | b_site | cover | `b_site` |
| `mid_s` | 0 | 10 | mid | cover | `t_mid`, `mid_doors` |
| `mid_doors` | 0 | 0 | mid | — | `mid_s`, `mid_n`, `conn_a`, `conn_b` |
| `mid_n` | 0 | −10 | mid | cover | `mid_doors`, `ct_spawn`, `ct_link_a`, `ct_link_b` |
| `conn_a` | −13 | −6 | connector | cover | `mid_doors`, `a_choke` |
| `conn_b` | 13 | −6 | connector | cover | `mid_doors`, `b_choke` |
| `ct_link_a` | −11 | −18 | connector | cover | `a_site`, `ct_spawn`, `mid_n` |
| `ct_link_b` | 11 | −18 | connector | cover | `b_site`, `ct_spawn`, `mid_n` |
| `ct_spawn` | 0 | −24 | ct_spawn | — | `ct_link_a`, `ct_link_b`, `mid_n` |

Validate khi load: mọi `links` phải đối xứng; đồ thị liên thông từ `t_spawn` tới `a_site`/`b_site` và từ `ct_spawn` tới 2 site; node được snap trong ±4 tới vị trí walkable gần nhất nếu lệch map thật (bảng trên đã khớp các lane/hành lang ở Phần 7: A/B lane x=∓26, Mid x=0, connector z=−6, CT link z≈−18).

- **Tìm đường:** A* với `cost = dist(a,b) + danger[b]*dangerWeight`; `danger` +10 cho waypoint từng có đồng đội chết trong 10s, reset dần; `dangerWeight`: easy 0, normal 0,5, hard 1,0. Re-path khi đổi đích, khi kẹt, hoặc mỗi 2s nếu đang engage. Tới node khi `dist < 1,2` thì pop node.
- **Chọn đích theo đội:** ATK đầu round cả team cùng 1 site chính (trọng số A 40% / Mid→A 20% / Mid→B 20% / B 40%, tránh mỗi bot 1 ngả). DEF chia sẵn 2 A / 1 Mid / 2 B.

### 5.2. Nhận thức (line-of-sight & nghe)

| Thông số | Giá trị |
|---|---|
| Kiểm tra LOS | Raycast mắt bot (y+1,6) → ngực địch (y+1,2); trúng collider tường trước địch = bị che. Kiểm tra mỗi **100ms**/địch trong bán kính; tần suất tổng thể theo ngân sách Phần 9 (5Hz, chia lượt) |
| Tầm nhìn / FOV | Theo độ khó (5.4); địch ngoài FOV = không thấy (riêng địch trong 6m vẫn phát hiện ở rìa FOV) |
| Nghe tiếng súng | Bán kính **35m**; có ≥2 tường chắn → còn 20m. Biết hướng ±30°, chưa biết vị trí chính xác → chỉ đi kiểm tra, **không bắn khi chỉ nghe** |
| Nghe bước chân | Chạy 12m / đi bộ 5m / ngồi 0m (chỉ khi địch di chuyển). Tiếng plant/defuse: 15m, biết chính xác site |
| Trí nhớ địch | `lastKnownPos` giữ **5s** sau khi mất LOS, tin cậy giảm dần, quên hẳn sau 5s |
| Chia sẻ đội | Bot thấy địch → đồng đội trong 25m nhận `lastKnownPos` sau **0,5s** (mô phỏng callout) |

Áp `aimError`: lấy hướng bắn hoàn hảo tới ngực/đầu địch, cộng lệch Gaussian σ=`aimError` theo 2 trục, rồi gọi đúng hàm bắn hitscan chung. Không chỉnh damage/HP của bot.

### 5.3. State machine — 6 trạng thái

`patrol | engage | plant | defend | retreat | defuse`. Tick nhận thức 100ms; tick quyết định theo độ khó.

| Từ | Điều kiện | Sang | Hành vi chính |
|---|---|---|---|
| `patrol` | Thấy địch có LOS | `engage` | Giữ khoảng cách 8–25m, strafe đổi hướng mỗi 0,6–1,2s, bắn burst theo 5.4 |
| `patrol` | Nghe súng/bước chân | `patrol` (đổi đích) | Tới vị trí tiếng động, quét góc |
| `patrol` | ATK tới site đích & mang bom | `plant` | Channel **3,2s** đứng yên tại node `plant`; bị bắn trúng hoặc thấy địch ≤8m → huỷ, sang `engage` |
| `patrol` | DEF nghe/được báo bom đã plant ở site X | `patrol` (đổi đích) | Chạy tới site X |
| `engage` | Mất LOS > 2s | `patrol` | Săn theo `lastKnownPos`, tới nơi quét 2s rồi bỏ |
| `engage` | HP < 30 và (địch ≥2 hoặc không cover gần) | `retreat` | Ngưỡng theo độ khó: hard <20, easy <40. Tới waypoint `cover` sau lưng + mất LOS >2s → `patrol` |
| `plant` | Channel xong | `defend` | Tới cover gần nhất trong site |
| `defend` | Thấy địch | `engage` | Bắn xong, mất LOS thì quay lại cover. Bomb còn <10s: không rời site |
| mọi state | DEF ở cạnh bom, không địch trong 10m | `defuse` | Channel **10s/5s** (không/có kit); thấy địch/bị bắn → huỷ, `engage`. Xong = thắng round |

Ưu tiên ngắt mỗi tick: `channel bị đe doạ > engage > retreat > bắt đầu plant/defuse > defend > patrol`.

### 5.4. Độ khó (tốc độ tính theo tốc độ tối đa của người chơi = 5,5 u/s khi cầm dao — đã chuẩn hoá)

| Thông số | Easy | Normal | Hard |
|---|---|---|---|
| `viewDist` | 35m | 50m | 70m |
| `fov` | 75° | 90° | 110° |
| `reactionTime` (thấy → phát đầu) | 650–900ms | 350–500ms | 180–280ms |
| `aimError` (Gaussian σ) | 7° | 3,5° | 1,5° (đang di chuyển ×1,6 / ×1,4 / ×1,2) |
| Headshot bias | 0% | 15% | 35% |
| Burst | 2–3 viên, nghỉ 500ms | 3–5 viên, nghỉ 300ms | 5–7 viên, nghỉ 180ms, biết tap ở >30m |
| Tốc độ di chuyển | 0,85× (4,68 u/s) | 0,95× (5,23 u/s) | 1,0× (5,5 u/s) |
| `decisionTick` | 500ms | 250ms | 100ms |
| Hệ số nghe | 0,7× | 1,0× | 1,2× |
| Tránh lane nguy hiểm / cover / strafe | Không | Thỉnh thoảng, strafe chậm | Luôn; strafe nhanh + thỉnh thoảng crouch, pre-aim góc tới |

### 5.5. Tránh kẹt tường

- **Phát hiện kẹt:** mỗi 0,25s lưu vị trí; có lệnh di chuyển mà di chuyển thực tế < 0,3m trong 0,8s (và không đang channel/crouch) → `stuck=true`.
- **Thoát kẹt (tối đa 3 lần/đích):** (1) lùi 0,4s + strafe ngẫu nhiên 0,4s; (2) nhảy 1 lần + tiến (vật thấp ≤0,6m); (3) blacklist cạnh waypoint vừa đi trong 10s + gọi lại `findPath()` đường khác; nếu vẫn kẹt → đi bộ tới waypoint walkable gần nhất trong 3m. **Cấm teleport.**
- **Né chủ động:** 3 raycast phía trước (giữa/trái 30°/phải 30°, dài 2m) — ray nào trúng tường thì lái lệch phía trống; waypoint đặt cách tường ≥ 0,8m.
- **Separation:** đẩy đồng đội trong bán kính 1,5m: `push = (1,5 − dist) * 3,0` cộng vào vector di chuyển (chuẩn hoá không vượt tốc độ tối đa); không đẩy khi đang channel.
- **Không chen cửa:** qua node `connector`/entry chỉ 1 bot/lượt; bot sau dừng cách 2m tối đa 1,5s rồi đi tiếp (chống deadlock).
- **Fallback:** `findPath` trả `[]` → đứng gác tại waypoint gần nhất, quét góc, thử lại sau 3s. Không đi thẳng xuyên tường về đích.

### 5.6. Nghiệm thu mảng Bot

1. Bot đi được từ 2 spawn tới cả A và B bằng ≥2 đường khác nhau, không xuyên tường, tỉ lệ cần "teleport cứu" = 0.
2. Bot không bắn khi chưa có LOS; không bắn khi mới nghe tiếng.
3. Đủ 6 state chạy trong 1 round thật: ATK plant xong → `defend`; DEF tới `defuse` thành công.
4. Đổi Easy→Hard khác biệt rõ bằng số ở 5.4 mà không sửa logic.

---

## Phần 6 — Weapons & Ballistics (Nhóm 6)

> Tên là **tên mã nội bộ**, không dùng tên súng thật. Đơn vị: damage = HP (bảng tính **khi không giáp**, xem cơ chế giáp ở Phần 0); khoảng cách = mét; tốc độ cầm = % của tốc độ tối đa 5,5 u/s (cột "điểm 270" là thang tham chiếu nội bộ của Nhóm 6: 270 điểm = 100%).

### 6.1. Bảng tổng hợp — dùng ngay để code

| Mã | Loại | Giá | Damage Đầu/Thân/Chân | RPM / Chế độ | Băng/Dự trữ | Reload tactical/rỗng | Tốc độ cầm | Tầm hiệu quả | Recoil dọc/đạn | Thưởng kill |
|---|---|---|---|---|---|---|---|---|---|---|
| **VK-7 "Vệ Binh"** | Rifle chính | $2.700 | 136 / 34 / 25 | 600 / Auto | 30/90 | 2,4s / 3,0s | 215 (79,6%) | 0–45m | 0,62° | $300 |
| **VK-5 "Sói"** | Rifle rẻ/entry | $2.000 | 132 / 33 / 24 | 666 / Auto, Burst 3 | 25/100 | 2,2s / 2,8s | 225 (83,3%) | 0–35m | 0,58° | $300 |
| **P9 "Chim Sẻ"** | Pistol mặc định | $0 | 100 / 25 / 18 | 400 / Semi | 15/45 | 1,8s / 2,3s | 240 (88,9%) | 0–22m | 0,35° | $300 |
| **DP-50 "Búa"** | Pistol hạng nặng | $700 | 212 / 53 / 39 | 267 / Semi | 7/35 | 2,0s / 2,6s | 230 (85,2%) | 0–30m | 0,90° | $300 |
| **SR-99 "Thợ Săn"** | Sniper | $4.750 | 450 / 112 / 84 | 41 / Bolt-action | 5/30 | 3,2s / 3,8s | 200 (74,1%) | 30–120m | 3,50° | $100 |
| **K-0 "Lưỡi Mỏng"** | Knife/melee | $0 | xem 6.5 | 120 nhanh / 48 mạnh | ∞ | — | 270 (100%) | 0–1,6m | — | $1.500 |

Hệ số vùng (tính trên damage thân): **Đầu ×4,0 | Ngực ×1,0 | Bụng ×1,25 | Chân ×0,75**. TTK tham chiếu (100 HP, không giáp): VK-7 — 1 đầu/3 thân/4 chân; VK-5 — 1 đầu/4 thân (33×3=99); P9 — 1 đầu/4 thân; DP-50 — 1 đầu/2 thân; SR-99 — 1 phát thân đã chết trong tầm hiệu quả.

Ghi chú từng khẩu: **VK-7** là chuẩn cân bằng toàn game, điểm yếu là recoil ngang từ đạn 11+. **VK-5** nhẹ/chạy nhanh/RPM cao hơn nhưng băng nhỏ, falloff sớm — súng force-buy/eco. **P9** chính xác, recoil thấp, damage thấp, băng 15 bù lại. **DP-50** damage ngang rifle nhưng 7 viên + recoil 0,90°/phát — bắn nhanh là trượt. **SR-99**: phải scope mới chính xác (no-scope spread 4,50°), zoom 2 mức 2,5×/5×, sau mỗi phát tự rời scope 0,4s + lên đạn 1,45s, phải đứng yên 0,25s trước khi bắn (accuracy recovery).

### 6.2. Spread (độ lệch nón bắn, độ ° — phát đầu; phát liên tiếp cộng inaccuracy tích luỹ)

| Lớp | Đứng yên | Ngồi | Di chuyển | Nhảy/trên không |
|---|---|---|---|---|
| VK-7 / VK-5 | 0,35 / 0,38 | 0,22 / 0,24 | 1,85 | 3,20 |
| P9 | 0,30 | 0,18 | 1,20 | 2,50 |
| DP-50 | 0,45 | 0,28 | 1,60 | 3,00 |
| SR-99 có scope | 0,02 | 0,01 | 0,80 | 2,00 |
| SR-99 không scope | 4,50 | 4,50 | 5,50 | 6,00 |

Quy tắc: ngồi giảm spread 35–40% và recoil 15%; di chuyển > 50% tốc độ tối đa → áp spread di chuyển (không cộng dồn tuyến tính). Thời gian hồi spread về gốc sau khi dừng: rifle 0,35s, pistol 0,25s, sniper 0,50s.

### 6.3. Recoil pattern (deterministic, học được — không random hoàn toàn)

Pattern VK-7 (seed cố định theo vũ khí + jitter ngang ±0,05°): đạn 1–7 lên thẳng (0,62° dọc/đạn, ngang 0–0,08°); đạn 8–15 lên + lệch phải (0,55° dọc, +0,22° ngang); đạn 16–22 lên + lệch trái mạnh (0,48° dọc, −0,30° ngang); đạn 23–30 lên yếu + lệch phải (0,40° dọc, +0,18° ngang). VK-5: cùng hình dạng, biên độ ngang ×0,85, dọc ×0,94. Pistol/Sniper: chỉ giật dọc đơn phát rồi hồi tâm — P9 hồi 0,20s, DP-50 0,35s, SR-99 1,00s. Hệ số recoil theo tư thế: ngồi ×0,85, di chuyển ×1,15, nhảy ×1,50.

### 6.4. Damage falloff

```js
// d = khoảng cách (m), R0 = tầm bắt đầu giảm, bước 10m
mult = d <= R0 ? 1.0 : Math.pow(falloffFactor, (d - R0) / 10);
finalDamage = Math.max(1, Math.floor(baseDamage * regionMult * mult));
```

| Vũ khí | R0 | Hệ số/10m | Damage thân ở 50m | ở 100m |
|---|---|---|---|---|
| VK-7 | 20m | 0,96 | 30 | 23 |
| VK-5 | 15m | 0,94 | 26 | 17 |
| P9 | 12m | 0,92 | 16 | 8 |
| DP-50 | 15m | 0,94 | 42 | 28 |
| SR-99 | 50m | 0,995 | 112 | 109 |

Headshot nhân ×4,0 **trước** falloff. Trong tầm hiệu quả, headshot VK-7/DP-50 luôn ≥ 90 damage (1 head + 1 body = chết).

### 6.5. Reload & Knife & Xuyên tường

- **Reload:** reload cả băng (kể cả SR-99 ở v1); bị huỷ khi đổi vũ khí; đạn được tính là đã nạp ở mốc 80% thời gian (20% cuối là animation); reload rỗng = tactical + 0,6s; không tự reload khi hết băng.
- **Knife K-0:** tầm 1,6m, góc 90° trước mặt. Đâm nhanh (LMB): 35 thân / 55 sau lưng, delay 0,50s. Đâm mạnh (RMB): 55 thân / **165 sau lưng (backstab = chết ngay)**, delay 1,25s, tạo tiếng động bán kính 8m. Điều kiện backstab: góc sau lưng < 60° + khoảng cách < 1,4m. Không có headshot multiplier cho dao.
- **Xuyên tường — v1: KHÔNG.** `penetrationPower = 0` cho mọi vũ khí; đạn dừng ở bề mặt rắn đầu tiên (chỉ tạo impact). Để sẵn field `penetrationPower` (VK-7=1, DP-50=1, SR-99=2) cho v2: khi đó chỉ vật liệu tag `ThinProp` mới xuyên được và chỉ SR-99, damage sau xuyên −50%.

---

## Phần 7 — Map "Neon Divide" (Nhóm 7)

> Map **gốc 100%**, không sao chép bất kỳ map có sẵn nào. Concept: trạm năng lượng neon sci-fi bị chia đôi bởi lõi Mid. A = tông **Cyan** `#22d3ee`, B = tông **Magenta** `#ff2ea6`, Mid = trắng/tím.

### 7.1. Quy ước & kích thước

```js
// 1 unit = 1 mét. +X = Đông (sang B), −X = Tây (sang A), +Z = Nam (về ATK spawn), −Z = Bắc (về DEF spawn)
// Y = cao. Box đặt tại position(x, h/2, z), BoxGeometry(w, h, d); w = rộng theo X, d = sâu theo Z, h = cao theo Y
```

| Hạng mục | Giá trị |
|---|---|
| Sàn | `x[−42,42] × z[−30,30]` = **84×60 unit**; `PlaneGeometry(84,60)` tâm `(0,0,0)`, màu `#0b0f1a` |
| DEF (CT) Spawn | Bắc, tâm `(0,−24)` |
| ATK (T) Spawn | Nam, tâm `(0,24)` |
| Site A | `x[−38,−16], z[−26,−8]` (Tây–Bắc) |
| Site B | `x[16,38], z[−26,−8]` (Đông–Bắc) |
| Mid | Trục dọc `x[−4,4]`, chạy Bắc–Nam |
| Lưới snap | 1 unit cho tường, 0,5 unit cho crate — mọi tọa độ dưới đây đã snap |
| Chiều cao | Tường biên 5 (dày 2); tường nội bộ 4 |
| Chiều rộng lane | A Main/B Main/Mid: 8; Connector: 6; Mid Doors: khe 2; cửa Site: 8; hành lang Nam & CT link: 6–8 |
| Người chơi | Cao 1,8; mắt 1,62; ngồi 1,0 (collision 1,35 — Phần 1); nhảy ~0,61 (Phần 0) |
| Phân loại cover | `crate_full/container h=2,2` che toàn thân đứng · `crate_half h=1,1` che khi ngồi, lộ đầu khi đứng · `barrier/platform h=0,6` che thấp/nhảy lên được |

**3 lane:** A Lane — ATK Spawn → hành lang Nam–Tây (`z≈24`) → hành lang `x≈−26` → Choke A Main `(−26,6)` → cửa Nam Site A `(−26,−8)`. Mid — `(0,14)` → Mid Doors `(0,0)` → `(0,−14)`; từ Mid rẽ qua Connector ở `z≈−6` sang A/B. B Lane đối xứng A. Connector phụ: Mid→A/B ở `z=−6`; CT→A/B ở `z≈−18` (CT rotate nhanh nhưng lộ ở cửa Site).

```
      TÂY −X                                      +X ĐÔNG
BẮC −Z  +--------------------------------------------+
        | [A:CYAN]      CT−A    [CT SPAWN]  CT−B  [B:MAGENTA]|
        |  A SITE       ======= (0,−24) =======  B SITE    |
        |  plant A               |Mid trên|      plant B   |
        |    |        Mid−A Conn |        | Mid−B Conn    |
        |  A |        <==========|        |==========> B  |
        |  A | cửa A      (−13,−6) (0,0) (13,−6)   cửa B  |
        |  L |                   | Doors |          B L   |
        |  A |  A Main choke     |       |    B Main choke |
        |  N |    (−26,6)        |       |      (26,6)     |
        |  E |                   | Mid   |          B Lane |
        |    |                   |(0,14) |                 |
        |    +−−−−−− T Spawn Tây (0,24) T Spawn Đông −−−−−−+
NAM +Z  +-------------------[T SPAWN]----------------------+
```

### 7.2. Danh sách 68 khối hộp — Site A + Spawn (ID 01–30)

Định dạng: `{x,z,w,d,h,type,color}` — `x,z` là tâm.

```json
[
 {"x":0,"z":-30,"w":84,"d":2,"h":5,"type":"wall","color":"#141824"},
 {"x":0,"z":30,"w":84,"d":2,"h":5,"type":"wall","color":"#141824"},
 {"x":-42,"z":0,"w":2,"d":60,"h":5,"type":"wall","color":"#141824"},
 {"x":42,"z":0,"w":2,"d":60,"h":5,"type":"wall","color":"#141824"},
 {"x":-4,"z":-24,"w":3,"d":3,"h":1.1,"type":"crate_half","color":"#2a3550"},
 {"x":4,"z":-24,"w":3,"d":3,"h":2.2,"type":"crate_full","color":"#2a3550"},
 {"x":-9,"z":-21,"w":2,"d":2,"h":4,"type":"pillar","color":"#00f0ff"},
 {"x":-4,"z":24,"w":3,"d":3,"h":1.1,"type":"crate_half","color":"#2a3550"},
 {"x":4,"z":24,"w":3,"d":3,"h":2.2,"type":"crate_full","color":"#2a3550"},
 {"x":9,"z":21,"w":2,"d":2,"h":4,"type":"pillar","color":"#ff2ea6"},
 {"x":-31,"z":14,"w":2,"d":12,"h":4,"type":"wall","color":"#1a2133"},
 {"x":-21,"z":14,"w":2,"d":12,"h":4,"type":"wall","color":"#1a2133"},
 {"x":-31,"z":-1,"w":2,"d":10,"h":4,"type":"wall","color":"#1a2133"},
 {"x":-21,"z":3,"w":2,"d":6,"h":4,"type":"wall","color":"#1a2133"},
 {"x":-13,"z":19,"w":16,"d":2,"h":4,"type":"wall","color":"#1a2133"},
 {"x":-21,"z":-5,"w":2,"d":4,"h":4,"type":"wall","color":"#1a2133"},
 {"x":-16,"z":-21,"w":2,"d":10,"h":4,"type":"wall","color":"#1a2133"},
 {"x":-31,"z":-25,"w":6,"d":3,"h":2.2,"type":"container","color":"#164e63"},
 {"x":-35,"z":-20,"w":4,"d":4,"h":2.2,"type":"crate_full","color":"#164e63"},
 {"x":-35,"z":-15,"w":4,"d":2,"h":1.1,"type":"crate_half","color":"#22d3ee"},
 {"x":-29,"z":-19,"w":2,"d":2,"h":3.5,"type":"pillar","color":"#1e293b"},
 {"x":-24,"z":-21,"w":5,"d":2,"h":1.1,"type":"crate_half","color":"#22d3ee"},
 {"x":-19,"z":-24,"w":4,"d":4,"h":2.2,"type":"crate_full","color":"#164e63"},
 {"x":-19,"z":-16,"w":2,"d":2,"h":4,"type":"pillar","color":"#1e293b"},
 {"x":-28,"z":-11,"w":6,"d":1.5,"h":0.6,"type":"barrier","color":"#22d3ee"},
 {"x":-37,"z":-11,"w":8,"d":2,"h":4,"type":"wall","color":"#1a2133"},
 {"x":-23,"z":-25,"w":4,"d":3,"h":0.6,"type":"platform","color":"#334155"},
 {"x":-38,"z":-26,"w":3,"d":3,"h":5,"type":"pillar_neon","color":"#22d3ee"},
 {"x":-22,"z":-10,"w":3,"d":2,"h":1.1,"type":"crate_half","color":"#22d3ee"},
 {"x":-30,"z":-14,"w":3,"d":3,"h":1.1,"type":"crate_half","color":"#0e7490"}
]
```
*(Thứ tự trong mảng = ID 01–30. Ghi chú vị trí đáng chú ý: khối 17 chừa cửa CT ở z[−16,−8]; khối 29 đặt ở mép cửa Nam, không chặn tâm cửa.)*

### 7.3. Danh sách khối hộp — Mid + Connector + Site B (ID 31–68)

```json
[
 {"x":-5,"z":14,"w":2,"d":12,"h":4,"type":"wall","color":"#1a2133"},
 {"x":5,"z":14,"w":2,"d":12,"h":4,"type":"wall","color":"#1a2133"},
 {"x":-5,"z":-14,"w":2,"d":12,"h":4,"type":"wall","color":"#1a2133"},
 {"x":5,"z":-14,"w":2,"d":12,"h":4,"type":"wall","color":"#1a2133"},
 {"x":-2.5,"z":0,"w":3,"d":2,"h":3,"type":"pillar","color":"#a855f7"},
 {"x":2.5,"z":0,"w":3,"d":2,"h":3,"type":"pillar","color":"#a855f7"},
 {"x":-2,"z":8,"w":3,"d":3,"h":1.1,"type":"crate_half","color":"#7e22ce"},
 {"x":2,"z":-8,"w":3,"d":3,"h":1.1,"type":"crate_half","color":"#7e22ce"},
 {"x":1,"z":11,"w":4,"d":1,"h":0.6,"type":"barrier","color":"#a855f7"},
 {"x":-1,"z":-12,"w":4,"d":1,"h":0.6,"type":"barrier","color":"#a855f7"},
 {"x":-5,"z":-5,"w":2,"d":2,"h":4,"type":"pillar_neon","color":"#00f0ff"},
 {"x":5,"z":5,"w":2,"d":2,"h":4,"type":"pillar_neon","color":"#ff2ea6"},
 {"x":-13,"z":-9,"w":16,"d":2,"h":4,"type":"wall","color":"#1a2133"},
 {"x":-18,"z":-3,"w":6,"d":2,"h":4,"type":"wall","color":"#1a2133"},
 {"x":-13,"z":-6,"w":3,"d":2,"h":1.1,"type":"crate_half","color":"#22d3ee"},
 {"x":13,"z":-9,"w":16,"d":2,"h":4,"type":"wall","color":"#1a2133"},
 {"x":18,"z":-3,"w":6,"d":2,"h":4,"type":"wall","color":"#1a2133"},
 {"x":13,"z":-6,"w":3,"d":2,"h":1.1,"type":"crate_half","color":"#ff2ea6"},
 {"x":-11,"z":-15,"w":10,"d":2,"h":4,"type":"wall","color":"#1a2133"},
 {"x":11,"z":-15,"w":10,"d":2,"h":4,"type":"wall","color":"#1a2133"},
 {"x":21,"z":14,"w":2,"d":12,"h":4,"type":"wall","color":"#1a2133"},
 {"x":31,"z":14,"w":2,"d":12,"h":4,"type":"wall","color":"#1a2133"},
 {"x":21,"z":3,"w":2,"d":6,"h":4,"type":"wall","color":"#1a2133"},
 {"x":31,"z":-1,"w":2,"d":10,"h":4,"type":"wall","color":"#1a2133"},
 {"x":13,"z":19,"w":16,"d":2,"h":4,"type":"wall","color":"#1a2133"},
 {"x":16,"z":-21,"w":2,"d":10,"h":4,"type":"wall","color":"#1a2133"},
 {"x":31,"z":-25,"w":6,"d":3,"h":2.2,"type":"container","color":"#881337"},
 {"x":35,"z":-20,"w":4,"d":4,"h":2.2,"type":"crate_full","color":"#881337"},
 {"x":35,"z":-15,"w":4,"d":2,"h":1.1,"type":"crate_half","color":"#ff2ea6"},
 {"x":29,"z":-19,"w":2,"d":2,"h":3.5,"type":"pillar","color":"#1e293b"},
 {"x":24,"z":-21,"w":5,"d":2,"h":1.1,"type":"crate_half","color":"#ff2ea6"},
 {"x":19,"z":-24,"w":4,"d":4,"h":2.2,"type":"crate_full","color":"#881337"},
 {"x":19,"z":-16,"w":2,"d":2,"h":4,"type":"pillar","color":"#1e293b"},
 {"x":28,"z":-11,"w":6,"d":1.5,"h":0.6,"type":"barrier","color":"#ff2ea6"},
 {"x":37,"z":-11,"w":8,"d":2,"h":4,"type":"wall","color":"#1a2133"},
 {"x":38,"z":-26,"w":3,"d":3,"h":5,"type":"pillar_neon","color":"#ff2ea6"},
 {"x":23,"z":-25,"w":4,"d":3,"h":0.6,"type":"platform","color":"#334155"},
 {"x":30,"z":-14,"w":3,"d":3,"h":1.1,"type":"crate_half","color":"#9f1239"}
]
```
*(Thứ tự = ID 31–68. Khối 35/36 tạo Mid Doors với khe hở x[−1,1] = 2 unit. Khối 56 chừa cửa CT vào B ở z[−16,−8]. Site B cố ý ít container cao hơn A để B dễ retake hơn.)*

Code dựng nhanh:

```js
boxes.forEach(b => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d),
    new THREE.MeshStandardMaterial({ color: b.color }));
  m.position.set(b.x, b.h / 2, b.z); scene.add(m);
  colliders.push(new THREE.Box3().setFromObject(m));  // đăng ký AABB theo Phần 1/9
});
```

### 7.4. Choke points & timing (tốc độ 5,5 u/s, quãng đường Manhattan theo hành lang)

| Choke point | Tọa độ | ATK Spawn tới | DEF Spawn tới | Ghi chú |
|---|---|---|---|---|
| T-Mid dưới | `(0,14)` | 10u = **1,8s** | 38u = 6,9s | ATK kiểm soát đầu Mid trước |
| Mid Doors | `(0,0)` | 24u = **4,4s** | 24u = **4,4s** | Đấu sniper 50–50, khe cửa 2u |
| A Main / B Main | `(∓26,6)` | 44u = **8,0s** | ~50u = 9,1s | ATK tới trước nếu DEF không cắt qua connector |
| Mid-A / Mid-B Connector | `(∓13,−6)` | 43u = 7,8s (qua Mid) | 31u = **5,6s** | DEF chiếm connector trước → ATK phải check góc khối 45/48 |
| Cửa Nam Site A/B | `(∓26,−8)` | 58u = 10,5s | 24u = **4,4s** (qua CT Link) | DEF vào thế thủ trong site trước |
| CT-A / CT-B Link | `(∓11,−18)` | ~55u = 10,0s | 17u = **3,1s** | Tuyến rotate chính của DEF |
| Tâm plant A/B | `(∓27,−19)` | ~69u = 12,5s | ~29u = 5,3s | Chủ đích tactical: DEF setup trước, ATK dùng Mid/Connector cắt rotate |

### 7.5. Bombsite zones

```json
bombsiteA = { "minX": -34, "maxX": -20, "minZ": -24, "maxZ": -14, "center": {"x": -27, "z": -19}, "size": "14x10", "color": "#22d3ee" }
bombsiteB = { "minX":  20, "maxX":  34, "minZ": -24, "maxZ": -14, "center": {"x":  27, "z": -19}, "size": "14x10", "color": "#ff2ea6" }
```

Vẽ zone: `PlaneGeometry(14,10)` tại `(∓27, 0.02, −19)`, `rotation.x = −PI/2`, material trong suốt 25% + viền neon cùng màu. Cả 2 zone có ≥3 cover nhìn vào vùng plant (trụ 21/60, crate 22/61, crate 30/68) — người đặt bom không lộ hoàn toàn từ cửa Nam lẫn cửa DEF.

---

## Phần 8 — Audio / UI / HUD (Nhóm 8)

> Toàn bộ âm thanh **tổng hợp bằng WebAudio, không file ngoài**. Mọi công thức đã tham số hoá theo `MAP_BOUNDS` (Phần 0) — bản nháp của Nhóm 8 giả định map 60×60, bản này đã khớp map 84×60 của Phần 7. File triển khai theo cây Phần 10: `src/audio/audio.js`, `src/ui/hud.js`, `src/ui/minimap.js`, `src/ui/menus.js`.

### 8.1. WebAudio SFX

**Kiến trúc:** `AudioContext` tạo lúc load, chỉ `resume()` trong handler click đầu tiên (cùng click xin pointer lock). Chain: `source → panner → busGain → master (0,8) → DynamicsCompressor (threshold −18dB, ratio 6, attack 0,003, release 0,25) → destination`. Bus gain: sfx 0,9 · ui 0,5 · world 0,7 · ult 1,0.
**Noise buffer** tạo 1 lần (white noise 2s), dùng lại cho mọi tiếng súng/bước chân: `BufferSource(loop, playbackRate 0,9–1,1) → BiquadFilter → Gain(ADSR)`. Envelope chuẩn: attack 2–5ms lên peak → `exponentialRamp` về 0,001 (không dùng linearRamp cho tiếng súng).
**Spatial cho tiếng địch (mọi SFX world):** `gainScale = 1/(1 + d*0,09)` (d=10 → 0,53; d=30 → 0,27); `lowpass = clamp(8000 − d*220, 600, 8000)` Hz; pan bằng `StereoPannerNode`, `pan = sin(góc tương đối)`. Trần **16 voice** đồng thời ở tầng synth này (voice stealing: cắt voice cũ nhất/xa nhất; ngân sách buffer-source tổng thể xem Phần 9).

**Bảng SFX tiếng súng (mỗi tiếng 2–3 layer):**

| SFX | Layer/Osc | Freq start→end | Dur | Gain peak | Filter/Ghi chú |
|---|---|---|---|---|---|
| Pistol (P9) | Noise + Triangle | tri 320→80 | 0,07 / 0,06s | 0,70 / 0,40 | Noise lowpass 5000→1200 |
| SMG | Noise + Square | sq 240→60 | 0,055 / 0,05s | 0,60 / 0,35 | Noise lowpass 5500→1500 — phải ngắn nhất |
| Rifle (VK-7/VK-5) | Noise + Square + click | sq 180→45 | 0,12 / 0,09s | 0,90 / 0,50 | Noise lowpass 4000→900; click: noise highpass 3000, 0,02s, gain 0,20 tại t=0 |
| Shotgun | Noise + Sine sub | sine 120→30 | 0,25 / 0,20s | 1,00 / 0,90 | Lowpass 2500→300; pump ở +0,28s: noise bandpass 900→400, 0,08s ×2 cách 0,09s, gain 0,30 |
| Sniper (SR-99) | Noise + Sine sub + echo | sine 100→25 | 0,35 / 0,30s | 1,00 / 0,90 | Lowpass 6000→400; echo DelayNode 0,18s feedback 0,25 (1 lần); bolt ở +0,40s & +0,60s: square 600→200, 0,04s, gain 0,25 |
| Dry fire | Square click | 900→300 | 0,03s | 0,25 | Chỉ click, không noise |

**Bảng SFX gameplay/UI:**

| SFX | Công thức | Ghi chú |
|---|---|---|
| Hit marker thân | Sine 1500→1300, 0,04s, gain 0,30 | Không chồng quá 4/100ms |
| Headshot | Sine 2400→2000 + harmonic 3600 (gain 0,15), 0,06s, gain 0,40 | "Ping" phân biệt rõ với hit thường |
| Kill confirm | Sine 1800 rồi 2600 (+0,05s), 0,05+0,07s, gain 0,35 | |
| Bị trúng đạn | Sine 200→60, 0,12s, gain 0,50 + noise lowpass 800 (0,05s, 0,20) | |
| Reload | 3 mốc: rút băng t=0 (square 800→300, 0,04s) → lắp băng (square 500→900) → lên đạn ×2 (700→250, 900→400). Mốc lắp/lên đạn theo loại: pistol/SMG +0,45/+0,90s; rifle +0,70/+0,90 & +1,02s | Tổng khớp thời lượng reload Phần 6 |
| Plant — đang đặt | Square beep 880Hz, 0,07s, mỗi 0,40s; 0,8s cuối mỗi 0,20s pitch 1100 | Plant thành công: sine chord 880+1320, 0,15s |
| Bomb tick | Sine 1000 (10s cuối: 1400), 0,05s, mỗi 1,0s (cuối: 0,50s) | Volume theo khoảng cách tới bom (spatial) |
| Defuse tick / thành công | Square 1200, 0,03s, mỗi 0,25s / Arpeggio sine 660→880→1320, 0,09s/nốt | |
| Bomb nổ | Noise (lowpass 3000→100, 1,20s) + sine 80→20 (1,00s), gain 1,00 | Rung màn hình do gameplay, audio chỉ phát tiếng |
| Bước chân chạy / đi bộ / ngồi | Noise bandpass 400–900 / 350–700 / 300–500; interval **0,38 / 0,55 / 0,75s**; gain 0,35 / 0,18 / 0,05; pan luân phiên ∓0,10 | Ngồi: bán kính nghe ~3m |
| Ult sẵn sàng | Sine arpeggio 660, 880, 1320 (0,09s/nốt, chồng 0,05s), gain 0,30 | Chỉ phát 1 lần khi đầy |
| Ult kích hoạt | Saw sweep 200→1200 (0,40s) + sine drop 300→50 (0,50s) + noise swell lowpass 500→4000; gain 0,45 | Đổi pitch gốc ±20% theo operator |
| UI hover/click · mua OK · mua lỗi | Square 800/1200 (0,02–0,03s) · Sine 900→1400 (0,06s/nốt) · Saw buzz 160Hz (0,15s) | UI chỉ ở menu, tắt khi pointer-lock |

API cho các module khác (bọc qua `audio.play(name, opts)` của Phần 10): `sfx.gun(type,{dist,angle})`, `sfx.hit('body'|'head'|'kill')`, `sfx.reload(weaponType)`, `sfx.footstep({mode,dist,angle})`, `sfx.plant()/defuse()/bombTick()/explode()`, `sfx.ultReady()/ultCast(operatorId)`, `sfx.ui(name)`.

### 8.2. HUD chính (DOM overlay, `pointer-events:none` trừ menu)

```
┌──────────────────────────────────────────────────────────────────────┐
│ ┌─────────┐   [phe] DEF  5 ──│ 1:55 │── 5  ATK        ┌─Killfeed─┐ │
│ │ MINIMAP │            (Timer top-center)               │ tên ▸súng▸ │ │
│ │ 210×150 │                                             └──────────┘ │
│ └─────────┘                                                          │
│              ┌── ANNOUNCEMENT (2–3s) ──┐            hitmarker (X)    │
│              │   BOM ĐÃ ĐẶT / THẮNG ROUND │            ở tâm          │
│              └─────────────────────────┘        ✛ CROSSHAIR          │
│ ┌──────────────────┐   ┌─── ULT ───┐   ┌─────────────────────┐      │
│ │ HP  78 ██████░░  │   │ Q ▢  E ▢  │   │ VK-7                │      │
│ │ Giáp 54 ████░░░  │   │ ⚡ điểm 5/7│   │ ĐẠN  25 / 90        │      │
│ └──────────────────┘   │ [X] ULT   │   │ $ 3.250             │      │
│  bottom-left 20px      └─────────┘   └─────────────────────┘         │
│                         bottom-center        bottom-right 20px       │
└──────────────────────────────────────────────────────────────────────┘
```

| Phần tử | Vị trí/kích thước | Quy tắc |
|---|---|---|
| HP | Bottom-left, cách mép 20px; số 36px bold + thanh 220×8px | Xanh → vàng <50 → đỏ nhấp nháy <30 + vignette đỏ toàn màn hình khi <30. Chỉ re-render khi giá trị đổi |
| Giáp | Dưới HP 6px; số 24px + thanh 220×6px, màu `#38BDF8` | 0–100, tách bạch với HP |
| Đạn | Bottom-right; băng đạn 40px bold / dự trữ 20px | Đỏ khi băng ≤25%; =0 → nhấp nháy + chữ `R — NẠP ĐẠN`. Tên súng (mã Phần 6) 14px chữ hoa phía trên |
| Tiền | Dưới đạn, 20px | Animation `+$300` bay lên khi nhận thưởng, tự xoá sau 1,2s |
| Timer | Top-center 28px bold trên panel | `M:SS`; <10s → đỏ + pulse 1Hz. **Khi bom đã plant: thay bằng icon bom đỏ nhấp nháy 2Hz** (đếm ngược do game cung cấp) |
| Điểm số | 2 bên timer | Phe của người chơi tô sáng |
| Ultimate | Bottom-center; thanh 320×10px chia mốc theo điểm tối đa của operator (6 hoặc 7) | Hiển thị dạng **điểm `5/7`** + % phụ; đầy → vàng + pulse + chữ `X — SẴN SÀNG` + `sfx.ultReady()`. Ô Q/E 44×44px bên trái: phủ cooldown bằng conic-gradient + số giây ở giữa |
| Vignette/flash | Toàn màn hình | Đỏ khi bị trúng, trắng khi flash; opacity ≤ 0,35, fade 300ms — chỉ nhận sự kiện, không tự quyết logic |

Panel chung: `background: rgba(15,23,42,0.55); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; backdrop-filter: blur(4px); padding: 10px 14px`. Font `'Rajdhani','Segoe UI',system-ui,sans-serif`, số dùng `font-variant-numeric: tabular-nums`; fallback system font phải chạy hoàn toàn.

**Bảng màu:** chữ chính `#F1F5F9` · đồng minh `#22D3EE` · địch `#EF4444` · HP/tiền `#4ADE80`/`#FACC15` · giáp `#38BDF8` · ult nạp/đầy `#A78BFA`/`#FBBF24` · headshot `#F97316` · crosshair mặc định `#00FF88` (đổi được trong Settings).

### 8.3. Minimap canvas 2D (đã chuẩn hoá theo Phần 0)

- Canvas **210×150 px** CSS (420×300 backing store ×2), góc bo 8px, top-left cách mép 16px. Tỉ lệ **2,5 px/m** cả 2 trục; `px=(worldX+42)*2,5`, `py=(worldZ+30)*2,5`. **North-up cố định** (map không xoay, chỉ mũi tên người chơi xoay theo yaw). Vẽ lại **20 FPS** (mỗi 50ms).
- **Static layer** (offscreen, vẽ 1 lần): nền `#0F172A`, tường/khối `#334155` (từ mảng rect của Phần 7), đường đi `#1E293B`, site A/B tô `rgba(34,211,238,.25)`/`rgba(255,46,166,.25)` + chữ `A`/`B` 16px bold, spawn tô nhạt theo phe.
- **Dynamic layer** (20 FPS): người chơi = tam giác 10px trắng viền cyan theo yaw (luôn trên cùng); đồng đội = chấm r=4px cyan + vạch hướng 6px; **địch mặc định ẩn** — chỉ hiện chấm đỏ khi vừa bắn <3s, bị spotted, hoặc bị recon quét (mờ dần 1s cuối); bom rớt/đã plant = `◆` cam 8px nhấp nháy 2Hz; ping đồng đội = vòng vàng lan 0,5s (tuỳ chọn). Clamp tọa độ vào `[4,206]×[4,146]`.

### 8.4. Killfeed + Announcement + Hitmarker

- **Killfeed:** top-right dưới mép 16px, tối đa **5 dòng**, mỗi dòng sống **5s** (fade 0,5s cuối, slide-in 150ms). Dạng `[Kẻ giết] [tên súng — mã Phần 6] ▸HS▸ [Nạn nhân]`; tên theo phe (mình cyan, địch đỏ, nạn nhân opacity 0,75); headshot thêm badge `⊕ HS` cam `#F97316`; kill bằng ability → tên ability màu tím; tự sát → tên nạn nhân + `✖`.
- **Announcement:** giữa màn hình, trên crosshair 120px, không bao giờ hiện 2 cái cùng lúc; hàng đợi ưu tiên: kết thúc trận > bom > thắng/thua round > round bắt đầu. Nội dung: `ROUND {n}` (2,0s) · `BOM ĐÃ ĐẶT` đỏ (2,5s, text phụ theo phe) · `ĐANG GỠ BOM…` + thanh tiến trình 240×6px · `THẮNG/THUA ROUND` + lý do + tiền thưởng (3,0s) · `THẮNG/THUA TRẬN` + tỉ số (5,0s). Animation scale 0,9→1,0 + fade-in 200ms, fade-out 300ms.
- **Hitmarker:** 4 vạch chéo (X) dài 10px dày 2px cách tâm 6px — trúng thân: trắng 100ms; headshot: cam, dài 12px, 120ms; kill: vàng, 180ms, scale 1,3×. Hình + tiếng hit phát **cùng frame**. Kèm chỉ báo hướng bị bắn: cung đỏ 60° ở rìa màn hình phía nguồn đạn, opacity 0,6, fade 600ms.

### 8.5. Buy Menu (phím B)

- Mở khi: đang freeze/buy phase **hoặc** trong 20s đầu live và đứng ở spawn (Phần 3); ngoài điều kiện → toast `Hết thời gian mua` 1s. Mở = thoát pointer lock, đóng (`B`/`Esc`) = lock lại. Panel giữa màn hình 920×560px, nền `rgba(15,23,42,.92)`, header hiện thời gian mua còn lại + tiền.
- Lưới 6 nhóm (phím 1–6): `1` Pistol (P9 $0 · pistol nhẹ $300 · DP-50 $700) · `2` SMG ($1.050–1.500) · `3` Rifle (VK-5 $2.000 · VK-7 $2.700) · `4` Súng nặng (Shotgun $1.100 · SR-99 $4.750) · `5` Trang bị (Giáp $650 · Giáp+Mũ $1.000 · **Kit gỡ bom $400 — chỉ DEF**) · `6` Hỗ trợ (lựu choáng $200 · khói $300 · nổ $300 · thêm charge ability $200).
- Tương tác 2 nấc kiểu cổ điển: phím số chọn nhóm → phím số chọn item; `Backspace` bán lại item vừa mua (hoàn 100% trong buy phase). Trạng thái ô: đủ tiền = viền trắng; thiếu tiền = giá đỏ + mờ 50% + `sfx.ui('error')`; đã có = viền xanh lá + `✓ ĐÃ CÓ`. Mua OK: tiếng `buy` + trừ tiền HUD ngay + ô nháy xanh 150ms. Ammo đi kèm súng tự đầy băng dự trữ.

### 8.6. Crosshair động

- DOM 4 vạch (10×2px) + chấm tâm 2px, điều khiển bằng CSS variable `--gap`; gameplay chỉ gọi `crosshair.setSpread(px)` mỗi frame.
- Công thức: `gap = 4 + spreadSúng*380 + tốcĐộ*1,6 + (nhảy/rơi ? 14 : 0) − (ngồi ? 3 : 0) − (ADS ? 6 : 0)`, clamp [2, 42]. Sau mỗi phát bắn: `gap +=` theo súng (Rifle +6, Pistol +4, Shotgun +12, Sniper +18) rồi hồi về nền 90 px/s. Kiểm chứng: đứng yên Rifle ≈6px · chạy Rifle ≈15px · ngồi yên ≈3px.
- Màu `#00FF88` + `box-shadow 0 0 2px #000`. Sniper chưa scope: crosshair mờ 30%; đang scope: ẩn hẳn. (Số spread góc ở Phần 6 là số gameplay; `setSpread` nhận px đã quy đổi từ gameplay.)

### 8.7. Màn hình chọn Operator (đầu trận)

- Full-screen trên nền cảnh 3D map mờ (blur + tối 60%); tiêu đề `CHỌN OPERATOR — 0:20` (đếm theo `phaseTimer` Phần 10, hết giờ auto-pick). **8 thẻ operator** (từ dữ liệu Phần 4) xếp 2 hàng × 4, mỗi thẻ 260×400px: khối gradient màu riêng + icon ký tự; tên + vai trò; 3 thanh mini Tốc độ/Giáp/Độ khó (1–5 vạch); 4 dòng `Q: …` · `E: …` · `Passive: …` · `X (Ult): …` lấy thẳng từ data Phần 4; đồng đội 5 slot phía trên thẻ hiện operator họ đã khoá.
- Trạng thái: hover phóng 1,05× + viền sáng; đã chọn: viền vàng; đã khoá (Enter/click đúp): viền xanh lá + `ĐÃ KHOÁ`. Phím: `1–8`/mũi tên chọn, `Enter` khoá.
- UI chỉ **trình bày** data `{id,name,role,color,icon,stats,skills:{Q,E,passive,X}}` — không tự định nghĩa hiệu ứng kỹ năng.

### 8.8. Nghiệm thu mảng Audio/UI

Nghe phân biệt được các loại súng chỉ bằng âm thanh; hit thân ≠ headshot ≠ kill · Mọi SFX qua 1 API duy nhất, có attenuate+pan, không file âm thanh trong repo · HUD không re-render khi giá trị không đổi; timer/ult/hitmarker khớp frame với sự kiện · Minimap đúng vị trí site (đứng tâm site A → chấm trong vùng A) · Killfeed ≤5 dòng, announcement không chồng · Buy menu thao tác được 100% bằng phím số · Crosshair nở khi chạy/bắn, thu khi đứng yên/ngồi.

---

## Phần 9 — Performance & QA (Nhóm 9)

### 9.1. Object pooling — bắt buộc, không `new` trong vòng lặp game

Pre-allocate lúc load, tái sử dụng ring-buffer; biến tạm `_v1,_v2,_ray` khai báo 1 lần toàn cục. Object dùng xong: `visible=false`, trả pool, không `scene.remove/add` liên tục.

| Đối tượng | Pool size v1 | Ghi chú |
|---|---|---|
| Tracer đạn | **128** | Sống 0,06–0,1s; hết pool ghi đè tracer cũ nhất |
| Muzzle flash (sprite, **không** PointLight thật) | **20** | 10 người × (viewmodel + world) |
| Impact effect (bụi/tia lửa) | **32 burst × 8 hạt = 256 hạt** | Sống 0,2–0,3s |
| Bullet hole decal (plane) | **100** ring-buffer | Đủ 1 round, cũ nhất tự mất |
| Vỏ đạn văng | **64** | Sống 0,8s |
| Hiệu ứng kỹ năng (projectile/AoE/khói/flash) | **16/loại, tối đa 64 tổng** | CD kỹ năng ≥25s nên không bao giờ cần >4 active/loại/người. Khói = 1 mesh sphere transparent, không particle system riêng |
| Hitmarker + damage number (DOM) | **20** `<div>` tạo sẵn | Không `createElement` khi trúng đạn |
| Audio buffer đã decode / synth | 1 buffer/loại, ~12 loại (nếu dùng buffer); synth node tạo theo mẫu Phần 8 | Voice đồng thời: trần cứng **32**, thực tế cap **24** (Phần 8 dùng 16 cho SFX world). Voice stealing: tắt voice cũ nhất/xa nhất; footstep bot >25m không phát; tiếng súng của người chơi không bao giờ bị stealing |

Nghiệm thu pooling: bắn liên thanh 300 viên + 9 bot cùng bắn 60s → `renderer.info.memory` không tăng, không spike GC >5ms, FPS không giảm dần theo thời gian.

### 9.2. Tiết kiệm raycast

**Quy tắc vàng: chỉ raycast khi có sự kiện bắn; bot LOS chia lượt; cấm `raycaster.intersectObjects(scene.children, true)`.**

| Hạng mục | Cách làm v1 | Ngân sách |
|---|---|---|
| Danh sách va chạm | Tự quản bằng AABB: map tĩnh 68 khối Phần 7 gộp/đăng ký **~40–68 AABB**; nhân vật 3 box/người (đầu/thân/chân) × 10 = 30 AABB. 1 phát bắn kiểm tra **<90 AABB test** (~<0,1ms) | Đối chiếu: raycast mesh chưa merge 50k–200k tam giác = 5–15ms/phát → cấm |
| Thuật toán bắn | (1) Ray vs AABB tĩnh → `tWall` gần nhất. (2) Ray vs 30 hitbox, chỉ xét `t < tWall`. (3) Lấy trúng gần nhất → vùng damage theo box (Phần 6) | |
| Bot LOS | **5 Hz, stagger**: mỗi frame chỉ 2 bot kiểm tra LOS. Bot bắn dùng chung hàm bắn của player | |
| Di chuyển | Player vs map chỉ check **9–12 AABB lân cận** (broadphase theo khu) | |
| **Tổng ngân sách raycast + collision** | | **<1,0ms/frame trung bình, <2,0ms ở frame nhiều phát bắn** (đo bằng `performance.now()` quanh hàm, log nếu vượt 100 lần liên tiếp) |
| Draw calls tiết kiệm kèm | Map tĩnh merge geometry theo vật liệu (tường 1–3 draw, props 5–10 draw); không merge đối tượng động | |

### 9.3. Ngân sách hiệu năng v1

Máy tham chiếu tối thiểu: laptop i5 gen 10 / Ryzen 5 3600, GTX 1650 / iGPU Iris Xe, RAM 8GB, Chrome mới nhất, 1080p.

| Chỉ số | Mục tiêu | Trần cứng |
|---|---|---|
| FPS | **60** trên máy tham chiếu | Không dưới **30** trong combat 5v5 |
| Frame time 16,6ms | JS logic ≤4ms · AI ≤2ms · Collision+Raycast ≤1ms · Render CPU ≤3ms · GPU ≤6ms | Frame >33ms liên tục 3s → kích hoạt degrade |
| Draw calls | 70–90 | **120** |
| Triangles hiển thị | 300k–400k | **500k** (map <200k, nhân vật <15k/người, viewmodel <5k) |
| Bot | 5v5 = **9 bot + 1 player** là mặc định và tối đa v1 | AI quyết định **10 Hz**, di chuyển nội suy mỗi frame |
| Ánh sáng | 1 DirectionalLight, shadow map 2048 (High) | Tối đa 2 đèn đổ bóng |
| Pixel ratio | `min(devicePixelRatio, 2)` | |

**Degrade tự động** (theo FPS trung bình trượt 3s, hạ từng nấc; tăng lại 1 nấc khi FPS >58 ổn định 10s; Settings cho chọn Auto/High/Medium/Low, mặc định Auto; **không** giảm số bot giữa round):
- **L0 High:** pixelRatio ≤2, shadow 2048, hiệu ứng đầy đủ.
- **L1 Medium** (FPS <50 trong 3s): pixelRatio ≤1,5, shadow 1024, impact 4 hạt/burst.
- **L2 Low** (FPS <40 tiếp): pixelRatio 1, **tắt shadow**, tắt vỏ đạn + decal + hạt kỹ năng (giữ mesh chính).
- **L3 Potato** (FPS <30 tiếp): pixelRatio 0,75, tắt muzzle flash của bot, tầm nhìn bot giảm còn 30m.

### 9.4. Lỗi thường gặp — xử lý từ đầu

| Lỗi | Cách xử lý bắt buộc |
|---|---|
| Pointer lock bị thoát (Esc/Alt-Tab/thông báo hệ thống) | Nghe `pointerlockchange`: mất lock khi đang chơi → **Pause + overlay "Click để tiếp tục"**, đóng băng bot và bomb timer. Re-lock phải từ click của người dùng; Chrome chặn re-lock ~1,25s sau Esc — không gọi `requestPointerLock()` trong loop (spam DOMException) |
| CDN Three.js | **Module + importmap, không UMD** (từ r160 Three.js bỏ bản UMD). Ghim 1 version `three@0.160.0` qua jsDelivr cho cả `three` và `three/addons/`. CDN chết → hiện thông báo lỗi rõ, không màn hình trắng vô định |
| Resize | `camera.aspect`, `updateProjectionMatrix()`, `renderer.setSize()` trong handler `resize`; test kéo nhỏ/phóng to/xoay không méo hình, không vỡ HUD |
| Tab ẩn / delta lớn | `delta = Math.min(clock.getDelta(), 0.05)` clamp cứng 50ms + `visibilitychange` → tự Pause. Không clamp: quay lại tab sau 5s = nhân vật xuyên tường, bom trừ oan 5s |
| Âm thanh bị khoá | `AudioContext` chỉ `resume()` trong click đầu tiên (Phần 8); không phát tiếng trước tương tác đầu, không lỗi console |

### 9.5. QA checklist & tiêu chí nghiệm thu v1

Test trên Chrome + Firefox, 1080p, bật debug (`?debug=1`: FPS, draw calls, vị trí). **P0 = blocker — fail 1 mục P0 là không nghiệm thu.**

**A. Điều khiển & Pointer Lock — P0**
- [ ] Click "Vào game" → vào pointer lock; sau Pause click lại → lock lại được, không lỗi console, xoay chuột 360°.
- [ ] WASD 4 hướng, Shift chạy, Ctrl/C ngồi, Space nhảy, R nạp đạn, 1/2 (và 3 = dao) đổi vũ khí, Tab bảng điểm, giữ E tương tác — 100% phím đúng.
- [ ] Esc giữa round → Pause ngay, bot + bomb timer đứng yên 10s; quay lại lệch timer <1s.
- [ ] Sát tường/thùng đi chéo + nhảy 20 lần ở 4 góc map: không xuyên AABB, không kẹt.

**B. Bắn & Sát thương — P0**
- [ ] Bắn tường ở 10m/30m: tracer, impact, decal đúng điểm ngắm, lệch <0,2m ở 30m.
- [ ] **Headshot theo bảng Phần 6:** bắn bot đứng yên cùng khoảng cách — damage đầu phải bằng damage thân × hệ số vùng của vũ khí đó (**×4,0** với VK-7/VK-5/P9/DP-50/SR-99; số tuyệt đối khớp bảng 6.1, VD VK-7: thân 34 → đầu 136), có hitmarker/hiệu ứng khác body. *(Bản nháp QA của Nhóm 9 ghi "×2" — đã chuẩn hoá theo Phần 6 tại Phần 0.)*
- [ ] Đạn bị AABB tường chặn: bot sau tường không mất máu.
- [ ] Hết đạn → không bắn được; R nạp đầy sau đúng thời gian Phần 6; bắn liên thanh 3 băng: vẫn dùng pool, FPS không giảm dần.

**C. Bot/AI — P0**
- [ ] **Không kẹt 60 giây:** bắt đầu round, không bắn, quan sát 9 bot 60s liên tục — không bot nào đứng yên >5s ngoài lúc giữ site/channel, không húc tường/chạy vòng tròn (log: thay đổi vị trí <0,5m trong 5s khi đang di chuyển = kẹt).
- [ ] Bot thấy địch trong tầm nhìn → ngắm/bắn <1s; bot không biết vị trí địch qua tường (không wallhack).
- [ ] Bot chết → mất hitbox ngay (bắn vào xác không tính damage).

**D. Bomb & thắng round — P0**
- [ ] Plant: giữ E **3,2s** trong site → thanh tiến trình chạy, bị di chuyển/bắn trúng thì huỷ; ngoài site → báo không hợp lệ. Plant xong: beep + bomb timer **40s**.
- [ ] Defuse: giữ E **10s** không kit / **5s** có kit → round kết thúc ngay; huỷ giữa chừng → tiến trình reset, timer bom vẫn chạy.
- [ ] Không defuse → bom nổ sau 40s, ATK thắng, nhân vật trong bán kính nổ chịu damage theo Phần 3.
- [ ] **4 điều kiện thắng — test riêng từng ván:** diệt hết địch / bom nổ (ATK) / defuse (DEF) / hết giờ chưa plant (DEF) — 4/4 cộng điểm đúng phe, chuyển round sau **7s**, reset tiền/vị trí/máu/bom đúng (trường hợp bom đã plant + ATK chết hết, round phải chờ nổ/gỡ — mục 3.6 dòng 2).
- [ ] Chơi liền 5 round không lỗi, không soft-lock phase.

**E. Kỹ năng, âm thanh, hiệu năng — P1 (fail >2 mục là không nghiệm thu)**
- [ ] Mỗi kỹ năng Q/E/X: bấm → hiệu ứng hiện + cooldown hiện trên HUD; bấm trong cooldown không kích hoạt lại; hết cooldown dùng lại được; pool không sót hiệu ứng ma.
- [ ] Âm thanh mở khoá từ click đầu; phân biệt được bắn/trúng/headshot/plant/nổ; không chồng >32 voice khi 10 người cùng bắn.
- [ ] Alt-Tab/ẩn tab 10s rồi quay lại: không xuyên tường, không mất round.
- [ ] Resize + F11 giữa round: hình không méo, bắn vẫn trúng tâm.
- [ ] Hiệu năng: combat đông nhất ở site 60s trên máy tham chiếu — FPS trung bình ≥55, thấp nhất ≥30, draw calls ≤120; degrade tự hạ nấc khi cố mở thêm tab nặng.

**Tiêu chí chốt:** (1) 100% P0 đạt trên Chrome và Firefox. (2) ≥90% P1 đạt, không crash/màn hình trắng/soft-lock. (3) Chơi liên tục 15 phút/5 round không reload: không rò rỉ bộ nhớ, FPS không giảm >10% so với lúc bắt đầu. (4) Sửa P0 xong phải test lại đủ: 4 điều kiện thắng + headshot + bot 60s.

---

## Phần 10 — Kiến trúc code & Tích hợp (Nhóm 10)

> Trạng thái repo lúc khảo sát (2026-11-08): gần như trống — chỉ có `README.md` và `MUSE_COMMIT_TEST.md`, chưa có code game.

### 10.1. Chốt cấu trúc: `index.html` mỏng + ES Modules, không bundler

| Tiêu chí | 1 file `index.html` | Tách module (CHỌN) |
|---|---|---|
| Xung đột khi 10 nhóm cùng sửa | Rất cao, mỗi push ghi đè nhau | Thấp — mỗi nhóm sở hữu 1–2 file |
| Push qua GitHub API | Game hoàn chỉnh ước 3.000–5.000 dòng / 150–300KB — dễ vỡ (10.4) | Mỗi file <50KB, an toàn |
| Review/debug | Diff không đọc được | Lỗi khoanh theo module |
| Build tool | Không | **Cũng không** — ES Modules native + importmap |

```
index.html                  # vỏ: container, HUD DOM, importmap, <script type="module" src="src/main.js">
assets/README.md            # ghi nguồn asset; KHÔNG commit binary nặng
src/
  main.js                   # ENTRY DUY NHẤT: khởi tạo + vòng lặp game
  core/
    config.js               # CONFIG + WEAPONS + ABILITIES (hằng số, Object.freeze)
    event-bus.js            # EventBus trung tâm
    state.js                # matchState + createMatchState() + resetRoundState()
    game.js                 # Orchestrator: state machine + tick(dt)
  world/
    map.js                  # buildMap(scene) -> { colliders, spawnATK, spawnDEF, siteA, siteB, navPoints }
  systems/
    player.js               # PlayerController (người thật)
    bot.js                  # BotController (trả InputState — Phần 5)
    weapon.js               # WeaponSystem (hitscan, recoil, ammo)
    ability.js              # AbilitySystem (Q/E/X, cooldown, charge, điểm ult)
    bomb.js                 # BombSystem (plant/defuse/explode)
    combat.js               # takeDamage()/heal() — nơi DUY NHẤT trừ HP
  ui/
    hud.js                  # HUD + killfeed + hitmarker + crosshair (Phần 8) — chỉ ĐỌC state + NGHE event
    minimap.js              # Minimap canvas (Phần 8.3)
    menus.js                # Buy menu + operator select (Phần 8.5, 8.7)
  audio/
    audio.js                # AudioSystem (Phần 8.1) — fire-and-forget, lỗi audio không sập game
```

Quy ước bắt buộc: importmap ghim `three@0.160.0` (jsDelivr) — mọi module import từ `'three'`, **cấm** import URL CDN trực tiếp trong `src/`. Chạy qua HTTP server (ES Modules bị chặn CORS trên `file://`). Đơn vị: mét, giây, HP 0–100, góc = radian. Tên file kebab-case; hàm/biến camelCase; hằng số SCREAMING_SNAKE; event kebab-case. Mỗi file 1 nhóm sở hữu; file dùng chung (`main.js`, `game.js`, `state.js`, `config.js`) chỉ người tích hợp sửa.

### 10.2. State machine của trận

```
menu ──startMatch()──▶ operatorSelect ──confirm / hết 20s auto-pick──▶ buy ──hết 15s──▶ live
live ──bomb-planted──▶ planted ──nổ/defuse/DEF bị diệt hết──▶ roundEnd
live ──diệt hết 1 đội / hết giờ──▶ roundEnd
planted ──ATK bị diệt hết──▶ (VẪN Ở planted — chờ nổ hoặc defuse, xem 3.6)
roundEnd ──hết 7s──▶ buy (round sau; round 13 đổi bên)  hoặc  matchEnd (đạt 13 round / hết round 24)
matchEnd ──quitToMenu()──▶ menu
```

`pause` không phải phase — là cờ `matchState.paused` phủ lên `live/planted`. Sống/chết là trạng thái từng actor (`actor.alive`).

| Từ → Sang | Guard | Side-effect |
|---|---|---|
| `menu → operatorSelect` | `Game.startMatch()` | Reset tỉ số 0–0, `roundNumber=1`, tiền 800 |
| `operatorSelect → buy` | Xác nhận hoặc `phaseTimer ≤ 0` (20s) → auto-pick mặc định | Khoá operator, spawn 2 đội |
| `buy → live` | `phaseTimer ≤ 0` (15s) | Mở freeze, `roundTimer = 115` |
| `live → planted` | Event `bomb-planted` | Dừng roundTimer, `bombTimer = 40` |
| `live → roundEnd` | 1 đội bị diệt hết, hoặc `roundTimer ≤ 0` (DEF thắng) | Cộng điểm + tiền |
| `planted → roundEnd` | `bomb-exploded` (ATK) / `bomb-defused` (DEF) / DEF bị diệt hết (ATK) | Cộng điểm + tiền |
| `roundEnd → buy` | `phaseTimer ≤ 0` (**7s**, đã chuẩn hoá) và chưa thắng trận | `roundNumber++`; ==13 → đổi bên; reset vị trí/HP/bomb, **giữ** tiền + tỉ số |
| `roundEnd → matchEnd` | 1 đội đạt **13** round hoặc hết round 24 | Exit pointer lock, màn hình kết quả |
| `matchEnd → menu` | `Game.quitToMenu()` | Dọn scene về menu |

**Quy tắc vàng:** chỉ `game.js` được gọi `transitionTo(phase)`; hệ thống khác chỉ phát event. Chuyển sai guard → `console.warn` + bỏ qua, không throw.

`matchState` (định nghĩa duy nhất tại `core/state.js`):

```js
matchState = {
  phase: 'menu',           // 'menu'|'operatorSelect'|'buy'|'live'|'planted'|'roundEnd'|'matchEnd'
  paused: false,
  phaseTimer: 0,           // giây còn lại của phase (operatorSelect/buy/roundEnd)
  roundTimer: 115,         // chỉ chạy ở 'live'  (ĐÃ CHUẨN HOÁ — bản nháp ghi 100)
  bombTimer: 40,           // chỉ chạy ở 'planted'
  roundNumber: 1, half: 1, // half=2 từ round 13
  score: { ATK: 0, DEF: 0 },
  roundWinner: null,       // 'ATK'|'DEF'|null
  roundEndReason: null,    // 'elimination'|'detonation'|'defuse'|'time'
  winner: null,            // 'ATK'|'DEF'|'DRAW'|null — chỉ ở matchEnd
  bomb: { status: 'carried', carrierId: 'P1', site: null, position: null, planterId: null },
                           // status: 'carried'|'planting'|'planted'|'defusing'|'exploded'|'defused'
  actors: {},              // { [actorId]: ActorState }
  killFeed: [],            // tối đa 5 entry { killerId, victimId, weaponId, headshot, t }
  time: 0,                 // tổng giây của trận, từ clock trung tâm
}
// ActorState = { id, team:'ATK'|'DEF', isBot, operatorId, hp:100, armor:0, alive:true,
//   money:800, weaponId, ammoInMag, ammoReserve, kills, deaths, assists,
//   position:Vector3, abilities:{ Q:{charges,cooldownUntil}, E:{...}, X:{points} } }
```

Quyền ghi state: mọi module **đọc** tự do, chỉ **ghi** trường mình sở hữu — `combat.js` ghi `hp/alive/kills/deaths`; `bomb.js` ghi `bomb.*`; `game.js` ghi `phase/score/timer`. Ngoài ra phải qua event/API ở 10.3. Hằng số ở `CONFIG` (Phụ lục A).

**Thứ tự tick cố định** trong `game.tick(dt)`: `1. input → 2. phase/round/bomb timer → 3. Player.update → 4. Bot.update → 5. Weapon → 6. Ability → 7. Bomb.update → 8. kiểm tra win-condition/transitionTo → 9. HUD.update(snapshot) + render`.

### 10.3. API giữa các hệ thống (hợp đồng bắt buộc)

Nguyên tắc: chiều gọi `Game → Systems → Combat/EventBus → HUD/Audio`; HUD/Audio **không bao giờ** gọi ngược vào gameplay. Mọi hàm gameplay nhận `dt`/`now` (= `matchState.time`) từ ngoài truyền vào — cấm tự `Date.now()`/tự tạo `THREE.Clock`.

**EventBus** (`core/event-bus.js`): `bus.on(event, handler) → unsubscribe`, `bus.emit(event, payload)` (đồng bộ; handler lỗi thì catch + log, không sập game), `bus.off(event, handler)`.

| Event | Payload | Phát bởi | Nghe bởi |
|---|---|---|---|
| `damage` | `{targetId, sourceId, amount, hpLeft, hitPart, weaponId}` | combat | HUD (hitmarker), Audio |
| `kill` | `{killerId, victimId, weaponId, headshot, isAbility}` | combat | Game (win-check), HUD (killfeed), Audio |
| `shot-fired` | `{shooterId, weaponId, position, direction}` | weapon | Audio, Bot (nghe tiếng súng) |
| `ability-cast` | `{casterId, slot, abilityId, position}` | ability | HUD (cooldown), Audio |
| `bomb-planting`/`bomb-planted` | `{playerId, site, position}` | bomb | Game (→ `planted`), HUD, Audio |
| `bomb-defusing`/`bomb-defused`/`bomb-exploded` | `{playerId?, site}` | bomb | Game, HUD, Audio |
| `phase-changed` | `{from, to, roundNumber}` | game | HUD, Audio, Bot (reset hành vi) |
| `money-changed` | `{actorId, money}` | game/combat | HUD (buy menu) |

**Chữ ký hàm theo module:**

```js
// player.js — Bot dùng chung interface Actor này
createPlayer(scene, spawnPos, operatorId): Actor
player.update(dt, input, colliders): void
player.getEyePosition(): Vector3;  player.getAimDirection(): Vector3
player.applyKnockback(dir, force): void
// InputState = { move:{x,z}, look:{yaw,pitch}, jump, crouch, fire, reload, interact,
//                abilitySlot: null|'Q'|'E'|'X', buyId?: string }

// combat.js — NƠI DUY NHẤT trừ HP / xử lý chết
takeDamage(targetId, amount, { sourceId, hitPart, weaponId, isAbility }):
  { applied, hpLeft, killed }
// Tự tính: hệ số vùng + headMult tra từ CONFIG.WEAPONS (đầu ×4,0 cho súng Phần 6 — ĐÃ CHUẨN HOÁ,
// bản nháp ghi ×2,0 là sai), giáp hấp thụ 50% khi còn giáp; phát 'damage' và (khi chết) 'kill'.
heal(targetId, amount, sourceId): number   // HP sau hồi, kẹp ≤100

// weapon.js
createWeaponSystem(scene, bus): WeaponSystem
weapon.equip(actorId, weaponId): void      // weaponId tra CONFIG.WEAPONS
weapon.tryFire(actorId, origin, direction):
  { fired, reason?, hitActorId?, hitPoint?, headshot? }
  // reason: 'cooldown'|'empty'|'reloading'|'wrong-phase'. Tự raycast AABB (Phần 9),
  // trúng thì gọi combat.takeDamage() — KHÔNG tự trừ HP. Chỉ bắn khi phase ∈ {live, planted}.
weapon.startReload(actorId): void
weapon.update(dt): void                    // hết reload, tracer mờ dần (pool Phần 9)
// CONFIG.WEAPONS[id] = { damage, headMult, fireRate, magSize, reserve, reloadTime,
//                         range, price, automatic }  — số liệu Phần 6

// ability.js
castAbility(casterId, slot /*'Q'|'E'|'X'*/, { origin, direction, scene, colliders }):
  { ok, reason?, cooldownLeft? }
  // reason: 'cooldown'|'no-charge'|'no-points'|'wrong-phase'. Kiểm tra CD/charge/điểm TRƯỚC khi tạo effect.
  // Điểm X cần = CONFIG.ABILITIES[operatorId].ultPoints (6 hoặc 7 — Phần 4).
ability.addUltPoint(actorId, n = 1): void  // game/combat gọi khi kill/plant/defuse/orb theo bảng điểm Phần 4
ability.update(dt): void                   // effect theo thời gian; trừ HP chỉ qua combat.takeDamage()
ability.resetRound(actorId): void          // hồi charge Q/E, GIỮ điểm X trừ khi đã dùng

// bomb.js — plant/defuse là hành động GIỮ phím E
bomb.startPlant(actorId): { ok, reason? }  // 'not-in-site'|'no-bomb'|'wrong-phase'|'moving'
bomb.startDefuse(actorId): { ok, reason? } // 'no-bomb-planted'|'too-far'|'wrong-team'
bomb.cancelAction(actorId): void           // nhả phím/di chuyển → huỷ, progress về 0
bomb.update(dt): void                      // đếm progress; đủ giờ → emit 'bomb-planted'/'bomb-defused'
bomb.explode(): void                       // game gọi khi bombTimer hết; emit + damage vùng qua combat
bomb.getProgress(): { action:'plant'|'defuse'|null, ratio } | null   // cho HUD
bomb.resetRound(carrierId): void

// bot.js — Bot KHÔNG tự di chuyển/bắn; trả InputState như người chơi
createBot(scene, spawnPos, operatorId, team, difficulty /*'easy'|'normal'|'hard'*/): Actor & BotController
bot.update(dt, perception /*{visibleEnemies, heardShots, bombState, phase, navPoints}*/): InputState
bot.resetRound(spawnPos): void

// hud.js / minimap.js / menus.js — chỉ đọc
hud.init(rootEl, bus): void
hud.update(stateSnapshot): void
hud.showKillFeed(entry): void              // tự ẩn sau 5s (Phần 8.4)
hud.showPhaseBanner(text, sub?): void
hud.setBuyMenuOpen(open, money, items): void
hud.showDamageDirection(fromAngle): void

// audio.js — fire-and-forget, mọi lỗi nuốt vào try/catch
audio.init(): void                         // gọi sau click đầu tiên
audio.play(name /*'shot'|'hit'|'kill'|'plant-beep'|'defuse'|'explode'|'buy'|'ability'|'round-win'|'round-lose'*/,
           opts?: { volume?, position? }): void   // thông số synth ở Phần 8.1
audio.setMuted(muted): void

// game.js — orchestrator
game.init(canvasContainer): Promise<void>
game.startMatch(): void
game.transitionTo(nextPhase): boolean      // false nếu guard không cho phép
game.onRoundWin(winnerTeam, reason): void
game.quitToMenu(): void
game.tick(dt): void                        // main.js gọi mỗi frame
```

**Ma trận quyền gọi:** Player/Bot → Weapon ✅, Ability ✅, Bomb (start/cancel) ✅, Combat ❌ (chỉ qua Weapon/Ability), HUD/Audio ❌. Weapon/Ability/Bomb → Combat ✅, còn lại chỉ qua event. Game → mọi hệ thống (reset/equip/điểm). HUD/Audio → không gọi ai.

### 10.4. Kế hoạch tích hợp & push lên `muse/fps-abilities-v1`

- Mọi push qua GitHub MCP: ưu tiên `push_files` (nhiều file = 1 commit); `create_or_update_file` khi sửa lẻ. Luôn chỉ định `branch: "muse/fps-abilities-v1"`; nhánh chưa có → `create_branch` từ `main` 1 lần duy nhất. **Mỗi push = 1 bước tích hợp chạy được**, không push code lỗi console; sau push đọc lại bằng `get_file_contents` để xác nhận.
- Commit message: `feat(step-N): …` / `fix: …` / `chore: …`.

| Bước | Push | Nghiệm thu bước |
|---|---|---|
| 0 | *(không push)* `create_branch` từ `main` nếu thiếu | Nhánh tồn tại, `main` không đổi |
| 1 — Skeleton | `index.html`, `src/main.js`, `src/core/config.js`, `src/core/event-bus.js` | Scene Three.js trống + nền, 0 lỗi console, importmap đúng version |
| 2 — State | `src/core/state.js`, `src/core/game.js` | State machine chạy bằng timer giả đúng thứ tự `menu→operatorSelect→buy→live→roundEnd→buy…` |
| 3 — Map | `src/world/map.js` | Map Phần 7 dựng xong, export đúng `{colliders, spawnATK, spawnDEF, siteA, siteB, navPoints}` (navPoints = bảng 5.1b) |
| 4 — Player + Weapon | `src/systems/player.js`, `src/systems/combat.js`, `src/systems/weapon.js` | Đi/chạy/nhảy/bắn được ở `live`; bắn dummy → HP giảm qua `takeDamage`; hết đạn reload được |
| 5 — HUD + Audio | `src/ui/hud.js`, `src/ui/minimap.js`, `src/ui/menus.js`, `src/audio/audio.js`, sửa nhỏ `index.html` | HP/ammo/timer/killfeed theo event; có tiếng bắn/hit |
| 6 — Bomb | `src/systems/bomb.js` + nối dây `game.js` | Plant 3,2s tại site → `planted`; defuse/nổ → `roundEnd` đúng đội thắng |
| 7 — Bot | `src/systems/bot.js` | 5v5 (1 người + 9 bot), bot đi navPoints, bắn, plant/defuse cơ bản |
| 8 — Ability | `src/systems/ability.js` + data trong `config.js` | 8 operator: Q/E/X chạy, điểm ult đúng Phần 4, cooldown hiện trên HUD |
| 9 — Hoàn thiện trận | `game.js`, `state.js`, `hud.js` | Trọn trận: đổi bên round 13, thắng ở 13, `matchEnd`, chơi lại về `menu` |
| 10 — Vá lỗi | Từng file bằng `create_or_update_file`, 1 lỗi/push | 3 round liên tục không lỗi console, không kẹt phase |

Người tích hợp là người duy nhất sửa `main.js`/`game.js` khi nối dây; nhóm khác nộp module đúng hợp đồng 10.3.

**Giới hạn file khi push (bắt buộc):** GitHub Contents API không đáng tin với file >~1MB và nội dung phình ~33% qua base64/JSON. Vì vậy: `index.html` < 300 dòng/< 15KB; mỗi `src/*.js` < 800 dòng/< 40KB (vượt thì tách tiếp, VD `ability.js` + `ability-effects.js`); mỗi lần `push_files` tối đa **4 file, tổng < 400KB text**; không push binary nặng. Push timeout/không rõ kết quả → **đọc lại file trước khi push lại**, tránh ghi đè bản đã lên hoặc commit trùng.

### 10.5. Rủi ro tích hợp (8) & giảm thiểu

| # | Rủi ro | Cách tránh bắt buộc |
|---|---|---|
| 1 | Nhiều vòng lặp render (mỗi module tự `requestAnimationFrame`) → game chạy nhanh nhiều lần, timer lệch | Chỉ `main.js` có 1 vòng lặp; module chỉ export `update(dt)`; cấm `setInterval` cho gameplay |
| 2 | Nhiều clock (`new THREE.Clock()` khắp nơi, `Date.now()`) → cooldown/timer không khớp | 1 Clock ở `main.js`; `dt` + `matchState.time` truyền xuống qua `game.tick(dt)` |
| 3 | Thứ tự khởi tạo sai → lỗi `undefined` lúc load | Init cố định: `CONFIG → EventBus → matchState → Scene/Map → Actors → Systems → HUD → Audio → vòng lặp`. Module chỉ chạy code trong `init()`, không chạy top-level |
| 4 | Import vòng (circular) | Phụ thuộc 1 chiều theo 10.3; gọi ngược qua EventBus hoặc callback truyền qua `init(deps)`; dữ liệu chung ở `state.js`/`config.js` |
| 5 | Nhiều nơi cùng sửa state (HUD trừ HP, Weapon tự set `alive=false`) | Quyền ghi ở 10.2; HP/chết chỉ qua `combat.takeDamage()`; phase chỉ qua `game.transitionTo()` |
| 6 | Trùng listener input/pointer lock (click buy menu thành phát súng) | Input gom 1 chỗ ở `player.js` → `InputState`; HUD dùng DOM event riêng + `stopPropagation`; `tryFire` chỉ chạy khi phase ∈ {live, planted} và pointer đang locked |
| 7 | File "nóng" (`index.html`, `main.js`, `game.js`, `config.js`) bị nhiều người sửa → push sau ghi mất code push trước | Chỉ người tích hợp sửa; nhóm khác cần hằng số/event mới thì báo gộp vào 1 push chung; trước mỗi push đọc lại bản trên nhánh |
| 8 | CDN/version Three.js lệch → 2 renderer, `instanceof` sai | Ghim 1 version ở importmap; cấm URL CDN trong `src/`; CDN chết → trang hiện thông báo lỗi rõ |

Checklist trước khi báo "ghép xong": mở bằng HTTP server → console 0 lỗi → chơi được `menu → operatorSelect → buy → live → planted → roundEnd` ít nhất 2 round liên tiếp → F5 vẫn chạy → không file nào trong lần push vượt giới hạn 10.4.

---

## Phụ lục A — CONFIG tổng hợp

Dán vào `src/core/config.js` (đã gồm mọi chuẩn hoá ở Phần 0). Chi tiết vũ khí: Phần 6 · operator: Phần 4 · timing map: Phần 7.4.

```js
export const CONFIG = Object.freeze({
  // Trận & round (Phần 3)
  MAX_ROUNDS: 24, ROUNDS_TO_WIN: 13, HALFTIME_AFTER: 12,
  TIME_OPERATOR_SELECT: 20, TIME_BUY: 15, BUY_TIME_IN_LIVE: 20,
  TIME_ROUND: 115, TIME_ROUND_END: 7,
  // Bomb (Phần 3.5)
  TIME_PLANT: 3.2, TIME_DEFUSE_KIT: 5, TIME_DEFUSE_NO_KIT: 10, TIME_BOMB: 40,
  BOMB_LETHAL_RADIUS: 12, BOMB_DAMAGE_RADIUS: 22,
  // Economy (Phần 3.3–3.4)
  START_MONEY: 800, MAX_MONEY: 16000, OT_START_MONEY: 10000,
  WIN_ELIMINATION: 3250, WIN_BOMB: 3500, WIN_TIME: 3250,
  PLANT_BONUS_PERSONAL: 300, PLANT_BONUS_TEAM_ON_LOSS: 800, DEFUSE_BONUS_PERSONAL: 250,
  LOSS_BONUS: [1400, 1900, 2400, 2900, 3400],
  KILL_REWARD: { rifle: 300, pistol: 300, smg: 600, shotgun: 900, sniper: 100, knife: 1500 },
  ARMOR_BODY: 650, ARMOR_HELMET: 1000, DEFUSE_KIT: 400, ABILITY_CHARGE_PRICE: 200,
  // Di chuyển & vật lý (Phần 0, 1)
  SPEED_MAX: 5.5, SPEED_WALK: 2.5, SPEED_CROUCH: 1.7,   // nhân thêm hệ số vũ khí (Phần 6.1)
  GRAVITY: 22, JUMP_VELOCITY: 5.2, GROUND_FRICTION: 10,
  PLAYER_HEIGHT: 1.8, PLAYER_WIDTH: 0.7, EYE_HEIGHT: 1.62, CROUCH_HEIGHT: 1.35,
  MOUSE_SENS: 0.0022, FOV: 75,
  DT_CLAMP: 0.05, FIXED_STEP: 1 / 60,
  // Ultimate points (Phần 4.1)
  ULT_POINT: { kill: 1, assist: 1, plant: 2, defuse: 2, orb: 1, roundStart: 1 },
  ORBS_PER_ROUND: 2,
  // Map (Phần 7)
  MAP_BOUNDS: { minX: -42, maxX: 42, minZ: -30, maxZ: 30 },
  SPAWN_ATK: { x: 0, z: 24 }, SPAWN_DEF: { x: 0, z: -24 },
  SITE_A: { minX: -34, maxX: -20, minZ: -24, maxZ: -14 },
  SITE_B: { minX: 20, maxX: 34, minZ: -24, maxZ: -14 },
});
// CONFIG.WEAPONS[weaponId] — số liệu đầy đủ ở bảng 6.1/6.2/6.4:
//   { damage, headMult: 4.0, stomachMult: 1.25, legMult: 0.75, fireRate, magSize,
//     reserve, reloadTime, reloadEmptyTime, range (R0), falloffFactor, price,
//     killReward, speedFactor, automatic }
// CONFIG.ABILITIES[operatorId] — số liệu đầy đủ ở Phần 4.2:
//   { Q: { cooldown, charges?, ... }, E: { cooldown, charges?, ... },
//     X: { ultPoints /* 6|7 */, ... }, passive: { ... } }
```

## Phụ lục B — Bảng nguồn & license tổng hợp

| Nguồn | URL | License | Dùng cho |
|---|---|---|---|
| Three.js | https://github.com/mrdoob/three.js/ | MIT | Engine v1 |
| Pointer Lock API (MDN) | https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API | Tài liệu web chuẩn | Điều khiển FPS |
| Babylon.js | https://github.com/BabylonJS | Apache-2.0 | Phương án B (không dùng ở v1) |
| Godot | https://github.com/godotengine/godot | MIT | Đã loại cho v1 (Phần 1.1) |
| cannon-es | https://github.com/pmndrs/cannon-es | MIT | Không dùng ở v1 (AABB tự viết thay thế) |
| three-fps (tham khảo) | https://github.com/mohsenheydari/three-fps | MIT (asset mẫu có license riêng) | Chỉ học kiến trúc |
| Riposte Frontline (tham khảo) | https://github.com/BenDBSS/Riposte-Frontline-Source | MIT trừ NOTICE.md | Chỉ tham khảo tổ chức code |
| Kenney | https://kenney.nl/assets/blaster-kit | CC0 1.0 | Viewmodel súng, prop (v1) |
| Quaternius | https://quaternius.com/ | CC0 1.0 đa số pack — kiểm tra `LICENSE.txt` từng pack | Character/weapon (sau v1) |
| Poly Pizza | https://poly.pizza/docs/api/v1.1 | Theo model: CC0 / CC-BY | Prop lẻ low-poly (lọc CC0) |
| Mixamo | https://www.mixamo.com | Royalty-free Adobe (chỉ nhúng trong game, không phân phối lại file gốc) | Animation (sau v1) |
| Sketchfab | https://help.sketchfab.com/en/articles/16152217-downloading-3d-models | Theo model — chỉ CC0 (nới CC-BY + credit) | Hero asset lẻ (sau v1) |
| OpenGameArt | https://opengameart.org/content/faq | Theo file — chỉ CC0/CC-BY/OGA-BY | Prop/texture lẻ |
| ambientCG | https://docs.ambientcg.com/license/ | CC0 1.0 | Texture PBR cho map (v1) |

> **Nguyên tắc IP xuyên suốt:** mọi mã nguồn tham khảo đều có license cho phép (MIT/Apache-2.0) và chỉ dùng ở mức học kiến trúc/API — ProjectG tự viết code, tự dựng map "Neon Divide", tự đặt tên vũ khí/operator. Không có asset, map, tên riêng hay số liệu "đặc quyền" nào của CSGO/Valve được sao chép; các con số gameplay trong tài liệu là thông số thiết kế đề xuất ở mức phổ biến của thể loại tactical shooter, đã được điều chỉnh cho ProjectG.

*— Hết tài liệu. Bước tiếp theo (do agent chính thực hiện): tạo nhánh `muse/fps-abilities-v1` và code theo thứ tự tích hợp ở mục 10.4. —*
