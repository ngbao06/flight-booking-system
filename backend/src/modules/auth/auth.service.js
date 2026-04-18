import bcrypt from "bcrypt";
import crypto from "crypto";
import UsersService from "../users/users.service.js";
import AuthRepository from "./auth.repository.js";
import { sendResetPasswordEmail } from "../../common/utils/mail.js";

const RESET_TOKEN_TTL_SECONDS = 15 * 60;

const regenerateSession = (req) => new Promise((resolve, reject) => {
	req.session.regenerate((error) => {
		if (error) return reject(error);
		return resolve();
	});
});

const saveSession = (req) => new Promise((resolve, reject) => {
	req.session.save((error) => {
		if (error) return reject(error);
		return resolve();
	});
});

const destroySession = (req) => new Promise((resolve, reject) => {
	req.session.destroy((error) => {
		if (error) return reject(error);
		return resolve();
	});
});

class AuthService {
	static async register(payload) {
		return UsersService.createUser(payload);
	}

	static async login(payload, req) {
		const username = payload.username.trim();
		const user = await AuthRepository.getUserCredentialsByUsername(username);

		if (!user) {
			return {
				ok: false,
				statusCode: 401,
				message: "Invalid username or password"
			};
		}

		const validPassword = await bcrypt.compare(payload.password, user.password);
		if (!validPassword) {
			return {
				ok: false,
				statusCode: 401,
				message: "Invalid username or password"
			};
		}

		await regenerateSession(req);

		req.session.user = {
			id: user.id,
			username: user.username,
			role: user.role
		};

		await saveSession(req);

		return {
			ok: true,
			statusCode: 200,
			message: "Login successful",
			data: {
				user: req.session.user
			}
		};
	}

	static async logout(req) {
		await destroySession(req);

		return {
			ok: true,
			statusCode: 200,
			message: "Logout successful"
		};
	}

	static async me(userId) {
		const user = await AuthRepository.getUserCredentialsById(userId);
		if (!user) {
			return {
				ok: false,
				statusCode: 404,
				message: "User not found"
			};
		}

		const profile = await AuthRepository.getProfileByUserId(userId);

		return {
			ok: true,
			statusCode: 200,
			message: "Current user fetched successfully",
			data: {
				id: user.id,
				username: user.username,
				role: user.role,
				profile: profile || null
			}
		};
	}

	static async updatePassword(userId, payload) {
		const user = await AuthRepository.getUserCredentialsById(userId);
		if (!user) {
			return {
				ok: false,
				statusCode: 404,
				message: "User not found"
			};
		}

		const matched = await bcrypt.compare(payload.old_password, user.password);
		if (!matched) {
			return {
				ok: false,
				statusCode: 400,
				message: "Old password is incorrect"
			};
		}

		const sameAsOld = await bcrypt.compare(payload.new_password, user.password);
		if (sameAsOld) {
			return {
				ok: false,
				statusCode: 400,
				message: "New password must be different from old password"
			};
		}

		const hashPassword = await bcrypt.hash(payload.new_password, 10);
		const updated = await AuthRepository.updatePasswordById(userId, hashPassword);

		if (!updated) {
			return {
				ok: false,
				statusCode: 500,
				message: "Failed to update password"
			};
		}

		return {
			ok: true,
			statusCode: 200,
			message: "Password updated successfully"
		};
	}

	static async requestResetPassword(payload) {
		const username = payload.username?.trim();
		const email = payload.email?.trim().toLowerCase();

		let user = null;
		let recipientEmail = email;

		if (username) {
			user = await AuthRepository.getUserCredentialsByUsername(username);
			if (user && !recipientEmail) {
				const profile = await AuthRepository.getProfileByUserId(user.id);
				recipientEmail = profile?.contact?.email || null;
			}
		} else if (email) {
			const profile = await AuthRepository.getProfileByEmail(email);
			if (profile?._id) {
				user = await AuthRepository.getUserCredentialsById(profile._id);
				recipientEmail = email;
			}
		}

		// Trả về response giống nhau để tránh lộ thông tin tài khoản.
		if (!user || !recipientEmail) {
			return {
				ok: true,
				statusCode: 200,
				message: "If account exists, a reset email has been sent"
			};
		}

		const token = crypto.randomBytes(32).toString("hex");
		await AuthRepository.saveResetToken(token, user.id, RESET_TOKEN_TTL_SECONDS);

		const frontendUrl = process.env.FRONTEND_URL;
		const resetUrl = `${frontendUrl}/pages/auth/reset-password.html?token=${token}`;

		await sendResetPasswordEmail({
			to: recipientEmail,
			username: user.username,
			resetUrl
		});

		return {
			ok: true,
			statusCode: 200,
			message: "If account exists, a reset email has been sent"
		};
	}

	static async confirmResetPassword(payload) {
		const token = payload.token.trim();
		const userId = await AuthRepository.getUserIdByResetToken(token);

		if (!userId) {
			return {
				ok: false,
				statusCode: 400,
				message: "Invalid or expired reset token"
			};
		}

		const user = await AuthRepository.getUserCredentialsById(userId);
		if (!user) {
			await AuthRepository.deleteResetToken(token);
			return {
				ok: false,
				statusCode: 404,
				message: "User not found"
			};
		}

		const hashPassword = await bcrypt.hash(payload.new_password, 10);
		const updated = await AuthRepository.updatePasswordById(userId, hashPassword);

		if (!updated) {
			return {
				ok: false,
				statusCode: 500,
				message: "Failed to reset password"
			};
		}

		await AuthRepository.deleteResetToken(token);

		return {
			ok: true,
			statusCode: 200,
			message: "Password reset successfully"
		};
	}

	static async updateProfile(userId, payload) {
		if (payload.username) {
			const existed = await AuthRepository.getUserCredentialsByUsername(payload.username);
			if (existed && existed.id !== userId) {
				return {
					ok: false,
					statusCode: 409,
					message: "Username already exists"
				};
			}

			await AuthRepository.updateUsernameById(userId, payload.username.trim());
		}

		const profileUpdateData = {};

		if (payload.full_name) profileUpdateData["full_name"] = payload.full_name;
		if (payload.avatar_url) profileUpdateData["avatar_url"] = payload.avatar_url;
		if (payload.email) profileUpdateData["contact.email"] = payload.email;
		if (payload.phone) profileUpdateData["contact.phone"] = payload.phone;
		if (payload.address) profileUpdateData["contact.address"] = payload.address;
		if (payload.passport_number) profileUpdateData["passport.number"] = payload.passport_number;
		if (payload.passport_expiry_date) profileUpdateData["passport.expiry_date"] = payload.passport_expiry_date;
		if (payload.passport_nationality) profileUpdateData["passport.nationality"] = payload.passport_nationality;
		if (payload.meal) profileUpdateData["preferences.meal"] = payload.meal;
		if (payload.seat_position) profileUpdateData["preferences.seat_position"] = payload.seat_position;

		if (Object.keys(profileUpdateData).length > 0) {
			await AuthRepository.updateProfileByUserId(userId, profileUpdateData);
		}

		const user = await AuthRepository.getUserCredentialsById(userId);
		const profile = await AuthRepository.getProfileByUserId(userId);

		return {
			ok: true,
			statusCode: 200,
			message: "Profile updated successfully",
			data: {
				id: user.id,
				username: user.username,
				role: user.role,
				profile: profile || null
			}
		};
	}
}

export default AuthService;
