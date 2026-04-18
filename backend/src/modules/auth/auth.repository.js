// auth.repository.js

import { query } from "../../database/mysql/conn.js";
import PassengerProfile from "../../database/mongodb/schemas/passengers_profile.js";
import redisClient from "../../config/redis.config.js";

class AuthRepository {
    static async getUserCredentialsByUsername(username) {
        const [result] = await query(
            `
            SELECT id, username, password, role
            FROM Users
            WHERE is_deleted = 0 AND username = ?
            LIMIT 1
            `,
            [username]
        );

        return result.length > 0 ? result[0] : null;
    }

    static async getUserCredentialsById(id) {
        const [result] = await query(
            `
            SELECT id, username, password, role
            FROM Users
            WHERE is_deleted = 0 AND id = ?
            LIMIT 1
            `,
            [id]
        );

        return result.length > 0 ? result[0] : null;
    }

    static async updatePasswordById(id, hashPassword) {
        const [result] = await query(
            `
            UPDATE Users
            SET password = ?
            WHERE is_deleted = 0 AND id = ?
            `,
            [hashPassword, id]
        );

        return result.affectedRows > 0;
    }

    static async updateUsernameById(id, username) {
        const [result] = await query(
            `
            UPDATE Users
            SET username = ?
            WHERE is_deleted = 0 AND id = ?
            `,
            [username, id]
        );

        return result.affectedRows > 0;
    }

    static async getProfileByUserId(userId) {
        return PassengerProfile.findById(userId).lean();
    }

    static async getProfileByEmail(email) {
        return PassengerProfile.findOne({ "contact.email": email }).lean();
    }

    static async updateProfileByUserId(userId, data) {
        return PassengerProfile.findByIdAndUpdate(
            userId,
            { $set: data },
            { returnDocument: "after", runValidators: true }
        ).lean();
    }

    static async saveResetToken(token, userId, ttlSeconds = 900) {
        await redisClient.set(`reset_password:${token}`, String(userId), { EX: ttlSeconds });
    }

    static async getUserIdByResetToken(token) {
        const value = await redisClient.get(`reset_password:${token}`);
        return value ? Number(value) : null;
    }

    static async deleteResetToken(token) {
        await redisClient.del(`reset_password:${token}`);
    }
}

export default AuthRepository;