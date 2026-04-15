import UsersRepository from "./users.repository.js";

class UsersService {
	static async createUser(payload) {
		const username = payload.username?.trim();
		const existing = await UsersRepository.getUserByUsername(username);
		if (existing) {
			return {
				ok: false,
				statusCode: 409,
				message: "Username already exists"
			};
		}

		const created = await UsersRepository.createUser({
			...payload,
			username,
			role: payload.role || "PASSENGER"
		});
		if (!created) {
			return {
				ok: false,
				statusCode: 500,
				message: "Failed to create user"
			};
		}

		const user = await UsersRepository.getUserByUsername(username);
		return {
			ok: true,
			statusCode: 201,
			message: "User created successfully",
			data: user
		};
	}

	static async getUsers(filters = {}) {
		const { id, username, role } = filters;

		if (id !== undefined) {
			const user = await UsersRepository.getUserById(Number(id));
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

		if (username) {
			const user = await UsersRepository.getUserByUsername(username);
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

		if (role) {
			const users = await UsersRepository.getUserByRole(role);
			return {
				ok: true,
				statusCode: 200,
				message: "Users fetched successfully",
				data: users || []
			};
		}

		const users = await UsersRepository.getAllUser();
		return {
			ok: true,
			statusCode: 200,
			message: "Users fetched successfully",
			data: users || []
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

		if (payload.username && payload.username !== existed.username) {
			const duplicated = await UsersRepository.getUserByUsername(payload.username);
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

		const user = await UsersRepository.getUserById(id);
		return {
			ok: true,
			statusCode: 200,
			message: "User updated successfully",
			data: user
		};
	}

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

		return {
			ok: true,
			statusCode: 200,
			message: "User deleted successfully"
		};
	}
}

export default UsersService;
// users.service.js
