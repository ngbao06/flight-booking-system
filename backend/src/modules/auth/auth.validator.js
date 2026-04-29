import Joi from "joi";

const validate = (schema, source) => (req, res, next) => {
	const dataToValidate = req[source] || {};
	const { error, value } = schema.validate(dataToValidate, {
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

	if (!req[source]) {
		req[source] = {};
	}

	Object.keys(req[source]).forEach((key) => delete req[source][key]);
	Object.assign(req[source], value);

	return next();
};

const registerSchema = Joi.object({
	username:             Joi.string().trim().min(3).max(255).required(),
	password:             Joi.string().trim().min(6).max(255).required(),
	role:                 Joi.string().trim().uppercase().valid("ADMIN", "GATE_AGENT", "PASSENGER").default("PASSENGER"),

	full_name:            Joi.string().trim().required(),
	email:                Joi.string().email().lowercase().required(),
	phone:                Joi.string().trim().allow(null, "").optional(),
	address:              Joi.string().trim().allow(null, "").optional(),
	passport_number:      Joi.string().uppercase().allow(null, "").optional(),
	passport_expiry_date: Joi.date().allow(null, "").optional(),
	passport_nationality: Joi.string().trim().allow(null, "").optional(),
	meal:                 Joi.string().trim().default("Standard"),
	seat_position:        Joi.string().trim().lowercase().valid("window", "aisle", "none").default("none")
});

const loginSchema = Joi.object({
	username: Joi.string().trim().required(),
	password: Joi.string().trim().required()
});

const updatePasswordSchema = Joi.object({
	old_password: Joi.string().trim().required(),
	new_password: Joi.string().trim().min(6).max(255).required()
});

const requestResetSchema = Joi.object({
	username: Joi.string().trim(),
	email:    Joi.string().email().lowercase()
}).or("username", "email");

const confirmResetSchema = Joi.object({
	token:        Joi.string().trim().min(16).required(),
	new_password: Joi.string().trim().min(6).max(255).required()
});

const updateProfileSchema = Joi.object({
	username:             Joi.string().trim().min(3).max(255),
	full_name:            Joi.string().trim(),
	avatar_url:           Joi.string().uri(),
	email:                Joi.string().email().lowercase(),
	phone:                Joi.string().trim(),
	address:              Joi.string().trim(),
	passport_number:      Joi.string().uppercase(),
	passport_expiry_date: Joi.date(),
	passport_nationality: Joi.string().trim(),
	meal:                 Joi.string().trim(),
	seat_position:        Joi.string().trim().valid("window", "aisle", "none")
}).min(1);

export const validateRegister = validate(registerSchema, "body");
export const validateLogin = validate(loginSchema, "body");
export const validateUpdatePassword = validate(updatePasswordSchema, "body");
export const validateRequestResetPassword = validate(requestResetSchema, "body");
export const validateConfirmResetPassword = validate(confirmResetSchema, "body");
export const validateUpdateProfile = validate(updateProfileSchema, "body");
