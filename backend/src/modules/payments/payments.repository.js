// payments.repository.js
import { query } from "../../database/mysql/conn.js";

class PaymentsRepository {
    //
    static async createPayment(payment) {
        const {bookingId, transactionId, amount, paymentMethod, status} = payment;

        const [result] = await query(`
            INSERT INTO Payments (booking_id, transaction_id, amount, payment_method, status)
            VALUES (?, ?, ?, ?, ?)
            `, [bookingId, transactionId, amount, paymentMethod, status]);

        return result.affectedRows > 0;
    }
    
    // to-log
    static async updatePayment(id, payment) {
        const allowedFields = {
            bookingId: "booking_id",
            transactionId: "transaction_id",
            amount: "amount",
            paymentMethod: "payment_method",
            status: "status"
        };

        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(payment)) {
            if (allowedFields[key] && value !== undefined) {
                fields.push(`${allowedFields[key]} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) return false;

        values.push(id);

        try{
            const [result] = await query(`
                UPDATE Payments
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
            SELECT * FROM Payments
            `);

        return result.length > 0 ? result : null;
    }
    
    //
    static async getById(id) {
        const [result] = await query(`
            SELECT * FROM Payments
            WHERE id = ?
            `, [id]);

        return result.length > 0 ? result[0] : null;
    }
    
    //
    static async getByBookingId(bookingId) {
        const [result] = await query(`
            SELECT * FROM Payments
            WHERE booking_id = ?
            `, [bookingId]);

        return result.length > 0 ? result : null;
    }
    
    //
    static async getByTransactionId(transactionId) {
        const [result] = await query(`
            SELECT * FROM Payments
            WHERE transaction_id = ?
            `, [transactionId]);

        return result.length > 0 ? result[0] : null;
    }
    
    //
    static async getByRangeAmount(fromAmount, toAmount) {
        const [result] = await query(`
            SELECT * FROM Payments
            WHERE amount BETWEEN ? AND ?
            `, [fromAmount, toAmount]);

        return result.length > 0 ? result : null;
    }
    
    //
    static async getByPaymentMethod(paymentMethod) {
        const [result] = await query(`
            SELECT * FROM Payments
            WHERE payment_method = ?
            `, [paymentMethod]);

        return result.length > 0 ? result : null;
    }
    
    //
    static async getByStatus(status) {
        const [result] = await query(`
            SELECT * FROM Payments
            WHERE status = ?
            `, [status]);

        return result.length > 0 ? result : null;
    }

    //
    static async getStatusOfPayment(paymentId) {
        const [result] = await query(`
            SELECT status FROM Payments
            WHERE id = ?
            `, [paymentId]);

        return result.length > 0 ? result[0] : null;
    }
}

export default PaymentsRepository;