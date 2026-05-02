// booking.repository.js
import { query } from "../../database/mysql/conn.js";
import { normalizePageLimit, paginateQuery } from "../../common/utils/pagination.js";

class BookingRepository {
    //
    static async createBooking(booking) {
        const {flightId, bookingDate, totalAmount, status} = booking;

        if (status !== undefined) {
            const [result] = await query(`
                INSERT INTO Bookings (flight_id, booking_date, total_amount, status)
                VALUES (?, ?, ?, ?)
                `, [flightId, bookingDate, totalAmount, status]);

            return result.insertId;
        }

        const [result] = await query(`
            INSERT INTO Bookings (flight_id, booking_date, total_amount)
            VALUES (?, ?, ?)
            `, [flightId, bookingDate, totalAmount]);

        return result.insertId;
    }
    
    // to-log
    static async updateBooking(id, booking) {
        const allowedFields = {
            status: "status"
        };

        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(booking)) {
            if (allowedFields[key] && value !== undefined) {
                fields.push(`${allowedFields[key]} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) return false;

        values.push(id);
        
        let result;
        try{
            [result] = await query(`
                UPDATE Bookings
                SET ${fields.join(", ")}
                WHERE id = ?
                `, values);
        }
        catch (error) {
            console.log(error.message);
            return false;
        }
        return result.affectedRows > 0;
    }

    //
    static async getAll() {
        const [result] = await query(`
            SELECT * FROM Bookings
            `);

        return result.length > 0 ? result : null;
    }
    
    //
    static async getById(id) {
        const [result] = await query(`
            SELECT * FROM Bookings
            WHERE id = ?
            `, [id]);

        return result.length > 0 ? result[0] : null;
    }
    
    //
    static async getByFlight(flight) {
        const [result] = await query(`
            SELECT * FROM Bookings
            WHERE flight_id = ?
            `, [flight]);

        return result.length > 0 ? result : null;
    }
    
    //
    static async getByBookingDate(bookingDate) {
        const [result] = await query(`
            SELECT * FROM Bookings
            WHERE booking_date = ?
            `, [bookingDate]);

        return result.length > 0 ? result : null;
    }
    
    //
    static async getByRangeAmount(fromAmount, toAmount) {
        const [result] = await query(`
            SELECT * FROM Bookings
            WHERE total_amount BETWEEN ? AND ?
            `, [fromAmount, toAmount]);

        return result.length > 0 ? result : null;
    }
    
    //
    static async getByStatus(status) {
        const [result] = await query(`
            SELECT * FROM Bookings
            WHERE status = ?
            `, [status]);

        return result.length > 0 ? result : null;
    }

    static async getBookingsComplex(filters = {}) {
        let fromSql = "FROM Bookings WHERE 1 = 1";
        const params = [];

        if (filters.flightId !== undefined) {
            fromSql += " AND flight_id = ?";
            params.push(filters.flightId);
        }

        if (filters.bookingDate) {
            fromSql += " AND booking_date = ?";
            params.push(filters.bookingDate);
        }

        if (filters.fromAmount !== undefined && filters.toAmount !== undefined) {
            fromSql += " AND total_amount BETWEEN ? AND ?";
            params.push(filters.fromAmount, filters.toAmount);
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
                orderBy: "ORDER BY id"
            });
        }

        const [result] = await query(`SELECT * ${fromSql}`, params);
        return result.length > 0 ? result : null;
    }
    
    //
    static async getStatusOfBooking(bookingId) {
        const [result] = await query(`
            SELECT status FROM Bookings
            WHERE id = ?
            `, [bookingId]);

        return result.length > 0 ? result[0] : null;
    }
}

export default BookingRepository;