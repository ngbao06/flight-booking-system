import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const uri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB_NAME;

const configMongo = mongoose.connect(uri, {dbName: dbName })
.then(() => {
    console.log(`MongoDB connected: ${dbName}`);
    return mongoose.connection;
}).catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
});

export default configMongo;