CREATE DATABASE IF NOT EXISTS flight_booking;
USE flight_booking;

CREATE TABLE IF NOT EXISTS Users (
    id          INT                                         PRIMARY KEY AUTO_INCREMENT,
    username    VARCHAR(255)                                UNIQUE  NOT NULL,
    password    VARCHAR(255)                                NOT NULL,
    created_at  DATETIME                                    DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME                                    DEFAULT CURRENT_TIMESTAMP   ON UPDATE CURRENT_TIMESTAMP,
    is_deleted  BOOLEAN                                     DEFAULT 0,
    role        ENUM('ADMIN','GATE_AGENT', 'PASSENGER')     NOT NULL,

    INDEX idx_users_not_deleted (is_deleted)
);

CREATE TABLE IF NOT EXISTS Airports (
    id          INT                                         PRIMARY KEY AUTO_INCREMENT,
    iata_code   VARCHAR(3)                                  UNIQUE,
    name        VARCHAR(255),
    city        VARCHAR(255),
    region      ENUM('SOUTHERN', 'NORTHERN', 'CENTRAL')     NOT NULL,
    status      ENUM('ACTIVE', 'LOCKED')                    DEFAULT 'ACTIVE' NOT NULL,
    created_at  DATETIME                                    DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME                                    DEFAULT CURRENT_TIMESTAMP   ON UPDATE CURRENT_TIMESTAMP,
    is_deleted  BOOLEAN                                     DEFAULT 0
);

CREATE TABLE IF NOT EXISTS Airlines (
    id          INT                         PRIMARY KEY AUTO_INCREMENT,
    code        VARCHAR(5)                  UNIQUE,
    name        VARCHAR(255),
    created_at  DATETIME                    DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME                    DEFAULT CURRENT_TIMESTAMP   ON UPDATE CURRENT_TIMESTAMP,
    is_deleted  BOOLEAN                     DEFAULT 0,
    status      ENUM('ACTIVE', 'LOCKED')    DEFAULT 'ACTIVE' NOT NULL
);

CREATE TABLE IF NOT EXISTS Loyalty (
    id              INT             PRIMARY KEY AUTO_INCREMENT,
    passenger_id    INT             NOT NULL UNIQUE,
    miles_traveled  DECIMAL(15,2)   DEFAULT 0 CHECK (miles_traveled >= 0),
    points          DECIMAL(15,2)   DEFAULT 0 CHECK (points >= 0),
    points_used     DECIMAL(15,2)   DEFAULT 0 CHECK (points_used >= 0),
    created_at      DATETIME        DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        DEFAULT CURRENT_TIMESTAMP   ON UPDATE CURRENT_TIMESTAMP,
    
    CHECK (points_used <= points),

    CONSTRAINT fk_Loyalty_passengerID FOREIGN KEY (passenger_id) REFERENCES Users(id)   ON DELETE CASCADE,

    INDEX idx_loyalty_passenger (passenger_id)
);

CREATE TABLE IF NOT EXISTS Planes (
    id          INT             PRIMARY KEY AUTO_INCREMENT,
    airline_id  INT,
    model       VARCHAR(255),
    total_seats INT             CHECK (total_seats > 0),
    created_at  DATETIME        DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        DEFAULT CURRENT_TIMESTAMP   ON UPDATE CURRENT_TIMESTAMP,
    is_deleted  BOOLEAN         DEFAULT 0,
    status      ENUM('ACTIVE', 'MAINTENANCE', 'GROUNDED', 'RETIRED')    DEFAULT 'ACTIVE' NOT NULL,

    CONSTRAINT fk_Planes_airlineID FOREIGN KEY (airline_id) REFERENCES Airlines(id)     ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Flights (
    id                      INT             PRIMARY KEY AUTO_INCREMENT,
    flight_number           VARCHAR(10)      UNIQUE,
    plane_id                INT,
    airline_id              INT,
    departure_airport_id    INT,
    arrival_airport_id      INT,
    distance                DECIMAL(15,2)   CHECK (distance > 0),
    departure_time          DATETIME        NOT NULL,
    arrival_time            DATETIME        NOT NULL,
    created_at              DATETIME        DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME        DEFAULT CURRENT_TIMESTAMP   ON UPDATE CURRENT_TIMESTAMP,
    is_deleted              BOOLEAN         DEFAULT 0,
    status                  ENUM('WAITING','DELAYED','CANCELED','IN_PROGRESS','COMPLETED') DEFAULT 'WAITING' NOT NULL,

    CHECK (arrival_time > departure_time),

    CONSTRAINT fk_Flights_planeID               FOREIGN KEY (plane_id)                REFERENCES Planes(id)      ON DELETE SET NULL,
    CONSTRAINT fk_Flights_airlineID             FOREIGN KEY (airline_id)              REFERENCES Airlines(id)    ON DELETE SET NULL,
    CONSTRAINT fk_Flights_departureAirportID    FOREIGN KEY (departure_airport_id)    REFERENCES Airports(id)    ON DELETE SET NULL,
    CONSTRAINT fk_Flights_arrivalAirportID      FOREIGN KEY (arrival_airport_id)      REFERENCES Airports(id)    ON DELETE SET NULL,

    INDEX idx_flights_search    (departure_airport_id, arrival_airport_id, departure_time),
    INDEX idx_flights_time      (departure_time)
);

CREATE TABLE IF NOT EXISTS Bookings (
    id              INT             PRIMARY KEY AUTO_INCREMENT,
    flight_id       INT             NOT NULL,
    booking_date    DATE            NOT NULL,
    total_amount    DECIMAL(15,2)   CHECK (total_amount > 0),
    created_at      DATETIME        DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        DEFAULT CURRENT_TIMESTAMP   ON UPDATE CURRENT_TIMESTAMP,
    status          ENUM('PENDING', 'SUCCEED', 'FAILED')        DEFAULT 'PENDING' NOT NULL,

    CONSTRAINT fk_Bookings_flightID FOREIGN KEY (flight_id) REFERENCES Flights(id)   ON DELETE RESTRICT,

    INDEX idx_bookings_flight (flight_id),
    INDEX idx_bookings_status (status)
);

CREATE TABLE IF NOT EXISTS Payments (
    id              INT             PRIMARY KEY AUTO_INCREMENT,
    booking_id      INT             NOT NULL,
    transaction_id  VARCHAR(255)    NOT NULL    UNIQUE,
    amount          DECIMAL(15,2)   CHECK (amount > 0),
    created_at      DATETIME        DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        DEFAULT CURRENT_TIMESTAMP   ON UPDATE CURRENT_TIMESTAMP,
    payment_method  ENUM('BANKING', 'VISA', 'CREDIT_CARD') NOT NULL,
    status          ENUM('PENDING', 'SUCCEED', 'FAILED', 'OUT_OF_TIME') NOT NULL,

    CONSTRAINT fk_Payments_bookingID FOREIGN KEY (booking_id) REFERENCES Bookings(id)   ON DELETE RESTRICT,

    INDEX idx_payments_booking  (booking_id),
    INDEX idx_payments_status   (status)
);

CREATE TABLE IF NOT EXISTS Seats (
    id              INT             PRIMARY KEY AUTO_INCREMENT,
    flight_id       INT             NOT NULL,
    seat_number     VARCHAR(5)      NOT NULL,
    price           DECIMAL(15,2)   CHECK (price > 0),
    created_at      DATETIME        DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        DEFAULT CURRENT_TIMESTAMP   ON UPDATE CURRENT_TIMESTAMP,
    class           ENUM('ECONOMY', 'BUSINESS', 'FIRST') NOT NULL,
    status          ENUM('AVAILABLE', 'RESERVED', 'PAID') NOT NULL,

    UNIQUE (flight_id, seat_number),

    CONSTRAINT fk_Seats_flightID FOREIGN KEY (flight_id) REFERENCES Flights(id)  ON DELETE RESTRICT,

    INDEX idx_seats_flight_status (flight_id, status)
);

CREATE TABLE IF NOT EXISTS Tickets (
    id                      INT             PRIMARY KEY AUTO_INCREMENT,
    ticket_number           VARCHAR(20)     UNIQUE,
    booking_id              INT             NOT NULL,
    seat_id                 INT             UNIQUE,
    buyer_id                INT,
    passenger_lastname      VARCHAR(255),
    passenger_firstname     VARCHAR(255),
    passenger_id_card       VARCHAR(12),
    issue_date              DATE,
    final_price             DECIMAL(15,2)   CHECK (final_price > 0),
    created_at              DATETIME        DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME        DEFAULT CURRENT_TIMESTAMP   ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('PENDING','ACTIVE','USED','EXPIRED') NOT NULL,

    CONSTRAINT fk_Tickets_buyerID   FOREIGN KEY (buyer_id)    REFERENCES Users(id)       ON DELETE SET NULL,
    CONSTRAINT fk_Tickets_seatID    FOREIGN KEY (seat_id)     REFERENCES Seats(id)       ON DELETE RESTRICT,
    CONSTRAINT fk_Tickets_bookingID FOREIGN KEY (booking_id)  REFERENCES Bookings(id)    ON DELETE RESTRICT,

    INDEX idx_tickets_booking   (booking_id),
    INDEX idx_tickets_buyer     (buyer_id),
    INDEX idx_tickets_seat      (seat_id)
);