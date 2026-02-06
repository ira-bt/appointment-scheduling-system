import { Router } from 'express';
import { RatingController } from '../controllers/rating.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

import { ROUTES } from '../constants/routes';

const router = Router();

// Patient only: Submit a rating
router.post(
    ROUTES.RATINGS.CREATE,
    protect,
    restrictTo(Role.PATIENT),
    RatingController.createRating
);

// Public: Get doctor ratings
router.get(
    ROUTES.RATINGS.DOCTOR,
    RatingController.getDoctorRatings
);

export default router;
