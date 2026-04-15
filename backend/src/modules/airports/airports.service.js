import AirportsRepository from "./airports.repository.js";

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

        const airport = await AirportsRepository.getByIataCode(payload.iataCode);
        return {
            ok: true,
            statusCode: 201,
            message: "Airport created successfully",
            data: airport
        };
    }

    static async getAirports(filters = {}) {
        const { id, iataCode, name, city, region, status } = filters;

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

        const airport = await AirportsRepository.getById(id);
        return {
            ok: true,
            statusCode: 200,
            message: "Airport locked successfully",
            data: airport
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

        const airport = await AirportsRepository.getById(id);
        return {
            ok: true,
            statusCode: 200,
            message: "Airport unlocked successfully",
            data: airport
        };
    }
}

export default AirportsService;