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

	Object.assign(req[source], value);
	return next();
};

const createAirportSchema = Joi.object({
	iataCode: Joi.string().trim().uppercase().length(3).required(),
	name: Joi.string().trim().min(2).max(255).required(),
	city: Joi.string().trim().min(2).max(255).required(),
	region: Joi.string().trim().min(2).max(255).required()
});

const updateAirportSchema = Joi.object({
	name: Joi.string().trim().min(2).max(255),
	city: Joi.string().trim().min(2).max(255)
}).min(1);

const airportIdParamSchema = Joi.object({
	id: Joi.number().integer().positive().required()
});

const listAirportsQuerySchema = Joi.object({
	id: Joi.number().integer().positive(),
	iataCode: Joi.string().trim().uppercase().length(3),
	name: Joi.string().trim().min(1).max(255),
	city: Joi.string().trim().min(1).max(255),
	region: Joi.string().trim().min(1).max(255),
	status: Joi.string().trim().min(1).max(50)
});

export const validateCreateAirport = validate(createAirportSchema, "body");
export const validateUpdateAirport = validate(updateAirportSchema, "body");
export const validateAirportIdParam = validate(airportIdParamSchema, "params");
export const validateListAirportsQuery = validate(listAirportsQuerySchema, "query");
