// loyalty.repository.js
import { query } from "../../database/mysql/conn.js";

class LoyaltyRepository {
    // bool, - points và + vào points_used
    static async exchangePoints(passengerId, amount) {
        try {
            await query(`CALL proc_exchange_points(?, ?)`, [passengerId, amount]);
            return true;
        } catch (error) {
            console.log(error.message);
            return false;
        }
    }
}

export default LoyaltyRepository;