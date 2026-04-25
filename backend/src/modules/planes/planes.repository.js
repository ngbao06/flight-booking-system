import { query } from "../../database/mysql/conn.js";
import { normalizePageLimit, paginateQuery } from "../../common/utils/pagination.js";

class PlaneRepository {
    // bool
    static async createPlane(plane) {
        const {airlineId, model, totalSeats} = plane;

        const [result] = await query(`
            INSERT INTO Planes (airline_id, model, total_seats)
            VALUES (?,?,?)
            `, [airlineId, model, totalSeats]);

        return result.affectedRows > 0;
    }
    
    // bool
    static async updatePlane(id, plane) {
        const allowedFields = {
            airlineId: "airline_id",
            model: "model",
            totalSeats: "total_seats",
            status: "status"
        };

        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(plane)) {
            if (allowedFields[key] && value !== undefined) {
                fields.push(`${allowedFields[key]} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) return false;

        values.push(id);

        const [result] = await query(`
            UPDATE Planes
            SET ${fields.join(", ")}
            WHERE is_deleted = 0 AND id = ?
            `, values);

        return result.affectedRows > 0;
    }
    
    // bool
    static async deletePlane(id) {
        const [result] = await query(`
            UPDATE Planes
            SET is_deleted = 1, status = 'RETIRED'
            WHERE id = ?
            `, [id]);

        return result.affectedRows > 0;
    }
    
    // list
    static async getAll() {
        const [result] = await query(`
            SELECT * FROM Planes
            WHERE is_deleted = 0
            `);

        return result.length > 0 ? result : null;
    }
    
    // object
    static async getById(id) {
        const [result] = await query(`
            SELECT * FROM Planes
            WHERE is_deleted = 0 AND id = ?
            `, [id]);

        return result.length > 0 ? result[0] : null;
    }
    
    // list
    static async getByAirline(airlineId) {
        const [result] = await query(`
            SELECT * FROM Planes
            WHERE is_deleted = 0 AND airline_id = ?
            `, [airlineId]);

        return result.length > 0 ? result : null;
    }
    
    // list
    static async getByModel(model) {
        model = `%${model}%`;

        const [result] = await query(`
            SELECT * FROM Planes
            WHERE is_deleted = 0 AND model LIKE ?
            `, [model]);

        return result.length > 0 ? result : null;
    }
    
    // list
    static async getByTotalSeats(totalSeats) {
        const [result] = await query(`
            SELECT * FROM Planes
            WHERE is_deleted = 0 AND total_seats = ?
            `, [totalSeats]);

        return result.length > 0 ? result : null;
    }
    
    // list
    static async getByStatus(status) {
        const [result] = await query(`
            SELECT * FROM Planes
            WHERE is_deleted = 0 AND status = ?
            `, [status]);

        return result.length > 0 ? result : null;
    }

    // object
    static async getStatusOfPlane(id) {
        const [result] = await query(`
            SELECT status FROM Planes
            WHERE is_deleted = 0 AND id = ?
            `, [id]);

        return result.length > 0 ? result[0] : null;
    }

    static async getPlaneComplex(filters) {
        let fromSql = `FROM Planes WHERE is_deleted = 0`;
        
        const params = [];

        if (filters.airlineId) {
            fromSql += " AND airline_id = ?";
            params.push(filters.airlineId);
        }

        if (filters.model) {
            fromSql += " AND model LIKE ?";
            params.push(`%${filters.model}%`);
        }

        if (filters.totalSeats) {
            fromSql += " AND total_seats = ?";
            params.push(filters.totalSeats);
        }

        if (filters.status) {
            fromSql += " AND status = ?";
            params.push(filters.status);
        }

        if (filters.page !== undefined || filters.limit !== undefined) {
            const { page, limit } = normalizePageLimit(filters, 10, 1000);
            return paginateQuery({
                selectSql: "SELECT id, airline_id, model, total_seats, status",
                fromSql,
                params,
                page,
                limit,
                orderBy: "ORDER BY id ASC"
            });
        }

        const [result] = await query(`SELECT id, airline_id, model, total_seats, status ${fromSql}`, params);

        return result.length > 0 ? result : null;
    }
}

export default PlaneRepository;