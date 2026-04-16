import express from 'express';
import errorMiddleware from './common/middlewares/error.middleware.js';
import loadModules from './modules/index.js';
import initAdminLogsListener from './modules/adminlogs/adminLogs.listener.js'

const app = express();

// Middlewares
app.use(express.json());

// Routes
loadModules(app);

initAdminLogsListener();  

// Error handler (luôn cuối)
app.use(errorMiddleware);

export default app;