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

	Object.keys(req[source]).forEach(key => delete req[source][key]);

	// Đổ dữ liệu đã validate (value) vào lại
	Object.assign(req[source], value);
	return next();
};

const createPlaneSchema = Joi.object({
	airlineId: Joi.number().integer().positive().required(),
	model: Joi.string().trim().min(1).max(255).required(),
	totalSeats: Joi.number().integer().positive().required(),
	status: Joi.string().trim().min(1).max(50)
});

const updatePlaneSchema = Joi.object({
	airlineId: Joi.number().integer().positive(),
	model: Joi.string().trim().min(1).max(255),
	totalSeats: Joi.number().integer().positive(),
	status: Joi.string().trim().min(1).max(50)
}).min(1);

const planeIdParamSchema = Joi.object({
	id: Joi.number().integer().positive().required()
});

const listPlanesQuerySchema = Joi.object({
	id: Joi.number().integer().positive(),
	airlineId: Joi.number().integer().positive(),
	model: Joi.string().trim().min(1).max(255),
	totalSeats: Joi.number().integer().positive(),
	status: Joi.string().trim().min(1).max(50),
	page: Joi.number().integer().positive(),
	limit: Joi.number().integer().positive().max(1000)
});

export const validateCreatePlane = validate(createPlaneSchema, "body");
export const validateUpdatePlane = validate(updatePlaneSchema, "body");
export const validatePlaneIdParam = validate(planeIdParamSchema, "params");
export const validateListPlanesQuery = validate(listPlanesQuerySchema, "query");
