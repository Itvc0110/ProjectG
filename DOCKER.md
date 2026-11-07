# Chơi ProjectG bằng Docker

Bản game trong thư mục này là một file `index.html` duy nhất (Three.js nạp từ CDN),
được đóng gói sẵn bằng Docker để chơi ngay trên máy của bạn trong lúc bản mới vẫn đang được phát triển.

## Yêu cầu

- Docker Desktop (Windows/macOS) hoặc Docker Engine + Docker Compose (Linux)
- Kết nối Internet khi chơi (để trình duyệt tải Three.js từ CDN)

## Chạy game

Tại thư mục gốc của repo (nơi có `docker-compose.yml`):

```bash
docker compose up -d --build
```

Mở trình duyệt tại **http://localhost:8080**

## Cập nhật bản mới nhất trên nhánh dev

```bash
git pull
docker compose up -d --build
```

Trang game được cấu hình không cache, nên chỉ cần tải lại trang (F5) sau khi build xong.

## Dừng game

```bash
docker compose down
```

## Ghi chú

- Container chỉ phục vụ file tĩnh bằng nginx (cổng 80 trong container, ánh xạ ra 8080 trên máy bạn).
- Kiểm tra sức khoẻ: `docker compose ps` — trạng thái `healthy` nghĩa là game đã sẵn sàng.
- Xem log khi cần: `docker compose logs -f game`.
