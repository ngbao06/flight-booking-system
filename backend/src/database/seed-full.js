import mongoose from 'mongoose';
import { query } from './mysql/conn.js';
import pool from './mysql/conn.js';
import { connectMongo } from './mongodb/conn.js';
import PassengerProfile from './mongodb/schemas/passengers_profile.js';
import bcrypt from 'bcrypt';


const pad2 = (value) => String(value).padStart(2, '0');

const slugify = (value) => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const toDateString = (date) => `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
const toDateTimeString = (date) => `${toDateString(date)} ${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}:${pad2(date.getUTCSeconds())}`;

const addDays = (date, days) => {
    const nextDate = new Date(date);
    nextDate.setUTCDate(nextDate.getUTCDate() + days);
    return nextDate;
};

const addMinutes = (date, minutes) => {
    const nextDate = new Date(date);
    nextDate.setUTCMinutes(nextDate.getUTCMinutes() + minutes);
    return nextDate;
};

const setTimeUTC = (date, timeString) => {
    const [hour, minute, second] = timeString.split(':').map(Number);
    const nextDate = new Date(date);
    nextDate.setUTCHours(hour, minute, second ?? 0, 0);
    return nextDate;
};

const truncateTables = async () => {
    await query('SET FOREIGN_KEY_CHECKS = 0');
    await query('TRUNCATE TABLE Tickets');
    await query('TRUNCATE TABLE Payments');
    await query('TRUNCATE TABLE Bookings');
    await query('TRUNCATE TABLE Seats');
    await query('TRUNCATE TABLE Flights');
    await query('TRUNCATE TABLE Planes');
    await query('TRUNCATE TABLE UserVouchers');
    await query('TRUNCATE TABLE Vouchers');
    await query('TRUNCATE TABLE Loyalty');
    await query('TRUNCATE TABLE Airlines');
    await query('TRUNCATE TABLE Airports');
    await query('TRUNCATE TABLE Users');
    await query('SET FOREIGN_KEY_CHECKS = 1');
    await PassengerProfile.deleteMany({});
};

const now = new Date();
const startSeedDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
const endSeedDate = new Date(startSeedDate);
endSeedDate.setUTCDate(startSeedDate.getUTCDate() + 15);
const seedDayCount = Math.floor((endSeedDate - startSeedDate) / 86_400_000) + 1;

const dtFor = (index, minuteOffset = 0) => toDateTimeString(addMinutes(addDays(startSeedDate, index % seedDayCount), minuteOffset));


const airportSeed = [
    { iata_code: 'BMV', name: 'Sân bay Buôn Ma Thuột', city: 'Đắk Lắk', region: 'CENTRAL', status: 'ACTIVE' },
    { iata_code: 'SGN', name: 'Sân bay Tân Sơn Nhất', city: 'Thành phố Hồ Chí Minh', region: 'SOUTHERN', status: 'ACTIVE' },
    { iata_code: 'HAN', name: 'Sân bay Nội Bài', city: 'Hà Nội', region: 'NORTHERN', status: 'ACTIVE' },
    { iata_code: 'DAD', name: 'Sân bay Đà Nẵng', city: 'Đà Nẵng', region: 'CENTRAL', status: 'ACTIVE' },
    { iata_code: 'CXR', name: 'Sân bay Cam Ranh', city: 'Khánh Hòa', region: 'CENTRAL', status: 'ACTIVE' },
    { iata_code: 'PQC', name: 'Sân bay Phú Quốc', city: 'Kiên Giang', region: 'SOUTHERN', status: 'ACTIVE' },
    { iata_code: 'HPH', name: 'Sân bay Cát Bi', city: 'Hải Phòng', region: 'NORTHERN', status: 'ACTIVE' },
    { iata_code: 'VCA', name: 'Sân bay Cần Thơ', city: 'Cần Thơ', region: 'SOUTHERN', status: 'ACTIVE' },
    { iata_code: 'HUI', name: 'Sân bay Phú Bài', city: 'Huế', region: 'CENTRAL', status: 'ACTIVE' },
    { iata_code: 'VII', name: 'Sân bay Vinh', city: 'Nghệ An', region: 'CENTRAL', status: 'ACTIVE' },
    { iata_code: 'THD', name: 'Sân bay Thọ Xuân', city: 'Thanh Hóa', region: 'NORTHERN', status: 'ACTIVE' },
    { iata_code: 'VDH', name: 'Sân bay Đồng Hới', city: 'Quảng Bình', region: 'CENTRAL', status: 'ACTIVE' },
    { iata_code: 'VCL', name: 'Sân bay Chu Lai', city: 'Quảng Nam', region: 'CENTRAL', status: 'ACTIVE' },
    { iata_code: 'UIH', name: 'Sân bay Phù Cát', city: 'Bình Định', region: 'CENTRAL', status: 'ACTIVE' },
    { iata_code: 'DLI', name: 'Sân bay Liên Khương', city: 'Lâm Đồng', region: 'CENTRAL', status: 'LOCKED' },
    { iata_code: 'PXU', name: 'Sân bay Pleiku', city: 'Gia Lai', region: 'CENTRAL', status: 'ACTIVE' },
    { iata_code: 'TBB', name: 'Sân bay Tuy Hòa', city: 'Phú Yên', region: 'CENTRAL', status: 'ACTIVE' },
    { iata_code: 'VDO', name: 'Sân bay Vân Đồn', city: 'Quảng Ninh', region: 'NORTHERN', status: 'LOCKED' },
    { iata_code: 'CAH', name: 'Sân bay Cà Mau', city: 'Cà Mau', region: 'SOUTHERN', status: 'ACTIVE' },
    { iata_code: 'VKG', name: 'Sân bay Rạch Giá', city: 'Kiên Giang', region: 'SOUTHERN', status: 'ACTIVE' },
    { iata_code: 'VCS', name: 'Sân bay Côn Đảo', city: 'Bà Rịa - Vũng Tàu', region: 'SOUTHERN', status: 'ACTIVE' },
    { iata_code: 'DIN', name: 'Sân bay Điện Biên Phủ', city: 'Điện Biên', region: 'NORTHERN', status: 'ACTIVE' }
];

const airlineSeed = [
    { code: 'VNA', name: 'Vietnam Airlines', status: 'ACTIVE' },
    { code: 'VJC', name: 'VietJet Air', status: 'ACTIVE' },
    { code: 'BBA', name: 'Bamboo Airways', status: 'ACTIVE' },
    { code: 'PAC', name: 'Pacific Airlines', status: 'ACTIVE' },
    { code: 'VAS', name: 'VASCO', status: 'ACTIVE' },
    { code: 'VTA', name: 'Vietravel Airlines', status: 'ACTIVE' },
    { code: 'SST', name: 'SunSky Transport', status: 'ACTIVE' },
    { code: 'MEK', name: 'Mekong Air', status: 'ACTIVE' }
];

const planeLibrary = [
    { model: 'Airbus A321neo', total_seats: 220 },
    { model: 'Boeing 787-9', total_seats: 294 },
    { model: 'Airbus A350-900', total_seats: 305 },
    { model: 'Airbus A320', total_seats: 180 },
    { model: 'Airbus A321', total_seats: 230 },
    { model: 'Airbus A319', total_seats: 144 },
    { model: 'Embraer E195', total_seats: 120 },
    { model: 'ATR 72-600', total_seats: 70 },
    { model: 'Boeing 737-800', total_seats: 189 },
    { model: 'Airbus A320neo', total_seats: 186 },
    { model: 'Airbus A321LR', total_seats: 220 },
    { model: 'Airbus A330-300', total_seats: 280 }
];

const routeCatalog = {
    'SGN-HAN': { departure: 'SGN', arrival: 'HAN', distance: 447, durationMinutes: 125, hot: true },
    'HAN-SGN': { departure: 'HAN', arrival: 'SGN', distance: 447, durationMinutes: 125, hot: true },
    'SGN-DAD': { departure: 'SGN', arrival: 'DAD', distance: 378, durationMinutes: 95 },
    'DAD-SGN': { departure: 'DAD', arrival: 'SGN', distance: 378, durationMinutes: 95 },
    'SGN-CXR': { departure: 'SGN', arrival: 'CXR', distance: 218, durationMinutes: 70 },
    'CXR-SGN': { departure: 'CXR', arrival: 'SGN', distance: 218, durationMinutes: 70 },
    'SGN-PQC': { departure: 'SGN', arrival: 'PQC', distance: 165, durationMinutes: 60 },
    'PQC-SGN': { departure: 'PQC', arrival: 'SGN', distance: 165, durationMinutes: 60 },
    'SGN-HPH': { departure: 'SGN', arrival: 'HPH', distance: 692, durationMinutes: 135 },
    'HPH-SGN': { departure: 'HPH', arrival: 'SGN', distance: 692, durationMinutes: 135 },
    'SGN-HUI': { departure: 'SGN', arrival: 'HUI', distance: 318, durationMinutes: 85 },
    'HUI-SGN': { departure: 'HUI', arrival: 'SGN', distance: 318, durationMinutes: 85 },
    'SGN-VCA': { departure: 'SGN', arrival: 'VCA', distance: 84, durationMinutes: 45 },
    'VCA-SGN': { departure: 'VCA', arrival: 'SGN', distance: 84, durationMinutes: 45 },
    'SGN-VKG': { departure: 'SGN', arrival: 'VKG', distance: 235, durationMinutes: 70 },
    'VKG-SGN': { departure: 'VKG', arrival: 'SGN', distance: 235, durationMinutes: 70 },
    'SGN-PXU': { departure: 'SGN', arrival: 'PXU', distance: 173, durationMinutes: 55 },
    'PXU-SGN': { departure: 'PXU', arrival: 'SGN', distance: 173, durationMinutes: 55 },
    'SGN-TBB': { departure: 'SGN', arrival: 'TBB', distance: 275, durationMinutes: 70 },
    'TBB-SGN': { departure: 'TBB', arrival: 'SGN', distance: 275, durationMinutes: 70 },
    'SGN-VII': { departure: 'SGN', arrival: 'VII', distance: 465, durationMinutes: 105 },
    'VII-SGN': { departure: 'VII', arrival: 'SGN', distance: 465, durationMinutes: 105 },
    'SGN-CAH': { departure: 'SGN', arrival: 'CAH', distance: 184, durationMinutes: 60 },
    'CAH-SGN': { departure: 'CAH', arrival: 'SGN', distance: 184, durationMinutes: 60 },
    'SGN-VCS': { departure: 'SGN', arrival: 'VCS', distance: 158, durationMinutes: 50 },
    'VCS-SGN': { departure: 'VCS', arrival: 'SGN', distance: 158, durationMinutes: 50 },
    'SGN-DIN': { departure: 'SGN', arrival: 'DIN', distance: 350, durationMinutes: 90 },
    'DIN-SGN': { departure: 'DIN', arrival: 'SGN', distance: 350, durationMinutes: 90 },
    'SGN-BMV': { departure: 'SGN', arrival: 'BMV', distance: 205, durationMinutes: 65 },
    'BMV-SGN': { departure: 'BMV', arrival: 'SGN', distance: 205, durationMinutes: 65 }
};

const airlineRouteTemplates = {
    VNA: ['SGN-HAN', 'HAN-SGN', 'SGN-DAD', 'DAD-SGN'],
    VJC: ['SGN-HAN', 'HAN-SGN', 'SGN-CXR', 'CXR-SGN'],
    BBA: ['SGN-HAN', 'HAN-SGN', 'SGN-PQC', 'PQC-SGN'],
    PAC: ['SGN-HAN', 'HAN-SGN', 'SGN-HPH', 'HPH-SGN'],
    VAS: ['SGN-HAN', 'HAN-SGN', 'SGN-HUI', 'HUI-SGN'],
    VTA: ['SGN-HAN', 'HAN-SGN', 'SGN-VCA', 'VCA-SGN'],
    SST: ['SGN-HAN', 'HAN-SGN', 'SGN-PXU', 'PXU-SGN'],
    MEK: ['SGN-HAN', 'HAN-SGN', 'SGN-VKG', 'VKG-SGN']
};

const hashed = bcrypt.hashSync('123456', 10);

const adminUsers = [
    { username: 'admin', password: hashed, role: 'ADMIN' },
];

const gateUsers = [
    { username: 'gate_sgn_01', password: hashed, role: 'GATE_AGENT' },
    { username: 'gate_sgn_02', password: hashed, role: 'GATE_AGENT' },
    { username: 'gate_han_01', password: hashed, role: 'GATE_AGENT' },
    { username: 'gate_dad_01', password: hashed, role: 'GATE_AGENT' },
    { username: 'gate_cxr_01', password: hashed, role: 'GATE_AGENT' },
    { username: 'gate_hph_01', password: hashed, role: 'GATE_AGENT' },
    { username: 'gate_pqc_01', password: hashed, role: 'GATE_AGENT' },
    { username: 'gate_vca_01', password: hashed, role: 'GATE_AGENT' }
];

const passengerProfilesSeed = [
    ['Nguyễn An', 'Quận 1, Thành phố Hồ Chí Minh'],
    ['Trần Bình', 'Ba Đình, Hà Nội'],
    ['Lê Châu', 'Hải Châu, Đà Nẵng'],
    ['Phạm Duy', 'Nha Trang, Khánh Hòa'],
    ['Hoàng Emy', 'Ninh Kiều, Cần Thơ'],
    ['Vũ Fred', 'Biên Hòa, Đồng Nai'],
    ['Bùi Giang', 'Thủ Đức, Thành phố Hồ Chí Minh'],
    ['Đặng Hiếu', 'Hưng Yên'],
    ['Đỗ Iris', 'Hải Phòng'],
    ['Ngô Khánh', 'Huế, Thừa Thiên Huế'],
    ['Mai Linh', 'Vinh, Nghệ An'],
    ['Lâm Minh', 'Buôn Ma Thuột, Đắk Lắk'],
    ['Cao Nam', 'Quy Nhơn, Bình Định'],
    ['Phùng Oanh', 'Thanh Hóa'],
    ['Quách Phúc', 'Cà Mau'],
    ['Trương Quỳnh', 'Pleiku, Gia Lai'],
    ['Tạ Ryan', 'Rạch Giá, Kiên Giang'],
    ['Đinh Sơn', 'Đồng Hới, Quảng Bình'],
    ['Lưu Thảo', 'Tam Kỳ, Quảng Nam'],
    ['Phan Uyên', 'Phú Yên'],
    ['Hồ Vinh', 'Côn Đảo, Bà Rịa - Vũng Tàu'],
    ['Hà Will', 'Điện Biên Phủ, Điện Biên'],
    ['Huỳnh Yến', 'Thành phố Hồ Chí Minh'],
    ['Kiều Xuân', 'Hà Nội'],
    ['Lý Zoe', 'Đà Nẵng'],
    ['Tôn Long', 'Khánh Hòa'],
    ['Bảo Mint', 'Phú Quốc, Kiên Giang'],
    ['Đoàn Neo', 'Cần Thơ'],
    ['Mạc Olive', 'Quảng Ninh'],
    ['Tống Paul', 'Lâm Đồng'],
    ['Võ Quinn', 'Thanh Hóa'],
    ['Dương Rose', 'Quảng Nam'],
    ['Đào Sky', 'Bình Định'],
    ['Trịnh Tina', 'Quảng Ngãi'],
    ['Triệu Una', 'Bình Thuận'],
    ['Châu Vera', 'Bến Tre'],
    ['Khúc Wren', 'Tiền Giang'],
    ['Nguyễn Bảo', 'Long An'],
    ['Lê Hạnh', 'An Giang'],
    ['Phan Khải', 'Sóc Trăng']
];

const passengerUsers = passengerProfilesSeed.map(([fullName, address], index) => ({
    username: slugify(fullName),
    password: hashed,
    role: 'PASSENGER',
    fullName,
    address
}));

const allUsers = [...adminUsers, ...gateUsers, ...passengerUsers];

const passengerMeals = ['Hải sản', 'Suất chay', 'Ẩm thực Việt', 'Món không gluten', 'Bữa nhẹ'];
const passengerSeats = ['window', 'aisle', 'none'];
const paymentMethods = ['BANKING', 'VISA', 'CREDIT_CARD'];
const flightHotSlots = ['06:00:00', '11:30:00'];
const flightRegularSlots = ['16:15:00', '20:20:00'];
const voucherSeed = [
    ['NGUOIMOI2026', 'PERCENT', 0.26, 500000, '2026-01-01', '2026-12-31', null],
    ['5KPOINTS', 'PERCENT', 0.05, 50000, '2026-01-01', '2026-12-31', 5000],
    ['10KPOINTS', 'PERCENT', 0.1, 100000, '2026-01-01', '2026-12-31', 10000],
    ['20KPOINTS', 'PERCENT', 0.2, 200000, '2026-01-01', '2026-12-31', 20000],
    ['MUAHE2026', 'PERCENT', 0.15, 200000, '2026-01-01', '2026-12-31', 3000]
];

const insertRow = async (sql, values) => {
    const [result] = await query(sql, values);
    return result;
};

const hasExistingSeedData = async () => {
    const [rows] = await query('SELECT COUNT(*) AS total FROM Users');
    return Number(rows?.[0]?.total || 0) > 0;
};

const seedUsers = async () => {
    const insertedUsers = [];

    for (let i = 0; i < allUsers.length; i += 1) {
        const user = allUsers[i];
        const createdAt = dtFor(i, (i * 37) % 1440);
        const result = await insertRow(
            'INSERT INTO Users (username, password, role, created_at) VALUES (?, ?, ?, ?)',
            [user.username, user.password, user.role, createdAt]
        );

        insertedUsers.push({ ...user, id: result.insertId, created_at: createdAt });
    }

    return insertedUsers;
};

const seedVouchers = async () => {
    for (const voucher of voucherSeed) {
        await insertRow(
            `
            INSERT INTO Vouchers (
                code, discount_type, discount_value, max_discount, valid_from, valid_to, point_cost
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            voucher
        );
    }
};

const seedLoyalty = async (users) => {
    for (const user of users.filter((item) => item.role === 'PASSENGER')) {
        const createdAt = dtFor(user.id || 0, 15);
        await insertRow(
            `
            INSERT INTO Loyalty (passenger_id, miles_traveled, points, points_used, created_at)
            VALUES (?, 0, 0, 0, ?)
            ON DUPLICATE KEY UPDATE
                miles_traveled = VALUES(miles_traveled),
                points = VALUES(points),
                points_used = VALUES(points_used)
            `,
            [user.id, createdAt]
        );
    }
};

const seedPassengerProfiles = async (users) => {
    const passengerUsersWithId = users.filter((user) => user.role === 'PASSENGER');

    const passengerDocs = passengerUsersWithId.map((user, index) => ({
        _id: user.id,
        full_name: passengerProfilesSeed[index][0],
        avatar_url: null,
        contact: {
            email: `${user.username}@lotusair.vn`,
            phone: `09${String(10000000 + index).padStart(8, '0')}`,
            address: passengerProfilesSeed[index][1]
        },
        passport: {
            number: `P${String(2027000000 + index)}`,
            expiry_date: new Date(Date.UTC(2032, index % 12, 1)),
            nationality: 'Việt Nam'
        },
        preferences: {
            meal: passengerMeals[index % passengerMeals.length],
            seat_position: passengerSeats[index % passengerSeats.length]
        }
    ,
        created_at: dtFor(index, 30),
        updated_at: dtFor(index, 30)
    }));

    await PassengerProfile.insertMany(passengerDocs, { ordered: true });
};

const seedAirports = async () => {
    const airportIdByCode = new Map();

    for (let i = 0; i < airportSeed.length; i += 1) {
        const airport = airportSeed[i];
        const createdAt = dtFor(i, i * 7 % 1440);
        const result = await insertRow(
            'INSERT INTO Airports (iata_code, name, city, region, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            [airport.iata_code, airport.name, airport.city, airport.region, airport.status, createdAt]
        );

        airportIdByCode.set(airport.iata_code, result.insertId);
    }

    return airportIdByCode;
};

const seedAirlines = async () => {
    const airlineIdByCode = new Map();

    for (let i = 0; i < airlineSeed.length; i += 1) {
        const airline = airlineSeed[i];
        const createdAt = dtFor(i + 2, i * 11 % 1440);
        const result = await insertRow(
            'INSERT INTO Airlines (code, name, status, created_at) VALUES (?, ?, ?, ?)',
            [airline.code, airline.name, airline.status, createdAt]
        );

        airlineIdByCode.set(airline.code, result.insertId);
    }

    return airlineIdByCode;
};

const seedPlanes = async (airlineIdByCode) => {
    const planeIdsByAirline = new Map();
    const statusPattern = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'MAINTENANCE', 'MAINTENANCE', 'MAINTENANCE', 'GROUNDED', 'GROUNDED', 'GROUNDED', 'RETIRED', 'RETIRED'];

    for (const airline of airlineSeed) {
        const airlineId = airlineIdByCode.get(airline.code);
        const airlinePlaneIds = [];

        for (let index = 0; index < 12; index += 1) {
            const model = planeLibrary[(index + airline.code.charCodeAt(0)) % planeLibrary.length];
            const createdAt = dtFor(airline.code.charCodeAt(0) + index, (index * 13) % 1440);
            const result = await insertRow(
                'INSERT INTO Planes (airline_id, model, total_seats, status, created_at) VALUES (?, ?, ?, ?, ?)',
                [airlineId, `${model.model} ${airline.code}-${pad2(index + 1)}`, model.total_seats, statusPattern[index], createdAt]
            );

            airlinePlaneIds.push({
                id: result.insertId,
                airlineId,
                model: `${model.model} ${airline.code}-${pad2(index + 1)}`,
                totalSeats: model.total_seats,
                status: statusPattern[index]
            });
        }

        planeIdsByAirline.set(airline.code, airlinePlaneIds);
    }

    return planeIdsByAirline;
};

const buildFlightNumber = (airlineCode, date, planeIndex) => `${airlineCode}${pad2(date.getUTCMonth() + 1)}${pad2(date.getUTCDate())}${planeIndex + 1}`;

const seedFlightsAndSeats = async (airlineIdByCode, airportIdByCode, planeIdsByAirline) => {
    const flightRecords = [];
    const now = new Date();
    const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const endDate = new Date(startSeedDate);
    endDate.setUTCDate(startSeedDate.getUTCDate() + 15);
    const dayCount = Math.floor((endDate - startDate) / 86_400_000) + 1;

    for (let dayIndex = 0; dayIndex < dayCount; dayIndex += 1) {
        const flightDate = addDays(startDate, dayIndex);

        for (const [airlineIndex, airline] of airlineSeed.entries()) {
            const airlineId = airlineIdByCode.get(airline.code);
            const activePlanes = planeIdsByAirline.get(airline.code).filter((plane) => plane.status === 'ACTIVE').slice(0, 4);
            const routeTemplate = airlineRouteTemplates[airline.code];

            for (let planeIndex = 0; planeIndex < activePlanes.length; planeIndex += 1) {
                const plane = activePlanes[planeIndex];
                const routeKey = routeTemplate[planeIndex];
                const route = routeCatalog[routeKey];
                const flightNumber = buildFlightNumber(airline.code, flightDate, planeIndex);
                const slot = route.hot ? flightHotSlots[planeIndex % flightHotSlots.length] : flightRegularSlots[planeIndex % flightRegularSlots.length];
                const departureTime = addMinutes(setTimeUTC(flightDate, slot), airlineIndex * 4);
                const arrivalTime = addMinutes(departureTime, route.durationMinutes);
                const basePrice = Math.round((route.distance * 2400) + (airlineIndex * 30000) + (dayIndex * 2500) + (planeIndex * 12000));

                const flightCreatedAt = toDateTimeString(addMinutes(addDays(flightDate, -(1 + (planeIndex % 3))), (airlineIndex * 13 + planeIndex * 7) % 1440));
                const flightResult = await insertRow(
                    `
                    INSERT INTO Flights (
                        flight_number, plane_id, airline_id, departure_airport_id, arrival_airport_id,
                        distance, departure_time, arrival_time, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                    [
                        flightNumber,
                        plane.id,
                        airlineId,
                        airportIdByCode.get(route.departure),
                        airportIdByCode.get(route.arrival),
                        route.distance,
                        toDateTimeString(departureTime),
                        toDateTimeString(arrivalTime),
                        flightCreatedAt
                    ]
                );

                await insertRow('CALL proc_create_seats_for_flight(?, ?)', [flightResult.insertId, basePrice]);
                await insertRow('UPDATE Seats SET created_at = ? WHERE flight_id = ?', [flightCreatedAt, flightResult.insertId]);

                flightRecords.push({
                    id: flightResult.insertId,
                    flightNumber,
                    airlineCode: airline.code,
                    airlineId,
                    planeId: plane.id,
                    routeKey,
                    route,
                    basePrice,
                    departureTime,
                    arrivalTime,
                    flightDate,
                    isHotRoute: route.hot === true,
                    airlineIndex,
                    planeIndex,
                    dayIndex
                });
            }
        }
    }

    return flightRecords;
};

const seedBookingsPaymentsTickets = async (flightRecords, users) => {
    const passengerUsers = users.filter((user) => user.role === 'PASSENGER');
    const passengerIds = passengerUsers.map((user) => user.id);
    const paymentUpdates = [];
    let bookingSequence = 1;
    let ticketSequence = 1;

    for (const [flightIndex, flight] of flightRecords.entries()) {
        const seatCountResult = await query(
            `
            SELECT id, seat_number, price
            FROM Seats
            WHERE flight_id = ?
            ORDER BY id
            `,
            [flight.id]
        );
        const seatRows = seatCountResult[0];
        const bookingCount = flight.isHotRoute ? 3 : 2;
        const seatAssignments = seatRows.slice(0, bookingCount);

        for (let bookingIndex = 0; bookingIndex < bookingCount; bookingIndex += 1) {
            const assignedSeat = seatAssignments[bookingIndex];
            const passengerId = passengerIds[(flightIndex + bookingIndex) % passengerIds.length];
            const bookingDate = toDateString(addDays(flight.flightDate, -(2 + ((flightIndex + bookingIndex) % 7))));
            const totalAmount = assignedSeat ? Math.round(Number(assignedSeat.price)) : Math.round(flight.basePrice);

            const bookingCreatedAtDate = setTimeUTC(new Date(bookingDate + 'T00:00:00Z'), '09:00:00');
            const bookingCreatedAt = toDateTimeString(addMinutes(bookingCreatedAtDate, (bookingSequence * 11) % 420));
            const bookingResult = await insertRow(
                'INSERT INTO Bookings (flight_id, booking_date, total_amount, status, created_at) VALUES (?, ?, ?, ?, ?)',
                [flight.id, bookingDate, totalAmount, 'PENDING', bookingCreatedAt]
            );

            const paymentCreatedAt = toDateTimeString(addMinutes(new Date(bookingCreatedAt.replace(' ', 'T') + 'Z'), 5 + (bookingSequence % 30)));
            const paymentResult = await insertRow(
                'INSERT INTO Payments (booking_id, transaction_id, amount, payment_method, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    bookingResult.insertId,
                    `TXN-${pad2(flight.flightDate.getUTCMonth() + 1)}${pad2(flight.flightDate.getUTCDate())}-${String(bookingSequence).padStart(6, '0')}`,
                    totalAmount,
                    paymentMethods[(bookingSequence - 1) % paymentMethods.length],
                    'PENDING',
                    paymentCreatedAt
                ]
            );

            const finalStatus = bookingIndex === 0
                ? 'SUCCEED'
                : bookingIndex === 1
                    ? (flightIndex % 3 === 0 ? 'PENDING' : 'FAILED')
                    : (flightIndex % 2 === 0 ? 'SUCCEED' : 'OUT_OF_TIME');

            if (finalStatus === 'SUCCEED') {
                const seat = assignedSeat ?? seatRows[bookingIndex];
                const issueDate = toDateString(addDays(flight.flightDate, 1));
                const ticketCreatedAt = toDateTimeString(setTimeUTC(new Date(issueDate + 'T00:00:00Z'), '10:00:00'));
                const passengerTemplate = passengerProfilesSeed[(flightIndex + bookingIndex) % passengerProfilesSeed.length][0];
                const [surname, givenName] = passengerTemplate.split(' ');

                await insertRow(
                    `
                    INSERT INTO Tickets (
                        ticket_number, booking_id, seat_id, buyer_id, passenger_lastname,
                        passenger_firstname, passenger_id_card, issue_date, final_price, status, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                    [
                        `TK${pad2(flight.flightDate.getUTCFullYear() % 100)}${pad2(flight.flightDate.getUTCMonth() + 1)}${pad2(flight.flightDate.getUTCDate())}${String(ticketSequence).padStart(6, '0')}`,
                        bookingResult.insertId,
                        seat.id,
                        passengerId,
                        surname,
                        givenName,
                        `079${String(100000000 + ticketSequence).slice(-9)}`,
                        issueDate,
                        totalAmount,
                        'ACTIVE',
                        ticketCreatedAt
                    ]
                );

                await insertRow('UPDATE Seats SET status = ? WHERE id = ?', ['PAID', seat.id]);
                paymentUpdates.push({ paymentId: paymentResult.insertId, status: 'SUCCEED' });
                ticketSequence += 1;
            } else if (finalStatus === 'PENDING') {
                if (assignedSeat) {
                    await insertRow('UPDATE Seats SET status = ? WHERE id = ?', ['RESERVED', assignedSeat.id]);
                }

                paymentUpdates.push({ paymentId: paymentResult.insertId, status: 'PENDING' });
            } else {
                paymentUpdates.push({ paymentId: paymentResult.insertId, status: finalStatus });
            }

            bookingSequence += 1;
        }
    }

    for (const update of paymentUpdates) {
        if (update.status !== 'PENDING') {
            await insertRow('UPDATE Payments SET status = ? WHERE id = ?', [update.status, update.paymentId]);
        }
    }
};

const main = async () => {
    await connectMongo();

    if (await hasExistingSeedData()) {
        console.log('Seed skipped: existing data detected');
        return;
    }

    await truncateTables();

    
    console.log('seed vouchers');
    await seedVouchers();

    console.log('seed users');
    const users = await seedUsers();
    
    console.log('seed loyalty users');
    await seedLoyalty(users);
    
    console.log('seed passenger profiles');
    await seedPassengerProfiles(users);
    
    console.log('seed airports');
    const airportIdByCode = await seedAirports();
    
    console.log('seed airlines');
    const airlineIdByCode = await seedAirlines();
    
    console.log('seed planes');
    const planeIdsByAirline = await seedPlanes(airlineIdByCode);
    
    console.log('seed flights, seats');
    const flightRecords = await seedFlightsAndSeats(airlineIdByCode, airportIdByCode, planeIdsByAirline);
    
    console.log('seed bookings, payments, tickets');
    await seedBookingsPaymentsTickets(flightRecords, users);

    console.log(`Seed completed: ${users.length} users, ${flightRecords.length} flights.`);
};

main()
    .catch((error) => {
        console.error('Seed failed:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        try {
            await mongoose.disconnect();
        } catch (error) {
            // ignore disconnect issues
        }

        try {
            await pool.end();
        } catch (error) {
            // ignore pool shutdown issues
        }
    });