import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { IApiResponse } from '../interfaces/response.interface';
import { AppointmentStatus, Prisma } from '@prisma/client';
import { REGEX } from '../constants/regex.constants';

export const availabilitySchema = z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string().regex(REGEX.TIME), // HH:mm
    endTime: z.string().regex(REGEX.TIME),   // HH:mm
    isActive: z.boolean().default(true),
}));

export const slotsQuerySchema = z.object({
    date: z.string().regex(REGEX.DATE), // YYYY-MM-DD
});

export class AvailabilityController {
    /**
     * Upsert doctor availability (Set weekly schedule)
     */
    static async updateAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const doctorId = req.user.id; // User must be a DOCTOR (handled by middleware)
            const availabilityData = availabilitySchema.parse(req.body);

            // Use professional transaction to replace all availability for this doctor
            await prisma.$transaction(async (tx) => {
                // Delete existing availability
                await tx.availability.deleteMany({
                    where: { doctorId }
                });

                // Create new ones
                await tx.availability.createMany({
                    data: availabilityData.map(item => ({
                        ...item,
                        doctorId
                    }))
                });
            });

            res.status(200).json({
                success: true,
                message: 'Availability updated successfully',
                statusCode: 200,
            } as IApiResponse);
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid availability data',
                    errors: error.issues,
                    statusCode: 400,
                } as IApiResponse);
                return;
            }
            next(error);
        }
    }

    /**
     * Get logged-in doctor's current availability
     */
    static async getOwnAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const doctorId = req.user.id;
            const availability = await prisma.availability.findMany({
                where: { doctorId },
                orderBy: { dayOfWeek: 'asc' }
            });

            res.status(200).json({
                success: true,
                message: 'Availability fetched successfully',
                data: availability,
                statusCode: 200,
            } as IApiResponse);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get available slots for a doctor on a specific date
     */
    static async getAvailableSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const doctorId = req.params.id as string;
            const { date } = slotsQuerySchema.parse(req.query);

            const targetDate = new Date(date);
            const dayOfWeek = targetDate.getDay();

            // 1. Get doctor's availability for that day
            const availability = await prisma.availability.findFirst({
                where: {
                    doctorId,
                    dayOfWeek,
                    isActive: true
                }
            });

            if (!availability) {
                res.status(200).json({
                    success: true,
                    message: 'No availability found for this day',
                    data: { slots: [] },
                    statusCode: 200,
                } as IApiResponse);
                return;
            }

            // 2. Get existing appointments for that doctor on that date
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const existingAppointments = await prisma.appointment.findMany({
                where: {
                    doctorId,
                    appointmentStart: {
                        gte: startOfDay,
                        lte: endOfDay
                    },
                    status: {
                        in: [AppointmentStatus.PENDING, AppointmentStatus.APPROVED, AppointmentStatus.CONFIRMED]
                    }
                },
                select: {
                    appointmentStart: true,
                    durationMinutes: true
                }
            });

            // 3. Generate 30-min slots
            const slots: string[] = [];
            const [startHour, startMin] = availability.startTime.split(':').map(Number);
            const [endHour, endMin] = availability.endTime.split(':').map(Number);

            const current = new Date(targetDate);
            current.setHours(startHour, startMin, 0, 0);

            const end = new Date(targetDate);
            end.setHours(endHour, endMin, 0, 0);

            const now = new Date();

            while (current < end) {
                const slotEnd = new Date(current);
                slotEnd.setMinutes(current.getMinutes() + 30);

                if (slotEnd > end) break;

                // Check if slot is in the past (only if target date is today)
                if (current > now) {
                    // Check for overlap with existing appointments
                    const isOccupied = existingAppointments.some(app => {
                        const appStart = new Date(app.appointmentStart);
                        const appEnd = new Date(appStart);
                        appEnd.setMinutes(appStart.getMinutes() + app.durationMinutes);

                        // Overlap condition: (StartA < EndB) && (EndA > StartB)
                        return (current < appEnd) && (slotEnd > appStart);
                    });

                    if (!isOccupied) {
                        slots.push(current.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }));
                    }
                }

                current.setMinutes(current.getMinutes() + 30);
            }

            res.status(200).json({
                success: true,
                message: 'Available slots fetched successfully',
                data: { slots },
                statusCode: 200,
            } as IApiResponse);
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid query parameters',
                    errors: error.issues,
                    statusCode: 400,
                } as IApiResponse);
                return;
            }
            next(error);
        }
    }
}
