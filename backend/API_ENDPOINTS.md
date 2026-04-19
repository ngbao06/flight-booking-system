# Danh Sach API Endpoints

## Quy uoc mount route
Tat ca route duoc mount theo dang:

- /api/{module}

Vi du module airlines se co prefix /api/airlines.

## 1) Airlines (/api/airlines)

- GET /api/airlines
Muc dich: Lay danh sach hang bay (co the loc theo query id, code, name).
Request body: Khong co.

- GET /api/airlines/:id
Muc dich: Lay chi tiet 1 hang bay theo id.
Request body: Khong co.

- POST /api/airlines
Muc dich: Tao hang bay moi.
Request body vi du:
{
  "code": "VNA",
  "name": "Vietnam Airlines"
}

- PATCH /api/airlines/:id
Muc dich: Cap nhat thong tin hang bay.
Request body vi du:
{
  "name": "Vietnam Airlines New"
}

- DELETE /api/airlines/:id
Muc dich: Xoa hang bay.
Request body: Khong co.

## 2) Airports (/api/airports)

- GET /api/airports
Muc dich: Lay danh sach san bay (loc theo id, iataCode, name, city, region, status).
Request body: Khong co.

- GET /api/airports/:id
Muc dich: Lay chi tiet 1 san bay.
Request body: Khong co.

- POST /api/airports
Muc dich: Tao san bay moi.
Request body vi du:
{
  "iataCode": "SGN",
  "name": "Tan Son Nhat",
  "city": "Ho Chi Minh",
  "region": "South"
}

- PATCH /api/airports/:id/lock
Muc dich: Khoa san bay.
Request body: Khong co.

- PATCH /api/airports/:id/unlock
Muc dich: Mo khoa san bay.
Request body: Khong co.

- PATCH /api/airports/:id
Muc dich: Cap nhat thong tin san bay.
Request body vi du:
{
  "name": "Noi Bai International",
  "city": "Ha Noi"
}

- DELETE /api/airports/:id
Muc dich: Xoa san bay.
Request body: Khong co.

## 3) Auth (/api/auth)

- POST /api/auth/register
Muc dich: Dang ky tai khoan.
Request body vi du:
(username, password, role là bắt buộc)
{
  "username": "alice01",
  "password": "secret123",
  "role": "PASSENGER",
  "full_name": "Alice Nguyen",
  "email": "alice@example.com",
  "phone": "0909000000",
  "address": "HCM",
  "passport_number": "P12345678",
  "passport_expiry_date": "2030-12-31",
  "passport_nationality": "VN",
  "meal": "Standard",
  "seat_position": "window"
}

- POST /api/auth/login
Muc dich: Dang nhap.
Request body vi du:
{
  "username": "alice01",
  "password": "secret123"
}

- POST /api/auth/logout
Muc dich: Dang xuat (yeu cau dang nhap).
Request body: Khong co.

- GET /api/auth/me
Muc dich: Lay thong tin nguoi dung dang dang nhap.
Request body: Khong co.

- PATCH /api/auth/password
Muc dich: Doi mat khau (yeu cau dang nhap).
Request body vi du:
{
  "old_password": "secret123",
  "new_password": "secret456"
}

- POST /api/auth/password/reset-request
Muc dich: Tao yeu cau reset mat khau.
Request body vi du (1 trong 2):
{
  "username": "alice01"
}
Hoac:
{
  "email": "alice@example.com"
}

- POST /api/auth/password/reset-confirm
Muc dich: Xac nhan reset mat khau.
Request body vi du:
{
  "token": "reset_token_value",
  "new_password": "secret999"
}

- PATCH /api/auth/profile
Muc dich: Cap nhat ho so nguoi dung (yeu cau dang nhap).
Request body vi du:
{
  "full_name": "Alice N.",
  "phone": "0911222333",
  "address": "Ha Noi"
}

## 4) Booking (/api/bookings)

- GET /api/bookings
Muc dich: Lay danh sach booking (loc theo id, flightId, bookingDate, fromAmount, toAmount, status).
Request body: Khong co.

- GET /api/bookings/:id
Muc dich: Lay chi tiet booking.
Request body: Khong co.

- POST /api/bookings
Muc dich: Tao booking va khoi dong saga dat ve.
Luu y: body thuc te nen gui du truong de qua validate va business check.
Request body vi du:
{
  "flightId": 10,
  "bookingDate": "2026-04-19T10:00:00.000Z",
  "totalAmount": 2500000,
  "status": "PENDING",
  "userId": 1001
}

- PATCH /api/bookings/:id
Muc dich: Cap nhat booking (hien tai chu yeu status).
Request body vi du:
{
  "status": "CONFIRMED"
}

- POST /api/bookings/:id/select-seats
Muc dich: Chon ghe cho booking (buoc saga).
Request body vi du:
{
  "seatIds": [101, 102]
}

- POST /api/bookings/:id/apply-loyalty
Muc dich: Ap dung doi diem loyalty vao booking (buoc saga).
Request body vi du:
{
  "passengerId": 1001,
  "pointsToExchange": 500
}

- POST /api/bookings/:id/payment-completed
Muc dich: Bao thanh toan thanh cong (buoc saga).
Request body vi du:
{
  "paymentId": 2001,
  "transactionId": "TXN-20260419-001",
  "amount": 2000000,
  "paymentMethod": "CARD"
}

- POST /api/bookings/:id/payment-failed
Muc dich: Bao thanh toan that bai de kich hoat rollback saga.
Request body vi du:
{
  "paymentId": 2001,
  "reason": "Card declined"
}

- GET /api/bookings/:id/saga-status
Muc dich: Lay trang thai saga cua booking.
Request body: Khong co.

- GET /api/bookings/admin/active-sagas
Muc dich: Lay danh sach saga dang hoat dong.
Request body: Khong co.

## 5) Flights (/api/flights)

- GET /api/flights
Muc dich: Lay danh sach chuyen bay (co bo loc query).
Request body: Khong co.

- GET /api/flights/:id
Muc dich: Lay chi tiet chuyen bay.
Request body: Khong co.

- POST /api/flights
Muc dich: Tao chuyen bay moi.
Request body vi du:
{
  "flightNumber": "VN123",
  "planeId": 3,
  "airlineId": 1,
  "departureAirportId": 1,
  "arrivalAirportId": 2,
  "distance": 1150,
  "departureTime": "2026-05-01T08:00:00.000Z",
  "arrivalTime": "2026-05-01T10:00:00.000Z",
  "status": "WAITING"
}

- PATCH /api/flights/:id
Muc dich: Cap nhat thong tin chuyen bay.
Request body vi du:
{
  "status": "DELAYED",
  "reason": "Bad weather"
}

- DELETE /api/flights/:id
Muc dich: Xoa chuyen bay.
Request body: Khong co.

## 6) Loyalty (/api/loyalty)

- POST /api/loyalty/exchange
Muc dich: Doi diem loyalty.
Request body vi du:
{
  "passengerId": 1001,
  "amount": 300
}

## 7) Payments (/api/payments)

- GET /api/payments
Muc dich: Lay danh sach giao dich thanh toan (co bo loc query).
Request body: Khong co.

- GET /api/payments/:id
Muc dich: Lay chi tiet payment.
Request body: Khong co.

- POST /api/payments
Muc dich: Tao giao dich thanh toan.
Request body vi du:
{
  "bookingId": 99,
  "transactionId": "TXN-20260419-888",
  "amount": 1500000,
  "paymentMethod": "CARD",
  "status": "PENDING"
}

- PATCH /api/payments/:id
Muc dich: Cap nhat payment.
Request body vi du:
{
  "status": "COMPLETED"
}

## 8) Planes (/api/planes)

- GET /api/planes
Muc dich: Lay danh sach may bay.
Request body: Khong co.

- GET /api/planes/:id
Muc dich: Lay chi tiet may bay.
Request body: Khong co.

- POST /api/planes
Muc dich: Tao may bay moi.
Request body vi du:
{
  "airlineId": 1,
  "model": "Airbus A321",
  "totalSeats": 220,
  "status": "ACTIVE"
}

- PATCH /api/planes/:id
Muc dich: Cap nhat thong tin may bay.
Request body vi du:
{
  "model": "Boeing 787-9",
  "status": "ACTIVE"
}

- DELETE /api/planes/:id
Muc dich: Xoa may bay.
Request body: Khong co.

## 9) Seats (/api/seats)

- GET /api/seats
Muc dich: Lay danh sach ghe (loc theo flightId, seatNumber, fromPrice, toPrice, class, status).
Request body: Khong co.

- POST /api/seats
Muc dich: Tao ghe cho chuyen bay (tu dong theo proc).
Request body vi du:
{
  "flightId": 10,
  "basePrice": 1200000
}

- PATCH /api/seats/:id
Muc dich: Cap nhat ghe.
Request body vi du:
{
  "status": "RESERVED",
  "price": 1300000
}

## 10) Tickets (/api/tickets)

- GET /api/tickets
Muc dich: Lay danh sach ve (co bo loc query).
Request body: Khong co.

- GET /api/tickets/:id
Muc dich: Lay chi tiet ve.
Request body: Khong co.

- POST /api/tickets
Muc dich: Tao ve moi.
Request body vi du:
{
  "ticketNumber": "TKT-0001",
  "bookingId": 99,
  "seatId": 101,
  "buyerId": 1001,
  "passengerLastname": "Nguyen",
  "passengerFirstname": "An",
  "passengerIdCard": "079123456789",
  "issueDate": "2026-04-19T10:30:00.000Z",
  "finalPrice": 1500000,
  "status": "ISSUED"
}

- PATCH /api/tickets/:id
Muc dich: Cap nhat thong tin ve.
Request body vi du:
{
  "status": "CANCELLED"
}

## 11) Users (/api/users)

- GET /api/users
Muc dich: Lay danh sach user (loc theo id, username, role).
Request body: Khong co.

- GET /api/users/:id
Muc dich: Lay chi tiet user.
Request body: Khong co.

- POST /api/users
Muc dich: Tao user moi.
Request body vi du:
{
  "username": "newuser01",
  "password": "secret123",
  "role": "PASSENGER",
  "full_name": "Le Thi B",
  "email": "b@example.com",
  "phone": "0909111222",
  "address": "Da Nang",
  "passport_number": "P99887766",
  "expire_date": "2031-01-01",
  "nationality": "VN",
  "meal": "Standard",
  "seat_position": "none"
}

- PATCH /api/users/:id
Muc dich: Cap nhat user.
Request body vi du:
{
  "phone": "0909333444",
  "address": "Can Tho"
}

- DELETE /api/users/:id
Muc dich: Xoa user.
Request body: Khong co.