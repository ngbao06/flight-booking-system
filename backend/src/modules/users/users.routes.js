import { Router } from "express";
import UsersController from "./users.controller.js";
import {
	validateCreateUser,
	validateListPassengersFullInfoQuery,
	validateListUsersQuery,
	validateUpdateUser,
	validateUserIdParam
} from "./users.validator.js";

const router = Router();

router.get("/", validateListUsersQuery, UsersController.getUsers);
router.get("/passengers/full-info", validateListPassengersFullInfoQuery, UsersController.getPassengersFullInfo);
router.get("/passengers/:id/profile", validateUserIdParam, UsersController.getPassengerProfile);
router.get("/:id", validateUserIdParam, UsersController.getUserById);
router.post("/", validateCreateUser, UsersController.createUser);
router.patch("/:id", validateUserIdParam, validateUpdateUser, UsersController.updateUser);
router.delete("/:id", validateUserIdParam, UsersController.deleteUser);

export default router;
// users.routes.js
