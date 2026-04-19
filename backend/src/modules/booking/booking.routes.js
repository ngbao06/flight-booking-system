import { Router } from "express";
import BookingController from "./booking.controller.js";
import {
	validateBookingIdParam,
	validateCreateBooking,
	validateListBookingsQuery,
	validateUpdateBooking
} from "./booking.validator.js";

const router = Router();

/**
 * Existing endpoints (unchanged)
 */
router.get("/", validateListBookingsQuery, BookingController.getBookings);
router.get("/:id", validateBookingIdParam, BookingController.getBookingById);
router.post("/", validateCreateBooking, BookingController.createBooking);
router.patch("/:id", validateBookingIdParam, validateUpdateBooking, BookingController.updateBooking);

/**
 * Saga workflow endpoints
 */

// Step 2: Select seats
router.post("/:id/select-seats", validateBookingIdParam, BookingController.selectSeats);

// Step 3: Apply loyalty points
router.post("/:id/apply-loyalty", validateBookingIdParam, BookingController.applyLoyalty);

// Step 4: Notify payment completed
router.post("/:id/payment-completed", validateBookingIdParam, BookingController.notifyPaymentCompleted);

// Step 4b: Notify payment failed
router.post("/:id/payment-failed", validateBookingIdParam, BookingController.notifyPaymentFailed);

// Get saga status
router.get("/:id/saga-status", validateBookingIdParam, BookingController.getSagaStatus);

// Admin: Get all active sagas
router.get("/admin/active-sagas", BookingController.getActiveSagas);

export default router;
// booking.routes.js
