import Joi from "joi";

const codePattern = /^[A-Z0-9]{2,5}$/;

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

	Object.assign(req[source], value)
	return next();
};

const createAirlineSchema = Joi.object({
	code: Joi.string().trim().uppercase().pattern(codePattern).required(),
	name: Joi.string().trim().min(2).max(255).required()
});

const updateAirlineSchema = Joi.object({
	code: Joi.string().trim().uppercase().pattern(codePattern),
	name: Joi.string().trim().min(2).max(255)
}).min(1);

const airlineIdParamSchema = Joi.object({
	id: Joi.number().integer().positive().required()
});

const listAirlinesQuerySchema = Joi.object({
	id: Joi.number().integer().positive(),
	code: Joi.string().trim().uppercase().pattern(codePattern),
	name: Joi.string().trim().min(1).max(255)
});

export const validateCreateAirline = validate(createAirlineSchema, "body");
export const validateUpdateAirline = validate(updateAirlineSchema, "body");
export const validateAirlineIdParam = validate(airlineIdParamSchema, "params");
export const validateListAirlinesQuery = validate(listAirlinesQuerySchema, "query");
