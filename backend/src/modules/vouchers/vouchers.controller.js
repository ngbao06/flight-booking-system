import VouchersService from "./vouchers.service.js";

const sendResult = (res, result) => {
	const statusCode = result?.statusCode || 500;
	return res.status(statusCode).json({
		success: Boolean(result?.ok),
		message: result?.message || "Internal server error",
		data: result?.data,
		pagination: result?.pagination
	});
};

class VouchersController {
	static async createVoucher(req, res, next) {
		try {
			const result = await VouchersService.createVoucher(req.body, req.user);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async getVouchers(req, res, next) {
		try {
			const result = await VouchersService.getVouchers(req.query, req.user || null);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async getVoucherById(req, res, next) {
		try {
			const id = Number(req.params.id);
			const result = await VouchersService.getVoucherById(id, req.user || null);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async getMyVouchers(req, res, next) {
		try {
			const result = await VouchersService.getMyVouchers(req.user.id, req.query);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async deleteVoucher(req, res, next) {
		try {
			const id = Number(req.params.id);
			const result = await VouchersService.deleteVoucher(id, req.user);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async redeemVoucher(req, res, next) {
		try {
			const result = await VouchersService.redeemVoucher(req.user.id, req.body, req.user);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async useVoucher(req, res, next) {
		try {
			const result = await VouchersService.useVoucher(req.user.id, req.body, req.user);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async restoreVoucher(req, res, next) {
		try {
			const result = await VouchersService.restoreVoucher(req.user.id, req.body, req.user);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}
}

export default VouchersController;