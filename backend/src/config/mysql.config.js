import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config({ path: `.env`});

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'mysql',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'flight_booking',
    namedPlaceholders: true
}).promise();

export default pool;