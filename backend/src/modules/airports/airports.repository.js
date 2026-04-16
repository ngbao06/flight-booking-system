import { query } from "../../database/mysql/conn.js";
import eventBus, { Events } from "../../common/utils/eventsBus.js";

class AirportsRepository {
    // bool
    static async createAirport(airport) {
        const {iataCode, name, city, region} = airport;

        const [result] = await query(`
            INSERT INTO Airports (iata_code, name, city, region)
            VALUES (?, ?, ?, ?)
            `, [iataCode, name, city, region]);

        return result.affectedRows > 0;
    }

    // bool
    static async updateAirport(id, airport) {
        const allowedFields = [`name`, `city`, `status`];
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(airport)) {
            if (allowedFields.includes(key) && value !== undefined) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) return false;

        values.push(id);

        const [result] = await query(`
            UPDATE Airports 
            SET ${fields.join(', ')}
            WHERE is_deleted = 0 AND id = ?
            `, values);

        return result.affectedRows > 0;
    }

    // bool
    static async deleteAirport(id) {
        const [result] = await query(`
            UPDATE Airports SET is_deleted = 1 WHERE id = ?
            `, [id]);

        return result.affectedRows > 0;
    }

    // bool 
    static async isAirportDeleted(id) {
        const [result] = await query(`
            SELECT 1 FROM Airports WHERE id = ?
            `, [id]);

        return result.length > 0;
    }

    // bool
    static async lockAirport(id) {
        const [result] = await query(`
            UPDATE Airports SET status = 'LOCKED' WHERE is_deleted = 0 AND id = ?
            `, [id]);

        return result.affectedRows > 0;
    }

    // bool
    static async unlockAirport(id) {
        const [result] = await query(`
            UPDATE Airports SET status = 'ACTIVE' WHERE is_deleted = 0 AND id = ?
            `, [id]);

        return result.affectedRows > 0;
    }

    static async getAllAirports() {
        const [result] = await query(`
            SELECT * FROM Airports WHERE is_deleted = 0
            `);

        return result.length > 0 ? result : null;
    }
    // object
    static async getById(id) {
        const [result] = await query(`
            SELECT * FROM Airports WHERE is_deleted = 0 AND id = ?
            `, [id]);

        return result.length > 0 ? result[0] : null;
    }

    // object
    static async getByIataCode(iataCode) {
        const [result] = await query(`
            SELECT * FROM Airports WHERE is_deleted = 0 AND iata_code = ?
            `, [iataCode]);

        return result.length > 0 ? result[0] : null;
    }

    // list
    static async getByName(name) {
        const [result] = await query(`
            SELECT * FROM Airports WHERE is_deleted = 0 AND name = ?
            `, [name]);

        return result.length > 0 ? result : null;
    }

    // list
    static async getByCity(city) {
        const [result] = await query(`
            SELECT * FROM Airports WHERE is_deleted = 0 AND city = ?
            `, [city]);

        return result.length > 0 ? result : null;
    }

    // list
    static async getByRegion(region) {
        const [result] = await query(`
            SELECT * FROM Airports WHERE is_deleted = 0 AND region = ?
            `, [region]);

        return result.length > 0 ? result : null;
    }

    // list
    static async getByStatus(status) {
        const [result] = await query(`
            SELECT * FROM Airports WHERE is_deleted = 0 AND status = ?
            `, [status]);

        return result.length > 0 ? result : null;
    }
}

export default AirportsRepository;