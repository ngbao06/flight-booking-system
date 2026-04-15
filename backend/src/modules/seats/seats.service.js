import SeatsRepository from "./seats.repository.js";

class SeatsService {
	static async createSeats(payload) {
		const created = await SeatsRepository.createSeats(payload.flightId, payload.basePrice);
		if (!created) {
			return {
				ok: false,
				statusCode: 500,
				message: "Failed to create seats"
			};
		}

		return {
			ok: true,
			statusCode: 201,
			message: "Seats created successfully",
			data: payload
		};
	}

	static async getSeats(filters = {}) {
		const { flightId, seatNumber, fromPrice, toPrice, class: seatClass, status } = filters;

		if (flightId !== undefined) {
			const seats = await SeatsRepository.getByFlight(flightId);
			return {
				ok: true,
				statusCode: 200,
				message: "Seats fetched successfully",
				data: seats || []
			};
		}

		if (seatNumber) {
			const seats = await SeatsRepository.getBySeatNumber(seatNumber);
			return {
				ok: true,
				statusCode: 200,
				message: "Seats fetched successfully",
				data: seats || []
			};
		}

		if (fromPrice !== undefined && toPrice !== undefined) {
			const seats = await SeatsRepository.getByRangePrice(fromPrice, toPrice);
			return {
				ok: true,
				statusCode: 200,
				message: "Seats fetched successfully",
				data: seats || []
			};
		}

		if (seatClass) {
			const seats = await SeatsRepository.getByClass(seatClass);
			return {
				ok: true,
				statusCode: 200,
				message: "Seats fetched successfully",
				data: seats || []
			};
		}

		if (status) {
			const seats = await SeatsRepository.getByStatus(status);
			return {
				ok: true,
				statusCode: 200,
				message: "Seats fetched successfully",
				data: seats || []
			};
		}

		const seats = await SeatsRepository.getAll();
		return {
			ok: true,
			statusCode: 200,
			message: "Seats fetched successfully",
			data: seats || []
		};
	}

	static async updateSeat(id, payload) {
		const updated = await SeatsRepository.updateSeat(id, payload);
		if (!updated) {
			return {
				ok: false,
				statusCode: 404,
				message: "Seat not found or not updated"
			};
		}

		return {
			ok: true,
			statusCode: 200,
			message: "Seat updated successfully"
		};
	}
}

export default SeatsService;
// seats.service.js
