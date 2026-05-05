import { Router } from "express";
import VouchersController from "./vouchers.controller.js";
import {
	validateCreateVoucher,
	validateListMyVouchersQuery,
	validateListVouchersQuery,
	validateRedeemVoucher,
	validateUseVoucher,
	validateVoucherIdParam
} from "./vouchers.validator.js";
import { requireAuth, optionalAuth } from "../../common/middlewares/auth.middleware.js";
import { authorizeRoles } from "../../common/middlewares/role.middleware.js";

const router = Router();

router.get("/mine", requireAuth, authorizeRoles("PASSENGER"), validateListMyVouchersQuery, VouchersController.getMyVouchers);
router.post("/redeem", requireAuth, authorizeRoles("PASSENGER"), validateRedeemVoucher, VouchersController.redeemVoucher);
router.post("/use", requireAuth, authorizeRoles("PASSENGER"), validateUseVoucher, VouchersController.useVoucher);
router.post("/restore", requireAuth, authorizeRoles("PASSENGER"), validateUseVoucher, VouchersController.restoreVoucher);
router.get("/", optionalAuth, validateListVouchersQuery, VouchersController.getVouchers);
router.get("/:id", validateVoucherIdParam, VouchersController.getVoucherById);
router.post("/", requireAuth, authorizeRoles("ADMIN"), validateCreateVoucher, VouchersController.createVoucher);
router.delete("/:id", requireAuth, authorizeRoles("ADMIN"), validateVoucherIdParam, VouchersController.deleteVoucher);

export default router;