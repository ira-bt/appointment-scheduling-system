import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { ROUTES } from '../constants/routes';

const router = Router();

// Get doctor analytics
router.get(
    ROUTES.ANALYTICS.DOCTOR,
    authMiddleware,
    AnalyticsController.getDoctorAnalytics
);

export default router;
