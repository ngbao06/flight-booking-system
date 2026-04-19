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

    // Booking events
    BOOKING_CREATED: 'booking:created',
	AWAITING_SEAT_SELECTION: 'booking:awaiting_seat_selection',
	
	// Seat events
	SEAT_SELECTED: 'seat:selected',
	AWAITING_LOYALTY_POINTS: 'booking:awaiting_loyalty_points',
	
	// Loyalty events
	LOYALTY_EXCHANGE: 'loyalty:exchange',
	LOYALTY_REFUND: 'loyalty:refund',
	AWAITING_PAYMENT: 'booking:awaiting_payment',
	
	// Payment events
	PAYMENT_COMPLETED: 'payment:completed',
	PAYMENT_FAILED: 'payment:failed',
	ISSUE_TICKET: 'booking:issue_ticket',
	
	// Ticket events
	TICKET_ISSUED: 'ticket:issued',
	LOG_BOOKING_COMPLETED: 'booking:log_completed',
	
	// Saga events
	SAGA_ERROR: 'saga:error',
	SAGA_COMPLETED: 'saga:completed',
	BOOKING_ROLLBACK: 'booking:rollback'
};

export default eventBus;