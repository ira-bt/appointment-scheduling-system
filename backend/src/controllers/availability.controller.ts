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
    timezoneOffset: z.string().optional().transform(v => v ? parseInt(v, 10) : 0), // minutes (e.g. -330 for +05:30)
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
            const { date, timezoneOffset } = slotsQuerySchema.parse(req.query);

            const targetDate = new Date(`${date}T00:00:00Z`);
            const dayOfWeek = targetDate.getUTCDay();

            // 1. Get all doctor's active availability for that day
            const availabilities = await prisma.availability.findMany({
                where: {
                    doctorId,
                    dayOfWeek,
                    isActive: true
                }
            });

            if (!availabilities || availabilities.length === 0) {
                res.status(200).json({
                    success: true,
                    message: 'No availability found for this day',
                    data: { slots: [] },
                    statusCode: 200,
                } as IApiResponse);
                return;
            }

            // 2. Get existing appointments for that doctor on that date (using local boundaries)
            const startOfDay = new Date(`${date}T00:00:00.000Z`);
            startOfDay.setTime(startOfDay.getTime() + (timezoneOffset || 0) * 60 * 1000);
            const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

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

            // 3. Generate all possible 30-min slots across all availability periods
            const now = new Date();
            const minLeadTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

            // Use a Map to deduplicate slots by time string
            const slotsMap = new Map<string, any>();

            for (const availability of availabilities) {
                const [startHour, startMin] = availability.startTime.split(':').map(Number);
                const [endHour, endMin] = availability.endTime.split(':').map(Number);

                // Create dates based on the target date. 
                // We treat the availability time as "Wall Clock" time at the target date.
                // To get the absolute UTC moment, we apply the user's timezone offset.
                const startWallClock = new Date(`${date}T${availability.startTime}:00Z`);
                const current = new Date(startWallClock.getTime() + (timezoneOffset || 0) * 60 * 1000);

                const endWallClock = new Date(`${date}T${availability.endTime}:00Z`);
                const end = new Date(endWallClock.getTime() + (timezoneOffset || 0) * 60 * 1000);

                let wallClock = new Date(startWallClock.getTime());
                while (wallClock < endWallClock) {
                    const current = new Date(wallClock.getTime() + (timezoneOffset || 0) * 60 * 1000);
                    const slotEnd = new Date(current.getTime() + 30 * 60 * 1000);

                    const timeStr = wallClock.getUTCHours().toString().padStart(2, '0') + ':' +
                        wallClock.getUTCMinutes().toString().padStart(2, '0');
                    const isoValue = current.toISOString();

                    // Determine availability status
                    let isAvailable = true;
                    let reason: 'past' | 'booked' | 'lead_time' | null = null;

                    // 1. Check if in the past
                    if (current < now) {
                        isAvailable = false;
                        reason = 'past';
                    }
                    // 2. Check 24h lead time
                    else if (current < minLeadTime) {
                        isAvailable = false;
                        reason = 'lead_time';
                    }
                    // 3. Check if occupied
                    else {
                        const isOccupied = existingAppointments.some(app => {
                            const appStart = new Date(app.appointmentStart);
                            const appEnd = new Date(appStart.getTime() + app.durationMinutes * 60000);
                            return (current < appEnd) && (slotEnd > appStart);
                        });

                        if (isOccupied) {
                            isAvailable = false;
                            reason = 'booked';
                        }
                    }

                    // Only add if not already in map or if this one is available
                    if (!slotsMap.has(timeStr) || (isAvailable && !slotsMap.get(timeStr).isAvailable)) {
                        slotsMap.set(timeStr, {
                            time: timeStr,
                            value: isoValue,
                            isAvailable,
                            reason
                        });
                    }

                    wallClock.setUTCMilliseconds(wallClock.getUTCMilliseconds() + 30 * 60 * 1000);
                }
            }

            // Convert map to array and sort by time
            const finalSlots = Array.from(slotsMap.values()).sort((a, b) => a.time.localeCompare(b.time));

            res.status(200).json({
                success: true,
                message: 'Slots fetched successfully',
                data: { slots: finalSlots },
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
