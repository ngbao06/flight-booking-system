export const requireAuth = (req, res, next) => {
	// Cách 1: Kiểm tra session từ cookie
	if (req.session?.user) {
		req.user = req.session.user;
		return next();
	}

	// Cách 2: Kiểm tra Bearer token từ Authorization header
	// Token ở đây là sessionID (từ login endpoint)
	const authHeader = req.headers.authorization;
	if (authHeader && authHeader.startsWith('Bearer ')) {
		const tokenOrSessionId = authHeader.slice(7); // Bỏ "Bearer "
		
		// Lookup session từ sessionID
		req.sessionStore.get(tokenOrSessionId, (err, sessionData) => {
			if (err || !sessionData || !sessionData.user) {
				return res.status(401).json({
					success: false,
					message: "Unauthorized - Invalid token"
				});
			}
			
			req.user = sessionData.user;
			return next();
		});
		return;
	}

	// Nếu cả hai cách đều không có
	return res.status(401).json({
		success: false,
		message: "Unauthorized"
	});
};

export const optionalAuth = (req, res, next) => {
	if (req.session?.user) {
		req.user = req.session.user;
	}

	return next();
};
