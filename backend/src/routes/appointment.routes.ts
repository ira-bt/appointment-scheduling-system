import { Router } from 'express';
import { Role } from '@prisma/client';
import { AppointmentController } from '../controllers/appointment.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { ROUTES } from '../constants/routes';
import { reportUpload } from '../middleware/upload.middleware';

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

router.post(
    ROUTES.APPOINTMENTS.CREATE,
    restrictTo(Role.PATIENT),
    AppointmentController.createAppointment
);

/**
 * @route   GET /api/appointments/check-conflict
 * @desc    Check if patient has an overlapping appointment
 * @access  Private (Patient only)
 */
router.get(
    ROUTES.APPOINTMENTS.CHECK_CONFLICT,
    restrictTo(Role.PATIENT),
    AppointmentController.checkPatientConflict
);

/**
 * @route   GET /api/appointments/doctor
 * @desc    Get appointments for the logged-in doctor
 * @access  Private (Doctor only)
 */
router.get(
    ROUTES.APPOINTMENTS.LIST_DOCTOR,
    restrictTo(Role.DOCTOR),
    AppointmentController.getDoctorAppointments
);

/**
 * @route   PATCH /api/appointments/:id/status
 * @desc    Update appointment status (Approve/Reject)
 * @access  Private (Doctor only)
 */
router.patch(
    ROUTES.APPOINTMENTS.UPDATE_STATUS,
    restrictTo(Role.DOCTOR),
    AppointmentController.updateAppointmentStatus
);

/**
 * @route   POST /api/appointments/:id/reports
 * @desc    Upload medical reports for an appointment
 * @access  Private (Patient only)
 */
router.post(
    ROUTES.APPOINTMENTS.UPLOAD_REPORTS,
    restrictTo(Role.PATIENT),
    reportUpload.array('reports', 5), // Max 5 files
    AppointmentController.uploadMedicalReports
);

export default router;
