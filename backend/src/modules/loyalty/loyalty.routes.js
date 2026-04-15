import { Router } from "express";
import LoyaltyController from "./loyalty.controller.js";
import { validateExchangePoints } from "./loyalty.validator.js";

const router = Router();

router.post("/exchange", validateExchangePoints, LoyaltyController.exchangePoints);

export default router;
// loyalty.routes.js
