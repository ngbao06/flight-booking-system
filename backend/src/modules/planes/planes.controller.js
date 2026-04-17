import PlaneService from "./planes.service.js";

const sendResult = (res, result) => {
	const statusCode = result?.statusCode || 500;
	return res.status(statusCode).json({
		success: Boolean(result?.ok),
		message: result?.message || "Internal server error",
		data: result?.data
	});
};

class PlaneController {
	static async createPlane(req, res, next) {
		try {
			const result = await PlaneService.createPlane(req.body);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async getPlanes(req, res, next) {
		try {
			const result = await PlaneService.getPlanes(req.query);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async getPlaneById(req, res, next) {
		try {
			const id = Number(req.params.id);
			const result = await PlaneService.getPlaneById(id);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async updatePlane(req, res, next) {
		try {
			const id = Number(req.params.id);
			const result = await PlaneService.updatePlane(id, req.body);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async deletePlane(req, res, next) {
		try {
			const id = Number(req.params.id);
			const result = await PlaneService.deletePlane(id);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}
}

export default PlaneController;
