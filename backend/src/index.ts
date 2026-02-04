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

app.listen(PORT, () => {
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
          paymentStatus: PaymentStatus.NOT_INITIATED,
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
          const dateStr = new Date(app.appointmentStart).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
          await emailService.sendPaymentWindowExpired(
            app.patient.user.email,
            app.patient.user.firstName,
            `${app.doctor.user.firstName} ${app.doctor.user.lastName}`,
            dateStr
          ).catch((err: unknown) => console.error(`[Cleanup] Email failed for ${app.id}:`, err));
        }

        console.log(`[Cleanup] Successfully cancelled ${expiredAppointments.length} appointments.`);
      }
    } catch (error) {
      console.error('[Cleanup] Error in background task:', error);
    }
  }, 5 * 60 * 1000); // 5 minutes
});

export default app;