import { Router } from "express";
import PaymentsController from "./payments.controller.js";
import {
	validateCreatePayment,
	validateListPaymentsQuery,
	validatePaymentIdParam,
	validateUpdatePayment, 
	validatePayment
} from "./payments.validator.js";

const router = Router();

router.get("/", validateListPaymentsQuery, PaymentsController.getPayments);
router.get("/:id", validatePaymentIdParam, PaymentsController.getPaymentById);
router.post("/", validateCreatePayment, PaymentsController.createPayment);
router.post('/generateQRCode', validatePayment, PaymentsController.createOfflineQR)
router.patch("/:id", validatePaymentIdParam, validateUpdatePayment, PaymentsController.updatePayment);

export default router;
// payments.routes.js
