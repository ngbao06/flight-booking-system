import LoyaltyRepository from "./loyalty.repository.js";

class LoyaltyService {
	static async exchangePoints(payload) {
		const exchanged = await LoyaltyRepository.exchangePoints(payload.passengerId, payload.amount);
		if (!exchanged) {
			return {
				ok: false,
				statusCode: 500,
				message: "Failed to exchange points"
			};
		}

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
