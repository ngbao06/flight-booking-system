import UsersService from "./users.service.js";

const sendResult = (res, result) => {
	const statusCode = result?.statusCode || 500;
	return res.status(statusCode).json({
		success: Boolean(result?.ok),
		message: result?.message || "Internal server error",
		data: result?.data,
		pagination: result?.pagination
	});
};

class UsersController {
	static async createUser(req, res, next) {
		try {
			const result = await UsersService.createUser(req.body);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async getUsers(req, res, next) {
		try {
			const result = await UsersService.getUsers(req.query);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async getPassengersFullInfo(req, res, next) {
		try {
			const result = await UsersService.getPassengersFullInfo(req.query);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async getPassengerProfile(req, res, next) {
		try {
			const id = Number(req.params.id);
			const result = await UsersService.getPassengerProfile(id);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async getUserById(req, res, next) {
		try {
			const id = Number(req.params.id);
			const result = await UsersService.getUserById(id);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async updateUser(req, res, next) {
		try {
			const id = Number(req.params.id);
			const result = await UsersService.updateUser(id, req.body);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async deleteUser(req, res, next) {
		try {
			const id = Number(req.params.id);
			const result = await UsersService.deleteUser(id);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}
}

export default UsersController;
// users.controller.js
