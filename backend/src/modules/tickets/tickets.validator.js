import Joi from "joi";

const validate = (schema, source) => (req, res, next) => {
	const { error, value } = schema.validate(req[source], {
		abortEarly: false,
		stripUnknown: true
	});

	if (error) {
		return res.status(400).json({
			success: false,
			message: "Validation error",
			errors: error.details.map((detail) => detail.message)
		});
	}

	req[source] = value;
	return next();
};

const createTicketSchema = Joi.object({
	ticketNumber: Joi.string().trim().min(1).max(255).required(),
	bookingId: Joi.number().integer().positive().required(),
	seatId: Joi.number().integer().positive().required(),
	buyerId: Joi.number().integer().positive().required(),
	passengerLastname: Joi.string().trim().min(1).max(255).required(),
	passengerFirstname: Joi.string().trim().min(1).max(255).required(),
	passengerIdCard: Joi.string().trim().min(1).max(255).required(),
	issueDate: Joi.date().iso().required(),
	finalPrice: Joi.number().positive().required(),
	status: Joi.string().trim().min(1).max(50)
});

const updateTicketSchema = Joi.object({
	ticketNumber: Joi.string().trim().min(1).max(255),
	bookingId: Joi.number().integer().positive(),
	seatId: Joi.number().integer().positive(),
	buyerId: Joi.number().integer().positive(),
	passengerLastname: Joi.string().trim().min(1).max(255),
	passengerFirstname: Joi.string().trim().min(1).max(255),
	passengerIdCard: Joi.string().trim().min(1).max(255),
	issueDate: Joi.date().iso(),
	finalPrice: Joi.number().positive(),
	status: Joi.string().trim().min(1).max(50)
}).min(1);

const ticketIdParamSchema = Joi.object({
	id: Joi.number().integer().positive().required()
});

const listTicketsQuerySchema = Joi.object({
	id: Joi.number().integer().positive(),
	ticketNumber: Joi.string().trim().min(1).max(255),
	bookingId: Joi.number().integer().positive(),
	seatId: Joi.number().integer().positive(),
	buyerId: Joi.number().integer().positive(),
	passengerName: Joi.string().trim().min(1).max(255),
	issueDate: Joi.date().iso(),
	status: Joi.string().trim().min(1).max(50)
});

export const validateCreateTicket = validate(createTicketSchema, "body");
export const validateUpdateTicket = validate(updateTicketSchema, "body");
export const validateTicketIdParam = validate(ticketIdParamSchema, "params");
export const validateListTicketsQuery = validate(listTicketsQuerySchema, "query");
// tickets.validator.js
