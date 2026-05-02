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

const createPaymentSchema = Joi.object({
	bookingId: Joi.number().integer().positive().required(),
	transactionId: Joi.string().trim().min(1).max(255).required(),
	amount: Joi.number().positive().required(),
	paymentMethod: Joi.string().trim().min(1).max(50).required(),
	status: Joi.string().trim().min(1).max(50)
});

const updatePaymentSchema = Joi.object({
	bookingId: Joi.number().integer().positive(),
	transactionId: Joi.string().trim().min(1).max(255),
	amount: Joi.number().positive(),
	paymentMethod: Joi.string().trim().min(1).max(50),
	status: Joi.string().trim().min(1).max(50)
}).min(1);

const paymentIdParamSchema = Joi.object({
	id: Joi.number().integer().positive().required()
});

const listPaymentsQuerySchema = Joi.object({
	id: Joi.number().integer().positive(),
	bookingId: Joi.number().integer().positive(),
	transactionId: Joi.string().trim().min(1).max(255),
	fromAmount: Joi.number().positive(),
	toAmount: Joi.number().positive(),
	paymentMethod: Joi.string().trim().min(1).max(50),
	status: Joi.string().trim().min(1).max(50)
});

const paymentSchema = Joi.object({
	amount: Joi.number().positive().required(),
	content: Joi.string().trim().min(1).max(255)
});


export const validateCreatePayment = validate(createPaymentSchema, "body");
export const validateUpdatePayment = validate(updatePaymentSchema, "body");
export const validatePaymentIdParam = validate(paymentIdParamSchema, "params");
export const validateListPaymentsQuery = validate(listPaymentsQuerySchema, "query");
export const validatePayment = validate(paymentSchema, "body");
// payments.validator.js
