import { Router } from "express";
import UsersController from "./users.controller.js";
import {
	validateCreateUser,
	validateListUsersQuery,
	validateUpdateUser,
	validateUserIdParam
} from "./users.validator.js";

const router = Router();

router.get("/", validateListUsersQuery, UsersController.getUsers);
router.get("/:id", validateUserIdParam, UsersController.getUserById);
router.post("/", validateCreateUser, UsersController.createUser);
router.patch("/:id", validateUserIdParam, validateUpdateUser, UsersController.updateUser);
router.delete("/:id", validateUserIdParam, UsersController.deleteUser);

export default router;
// users.routes.js
