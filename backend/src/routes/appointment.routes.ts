import { Router } from 'express';
import { AppointmentController } from '../controllers/appointment.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { ROUTES } from '../constants/routes';
import { Role } from '@prisma/client';

const router = Router();

// All appointment routes are protected
router.use(protect);

/**
 * @route   GET /api/appointments/patient
 * @desc    Get appointments for the logged-in patient
 * @access  Private (Patient only)
 */
router.get(
    ROUTES.APPOINTMENTS.LIST_PATIENT,
    restrictTo(Role.PATIENT),
    AppointmentController.getPatientAppointments
);

export default router;
