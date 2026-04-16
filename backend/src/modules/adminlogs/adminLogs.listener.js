// src/modules/logs/logs.subscriber.js
import eventBus, { Events } from '../../common/utils/eventsBus.js';
import AdminLogRepository from './adminLogs.repository.js';
import { getDiff } from '../../common/utils/diff.js';

const initAdminLogsListener = () => {
    eventBus.on('CREATE_EVENT', async (data) => {
        try {
            const { new_data, ...info } = data;
            
            await AdminLogRepository.insertLog({
                ...info,
                user_id: data.user_id || 0, // Sau này bạn lấy từ req.user
                role: data.role || 'ADMIN',
                new_data: new_data
            });
            
        } catch (error) {
            console.error('❌ MongoDB Logging Error:', error);
        }    
    });

    eventBus.on('UPDATE_EVENT', async (data) => {
        try {
            const { old_data, new_data, ...info } = data;

            // Chỉ lấy ra các trường thực sự thay đổi
            const { old_changes, new_changes } = getDiff(old_data, new_data);

            // Nếu không có gì thay đổi thì không cần lưu log
            if (Object.keys(new_changes).length === 0) return;

            await AdminLogRepository.insertLog({
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

    eventBus.on('DELETE_EVENT', async (data) => {
        try {
            const { delete_data, ...info } = data;

            await AdminLogRepository.insertLog({
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
};

export default initAdminLogsListener;