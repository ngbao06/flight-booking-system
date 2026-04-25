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

const createUserSchema = Joi.object({
	// MySQL
	username: Joi.string().trim().min(3).max(255).required(),
	password: Joi.string().trim().min(6).max(255).required(),
	role    : Joi.string().trim().required().default('PASSENGER').uppercase(),

	// MongoDB
	full_name: 		 Joi.string().trim(),
    email: 			 Joi.string().email().lowercase(),
    phone: 			 Joi.string().trim(),
    address: 		 Joi.string(),
    passport_number: Joi.string().uppercase(),
	expire_date: 	 Joi.date(),
    nationality: 	 Joi.string(),
	meal: 			 Joi.string().default('Standard'),
	seat_position: 	 Joi.string().default('none')
});

const updateUserSchema = Joi.object({
	username: Joi.string().trim().min(3).max(255),
	password: Joi.string().trim().min(6).max(255),

	full_name: 		 Joi.string().trim(),
    email: 			 Joi.string().email().lowercase(),
    phone: 			 Joi.string().trim(),
    address: 		 Joi.string(),
    passport_number: Joi.string().uppercase(),
	expire_date: 	 Joi.date(),
    nationality: 	 Joi.string(),
	meal: 			 Joi.string().default('Standard'),
	seat_position: 	 Joi.string().default('none')
}).min(1);

const userIdParamSchema = Joi.object({
	id: Joi.number().integer().positive().required()
});

const listUsersQuerySchema = Joi.object({
	id		: Joi.number().integer().positive(),
	username: Joi.string().trim().min(1).max(255),
	role	: Joi.string().trim().min(1).max(50).uppercase(),
	page	: Joi.number().integer().positive().default(1),
	limit	: Joi.number().integer().positive().max(100).default(10)
});

const listPassengersFullInfoQuerySchema = Joi.object({
	page	: Joi.number().integer().positive().default(1),
	limit	: Joi.number().integer().positive().max(100).default(10)
});

export const validateCreateUser     = validate(createUserSchema, "body");
export const validateUpdateUser     = validate(updateUserSchema, "body");
export const validateUserIdParam    = validate(userIdParamSchema, "params");
export const validateListUsersQuery = validate(listUsersQuerySchema, "query");
export const validateListPassengersFullInfoQuery = validate(listPassengersFullInfoQuerySchema, "query");
// users.validator.js
