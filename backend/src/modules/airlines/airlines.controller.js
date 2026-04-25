import AirlinesService from "./airlines.service.js";

const sendResult = (res, result) => {
	const statusCode = result?.statusCode || 500;
	return res.status(statusCode).json({
		success: Boolean(result?.ok),
		message: result?.message || "Internal server error",
		data: result?.data,
		pagination: result?.pagination
	});
};

class AirlinesController {
	static async createAirline(req, res, next) {
		try {
			const result = await AirlinesService.createAirline(req.body);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async getAirlines(req, res, next) {
		try {
			const result = await AirlinesService.getAirlines(req.query);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async getAirlineById(req, res, next) {
		try {
			const id = Number(req.params.id);
			const result = await AirlinesService.getAirlineById(id);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async updateAirline(req, res, next) {
		try {
			const id = Number(req.params.id);
			const result = await AirlinesService.updateAirline(id, req.body);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async deleteAirline(req, res, next) {
		try {
			const id = Number(req.params.id);
			const result = await AirlinesService.deleteAirline(id);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}
}

export default AirlinesController;
