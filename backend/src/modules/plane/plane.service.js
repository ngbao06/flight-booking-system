import PlaneRepository from "./plane.repository.js";

class PlaneService {
	static async createPlane(payload) {
		const created = await PlaneRepository.createPlane(payload);
		if (!created) {
			return {
				ok: false,
				statusCode: 500,
				message: "Failed to create plane"
			};
		}

		return {
			ok: true,
			statusCode: 201,
			message: "Plane created successfully",
			data: payload
		};
	}

	static async getPlanes(filters = {}) {
		const { id, airlineId, model, totalSeats, status } = filters;

		if (id !== undefined) {
			const plane = await PlaneRepository.getById(Number(id));
			if (!plane) {
				return {
					ok: false,
					statusCode: 404,
					message: "Plane not found"
				};
			}

			return {
				ok: true,
				statusCode: 200,
				message: "Plane fetched successfully",
				data: plane
			};
		}

		if (airlineId !== undefined) {
			const planes = await PlaneRepository.getByAirline(airlineId);
			return {
				ok: true,
				statusCode: 200,
				message: "Planes fetched successfully",
				data: planes || []
			};
		}

		if (model) {
			const planes = await PlaneRepository.getByModel(model);
			return {
				ok: true,
				statusCode: 200,
				message: "Planes fetched successfully",
				data: planes || []
			};
		}

		if (totalSeats !== undefined) {
			const planes = await PlaneRepository.getByTotalSeats(totalSeats);
			return {
				ok: true,
				statusCode: 200,
				message: "Planes fetched successfully",
				data: planes || []
			};
		}

		if (status) {
			const planes = await PlaneRepository.getByStatus(status);
			return {
				ok: true,
				statusCode: 200,
				message: "Planes fetched successfully",
				data: planes || []
			};
		}

		const planes = await PlaneRepository.getAll();
		return {
			ok: true,
			statusCode: 200,
			message: "Planes fetched successfully",
			data: planes || []
		};
	}

	static async getPlaneById(id) {
		const plane = await PlaneRepository.getById(id);
		if (!plane) {
			return {
				ok: false,
				statusCode: 404,
				message: "Plane not found"
			};
		}

		return {
			ok: true,
			statusCode: 200,
			message: "Plane fetched successfully",
			data: plane
		};
	}

	static async updatePlane(id, payload) {
		const existed = await PlaneRepository.getById(id);
		if (!existed) {
			return {
				ok: false,
				statusCode: 404,
				message: "Plane not found"
			};
		}

		const updated = await PlaneRepository.updatePlane(id, payload);
		if (!updated) {
			return {
				ok: false,
				statusCode: 500,
				message: "Failed to update plane"
			};
		}

		const plane = await PlaneRepository.getById(id);
		return {
			ok: true,
			statusCode: 200,
			message: "Plane updated successfully",
			data: plane
		};
	}

	static async deletePlane(id) {
		const existed = await PlaneRepository.getById(id);
		if (!existed) {
			return {
				ok: false,
				statusCode: 404,
				message: "Plane not found"
			};
		}

		const deleted = await PlaneRepository.deletePlane(id);
		if (!deleted) {
			return {
				ok: false,
				statusCode: 500,
				message: "Failed to delete plane"
			};
		}

		return {
			ok: true,
			statusCode: 200,
			message: "Plane deleted successfully"
		};
	}
}

export default PlaneService;
