import pool from '../config/mysql.config.js';
import { connectMongo, getMongo } from './mongodb/conn.js';
import redisClient from '../config/redis.config.js';

export const connectDatabases = async () => {
    try {
        await pool.query('SELECT 1');
        console.log('MySQL connected');

        await connectMongo();

        console.log('All databases connected');

        return {
            mysql: pool,
            mongo: getMongo()
        }
    } catch (err) {
        console.error('Database connection error:', err.message);
        process.exit(1);
    }
};

export default connectDatabases;