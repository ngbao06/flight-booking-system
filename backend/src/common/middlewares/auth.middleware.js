export const requireAuth = (req, res, next) => {
	const sessionUser = req.session?.user;

	if (!sessionUser) {
		return res.status(401).json({
			success: false,
			message: "Unauthorized"
		});
	}

	req.user = sessionUser;
	return next();
};

export const optionalAuth = (req, res, next) => {
	if (req.session?.user) {
		req.user = req.session.user;
	}

	return next();
};
