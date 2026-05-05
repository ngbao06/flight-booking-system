import LoyaltyService from "./loyalty.service.js";

const sendResult = (res, result) => {
	const statusCode = result?.statusCode || 500;
	return res.status(statusCode).json({
		success: Boolean(result?.ok),
		message: result?.message || "Internal server error",
		data: result?.data
	});
};

class LoyaltyController {
	static async me(req, res, next) {
		try {
			const result = await LoyaltyService.me(req.user.id);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async exchangePoints(req, res, next) {
		try {
			const result = await LoyaltyService.exchangePoints(req.body);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}
}

export default LoyaltyController;
// loyalty.controller.js
