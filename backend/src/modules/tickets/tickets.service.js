import TicketsRepository from "./tickets.repository.js";

class TicketsService {
	static async createTicket(payload) {
		const existing = await TicketsRepository.getByTicketNumber(payload.ticketNumber);
		if (existing) {
			return {
				ok: false,
				statusCode: 409,
				message: "Ticket number already exists"
			};
		}

		const created = await TicketsRepository.createTicket({
			...payload,
			status: payload.status || "ISSUED"
		});
		if (!created) {
			return {
				ok: false,
				statusCode: 500,
				message: "Failed to create ticket"
			};
		}

		return {
			ok: true,
			statusCode: 201,
			message: "Ticket created successfully",
			data: payload
		};
	}

	static async getTickets(filters = {}) {
		const { id, ticketNumber, bookingId, seatId, buyerId, passengerName, issueDate, status } = filters;

		if (id !== undefined) {
			const ticket = await TicketsRepository.getById(Number(id));
			if (!ticket) {
				return {
					ok: false,
					statusCode: 404,
					message: "Ticket not found"
				};
			}

			return {
				ok: true,
				statusCode: 200,
				message: "Ticket fetched successfully",
				data: ticket
			};
		}

		if (ticketNumber) {
			const ticket = await TicketsRepository.getByTicketNumber(ticketNumber);
			if (!ticket) {
				return {
					ok: false,
					statusCode: 404,
					message: "Ticket not found"
				};
			}

			return {
				ok: true,
				statusCode: 200,
				message: "Ticket fetched successfully",
				data: ticket
			};
		}

		if (bookingId !== undefined) {
			const tickets = await TicketsRepository.getByBooking(bookingId);
			return {
				ok: true,
				statusCode: 200,
				message: "Tickets fetched successfully",
				data: tickets || []
			};
		}

		if (seatId !== undefined) {
			const ticket = await TicketsRepository.getBySeat(seatId);
			if (!ticket) {
				return {
					ok: false,
					statusCode: 404,
					message: "Ticket not found"
				};
			}

			return {
				ok: true,
				statusCode: 200,
				message: "Ticket fetched successfully",
				data: ticket
			};
		}

		if (buyerId !== undefined) {
			const tickets = await TicketsRepository.getByBuyer(buyerId);
			return {
				ok: true,
				statusCode: 200,
				message: "Tickets fetched successfully",
				data: tickets || []
			};
		}

		if (passengerName) {
			const tickets = await TicketsRepository.getByPassengerName(passengerName);
			return {
				ok: true,
				statusCode: 200,
				message: "Tickets fetched successfully",
				data: tickets || []
			};
		}

		if (issueDate) {
			const tickets = await TicketsRepository.getByIssueDate(issueDate);
			return {
				ok: true,
				statusCode: 200,
				message: "Tickets fetched successfully",
				data: tickets || []
			};
		}

		if (status) {
			const tickets = await TicketsRepository.getByStatus(status);
			return {
				ok: true,
				statusCode: 200,
				message: "Tickets fetched successfully",
				data: tickets || []
			};
		}

		const tickets = await TicketsRepository.getAll();
		return {
			ok: true,
			statusCode: 200,
			message: "Tickets fetched successfully",
			data: tickets || []
		};
	}

	static async getTicketById(id) {
		const ticket = await TicketsRepository.getById(id);
		if (!ticket) {
			return {
				ok: false,
				statusCode: 404,
				message: "Ticket not found"
			};
		}

		return {
			ok: true,
			statusCode: 200,
			message: "Ticket fetched successfully",
			data: ticket
		};
	}

	static async updateTicket(id, payload) {
		const existed = await TicketsRepository.getById(id);
		if (!existed) {
			return {
				ok: false,
				statusCode: 404,
				message: "Ticket not found"
			};
		}

		if (payload.ticketNumber && payload.ticketNumber !== existed.ticket_number) {
			const duplicated = await TicketsRepository.getByTicketNumber(payload.ticketNumber);
			if (duplicated) {
				return {
					ok: false,
					statusCode: 409,
					message: "Ticket number already exists"
				};
			}
		}

		const updated = await TicketsRepository.updateTicket(id, payload);
		if (!updated) {
			return {
				ok: false,
				statusCode: 500,
				message: "Failed to update ticket"
			};
		}

		const ticket = await TicketsRepository.getById(id);
		return {
			ok: true,
			statusCode: 200,
			message: "Ticket updated successfully",
			data: ticket || existed
		};
	}

	static async deleteTicket(id) {
		const existed = await TicketsRepository.getById(id);
		if (!existed) {
			return {
				ok: false,
				statusCode: 404,
				message: "Ticket not found"
			};
		}

		const deleted = await TicketsRepository.deleteTicket(id);
		if (!deleted) {
			return {
				ok: false,
				statusCode: 500,
				message: "Failed to delete ticket"
			};
		}

		return {
			ok: true,
			statusCode: 200,
			message: "Ticket deleted successfully"
		};
	}
}

export default TicketsService;
// tickets.service.js
