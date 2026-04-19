import eventBus, { Events } from '../utils/eventsBus.js';
import BookingSaga from './bookingSaga.js';

/**
 * SagaManager orchestrates the entire booking workflow
 * Handles saga execution, error handling, and compensation
 */
class SagaManager {
    constructor() {
        this.sagaInstances = new Map();
        this.initializeListeners();
    }

    initializeListeners() {
        // Start saga when booking is created
        eventBus.on(Events.BOOKING_CREATED, (data) => {
            this.startBookingSaga(data);
        });

        // Handle seat selection
        eventBus.on(Events.SEAT_SELECTED, (data) => {
            const saga = this.sagaInstances.get(data.bookingId);
            if (saga) {
                saga.handleSeatSelection(data);
            }
        });

        // Handle loyalty points exchange
        eventBus.on(Events.LOYALTY_EXCHANGE, (data) => {
            const saga = this.sagaInstances.get(data.bookingId);
            if (saga) {
                saga.handleLoyaltyExchange(data);
            }
        });

        // Handle payment completion
        eventBus.on(Events.PAYMENT_COMPLETED, (data) => {
            const saga = this.sagaInstances.get(data.bookingId);
            if (saga) {
                saga.handlePaymentSuccess(data);
            }
        });

        // Handle payment failure
        eventBus.on(Events.PAYMENT_FAILED, (data) => {
            const saga = this.sagaInstances.get(data.bookingId);
            if (saga) {
                saga.handlePaymentFailure(data);
            }
        });

        // Handle saga errors
        eventBus.on(Events.SAGA_ERROR, (data) => {
            console.error(`[SAGA ERROR] BookingId: ${data.bookingId}`, data.error);
        });
    }

    async startBookingSaga(bookingData) {
        try {
            console.log(`[SAGA START] Starting booking saga for booking ID: ${bookingData.bookingId}`);
            
            const saga = new BookingSaga(bookingData);
            this.sagaInstances.set(bookingData.bookingId, saga);

            // Execute first step: create booking
            await saga.executeStep1_CreateBooking();
            
        } catch (error) {
            console.error(`[SAGA START ERROR]`, error);
            eventBus.emit(Events.SAGA_ERROR, {
                bookingId: bookingData.bookingId,
                error: error.message,
                step: 'START'
            });
        }
    }

    getSagaInstance(bookingId) {
        return this.sagaInstances.get(bookingId);
    }

    removeSagaInstance(bookingId) {
        this.sagaInstances.delete(bookingId);
    }

    getAllActiveSagas() {
        return Array.from(this.sagaInstances.entries()).map(([bookingId, saga]) => ({
            bookingId,
            status: saga.status
        }));
    }
}

// Export singleton instance
export default new SagaManager();
