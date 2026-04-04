// tickets.repository.js
import { query } from "../../database/mysql/conn.js";

class TicketsRepository {
    static async createTicket(ticket) {
        const {
            ticketNumber,
            bookingId,
            seatId,
            buyerId,
            passengerLastname,
            passengerFirstname,
            passengerIdCard,
            issueDate,
            finalPrice,
            status
        } = ticket;

        const [result] = await query(`
            INSERT INTO Tickets
            (ticket_number, booking_id, seat_id, buyer_id, passenger_lastname, passenger_firstname, passenger_id_card, issue_date, final_price, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                ticketNumber,
                bookingId,
                seatId,
                buyerId,
                passengerLastname,
                passengerFirstname,
                passengerIdCard,
                issueDate,
                finalPrice,
                status
            ]);

        return result.affectedRows > 0;
    }

    static async updateTicket(id, ticket) {
        const allowedFields = {
            ticketNumber: "ticket_number",
            bookingId: "booking_id",
            seatId: "seat_id",
            buyerId: "buyer_id",
            passengerLastname: "passenger_lastname",
            passengerFirstname: "passenger_firstname",
            passengerIdCard: "passenger_id_card",
            issueDate: "issue_date",
            finalPrice: "final_price",
            status: "status"
        };

        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(ticket)) {
            if (allowedFields[key] && value !== undefined) {
                fields.push(`${allowedFields[key]} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) return false;

        values.push(id);

        const [result] = await query(`
            UPDATE Tickets
            SET ${fields.join(", ")}
            WHERE id = ?
            `, values);

        return result.affectedRows > 0;
    }

    static async getAll() {
        const [result] = await query(`
            SELECT * FROM Tickets
            `);

        return result.length > 0 ? result : null;
    }

    static async getByTicketNumber(ticketNumber) {
        const [result] = await query(`
            SELECT * FROM Tickets
            WHERE ticket_number = ?
            `, [ticketNumber]);

        return result.length > 0 ? result[0] : null;
    }

    static async getByBooking(bookingId) {
        const [result] = await query(`
            SELECT * FROM Tickets
            WHERE booking_id = ?
            `, [bookingId]);

        return result.length > 0 ? result : null;
    }

    static async getBySeat(seatId) {
        const [result] = await query(`
            SELECT * FROM Tickets
            WHERE seat_id = ?
            `, [seatId]);

        return result.length > 0 ? result[0] : null;
    }

    static async getByBuyer(passengerId) {
        const [result] = await query(`
            SELECT * FROM Tickets
            WHERE buyer_id = ?
            `, [passengerId]);

        return result.length > 0 ? result : null;
    }

    static async getByPassengerName(passengerName) {
        const name = `%${passengerName}%`;

        const [result] = await query(`
            SELECT * FROM Tickets
            WHERE passenger_lastname LIKE ? OR passenger_firstname LIKE ?
            `, [name, name]);

        return result.length > 0 ? result : null;
    }

    static async getByIssueDate(issueDate) {
        const [result] = await query(`
            SELECT * FROM Tickets
            WHERE issue_date = ?
            `, [issueDate]);

        return result.length > 0 ? result : null;
    }

    static async getByStatus(status) {
        const [result] = await query(`
            SELECT * FROM Tickets
            WHERE status = ?
            `, [status]);

        return result.length > 0 ? result : null;
    }
}

export default TicketsRepository;