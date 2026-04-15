import app from './app.js';
import connectDatabases from './database/index.js';

const PORT = 3000;

const startServer = async () => {
    await connectDatabases();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();