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

const createFlightSchema = Joi.object({
	flightNumber: Joi.string().trim().min(1).max(255).required(),
	planeId: Joi.number().integer().positive().required(),
	airlineId: Joi.number().integer().positive().required(),
	departureAirportId: Joi.number().integer().positive().required(),
	arrivalAirportId: Joi.number().integer().positive().required(),
	distance: Joi.number().positive().required(),
	departureTime: Joi.date().iso().required(),
	arrivalTime: Joi.date().iso().required(),
	status: Joi.string().trim().min(1).max(50).default("WAITING")
});

const updateFlightSchema = Joi.object({
	flightNumber: Joi.string().trim().min(1).max(255),
	planeId: Joi.number().integer().positive(),
	airlineId: Joi.number().integer().positive(),
	departureAirportId: Joi.number().integer().positive(),
	arrivalAirportId: Joi.number().integer().positive(),
	distance: Joi.number().positive(),
	departureTime: Joi.date().iso(),
	arrivalTime: Joi.date().iso(),
	status: Joi.string().trim().min(1).max(50)
}).min(1);

const flightIdParamSchema = Joi.object({
	id: Joi.number().integer().positive().required()
});

const listFlightsQuerySchema = Joi.object({
	id: Joi.number().integer().positive(),
	flightNumber: Joi.string().trim().min(1).max(255),
	planeId: Joi.number().integer().positive(),
	airlineId: Joi.number().integer().positive(),
	departureAirportId: Joi.number().integer().positive(),
	arrivalAirportId: Joi.number().integer().positive(),
	departureTime: Joi.date().iso(),
	arrivalTime: Joi.date().iso(),
	status: Joi.string().trim().min(1).max(50)
});

export const validateCreateFlight = validate(createFlightSchema, "body");
export const validateUpdateFlight = validate(updateFlightSchema, "body");
export const validateFlightIdParam = validate(flightIdParamSchema, "params");
export const validateListFlightsQuery = validate(listFlightsQuerySchema, "query");
// flights.validator.js
