// airlines.repository.js
import { query } from './../../database/mysql/conn.js'
import { normalizePageLimit, paginateQuery } from '../../common/utils/pagination.js';

class AirlinesRepository {
    // bool
    static async createAirline(airline) {
        const {code, name} = airline;

        const [result] = await query(`
            INSERT INTO Airlines (code, name) 
            VALUES (?,?)
            `, [code,name]);

        return result.affectedRows > 0;
    }

    // bool
    static async updateAirline(id, airline) {
        const allowedFields = [`name`,`code`,`status`];
        const fields = [];
        const values = [];

        for (const [key,value] of Object.entries(airline)) {
            if (allowedFields.includes(key) && value !== undefined) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        values.push(id);

        const [result] = await query(`
            UPDATE Airlines
            SET ${fields.join(`,`)}
            WHERE is_deleted = 0 AND id = ?
            `, values);

        return result.affectedRows > 0;
    }

    // bool
    static async deleteAirline(id) {
        const [result] = await query(`
            UPDATE Airlines
            SET is_deleted = 1, status = 'LOCKED'
            WHERE id = ?
            `, [id]);

        return result.affectedRows > 0;
    }

    // list
    static async getAllAirline() {
        const [result] = await query(`
            SELECT * FROM Airlines
            WHERE is_deleted = 0
            `);

        return result.length > 0 ? result : null;
    }

    // object
    static async getAirlineById(id) {
        const [result] = await query(`
            SELECT * FROM Airlines
            WHERE is_deleted = 0 AND id = ?
            `, [id]);

        return result.length > 0 ? result[0] : null;
    }

    // object
    static async getAirlineByCode(code) {
        const [result] = await query(`
            SELECT * FROM Airlines
            WHERE is_deleted = 0 AND code = ?
            `, [code]);

        return result.length > 0 ? result[0] : null;
    }

    // list
    static async getAirlineByName(name) {
        name = `%${name}%`;
        const [result] = await query(`
            SELECT * FROM Airlines
            WHERE is_deleted = 0 AND name LIKE ?
            `, [name]);

        return result.length > 0 ? result : null;
    }

    static async getAirlinesComplex(filters) {
        let fromSql = "FROM Airlines WHERE is_deleted = 0";
        const params = [];

        if (filters.code) {
            fromSql += " AND code = ?";
            params.push(filters.code);
        }

        if (filters.name) {
            fromSql += " AND name = ?";
            params.push(filters.name);
        }

        if (filters.status) {
            fromSql += " AND status = ?";
            params.push(filters.status);
        }

        if (filters.page !== undefined || filters.limit !== undefined) {
            const { page, limit } = normalizePageLimit(filters, 10, 1000);
            return paginateQuery({
                selectSql: "SELECT *",
                fromSql,
                params,
                page,
                limit,
                orderBy: "ORDER BY id ASC"
            });
        }

        const [result] = await query(`SELECT * ${fromSql}`, params);

        return result.length > 0 ? result : null;
    }
}

export default AirlinesRepository;