// src/modules/logs/adminLog.repository.js
import { getMongo } from "../../database/mongodb/conn";

class AdminLogRepository {
    constructor() {
        this.collectionName = 'activity_logs';
    }

    // Lưu Log (Trigger từ EventBus)
    async insertLog(logPayload) {
        try {
            const database = await getMongo();
            const collection = database.collection(this.collectionName);
            
            // Thêm timestamp thủ công vì không dùng Mongoose
            const document = {
                ...logPayload,
                createdAt: new Date()
            };

            const result = await collection.insertOne(document);
            return result;
        } catch (error) {
            console.error('[AdminLogRepo] Error inserting log:', error);
            throw error;
        }
    }

    // Lấy Log (Cho Controller/Admin UI)
    async getLogs(filters = {}, page = 1, limit = 20) {
        try {
            const database = await connectDB();
            const collection = database.collection(this.collectionName);
            
            const skip = (page - 1) * limit;
            
            // Thực hiện query thuần MongoDB
            const logs = await collection.find(filters)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .toArray();

            const total = await collection.countDocuments(filters);

            return { data: logs, total, page, limit };
        } catch (error) {
            console.error('[AdminLogRepo] Error fetching logs:', error);
            throw error;
        }
    }
}

export default new AdminLogRepository();