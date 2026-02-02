import { Router } from 'express';
import { DoctorController } from '../controllers/doctor.controller';
import { AvailabilityController } from '../controllers/availability.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { ROUTES } from '../constants/routes';
import { Role } from '@prisma/client';

const router = Router();

router.get(ROUTES.DOCTORS.LIST, protect, DoctorController.getDoctors);

/**
 * @route   GET /api/doctors/availability
 * @desc    Get doctor's weekly availability
 * @access  Private (Doctor only)
 */
router.get(ROUTES.DOCTORS.AVAILABILITY, protect, restrictTo(Role.DOCTOR), AvailabilityController.getOwnAvailability);

/**
 * @route   POST /api/doctors/availability
 * @desc    Update doctor's weekly availability
 * @access  Private (Doctor only)
 */
router.post(ROUTES.DOCTORS.AVAILABILITY, protect, restrictTo(Role.DOCTOR), AvailabilityController.updateAvailability);

/**
 * @route   GET /api/doctors/:id
 * @desc    Get single doctor details
 * @access  Protected
 */
router.get(ROUTES.DOCTORS.DETAILS, protect, DoctorController.getDoctorById);

/**
 * @route   GET /api/doctors/:id/slots
 * @desc    Get available slots for a doctor on a specific date
 * @access  Protected
 */
router.get(ROUTES.DOCTORS.SLOTS, protect, AvailabilityController.getAvailableSlots);

export default router;
