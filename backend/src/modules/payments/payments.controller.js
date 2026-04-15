import PaymentsService from "./payments.service.js";

const sendResult = (res, result) => {
	const statusCode = result?.statusCode || 500;
	return res.status(statusCode).json({
		success: Boolean(result?.ok),
		message: result?.message || "Internal server error",
		data: result?.data
	});
};

class PaymentsController {
	static async createPayment(req, res, next) {
		try {
			const result = await PaymentsService.createPayment(req.body);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async getPayments(req, res, next) {
		try {
			const result = await PaymentsService.getPayments(req.query);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async getPaymentById(req, res, next) {
		try {
			const id = Number(req.params.id);
			const result = await PaymentsService.getPaymentById(id);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async updatePayment(req, res, next) {
		try {
			const id = Number(req.params.id);
			const result = await PaymentsService.updatePayment(id, req.body);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async deletePayment(req, res, next) {
		try {
			const id = Number(req.params.id);
			const result = await PaymentsService.deletePayment(id);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}
}

export default PaymentsController;
// payments.controller.js
