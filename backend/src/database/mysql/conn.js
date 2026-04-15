import pool from '../../config/mysql.config.js';

export const query = async (sql, params) => {
    const [rows] = await pool.execute(sql, params);
    return [rows];
};

export const withTransaction = async (callback) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const result = await callback(conn);
        await conn.commit();
        return result;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

export default pool;