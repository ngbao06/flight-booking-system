import { Router } from "express";
import AuthController from "./auth.controller.js";
import {
	validateConfirmResetPassword,
	validateLogin,
	validateRegister,
	validateRequestResetPassword,
	validateUpdatePassword,
	validateUpdateProfile
} from "./auth.validator.js";
import { requireAuth } from "../../common/middlewares/auth.middleware.js";
import { authorizeRoles } from "../../common/middlewares/role.middleware.js";

const router = Router();

router.post("/register", validateRegister, AuthController.register);
router.post("/login", validateLogin, AuthController.login);
router.post("/logout", requireAuth, AuthController.logout);

router.get("/me", requireAuth, AuthController.me);
router.patch(
	"/password",
	requireAuth,
	authorizeRoles("ADMIN", "GATE_AGENT", "PASSENGER"),
	validateUpdatePassword,
	AuthController.updatePassword
);

router.post(
	"/password/reset-request",
	validateRequestResetPassword,
	AuthController.requestResetPassword
);
router.post(
	"/password/reset-confirm",
	validateConfirmResetPassword,
	AuthController.confirmResetPassword
);

router.patch(
	"/profile",
	requireAuth,
	authorizeRoles("ADMIN", "GATE_AGENT", "PASSENGER"),
	validateUpdateProfile,
	AuthController.updateProfile
);

export default router;
