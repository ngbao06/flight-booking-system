import FlightsRepository 		from "./flights.repository.js";
import redisClient 				from "../../config/redis.config.js";
import clearListCache 			from "../../common/utils/clearCache.js";
import eventBus , { Events } 	from "../../common/utils/eventsBus.js";

const TTL_id = 900; // 1h
const TTL_list = 300; // 5p
const MODULE_NAME = "flights";

class FlightsService {
	static async createFlight(payload) {
		const existing = await FlightsRepository.getByFlightNumber(payload.flightNumber);
		if (existing) {
			return {
				ok: false,
				statusCode: 409,
				message: "Flight number already exists"
			};
		}

		const created = await FlightsRepository.createFlight(payload);
		if (!created) {
			return {
				ok: false,
				statusCode: 500,
				message: "Failed to create flight"
			};
		}

		await clearListCache(MODULE_NAME);

		eventBus.emit(Events.CREATE_EVENT, {
			module: MODULE_NAME,
			action: 'CREATE',
			new_data: payload,
			user_id: 12321311
		});


		return {
			ok: true,
			statusCode: 201,
			message: "Flight created successfully",
			data: payload
		};
	}

	static async getFlights(filters = {}) {
		const cacheKey = `${MODULE_NAME}:list:${JSON.stringify(filters)}`;

		const cachedFlights = await redisClient.get(cacheKey);
		if (cachedFlights) {
			const parsed = JSON.parse(cachedFlights);
			return {
				ok: true,
				statusCode: 200,
				message: "Flights fetched successfully from cache",
				data: parsed.data,
				pagination: parsed.pagination
			}
		}

		const flights = await FlightsRepository.getFlightsComplex(filters);

		// if (flights) {
		// 	await redisClient.set(cacheKey, JSON.stringify(flights), { EX: TTL_list });
		// }
		// else {
		// 	return {
		// 		ok: false,
		// 		statusCode: 404,
		// 		message: "Flights not found"
		// 	}
		// }

		// return {
		// 	ok: true,
		// 	statusCode: 200,
		// 	message: "Flights fetched successfully",
		// 	data: flights || []
		// };

		if (flights && flights.data.length > 0) {
			const totalPages = Math.ceil(flights.totalItems / flights.limit);
			
			const responseData = {
				data: flights.data,
				pagination: {
					totalItems: flights.totalItems,
					totalPages: totalPages,
					currentPage: flights.page,
					pageSize: flights.limit
				}
			};

			await redisClient.set(cacheKey, JSON.stringify(responseData), { EX: TTL_list });

			return {
				ok: true,
				statusCode: 200,
				message: "Flights fetched successfully",
				data: responseData.data,
				pagination: responseData.pagination
			};
		}

		return {
			ok: false,
			statusCode: 404,
			message: "No flights found",
			data: []
		};
	}

	static async getFlightById(id) {
		const cacheKey = `${MODULE_NAME}:${id}`;

		// cache hit
		const cachedFlight = await redisClient.get(cacheKey);
		if (cachedFlight) {
			return {
				ok: true,
				statusCode: 200,
				message: "Flight fetched successfully from cache",
				data: JSON.parse(cachedFlight)
			}
		}

		// cache miss
		const flight = await FlightsRepository.getById(id);
		if (!flight) {
			return {
				ok: false,
				statusCode: 404,
				message: "Flight not found"
			};
		}

		await redisClient.set(cacheKey, JSON.stringify(flight), { EX: TTL_id });

		return {
			ok: true,
			statusCode: 200,
			message: "Flight fetched successfully",
			data: flight
		};
	}

	static async updateFlight(id, payload) {
		console.log(payload.reason || null);
		const existed = await FlightsRepository.getById(id);
		if (!existed) {
			return {
				ok: false,
				statusCode: 404,
				message: "Flight not found"
			};
		}

		if (payload.flightNumber && payload.flightNumber !== existed.flight_number) {
			const duplicated = await FlightsRepository.getByFlightNumber(payload.flightNumber);
			if (duplicated) {
				return {
					ok: false,
					statusCode: 409,
					message: "Flight number already exists"
				};
			}
		}

		const updated = await FlightsRepository.updateFlight(id, payload);
		if (updated) {
			await clearListCache(MODULE_NAME, id);

			eventBus.emit(Events.UPDATE_EVENT, {
                module: MODULE_NAME,
                action: 'UPDATE',
				id: id,
				old_data: existed,
                new_data: payload,
				user_id: 12321311
            });
			
			if (payload.reason) {
				console.log("emit")
				eventBus.emit(Events.FLIGHT_UPDATED, {
					flight_id: id,
					status: payload.status,
					old_data: existed,
					new_data: payload,
					reason: payload.reason,
					updated_by: "52400101"
				});
			}
		} 
		else {
			return {
				ok: false,
				statusCode: 500,
				message: "Failed to update flight"
			};
		}

		return {
			ok: true,
			statusCode: 200,
			message: "Flight updated successfully"
		};
	}

	static async deleteFlight(id) {
		// xoa cache neu co
		await clearListCache(MODULE_NAME, id);

		const existed = await FlightsRepository.getById(id);
		if (!existed) {
			return {
				ok: false,
				statusCode: 404,
				message: "Flight not found"
			};
		}
		
		const deleted = await FlightsRepository.deleteFlight(id);
		if (!deleted) {
			return {
				ok: false,
				statusCode: 500,
				message: "Failed to delete flight"
			};
		}

		eventBus.emit(Events.DELETE_EVENT, {
			module: MODULE_NAME,
			action: 'DELETE',
			id: id,
			old_data: existed,
			user_id: 12321311
		});

		return {
			ok: true,
			statusCode: 200,
			message: "Flight deleted successfully"
		};
	}
}

export default FlightsService;
// flights.service.js