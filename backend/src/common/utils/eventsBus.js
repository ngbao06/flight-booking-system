import { EventEmitter } from 'events';

// Khởi tạo một instance duy nhất
const eventBus = new EventEmitter();

eventBus.setMaxListeners(20);

export const Events = {
    // Event chung xử lí cho mọi bảng
    UPDATE_EVENT:     'UPDATE_EVENT',
    DELETE_EVENT:     'DELETE_EVENT',
    CREATE_EVENT:     'CREATE_EVENT',
    ERROR_EVENT:      'ERROR_EVENT',
    
    // thay đổi thông tin chuyến bay: địa điểm đến, status (delayed, cancel,...). Cần reason
    FLIGHT_UPDATED:   'FLIGHT_UPDATED',

    // Loyalty
    LOYALTY_EXCHANGE: 'LOYALTY_EXCHANGE',
    LOYALTY_GAINED:   'LOYALTY_GAINED',

    AIRLINE_UPDATED:  'AIRLINE_UPDATED',

    PLANE_UPDATED:    'PLANE_UPDATE',

    SEAT_CANCELLED:   'SEAT_CANCELLED',
    SEAT_RESERVED:    'SEAT_RESERVED',
    SEAT_PAID:        'SEAT_PAID',

    USER_REGISTERED:  'USER_REGISTERED',
    USER_LOGIN:       'USER_LOGIN',
    USER_LOGOUT:      'USER_LOGOUT',
    USER_UPDATED:     'USER_UPDATED',
    USER_DELETED:     'USER_DELETED',

    BOOKING_SUCCESS:  'BOOKING_SUCCESS',
    BOOKING_FAILED:   'BOOKING_FAILED',

    TICKETS_CREATED:  'TICKETS_CREATED',
    TICKETS_PAID:     'TICKETS_PAID',
    TICKETS_REFUNDED: 'TICKETS_REFUNDED',


    // Payments
    PAYMENT_FAILED:   'PAYMENT_FAILED',
    PAYMENT_SUCCESS:  'PAYMENT_SUCCESS',
    PAYMENT_REFUNDED: 'PAYMENT_REFUNDED',


    SYSTEM_ERROR:     'SYSTEM_ERROR'

};

export default eventBus;