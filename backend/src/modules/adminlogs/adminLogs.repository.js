// src/modules/logs/adminLog.repository.js
import { getMongo } from "../../database/mongodb/conn.js";
import ActivityLog from "../../database/mongodb/schemas/activity_logs.js";

class AdminLogRepository {
    constructor() {
        this.collectionName = 'activity_logs';
    }

    // Lưu Log (Trigger từ EventBus)
    async insertLog(logPayload) {
        try {

            const log = new ActivityLog(logPayload);
            const result = await log.save();
            return result;

        } catch (error) {

            console.error('[AdminLogRepo] Error inserting log:', error);

        }
    }

    // Lấy Log (Cho Controller/Admin UI)
    async getLogs(filters = {}, page = 1, limit = 20) {
        try {
            
            const skip = (page - 1) * limit;
            
            // Thực hiện query thuần MongoDB
            const logs = await ActivityLog.find(filters)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            const total = await ActivityLog.countDocuments(filters);

            return { data: logs, total, totalPages: Math.ceil(total / limit), currentPage, limit };
        } catch (error) {
            console.error('[AdminLogRepo] Error fetching logs:', error);
            throw error;
        }
    }
}

export default new AdminLogRepository();