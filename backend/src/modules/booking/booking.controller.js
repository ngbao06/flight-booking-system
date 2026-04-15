import BookingService from "./booking.service.js";

const sendResult = (res, result) => {
	const statusCode = result?.statusCode || 500;
	return res.status(statusCode).json({
		success: Boolean(result?.ok),
		message: result?.message || "Internal server error",
		data: result?.data
	});
};

class BookingController {
	static async createBooking(req, res, next) {
		try {
			const result = await BookingService.createBooking(req.body);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async getBookings(req, res, next) {
		try {
			const result = await BookingService.getBookings(req.query);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async getBookingById(req, res, next) {
		try {
			const id = Number(req.params.id);
			const result = await BookingService.getBookingById(id);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async updateBooking(req, res, next) {
		try {
			const id = Number(req.params.id);
			const result = await BookingService.updateBooking(id, req.body);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async deleteBooking(req, res, next) {
		try {
			const id = Number(req.params.id);
			const result = await BookingService.deleteBooking(id);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}
}

export default BookingController;
// booking.controller.js
