import dotenv from 'dotenv';
// Load environment variables immediately
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { UserController } from './controllers/user.controller';
import { IApiResponse } from './interfaces/response.interface';
import { validateRegisterBody, validateLoginBody } from './utils/validation.util';
import { API, ROUTES } from './constants/routes';
import authRoutes from './routes/auth.routes'
import userRoutes from './routes/user.routes';
import doctorRoutes from './routes/doctor.routes';
import appointmentRoutes from './routes/appointment.routes';
import paymentRoutes from './routes/payment.routes';
import analyticsRoutes from './routes/analytics.routes';
import ratingRoutes from './routes/rating.routes';
import { formatToISTDate, formatToISTTime } from './utils/date.util';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
})); // Enable CORS
app.use(morgan('combined')); // Logging

// Payment routes (Special: Webhook needs RAW body, must be before express.json)
app.use(`${API}${ROUTES.PAYMENTS.BASE}`, paymentRoutes);

app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Appointment Scheduling System API is running!',
    statusCode: 200,
  } as IApiResponse);
});

// User routes
// app.post(ROUTES.AUTH.REGISTER, validateRegisterBody, UserController.register);
// app.post(ROUTES.AUTH.LOGIN, validateLoginBody, UserController.login);
app.use(`${API}${ROUTES.AUTH.BASE}`, authRoutes);
app.use(`${API}${ROUTES.USERS.BASE}`, userRoutes);
app.use(`${API}${ROUTES.DOCTORS.BASE}`, doctorRoutes);
app.use(`${API}${ROUTES.APPOINTMENTS.BASE}`, appointmentRoutes);
app.use(`${API}${ROUTES.ANALYTICS.BASE}`, analyticsRoutes);
app.use(`${API}${ROUTES.RATINGS.BASE}`, ratingRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message,
    statusCode: 500,
  } as IApiResponse);
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    statusCode: 404,
  } as IApiResponse);
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);

  // Background Cleanup: Cancel appointments that missed the 20-min initiation window
  // Runs every 5 minutes
  setInterval(async () => {
    try {
      const prisma = require('./config/prisma').default;
      const emailService = require('./utils/email.util').default;
      const { AppointmentStatus, PaymentStatus } = require('@prisma/client');

      console.log('[Cleanup] Checking for expired payment initiation windows...');

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
        console.log(`[Cleanup] Found ${expiredAppointments.length} expired appointments. Cancelling...`);

        for (const app of expiredAppointments) {
          await prisma.appointment.update({
            where: { id: app.id },
            data: {
              status: AppointmentStatus.CANCELLED,
              paymentStatus: PaymentStatus.FAILED
            },
          });

          // Send expiry email
          const dateStr = formatToISTDate(new Date(app.appointmentStart));
          await emailService.sendPaymentWindowExpired(
            app.patient.user.email,
            app.patient.user.firstName,
            `${app.doctor.user.firstName} ${app.doctor.user.lastName}`,
            dateStr
          ).catch((err: unknown) => console.error(`[Cleanup] Email failed for ${app.id}:`, err));
        }

        console.log(`[Cleanup] Successfully cancelled ${expiredAppointments.length} appointments.`);
      }

      // Background Cleanup: Reject PENDING appointments that weren't approved within 24 hours
      console.log('[Cleanup] Checking for stale PENDING requests...');
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
        console.log(`[Cleanup] Found ${stalePending.length} stale PENDING requests. Rejecting...`);
        for (const app of stalePending) {
          await prisma.appointment.update({
            where: { id: app.id },
            data: { status: AppointmentStatus.REJECTED },
          });

          // Send auto-rejection email
          const dateStr = formatToISTDate(new Date(app.appointmentStart));
          await emailService.sendAppointmentRejection(
            app.patient.user.email,
            app.patient.user.firstName,
            dateStr
          ).catch((err: unknown) => console.error(`[Cleanup] Rejection email failed for ${app.id}:`, err));
        }
      }

      // Background Task: Send reminders 1 hour before appointment
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
          // Format time based on UTC to be consistent with slot generation
          // But actually, we should probably format this to the user's timezone if we had it.
          // For now, let's keep it consistent with the booking flow (Local IST for display)
          // Since we don't have user timezone here, we use a generic format or UTC.
          // Better: Use a relative time or just the time part.
          const appStart = new Date(app.appointmentStart);
          const timeStr = formatToISTTime(appStart);

          await emailService.sendAppointmentReminder(
            app.patient.user.email,
            app.patient.user.firstName,
            `Dr. ${app.doctor.user.firstName} ${app.doctor.user.lastName}`,
            timeStr
          ).catch((err: unknown) => console.error(`[Reminders] Reminder email failed for ${app.id}:`, err));
        }
      }

      // Background Task: Auto-complete appointments that have ended
      const completedThreshold = new Date();
      const pastConfirmed = await prisma.appointment.findMany({
        where: {
          status: AppointmentStatus.CONFIRMED,
          appointmentStart: { lt: completedThreshold },
        },
      });

      if (pastConfirmed.length > 0) {
        let completedCount = 0;
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
        if (completedCount > 0) {
          console.log(`[Cleanup] Successfully auto-completed ${completedCount} appointments.`);
        }
      }

      // Background Task: Clean up old/revoked refresh tokens
      console.log('[Cleanup] Checking for expired/revoked refresh tokens...');
      try {
        const deletedTokens = await prisma.refreshToken.deleteMany({
          where: {
            OR: [
              { expiresAt: { lt: new Date() } }, // Expired
              { isRevoked: true, createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Revoked more than 24h ago
            ]
          }
        });
        if (deletedTokens.count > 0) {
          console.log(`[Cleanup] Deleted ${deletedTokens.count} old refresh tokens.`);
        }
      } catch (err) {
        console.error('[Cleanup] Refresh token cleanup failed:', err);
      }

    } catch (error) {
      console.error('[Cleanup] Error in background task:', error);
    }
  }, 5 * 60 * 1000); // 5 minutes
});

export default app;