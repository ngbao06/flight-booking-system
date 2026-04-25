import BookingRepository from "./booking.repository.js";

class BookingService {
	static async createBooking(payload) {
		const created = await BookingRepository.createBooking({
			...payload,
			status: payload.status || "PENDING"
		});
		if (!created) {
			return {
				ok: false,
				statusCode: 500,
				message: "Failed to create booking"
			};
		}

		return {
			ok: true,
			statusCode: 201,
			message: "Booking created successfully",
			data: payload
		};
	}

	static async getBookings(filters = {}) {
		const { id, page, limit } = filters;

		if (id !== undefined) {
			const booking = await BookingRepository.getById(Number(id));
			if (!booking) {
				return {
					ok: false,
					statusCode: 404,
					message: "Booking not found"
				};
			}

			return {
				ok: true,
				statusCode: 200,
				message: "Booking fetched successfully",
				data: booking
			};
		}

		if (page !== undefined || limit !== undefined) {
			const result = await BookingRepository.getBookingsComplex(filters);

			return {
				ok: true,
				statusCode: 200,
				message: "Bookings fetched successfully",
				data: result.data || [],
				pagination: result.pagination
			};
		}

		const { flightId, bookingDate, fromAmount, toAmount, status } = filters;

		if (flightId !== undefined) {
			const bookings = await BookingRepository.getByFlight(flightId);
			return {
				ok: true,
				statusCode: 200,
				message: "Bookings fetched successfully",
				data: bookings || []
			};
		}

		if (bookingDate) {
			const bookings = await BookingRepository.getByBookingDate(bookingDate);
			return {
				ok: true,
				statusCode: 200,
				message: "Bookings fetched successfully",
				data: bookings || []
			};
		}

		if (fromAmount !== undefined && toAmount !== undefined) {
			const bookings = await BookingRepository.getByRangeAmount(fromAmount, toAmount);
			return {
				ok: true,
				statusCode: 200,
				message: "Bookings fetched successfully",
				data: bookings || []
			};
		}

		if (status) {
			const bookings = await BookingRepository.getByStatus(status);
			return {
				ok: true,
				statusCode: 200,
				message: "Bookings fetched successfully",
				data: bookings || []
			};
		}

		const bookings = await BookingRepository.getAll();
		return {
			ok: true,
			statusCode: 200,
			message: "Bookings fetched successfully",
			data: bookings || []
		};
	}

	static async getBookingById(id) {
		const booking = await BookingRepository.getById(id);
		if (!booking) {
			return {
				ok: false,
				statusCode: 404,
				message: "Booking not found"
			};
		}

		return {
			ok: true,
			statusCode: 200,
			message: "Booking fetched successfully",
			data: booking
		};
	}

	static async updateBooking(id, payload) {
		const existed = await BookingRepository.getById(id);
		if (!existed) {
			return {
				ok: false,
				statusCode: 404,
				message: "Booking not found"
			};
		}

		const updated = await BookingRepository.updateBooking(id, payload);
		if (!updated) {
			return {
				ok: false,
				statusCode: 500,
				message: "Failed to update booking"
			};
		}

		const booking = await BookingRepository.getById(id);
		return {
			ok: true,
			statusCode: 200,
			message: "Booking updated successfully",
			data: booking
		};
	}
}

export default BookingService;
// booking.service.js
