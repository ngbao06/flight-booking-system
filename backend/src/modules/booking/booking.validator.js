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

const createBookingSchema = Joi.object({
	flightId: Joi.number().integer().positive().required(),
	bookingDate: Joi.date().iso().required(),
	totalAmount: Joi.number().positive().required(),
	status: Joi.string().trim().min(1).max(50)
});

const updateBookingSchema = Joi.object({
	flightId: Joi.number().integer().positive(),
	bookingDate: Joi.date().iso(),
	totalAmount: Joi.number().positive(),
	status: Joi.string().trim().min(1).max(50)
}).min(1);

const bookingIdParamSchema = Joi.object({
	id: Joi.number().integer().positive().required()
});

const listBookingsQuerySchema = Joi.object({
	id: Joi.number().integer().positive(),
	flightId: Joi.number().integer().positive(),
	bookingDate: Joi.date().iso(),
	fromAmount: Joi.number().positive(),
	toAmount: Joi.number().positive(),
	status: Joi.string().trim().min(1).max(50)
});

export const validateCreateBooking = validate(createBookingSchema, "body");
export const validateUpdateBooking = validate(updateBookingSchema, "body");
export const validateBookingIdParam = validate(bookingIdParamSchema, "params");
export const validateListBookingsQuery = validate(listBookingsQuerySchema, "query");
// booking.validator.js
