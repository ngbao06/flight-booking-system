import { query } from "../../database/mysql/conn.js";
import { buildPagination, normalizePageLimit } from "../../common/utils/pagination.js";

class ReportsRepository {
	static appendDateRangeFilter(sql, params, columnName, filters = {}) {
		let nextSql = sql;

		if (filters.from) {
			nextSql += ` AND DATE(${columnName}) >= DATE(?)`;
			params.push(filters.from);
		}

		if (filters.to) {
			nextSql += ` AND DATE(${columnName}) <= DATE(?)`;
			params.push(filters.to);
		}

		return nextSql;
	}

	static async getRevenueSummary(filters = {}) {
		let sql = `
			SELECT
				COALESCE(SUM(p.amount), 0) AS totalRevenue,
				COUNT(*) AS successfulPayments
			FROM Payments p
			WHERE p.status = 'SUCCEED'
		`;
		const params = [];
		sql = this.appendDateRangeFilter(sql, params, "p.created_at", filters);

		const [rows] = await query(sql, params);
		return rows?.[0] || { totalRevenue: 0, successfulPayments: 0 };
	}

	static async getFlightStatusStats(filters = {}) {
		let sql = `
			SELECT
				COUNT(*) AS totalFlights,
				SUM(CASE WHEN f.status = 'DELAYED' THEN 1 ELSE 0 END) AS delayedFlights,
				SUM(CASE WHEN f.status = 'CANCELED' THEN 1 ELSE 0 END) AS canceledFlights
			FROM Flights f
			WHERE f.is_deleted = 0
		`;
		const params = [];
		sql = this.appendDateRangeFilter(sql, params, "f.departure_time", filters);

		const [rows] = await query(sql, params);
		return rows?.[0] || { totalFlights: 0, delayedFlights: 0, canceledFlights: 0 };
	}

	static async getUserLoyaltyStats(filters = {}) {
		let sql = `
			SELECT
				COUNT(DISTINCT u.id) AS totalRegisteredUsers,
				COUNT(DISTINCT CASE WHEN l.id IS NOT NULL THEN u.id END) AS loyaltyUsers
			FROM Users u
			LEFT JOIN Loyalty l ON l.passenger_id = u.id
			WHERE u.is_deleted = 0
		`;
		const params = [];
		sql = this.appendDateRangeFilter(sql, params, "u.created_at", filters);

		const [rows] = await query(sql, params);
		return rows?.[0] || { totalRegisteredUsers: 0, loyaltyUsers: 0 };
	}

	static async getTopAirlines(filters = {}, paginationInput = {}) {
		const { page, limit, offset } = normalizePageLimit(paginationInput, 5, 100);
		let fromSql = `
			FROM Airlines a
			LEFT JOIN Flights f
				ON f.airline_id = a.id
				AND f.is_deleted = 0
			LEFT JOIN Bookings b ON b.flight_id = f.id
			LEFT JOIN Payments p
				ON p.booking_id = b.id
				AND p.status = 'SUCCEED'
			WHERE a.is_deleted = 0
		`;
		const params = [];
		fromSql = this.appendDateRangeFilter(fromSql, params, "f.departure_time", filters);

		const groupedSql = `
			SELECT
				a.id AS airlineId,
				a.code AS airlineCode,
				a.name AS airlineName,
				COUNT(DISTINCT f.id) AS totalFlights,
				COUNT(DISTINCT p.id) AS successfulPayments,
				COALESCE(SUM(p.amount), 0) AS revenue
			${fromSql}
			GROUP BY a.id, a.code, a.name
			HAVING totalFlights > 0 OR successfulPayments > 0 OR revenue > 0
		`;

		const [countRows] = await query(
            `SELECT COUNT(*) AS total FROM (${groupedSql}) AS grouped_airlines`, 
            params
        );
		const totalItems = Number(countRows?.[0]?.total || 0);

		const [rows] = await query(
			`${groupedSql}
			 ORDER BY revenue DESC, totalFlights DESC, airlineId ASC
			 LIMIT ${limit} OFFSET ${offset}`,
			params
		);

		return {
			data: rows || [],
			pagination: buildPagination(totalItems, page, limit)
		};
	}

	static async getTopDestinations(filters = {}, paginationInput = {}) {
		const { page, limit, offset } = normalizePageLimit(paginationInput, 5, 100);
		let fromSql = `
			FROM Airports ap
			JOIN Flights f
				ON f.arrival_airport_id = ap.id
				AND f.is_deleted = 0
			LEFT JOIN Bookings b
				ON b.flight_id = f.id
				AND b.status = 'SUCCEED'
			LEFT JOIN Payments p
				ON p.booking_id = b.id
				AND p.status = 'SUCCEED'
			WHERE ap.is_deleted = 0
		`;
		const params = [];
		fromSql = this.appendDateRangeFilter(fromSql, params, "f.departure_time", filters);

		const groupedSql = `
			SELECT
				ap.id AS airportId,
				ap.iata_code AS iataCode,
				ap.name AS airportName,
				ap.city,
				ap.region,
				COUNT(DISTINCT f.id) AS totalFlights,
				COUNT(DISTINCT b.id) AS successfulBookings,
				COALESCE(SUM(p.amount), 0) AS revenue
			${fromSql}
			GROUP BY ap.id, ap.iata_code, ap.name, ap.city, ap.region
			HAVING totalFlights > 0 OR successfulBookings > 0 OR revenue > 0
		`;

		const [countRows] = await query(
            `SELECT COUNT(*) AS total FROM (${groupedSql}) AS grouped_destinations`, 
            params
        );
		const totalItems = Number(countRows?.[0]?.total || 0);

		const [rows] = await query(
			`${groupedSql}
			 ORDER BY successfulBookings DESC, revenue DESC, airportId ASC
			 LIMIT ${limit} OFFSET ${offset}`,
			params
		);

		return {
			data: rows || [],
			pagination: buildPagination(totalItems, page, limit)
		};
	}

	static async getDashboardReport(filters = {}, paginationInput = {}) {
		const [revenueSummary, flightStatusStats, userLoyaltyStats, topAirlines, topDestinations] = await Promise.all([
			this.getRevenueSummary(filters),
			this.getFlightStatusStats(filters),
			this.getUserLoyaltyStats(filters),
			this.getTopAirlines(filters, paginationInput),
			this.getTopDestinations(filters, paginationInput)
		]);

		return {
			revenueSummary,
			flightStatusStats,
			userLoyaltyStats,
			topAirlines,
			topDestinations
		};
	}
}

export default ReportsRepository;
