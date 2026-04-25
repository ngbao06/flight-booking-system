// users.repository.js
import { query } from "../../database/mysql/conn.js";
import PassengerProfile from "../../database/mongodb/schemas/passengers_profile.js";
import { buildPagination } from "../../common/utils/pagination.js";

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
        }
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
        let sql = `
            SELECT id, username, created_at, updated_at, is_deleted, role 
            FROM Users
            WHERE is_deleted = 0
        `;
        const params = [];

        if (role === 'STAFF') {
            sql += ` AND role IN ('ADMIN', 'GATE_AGENT')`;
        } else {
            sql += ` AND role = ?`;
            params.push(role);
        }

        const [result] = await query(sql, params);
        return result.length > 0 ? result : null;
    }

    static async getAllPassengerUsers() {
        const [result] = await query(`
            SELECT id, username, created_at, updated_at, is_deleted, role
            FROM Users
            WHERE is_deleted = 0 AND role = 'PASSENGER'
            ORDER BY id ASC
            `);

        return result.length > 0 ? result : [];
    }

    static async getPassengerProfilesByUserIds(userIds = []) {
        if (!Array.isArray(userIds) || userIds.length === 0) {
            return [];
        }

        return PassengerProfile.find({ _id: { $in: userIds } }).lean();
    }

    static async getPassengerProfileByUserId(userId) {
        return PassengerProfile.findById(userId).lean();
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
            if (filters.role === 'STAFF') {
                sql += ` AND role IN ('ADMIN', 'GATE_AGENT')`;
            } else {
                sql += ` AND role = ?`;
                params.push(filters.role);
            }
        }

        const [result] = await query(sql, params);
        
        return result.length > 0 ? result : null;
    }
    static async getUsersWithPagination(filters = {}) {
        const page = Math.max(1, Number(filters.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(filters.limit) || 10));
        const offset = (page - 1) * limit;

        let sql = `SELECT id, username, created_at, updated_at, is_deleted, role FROM Users WHERE is_deleted = 0`;
        let countSql = `SELECT COUNT(*) as total FROM Users WHERE is_deleted = 0`;
        const params = [];
        const countParams = [];

        if (filters.username) {
            sql += ` AND username = ?`;
            countSql += ` AND username = ?`;
            params.push(filters.username);
            countParams.push(filters.username);
        }

        if (filters.role) {
            if (filters.role === 'STAFF') {
                sql += ` AND role IN ('ADMIN', 'GATE_AGENT')`;
                countSql += ` AND role IN ('ADMIN', 'GATE_AGENT')`;
            } else {
                sql += ` AND role = ?`;
                countSql += ` AND role = ?`;
                params.push(filters.role);
                countParams.push(filters.role);
            }
        }

        sql += ` ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;

        const [countRows] = await query(countSql, countParams);
        const [rows] = await query(sql, params);

        const total = Number(countRows?.[0]?.total || 0);
        const pagination = buildPagination(total, page, limit);

        return {
            data: rows,
            pagination
        };
    }

    static async getPassengerUsersWithPagination(filters = {}) {
        const page = Math.max(1, Number(filters.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(filters.limit) || 10));
        const offset = (page - 1) * limit;

        const countSql = `SELECT COUNT(*) as total FROM Users WHERE is_deleted = 0 AND role = 'PASSENGER'`;
        const listSql = `SELECT id, username, created_at, updated_at, is_deleted, role FROM Users WHERE is_deleted = 0 AND role = 'PASSENGER' ORDER BY id ASC LIMIT ${limit} OFFSET ${offset}`;

        const [countRows] = await query(countSql);
        const [rows] = await query(listSql);

        const total = Number(countRows?.[0]?.total || 0);
        const pagination = buildPagination(total, page, limit);

        return {
            data: rows,
            pagination
        };
    }
}

export default UserRepository;