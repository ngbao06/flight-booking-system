import { Router } from "express";
import TicketsController from "./tickets.controller.js";
import {
	validateCreateTicket,
	validateListTicketsQuery,
	validateTicketIdParam,
	validateUpdateTicket
} from "./tickets.validator.js";

const router = Router();

router.get("/", validateListTicketsQuery, TicketsController.getTickets);
router.get("/:id", validateTicketIdParam, TicketsController.getTicketById);
router.post("/", validateCreateTicket, TicketsController.createTicket);
router.patch("/:id", validateTicketIdParam, validateUpdateTicket, TicketsController.updateTicket);

export default router;
// tickets.routes.js
