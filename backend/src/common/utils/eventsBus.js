import { EventEmitter } from 'events';

// Khởi tạo một instance duy nhất
const eventBus = new EventEmitter();

// (Tùy chọn) Tăng giới hạn listener nếu hệ thống bạn có quá nhiều module lắng nghe
// Mặc định Node.js cảnh báo nếu có > 10 listeners cho 1 sự kiện để chống memory leak
eventBus.setMaxListeners(20);

// Định nghĩa sẵn các hằng số Tên Sự Kiện (Event Names) để tránh gõ sai chính tả (Typo)
export const Events = {

    UPDATE_EVENT: 'UPDATE_EVENT',
    DELETE_EVENT: 'DELETE_EVENT',
    CREATE_EVENT: 'CREATE_EVENT',
    ERROR_EVENT: 'ERROR_EVENT',

    FLIGHT_CREATED: 'FLIGHT_CREATED',
    FLIGHT_UPDATED: 'FLIGHT_UPDATED',
    FLIGHT_DELAYED: 'FLIGHT_DELAYED',
    FLIGHT_CANCELLED: 'FLIGHT_CANCELLED',

    AIRLINE_UPDATED: 'AIRLINE_UPDATED',

    PLANE_UPDATED: 'PLANE_UPDATE',

    SEAT_CANCELLED: 'SEAT_CANCELLED',
    SEAT_RESERVED: 'SEAT_RESERVED',
    SEAT_PAID: 'SEAT_PAID',

    USER_REGISTERED: 'USER_REGISTERED',
    USER_LOGIN: 'USER_LOGIN',
    USER_LOGOUT: 'USER_LOGOUT',
    USER_UPDATED: 'USER_UPDATED',
    USER_DELETED: 'USER_DELETED',

    BOOKING_SUCCESS: 'BOOKING_SUCCESS',
    BOOKING_FAILED: 'BOOKING_FAILED',

    TICKETS_CREATED: 'TICKETS_CREATED',
    TICKETS_PAID: 'TICKETS_PAID',
    TICKETS_REFUNDED: 'TICKETS_REFUNDED',


    PAYMENT_FAILED: 'PAYMENT_FAILED',

    SYSTEM_ERROR: 'SYSTEM_ERROR'

};

export default eventBus;