import eventBus, { Events } from '../utils/eventsBus.js';
import BookingRepository from '../../modules/booking/booking.repository.js';
import PaymentsRepository from '../../modules/payments/payments.repository.js';
import TicketsRepository from '../../modules/tickets/tickets.repository.js';
import SeatsRepository from '../../modules/seats/seats.repository.js';
import LoyaltyRepository from '../../modules/loyalty/loyalty.repository.js';
import VouchersRepository from '../../modules/vouchers/vouchers.repository.js';
import AdminLogRepository from '../../modules/adminlogs/adminLogs.repository.js';
import SagaManager from './sagaManager.js';
import SagaLogsRepository from './sagaLogs.repository.js';

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
        this.usedVoucherId = null;
    }

    async logTransaction(step, status, message, details = {}) {
        await SagaLogsRepository.log(this.bookingId, step, status, message, details);
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

            await this.logTransaction('STEP_1_CREATE_BOOKING', 'SUCCESS', 'Booking created successfully');

            return true;
        } catch (error) {
            console.error(`[SAGA STEP 1] ❌ Error:`, error);
            this.status = 'FAILED';
            await this.logTransaction('STEP_1_CREATE_BOOKING', 'FAILED', error.message);
            
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

            await this.logTransaction('STEP_2_SEAT_SELECTION', 'SUCCESS', 'Seats selected and reserved', { selectedSeats: this.selectedSeats });

        } catch (error) {
            console.error(`[SAGA STEP 2] ❌ Error:`, error);
            this.status = 'FAILED';
            
            // Compensation: Release reserved seats
            await this.logTransaction('STEP_2_SEAT_SELECTION', 'FAILED', error.message);
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

            await this.logTransaction('STEP_3_LOYALTY_EXCHANGE', 'SUCCESS', `Loyalty points exchanged. Discount: ${this.loyaltyUsed}`, { pointsToExchange });

        } catch (error) {
            console.error(`[SAGA STEP 3] ❌ Error:`, error);
            this.status = 'FAILED';

            await this.logTransaction('STEP_3_LOYALTY_EXCHANGE', 'FAILED', error.message);
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
            
            const { paymentId, transactionId, amount, paymentMethod, userVoucherId } = paymentData;

            // Verify payment exists and is confirmed
            const payment = await PaymentsRepository.getById(paymentId);
            
            if (!payment) {
                throw new Error('Payment not found');
            }

            if (payment.status !== 'SUCCEED') {
                throw new Error('Payment status is not completed');
            }

            // Số tiền thực trả (đã giảm voucher nếu có) là nguồn dữ liệu chuẩn để lưu Booking/Ticket
            const paidAmount = Number(payment.amount ?? amount ?? this.totalAmount);
            if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
                throw new Error('Invalid paid amount');
            }
            this.totalAmount = paidAmount;

            // Update booking status + tổng tiền cuối cùng
            const updated = await BookingRepository.updateBooking(this.bookingId, {
                status: 'SUCCEED',
                totalAmount: paidAmount
            });

            if (!updated) {
                throw new Error('Failed to update booking status');
            }

            this.paymentId = paymentId;
            this.usedVoucherId = userVoucherId || paymentData?.voucher?.userVoucherId || null;
            this.completedSteps.push('PAYMENT_COMPLETED');
            this.status = 'ISSUING_TICKET';

            console.log(`[SAGA STEP 4] ✅ Payment completed and booking confirmed`);
            await this.logTransaction('STEP_4_PAYMENT', 'SUCCESS', 'Payment completed and booking confirmed', { paymentId });

            // Proceed to step 5: Issue ticket
            await this.executeStep5_IssueTicket();

        } catch (error) {
            console.error(`[SAGA STEP 4] ❌ Error:`, error);
            this.status = 'FAILED';

            await this.logTransaction('STEP_4_PAYMENT', 'FAILED', error.message);
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
            await this.logTransaction('STEP_4B_PAYMENT_FAILURE', 'FAILED', 'Payment failed, saga rolled back');

        } catch (error) {
            console.error(`[SAGA STEP 4b] ❌ Rollback error:`, error);
            
            await this.logTransaction('STEP_4B_PAYMENT_FAILURE', 'FAILED', error.message);
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
                
                // Rút gọn ticket number để thỏa mãn điều kiện VARCHAR(20)
                const shortTimestamp = Date.now().toString(36).toUpperCase();
                const ticketNumber = `TK-${this.bookingId}-${i+1}-${shortTimestamp}`.substring(0, 20);

                // Lấy thông tin hành khách thực tế từ bookingData (nếu front-end có truyền lên)
                const passengers = this.bookingData.passengerDetails || [];
                const passenger = passengers[i] || {};

                const ticketCreated = await TicketsRepository.createTicket({
                    ticketNumber: ticketNumber,
                    bookingId: this.bookingId,
                    seatId: seatId,
                    buyerId: this.userId || null,
                    passengerLastname: passenger.lastName || 'Passenger',
                    passengerFirstname: passenger.firstName || `Pax ${i + 1}`,
                    passengerIdCard: passenger.idCard || 'TBD', // Giới hạn VARCHAR(12)
                    issueDate: new Date().toISOString().split('T')[0], // Đưa về đúng chuẩn DATE (YYYY-MM-DD)
                    finalPrice: (this.totalAmount / this.selectedSeats.length) || 0,
                    status: 'ACTIVE' // Cập nhật đúng ENUM('PENDING','ACTIVE','USED','EXPIRED')
                });

                if (!ticketCreated) {
                    throw new Error(`Failed to create ticket for seat ${seatId}`);
                }

                tickets.push(ticketNumber);
            }

            this.completedSteps.push('TICKET_ISSUED');
            this.status = 'LOGGING';

            console.log(`[SAGA STEP 5] ✅ ${tickets.length} ticket(s) issued`);
            await this.logTransaction('STEP_5_ISSUE_TICKET', 'SUCCESS', `${tickets.length} ticket(s) issued`, { tickets });

            // Proceed to step 6: Log booking
            await this.executeStep6_LogBooking();

        } catch (error) {
            console.error(`[SAGA STEP 5] ❌ Error:`, error);
            this.status = 'FAILED';

            await this.logTransaction('STEP_5_ISSUE_TICKET', 'FAILED', error.message);
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
            
            this.completedSteps.push('BOOKING_LOGGED');
            this.status = 'COMPLETED';

            console.log(`[SAGA STEP 6] ✅ Booking logged successfully`);
            await this.logTransaction('STEP_6_LOG_BOOKING', 'SUCCESS', 'Booking logged successfully');

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

            await this.logTransaction('STEP_6_LOG_BOOKING', 'FAILED', error.message);
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
            await this.logTransaction('COMPENSATE_SEAT_SELECTION', 'COMPENSATED', 'Seats released');
        } catch (error) {
            console.error(`[COMPENSATION ERROR] Failed to release seats:`, error);
            await this.logTransaction('COMPENSATE_SEAT_SELECTION', 'FAILED', error.message);
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
            await this.logTransaction('COMPENSATE_LOYALTY', 'COMPENSATED', `Loyalty points refunded for passenger ${passengerId}`);
        } catch (error) {
            console.error(`[COMPENSATION ERROR] Failed to refund loyalty:`, error);
            await this.logTransaction('COMPENSATE_LOYALTY', 'FAILED', error.message);
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
            await this.logTransaction('COMPENSATE_PAYMENT', 'COMPENSATED', `Payment ${paymentId} refunded`);
        } catch (error) {
            console.error(`[COMPENSATION ERROR] Failed to refund payment:`, error);
            await this.logTransaction('COMPENSATE_PAYMENT', 'FAILED', error.message);
        }
    }

    // hoãn vé
    async compensateStep5_CancelTickets() {
        try {
            console.log(`[COMPENSATION] Canceling tickets for booking ${this.bookingId}`);
            
            const tickets = await TicketsRepository.getByBooking(this.bookingId);
            
            for (const ticket of tickets) {
                await TicketsRepository.updateTicket(ticket.id, {
                    status: 'EXPIRED' // Cập nhật cho phù hợp với ENUM của Tickets Schema
                });
            }

            console.log(`[COMPENSATION] ✅ Tickets cancelled`);
            await this.logTransaction('COMPENSATE_TICKET', 'COMPENSATED', 'Tickets cancelled');
        } catch (error) {
            console.error(`[COMPENSATION ERROR] Failed to cancel tickets:`, error);
            await this.logTransaction('COMPENSATE_TICKET', 'FAILED', error.message);
        }
    }

    async compensateVoucherRestore(userVoucherId) {
        try {
            if (!userVoucherId) return;

            console.log(`[COMPENSATION] Restoring voucher ${userVoucherId} for booking ${this.bookingId}`);
            const restored = await VouchersRepository.restoreUsedVoucher(this.bookingData.userId || this.userId || null, userVoucherId);

            if (!restored.ok) {
                throw new Error(restored.message || 'Failed to restore voucher');
            }

            console.log(`[COMPENSATION] ✅ Voucher restored`);
            await this.logTransaction('COMPENSATE_VOUCHER', 'COMPENSATED', `Voucher ${userVoucherId} restored`, { userVoucherId });
        } catch (error) {
            console.error(`[COMPENSATION ERROR] Failed to restore voucher:`, error);
            await this.logTransaction('COMPENSATE_VOUCHER', 'FAILED', error.message, { userVoucherId });
        }
    }

    async rollbackAllSteps() {
        try {
            console.log(`[ROLLBACK] Rolling back all steps for booking ${this.bookingId}`);
            
            await this.logTransaction('ROLLBACK_ALL', 'STARTED', 'Rolling back all steps');
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

            if (this.usedVoucherId) {
                await this.compensateVoucherRestore(this.usedVoucherId);
            }

            // Update booking status to CANCELLED
            await BookingRepository.updateBooking(this.bookingId, {
                status: 'FAILED'
            });

            console.log(`[ROLLBACK] ✅ All steps rolled back successfully`);
            await this.logTransaction('ROLLBACK_ALL', 'SUCCESS', 'All steps rolled back successfully');

        } catch (error) {
            console.error(`[ROLLBACK ERROR]`, error);
            await this.logTransaction('ROLLBACK_ALL', 'FAILED', error.message);
            throw error;
        }
    }

    async rollbackLastStep() {
        try {
            // Nếu chỉ có bước tạo Booking ban đầu, thì rollback step đồng nghĩa với hủy toàn bộ booking
            if (this.completedSteps.length === 1 && this.completedSteps[0] === 'BOOKING_CREATED') {
                console.log(`[ROLLBACK STEP] Chỉ còn bước tạo Booking ban đầu. Tiến hành hủy toàn bộ Saga.`);
                await this.rollbackAllSteps();
                return;
            }
            if (this.completedSteps.length === 0) return;

            const lastStep = this.completedSteps.pop();
            console.log(`[ROLLBACK STEP] Reverting last step: ${lastStep} for booking ${this.bookingId}`);
            await this.logTransaction('ROLLBACK_STEP', 'STARTED', `Rolling back step ${lastStep}`);

            if (lastStep === 'BOOKING_LOGGED') {
                // Bỏ qua vì chỉ là log
            } else if (lastStep === 'TICKET_ISSUED') {
                await this.compensateStep5_CancelTickets();
                this.status = 'PAYMENT_COMPLETED';
            } else if (lastStep === 'PAYMENT_COMPLETED') {
                await this.compensateStep4_RefundPayment(this.paymentId);
                this.status = 'AWAITING_PAYMENT';
            } else if (lastStep === 'LOYALTY_EXCHANGED') {
                await this.compensateStep3_RefundLoyalty(this.userId);
                this.status = 'AWAITING_LOYALTY_OR_PAYMENT';
            } else if (lastStep === 'SEATS_SELECTED') {
                await this.compensateStep2_ReleaseSeat();
                this.status = 'AWAITING_SEAT_SELECTION';
                this.selectedSeats = [];
            }

            console.log(`[ROLLBACK STEP] ✅ Step ${lastStep} rolled back successfully`);
            await this.logTransaction('ROLLBACK_STEP', 'SUCCESS', `Step ${lastStep} rolled back successfully`);

        } catch (error) {
            console.error(`[ROLLBACK STEP ERROR]`, error);
            await this.logTransaction('ROLLBACK_STEP', 'FAILED', error.message);
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
