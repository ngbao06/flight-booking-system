import { query } from "../../database/mysql/conn.js";

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
        let sql = `SELECT id, airline_id, model, total_seats, status FROM Planes WHERE is_deleted = 0`;
        
        const params = [];

        if (filters.airlineId) {
            sql += " AND airline_id = ?";
            params.push(filters.airlineId);
        }

        if (filters.model) {
            sql += " AND model LIKE ?";
            params.push(`%${filters.model}%`);
        }

        if (filters.totalSeats) {
            sql += " AND total_seats = ?";
            params.push(filters.totalSeats);
        }

        if (filters.status) {
            sql += " AND status = ?";
            params.push(filters.status);
        }

        const [result] = await query(sql, params);

        return result.length > 0 ? result : null;
    }
}

export default PlaneRepository;