import express from 'express';
import errorMiddleware from './common/middlewares/error.middleware.js';
import loadModules from './modules/index.js';

const app = express();

// Middlewares
app.use(express.json());

// Routes
loadModules(app);

// Error handler (luôn cuối)
app.use(errorMiddleware);

export default app;