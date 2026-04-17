// src/modules/logs/logs.subscriber.js
import eventBus, { Events } from '../../common/utils/eventsBus.js';
import AdminLogRepository from './adminLogs.repository.js';
import { getDiff } from '../../common/utils/diff.js';

const initAdminLogsListener = () => {
    // bắt sự kiện cập nhật chung
    eventBus.on(Events.CREATE_EVENT, async (data) => {
        try {
            const { new_data, ...info } = data;
            
            await AdminLogRepository.insertActivityLog({
                ...info,
                user_id: data.user_id || 0, // Sau này bạn lấy từ req.user
                role: data.role || 'ADMIN',
                new_data: new_data
            });

        } catch (error) {
            console.error('❌ MongoDB Logging Error:', error);
        }    
    });

    eventBus.on(Events.UPDATE_EVENT, async (data) => {
        try {
            const { old_data, new_data, ...info } = data;

            // Chỉ lấy ra các trường thực sự thay đổi
            const { old_changes, new_changes } = getDiff(old_data, new_data);

            // Nếu không có gì thay đổi thì không cần lưu log
            if (Object.keys(new_changes).length === 0) return;

            await AdminLogRepository.insertActivityLog({
                ...info,
                user_id: data.user_id || 0, // Sau này bạn lấy từ req.user
                role: data.role || 'ADMIN',
                old_data: old_changes,
                new_data: new_changes
            });

            console.log(`✅ Logged update for ${info.module} ID: ${info.id}`);
        } catch (error) {
            console.error('❌ MongoDB Logging Error:', error);
        }
    });

    eventBus.on(Events.DELETE_EVENT, async (data) => {
        try {
            const { delete_data, ...info } = data;

            await AdminLogRepository.insertActivityLog({
                ...info,
                user_id: data.user_id || 0, 
                role: data.role || 'ADMIN',
                delete_data: delete_data
            });

            console.log(`✅ Logged update for ${info.module} ID: ${info.id}`);
        } catch (error) {
            console.error('❌ MongoDB Logging Error:', error);
        }
    });

    // bắt sự kiện thay đổi thông tin chuyến bay cụ thể
    eventBus.on(Events.FLIGHT_UPDATED, async (data) => {
        try {
            const { old_data, new_data, ...info } = data;

            const { old_changes, new_changes } = getDiff(old_data, new_data);

            // Nếu không có gì thay đổi thì không cần lưu log
            if (Object.keys(new_changes).length === 0) return;

            await AdminLogRepository.insertFlightLog({
                ...info,
                role: data.role || 'ADMIN',
                old_data: old_changes,
                new_data: new_changes
            });

            console.log(`✅ Logged update for update ID: ${data.id}`);
        }
        catch (error) {
            console.error('❌ MongoDB Logging Error:', error);
        }
    });

    // bắt sự kiện đổi điểm nâng hạng ghế
    eventBus.on(Events.LOYALTY_EXCHANGE, async (data) => {
        try {
            const { old_data, new_data, ...info } = data;

            const { old_changes, new_changes } = getDiff(old_data, new_data);

            if (Object.keys(new_changes).length === 0) return;

            await AdminLogRepository.insertLoyaltyLog({
                ...info,
                old_data: old_changes,
                new_data: new_changes
            });
        } catch (error) {
            console.log('❌ MongoDB Logging Error:', error)
        }
    });

    // bắt sự kiện nhận loyalty points sau khi hoàn thành thanh toán đặt vé
    eventBus.on(Events.PAYMENT_SUCCESS, async (data) => {
        try {
            const { passengerId, bookingId, miles_traveled } = data;
    
            await AdminLogRepository.insertLoyaltyLog({
                passenger_id: passengerId,
                action: 'LOYALTY_GAINED',
                miles_traveled: miles_traveled,
                description: `Points received from booking #${bookingId}`
            });
            
            console.log(`[LoyaltyModule] Logged earned points for passenger ${passengerId}`);
        } catch (error) {
            console.error("[LoyaltyModule] Failed to log earned points:", error);
        }
    });
};

export default initAdminLogsListener;