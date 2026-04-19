import { Router } from "express";
import BookingController from "./booking.controller.js";
import {
	validateBookingIdParam,
	validateCreateBooking,
	validateListBookingsQuery,
	validateUpdateBooking
} from "./booking.validator.js";

const router = Router();

router.get("/", validateListBookingsQuery, BookingController.getBookings);
router.get("/:id", validateBookingIdParam, BookingController.getBookingById);
router.post("/", validateCreateBooking, BookingController.createBooking);
router.patch("/:id", validateBookingIdParam, validateUpdateBooking, BookingController.updateBooking);

export default router;
// booking.routes.js
