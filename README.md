# Flight Booking System

Đây là đồ án hệ thống đặt vé máy bay gồm đầy đủ 3 lớp: cơ sở dữ liệu, backend API và frontend web. Dự án mô phỏng quy trình đặt vé từ tra cứu chuyến bay, chọn ghế, thanh toán, quản lý booking, cho đến trang quản trị và các chức năng dành cho hành khách.

## Tổng Quan

Hệ thống được thiết kế để chạy hoàn toàn bằng Docker Compose, nên chỉ cần một lệnh là có thể dựng toàn bộ môi trường.

- MySQL lưu dữ liệu nghiệp vụ chính như chuyến bay, ghế, booking, thanh toán, vé, voucher, người dùng.
- MongoDB lưu các log và dữ liệu phi cấu trúc như admin logs, saga logs, passenger profiles.
- Redis dùng cho cache và một số luồng hỗ trợ của backend.
- Backend là Node.js/Express, cung cấp toàn bộ API cho frontend.
- Frontend là web tĩnh chạy trên Nginx, hiển thị giao diện người dùng và trang quản trị.

## Cấu Trúc Thư Mục

```text
flight-booking-system/
├── docker-compose.yml        # Khởi động toàn bộ hệ thống bằng Docker
├── run.bat                   # Double click để chạy và tự mở frontend
├── README.md                 # Tài liệu dự án
├── backend/
│   ├── Dockerfile            # Image cho backend
│   ├── package.json          # Scripts và dependencies backend
│   ├── src/
│   │   ├── app.js            # Khởi tạo Express app, middleware, routes
│   │   ├── server.js         # Điểm vào để chạy backend
│   │   ├── config/           # Cấu hình MySQL, MongoDB, Redis, payment
│   │   ├── common/           # Middleware, saga, utils dùng chung
│   │   ├── database/         # Kết nối DB và seed dữ liệu mẫu
│   │   └── modules/          # Các module nghiệp vụ: auth, booking, flights...
│   └── tests/                # API tests
└── frontend/
	├── Dockerfile            # Image cho frontend Nginx
	├── index.html            # Điểm vào của SPA
	├── assets/               # CSS, JS, images
	├── components/           # Sidebar, footer, navbar
	└── pages/                # Các trang con: home, booking, admin, auth...
```

## Chức Năng Chính

- Tra cứu chuyến bay theo điểm đi, điểm đến và ngày bay.
- Đặt vé, chọn ghế, chọn hạng ghế và thanh toán.
- Quản lý booking, vé và voucher.
- Đăng ký, đăng nhập, quên mật khẩu.
- Trang admin cho quản lý sân bay, hãng bay, máy bay, chuyến bay, booking, passenger và logs.
- Hệ thống log và saga cho các luồng nghiệp vụ quan trọng.

## Yêu Cầu Cài Đặt

- Windows
- Docker Desktop đã bật
- Trình duyệt web

Không cần cài Node.js, MySQL, MongoDB hay Redis thủ công nếu chạy bằng Docker.

## Cách Chạy Nhanh

1. Mở thư mục gốc của dự án.
2. Double click file [run.bat](run.bat).
3. Chờ hệ thống dựng xong.
4. Trình duyệt sẽ tự mở frontend tại http://localhost:8080.

File `run.bat` sẽ:

- chạy `docker compose up -d`
- đợi frontend sẵn sàng
- tự mở trình duyệt vào frontend

## Chạy Bằng Lệnh

Nếu muốn chạy thủ công trong terminal:

```bash
docker compose up --build -d
start http://localhost:8080
```

## Các Cổng Dịch Vụ

- Frontend: http://localhost:8080
- Backend API: http://localhost:5000
- MySQL: localhost:3307
- MongoDB: localhost:27018
- Redis: localhost:6379

## Tài Khoản Test

### Tài khoản quản trị

- Username: `admin`
- Password: `123456`

### Tài khoản hành khách

- Username: `nguyen_an`
- Password: `123456`

Bạn cũng có thể dùng các tài khoản passenger khác được seed sẵn, ví dụ `tran_binh`, `le_chau`, `pham_duy`... tất cả đều dùng mật khẩu `123456`.

### Tài khoản nhân viên cổng

- Username: `gate_sgn_01`
- Password: `123456`

## Dữ Liệu Mẫu

Khi chạy lần đầu, backend sẽ tự seed dữ liệu mẫu để giáo viên có thể test ngay các luồng chính:

- sân bay
- hãng bay
- máy bay
- chuyến bay
- ghế
- booking
- voucher
- hành khách
- admin logs mẫu

Nếu bạn đã chạy trước đó, script seed sẽ bỏ qua khi phát hiện dữ liệu đã tồn tại.

## Lưu Ý Khi Chạy

- Hãy chắc chắn Docker Desktop đang chạy trước khi double click `run.bat`.
- Nếu cổng `8080`, `5000`, `3307`, `27018`, hoặc `6379` đang bị chiếm, hãy dừng dịch vụ đang dùng cổng đó rồi chạy lại.
- Nếu frontend chưa hiện sidebar/footer, thường là do browser đang dùng cache cũ. Hãy refresh lại trang sau khi container khởi động xong.

## Tắt Hệ Thống

```bash
docker compose down
```

Nếu muốn xóa luôn dữ liệu volume:

```bash
docker compose down -v
```
