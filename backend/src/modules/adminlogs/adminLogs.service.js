// src/modules/flights/flights.service.js
import flightRepo from './flights.repository.js'; // File chứa Raw SQL
import eventBus, { Events } from '../../core/eventBus.js';

export const updateFlightPrice = async (flightId, newPrice, adminId) => {
    // 1. Lấy dữ liệu cũ để làm Log (Vì không có ORM tự track)
    const oldFlight = await flightRepo.findById(flightId); 

    // 2. Thực thi Query SQL cập nhật
    const result = await flightRepo.updatePrice(flightId, newPrice);

    if (result.affectedRows > 0) {
        // 3. Bắn Event (Trigger ngầm)
        eventBus.emit(Events.FLIGHT_UPDATED, {
            entityId: flightId,
            entityType: 'FLIGHT',
            adminId: adminId,
            oldValues: { price: oldFlight.price },
            newValues: { price: newPrice },
            action: 'UPDATE_PRICE'
        });
    }

    return result;
};