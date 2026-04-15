import { Router } from "express";
import FlightsController from "./flights.controller.js";
import {
	validateCreateFlight,
	validateFlightIdParam,
	validateListFlightsQuery,
	validateUpdateFlight
} from "./flights.validator.js";

const router = Router();

router.get("/", validateListFlightsQuery, FlightsController.getFlights);
router.get("/:id", validateFlightIdParam, FlightsController.getFlightById);
router.post("/", validateCreateFlight, FlightsController.createFlight);
router.patch("/:id", validateFlightIdParam, validateUpdateFlight, FlightsController.updateFlight);
router.delete("/:id", validateFlightIdParam, FlightsController.deleteFlight);

export default router;
// flights.routes.js
