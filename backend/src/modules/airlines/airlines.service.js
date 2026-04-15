import AirlinesRepository from "./airlines.repository.js";

class AirlinesService {
	static async createAirline(payload) {
		const existing = await AirlinesRepository.getAirlineByCode(payload.code);
		if (existing) {
			return {
				ok: false,
				statusCode: 409,
				message: "Airline code already exists"
			};
		}

		const created = await AirlinesRepository.createAirline(payload);
		if (!created) {
			return {
				ok: false,
				statusCode: 500,
				message: "Failed to create airline"
			};
		}

		const airline = await AirlinesRepository.getAirlineByCode(payload.code);
		return {
			ok: true,
			statusCode: 201,
			message: "Airline created successfully",
			data: airline
		};
	}

	static async getAirlines(filters = {}) {
		const { id, code, name } = filters;

		if (id !== undefined) {
			const airline = await AirlinesRepository.getAirlineById(Number(id));
			if (!airline) {
				return {
					ok: false,
					statusCode: 404,
					message: "Airline not found"
				};
			}

			return {
				ok: true,
				statusCode: 200,
				message: "Airline fetched successfully",
				data: airline
			};
		}

		if (code) {
			const airline = await AirlinesRepository.getAirlineByCode(code);
			if (!airline) {
				return {
					ok: false,
					statusCode: 404,
					message: "Airline not found"
				};
			}

			return {
				ok: true,
				statusCode: 200,
				message: "Airline fetched successfully",
				data: airline
			};
		}

		if (name) {
			const airlines = await AirlinesRepository.getAirlineByName(name);
			return {
				ok: true,
				statusCode: 200,
				message: "Airlines fetched successfully",
				data: airlines || []
			};
		}

		const airlines = await AirlinesRepository.getAllAirline();
		return {
			ok: true,
			statusCode: 200,
			message: "Airlines fetched successfully",
			data: airlines || []
		};
	}

	static async getAirlineById(id) {
		const airline = await AirlinesRepository.getAirlineById(id);
		if (!airline) {
			return {
				ok: false,
				statusCode: 404,
				message: "Airline not found"
			};
		}

		return {
			ok: true,
			statusCode: 200,
			message: "Airline fetched successfully",
			data: airline
		};
	}

	static async updateAirline(id, payload) {
		const existed = await AirlinesRepository.getAirlineById(id);
		if (!existed) {
			return {
				ok: false,
				statusCode: 404,
				message: "Airline not found"
			};
		}

		if (payload.code && payload.code !== existed.code) {
			const duplicated = await AirlinesRepository.getAirlineByCode(payload.code);
			if (duplicated) {
				return {
					ok: false,
					statusCode: 409,
					message: "Airline code already exists"
				};
			}
		}

		const updated = await AirlinesRepository.updateAirline(id, payload);
		if (!updated) {
			return {
				ok: false,
				statusCode: 500,
				message: "Failed to update airline"
			};
		}

		const airline = await AirlinesRepository.getAirlineById(id);
		return {
			ok: true,
			statusCode: 200,
			message: "Airline updated successfully",
			data: airline
		};
	}

	static async deleteAirline(id) {
		const existed = await AirlinesRepository.getAirlineById(id);
		if (!existed) {
			return {
				ok: false,
				statusCode: 404,
				message: "Airline not found"
			};
		}

		const deleted = await AirlinesRepository.deleteAirline(id);
		if (!deleted) {
			return {
				ok: false,
				statusCode: 500,
				message: "Failed to delete airline"
			};
		}

		return {
			ok: true,
			statusCode: 200,
			message: "Airline deleted successfully"
		};
	}
}

export default AirlinesService;
