// src/modules/logs/logs.subscriber.js
import eventBus, { Events } from '../../core/eventBus.js';
import NoSQL_LogRepo from './logs.repository.js';

export const setupLogSubscribers = () => {
    
    eventBus.on(Events.FLIGHT_UPDATED, async (payload) => {
        try {
            // Nhận data và lưu vào MongoDB
            await NoSQL_LogRepo.insertLog(payload);
            console.log(`[Log_MongoDB] Đã lưu log cho sự kiện: ${Events.FLIGHT_UPDATED}`);
        } catch (error) {
            // CỰC KỲ QUAN TRỌNG: Phải có try/catch ở đây. 
            // Vì nó chạy ngầm (async), nếu lỗi sẽ làm crash toàn bộ Node.js App.
            console.error('[Log_MongoDB] Lỗi khi lưu log:', error);
        }
    });

    eventBus.on(Events.BOOKING_SUCCESS, async (payload) => {
        try {
            await NoSQL_LogRepo.insertLog({ ...payload, type: 'TRANSACTION' });
        } catch (error) {
            console.error('[Log_MongoDB] Lỗi khi lưu log booking:', error);
        }
    });
};