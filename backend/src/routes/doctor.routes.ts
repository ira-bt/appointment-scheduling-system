import { Router } from 'express';
import { DoctorController } from '../controllers/doctor.controller';
import { AvailabilityController } from '../controllers/availability.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { ROUTES } from '../constants/routes';
import { Role } from '@prisma/client';

const router = Router();

/**
 * @route   GET /api/doctors
 * @desc    Get all doctors with filtering and pagination
 * @access  Protected (Authenticated users)
 */
router.get(ROUTES.DOCTORS.LIST, protect, DoctorController.getDoctors);

/**
 * @route   POST /api/doctors/availability
 * @desc    Update doctor's weekly availability
 * @access  Private (Doctor only)
 */
router.get(ROUTES.DOCTORS.AVAILABILITY, protect, restrictTo(Role.DOCTOR), AvailabilityController.getOwnAvailability);
router.post(ROUTES.DOCTORS.AVAILABILITY, protect, restrictTo(Role.DOCTOR), AvailabilityController.updateAvailability);

/**
 * @route   GET /api/doctors/:id/slots
 * @desc    Get available slots for a doctor on a specific date
 * @access  Protected
 */
router.get(ROUTES.DOCTORS.SLOTS, protect, AvailabilityController.getAvailableSlots);

export default router;
