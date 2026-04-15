use flight_booking;
-- trigger tự động link loyalty khi có acc passenger mới
DELIMITER //

CREATE Trigger trg_after_insert_user
AFTER INSERT ON Users
FOR EACH ROW
BEGIN
	IF NEW.role = 'PASSENGER' THEN
		INSERT INTO Loyalty (passenger_id)
        VALUES (NEW.id);
	END IF;
END//

DELIMITER ;

-- đổi điểm
DELIMITER //
CREATE PROCEDURE proc_exchange_points (
	IN p_user_id INT,
    IN p_points_to_use DECIMAL(15,2)
)
BEGIN 
	DECLARE curr_points INT;
    
    IF p_points_to_use <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Points must be greater than 0';
    END IF;
    
    START TRANSACTION;
    
    SELECT points INTO curr_points
    FROM Loyalty
    WHERE passenger_id = p_user_id
    FOR UPDATE;
    
    IF curr_points IS NULL THEN
		ROLLBACK;
		SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Passenger does not exist in Loyalty';
	END IF;
    
	IF curr_points < p_points_to_use THEN
		ROLLBACK;
		SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Not enought points';
	END IF;
    
    UPDATE Loyalty 
    SET 
		points = points - p_points_to_use, 
        points_used = points_used + p_points_to_use
    WHERE passenger_id = p_user_id;
    
    COMMIT;
END //
DELIMITER ;

-- trigger kiểm tra tự động nếu status booking đã hoàn thành thì kh cho cập nhật nữa
DELIMITER //
CREATE TRIGGER trg_before_update_booking
BEFORE UPDATE ON Bookings
FOR EACH ROW
BEGIN
    IF OLD.status IN ('SUCCEED','FAILED') AND NEW.status <> OLD.status THEN
		SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Booking is already finalized';
    END IF;
END//
DELIMITER ;

-- trigger kiểm tra tự động chặn cập nhật payments nếu payments.status đã hoàn thành
DELIMITER //
CREATE TRIGGER trg_before_update_payment
BEFORE UPDATE ON Payments
FOR EACH ROW
BEGIN
	IF OLD.status IN ('SUCCEED', 'FAILED', 'OUT_OF_TIME') AND NEW.status <> OLD.status THEN
		SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Payment is already finalized';
    END IF;
END//
DELIMITER ;
DELIMITER //

-- trigger tự động cập nhật status cho Bookings nếu Payment đã hoàn thành
CREATE TRIGGER trg_after_update_payment
AFTER UPDATE ON Payments
FOR EACH ROW
BEGIN

	IF NEW.status <> OLD.status THEN
		IF NEW.status = 'SUCCEED' THEN
			UPDATE Bookings 
			SET status = 'SUCCEED'
			WHERE id = NEW.booking_id;
		END IF;

		IF NEW.status IN ('FAILED', 'OUT_OF_TIME') THEN
			UPDATE Bookings 
			SET status = 'FAILED'
			WHERE id = NEW.booking_id AND status <> 'FAILED';
		END IF;
	END IF;
    
END//

DELIMITER ;	

-- procedure tạo seat dựa vào tổng số ghế của máy bay mỗi khi tạo chuyến bay mới
DELIMITER //

CREATE PROCEDURE proc_create_seats_for_flight (
    IN p_flight_id INT,
    IN base_price DECIMAL(15,2)
)
BEGIN
    
    DECLARE total_seats INT;
    DECLARE first_seats INT;
    DECLARE business_seats INT;
    DECLARE economy_seats INT;

    DECLARE i INT DEFAULT 1;
    DECLARE row_num INT;
    DECLARE seat_pos INT;
    DECLARE seat_char CHAR(1);
    
	IF base_price <= 0 THEN 
		SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Price must be greater than 0';
    END IF;
    
    START TRANSACTION;

    -- Lấy total_seats từ plane của flight
    SELECT p.total_seats INTO total_seats
    FROM Flights f
    JOIN Planes p ON f.plane_id = p.id
    WHERE f.id = p_flight_id
    LIMIT 1;

    -- Validate flight tồn tại
    IF total_seats IS NULL THEN
		ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Flight or Plane not found';
    END IF;

    -- Tránh tạo trùng seats
    IF EXISTS (
        SELECT 1 FROM Seats WHERE flight_id = p_flight_id
    ) THEN
		ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Seats already created for this flight';
    END IF;

    -- Tính số ghế theo %
    SET first_seats = FLOOR(total_seats * 0.1);
    SET business_seats = FLOOR(total_seats * 0.2);
    SET economy_seats = total_seats - first_seats - business_seats;

    -- Loop tạo ghế
    WHILE i <= total_seats DO

        SET row_num = CEIL(i / 6.0);
        SET seat_pos = (i - 1) % 6;
        SET seat_char = CHAR(65 + seat_pos); -- A-F

        INSERT INTO Seats (
            flight_id,
            seat_number,
            price,
            class,
            status
        )
        VALUES (
            p_flight_id,
            CONCAT(row_num, seat_char),
            CASE
                WHEN i <= first_seats THEN base_price * 2
                WHEN i <= first_seats + business_seats THEN base_price * 1.5
                ELSE base_price
            END,
            CASE
                WHEN i <= first_seats THEN 'FIRST'
                WHEN i <= first_seats + business_seats THEN 'BUSINESS'
                ELSE 'ECONOMY'
            END,
            'AVAILABLE'
        );

        SET i = i + 1;
    END WHILE;
    
    COMMIT;

END//

DELIMITER ;


-- trigger tự động cập nhật chặng bay cho loyalty khi hoàn thành thanh toán đặt chuyến bay 
DELIMITER //

CREATE TRIGGER trg_update_loyalty_after_payment
AFTER UPDATE ON Payments
FOR EACH ROW
BEGIN

	DECLARE v_total_miles   DECIMAL(15,2);
	DECLARE v_total_points  DECIMAL(15,2);
	DECLARE v_passenger_id  INT;
	
    IF NEW.status = 'SUCCEED' AND OLD.status <> 'SUCCEED' THEN
    
        SELECT 
            SUM(f.distance),
            SUM(
                CASE 
                    WHEN s.class = 'ECONOMY'   THEN f.distance * 0.8
                    WHEN s.class = 'BUSINESS'  THEN f.distance * 1.3
                    WHEN s.class = 'FIRST'     THEN f.distance * 2.0
                    ELSE 0
                END
            ),
            MAX(t.buyer_id)
        INTO 
            v_total_miles,
            v_total_points,
            v_passenger_id
        FROM Tickets t
        JOIN bookings b     ON t.booking_id = b.id
        JOIN seats s        ON t.seat_id = s.id
        JOIN Flights f      ON b.flight_id = f.id
        WHERE b.id = NEW.booking_id; -- booking_id của Payments 
        
        
        UPDATE loyalty
        SET 
            miles_traveled = miles_traveled + IFNULL(v_total_miles, 0),
            points = points + IFNULL(v_total_points, 0)
        WHERE passenger_id = v_passenger_id;
    
    END IF;
    
END//

DELIMITER ;


