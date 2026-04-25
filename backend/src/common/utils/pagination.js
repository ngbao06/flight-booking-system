import { query } from "../../database/mysql/conn.js";

export function normalizePageLimit(filters = {}, defaultLimit = 10, maxLimit = 1000) {
	const page = Math.max(1, Number(filters.page) || 1);
	const limit = Math.min(maxLimit, Math.max(1, Number(filters.limit) || defaultLimit));
	const offset = (page - 1) * limit;

	return { page, limit, offset };
}

export function buildPagination(totalItems, page, limit) {
	const safeTotalItems = Number(totalItems) || 0;
	const safePage = Math.max(1, Number(page) || 1);
	const safeLimit = Math.max(1, Number(limit) || 1);
	const totalPages = safeLimit > 0 ? Math.ceil(safeTotalItems / safeLimit) : 0;

	return {
		totalItems: safeTotalItems,
		totalRecords: safeTotalItems,
		currentPage: safePage,
		pageSize: safeLimit,
		totalPages,
		hasNextPage: safePage < totalPages,
		hasPrevPage: safePage > 1
	};
}

export async function paginateQuery({ selectSql = "SELECT *", fromSql, params = [], page = 1, limit = 10, orderBy = "ORDER BY id ASC" }) {
	const countSql = `SELECT COUNT(*) as total ${fromSql}`;
	const [countRows] = await query(countSql, params);
	const totalItems = Number(countRows?.[0]?.total || 0);
	const safePage = Math.max(1, Number(page) || 1);
	const safeLimit = Math.max(1, Number(limit) || 1);
	const offset = (safePage - 1) * safeLimit;
	const sql = `${selectSql} ${fromSql}${orderBy ? ` ${orderBy}` : ""} LIMIT ${safeLimit} OFFSET ${offset}`;
	const [rows] = await query(sql, params);

	return {
		data: rows,
		pagination: buildPagination(totalItems, safePage, safeLimit),
		totalItems,
		page: safePage,
		limit: safeLimit
	};
}