import BookingService from "./booking.service.js";
import eventBus, { Events } from "../../common/utils/eventsBus.js";
import SagaManager from "../../common/saga/sagaManager.js";

const sendResult = (res, result) => {
	const statusCode = result?.statusCode || 500;
	return res.status(statusCode).json({
		success: Boolean(result?.ok),
		message: result?.message || "Internal server error",
		data: result?.data,
		pagination: result?.pagination
	});
};

class BookingController {
	/**
	 * Create booking and start saga workflow
	 * POST /api/bookings
	 * Body: { flightId, userId, totalAmount }
	 */
	static async createBooking(req, res, next) {
		try {
			const { flightId, bookingDate, totalAmount, passengerDetails, contactInfo } = req.body;

			// Validate required fields
			if (!flightId || !bookingDate || !totalAmount) {
				return sendResult(res, {
					ok: false,
					statusCode: 400,
					message: "Missing required fields: flightId, bookingDate, totalAmount"
				});
			}

			// Create booking first
			const result = await BookingService.createBooking({
				flightId,
				bookingDate,
				totalAmount,
				status: 'PENDING'
			});

			if (!result.ok) {
				return sendResult(res, result);
			}

			const bookingId = result.data.id;

			// Trigger saga workflow
			eventBus.emit(Events.BOOKING_CREATED, {
				bookingId,
				bookingDate,
				flightId,
				totalAmount,
				passengerDetails,
				contactInfo,
				createdAt: new Date().toISOString()
			});

			console.log(`📝 Booking created and saga started for booking ID: ${bookingId}`);

			return sendResult(res, {
				ok: true,
				statusCode: 201,
				message: "Booking created successfully. Please select seats.",
				data: {
					bookingId,
					status: 'PENDING',
					nextStep: 'SELECT_SEATS'
				}
			});

		} catch (error) {
			return next(error);
		}
	}

	/**
	 * Get all bookings with filters
	 * GET /api/bookings?id=123&status=CONFIRMED
	 */
	static async getBookings(req, res, next) {
		try {
			const result = await BookingService.getBookings(req.query);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	/**
	 * Get booking by ID
	 * GET /api/bookings/:id
	 */
	static async getBookingById(req, res, next) {
		try {
			const id = Number(req.params.id);
			const result = await BookingService.getBookingById(id);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async updateBooking(req, res, next) {
		try {
			const id = Number(req.params.id);
			const result = await BookingService.updateBooking(id, req.body);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	/**
	 * Select seats for booking (Step 2 of saga)
	 * POST /api/bookings/:id/select-seats
	 * Body: { seatIds: [1, 2, 3] }
	 */
	static async selectSeats(req, res, next) {
		try {
			const bookingId = Number(req.params.id);
			const { seatIds } = req.body;

			if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
				return sendResult(res, {
					ok: false,
					statusCode: 400,
					message: "Invalid seat IDs"
				});
			}

			// Emit seat selection event to saga
			eventBus.emit(Events.SEAT_SELECTED, {
				bookingId,
				seatIds,
				selectedAt: new Date().toISOString()
			});

			return sendResult(res, {
				ok: true,
				statusCode: 200,
				message: "Seats selected successfully. Proceed to loyalty or payment.",
				data: {
					bookingId,
					seatIds,
					nextStep: 'LOYALTY_OR_PAYMENT'
				}
			});

		} catch (error) {
			return next(error);
		}
	}

	/**
	 * Apply loyalty points exchange (Step 3 of saga)
	 * POST /api/bookings/:id/apply-loyalty
	 * Body: { passengerId, pointsToExchange }
	 */
	static async applyLoyalty(req, res, next) {
		try {
			const bookingId = Number(req.params.id);
			const { passengerId, pointsToExchange } = req.body;

			if (!passengerId || !pointsToExchange || pointsToExchange <= 0) {
				return sendResult(res, {
					ok: false,
					statusCode: 400,
					message: "Invalid passenger ID or points to exchange"
				});
			}

			// Emit loyalty exchange event to saga
			eventBus.emit(Events.LOYALTY_EXCHANGE, {
				bookingId,
				passengerId,
				pointsToExchange,
				exchangedAt: new Date().toISOString()
			});

			return sendResult(res, {
				ok: true,
				statusCode: 200,
				message: "Loyalty points applied. Proceed to payment.",
				data: {
					bookingId,
					pointsToExchange,
					discountAmount: pointsToExchange * 0.01,
					nextStep: 'PAYMENT'
				}
			});

		} catch (error) {
			return next(error);
		}
	}

	/**
	 * Notify payment completion (Step 4 of saga)
	 * POST /api/bookings/:id/payment-completed
	 * Body: { paymentId, transactionId, amount, paymentMethod }
	 */
	static async notifyPaymentCompleted(req, res, next) {
		try {
			const bookingId = Number(req.params.id);
			const { paymentId, transactionId, amount, paymentMethod, userVoucherId } = req.body;

			if (!paymentId || !transactionId || !amount) {
				return sendResult(res, {
					ok: false,
					statusCode: 400,
					message: "Invalid payment data"
				});
			}

			// Emit payment completed event to saga
			eventBus.emit(Events.PAYMENT_COMPLETED, {
				bookingId,
				paymentId,
				transactionId,
				amount,
				paymentMethod,
				userVoucherId,
				completedAt: new Date().toISOString()
			});

			return sendResult(res, {
				ok: true,
				statusCode: 200,
				message: "Payment confirmed. Tickets are being issued...",
				data: {
					bookingId,
					paymentId,
					status: 'PAYMENT_CONFIRMED'
				}
			});

		} catch (error) {
			return next(error);
		}
	}

	/**
	 * Notify payment failure
	 * POST /api/bookings/:id/payment-failed
	 * Body: { paymentId, reason }
	 */
	static async notifyPaymentFailed(req, res, next) {
		try {
			const bookingId = Number(req.params.id);
			const { paymentId, reason } = req.body;

			if (!paymentId) {
				return sendResult(res, {
					ok: false,
					statusCode: 400,
					message: "Invalid payment ID"
				});
			}

			// Emit payment failed event to saga
			eventBus.emit(Events.PAYMENT_FAILED, {
				bookingId,
				paymentId,
				reason: reason || 'Unknown error',
				failedAt: new Date().toISOString()
			});

			return sendResult(res, {
				ok: true,
				statusCode: 200,
				message: "Payment failure recorded. Booking has been cancelled and resources released.",
				data: {
					bookingId,
					status: 'CANCELLED'
				}
			});

		} catch (error) {
			return next(error);
		}
	}

	/**
	 * Get booking saga status
	 * GET /api/bookings/:id/saga-status
	 */
	static async getSagaStatus(req, res, next) {
		try {
			const bookingId = Number(req.params.id);
			const saga = SagaManager.getSagaInstance(bookingId);

			if (!saga) {
				return sendResult(res, {
					ok: false,
					statusCode: 404,
					message: "Saga not found or already completed"
				});
			}

			return sendResult(res, {
				ok: true,
				statusCode: 200,
				message: "Saga status retrieved",
				data: saga.getStatus()
			});

		} catch (error) {
			return next(error);
		}
	}

	/**
	 * Get all active sagas (admin only)
	 * GET /api/bookings/admin/active-sagas
	 */
	static async getActiveSagas(req, res, next) {
		try {
			const sagas = SagaManager.getAllActiveSagas();

			return sendResult(res, {
				ok: true,
				statusCode: 200,
				message: "Active sagas retrieved",
				data: {
					count: sagas.length,
					sagas
				}
			});

		} catch (error) {
			return next(error);
		}
	}

	/**
	 * Hủy toàn bộ Booking Saga
	 * POST /api/bookings/:id/cancel
	 */
	static async cancelBookingSaga(req, res, next) {
		try {
			const bookingId = Number(req.params.id);
			const saga = SagaManager.getSagaInstance(bookingId);

			if (saga) {
				await saga.rollbackAllSteps();
			} else {
				// Dự phòng nếu Saga đã bị xoá khỏi bộ nhớ, cập nhật thẳng vào DB
				await BookingService.updateBooking(bookingId, { status: 'FAILED' });
			}

			return sendResult(res, {
				ok: true,
				statusCode: 200,
				message: "Booking cancelled successfully."
			});
		} catch (error) {
			return next(error);
		}
	}

	/**
	 * Rollback step gần nhất của Saga
	 * POST /api/bookings/:id/rollback-step
	 */
	static async rollbackLastSagaStep(req, res, next) {
		try {
			const bookingId = Number(req.params.id);
			const saga = SagaManager.getSagaInstance(bookingId);

			if (saga) {
				await saga.rollbackLastStep();
			}

			return sendResult(res, {
				ok: true,
				statusCode: 200,
				message: "Last step rolled back successfully."
			});
		} catch (error) {
			return next(error);
		}
	}
}

export default BookingController;
// booking.controller.js
