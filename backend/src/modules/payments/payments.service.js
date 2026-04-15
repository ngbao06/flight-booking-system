import PaymentsRepository from "./payments.repository.js";

class PaymentsService {
	static async createPayment(payload) {
		const existing = await PaymentsRepository.getByTransactionId(payload.transactionId);
		if (existing) {
			return {
				ok: false,
				statusCode: 409,
				message: "Transaction ID already exists"
			};
		}

		const created = await PaymentsRepository.createPayment({
			...payload,
			status: payload.status || "PENDING"
		});
		if (!created) {
			return {
				ok: false,
				statusCode: 500,
				message: "Failed to create payment"
			};
		}

		return {
			ok: true,
			statusCode: 201,
			message: "Payment created successfully",
			data: payload
		};
	}

	static async getPayments(filters = {}) {
		const { id, bookingId, transactionId, fromAmount, toAmount, paymentMethod, status } = filters;

		if (id !== undefined) {
			const payment = await PaymentsRepository.getById(Number(id));
			if (!payment) {
				return {
					ok: false,
					statusCode: 404,
					message: "Payment not found"
				};
			}

			return {
				ok: true,
				statusCode: 200,
				message: "Payment fetched successfully",
				data: payment
			};
		}

		if (bookingId !== undefined) {
			const payments = await PaymentsRepository.getByBookingId(bookingId);
			return {
				ok: true,
				statusCode: 200,
				message: "Payments fetched successfully",
				data: payments || []
			};
		}

		if (transactionId) {
			const payment = await PaymentsRepository.getByTransactionId(transactionId);
			if (!payment) {
				return {
					ok: false,
					statusCode: 404,
					message: "Payment not found"
				};
			}

			return {
				ok: true,
				statusCode: 200,
				message: "Payment fetched successfully",
				data: payment
			};
		}

		if (fromAmount !== undefined && toAmount !== undefined) {
			const payments = await PaymentsRepository.getByRangeAmount(fromAmount, toAmount);
			return {
				ok: true,
				statusCode: 200,
				message: "Payments fetched successfully",
				data: payments || []
			};
		}

		if (paymentMethod) {
			const payments = await PaymentsRepository.getByPaymentMethod(paymentMethod);
			return {
				ok: true,
				statusCode: 200,
				message: "Payments fetched successfully",
				data: payments || []
			};
		}

		if (status) {
			const payments = await PaymentsRepository.getByStatus(status);
			return {
				ok: true,
				statusCode: 200,
				message: "Payments fetched successfully",
				data: payments || []
			};
		}

		const payments = await PaymentsRepository.getAll();
		return {
			ok: true,
			statusCode: 200,
			message: "Payments fetched successfully",
			data: payments || []
		};
	}

	static async getPaymentById(id) {
		const payment = await PaymentsRepository.getById(id);
		if (!payment) {
			return {
				ok: false,
				statusCode: 404,
				message: "Payment not found"
			};
		}

		return {
			ok: true,
			statusCode: 200,
			message: "Payment fetched successfully",
			data: payment
		};
	}

	static async updatePayment(id, payload) {
		const existed = await PaymentsRepository.getById(id);
		if (!existed) {
			return {
				ok: false,
				statusCode: 404,
				message: "Payment not found"
			};
		}

		if (payload.transactionId && payload.transactionId !== existed.transaction_id) {
			const duplicated = await PaymentsRepository.getByTransactionId(payload.transactionId);
			if (duplicated) {
				return {
					ok: false,
					statusCode: 409,
					message: "Transaction ID already exists"
				};
			}
		}

		const updated = await PaymentsRepository.updatePayment(id, payload);
		if (!updated) {
			return {
				ok: false,
				statusCode: 500,
				message: "Failed to update payment"
			};
		}

		const payment = await PaymentsRepository.getById(id);
		return {
			ok: true,
			statusCode: 200,
			message: "Payment updated successfully",
			data: payment
		};
	}

	static async deletePayment(id) {
		const existed = await PaymentsRepository.getById(id);
		if (!existed) {
			return {
				ok: false,
				statusCode: 404,
				message: "Payment not found"
			};
		}

		const deleted = await PaymentsRepository.deletePayment(id);
		if (!deleted) {
			return {
				ok: false,
				statusCode: 500,
				message: "Failed to delete payment"
			};
		}

		return {
			ok: true,
			statusCode: 200,
			message: "Payment deleted successfully"
		};
	}
}

export default PaymentsService;
// payments.service.js
