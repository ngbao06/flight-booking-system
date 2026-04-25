import AdminLogRepository from './adminLogs.repository.js';

const sendResult = (res, result) => {
	const statusCode = result?.statusCode || 500;
	return res.status(statusCode).json({
		success: Boolean(result?.ok),
		message: result?.message || 'Internal server error',
		data: result?.data,
		pagination: result?.pagination
	});
};

class AdminLogsController {
	static async getLogs(req, res, next) {
		try {
			const page = Number(req.query.page) || 1;
			const limit = Number(req.query.limit) || 20;
			const result = await AdminLogRepository.getLogs({}, page, limit);
			return sendResult(res, {
				ok: true,
				statusCode: 200,
				message: 'Logs fetched successfully',
				data: result.data || [],
				pagination: result.pagination
			});
		} catch (error) {
			return next(error);
		}
	}
}

export default AdminLogsController;