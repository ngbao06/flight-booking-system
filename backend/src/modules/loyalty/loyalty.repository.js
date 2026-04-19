// loyalty.repository.js
import { query } from "../../database/mysql/conn.js";

class LoyaltyRepository {
    // bool, - points và + vào points_used
    static async exchangePoints(passengerId, amount) {
        try {
            await query(`CALL proc_exchange_points(?, ?)`, [passengerId, amount]);
            return { ok: true };
        } catch (error) {
            return {
                ok: false,
                statusCode: 500,
                message: error.message
            };
        }
    }

    static async getLoyaltyByPassenger(passengerId) {
        const [result] = await query(`SELECT * FROM loyalty WHERE passenger_id = ?`, [passengerId]);
        return result.length > 0 ? result[0] : null;
    }

    // Add points back to passenger (for compensation/refund)
    static async addPoints(passengerId, amount) {
        try {
            const [result] = await query(`
                UPDATE loyalty
                SET points_balance = points_balance + ?
                WHERE passenger_id = ?
                `, [amount, passengerId]);

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error adding loyalty points:', error);
            return false;
        }
    }

    /*
    * trg_update_loyalty_after_payment: trigger tự động cộng điểm khi hoàn thành chặng bay
    *   "ECONOMY" :  80% dặm bay
    *   "BUSINESS": 130% dặm bay
    *   "FIRST"   : 200% dặm bay
    */

    /*
    *   trg_after_insert_user: trigger tự động tạo loyalty khi khách hàng tạo tài khoản
    */
}

export default LoyaltyRepository;