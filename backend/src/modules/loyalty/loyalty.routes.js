import { Router } from "express";
import LoyaltyController from "./loyalty.controller.js";
import { validateExchangePoints } from "./loyalty.validator.js";
import { requireAuth } from "../../common/middlewares/auth.middleware.js";

const router = Router();

router.get('/me', requireAuth, LoyaltyController.me);
router.post("/exchange", validateExchangePoints, LoyaltyController.exchangePoints);

export default router;
// loyalty.routes.js
