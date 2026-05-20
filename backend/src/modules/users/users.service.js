import UsersRepository from "./users.repository.js";
import eventBus, { Events } from "../../common/utils/eventsBus.js";
import { sendWelcomeEmail } from "../../common/utils/mail.js";
import bcrypt from "bcrypt";


const MODULE_NAME = `users`

class UsersService {
	static async createUser(payload) {
		const username = payload.username?.trim();

		// Kiểm tra user đã tồn tại chưa
		const existing = await UsersRepository.getUserByUsername(username);
		if (existing) {
			return {
				ok: false,
				statusCode: 409,
				message: "Username already exists"
			};
		}

		// Hash mk và lưu vào MySQL
		const hashPassword = await bcrypt.hash(payload.password, 10);
		const userId = await UsersRepository.createUser({
			username,
			password: hashPassword,
			role: payload.role || "PASSENGER"
		});
			
		if (!userId) {
			return {
				ok: false,
				statusCode: 500,
				message: "Failed to create user"
			};
		}

		// TODO: tạo tk thành công nhưng khi đã đăng nhập vào sẽ hỏi các thông tin profile và vài thông tin cần required
		// Lưu vào MongoDB
		const profile = {
			_id: userId,
			full_name: payload.full_name || username,
			contact: {
				email  : payload.email,
				phone  : payload.phone,
				address: payload.address
			},
			passport: {
				number      : payload.passport_number,
				expiry_date : payload.passport_expiry_date,
				nationality : payload.passport_nationality
			},
			preferences: {
				meal         : payload.meal || 'Standard',
				seat_position: payload.seat_position || 'none'
			}
		}
		const profileCreated = await UsersRepository.createProfile(profile);

		if (!profileCreated) {
			return {
				ok: false,
				statusCode: 500,
				message: "Failed to create user profile"
			}
		}

		// Gửi mail chúc mừng đăng ký nếu có email
		// try {
		// 	if (profile.contact && profile.contact.email) {
		// 		await sendWelcomeEmail({ to: profile.contact.email, username: profile.full_name || username });
		// 	}
		// } catch (err) {
		// 	console.warn('Failed to send welcome email:', err?.message || err);
		// }

		// Lưu activity_logs các sự kiện cập nhật bảng
		eventBus.emit(Events.CREATE_EVENT, {
			module: MODULE_NAME,
			action: 'REGISTER',
			new_data: {userId, username, ...profile},
			user_id: userId
		});
		
		return {
			ok: true,
			statusCode: 201,
			message: "User registered successfully"
		};
	}

	static async getUsers(filters = {}) {
		const { username, role, page, limit } = filters;

		if (username && role) {
			return {
				ok: false,
				statusCode: 400,
				message: "Bad request"
			};
		}

		if (page !== undefined || limit !== undefined) {
			const result = await UsersRepository.getUsersWithPagination({
				username,
				role,
				page: page || 1,
				limit: limit || 10
			});

			return {
				ok: true,
				statusCode: 200,
				message: "Users fetched successfully",
				data: result.data || [],
				pagination: result.pagination
			};
		}

		let user;
		if (username) user = await UsersRepository.getUserByUsername(username);
		else if (role) user = await UsersRepository.getUserByRole(role);
		else user = await UsersRepository.getAllUser();

		if (!user) {
			return {
				ok: true,
				statusCode: 200,
				message: "Users fetched successfully",
				data: []
			};
		}

		return {
			ok: true,
			statusCode: 200,
			message: "Users fetched successfully",
			data: Array.isArray(user) ? user : [user]
		};
	}

	static async getPassengersFullInfo(filters = {}) {
		const { page, limit } = filters;

		const result = await UsersRepository.getPassengerUsersWithPagination({
			page: page || 1,
			limit: limit || 10
		});

		const passengers = result.data || [];
		const userIds = passengers.map((user) => user.id);
		const profiles = await UsersRepository.getPassengerProfilesByUserIds(userIds);

		const profileMap = new Map(
			(profiles || []).map((profile) => [Number(profile._id), profile])
		);

		const data = passengers.map((user) => ({
			...user,
			profile: profileMap.get(user.id) || null
		}));

		return {
			ok: true,
			statusCode: 200,
			message: "Passengers fetched successfully",
			data,
			pagination: result.pagination
		};
	}

	static async getPassengerProfile(id) {
		const profile = await UsersRepository.getPassengerProfileByUserId(id);

		if (!profile) {
			return {
				ok: false,
				statusCode: 404,
				message: "Passenger profile not found"
			};
		}

		return {
			ok: true,
			statusCode: 200,
			message: "Passenger profile fetched successfully",
			data: profile
		};
	}

	static async getUserById(id) {
		const user = await UsersRepository.getUserById(id);
		if (!user) {
			return {
				ok: false,
				statusCode: 404,
				message: "User not found"
			};
		}

		return {
			ok: true,
			statusCode: 200,
			message: "User fetched successfully",
			data: user
		};
	}

	static async updateUser(id, payload) {
		const existed = await UsersRepository.getUserById(id);
		if (!existed) {
			return {
				ok: false,
				statusCode: 404,
				message: "User not found"
			};
		}
		
		const { username, password, ...profile } = payload;

		if (username || password) {
			if (username !== existed.username) {
				const duplicated = await UsersRepository.getUserByUsername(username);
				if (duplicated) {
					return {
						ok: false,
						statusCode: 409,
						message: "Username already exists"
					};
				}
			}

			const updated = await UsersRepository.updateUser(id, payload);
			if (!updated) {
				return {
					ok: false,
					statusCode: 500,
					message: "Failed to update user"
				};
			}
		}

		if (Object.keys(profile).length > 0) {
			const mongoUpdateData = {};
    
			if (profile.meal)		   mongoUpdateData['preferences.meal'] 			= profile.meal;
			if (profile.seat_position) mongoUpdateData['preferences.seat_position'] = profile.seat_position;
			
			// Nếu có các trường contact
			if (profile.email)   mongoUpdateData['contact.email']   = profile.email;
			if (profile.phone)   mongoUpdateData['contact.phone']   = profile.phone;
			if (profile.address) mongoUpdateData['contact.address'] = profile.phone;

			if (profile.passport_number)      mongoUpdateData['passport.number']      = profile.passport_number;
			if (profile.passport_expiry_date) mongoUpdateData['passport.expiry_date'] = profile.passport_expiry_date;
			if (profile.passport_nationality) mongoUpdateData['passport.nationality'] = profile.passport_nationality;

			// Truyền object đã map đúng path vào repository
			await UsersRepository.updateProfile(id, mongoUpdateData);
		}
		
		eventBus.emit(Events.UPDATE_EVENT, {
			module: MODULE_NAME,
			action: 'UPDATE',
			id: id,
			old_data: existed,
			new_data: payload,
			user_id: 12321311
		});

		const user = await UsersRepository.getUserById(id);
		return {
			ok: true,
			statusCode: 200,
			message: "User updated successfully",
			data: user
		};
	}

	// soft delete: dự liệu ở mysql và mongo tự động xóa sau 1 khoảng tgian
	static async deleteUser(id) {
		const existed = await UsersRepository.getUserById(id);
		if (!existed) {
			return {
				ok: false,
				statusCode: 404,
				message: "User not found"
			};
		}

		const deleted = await UsersRepository.deleteUser(id);
		if (!deleted) {
			return {
				ok: false,
				statusCode: 500,
				message: "Failed to delete user"
			};
		}

		eventBus.emit(Events.DELETE_EVENT, {
			module: MODULE_NAME,
			action: 'DELETE',
			id: id,
			old_data: existed,
			user_id: 12321311
		});

		return {
			ok: true,
			statusCode: 200,
			message: "User deleted successfully"
		};
	}
}

export default UsersService;
// users.service.js
