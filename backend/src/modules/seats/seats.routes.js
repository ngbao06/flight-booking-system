import { Router } from "express";
import SeatsController from "./seats.controller.js";
import {
	validateCreateSeats,
	validateListSeatsQuery,
	validateSeatIdParam,
	validateUpdateSeat
} from "./seats.validator.js";

const router = Router();

router.get("/", validateListSeatsQuery, SeatsController.getSeats);
router.post("/", validateCreateSeats, SeatsController.createSeats);
router.patch("/:id", validateSeatIdParam, validateUpdateSeat, SeatsController.updateSeat);

export default router;
// seats.routes.js
