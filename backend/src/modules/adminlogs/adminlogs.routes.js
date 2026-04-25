import { Router } from 'express';
import AdminLogsController from './adminlogs.controller.js';

const router = Router();

router.get('/', AdminLogsController.getLogs);

export default router;