import { Router } from "express";
import AirlinesController from "./airlines.controller.js";
import {
	validateAirlineIdParam,
	validateCreateAirline,
	validateListAirlinesQuery,
	validateUpdateAirline
} from "./airlines.validator.js";

const router = Router();

router.get("/", validateListAirlinesQuery, AirlinesController.getAirlines);
router.get("/:id", validateAirlineIdParam, AirlinesController.getAirlineById);
router.post("/", validateCreateAirline, AirlinesController.createAirline);
router.patch("/:id", validateAirlineIdParam, validateUpdateAirline, AirlinesController.updateAirline);
router.delete("/:id", validateAirlineIdParam, AirlinesController.deleteAirline);

export default router;
