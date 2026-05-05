import LoyaltyRepository    from "./loyalty.repository.js";
import eventBus, { Events } from "../../common/utils/eventsBus.js";

class LoyaltyService {
	static async me(userId) {
		const loyalty = await LoyaltyRepository.getLoyaltyByPassenger(userId);

		if (!loyalty) {
			return {
				ok: false,
				statusCode: 404,
				message: "Loyalty account not found"
			};
		}

		return {
			ok: true,
			statusCode: 200,
			message: "Loyalty account fetched successfully",
			data: {
				...loyalty,
				loyalty_points: Number(loyalty.points ?? 0),
				loyaltyPoints: Number(loyalty.points ?? 0)
			}
		};
	}

	static async exchangePoints(payload) {
		const oldLoyalty = await LoyaltyRepository.getLoyaltyByPassenger(payload.passengerId);
		const exchanged  = await LoyaltyRepository.exchangePoints(payload.passengerId, payload.amount);
		const newLoyalty = await LoyaltyRepository.getLoyaltyByPassenger(payload.passengerId);

		if (!exchanged) {
			return {
				ok: false,
				statusCode: 500,
				message: "Failed to exchange points"
			};
		}

		eventBus.emit(Events.LOYALTY_EXCHANGE, {
			passenger_id: payload.passengerId,
			points_exchanged: payload.amount,
			action: 'EXCHANGE_POINTS',
			old_data: oldLoyalty,
			new_data: newLoyalty
		});

		return {
			ok: true,
			statusCode: 200,
			message: "Points exchanged successfully",
			data: payload
		};
	}
}

export default LoyaltyService;
// loyalty.service.js
