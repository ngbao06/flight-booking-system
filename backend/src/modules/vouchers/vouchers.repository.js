import { query, withTransaction } from "../../database/mysql/conn.js";
import { normalizePageLimit, paginateQuery } from "../../common/utils/pagination.js";

const voucherSelectSql = `
SELECT
	id,
	code,
	discount_type,
	discount_value,
	max_discount,
	valid_from,
	valid_to,
	point_cost,
	is_deleted,
	CASE
		WHEN is_deleted = 0 AND valid_from <= NOW() AND valid_to >= NOW() THEN 1
		ELSE 0
	END AS is_active
`;

const buildVoucherFilters = (filters = {}, options = {}) => {
	let fromSql = "FROM Vouchers WHERE 1=1";
	const params = [];

	if (!options.includeDeleted) {
		fromSql += " AND is_deleted = 0";
	}

	if (!options.includeExpired) {
		fromSql += " AND valid_from <= NOW() AND valid_to >= NOW()";
	}

	if (filters.code) {
		fromSql += " AND code = ?";
		params.push(filters.code);
	}

	if (filters.discount_type) {
		fromSql += " AND discount_type = ?";
		params.push(filters.discount_type);
	}

	return { fromSql, params };
};

class VouchersRepository {
	static async createVoucher(payload) {
		const [result] = await query(
			`
			INSERT INTO Vouchers (
				code, discount_type, discount_value, max_discount, valid_from, valid_to, point_cost
			) VALUES (?, ?, ?, ?, ?, ?, ?)
			`,
			[
				payload.code,
				payload.discount_type,
				payload.discount_value,
				payload.max_discount ?? null,
				payload.valid_from,
				payload.valid_to,
				payload.point_cost ?? null
			]
		);

		return result.affectedRows > 0;
	}

	static async deleteVoucher(id) {
		const [result] = await query(
			`
			UPDATE Vouchers
			SET is_deleted = 1
			WHERE id = ?
			`,
			[id]
		);

		return result.affectedRows > 0;
	}

	static async getVoucherById(id, options = {}) {
		let sql = `${voucherSelectSql} FROM Vouchers WHERE id = ?`;
		const params = [id];

		if (!options.includeDeleted) {
			sql += " AND is_deleted = 0";
		}

		if (!options.includeExpired) {
			sql += " AND valid_from <= NOW() AND valid_to >= NOW()";
		}

		const [result] = await query(sql, params);
		return result.length > 0 ? result[0] : null;
	}

	static async getVoucherByCode(code, options = {}) {
		let sql = `${voucherSelectSql} FROM Vouchers WHERE code = ?`;
		const params = [code];

		if (!options.includeDeleted) {
			sql += " AND is_deleted = 0";
		}

		if (!options.includeExpired) {
			sql += " AND valid_from <= NOW() AND valid_to >= NOW()";
		}

		const [result] = await query(sql, params);
		return result.length > 0 ? result[0] : null;
	}

	static async getVouchers(filters = {}, options = {}) {
		const { fromSql, params } = buildVoucherFilters(filters, options);

		if (filters.page !== undefined || filters.limit !== undefined) {
			const { page, limit } = normalizePageLimit(filters, 20, 100);
			return paginateQuery({
				selectSql: voucherSelectSql,
				fromSql,
				params,
				page,
				limit,
				orderBy: "ORDER BY valid_to DESC, id DESC"
			});
		}

		const [rows] = await query(`${voucherSelectSql} ${fromSql} ORDER BY valid_to DESC, id DESC`, params);
		return rows.length > 0 ? rows : [];
	}

	static async getMyVouchers(userId, filters = {}) {
		let fromSql = `
		FROM UserVouchers uv
		JOIN Vouchers v ON v.id = uv.voucher_id
		WHERE uv.user_id = ?
		`;
		const params = [userId];

		if (filters.status) {
			fromSql += " AND uv.status = ?";
			params.push(filters.status);
		}

		if (filters.page !== undefined || filters.limit !== undefined) {
			const { page, limit } = normalizePageLimit(filters, 20, 100);
			return paginateQuery({
				selectSql: `
				SELECT
					uv.id AS user_voucher_id,
					uv.user_id,
					uv.voucher_id,
					uv.acquired_at,
					uv.used_at,
					uv.status,
					v.code,
					v.discount_type,
					v.discount_value,
					v.max_discount,
					v.valid_from,
					v.valid_to,
					v.point_cost,
					CASE
						WHEN uv.status = 'AVAILABLE' AND v.is_deleted = 0 AND v.valid_from <= NOW() AND v.valid_to >= NOW()
						THEN 1 ELSE 0
					END AS can_use
				`,
				fromSql,
				params,
				page,
				limit,
				orderBy: "ORDER BY uv.acquired_at DESC, uv.id DESC"
			});
		}

		const [rows] = await query(
			`
			SELECT
				uv.id AS user_voucher_id,
				uv.user_id,
				uv.voucher_id,
				uv.acquired_at,
				uv.used_at,
				uv.status,
				v.code,
				v.discount_type,
				v.discount_value,
				v.max_discount,
				v.valid_from,
				v.valid_to,
				v.point_cost,
				CASE
					WHEN uv.status = 'AVAILABLE' AND v.is_deleted = 0 AND v.valid_from <= NOW() AND v.valid_to >= NOW()
					THEN 1 ELSE 0
				END AS can_use
			${fromSql}
			ORDER BY uv.acquired_at DESC, uv.id DESC
			`,
			params
		);

		return rows.length > 0 ? rows : [];
	}

	static async redeemVoucherWithPoints(userId, voucherId) {
		try {
			return await withTransaction(async (conn) => {
				const [voucherRows] = await conn.execute(
					`
					SELECT id, code, discount_type, discount_value, max_discount, valid_from, valid_to, point_cost, is_deleted
					FROM Vouchers
					WHERE id = ?
					FOR UPDATE
					`,
					[voucherId]
				);

				const voucher = voucherRows?.[0];
				if (!voucher || voucher.is_deleted) {
					throw Object.assign(new Error("Voucher not found"), { statusCode: 404 });
				}

				if (new Date(voucher.valid_to) < new Date()) {
					throw Object.assign(new Error("Voucher is expired"), { statusCode: 400 });
				}

				if (voucher.point_cost === null || Number(voucher.point_cost) <= 0) {
					throw Object.assign(new Error("Voucher cannot be redeemed with points"), { statusCode: 400 });
				}

				const [loyaltyRows] = await conn.execute(
					`
					SELECT passenger_id, points, points_used, miles_traveled
					FROM Loyalty
					WHERE passenger_id = ?
					FOR UPDATE
					`,
					[userId]
				);

				const loyalty = loyaltyRows?.[0];
				if (!loyalty) {
					throw Object.assign(new Error("Passenger loyalty record not found"), { statusCode: 404 });
				}

				if (Number(loyalty.points) < Number(voucher.point_cost)) {
					throw Object.assign(new Error("Not enough points to redeem this voucher"), { statusCode: 400 });
				}

				await conn.execute(
					`
					UPDATE Loyalty
					SET points = points - ?, points_used = points_used + ?
					WHERE passenger_id = ?
					`,
					[voucher.point_cost, voucher.point_cost, userId]
				);

				const [insertResult] = await conn.execute(
					`
					INSERT INTO UserVouchers (user_id, voucher_id, status)
					VALUES (?, ?, 'AVAILABLE')
					`,
					[userId, voucherId]
				);

				const [userVoucherRows] = await conn.execute(
					`
					SELECT
						uv.id AS user_voucher_id,
						uv.user_id,
						uv.voucher_id,
						uv.acquired_at,
						uv.used_at,
						uv.status,
						v.code,
						v.discount_type,
						v.discount_value,
						v.max_discount,
						v.valid_from,
						v.valid_to,
						v.point_cost
					FROM UserVouchers uv
					JOIN Vouchers v ON v.id = uv.voucher_id
					WHERE uv.id = ?
					`,
					[insertResult.insertId]
				);

				return {
					ok: true,
					statusCode: 201,
					message: "Voucher redeemed successfully",
					data: {
						voucher: userVoucherRows?.[0] || null,
						loyalty: {
							passenger_id: userId,
							points: Number(loyalty.points) - Number(voucher.point_cost),
							points_used: Number(loyalty.points_used) + Number(voucher.point_cost)
						}
					}
				};
			});
		} catch (error) {
			if (error?.statusCode) {
				return {
					ok: false,
					statusCode: error.statusCode,
					message: error.message
				};
			}

			throw error;
		}
	}

	static async useVoucher(userId, userVoucherId) {
		try {
			return await withTransaction(async (conn) => {
				const [userVoucherRows] = await conn.execute(
					`
					SELECT
						uv.id AS user_voucher_id,
						uv.user_id,
						uv.voucher_id,
						uv.acquired_at,
						uv.used_at,
						uv.status,
						v.code,
						v.discount_type,
						v.discount_value,
						v.max_discount,
						v.valid_from,
						v.valid_to,
						v.point_cost,
						v.is_deleted
					FROM UserVouchers uv
					JOIN Vouchers v ON v.id = uv.voucher_id
					WHERE uv.id = ? AND uv.user_id = ?
					FOR UPDATE
					`,
					[userVoucherId, userId]
				);

				const userVoucher = userVoucherRows?.[0];
				if (!userVoucher) {
					throw Object.assign(new Error("User voucher not found"), { statusCode: 404 });
				}

				if (userVoucher.status !== "AVAILABLE") {
					throw Object.assign(new Error("Voucher is not available to use"), { statusCode: 400 });
				}

				if (userVoucher.is_deleted || new Date(userVoucher.valid_to) < new Date()) {
					throw Object.assign(new Error("Voucher is expired or invalid"), { statusCode: 400 });
				}

				// Capture old state before update for audit logging
				const oldState = {
					status: userVoucher.status,
					used_at: userVoucher.used_at
				};

				await conn.execute(
					`
					UPDATE UserVouchers
					SET status = 'USED', used_at = NOW()
					WHERE id = ? AND user_id = ? AND status = 'AVAILABLE'
					`,
					[userVoucherId, userId]
				);

				const [updatedRows] = await conn.execute(
					`
					SELECT
						uv.id AS user_voucher_id,
						uv.user_id,
						uv.voucher_id,
						uv.acquired_at,
						uv.used_at,
						uv.status,
						v.code,
						v.discount_type,
						v.discount_value,
						v.max_discount,
						v.valid_from,
						v.valid_to,
						v.point_cost
					FROM UserVouchers uv
					JOIN Vouchers v ON v.id = uv.voucher_id
					WHERE uv.id = ?
					`,
					[userVoucherId]
				);

				return {
					ok: true,
					statusCode: 200,
					message: "Voucher used successfully",
					data: updatedRows?.[0] || null,
					old_data: oldState
				};
			});
		} catch (error) {
			if (error?.statusCode) {
				return {
					ok: false,
					statusCode: error.statusCode,
					message: error.message
				};
			}

			throw error;
		}
	}

	static async restoreUsedVoucher(userId, userVoucherId) {
		try {
			return await withTransaction(async (conn) => {
				const hasUserFilter = userId !== null && userId !== undefined;
				const sql = `
					SELECT
						uv.id AS user_voucher_id,
						uv.user_id,
						uv.voucher_id,
						uv.acquired_at,
						uv.used_at,
						uv.status,
						v.code,
						v.discount_type,
						v.discount_value,
						v.max_discount,
						v.valid_from,
						v.valid_to,
						v.point_cost,
						v.is_deleted
					FROM UserVouchers uv
					JOIN Vouchers v ON v.id = uv.voucher_id
					WHERE uv.id = ?${hasUserFilter ? ' AND uv.user_id = ?' : ''}
					FOR UPDATE
				`;
				const params = hasUserFilter ? [userVoucherId, userId] : [userVoucherId];
				const [userVoucherRows] = await conn.execute(sql, params);

				const userVoucher = userVoucherRows?.[0];
				if (!userVoucher) {
					throw Object.assign(new Error("User voucher not found"), { statusCode: 404 });
				}

				if (userVoucher.status !== "USED") {
					throw Object.assign(new Error("Voucher is not in USED state"), { statusCode: 400 });
				}

				const oldState = {
					status: userVoucher.status,
					used_at: userVoucher.used_at
				};

				await conn.execute(
					`
					UPDATE UserVouchers
					SET status = 'AVAILABLE', used_at = NULL
					WHERE id = ?${hasUserFilter ? ' AND user_id = ?' : ''}
					`,
					hasUserFilter ? [userVoucherId, userId] : [userVoucherId]
				);

				const [updatedRows] = await conn.execute(
					`
					SELECT
						uv.id AS user_voucher_id,
						uv.user_id,
						uv.voucher_id,
						uv.acquired_at,
						uv.used_at,
						uv.status,
						v.code,
						v.discount_type,
						v.discount_value,
						v.max_discount,
						v.valid_from,
						v.valid_to,
						v.point_cost
					FROM UserVouchers uv
					JOIN Vouchers v ON v.id = uv.voucher_id
					WHERE uv.id = ?
					`,
					[userVoucherId]
				);

				return {
					ok: true,
					statusCode: 200,
					message: "Voucher restored successfully",
					data: updatedRows?.[0] || null,
					old_data: oldState
				};
			});
		} catch (error) {
			if (error?.statusCode) {
				return {
					ok: false,
					statusCode: error.statusCode,
					message: error.message
				};
			}

			throw error;
		}
	}
}

export default VouchersRepository;