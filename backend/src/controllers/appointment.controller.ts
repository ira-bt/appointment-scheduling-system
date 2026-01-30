import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { IApiResponse } from '../interfaces/response.interface';
import { AppointmentStatus, Prisma } from '@prisma/client';

// Validation schema for patient appointments query
export const patientAppointmentQuerySchema = z.object({
    type: z.enum(['upcoming', 'past']).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
});

export class AppointmentController {
    /**
     * Get appointments for the logged-in patient
     */
    static async getPatientAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const patientId = req.user.id;
            const { type, page, limit } = patientAppointmentQuerySchema.parse(req.query);

            const skip = (page - 1) * limit;
            const now = new Date();

            // Build where clause with proper type safety
            const where: Prisma.AppointmentWhereInput = {
                patientId: patientId,
            };

            if (type === 'upcoming') {
                where.appointmentStart = { gte: now };
                where.status = {
                    in: [AppointmentStatus.PENDING, AppointmentStatus.APPROVED, AppointmentStatus.CONFIRMED]
                };
            } else if (type === 'past') {
                where.OR = [
                    { appointmentStart: { lt: now } },
                    { status: { in: [AppointmentStatus.COMPLETED, AppointmentStatus.REJECTED] } }
                ];
            }

            // Execute query and count
            const [appointments, total] = await Promise.all([
                prisma.appointment.findMany({
                    where,
                    include: {
                        doctor: {
                            include: {
                                user: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                        profileImage: true,
                                    }
                                }
                            }
                        }
                    },
                    orderBy: {
                        appointmentStart: type === 'past' ? 'desc' : 'asc',
                    },
                    skip,
                    take: limit,
                }),
                prisma.appointment.count({ where }),
            ]);

            res.status(200).json({
                success: true,
                message: 'Patient appointments fetched successfully',
                data: {
                    appointments,
                    pagination: {
                        total,
                        page,
                        limit,
                        totalPages: Math.ceil(total / limit),
                    }
                },
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
