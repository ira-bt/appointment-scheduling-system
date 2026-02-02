import { Router } from 'express';
import { Role } from '@prisma/client';
import { AppointmentController } from '../controllers/appointment.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { ROUTES } from '../constants/routes';
import { upload } from '../middleware/upload.middleware';

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

/**
 * @route   POST /api/appointments
 * @desc    Create a new appointment
 * @access  Private (Patient only)
 */
router.post(
    '/',
    restrictTo(Role.PATIENT),
    AppointmentController.createAppointment
);

/**
 * @route   POST /api/appointments/:id/reports
 * @desc    Upload medical reports for an appointment
 * @access  Private (Patient only)
 */
router.post(
    '/:id/reports',
    restrictTo(Role.PATIENT),
    upload.array('reports', 5), // Max 5 files
    AppointmentController.uploadMedicalReports
);

export default router;
