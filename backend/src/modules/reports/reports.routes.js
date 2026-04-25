import { Router } from "express";
import ReportsController from "./reports.controller.js";
import { validateDashboardReportQuery } from "./reports.validator.js";

const router = Router();

router.get("/dashboard", validateDashboardReportQuery, ReportsController.getDashboardReport);

export default router;
