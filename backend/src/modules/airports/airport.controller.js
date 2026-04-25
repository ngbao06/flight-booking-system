import AirportsService from "./airports.service.js";

const sendResult = (res, result) => {
	const statusCode = result?.statusCode || 500;
	return res.status(statusCode).json({
		success: Boolean(result?.ok),
		message: result?.message || "Internal server error",
		data: result?.data,
		pagination: result?.pagination
	});
};

class AirportsController {
	static async createAirport(req, res, next) {
		try {
			const result = await AirportsService.createAirport(req.body);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async getAirports(req, res, next) {
		try {
			const result = await AirportsService.getAirports(req.query);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async getAirportById(req, res, next) {
		try {
			const id = Number(req.params.id);
			const result = await AirportsService.getAirportById(id);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async updateAirport(req, res, next) {
		try {
			const id = Number(req.params.id);
			const result = await AirportsService.updateAirport(id, req.body);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async deleteAirport(req, res, next) {
		try {
			const id = Number(req.params.id);
			const result = await AirportsService.deleteAirport(id);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async lockAirport(req, res, next) {
		try {
			const id = Number(req.params.id);
			const result = await AirportsService.lockAirport(id);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async unlockAirport(req, res, next) {
		try {
			const id = Number(req.params.id);
			const result = await AirportsService.unlockAirport(id);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}
}

export default AirportsController;
