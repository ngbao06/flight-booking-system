import FlightsService from "./flights.service.js";

const sendResult = (res, result) => {
	const statusCode = result?.statusCode || 500;
	return res.status(statusCode).json({
		success: Boolean(result?.ok),
		message: result?.message || "Internal server error",
		data: result?.data,
		pagination: result?.pagination
	});
};

class FlightsController {
	static async createFlight(req, res, next) {
		try {
			const result = await FlightsService.createFlight(req.body);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async getFlights(req, res, next) {
		try {
			const result = await FlightsService.getFlights(req.query);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async getFlightById(req, res, next) {
		try {
			const id = Number(req.params.id);
			const result = await FlightsService.getFlightById(id);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async updateFlight(req, res, next) {
		try {
			const id = Number(req.params.id);
			const result = await FlightsService.updateFlight(id, req.body);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async deleteFlight(req, res, next) {
		try {
			const id = Number(req.params.id);
			const result = await FlightsService.deleteFlight(id);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}
}

export default FlightsController;
// flights.controller.js
