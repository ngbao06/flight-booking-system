import AirportsRepository from "./airports.repository.js";
import eventBus, { Events } from "../../common/utils/eventsBus.js";


const MODULE_NAME = "airports";

class AirportsService {
    static async createAirport(payload) {
        const existing = await AirportsRepository.getByIataCode(payload.iataCode);
        if (existing) {
            return {
                ok: false,
                statusCode: 409,
                message: "Airport IATA code already exists"
            };
        }

        const created = await AirportsRepository.createAirport(payload);
        if (!created) {
            return {
                ok: false,
                statusCode: 500,
                message: "Failed to create airport"
            };
        }

        eventBus.emit(Events.CREATE_EVENT, {
			module: MODULE_NAME,
			action: 'CREATE',
			new_data: payload,
			user_id: 12321311
		});

        const airport = await AirportsRepository.getByIataCode(payload.iataCode);
        return {
            ok: true,
            statusCode: 201,
            message: "Airport created successfully",
            data: airport
        };
    }

    static async getAirports(filters = {}) {
        const { id, iataCode, name, city, region, status, page, limit } = filters;

        if (id !== undefined) {
            const airport = await AirportsRepository.getById(Number(id));
            if (!airport) {
                return {
                    ok: false,
                    statusCode: 404,
                    message: "Airport not found"
                };
            }

            return {
                ok: true,
                statusCode: 200,
                message: "Airport fetched successfully",
                data: airport
            };
        }

        if (page !== undefined || limit !== undefined) {
            const airports = await AirportsRepository.getAirportsComplex(filters);
            return {
                ok: true,
                statusCode: 200,
                message: "Airports fetched successfully",
                data: airports.data || [],
                pagination: airports.pagination
            };
        }

        if (iataCode) {
            const airport = await AirportsRepository.getByIataCode(iataCode);
            if (!airport) {
                return {
                    ok: false,
                    statusCode: 404,
                    message: "Airport not found"
                };
            }

            return {
                ok: true,
                statusCode: 200,
                message: "Airport fetched successfully",
                data: airport
            };
        }

        if (name) {
            const airports = await AirportsRepository.getByName(name);
            return {
                ok: true,
                statusCode: 200,
                message: "Airports fetched successfully",
                data: airports || []
            };
        }

        if (city) {
            const airports = await AirportsRepository.getByCity(city);
            return {
                ok: true,
                statusCode: 200,
                message: "Airports fetched successfully",
                data: airports || []
            };
        }

        if (region) {
            const airports = await AirportsRepository.getByRegion(region);
            return {
                ok: true,
                statusCode: 200,
                message: "Airports fetched successfully",
                data: airports || []
            };
        }

        if (status) {
            const airports = await AirportsRepository.getByStatus(status);
            return {
                ok: true,
                statusCode: 200,
                message: "Airports fetched successfully",
                data: airports || []
            };
        }

        const airports = await AirportsRepository.getAllAirports();
        return {
            ok: true,
            statusCode: 200,
            message: "Airports fetched successfully",
            data: airports || []
        };
    }

    static async getAirportById(id) {
        const airport = await AirportsRepository.getById(id);
        if (!airport) {
            return {
                ok: false,
                statusCode: 404,
                message: "Airport not found"
            };
        }

        return {
            ok: true,
            statusCode: 200,
            message: "Airport fetched successfully",
            data: airport
        };
    }

    static async updateAirport(id, payload) {
        const existed = await AirportsRepository.getById(id);
        if (!existed) {
            return {
                ok: false,
                statusCode: 404,
                message: "Airport not found"
            };
        }

        const updated = await AirportsRepository.updateAirport(id, payload);
        if (!updated) {
            return {
                ok: false,
                statusCode: 500,
                message: "Failed to update airport"
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
        
        const airport = await AirportsRepository.getById(id);
        return {
            ok: true,
            statusCode: 200,
            message: "Airport updated successfully",
            data: airport
        };
    }

    static async deleteAirport(id) {
        const existed = await AirportsRepository.getById(id);
        if (!existed) {
            return {
                ok: false,
                statusCode: 404,
                message: "Airport not found"
            };
        }

        const deleted = await AirportsRepository.deleteAirport(id);
        if (!deleted) {
            return {
                ok: false,
                statusCode: 500,
                message: "Failed to delete airport"
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
            message: "Airport deleted successfully"
        };
    }

    static async lockAirport(id) {
        const existed = await AirportsRepository.getById(id);
        if (!existed) {
            return {
                ok: false,
                statusCode: 404,
                message: "Airport not found"
            };
        }

        const locked = await AirportsRepository.lockAirport(id);
        if (!locked) {
            return {
                ok: false,
                statusCode: 500,
                message: "Failed to lock airport"
            };
        }
        
        const newData = await AirportsRepository.getById(id);

        eventBus.emit(Events.UPDATE_EVENT, {
            module: MODULE_NAME,
            action: 'LOCK',
            id: id,
            old_data: existed,
            new_data: newData,
            user_id: 12321311
        });

        return {
            ok: true,
            statusCode: 200,
            message: "Airport locked successfully"
        };
    }

    static async unlockAirport(id) {
        const existed = await AirportsRepository.getById(id);
        if (!existed) {
            return {
                ok: false,
                statusCode: 404,
                message: "Airport not found"
            };
        }

        const unlocked = await AirportsRepository.unlockAirport(id);
        if (!unlocked) {
            return {
                ok: false,
                statusCode: 500,
                message: "Failed to unlock airport"
            };
        }

        const newData = await AirportsRepository.getById(id);

        eventBus.emit(Events.UPDATE_EVENT, {
            module: MODULE_NAME,
            action: 'UNLOCK',
            id: id,
            old_data: existed,
            new_data: newData,
            user_id: 12321311
        });

        return {
            ok: true,
            statusCode: 200,
            message: "Airport unlocked successfully"
        };
    }
}

export default AirportsService;