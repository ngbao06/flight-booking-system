import eventBus, { Events } from '../utils/eventsBus.js';
import BookingRepository from '../../modules/booking/booking.repository.js';
import PaymentsRepository from '../../modules/payments/payments.repository.js';
import TicketsRepository from '../../modules/tickets/tickets.repository.js';
import SeatsRepository from '../../modules/seats/seats.repository.js';
import LoyaltyRepository from '../../modules/loyalty/loyalty.repository.js';
import AdminLogRepository from '../../modules/adminlogs/adminLogs.repository.js';
import SagaManager from './sagaManager.js';

class BookingSaga {
    constructor(bookingData) {
        this.bookingId = bookingData.bookingId;
        this.bookingDate = bookingData.bookingDate;
        this.userId = bookingData.userId;
        this.flightId = bookingData.flightId;
        this.totalAmount = bookingData.totalAmount;
        this.bookingData = bookingData;
        
        // Track completed steps for compensation
        this.completedSteps = [];
        this.status = 'INITIATED';
        this.selectedSeats = [];
        this.loyaltyUsed = 0;
        this.paymentId = null;
    }

    // tạo booking
    async executeStep1_CreateBooking() {
        try {   
            this.completedSteps.push('BOOKING_CREATED');
            this.status = 'AWAITING_SEAT_SELECTION';

            console.log(`[SAGA STEP 1] ✅ Booking created successfully`);
            
            // Emit event to notify that seats need to be selected
            eventBus.emit(Events.AWAITING_SEAT_SELECTION, {
                bookingId: this.bookingId,
                flightId: this.flightId,
                message: 'Please select seats for your booking'
            });

            return true;
        } catch (error) {
            console.error(`[SAGA STEP 1] ❌ Error:`, error);
            this.status = 'FAILED';
            
            eventBus.emit(Events.SAGA_ERROR, {
                bookingId: this.bookingId,
                error: error.message,
                step: 'BOOKING_CREATED'
            });

            throw error;
        }
    }

    // chọn ghế
    async handleSeatSelection(seatData) {
        try {
            console.log(`[SAGA STEP 2] Processing seat selection for booking ${this.bookingId}`);
            
            // Validate seat data
            if (!seatData.seatIds || seatData.seatIds.length === 0) {
                throw new Error('No seats selected');
            }

            // Reserve seats
            const seats = await SeatsRepository.getByIds(seatData.seatIds);
            
            // Verify seats belong to same flight and are available
            for (const seat of seats) {
                if (seat.flight_id !== this.flightId) {
                    throw new Error(`Seat ${seat.seat_number} does not belong to this flight`);
                }
                if (seat.status !== 'AVAILABLE') {
                    throw new Error(`Seat ${seat.seat_number} is not available`);
                }
            }

            // Update seat status to RESERVED
            for (const seatId of seatData.seatIds) {
                await SeatsRepository.updateSeat(seatId, { status: 'RESERVED' });
            }

            this.selectedSeats = seatData.seatIds;
            this.completedSteps.push('SEATS_SELECTED');
            this.status = 'AWAITING_LOYALTY_OR_PAYMENT';

            console.log(`[SAGA STEP 2] ✅ Seats selected and reserved`);

            // Emit event to proceed or wait for loyalty exchange
            eventBus.emit(Events.AWAITING_LOYALTY_POINTS, {
                bookingId: this.bookingId,
                selectedSeats: this.selectedSeats,
                message: 'Seats selected. Proceed to loyalty points exchange or payment'
            });

        } catch (error) {
            console.error(`[SAGA STEP 2] ❌ Error:`, error);
            this.status = 'FAILED';
            
            // Compensation: Release reserved seats
            await this.compensateStep2_ReleaseSeat();

            eventBus.emit(Events.SAGA_ERROR, {
                bookingId: this.bookingId,
                error: error.message,
                step: 'SEATS_SELECTED'
            });

            throw error;
        }
    }

    // đổi điểm LP
    async handleLoyaltyExchange(loyaltyData) {
        try {
            console.log(`[SAGA STEP 3] Exchanging loyalty points for booking ${this.bookingId}`);
            
            const { passengerId, pointsToExchange } = loyaltyData;

            // Verify passenger has enough points
            const loyalty = await LoyaltyRepository.getLoyaltyByPassenger(passengerId);
            
            if (!loyalty || loyalty.points_balance < pointsToExchange) {
                throw new Error('Insufficient loyalty points');
            }

            // Exchange points (points_balance and total_redeemed updated)
            const exchanged = await LoyaltyRepository.exchangePoints(passengerId, pointsToExchange);

            if (!exchanged) {
                throw new Error('Failed to exchange loyalty points');
            }

            // Calculate discount (e.g., 1 point = 0.01 currency)
            this.loyaltyUsed = pointsToExchange * 0.01;
            const discountedAmount = Math.max(0, this.totalAmount - this.loyaltyUsed);

            this.completedSteps.push('LOYALTY_EXCHANGED');
            this.status = 'AWAITING_PAYMENT';

            console.log(`[SAGA STEP 3] ✅ Loyalty points exchanged. Discount: ${this.loyaltyUsed}`);

            // Emit event for payment to proceed with discounted amount
            eventBus.emit(Events.AWAITING_PAYMENT, {
                bookingId: this.bookingId,
                originalAmount: this.totalAmount,
                discountAmount: this.loyaltyUsed,
                payableAmount: discountedAmount,
                pointsUsed: pointsToExchange,
                message: 'Loyalty points applied. Proceed to payment'
            });

        } catch (error) {
            console.error(`[SAGA STEP 3] ❌ Error:`, error);
            this.status = 'FAILED';

            // Compensation: Refund loyalty points
            await this.compensateStep3_RefundLoyalty(loyaltyData.passengerId);

            eventBus.emit(Events.SAGA_ERROR, {
                bookingId: this.bookingId,
                error: error.message,
                step: 'LOYALTY_EXCHANGED'
            });

            throw error;
        }
    }

    // thanh toán
    async handlePaymentSuccess(paymentData) {
        try {
            console.log(`[SAGA STEP 4] Processing payment success for booking ${this.bookingId}`);
            
            const { paymentId, transactionId, amount, paymentMethod } = paymentData;

            // Verify payment exists and is confirmed
            const payment = await PaymentsRepository.getById(paymentId);
            
            if (!payment) {
                throw new Error('Payment not found');
            }

            if (payment.status !== 'SUCCEED') {
                throw new Error('Payment status is not completed');
            }

            // Update booking status to CONFIRMED
            const updated = await BookingRepository.updateBooking(this.bookingId, {
                status: 'SUCCEED'
            });

            if (!updated) {
                throw new Error('Failed to update booking status');
            }

            this.paymentId = paymentId;
            this.completedSteps.push('PAYMENT_COMPLETED');
            this.status = 'ISSUING_TICKET';

            console.log(`[SAGA STEP 4] ✅ Payment completed and booking confirmed`);

            // Proceed to step 5: Issue ticket
            await this.executeStep5_IssueTicket();

        } catch (error) {
            console.error(`[SAGA STEP 4] ❌ Error:`, error);
            this.status = 'FAILED';

            // Compensation: Refund payment and loyalty
            // await this.compensateStep4_RefundPayment(paymentData.paymentId);

            await this.rollbackAllSteps();

            eventBus.emit(Events.SAGA_ERROR, {
                bookingId: this.bookingId,
                error: error.message,
                step: 'PAYMENT_COMPLETED'
            });

            throw error;
        }
    }

    // compensation
    async handlePaymentFailure(paymentData) {
        try {
            console.log(`[SAGA STEP 4b] Processing payment failure for booking ${this.bookingId}`);
            
            // Rollback entire saga
            await this.rollbackAllSteps();

            this.status = 'PAYMENT_FAILED';

            eventBus.emit(Events.BOOKING_ROLLBACK, {
                bookingId: this.bookingId,
                reason: 'Payment failed',
                refundAmount: this.totalAmount
            });

            console.log(`[SAGA STEP 4b] ✅ Saga rolled back due to payment failure`);

        } catch (error) {
            console.error(`[SAGA STEP 4b] ❌ Rollback error:`, error);
            
            eventBus.emit(Events.SAGA_ERROR, {
                bookingId: this.bookingId,
                error: error.message,
                step: 'PAYMENT_FAILED_ROLLBACK'
            });
        }
    }

    /**
     * Step 5: Issue ticket
     */
    async executeStep5_IssueTicket() {
        try {
            console.log(`[SAGA STEP 5] Issuing tickets for booking ${this.bookingId}`);
            
            const tickets = [];

            // Create ticket for each selected seat
            for (let i = 0; i < this.selectedSeats.length; i++) {
                const seatId = this.selectedSeats[i];
                const ticketNumber = `TKT-${this.bookingId}-${i + 1}-${Date.now()}`;

                const ticketCreated = await TicketsRepository.createTicket({
                    ticketNumber: ticketNumber,
                    bookingId: this.bookingId,
                    seatId: seatId,
                    buyerId: this.userId,
                    passengerLastname: `Passenger`,
                    passengerFirstname: `${i + 1}`,
                    passengerIdCard: 'TBD',
                    issueDate: new Date().toISOString(),
                    finalPrice: this.totalAmount / this.selectedSeats.length,
                    status: 'ISSUED'
                });

                if (!ticketCreated) {
                    throw new Error(`Failed to create ticket for seat ${seatId}`);
                }

                tickets.push(ticketNumber);
            }

            this.completedSteps.push('TICKET_ISSUED');
            this.status = 'LOGGING';

            console.log(`[SAGA STEP 5] ✅ ${tickets.length} ticket(s) issued`);

            // Proceed to step 6: Log booking
            await this.executeStep6_LogBooking();

        } catch (error) {
            console.error(`[SAGA STEP 5] ❌ Error:`, error);
            this.status = 'FAILED';

            // Compensation: Cancel tickets
            await this.compensateStep5_CancelTickets();

            eventBus.emit(Events.SAGA_ERROR, {
                bookingId: this.bookingId,
                error: error.message,
                step: 'TICKET_ISSUED'
            });

            throw error;
        }
    }

    // ghi log
    async executeStep6_LogBooking() {
        try {
            console.log(`[SAGA STEP 6] Logging booking information`);
            
            await AdminLogRepository.insertActivityLog({
                action: 'BOOKING_COMPLETED',
                module: 'BOOKING',
                id: this.bookingId,
                user_id: this.userId,
                role: 'PASSENGER',
                new_data: {
                    bookingId: this.bookingId,
                    flightId: this.flightId,
                    totalAmount: this.totalAmount,
                    loyaltyUsed: this.loyaltyUsed,
                    seatsCount: this.selectedSeats.length,
                    status: 'CONFIRMED',
                    completedAt: new Date().toISOString()
                }
            });

            this.completedSteps.push('BOOKING_LOGGED');
            this.status = 'COMPLETED';

            console.log(`[SAGA STEP 6] ✅ Booking logged successfully`);

            // Emit completion event
            eventBus.emit(Events.SAGA_COMPLETED, {
                bookingId: this.bookingId,
                status: 'COMPLETED',
                totalSteps: this.completedSteps.length
            });

            // Clean up saga instance after a delay
            setTimeout(() => {
                SagaManager.removeSagaInstance(this.bookingId);
            }, 5000);

        } catch (error) {
            console.error(`[SAGA STEP 6] ❌ Error:`, error);
            this.status = 'COMPLETED_WITH_LOG_ERROR';

            // Even if logging fails, booking is still confirmed
            eventBus.emit(Events.SAGA_COMPLETED, {
                bookingId: this.bookingId,
                status: 'COMPLETED_WITH_ERROR',
                logError: error.message
            });

            throw error;
        }
    }

    // nhả ghế nếu thanh toán fail
    async compensateStep2_ReleaseSeat() {
        try {
            console.log(`[COMPENSATION] Releasing seats for booking ${this.bookingId}`);
            
            for (const seatId of this.selectedSeats) {
                await SeatsRepository.updateSeat(seatId, { status: 'AVAILABLE' });
            }

            console.log(`[COMPENSATION] ✅ Seats released`);
        } catch (error) {
            console.error(`[COMPENSATION ERROR] Failed to release seats:`, error);
        }
    }

    // hoàn điểm đã đổi
    async compensateStep3_RefundLoyalty(passengerId) {
        try {
            console.log(`[COMPENSATION] Refunding loyalty points for passenger ${passengerId}`);
            
            if (this.loyaltyUsed > 0) {
                const pointsToRefund = Math.ceil(this.loyaltyUsed / 0.01);
                await LoyaltyRepository.addPoints(passengerId, pointsToRefund);
            }

            console.log(`[COMPENSATION] ✅ Loyalty points refunded`);
        } catch (error) {
            console.error(`[COMPENSATION ERROR] Failed to refund loyalty:`, error);
        }
    }

    // hoàn tiền
    async compensateStep4_RefundPayment(paymentId) {
        try {
            console.log(`[COMPENSATION] Refunding payment ${paymentId}`);
            
            await PaymentsRepository.updatePayment(paymentId, {
                status: 'REFUNDED'
            });

            console.log(`[COMPENSATION] ✅ Payment refunded`);
        } catch (error) {
            console.error(`[COMPENSATION ERROR] Failed to refund payment:`, error);
        }
    }

    // hoãn vé
    async compensateStep5_CancelTickets() {
        try {
            console.log(`[COMPENSATION] Canceling tickets for booking ${this.bookingId}`);
            
            const tickets = await TicketsRepository.getByBooking(this.bookingId);
            
            for (const ticket of tickets) {
                await TicketsRepository.updateTicket(ticket.id, {
                    status: 'CANCELLED'
                });
            }

            console.log(`[COMPENSATION] ✅ Tickets cancelled`);
        } catch (error) {
            console.error(`[COMPENSATION ERROR] Failed to cancel tickets:`, error);
        }
    }

    async rollbackAllSteps() {
        try {
            console.log(`[ROLLBACK] Rolling back all steps for booking ${this.bookingId}`);
            
            // Execute compensations in reverse order
            if (this.completedSteps.includes('BOOKING_LOGGED')) {
                // Mark log as rolled back (informational only)
            }

            if (this.completedSteps.includes('TICKET_ISSUED')) {
                await this.compensateStep5_CancelTickets();
            }

            if (this.completedSteps.includes('PAYMENT_COMPLETED')) {
                await this.compensateStep4_RefundPayment(this.paymentId);
            }

            if (this.completedSteps.includes('LOYALTY_EXCHANGED')) {
                await this.compensateStep3_RefundLoyalty(this.userId);
            }

            if (this.completedSteps.includes('SEATS_SELECTED')) {
                await this.compensateStep2_ReleaseSeat();
            }

            // Update booking status to CANCELLED
            await BookingRepository.updateBooking(this.bookingId, {
                status: 'FAILED'
            });

            console.log(`[ROLLBACK] ✅ All steps rolled back successfully`);

        } catch (error) {
            console.error(`[ROLLBACK ERROR]`, error);
            throw error;
        }
    }

    getStatus() {
        return {
            bookingId: this.bookingId,
            status: this.status,
            completedSteps: this.completedSteps,
            selectedSeats: this.selectedSeats,
            loyaltyUsed: this.loyaltyUsed
        };
    }
}

export default BookingSaga;
