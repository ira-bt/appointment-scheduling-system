import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { IApiResponse } from '../interfaces/response.interface';
import { AppointmentStatus, PaymentStatus } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

export class AnalyticsController {
    /**
     * Get analytics summary for the logged-in doctor
     */
    static getDoctorAnalytics = async (req: AuthRequest, res: Response) => {
        try {
            const doctorId = req.user?.id;
            if (!doctorId) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized',
                    statusCode: 401
                } as IApiResponse);
                return;
            }

            const { startDate, endDate } = req.query;

            // Default to last 15 days if not provided
            const end = endDate ? new Date(endDate as string) : new Date();
            const start = startDate ? new Date(startDate as string) : new Date(end.getTime() - 15 * 24 * 60 * 60 * 1000);

            // 1. Fetch appointments in range
            const appointments = await prisma.appointment.findMany({
                where: {
                    doctorId,
                    appointmentStart: {
                        gte: start,
                        lte: end
                    }
                }
            });

            // 2. Aggregate stats
            const totalAppointments = appointments.length;
            const completedAppointments = appointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;
            const cancelledAppointments = appointments.filter(a => a.status === AppointmentStatus.CANCELLED || a.status === AppointmentStatus.REJECTED).length;

            // Revenue: Only CONFIRMED or COMPLETED appointments
            const revenueAppointments = appointments.filter(a =>
                a.paymentStatus === PaymentStatus.COMPLETED &&
                (a.status === AppointmentStatus.CONFIRMED || a.status === AppointmentStatus.COMPLETED)
            );

            // Fetch doctor profile to get the fee
            const doctorProfile = await prisma.doctorProfile.findUnique({
                where: { userId: doctorId }
            });
            const fee = doctorProfile?.consultationFee || 0;
            const totalRevenue = revenueAppointments.length * fee;

            // 2.5 Average Rating
            const ratings = await prisma.rating.findMany({
                where: { doctorId }
            });
            const averageRating = ratings.length > 0
                ? Number((ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length).toFixed(1))
                : 0;

            // 3. Daily Metrics for the chart
            const dailyMetricsMap = new Map<string, { date: string, appointments: number, revenue: number }>();

            // Initialize the map with all dates in range
            let current = new Date(start);
            while (current <= end) {
                const dateKey = current.toISOString().split('T')[0];
                dailyMetricsMap.set(dateKey, { date: dateKey, appointments: 0, revenue: 0 });
                current.setDate(current.getDate() + 1);
            }

            // Fill with actual data
            appointments.forEach(app => {
                const dateKey = app.appointmentStart.toISOString().split('T')[0];
                if (dailyMetricsMap.has(dateKey)) {
                    const metric = dailyMetricsMap.get(dateKey)!;
                    metric.appointments += 1;
                    if (app.paymentStatus === PaymentStatus.COMPLETED && (app.status === AppointmentStatus.CONFIRMED || app.status === AppointmentStatus.COMPLETED)) {
                        metric.revenue += fee;
                    }
                }
            });

            // 5. Total Patients (unique overall)
            const uniquePatients = await prisma.appointment.groupBy({
                by: ['patientId'],
                where: { doctorId }
            });

            res.status(200).json({
                success: true,
                message: 'Analytics fetched successfully',
                data: {
                    summary: {
                        totalAppointments,
                        completedAppointments,
                        cancelledAppointments,
                        totalRevenue,
                        totalPatients: uniquePatients.length,
                        averageRating
                    },
                    dailyMetrics: Array.from(dailyMetricsMap.values())
                },
                statusCode: 200
            } as IApiResponse);

        } catch (error) {
            console.error('Error in getDoctorAnalytics:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                statusCode: 500
            } as IApiResponse);
        }
    };
}
