import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import emailService from '../utils/email.util';
import { AppointmentStatus, PaymentStatus } from '@prisma/client';
import { formatToISTDate, formatToISTTime } from '../utils/date.util';
import { IApiResponse } from '../interfaces/response.interface';

export class CronController {
    /**
     * Main handler for Vercel Cron Jobs
     * Triggers all background tasks in order
     */
    static async handleCron(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // 1. Verify Request (Basic security via Cron Secret)
            const authHeader = req.headers.authorization;
            if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            console.log('[Cron] Starting background tasks...');
            const results: any = {};

            // Task A: Cleanup expired payment windows
            results.paymentCleanup = await CronController.cleanupExpiredPayments();

            // Task B: Cleanup stale PENDING requests
            results.stalePendingCleanup = await CronController.cleanupStalePending();

            // Task C: Send appointment reminders (1 hour before)
            results.reminders = await CronController.sendReminders();

            // Task D: Auto-complete finished appointments
            results.autoComplete = await CronController.autoCompleteAppointments();

            // Task E: Cleanup old refresh tokens
            results.tokenCleanup = await CronController.cleanupTokens();

            res.status(200).json({
                success: true,
                message: 'Cron tasks executed successfully',
                data: results,
                statusCode: 200
            } as IApiResponse);

        } catch (error) {
            console.error('[Cron] Error executing background tasks:', error);
            next(error);
        }
    }

    private static async cleanupExpiredPayments() {
        console.log('[Cron] Checking for expired payment initiation windows...');
        const expiredAppointments = await prisma.appointment.findMany({
            where: {
                status: AppointmentStatus.APPROVED,
                paymentStatus: { in: [PaymentStatus.NOT_INITIATED, PaymentStatus.PENDING, PaymentStatus.FAILED] },
                paymentExpiryTime: { lt: new Date() },
            },
            include: {
                patient: { include: { user: true } },
                doctor: { include: { user: true } },
            }
        });

        if (expiredAppointments.length > 0) {
            for (const app of expiredAppointments) {
                await prisma.appointment.update({
                    where: { id: app.id },
                    data: {
                        status: AppointmentStatus.CANCELLED,
                        paymentStatus: PaymentStatus.FAILED
                    },
                });

                const dateStr = formatToISTDate(new Date(app.appointmentStart));
                await emailService.sendPaymentWindowExpired(
                    app.patient.user.email,
                    app.patient.user.firstName,
                    `${app.doctor.user.firstName} ${app.doctor.user.lastName}`,
                    dateStr
                ).catch(err => console.error(`[Cron] Expiry email failed for ${app.id}:`, err));
            }
        }
        return expiredAppointments.length;
    }

    private static async cleanupStalePending() {
        console.log('[Cron] Checking for stale PENDING requests...');
        const stalePending = await prisma.appointment.findMany({
            where: {
                status: AppointmentStatus.PENDING,
                createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
            include: {
                patient: { include: { user: true } },
                doctor: { include: { user: true } },
            }
        });

        if (stalePending.length > 0) {
            for (const app of stalePending) {
                await prisma.appointment.update({
                    where: { id: app.id },
                    data: { status: AppointmentStatus.REJECTED },
                });

                const dateStr = formatToISTDate(new Date(app.appointmentStart));
                await emailService.sendAppointmentRejection(
                    app.patient.user.email,
                    app.patient.user.firstName,
                    dateStr
                ).catch(err => console.error(`[Cron] Rejection email failed for ${app.id}:`, err));
            }
        }
        return stalePending.length;
    }

    private static async sendReminders() {
        const now = new Date();
        const oneHourFromNowStart = new Date(now.getTime() + 55 * 60 * 1000);
        const oneHourFromNowEnd = new Date(now.getTime() + 60 * 60 * 1000);

        const upcomingAppointments = await prisma.appointment.findMany({
            where: {
                status: AppointmentStatus.CONFIRMED,
                appointmentStart: {
                    gte: oneHourFromNowStart,
                    lt: oneHourFromNowEnd,
                },
            },
            include: {
                patient: { include: { user: true } },
                doctor: { include: { user: true } },
            },
        });

        if (upcomingAppointments.length > 0) {
            for (const app of upcomingAppointments) {
                const appStart = new Date(app.appointmentStart);
                const timeStr = formatToISTTime(appStart);

                await emailService.sendAppointmentReminder(
                    app.patient.user.email,
                    app.patient.user.firstName,
                    `Dr. ${app.doctor.user.firstName} ${app.doctor.user.lastName}`,
                    timeStr
                ).catch(err => console.error(`[Cron] Reminder email failed for ${app.id}:`, err));
            }
        }
        return upcomingAppointments.length;
    }

    private static async autoCompleteAppointments() {
        const completedThreshold = new Date();
        const pastConfirmed = await prisma.appointment.findMany({
            where: {
                status: AppointmentStatus.CONFIRMED,
                appointmentStart: { lt: completedThreshold },
            },
        });

        let completedCount = 0;
        if (pastConfirmed.length > 0) {
            for (const app of pastConfirmed) {
                const endTime = new Date(new Date(app.appointmentStart).getTime() + app.durationMinutes * 60000);
                if (new Date() > endTime) {
                    await prisma.appointment.update({
                        where: { id: app.id },
                        data: { status: AppointmentStatus.COMPLETED },
                    });
                    completedCount++;
                }
            }
        }
        return completedCount;
    }

    private static async cleanupTokens() {
        const deletedTokens = await prisma.refreshToken.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: new Date() } },
                    { isRevoked: true, createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
                ]
            }
        });
        return deletedTokens.count;
    }
}
