import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import errorMiddleware from './common/middlewares/error.middleware.js';
import loadModules from './modules/index.js';
import initAdminLogsListener from './modules/adminlogs/adminLogs.listener.js'

dotenv.config({ path: '.env' });

const app = express();

app.set('trust proxy', 1);

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
	session({
		name: 'sid',
		secret: process.env.SESSION_SECRET || 'change_this_session_secret',
		resave: false,
		saveUninitialized: false,
		rolling: true,
		cookie: {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 1000 * 60 * 60 * 24
		}
	})
);

// Routes
loadModules(app);

initAdminLogsListener();  

// Error handler (luôn cuối)
app.use(errorMiddleware);

export default app;