import { Router } from 'express';
import { CronController } from '../controllers/cron.controller';
import { ROUTES } from '../constants/routes';

const router = Router();

// Endpoint for Vercel Cron Job
// Should be protected by a Bearer token (CRON_SECRET)
router.get(ROUTES.CRON.EXECUTE, CronController.handleCron);

export default router;
