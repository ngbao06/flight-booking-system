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

	Object.keys(req[source]).forEach((key) => delete req[source][key]);
	Object.assign(req[source], value);
	return next();
};

const voucherCodeSchema = Joi.string().trim().min(3).max(50).uppercase();

const voucherIdParamSchema = Joi.object({
	id: Joi.number().integer().positive().required()
});

const createVoucherSchema = Joi.object({
	code: voucherCodeSchema.required(),
	discount_type: Joi.string().trim().uppercase().valid("PERCENT", "FIXED_AMOUNT").required(),
	discount_value: Joi.number().positive().required(),
	max_discount: Joi.number().positive().allow(null),
	valid_from: Joi.date().required(),
	valid_to: Joi.date().greater(Joi.ref("valid_from")).required(),
	point_cost: Joi.number().positive().allow(null)
});

const listVouchersQuerySchema = Joi.object({
	code: voucherCodeSchema,
	discount_type: Joi.string().trim().uppercase().valid("PERCENT", "FIXED_AMOUNT"),
	includeExpired: Joi.boolean().truthy("true").falsy("false").default(false),
	page: Joi.number().integer().positive().default(1),
	limit: Joi.number().integer().positive().max(100).default(20)
});

const listMyVouchersQuerySchema = Joi.object({
	status: Joi.string().trim().uppercase().valid("AVAILABLE", "USED", "EXPIRED"),
	page: Joi.number().integer().positive().default(1),
	limit: Joi.number().integer().positive().max(100).default(20)
});

const redeemVoucherSchema = Joi.object({
	voucherId: Joi.number().integer().positive().required()
});

const useVoucherSchema = Joi.object({
	userVoucherId: Joi.number().integer().positive().required()
});

export const validateVoucherIdParam = validate(voucherIdParamSchema, "params");
export const validateCreateVoucher = validate(createVoucherSchema, "body");
export const validateListVouchersQuery = validate(listVouchersQuerySchema, "query");
export const validateListMyVouchersQuery = validate(listMyVouchersQuerySchema, "query");
export const validateRedeemVoucher = validate(redeemVoucherSchema, "body");
export const validateUseVoucher = validate(useVoucherSchema, "body");