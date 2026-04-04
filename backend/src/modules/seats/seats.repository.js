// seats.repository.js
import { query } from "../../database/mysql/conn.js";

class SeatsRepository {
    // kiem tra plane cua flight, check total_seat va tao ghe ngoi tu dong cho toan bo chuyen bay
    static async createSeats(flightId, basePrice) {
        try {
            await query(`CALL proc_create_seats_for_flight(?, ?)`, [flightId, basePrice]);

            return true;
        } catch (error) {
            throw new Error(error.message);
        }
    }
    
    //
    static async updateSeat(id, seat) {
        const allowedFields = {
            seatNumber: "seat_number",
            price: "price",
            class: "class",
            status: "status"
        };

        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(seat)) {
            if (allowedFields[key] && value !== undefined) {
                fields.push(`${allowedFields[key]} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) return false;

        values.push(id);

        const [result] = await query(`
            UPDATE Seats
            SET ${fields.join(", ")}
            WHERE id = ?
            `, values);

        return result.affectedRows > 0;
    }
    
    //
    static async getAll() {
        const [result] = await query(`
            SELECT * FROM Seats
            `);

        return result.length > 0 ? result : null;
    }
    
    //
    static async getByFlight(flightId) {
        const [result] = await query(`
            SELECT * FROM Seats
            WHERE flight_id = ?
            `, [flightId]);

        return result.length > 0 ? result : null;
    }
    
    //
    static async getBySeatNumber(seatNumber) {
        const [result] = await query(`
            SELECT * FROM Seats
            WHERE seat_number = ?
            `, [seatNumber]);

        return result.length > 0 ? result : null;
    }
    
    //
    static async getByRangePrice(fromPrice, toPrice) {
        const [result] = await query(`
            SELECT * FROM Seats
            WHERE price BETWEEN ? AND ?
            `, [fromPrice, toPrice]);

        return result.length > 0 ? result : null;
    }
    
    //
    static async getByClass(_class) {
        const [result] = await query(`
            SELECT * FROM Seats
            WHERE class = ?
            `, [_class]);

        return result.length > 0 ? result : null;
    }
    
    //
    static async getByStatus(status) {
        const [result] = await query(`
            SELECT * FROM Seats
            WHERE status = ?
            `, [status]);

        return result.length > 0 ? result : null;
    }
}

export default SeatsRepository;