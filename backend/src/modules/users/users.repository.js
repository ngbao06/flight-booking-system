// users.repository.js
import { query } from "../../database/mysql/conn.js";
import PassengerProfile from "../../database/mongodb/schemas/passengers_profile.js";

class UserRepository {
    // luu vao MySQL
    static async createUser(user) {
        const {username, password, role} = user;

        const [result] = await query(`
            INSERT INTO Users (username, password, role)
            VALUES (?, ?, ?)
            `, [username, password, role]);
        
        return result.insertId;
    }

    // Luu o MongoDB
    static async createProfile(profile) {
        try {
            const newProfile = new PassengerProfile(profile);
            await newProfile.save();
            return true;
        } catch (error) {
            console.log(error.message);
            return false;
        }s
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

    static async updateProfile(userId, data) {
        return await PassengerProfile.findByIdAndUpdate(
            userId,
            { $set: data },
            { returnDocument: `after`, runValidators: true }
        );
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

    static async getUsersComplex(filters) {
        let sql = `SELECT id, username, created_at, updated_at, role FROM Users WHERE is_deleted = 0`;

        const params = [];

        if (filters.username) {
            sql += ` AND username = ?`;
            params.push(filters.username);
        }

        if (filters.role) {
            sql += ` AND role = ?`;
            params.push(filters.role);
        }

        const [result] = await query(sql, params);
        
        return result.length > 0 ? result : null;
    }
}

export default UserRepository;