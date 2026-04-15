USE flight_booking;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE Tickets;
TRUNCATE TABLE Seats;
TRUNCATE TABLE Payments;
TRUNCATE TABLE Bookings;
TRUNCATE TABLE Flights;
TRUNCATE TABLE Planes;
TRUNCATE TABLE Loyalty;
TRUNCATE TABLE Airlines;
TRUNCATE TABLE Airports;
TRUNCATE TABLE Users;

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO Users (username, password, role) VALUES
('admin_root', 'hashed_pw_admin_001', 'ADMIN'),
('admin_ops', 'hashed_pw_admin_002', 'ADMIN'),
('gate_sgn_01', 'hashed_pw_gate_001', 'GATE_AGENT'),
('gate_sgn_02', 'hashed_pw_gate_002', 'GATE_AGENT'),
('gate_han_01', 'hashed_pw_gate_003', 'GATE_AGENT'),
('gate_dad_01', 'hashed_pw_gate_004', 'GATE_AGENT'),
('gate_cxr_01', 'hashed_pw_gate_005', 'GATE_AGENT'),
('pax_nguyen_an', 'hashed_pw_pax_001', 'PASSENGER'),
('pax_tran_binh', 'hashed_pw_pax_002', 'PASSENGER'),
('pax_le_chau', 'hashed_pw_pax_003', 'PASSENGER'),
('pax_pham_duy', 'hashed_pw_pax_004', 'PASSENGER'),
('pax_hoang_emy', 'hashed_pw_pax_005', 'PASSENGER'),
('pax_vo_fred', 'hashed_pw_pax_006', 'PASSENGER'),
('pax_bui_giang', 'hashed_pw_pax_007', 'PASSENGER'),
('pax_dang_hieu', 'hashed_pw_pax_008', 'PASSENGER'),
('pax_do_iris', 'hashed_pw_pax_009', 'PASSENGER'),
('pax_ngo_khanh', 'hashed_pw_pax_010', 'PASSENGER'),
('pax_mai_linh', 'hashed_pw_pax_011', 'PASSENGER'),
('pax_lam_minh', 'hashed_pw_pax_012', 'PASSENGER'),
('pax_cao_nam', 'hashed_pw_pax_013', 'PASSENGER'),
('pax_phung_oanh', 'hashed_pw_pax_014', 'PASSENGER'),
('pax_quach_phuc', 'hashed_pw_pax_015', 'PASSENGER'),
('pax_truong_quynh', 'hashed_pw_pax_016', 'PASSENGER'),
('pax_vu_ryan', 'hashed_pw_pax_017', 'PASSENGER'),
('pax_nguyen_son', 'hashed_pw_pax_018', 'PASSENGER'),
('pax_ta_thao', 'hashed_pw_pax_019', 'PASSENGER'),
('pax_dinh_uyen', 'hashed_pw_pax_020', 'PASSENGER'),
('pax_luu_vinh', 'hashed_pw_pax_021', 'PASSENGER'),
('pax_phan_will', 'hashed_pw_pax_022', 'PASSENGER'),
('pax_ho_yen', 'hashed_pw_pax_023', 'PASSENGER');

INSERT INTO Airports (iata_code, name, city, region, status) VALUES
('BMV', 'Buon Ma Thuot Airport', 'Dak Lak', 'CENTRAL', 'ACTIVE'),
('SGN', 'Tan Son Nhat International Airport', 'Ho Chi Minh City', 'SOUTHERN', 'ACTIVE'),
('HAN', 'Noi Bai International Airport', 'Hanoi', 'NORTHERN', 'ACTIVE'),
('DAD', 'Da Nang International Airport', 'Da Nang', 'CENTRAL', 'ACTIVE'),
('CXR', 'Cam Ranh International Airport', 'Khanh Hoa', 'CENTRAL', 'ACTIVE'),
('PQC', 'Phu Quoc International Airport', 'Kien Giang', 'SOUTHERN', 'ACTIVE'),
('HPH', 'Cat Bi International Airport', 'Hai Phong', 'NORTHERN', 'ACTIVE'),
('VCA', 'Can Tho International Airport', 'Can Tho', 'SOUTHERN', 'ACTIVE'),
('HUI', 'Phu Bai International Airport', 'Hue', 'CENTRAL', 'ACTIVE'),
('VII', 'Vinh International Airport', 'Nghe An', 'CENTRAL', 'ACTIVE'),
('THD', 'Tho Xuan Airport', 'Thanh Hoa', 'NORTHERN', 'ACTIVE'),
('VDH', 'Dong Hoi Airport', 'Quang Binh', 'CENTRAL', 'ACTIVE'),
('VCL', 'Chu Lai Airport', 'Quang Nam', 'CENTRAL', 'ACTIVE'),
('UIH', 'Phu Cat Airport', 'Binh Dinh', 'CENTRAL', 'ACTIVE'),
('DLI', 'Lien Khuong Airport', 'Lam Dong', 'CENTRAL', 'LOCKED');

INSERT INTO Airlines (code, name, status) VALUES
('VNA', 'Vietnam Airlines', 'ACTIVE'),
('VJC', 'VietJet Air', 'ACTIVE'),
('BBA', 'Bamboo Airways', 'ACTIVE'),
('PAC', 'Pacific Airlines', 'ACTIVE'),
('VAS', 'VASCO', 'ACTIVE'),
('VTA', 'Vietravel Airlines', 'ACTIVE'),
('SST', 'SunSky Transport', 'LOCKED'),
('MEK', 'Mekong Air', 'ACTIVE');

INSERT INTO Planes (airline_id, model, total_seats, status) VALUES
(1, 'Airbus A321neo', 220, 'ACTIVE'),
(1, 'Boeing 787-9', 294, 'ACTIVE'),
(1, 'Airbus A350-900', 305, 'ACTIVE'),
(2, 'Airbus A320', 180, 'ACTIVE'),
(2, 'Airbus A321', 230, 'ACTIVE'),
(2, 'Airbus A321neo', 240, 'ACTIVE'),
(3, 'Airbus A320', 180, 'MAINTENANCE'),
(3, 'Boeing 787-9', 292, 'ACTIVE'),
(3, 'Airbus A321neo', 220, 'ACTIVE'),
(4, 'Airbus A320', 174, 'ACTIVE'),
(4, 'Airbus A321', 210, 'GROUNDED'),
(5, 'ATR 72-500', 68, 'ACTIVE'),
(5, 'ATR 72-600', 72, 'ACTIVE'),
(6, 'Airbus A321', 220, 'ACTIVE'),
(6, 'Airbus A320', 180, 'ACTIVE'),
(8, 'Embraer E195', 120, 'ACTIVE'),
(8, 'Airbus A319', 144, 'ACTIVE'),
(1, 'Airbus A321ceo', 203, 'ACTIVE'),
(2, 'Airbus A330-300', 280, 'MAINTENANCE'),
(3, 'Airbus A321LR', 220, 'ACTIVE'),
(4, 'Airbus A320neo', 186, 'ACTIVE'),
(6, 'Airbus A321neo', 228, 'ACTIVE'),
(8, 'Boeing 737-800', 189, 'ACTIVE'),
(5, 'ATR 72-600', 70, 'RETIRED');

INSERT INTO Flights (
	flight_number, plane_id, airline_id, departure_airport_id, arrival_airport_id,
	distance, departure_time, arrival_time
) VALUES
('VN101', 1, 1, 1, 2, 1160, '2026-04-10 06:00:00', '2026-04-10 08:10:00'),
('VN102', 2, 1, 2, 1, 1160, '2026-04-10 09:30:00', '2026-04-10 11:40:00'),
('VJ201', 4, 2, 1, 3, 605, '2026-04-10 07:15:00', '2026-04-10 08:35:00'),
('VJ202', 5, 2, 3, 1, 605, '2026-04-10 10:00:00', '2026-04-10 11:20:00'),
('QH301', 8, 3, 1, 4, 1010, '2026-04-10 12:00:00', '2026-04-10 13:35:00'),
('QH302', 9, 3, 4, 1, 1010, '2026-04-10 14:20:00', '2026-04-10 15:55:00'),
('BL401', 10, 4, 2, 3, 628, '2026-04-10 06:40:00', '2026-04-10 08:00:00'),
('BL402', 10, 4, 3, 2, 628, '2026-04-10 18:20:00', '2026-04-10 19:40:00'),
('OV501', 12, 5, 7, 5, 260, '2026-04-10 09:10:00', '2026-04-10 10:10:00'),
('OV502', 13, 5, 5, 7, 260, '2026-04-10 16:20:00', '2026-04-10 17:20:00'),
('VU601', 14, 6, 1, 5, 300, '2026-04-11 08:15:00', '2026-04-11 09:15:00'),
('VU602', 15, 6, 5, 1, 300, '2026-04-11 20:15:00', '2026-04-11 21:15:00'),
('ME701', 16, 8, 1, 7, 130, '2026-04-11 13:00:00', '2026-04-11 14:00:00'),
('ME702', 17, 8, 7, 1, 130, '2026-04-11 15:10:00', '2026-04-11 16:10:00'),
('VN103', 18, 1, 2, 6, 120, '2026-04-11 07:05:00', '2026-04-11 08:00:00'),
('VN104', 1, 1, 6, 2, 120, '2026-04-11 17:10:00', '2026-04-11 18:05:00'),
('VJ203', 6, 2, 1, 8, 640, '2026-04-12 06:55:00', '2026-04-12 08:20:00'),
('VJ204', 4, 2, 8, 1, 640, '2026-04-12 19:30:00', '2026-04-12 20:55:00'),
('QH303', 20, 3, 3, 9, 450, '2026-04-12 09:25:00', '2026-04-12 10:30:00'),
('QH304', 8, 3, 9, 3, 450, '2026-04-12 18:30:00', '2026-04-12 19:35:00'),
('BL403', 21, 4, 2, 10, 155, '2026-04-12 11:20:00', '2026-04-12 12:10:00'),
('BL404', 10, 4, 10, 2, 155, '2026-04-12 13:20:00', '2026-04-12 14:10:00'),
('OV503', 13, 5, 11, 3, 270, '2026-04-13 08:00:00', '2026-04-13 09:00:00'),
('OV504', 12, 5, 3, 11, 270, '2026-04-13 16:00:00', '2026-04-13 17:00:00'),
('VU603', 22, 6, 1, 12, 700, '2026-04-13 06:30:00', '2026-04-13 08:00:00'),
('VU604', 14, 6, 12, 1, 700, '2026-04-13 19:45:00', '2026-04-13 21:15:00'),
('ME703', 23, 8, 1, 13, 275, '2026-04-13 09:40:00', '2026-04-13 10:40:00'),
('ME704', 16, 8, 13, 1, 275, '2026-04-13 15:50:00', '2026-04-13 16:50:00'),
('VN105', 3, 1, 2, 14, 1060, '2026-04-14 05:50:00', '2026-04-14 08:10:00'),
('VN106', 2, 1, 14, 2, 1060, '2026-04-14 18:10:00', '2026-04-14 20:30:00'),
('VJ205', 5, 2, 1, 6, 1190, '2026-04-14 07:20:00', '2026-04-14 09:35:00'),
('VJ206', 6, 2, 6, 1, 1190, '2026-04-14 20:20:00', '2026-04-14 22:35:00'),
('QH305', 9, 3, 4, 15, 210, '2026-04-15 10:10:00', '2026-04-15 11:10:00'),
('QH306', 8, 3, 15, 4, 210, '2026-04-15 17:05:00', '2026-04-15 18:05:00'),
('VU605', 15, 6, 5, 4, 430, '2026-04-15 06:40:00', '2026-04-15 07:50:00'),
('VU606', 22, 6, 4, 5, 430, '2026-04-15 19:10:00', '2026-04-15 20:20:00'),
('ME705', 17, 8, 7, 3, 520, '2026-04-16 08:30:00', '2026-04-16 09:50:00'),
('ME706', 23, 8, 3, 7, 520, '2026-04-16 14:40:00', '2026-04-16 16:00:00');

INSERT INTO Bookings (flight_id, booking_date, total_amount, status) VALUES
(1, '2026-04-01', 125.00, 'SUCCEED'),
(2, '2026-04-01', 129.00, 'SUCCEED'),
(3, '2026-04-01', 119.00, 'SUCCEED'),
(4, '2026-04-01', 121.00, 'SUCCEED'),
(5, '2026-04-01', 189.00, 'SUCCEED'),
(6, '2026-04-01', 189.00, 'SUCCEED'),
(7, '2026-04-01', 132.00, 'SUCCEED'),
(8, '2026-04-01', 132.00, 'SUCCEED'),
(9, '2026-04-01', 88.00, 'SUCCEED'),
(10, '2026-04-01', 88.00, 'SUCCEED'),
(11, '2026-04-02', 95.00, 'SUCCEED'),
(12, '2026-04-02', 95.00, 'SUCCEED'),
(13, '2026-04-02', 69.00, 'SUCCEED'),
(14, '2026-04-02', 69.00, 'SUCCEED'),
(15, '2026-04-02', 75.00, 'SUCCEED'),
(16, '2026-04-02', 75.00, 'SUCCEED'),
(17, '2026-04-02', 123.00, 'SUCCEED'),
(18, '2026-04-02', 123.00, 'SUCCEED'),
(19, '2026-04-02', 99.00, 'SUCCEED'),
(20, '2026-04-02', 99.00, 'SUCCEED'),
(21, '2026-04-03', 80.00, 'SUCCEED'),
(22, '2026-04-03', 80.00, 'SUCCEED'),
(23, '2026-04-03', 85.00, 'SUCCEED'),
(24, '2026-04-03', 85.00, 'SUCCEED'),
(25, '2026-04-03', 140.00, 'SUCCEED'),
(26, '2026-04-03', 140.00, 'SUCCEED'),
(27, '2026-04-03', 92.00, 'SUCCEED'),
(28, '2026-04-03', 92.00, 'SUCCEED'),
(29, '2026-04-03', 170.00, 'SUCCEED'),
(30, '2026-04-03', 170.00, 'SUCCEED'),
(31, '2026-04-04', 145.00, 'SUCCEED'),
(32, '2026-04-04', 145.00, 'SUCCEED'),
(33, '2026-04-04', 78.00, 'SUCCEED'),
(34, '2026-04-04', 78.00, 'SUCCEED'),
(35, '2026-04-04', 110.00, 'SUCCEED'),
(36, '2026-04-04', 110.00, 'SUCCEED'),
(1, '2026-04-04', 235.00, 'SUCCEED'),
(2, '2026-04-04', 235.00, 'SUCCEED'),
(3, '2026-04-04', 320.00, 'SUCCEED'),
(4, '2026-04-04', 320.00, 'SUCCEED'),
(5, '2026-04-05', 199.00, 'PENDING'),
(6, '2026-04-05', 199.00, 'PENDING'),
(7, '2026-04-05', 145.00, 'PENDING'),
(8, '2026-04-05', 145.00, 'PENDING'),
(9, '2026-04-05', 100.00, 'PENDING'),
(10, '2026-04-05', 100.00, 'PENDING'),
(11, '2026-04-05', 130.00, 'PENDING'),
(12, '2026-04-05', 130.00, 'PENDING'),
(13, '2026-04-05', 75.00, 'PENDING'),
(14, '2026-04-05', 75.00, 'PENDING'),
(15, '2026-04-06', 89.00, 'FAILED'),
(16, '2026-04-06', 89.00, 'FAILED'),
(17, '2026-04-06', 144.00, 'FAILED'),
(18, '2026-04-06', 144.00, 'FAILED'),
(19, '2026-04-06', 90.00, 'FAILED'),
(20, '2026-04-06', 90.00, 'FAILED'),
(21, '2026-04-06', 73.00, 'FAILED'),
(22, '2026-04-06', 73.00, 'FAILED'),
(23, '2026-04-06', 110.00, 'FAILED'),
(24, '2026-04-06', 110.00, 'FAILED');

INSERT INTO Payments (booking_id, transaction_id, amount, payment_method, status) VALUES
(1, 'TXN-20260402-0001', 125.00, 'VISA', 'SUCCEED'),
(2, 'TXN-20260402-0002', 129.00, 'VISA', 'SUCCEED'),
(3, 'TXN-20260402-0003', 119.00, 'CREDIT_CARD', 'SUCCEED'),
(4, 'TXN-20260402-0004', 121.00, 'BANKING', 'SUCCEED'),
(5, 'TXN-20260402-0005', 189.00, 'VISA', 'SUCCEED'),
(6, 'TXN-20260402-0006', 189.00, 'BANKING', 'SUCCEED'),
(7, 'TXN-20260402-0007', 132.00, 'CREDIT_CARD', 'SUCCEED'),
(8, 'TXN-20260402-0008', 132.00, 'VISA', 'SUCCEED'),
(9, 'TXN-20260402-0009', 88.00, 'BANKING', 'SUCCEED'),
(10, 'TXN-20260402-0010', 88.00, 'VISA', 'SUCCEED'),
(11, 'TXN-20260402-0011', 95.00, 'VISA', 'SUCCEED'),
(12, 'TXN-20260402-0012', 95.00, 'CREDIT_CARD', 'SUCCEED'),
(13, 'TXN-20260402-0013', 69.00, 'BANKING', 'SUCCEED'),
(14, 'TXN-20260402-0014', 69.00, 'VISA', 'SUCCEED'),
(15, 'TXN-20260402-0015', 75.00, 'VISA', 'SUCCEED'),
(16, 'TXN-20260402-0016', 75.00, 'BANKING', 'SUCCEED'),
(17, 'TXN-20260402-0017', 123.00, 'CREDIT_CARD', 'SUCCEED'),
(18, 'TXN-20260402-0018', 123.00, 'VISA', 'SUCCEED'),
(19, 'TXN-20260402-0019', 99.00, 'BANKING', 'SUCCEED'),
(20, 'TXN-20260402-0020', 99.00, 'VISA', 'SUCCEED'),
(21, 'TXN-20260402-0021', 80.00, 'BANKING', 'SUCCEED'),
(22, 'TXN-20260402-0022', 80.00, 'VISA', 'SUCCEED'),
(23, 'TXN-20260402-0023', 85.00, 'VISA', 'SUCCEED'),
(24, 'TXN-20260402-0024', 85.00, 'CREDIT_CARD', 'SUCCEED'),
(25, 'TXN-20260402-0025', 140.00, 'BANKING', 'SUCCEED'),
(26, 'TXN-20260402-0026', 140.00, 'VISA', 'SUCCEED'),
(27, 'TXN-20260402-0027', 92.00, 'VISA', 'SUCCEED'),
(28, 'TXN-20260402-0028', 92.00, 'CREDIT_CARD', 'SUCCEED'),
(29, 'TXN-20260402-0029', 170.00, 'BANKING', 'SUCCEED'),
(30, 'TXN-20260402-0030', 170.00, 'VISA', 'SUCCEED'),
(31, 'TXN-20260402-0031', 145.00, 'VISA', 'SUCCEED'),
(32, 'TXN-20260402-0032', 145.00, 'BANKING', 'SUCCEED'),
(33, 'TXN-20260402-0033', 78.00, 'VISA', 'SUCCEED'),
(34, 'TXN-20260402-0034', 78.00, 'BANKING', 'SUCCEED'),
(35, 'TXN-20260402-0035', 110.00, 'CREDIT_CARD', 'SUCCEED'),
(36, 'TXN-20260402-0036', 110.00, 'VISA', 'SUCCEED'),
(37, 'TXN-20260402-0037', 235.00, 'VISA', 'SUCCEED'),
(38, 'TXN-20260402-0038', 235.00, 'BANKING', 'SUCCEED'),
(39, 'TXN-20260402-0039', 320.00, 'CREDIT_CARD', 'SUCCEED'),
(40, 'TXN-20260402-0040', 320.00, 'VISA', 'SUCCEED'),
(41, 'TXN-20260402-0041', 199.00, 'VISA', 'PENDING'),
(42, 'TXN-20260402-0042', 199.00, 'BANKING', 'PENDING'),
(43, 'TXN-20260402-0043', 145.00, 'VISA', 'PENDING'),
(44, 'TXN-20260402-0044', 145.00, 'CREDIT_CARD', 'PENDING'),
(45, 'TXN-20260402-0045', 100.00, 'BANKING', 'OUT_OF_TIME'),
(46, 'TXN-20260402-0046', 100.00, 'VISA', 'OUT_OF_TIME'),
(47, 'TXN-20260402-0047', 130.00, 'CREDIT_CARD', 'OUT_OF_TIME'),
(48, 'TXN-20260402-0048', 130.00, 'VISA', 'OUT_OF_TIME'),
(49, 'TXN-20260402-0049', 75.00, 'BANKING', 'PENDING'),
(50, 'TXN-20260402-0050', 75.00, 'VISA', 'PENDING'),
(51, 'TXN-20260402-0051', 89.00, 'VISA', 'FAILED'),
(52, 'TXN-20260402-0052', 89.00, 'BANKING', 'FAILED'),
(53, 'TXN-20260402-0053', 144.00, 'CREDIT_CARD', 'FAILED'),
(54, 'TXN-20260402-0054', 144.00, 'VISA', 'FAILED'),
(55, 'TXN-20260402-0055', 90.00, 'BANKING', 'FAILED'),
(56, 'TXN-20260402-0056', 90.00, 'VISA', 'FAILED'),
(57, 'TXN-20260402-0057', 73.00, 'BANKING', 'FAILED'),
(58, 'TXN-20260402-0058', 73.00, 'CREDIT_CARD', 'FAILED'),
(59, 'TXN-20260402-0059', 110.00, 'VISA', 'FAILED'),
(60, 'TXN-20260402-0060', 110.00, 'BANKING', 'FAILED');

INSERT INTO Seats (flight_id, seat_number, price, class, status) VALUES
(1, '1A', 350.00, 'FIRST', 'PAID'),
(1, '1B', 350.00, 'FIRST', 'PAID'),
(1, '2A', 230.00, 'BUSINESS', 'PAID'),
(1, '2B', 230.00, 'BUSINESS', 'PAID'),
(1, '3A', 125.00, 'ECONOMY', 'PAID'),
(1, '3B', 125.00, 'ECONOMY', 'PAID'),
(1, '3C', 125.00, 'ECONOMY', 'RESERVED'),
(1, '4A', 119.00, 'ECONOMY', 'AVAILABLE'),
(1, '4B', 119.00, 'ECONOMY', 'AVAILABLE'),
(1, '4C', 119.00, 'ECONOMY', 'AVAILABLE'),
(1, '5A', 115.00, 'ECONOMY', 'AVAILABLE'),
(1, '5B', 115.00, 'ECONOMY', 'AVAILABLE'),

(2, '1A', 350.00, 'FIRST', 'PAID'),
(2, '1B', 350.00, 'FIRST', 'PAID'),
(2, '2A', 230.00, 'BUSINESS', 'PAID'),
(2, '2B', 230.00, 'BUSINESS', 'PAID'),
(2, '3A', 129.00, 'ECONOMY', 'PAID'),
(2, '3B', 129.00, 'ECONOMY', 'PAID'),
(2, '3C', 129.00, 'ECONOMY', 'RESERVED'),
(2, '4A', 122.00, 'ECONOMY', 'AVAILABLE'),
(2, '4B', 122.00, 'ECONOMY', 'AVAILABLE'),
(2, '4C', 122.00, 'ECONOMY', 'AVAILABLE'),
(2, '5A', 118.00, 'ECONOMY', 'AVAILABLE'),
(2, '5B', 118.00, 'ECONOMY', 'AVAILABLE'),

(3, '1A', 290.00, 'FIRST', 'PAID'),
(3, '1B', 290.00, 'FIRST', 'PAID'),
(3, '2A', 210.00, 'BUSINESS', 'PAID'),
(3, '2B', 210.00, 'BUSINESS', 'PAID'),
(3, '3A', 119.00, 'ECONOMY', 'PAID'),
(3, '3B', 119.00, 'ECONOMY', 'PAID'),
(3, '3C', 119.00, 'ECONOMY', 'RESERVED'),
(3, '4A', 115.00, 'ECONOMY', 'AVAILABLE'),
(3, '4B', 115.00, 'ECONOMY', 'AVAILABLE'),
(3, '4C', 115.00, 'ECONOMY', 'AVAILABLE'),
(3, '5A', 110.00, 'ECONOMY', 'AVAILABLE'),
(3, '5B', 110.00, 'ECONOMY', 'AVAILABLE'),

(4, '1A', 290.00, 'FIRST', 'PAID'),
(4, '1B', 290.00, 'FIRST', 'PAID'),
(4, '2A', 210.00, 'BUSINESS', 'PAID'),
(4, '2B', 210.00, 'BUSINESS', 'PAID'),
(4, '3A', 121.00, 'ECONOMY', 'PAID'),
(4, '3B', 121.00, 'ECONOMY', 'PAID'),
(4, '3C', 121.00, 'ECONOMY', 'RESERVED'),
(4, '4A', 117.00, 'ECONOMY', 'AVAILABLE'),
(4, '4B', 117.00, 'ECONOMY', 'AVAILABLE'),
(4, '4C', 117.00, 'ECONOMY', 'AVAILABLE'),
(4, '5A', 111.00, 'ECONOMY', 'AVAILABLE'),
(4, '5B', 111.00, 'ECONOMY', 'AVAILABLE'),

(5, '1A', 410.00, 'FIRST', 'PAID'),
(5, '1B', 410.00, 'FIRST', 'PAID'),
(5, '2A', 270.00, 'BUSINESS', 'PAID'),
(5, '2B', 270.00, 'BUSINESS', 'PAID'),
(5, '3A', 189.00, 'ECONOMY', 'PAID'),
(5, '3B', 189.00, 'ECONOMY', 'PAID'),
(5, '3C', 189.00, 'ECONOMY', 'RESERVED'),
(5, '4A', 179.00, 'ECONOMY', 'AVAILABLE'),
(5, '4B', 179.00, 'ECONOMY', 'AVAILABLE'),
(5, '4C', 179.00, 'ECONOMY', 'AVAILABLE'),
(5, '5A', 169.00, 'ECONOMY', 'AVAILABLE'),
(5, '5B', 169.00, 'ECONOMY', 'AVAILABLE'),

(6, '1A', 410.00, 'FIRST', 'PAID'),
(6, '1B', 410.00, 'FIRST', 'PAID'),
(6, '2A', 270.00, 'BUSINESS', 'PAID'),
(6, '2B', 270.00, 'BUSINESS', 'PAID'),
(6, '3A', 189.00, 'ECONOMY', 'PAID'),
(6, '3B', 189.00, 'ECONOMY', 'PAID'),
(6, '3C', 189.00, 'ECONOMY', 'RESERVED'),
(6, '4A', 179.00, 'ECONOMY', 'AVAILABLE'),
(6, '4B', 179.00, 'ECONOMY', 'AVAILABLE'),
(6, '4C', 179.00, 'ECONOMY', 'AVAILABLE'),
(6, '5A', 169.00, 'ECONOMY', 'AVAILABLE'),
(6, '5B', 169.00, 'ECONOMY', 'AVAILABLE'),

(7, '1A', 300.00, 'FIRST', 'PAID'),
(7, '1B', 300.00, 'FIRST', 'PAID'),
(7, '2A', 220.00, 'BUSINESS', 'PAID'),
(7, '2B', 220.00, 'BUSINESS', 'PAID'),
(7, '3A', 132.00, 'ECONOMY', 'PAID'),
(7, '3B', 132.00, 'ECONOMY', 'PAID'),
(7, '3C', 132.00, 'ECONOMY', 'RESERVED'),
(7, '4A', 126.00, 'ECONOMY', 'AVAILABLE'),
(7, '4B', 126.00, 'ECONOMY', 'AVAILABLE'),
(7, '4C', 126.00, 'ECONOMY', 'AVAILABLE'),
(7, '5A', 120.00, 'ECONOMY', 'AVAILABLE'),
(7, '5B', 120.00, 'ECONOMY', 'AVAILABLE'),

(8, '1A', 300.00, 'FIRST', 'PAID'),
(8, '1B', 300.00, 'FIRST', 'PAID'),
(8, '2A', 220.00, 'BUSINESS', 'PAID'),
(8, '2B', 220.00, 'BUSINESS', 'PAID'),
(8, '3A', 132.00, 'ECONOMY', 'PAID'),
(8, '3B', 132.00, 'ECONOMY', 'PAID'),
(8, '3C', 132.00, 'ECONOMY', 'RESERVED'),
(8, '4A', 126.00, 'ECONOMY', 'AVAILABLE'),
(8, '4B', 126.00, 'ECONOMY', 'AVAILABLE'),
(8, '4C', 126.00, 'ECONOMY', 'AVAILABLE'),
(8, '5A', 120.00, 'ECONOMY', 'AVAILABLE'),
(8, '5B', 120.00, 'ECONOMY', 'AVAILABLE'),

(9, '1A', 220.00, 'FIRST', 'PAID'),
(9, '1B', 220.00, 'FIRST', 'PAID'),
(9, '2A', 160.00, 'BUSINESS', 'PAID'),
(9, '2B', 160.00, 'BUSINESS', 'PAID'),
(9, '3A', 88.00, 'ECONOMY', 'PAID'),
(9, '3B', 88.00, 'ECONOMY', 'PAID'),
(9, '3C', 88.00, 'ECONOMY', 'RESERVED'),
(9, '4A', 82.00, 'ECONOMY', 'AVAILABLE'),
(9, '4B', 82.00, 'ECONOMY', 'AVAILABLE'),
(9, '4C', 82.00, 'ECONOMY', 'AVAILABLE'),
(9, '5A', 78.00, 'ECONOMY', 'AVAILABLE'),
(9, '5B', 78.00, 'ECONOMY', 'AVAILABLE'),

(10, '1A', 220.00, 'FIRST', 'PAID'),
(10, '1B', 220.00, 'FIRST', 'PAID'),
(10, '2A', 160.00, 'BUSINESS', 'PAID'),
(10, '2B', 160.00, 'BUSINESS', 'PAID'),
(10, '3A', 88.00, 'ECONOMY', 'PAID'),
(10, '3B', 88.00, 'ECONOMY', 'PAID'),
(10, '3C', 88.00, 'ECONOMY', 'RESERVED'),
(10, '4A', 82.00, 'ECONOMY', 'AVAILABLE'),
(10, '4B', 82.00, 'ECONOMY', 'AVAILABLE'),
(10, '4C', 82.00, 'ECONOMY', 'AVAILABLE'),
(10, '5A', 78.00, 'ECONOMY', 'AVAILABLE'),
(10, '5B', 78.00, 'ECONOMY', 'AVAILABLE'),

(11, '1A', 240.00, 'FIRST', 'PAID'),
(11, '1B', 240.00, 'FIRST', 'PAID'),
(11, '2A', 175.00, 'BUSINESS', 'PAID'),
(11, '2B', 175.00, 'BUSINESS', 'PAID'),
(11, '3A', 95.00, 'ECONOMY', 'PAID'),
(11, '3B', 95.00, 'ECONOMY', 'PAID'),
(11, '3C', 95.00, 'ECONOMY', 'RESERVED'),
(11, '4A', 89.00, 'ECONOMY', 'AVAILABLE'),
(11, '4B', 89.00, 'ECONOMY', 'AVAILABLE'),
(11, '4C', 89.00, 'ECONOMY', 'AVAILABLE'),
(11, '5A', 84.00, 'ECONOMY', 'AVAILABLE'),
(11, '5B', 84.00, 'ECONOMY', 'AVAILABLE'),

(12, '1A', 240.00, 'FIRST', 'PAID'),
(12, '1B', 240.00, 'FIRST', 'PAID'),
(12, '2A', 175.00, 'BUSINESS', 'PAID'),
(12, '2B', 175.00, 'BUSINESS', 'PAID'),
(12, '3A', 95.00, 'ECONOMY', 'PAID'),
(12, '3B', 95.00, 'ECONOMY', 'PAID'),
(12, '3C', 95.00, 'ECONOMY', 'RESERVED'),
(12, '4A', 89.00, 'ECONOMY', 'AVAILABLE'),
(12, '4B', 89.00, 'ECONOMY', 'AVAILABLE'),
(12, '4C', 89.00, 'ECONOMY', 'AVAILABLE'),
(12, '5A', 84.00, 'ECONOMY', 'AVAILABLE'),
(12, '5B', 84.00, 'ECONOMY', 'AVAILABLE');

INSERT INTO Tickets (
	ticket_number, booking_id, seat_id, buyer_id, passenger_lastname,
	passenger_firstname, passenger_id_card, issue_date, final_price, status
) VALUES
('TK202604020001', 1, 1, 8, 'Nguyen', 'An', '079001000001', '2026-04-02', 350.00, 'ACTIVE'),
('TK202604020002', 2, 13, 9, 'Tran', 'Binh', '079001000002', '2026-04-02', 350.00, 'ACTIVE'),
('TK202604020003', 3, 25, 10, 'Le', 'Chau', '079001000003', '2026-04-02', 290.00, 'ACTIVE'),
('TK202604020004', 4, 37, 11, 'Pham', 'Duy', '079001000004', '2026-04-02', 290.00, 'ACTIVE'),
('TK202604020005', 5, 49, 12, 'Hoang', 'Emy', '079001000005', '2026-04-02', 410.00, 'ACTIVE'),
('TK202604020006', 6, 61, 13, 'Vo', 'Fred', '079001000006', '2026-04-02', 410.00, 'ACTIVE'),
('TK202604020007', 7, 73, 14, 'Bui', 'Giang', '079001000007', '2026-04-02', 300.00, 'ACTIVE'),
('TK202604020008', 8, 85, 15, 'Dang', 'Hieu', '079001000008', '2026-04-02', 300.00, 'ACTIVE'),
('TK202604020009', 9, 97, 16, 'Do', 'Iris', '079001000009', '2026-04-02', 220.00, 'ACTIVE'),
('TK202604020010', 10, 109, 17, 'Ngo', 'Khanh', '079001000010', '2026-04-02', 220.00, 'ACTIVE'),
('TK202604020011', 11, 121, 18, 'Mai', 'Linh', '079001000011', '2026-04-02', 240.00, 'ACTIVE'),
('TK202604020012', 12, 133, 19, 'Lam', 'Minh', '079001000012', '2026-04-02', 240.00, 'ACTIVE'),
('TK202604020013', 13, 2, 20, 'Cao', 'Nam', '079001000013', '2026-04-03', 350.00, 'ACTIVE'),
('TK202604020014', 14, 14, 21, 'Phung', 'Oanh', '079001000014', '2026-04-03', 350.00, 'ACTIVE'),
('TK202604020015', 15, 26, 22, 'Quach', 'Phuc', '079001000015', '2026-04-03', 290.00, 'ACTIVE'),
('TK202604020016', 16, 38, 23, 'Truong', 'Quynh', '079001000016', '2026-04-03', 290.00, 'ACTIVE'),
('TK202604020017', 17, 50, 24, 'Vu', 'Ryan', '079001000017', '2026-04-03', 410.00, 'ACTIVE'),
('TK202604020018', 18, 62, 25, 'Nguyen', 'Son', '079001000018', '2026-04-03', 410.00, 'ACTIVE'),
('TK202604020019', 19, 74, 26, 'Ta', 'Thao', '079001000019', '2026-04-03', 300.00, 'ACTIVE'),
('TK202604020020', 20, 86, 27, 'Dinh', 'Uyen', '079001000020', '2026-04-03', 300.00, 'ACTIVE'),
('TK202604020021', 21, 98, 28, 'Luu', 'Vinh', '079001000021', '2026-04-03', 220.00, 'USED'),
('TK202604020022', 22, 110, 29, 'Phan', 'Will', '079001000022', '2026-04-03', 220.00, 'USED'),
('TK202604020023', 23, 122, 30, 'Ho', 'Yen', '079001000023', '2026-04-03', 240.00, 'USED'),
('TK202604020024', 24, 134, 8, 'Nguyen', 'An', '079001000024', '2026-04-03', 240.00, 'USED'),
('TK202604020025', 25, 3, 9, 'Tran', 'Binh', '079001000025', '2026-04-04', 230.00, 'ACTIVE'),
('TK202604020026', 26, 15, 10, 'Le', 'Chau', '079001000026', '2026-04-04', 230.00, 'ACTIVE'),
('TK202604020027', 27, 27, 11, 'Pham', 'Duy', '079001000027', '2026-04-04', 210.00, 'ACTIVE'),
('TK202604020028', 28, 39, 12, 'Hoang', 'Emy', '079001000028', '2026-04-04', 210.00, 'ACTIVE'),
('TK202604020029', 29, 51, 13, 'Vo', 'Fred', '079001000029', '2026-04-04', 270.00, 'ACTIVE'),
('TK202604020030', 30, 63, 14, 'Bui', 'Giang', '079001000030', '2026-04-04', 270.00, 'ACTIVE'),
('TK202604020031', 31, 75, 15, 'Dang', 'Hieu', '079001000031', '2026-04-04', 220.00, 'ACTIVE'),
('TK202604020032', 32, 87, 16, 'Do', 'Iris', '079001000032', '2026-04-04', 220.00, 'ACTIVE'),
('TK202604020033', 33, 99, 17, 'Ngo', 'Khanh', '079001000033', '2026-04-04', 160.00, 'ACTIVE'),
('TK202604020034', 34, 111, 18, 'Mai', 'Linh', '079001000034', '2026-04-04', 160.00, 'ACTIVE'),
('TK202604020035', 35, 123, 19, 'Lam', 'Minh', '079001000035', '2026-04-04', 175.00, 'ACTIVE'),
('TK202604020036', 36, 135, 20, 'Cao', 'Nam', '079001000036', '2026-04-04', 175.00, 'ACTIVE'),
('TK202604020037', 37, 4, 21, 'Phung', 'Oanh', '079001000037', '2026-04-05', 230.00, 'ACTIVE'),
('TK202604020038', 38, 16, 22, 'Quach', 'Phuc', '079001000038', '2026-04-05', 230.00, 'ACTIVE'),
('TK202604020039', 39, 28, 23, 'Truong', 'Quynh', '079001000039', '2026-04-05', 210.00, 'ACTIVE'),
('TK202604020040', 40, 40, 24, 'Vu', 'Ryan', '079001000040', '2026-04-05', 210.00, 'ACTIVE'),
('TK202604020041', 5, 52, 25, 'Nguyen', 'Son', '079001000041', '2026-04-05', 270.00, 'ACTIVE'),
('TK202604020042', 6, 64, 26, 'Ta', 'Thao', '079001000042', '2026-04-05', 270.00, 'ACTIVE'),
('TK202604020043', 7, 76, 27, 'Dinh', 'Uyen', '079001000043', '2026-04-05', 220.00, 'ACTIVE'),
('TK202604020044', 8, 88, 28, 'Luu', 'Vinh', '079001000044', '2026-04-05', 220.00, 'ACTIVE'),
('TK202604020045', 9, 100, 29, 'Phan', 'Will', '079001000045', '2026-04-05', 160.00, 'ACTIVE'),
('TK202604020046', 10, 112, 30, 'Ho', 'Yen', '079001000046', '2026-04-05', 160.00, 'ACTIVE'),
('TK202604020047', 11, 124, 8, 'Nguyen', 'An', '079001000047', '2026-04-05', 175.00, 'ACTIVE'),
('TK202604020048', 12, 136, 9, 'Tran', 'Binh', '079001000048', '2026-04-05', 175.00, 'ACTIVE');

INSERT INTO Loyalty (passenger_id, miles_traveled, points) VALUES
(8, 12850.00, 1285),
(9, 9250.00, 925),
(10, 16220.00, 1622),
(11, 7450.00, 745),
(12, 18300.00, 1830),
(13, 6400.00, 640),
(14, 21100.00, 2110),
(15, 12000.00, 1200),
(16, 5800.00, 580),
(17, 15000.00, 1500),
(18, 9100.00, 910),
(19, 6700.00, 670),
(20, 9800.00, 980),
(21, 5300.00, 530),
(22, 11200.00, 1120),
(23, 14000.00, 1400),
(24, 8900.00, 890),
(25, 7600.00, 760),
(26, 4300.00, 430),
(27, 5100.00, 510),
(28, 6000.00, 600),
(29, 13400.00, 1340),
(30, 7200.00, 720)
ON DUPLICATE KEY UPDATE
	miles_traveled = VALUES(miles_traveled),
	points = VALUES(points);

-- Extra users for richer seed coverage
INSERT INTO Users (username, password, role) VALUES
('gate_hph_02', 'hashed_pw_gate_006', 'GATE_AGENT'),
('gate_pqc_01', 'hashed_pw_gate_007', 'GATE_AGENT'),
('gate_vca_01', 'hashed_pw_gate_008', 'GATE_AGENT'),
('gate_uih_01', 'hashed_pw_gate_009', 'GATE_AGENT'),
('gate_vii_01', 'hashed_pw_gate_010', 'GATE_AGENT'),
('pax_ngo_xuan', 'hashed_pw_pax_024', 'PASSENGER'),
('pax_trinh_yen', 'hashed_pw_pax_025', 'PASSENGER'),
('pax_ha_zoe', 'hashed_pw_pax_026', 'PASSENGER'),
('pax_kieu_long', 'hashed_pw_pax_027', 'PASSENGER'),
('pax_ly_mint', 'hashed_pw_pax_028', 'PASSENGER'),
('pax_ton_neo', 'hashed_pw_pax_029', 'PASSENGER'),
('pax_huynh_olive', 'hashed_pw_pax_030', 'PASSENGER'),
('pax_quan_paul', 'hashed_pw_pax_031', 'PASSENGER'),
('pax_anh_quinn', 'hashed_pw_pax_032', 'PASSENGER'),
('pax_ha_rose', 'hashed_pw_pax_033', 'PASSENGER'),
('pax_nguyen_sky', 'hashed_pw_pax_034', 'PASSENGER'),
('pax_vu_tina', 'hashed_pw_pax_035', 'PASSENGER'),
('pax_bao_uno', 'hashed_pw_pax_036', 'PASSENGER'),
('pax_doan_vera', 'hashed_pw_pax_037', 'PASSENGER'),
('pax_tran_wren', 'hashed_pw_pax_038', 'PASSENGER');

-- Add seat maps for all remaining flights to increase booking/ticket coverage
INSERT INTO Seats (flight_id, seat_number, price, class, status)
SELECT
	f.id,
	st.seat_number,
	st.price,
	st.class,
	st.status
FROM Flights f
JOIN (
	SELECT '1A' AS seat_number, 360.00 AS price, 'FIRST' AS class, 'PAID' AS status
	UNION ALL SELECT '1B', 360.00, 'FIRST', 'PAID'
	UNION ALL SELECT '2A', 245.00, 'BUSINESS', 'PAID'
	UNION ALL SELECT '2B', 245.00, 'BUSINESS', 'PAID'
	UNION ALL SELECT '3A', 145.00, 'ECONOMY', 'PAID'
	UNION ALL SELECT '3B', 145.00, 'ECONOMY', 'PAID'
	UNION ALL SELECT '3C', 145.00, 'ECONOMY', 'RESERVED'
	UNION ALL SELECT '4A', 132.00, 'ECONOMY', 'AVAILABLE'
	UNION ALL SELECT '4B', 132.00, 'ECONOMY', 'AVAILABLE'
	UNION ALL SELECT '4C', 132.00, 'ECONOMY', 'AVAILABLE'
	UNION ALL SELECT '5A', 125.00, 'ECONOMY', 'AVAILABLE'
	UNION ALL SELECT '5B', 125.00, 'ECONOMY', 'AVAILABLE'
) st
WHERE f.id BETWEEN 13 AND 38;

-- Additional bookings on newer flights
INSERT INTO Bookings (flight_id, booking_date, total_amount, status) VALUES
(13, '2026-04-07', 72.00, 'SUCCEED'),
(14, '2026-04-07', 72.00, 'PENDING'),
(15, '2026-04-07', 79.00, 'SUCCEED'),
(16, '2026-04-07', 79.00, 'FAILED'),
(17, '2026-04-07', 126.00, 'SUCCEED'),
(18, '2026-04-07', 126.00, 'PENDING'),
(19, '2026-04-08', 101.00, 'SUCCEED'),
(20, '2026-04-08', 101.00, 'FAILED'),
(21, '2026-04-08', 84.00, 'SUCCEED'),
(22, '2026-04-08', 84.00, 'PENDING'),
(23, '2026-04-08', 89.00, 'SUCCEED'),
(24, '2026-04-08', 89.00, 'FAILED'),
(25, '2026-04-08', 146.00, 'SUCCEED'),
(26, '2026-04-08', 146.00, 'PENDING'),
(27, '2026-04-09', 96.00, 'SUCCEED'),
(28, '2026-04-09', 96.00, 'FAILED'),
(29, '2026-04-09', 176.00, 'SUCCEED'),
(30, '2026-04-09', 176.00, 'PENDING'),
(31, '2026-04-09', 151.00, 'SUCCEED'),
(32, '2026-04-09', 151.00, 'FAILED'),
(33, '2026-04-09', 82.00, 'SUCCEED'),
(34, '2026-04-09', 82.00, 'PENDING'),
(35, '2026-04-09', 115.00, 'SUCCEED'),
(36, '2026-04-09', 115.00, 'FAILED'),
(37, '2026-04-10', 136.00, 'SUCCEED'),
(38, '2026-04-10', 136.00, 'PENDING');

-- Auto-create matching payments for newly added bookings
INSERT INTO Payments (booking_id, transaction_id, amount, payment_method, status)
SELECT
	b.id,
	CONCAT('TXN-20260407-', LPAD(b.id, 4, '0')),
	b.total_amount,
	CASE MOD(b.id, 3)
		WHEN 0 THEN 'BANKING'
		WHEN 1 THEN 'VISA'
		ELSE 'CREDIT_CARD'
	END,
	CASE
		WHEN b.status = 'SUCCEED' THEN 'SUCCEED'
		WHEN b.status = 'FAILED' THEN 'FAILED'
		WHEN b.status = 'PENDING' AND MOD(b.id, 2) = 0 THEN 'OUT_OF_TIME'
		ELSE 'PENDING'
	END
FROM Bookings b
WHERE b.booking_date >= '2026-04-07';

-- Issue tickets for successful new bookings using paid seat 1A on each flight
INSERT INTO Tickets (
	ticket_number, booking_id, seat_id, buyer_id, passenger_lastname,
	passenger_firstname, passenger_id_card, issue_date, final_price, status
)
SELECT
	CONCAT('TK20260407', LPAD(b.id, 4, '0')),
	b.id,
	s.id,
	u.id,
	'Passenger',
	CONCAT('Seed', b.id),
	CONCAT('079009', LPAD(b.id, 6, '0')),
	DATE_ADD(b.booking_date, INTERVAL 1 DAY),
	s.price,
	'ACTIVE'
FROM Bookings b
JOIN Flights f ON f.id = b.flight_id
JOIN Seats s ON s.flight_id = f.id AND s.seat_number = '1A'
JOIN Users u ON u.id = 8 + MOD(b.id - 1, 23)
WHERE b.booking_date >= '2026-04-07'
  AND b.status = 'SUCCEED';

-- Loyalty records for newly added passengers
INSERT INTO Loyalty (passenger_id, miles_traveled, points)
SELECT u.id, t.miles_traveled, t.points
FROM Users u
JOIN (
	SELECT 'pax_ngo_xuan' AS username, 5400.00 AS miles_traveled, 540 AS points
	UNION ALL SELECT 'pax_trinh_yen', 6800.00, 680
	UNION ALL SELECT 'pax_ha_zoe', 4700.00, 470
	UNION ALL SELECT 'pax_kieu_long', 8900.00, 890
	UNION ALL SELECT 'pax_ly_mint', 7600.00, 760
	UNION ALL SELECT 'pax_ton_neo', 5200.00, 520
	UNION ALL SELECT 'pax_huynh_olive', 9400.00, 940
	UNION ALL SELECT 'pax_quan_paul', 6100.00, 610
	UNION ALL SELECT 'pax_anh_quinn', 8300.00, 830
	UNION ALL SELECT 'pax_ha_rose', 7100.00, 710
	UNION ALL SELECT 'pax_nguyen_sky', 9900.00, 990
	UNION ALL SELECT 'pax_vu_tina', 5700.00, 570
	UNION ALL SELECT 'pax_bao_uno', 6400.00, 640
	UNION ALL SELECT 'pax_doan_vera', 7800.00, 780
	UNION ALL SELECT 'pax_tran_wren', 8600.00, 860
) t ON t.username = u.username
ON DUPLICATE KEY UPDATE
    miles_traveled = VALUES(miles_traveled),
    points = VALUES(points);

-- Normalize seed units: money values are stored in million VND, distances/miles in miles
SET SQL_SAFE_UPDATES = 0;
UPDATE Bookings
SET total_amount = total_amount * 10;

UPDATE Payments
SET amount = amount * 10;

UPDATE Seats
SET price = price * 10;

UPDATE Tickets
SET final_price = final_price * 10;

UPDATE Flights
SET distance = ROUND(distance * 0.621371, 2);

UPDATE Loyalty
SET miles_traveled = ROUND(miles_traveled * 0.621371, 2);
SET SQL_SAFE_UPDATES = 1;