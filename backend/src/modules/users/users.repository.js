// users.repository.js
import { query } from "../../database/mysql/conn.js";

class UserRepository {
    static async createUser(user) {
        const {username, password, role} = user;

        const [result] = await query(`
            INSERT INTO Users (username, password, role)
            VALUES (?, ?, ?)
            `, [username, password, role]);
        
        return result.affectedRows > 0;
    }

    static async updateUser(id, user) {
        const allowedFields = ['username', 'password'];
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(user)) {
            if (allowedFields.includes(key) && value !== undefined) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) return false;

        values.push(id);

        const [result] = await query(`
            UPDATE Users
            SET ${fields.join(',')}
            WHERE is_deleted = 0 AND id = ?
            `, values);

        return result.affectedRows > 0;
    }

    static async deleteUser(id) {
        const [result] = await query(`
            UPDATE Users SET is_deleted = 1 WHERE id = ?
            `, [id]);

        return result.affectedRows > 0;
    }

    static async getAllUser() {
        const [result] = await query(`
            SELECT id, username, created_at, updated_at, is_deleted, role 
            FROM Users
            WHERE is_deleted = 0
            `);

        return result.length > 0 ? result : null;
    }

    static async getUserByUsername(username) {
        const [result] = await query(`
            SELECT id, username, created_at, updated_at, is_deleted, role 
            FROM Users
            WHERE is_deleted = 0 AND username = ?
            `, [username]);

        return result.length > 0 ? result[0] : null;
    }

    static async getUserById(id) {
        const [result] = await query(`
            SELECT id, username, created_at, updated_at, is_deleted, role 
            FROM Users
            WHERE is_deleted = 0 AND id = ?
            `, [id]);

        return result.length > 0 ? result[0] : null;
    }

    static async getUserByRole(role = 'PASSENGER') {
        const [result] = await query(`
            SELECT id, username, created_at, updated_at, is_deleted, role 
            FROM Users
            WHERE is_deleted = 0 AND role = ?
            `, [role]);

        return result.length > 0 ? result : null;
    }

    static async isUserDeleted(id) {
        const [result] = await query(`
            SELECT 1 FROM Users WHERE id = ?
            `, [id]);

        return result.length > 0;
    }
}

export default UserRepository;