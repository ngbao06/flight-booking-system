import VouchersRepository from "./vouchers.repository.js";
import eventBus, { Events } from "../../common/utils/eventsBus.js";
import SagaLogsRepository from "../../common/saga/sagaLogs.repository.js";

const MODULE_NAME = "vouchers";

const logVoucherSaga = (actorId, step, status, message, details = {}) => {
	return SagaLogsRepository.log(actorId || 0, step, status, message, {
		...details,
		saga_type: "VOUCHER"
	});
};

class VouchersService {
	static async createVoucher(payload, actor = {}) {
		const duplicated = await VouchersRepository.getVoucherByCode(payload.code, { includeDeleted: true, includeExpired: true });
		if (duplicated) {
			return {
				ok: false,
				statusCode: 409,
				message: "Voucher code already exists"
			};
		}

		const created = await VouchersRepository.createVoucher(payload);
		if (!created) {
			return {
				ok: false,
				statusCode: 500,
				message: "Failed to create voucher"
			};
		}

		const voucher = await VouchersRepository.getVoucherByCode(payload.code, { includeDeleted: true, includeExpired: true });
		eventBus.emit(Events.CREATE_EVENT, {
			module: MODULE_NAME,
			action: "CREATE",
			user_id: actor.id || null,
			old_data: null,
			new_data: voucher
		});

		return {
			ok: true,
			statusCode: 201,
			message: "Voucher created successfully",
			data: voucher
		};
	}

	static async getVouchers(filters = {}, viewer = null) {
		const includeExpired = viewer?.role === "ADMIN" ? Boolean(filters.includeExpired) : false;
		const vouchers = await VouchersRepository.getVouchers(filters, {
			includeExpired
		});

		return {
			ok: true,
			statusCode: 200,
			message: "Vouchers fetched successfully",
			data: vouchers.data || vouchers,
			pagination: vouchers.pagination
		};
	}

	static async getVoucherById(id, viewer = null) {
		const voucher = await VouchersRepository.getVoucherById(id, {
			includeDeleted: viewer?.role === "ADMIN",
			includeExpired: viewer?.role === "ADMIN"
		});

		if (!voucher) {
			return {
				ok: false,
				statusCode: 404,
				message: "Voucher not found"
			};
		}

		return {
			ok: true,
			statusCode: 200,
			message: "Voucher fetched successfully",
			data: voucher
		};
	}

	static async getMyVouchers(userId, filters = {}) {
		const vouchers = await VouchersRepository.getMyVouchers(userId, filters);

		return {
			ok: true,
			statusCode: 200,
			message: "Your vouchers fetched successfully",
			data: vouchers.data || vouchers,
			pagination: vouchers.pagination
		};
	}

	static async deleteVoucher(id, actor = {}) {
		const existed = await VouchersRepository.getVoucherById(id, { includeDeleted: true, includeExpired: true });
		if (!existed) {
			return {
				ok: false,
				statusCode: 404,
				message: "Voucher not found"
			};
		}

		const deleted = await VouchersRepository.deleteVoucher(id);
		if (!deleted) {
			return {
				ok: false,
				statusCode: 500,
				message: "Failed to delete voucher"
			};
		}

		const newData = await VouchersRepository.getVoucherById(id, { includeDeleted: true, includeExpired: true });
		eventBus.emit(Events.DELETE_EVENT, {
			module: MODULE_NAME,
			action: "DELETE",
			id,
			user_id: actor.id || null,
			old_data: existed,
			new_data: newData
		});

		return {
			ok: true,
			statusCode: 200,
			message: "Voucher deleted successfully",
			data: newData
		};
	}

	static async redeemVoucher(userId, payload, actor = {}) {
		const sagaId = actor.id || userId;
		await logVoucherSaga(sagaId, "VOUCHER_REDEEM", "STARTED", "Redeem voucher requested", {
			voucherId: payload.voucherId
		});

		const result = await VouchersRepository.redeemVoucherWithPoints(userId, payload.voucherId);

		if (!result.ok) {
			await logVoucherSaga(sagaId, "VOUCHER_REDEEM", "FAILED", result.message || "Redeem voucher failed", {
				voucherId: payload.voucherId
			});
			return result;
		}

		await logVoucherSaga(sagaId, "VOUCHER_REDEEM", "SUCCESS", "Voucher redeemed successfully", {
			voucherId: payload.voucherId,
			userVoucherId: result.data?.voucher?.user_voucher_id || result.data?.voucher?.id || null,
			pointsUsed: result.data?.loyalty?.points_used || null
		});

		eventBus.emit(Events.CREATE_EVENT, {
			module: MODULE_NAME,
			action: "REDEEM",
			user_id: actor.id || userId,
			new_data: result.data
		});

		return result;
	}

	static async useVoucher(userId, payload, actor = {}) {
		const sagaId = actor.id || userId;
		await logVoucherSaga(sagaId, "VOUCHER_USE", "STARTED", "Use voucher requested", {
			userVoucherId: payload.userVoucherId
		});

		const result = await VouchersRepository.useVoucher(userId, payload.userVoucherId);

		if (!result.ok) {
			await logVoucherSaga(sagaId, "VOUCHER_USE", "FAILED", result.message || "Use voucher failed", {
				userVoucherId: payload.userVoucherId
			});
			return result;
		}

		await logVoucherSaga(sagaId, "VOUCHER_USE", "SUCCESS", "Voucher applied successfully", {
			userVoucherId: payload.userVoucherId,
			voucherId: result.data?.voucher_id || null
		});

		eventBus.emit(Events.UPDATE_EVENT, {
			module: MODULE_NAME,
			action: "USE",
			user_id: actor.id || userId,
			old_data: result.old_data || {},
			new_data: result.data
		});

		return result;
	}

	static async restoreVoucher(userId, payload, actor = {}) {
		const sagaId = actor.id || userId;
		await logVoucherSaga(sagaId, "VOUCHER_RESTORE", "STARTED", "Restore voucher requested", {
			userVoucherId: payload.userVoucherId
		});

		const result = await VouchersRepository.restoreUsedVoucher(userId, payload.userVoucherId);

		if (!result.ok) {
			await logVoucherSaga(sagaId, "VOUCHER_RESTORE", "FAILED", result.message || "Restore voucher failed", {
				userVoucherId: payload.userVoucherId
			});
			return result;
		}

		await logVoucherSaga(sagaId, "VOUCHER_RESTORE", "COMPENSATED", "Voucher restored successfully", {
			userVoucherId: payload.userVoucherId,
			voucherId: result.data?.voucher_id || null
		});

		return result;
	}
}

export default VouchersService;