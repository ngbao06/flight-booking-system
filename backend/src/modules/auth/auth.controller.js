import AuthService from "./auth.service.js";

const sendResult = (res, result) => {
	const statusCode = result?.statusCode || 500;
	return res.status(statusCode).json({
		success: Boolean(result?.ok),
		message: result?.message || "Internal server error",
		data: result?.data
	});
};

class AuthController {
	static async register(req, res, next) {
		try {
			const result = await AuthService.register(req.body);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async login(req, res, next) {
		try {
			const result = await AuthService.login(req.body, req);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async logout(req, res, next) {
		try {
			const result = await AuthService.logout(req);
			res.clearCookie("sid");
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async me(req, res, next) {
		try {
			const result = await AuthService.me(req.user.id);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async updatePassword(req, res, next) {
		try {
			const result = await AuthService.updatePassword(req.user.id, req.body);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async requestResetPassword(req, res, next) {
		try {
			const result = await AuthService.requestResetPassword(req.body);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async confirmResetPassword(req, res, next) {
		try {
			const result = await AuthService.confirmResetPassword(req.body);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async updateProfile(req, res, next) {
		try {
			const result = await AuthService.updateProfile(req.user.id, req.body);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}
}

export default AuthController;
