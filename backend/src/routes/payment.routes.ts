import express, { Router } from 'express';
import { Role } from '@prisma/client';
import { PaymentController } from '../controllers/payment.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { ROUTES } from '../constants/routes';

const router = Router();

/**
 * @route   POST /api/payments/webhook
 * @desc    Stripe Webhook handler
 * @access  Public (Stripe calls this)
 * 
 * IMPORTANT: This route MUST use express.raw() to get the raw body for signature verification
 */
router.post(
    ROUTES.PAYMENTS.WEBHOOK,
    express.raw({ type: 'application/json' }),
    PaymentController.handleWebhook
);

// All following routes are protected
router.use(protect);

/**
 * @route   POST /api/payments/create-checkout-session
 * @desc    Create a Stripe Checkout Session
 * @access  Private (Patient only)
 */
router.post(
    ROUTES.PAYMENTS.CREATE_SESSION,
    express.json(),
    restrictTo(Role.PATIENT),
    PaymentController.createCheckoutSession
);

export default router;
