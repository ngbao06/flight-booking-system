import { Router } from "express";
import AirportsController from "./airport.controller.js";
import {
	validateAirportIdParam,
	validateCreateAirport,
	validateListAirportsQuery,
	validateUpdateAirport
} from "./airports.validator.js";

const router = Router();

router.get("/", validateListAirportsQuery, AirportsController.getAirports);
router.get("/:id", validateAirportIdParam, AirportsController.getAirportById);
router.post("/", validateCreateAirport, AirportsController.createAirport);
router.patch("/:id/lock", validateAirportIdParam, AirportsController.lockAirport);
router.patch("/:id/unlock", validateAirportIdParam, AirportsController.unlockAirport);
router.patch("/:id", validateAirportIdParam, validateUpdateAirport, AirportsController.updateAirport);
router.delete("/:id", validateAirportIdParam, AirportsController.deleteAirport);

export default router;