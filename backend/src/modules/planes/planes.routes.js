import { Router } from "express";
import PlaneController from "./planes.controller.js";
import {
	validateCreatePlane,
	validateListPlanesQuery,
	validatePlaneIdParam,
	validateUpdatePlane
} from "./planes.validator.js";

const router = Router();

router.get("/", validateListPlanesQuery, PlaneController.getPlanes);
router.get("/:id", validatePlaneIdParam, PlaneController.getPlaneById);
router.post("/", validateCreatePlane, PlaneController.createPlane);
router.patch("/:id", validatePlaneIdParam, validateUpdatePlane, PlaneController.updatePlane);
router.delete("/:id", validatePlaneIdParam, PlaneController.deletePlane);

export default router;
