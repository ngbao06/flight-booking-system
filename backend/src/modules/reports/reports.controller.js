import ReportsService from "./reports.service.js";

const sendResult = (res, result) => {
	const statusCode = result?.statusCode || 500;
	return res.status(statusCode).json({
		success: Boolean(result?.ok),
		message: result?.message || "Internal server error",
		data: result?.data,
		pagination: result?.pagination
	});
};

class ReportsController {
	static async getDashboardReport(req, res, next) {
		try {
			const result = await ReportsService.getDashboardReport(req.query);
			return sendResult(res, result);
		} catch (error) {
			return next(error);
		}
	}
}

export default ReportsController;
