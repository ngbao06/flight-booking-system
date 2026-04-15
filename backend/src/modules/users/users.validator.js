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

const createUserSchema = Joi.object({
	username: Joi.string().trim().min(3).max(255).required(),
	password: Joi.string().trim().min(6).max(255).required(),
	role: Joi.string().trim().min(2).max(50)
});

const updateUserSchema = Joi.object({
	username: Joi.string().trim().min(3).max(255),
	password: Joi.string().trim().min(6).max(255)
}).min(1);

const userIdParamSchema = Joi.object({
	id: Joi.number().integer().positive().required()
});

const listUsersQuerySchema = Joi.object({
	id: Joi.number().integer().positive(),
	username: Joi.string().trim().min(1).max(255),
	role: Joi.string().trim().min(1).max(50)
});

export const validateCreateUser = validate(createUserSchema, "body");
export const validateUpdateUser = validate(updateUserSchema, "body");
export const validateUserIdParam = validate(userIdParamSchema, "params");
export const validateListUsersQuery = validate(listUsersQuerySchema, "query");
// users.validator.js
