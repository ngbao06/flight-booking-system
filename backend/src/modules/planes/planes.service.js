import PlaneRepository from "./planes.repository.js";
import eventBus , { Events } 	from "../../common/utils/eventsBus.js";

const MODULE_NAME = "planes";

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

		eventBus.emit(Events.CREATE_EVENT, {
			module: MODULE_NAME,
			action: 'CREATE',
			new_data: payload,
			user_id: 12321311
		});

		return {
			ok: true,
			statusCode: 201,
			message: "Plane created successfully",
			data: payload
		};
	}

	static async getPlanes(filters = {}) {
		const planes = await PlaneRepository.getPlaneComplex(filters);

		if (!planes) {
			return {
				ok: false,
				statusCode: 404,
				message: "Planes not found"
			};
		}

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

		eventBus.emit(Events.UPDATE_EVENT, {
			module: MODULE_NAME,
			action: 'UPDATE',
			id: id,
			old_data: existed,
			new_data: payload,
			user_id: 12321311
		});

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
			message: "Plane deleted successfully"
		};
	}
}

export default PlaneService;
