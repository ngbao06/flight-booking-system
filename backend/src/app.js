const express = require('express');
const app = express();

const errorMiddleware = require('./middlewares/error.middleware');

// Middlewares
app.use(express.json());

// Load routes from modules
require('./modules')(app);

// Error handler
app.use(errorMiddleware);

module.exports = app;