import TicketsService from "./tickets.service.js";

const sendResult = (res, result) => {
	const statusCode = result?.statusCode || 500;
	return res.status(statusCode).json({
		success: Boolean(result?.ok),
		message: result?.message || "Internal server error",
		data: result?.data
	});
};

class TicketsController {
	static async createTicket(req, res, next) {
		try {
			const result = await TicketsService.createTicket(req.body);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async getTickets(req, res, next) {
		try {
			const result = await TicketsService.getTickets(req.query);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async getTicketById(req, res, next) {
		try {
			const id = Number(req.params.id);
			const result = await TicketsService.getTicketById(id);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}

	static async updateTicket(req, res, next) {
		try {
			const id = Number(req.params.id);
			const result = await TicketsService.updateTicket(id, req.body);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}
}

export default TicketsController;
// tickets.controller.js
