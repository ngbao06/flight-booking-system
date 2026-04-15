import SeatsService from "./seats.service.js";

const sendResult = (res, result) => {
	const statusCode = result?.statusCode || 500;
	return res.status(statusCode).json({
		success: Boolean(result?.ok),
		message: result?.message || "Internal server error",
		data: result?.data
	});
};

class SeatsController {
	static async createSeats(req, res, next) {
		try {
			const result = await SeatsService.createSeats(req.body);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async getSeats(req, res, next) {
		try {
			const result = await SeatsService.getSeats(req.query);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async updateSeat(req, res, next) {
		try {
			const id = Number(req.params.id);
			const result = await SeatsService.updateSeat(id, req.body);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}
}

export default SeatsController;
// seats.controller.js
