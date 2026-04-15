import FlightsRepository from "./flights.repository.js";
import redisClient from "../../config/redis.config.js";
import clearListCache from "../../common/utils/clearCache.js";

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
			return {
				ok: true,
				statusCode: 200,
				message: "Flights fetched successfully from cache",
				data: JSON.parse(cachedFlights)
			}
		}

		// const {
		// 	flightNumber,
		// 	planeId,
		// 	airlineId,
		// 	departureAirportId,
		// 	arrivalAirportId,
		// 	departureTime,
		// 	arrivalTime,
		// 	status
		// } = filters;

		// let flights;
		// if (flightNumber) {
		// 	flight = await FlightsRepository.getByFlightNumber(flightNumber);
		// }
		// else if (planeId !== undefined) {
		// 	flights = await FlightsRepository.getByPlaneId(planeId);
		// }
		// else if (airlineId !== undefined) {
		// 	flights = await FlightsRepository.getByAirlineId(airlineId);
		// }
		// else if (departureAirportId !== undefined) {
		// 	flights = await FlightsRepository.getByDepartureAirport(departureAirportId);
		// }
		// else if (arrivalAirportId !== undefined) {
		// 	flights = await FlightsRepository.getByArrivalAirport(arrivalAirportId);
		// }
		// else if (departureTime) {
		// 	flights = await FlightsRepository.getByDepartureTime(departureTime);
		// }
		// else if (arrivalTime) {
		// 	flights = await FlightsRepository.getByArrivalTime(arrivalTime);
		// }
		// else if (status) {
		// 	flights = await FlightsRepository.getByStatus(status);
		// }
		// else flights = await FlightsRepository.getAll();

		const flights = await FlightsRepository.getFlightsComplex(filters);

		if (flights) {
			await redisClient.set(cacheKey, JSON.stringify(flights), { EX: TTL_list });
		}

		return {
			ok: true,
			statusCode: 200,
			message: "Flights fetched successfully",
			data: flights || []
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
		if (!updated) {
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
		const cacheKey = `${MODULE_NAME}:${id}`;
		await redisClient.del(cacheKey);
		await clearListCache(MODULE_NAME);

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

		return {
			ok: true,
			statusCode: 200,
			message: "Flight deleted successfully"
		};
	}
}

export default FlightsService;
// flights.service.js
