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

const dashboardReportQuerySchema = Joi.object({
	from: Joi.date().iso(),
	to: Joi.date().iso().min(Joi.ref("from")),
	page: Joi.number().integer().positive().default(1),
	limit: Joi.number().integer().positive().max(100).default(5)
});

export const validateDashboardReportQuery = validate(dashboardReportQuerySchema, "query");
