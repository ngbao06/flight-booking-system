import AirlinesRepository from "./airlines.repository.js";
import eventBus , { Events } 	from "../../common/utils/eventsBus.js";

const MODULE_NAME = 'airlines';

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

		eventBus.emit(Events.CREATE_EVENT, {
			module: MODULE_NAME,
			action: 'CREATE',
			new_data: payload,
			user_id: 12321311
		});

		const airline = await AirlinesRepository.getAirlineByCode(payload.code);
		return {
			ok: true,
			statusCode: 201,
			message: "Airline created successfully",
			data: airline
		};
	}

	static async getAirlines(filters = {}) {
		const airlines = await AirlinesRepository.getAirlinesComplex(filters);
		
		if (!airlines) {
			return {
				ok: false,
				statusCode: 404,
				message: "Airline not found"
			};
		}

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

		eventBus.emit(Events.UPDATE_EVENT, {
			module: MODULE_NAME,
			action: 'UPDATE',
			id: id,
			old_data: existed,
			new_data: payload,
			user_id: 12321311
		});

		return {
			ok: true,
			statusCode: 200,
			message: "Airline updated successfully"
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

		const newData = await AirlinesRepository.getAirlineById(id);

		eventBus.emit(Events.UPDATE_EVENT, {
			module: MODULE_NAME,
			action: 'DELETE',
			id: id,
			old_data: existed,
			new_data: newData
		});

		return {
			ok: true,
			statusCode: 200,
			message: "Airline deleted successfully",
			data: newData
		};
	}
}

export default AirlinesService;
