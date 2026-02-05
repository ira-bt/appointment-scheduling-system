import Stripe from 'stripe';
import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import stripeService from '../services/stripe.service';
import emailService from '../utils/email.util';
import { AppointmentStatus, PaymentStatus } from '@prisma/client';
import { IApiResponse } from '../interfaces/response.interface';
import { FRONTEND_ROUTES } from '../constants/routes';

export class PaymentController {
    /**
     * Create a Stripe Checkout Session for an approved appointment
     */
    static async createCheckoutSession(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { appointmentId } = req.body;
            const patientId = req.user.id;

            // 1. Fetch appointment with doctor details
            const appointment = await prisma.appointment.findFirst({
                where: {
                    id: appointmentId,
                    patientId: patientId,
                },
                include: {
                    doctor: {
                        include: {
                            user: true
                        }
                    },
                    patient: {
                        include: {
                            user: true
                        }
                    }
                }
            });

            if (!appointment) {
                res.status(404).json({
                    success: false,
                    message: 'Appointment not found',
                    statusCode: 404,
                } as IApiResponse);
                return;
            }

            // 2. Validate status
            if (appointment.status !== AppointmentStatus.APPROVED) {
                res.status(400).json({
                    success: false,
                    message: 'Only approved appointments can be paid for',
                    statusCode: 400,
                } as IApiResponse);
                return;
            }

            if (appointment.paymentStatus === PaymentStatus.COMPLETED) {
                res.status(400).json({
                    success: false,
                    message: 'Appointment is already paid',
                    statusCode: 400,
                } as IApiResponse);
                return;
            }

            // 3. Validate Initiation Window (20 minutes from approval)
            if (appointment.paymentExpiryTime && appointment.paymentExpiryTime < new Date()) {
                res.status(400).json({
                    success: false,
                    message: 'The 20-minute payment initiation window has expired. This appointment is no longer payable.',
                    statusCode: 400,
                } as IApiResponse);
                return;
            }

            // 4. Create Stripe Session with its own window (30 minutes)
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const expiryTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes for completion

            const session = await stripeService.createCheckoutSession({
                appointmentId: appointment.id,
                patientEmail: appointment.patient.user.email,
                doctorName: `${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`,
                amount: appointment.doctor.consultationFee,
                successUrl: `${frontendUrl}${FRONTEND_ROUTES.PAYMENT_SUCCESS}?id=${appointment.id}`,
                cancelUrl: `${frontendUrl}${FRONTEND_ROUTES.PAYMENT_CANCEL}?id=${appointment.id}`,
                expiresAt: expiryTime,
            });

            // 4. Update appointment with session info
            await prisma.appointment.update({
                where: { id: appointment.id },
                data: {
                    stripePaymentIntentId: session.id, // We store session ID here for tracking
                    paymentStatus: PaymentStatus.PENDING,
                    paymentExpiryTime: expiryTime,
                }
            });

            res.status(200).json({
                success: true,
                message: 'Checkout session created successfully',
                data: {
                    sessionId: session.id,
                    url: session.url
                },
                statusCode: 200,
            } as IApiResponse);

        } catch (error: unknown) {
            next(error);
        }
    }

    /**
     * Handle Stripe Webhook events
     */
    static async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
        const sig = req.headers['stripe-signature'] as string;
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!sig || !endpointSecret) {
            res.status(400).send('Webhook Error: Missing signature or secret');
            return;
        }

        let event;

        try {
            // Note: req.body must be the RAW buffer for signature verification
            event = stripeService.verifyWebhook(req.body, sig, endpointSecret);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown webhook error';
            res.status(400).send(`Webhook Error: ${errorMessage}`);
            return;
        }

        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const appointmentId = session.metadata?.appointmentId;

                if (appointmentId) {
                    // Update appointment status and fetch details for email
                    const updatedAppointment = await prisma.appointment.update({
                        where: { id: appointmentId },
                        data: {
                            status: AppointmentStatus.CONFIRMED,
                            paymentStatus: PaymentStatus.COMPLETED,
                        },
                        include: {
                            doctor: {
                                include: {
                                    user: true
                                }
                            },
                            patient: {
                                include: {
                                    user: true
                                }
                            }
                        }
                    });

                    // Send confirmation emails
                    const doctor = updatedAppointment.doctor;
                    const patient = updatedAppointment.patient;
                    const appointmentDate = updatedAppointment.appointmentStart.toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                    });
                    const appointmentTime = updatedAppointment.appointmentStart.toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    });

                    // 1. Email to Patient
                    emailService.sendPaymentSuccessPatient(
                        patient.user.email,
                        patient.user.firstName,
                        `${doctor.user.firstName} ${doctor.user.lastName}`,
                        doctor.consultationFee,
                        appointmentDate,
                        appointmentTime
                    ).catch(err => console.error('Error sending patient payment email:', err));

                    // 2. Email to Doctor (Payment Confirmation + Scheduled Notification)
                    emailService.sendPaymentSuccessDoctor(
                        doctor.user.email,
                        `${doctor.user.firstName} ${doctor.user.lastName}`,
                        `${patient.user.firstName} ${patient.user.lastName}`,
                        doctor.consultationFee,
                        appointmentDate,
                        appointmentTime
                    ).catch(err => console.error('Error sending doctor payment email:', err));
                }
                break;
            }

            case 'checkout.session.expired': {
                const expiredSession = event.data.object as Stripe.Checkout.Session;
                const expiredAppId = expiredSession.metadata?.appointmentId;

                if (expiredAppId) {
                    await prisma.appointment.update({
                        where: { id: expiredAppId },
                        data: {
                            paymentStatus: PaymentStatus.FAILED,
                        }
                    });
                }
                break;
            }

            default:
                // Unhandled event type
                break;
        }

        // Return a 200 response to acknowledge receipt of the event
        res.json({ received: true });
    }
}
