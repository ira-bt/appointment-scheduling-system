import { Router } from 'express';
import { DoctorController } from '../controllers/doctor.controller';
import { protect } from '../middleware/auth.middleware';
import { ROUTES } from '../constants/routes';

const router = Router();

/**
 * @route   GET /api/doctors
 * @desc    Get all doctors with filtering and pagination
 * @access  Protected (Authenticated users)
 */
router.get(ROUTES.DOCTORS.LIST, protect, DoctorController.getDoctors);

export default router;
