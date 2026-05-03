import SagaLog from '../../database/mongodb/schemas/saga_logs.js';

class SagaLogsRepository {
    static async log(bookingId, step, status, message, details = {}) {
        try {
            if (!bookingId) return;
            await SagaLog.create({
                booking_id: bookingId,
                step,
                status,
                message,
                details
            });
        } catch (error) {
            console.error('[SAGA LOG ERROR] Failed to write saga log:', error);
        }
    }
}

export default SagaLogsRepository;