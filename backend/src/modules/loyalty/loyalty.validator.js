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

const exchangePointsSchema = Joi.object({
	passengerId: Joi.number().integer().positive().required(),
	amount: Joi.number().positive().required()
});

export const validateExchangePoints = validate(exchangePointsSchema, "body");
// loyalty.validator.js
