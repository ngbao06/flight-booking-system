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

const createSeatsSchema = Joi.object({
	flightId: Joi.number().integer().positive().required(),
	basePrice: Joi.number().positive().required()
});

const updateSeatSchema = Joi.object({
	seatNumber: Joi.string().trim().min(1).max(255),
	price: Joi.number().positive(),
	class: Joi.string().trim().min(1).max(50),
	status: Joi.string().trim().min(1).max(50)
}).min(1);

const seatIdParamSchema = Joi.object({
	id: Joi.number().integer().positive().required()
});

const listSeatsQuerySchema = Joi.object({
	flightId: Joi.number().integer().positive(),
	seatNumber: Joi.string().trim().min(1).max(255),
	fromPrice: Joi.number().positive(),
	toPrice: Joi.number().positive(),
	class: Joi.string().trim().min(1).max(50),
	status: Joi.string().trim().min(1).max(50)
});

export const validateCreateSeats = validate(createSeatsSchema, "body");
export const validateUpdateSeat = validate(updateSeatSchema, "body");
export const validateSeatIdParam = validate(seatIdParamSchema, "params");
export const validateListSeatsQuery = validate(listSeatsQuerySchema, "query");
// seats.validator.js
