import ReportsRepository from "./reports.repository.js";
import redisClient from "../../config/redis.config.js";
import { normalizePageLimit } from "../../common/utils/pagination.js";

const MODULE_NAME = "reports";
const TTL_DASHBOARD = 300;

class ReportsService {
	static toSafeNumber(value) {
		const nextValue = Number(value);
		return Number.isFinite(nextValue) ? nextValue : 0;
	}

	static toPercent(numerator, denominator) {
		if (!denominator) return 0;
		return Number(((numerator / denominator) * 100).toFixed(2));
	}

	static async getDashboardReport(query = {}) {
		const filters = {
			from: query.from,
			to: query.to
		};

		const { page, limit } = normalizePageLimit(
			{ page: query.page, limit: query.limit },
			5,
			100
		);

		const cachePayload = {
			...filters,
			page,
			limit
		};
		const cacheKey = `${MODULE_NAME}:dashboard:${JSON.stringify(cachePayload)}`;

		const cachedDashboard = await redisClient.get(cacheKey);
		if (cachedDashboard) {
			const parsed = JSON.parse(cachedDashboard);
			return {
				ok: true,
				statusCode: 200,
				message: "Dashboard report fetched successfully from cache",
				data: parsed.data,
				pagination: parsed.pagination
			};
		}

		const dashboard = await ReportsRepository.getDashboardReport(filters, { page, limit });

		const totalRevenue = this.toSafeNumber(dashboard?.revenueSummary?.totalRevenue);
		const successfulPayments = this.toSafeNumber(dashboard?.revenueSummary?.successfulPayments);

		const totalFlights = this.toSafeNumber(dashboard?.flightStatusStats?.totalFlights);
		const delayedFlights = this.toSafeNumber(dashboard?.flightStatusStats?.delayedFlights);
		const canceledFlights = this.toSafeNumber(dashboard?.flightStatusStats?.canceledFlights);

		const totalRegisteredUsers = this.toSafeNumber(dashboard?.userLoyaltyStats?.totalRegisteredUsers);
		const loyaltyUsers = this.toSafeNumber(dashboard?.userLoyaltyStats?.loyaltyUsers);

		const data = {
			summary: {
				totalRevenue,
				successfulPayments,
				flights: {
					totalFlights,
					delayedFlights,
					canceledFlights,
					delayRate: this.toPercent(delayedFlights, totalFlights),
					cancelRate: this.toPercent(canceledFlights, totalFlights)
				},
				users: {
					totalRegisteredUsers,
					loyaltyUsers,
					loyaltyRate: this.toPercent(loyaltyUsers, totalRegisteredUsers)
				}
			},
			topAirlines: dashboard?.topAirlines?.data || [],
			topDestinations: dashboard?.topDestinations?.data || [],
			filtersApplied: {
				from: filters.from || null,
				to: filters.to || null
			}
		};

		const pagination = {
			topAirlines: dashboard?.topAirlines?.pagination,
			topDestinations: dashboard?.topDestinations?.pagination
		};

		await redisClient.set(cacheKey, JSON.stringify({ data, pagination }), { EX: TTL_DASHBOARD });

		return {
			ok: true,
			statusCode: 200,
			message: "Dashboard report fetched successfully",
			data,
			pagination
		};
	}
}

export default ReportsService;
