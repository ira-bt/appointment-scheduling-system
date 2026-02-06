import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { IApiResponse } from '../interfaces/response.interface';
import { AppointmentStatus } from '@prisma/client';

const createRatingSchema = z.object({
    appointmentId: z.string(),
    rating: z.number().min(1).max(5),
    review: z.string().optional(),
});

export class RatingController {
    /**
     * Submit a rating for a completed appointment
     */
    static async createRating(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const patientId = req.user.id;
            const { appointmentId, rating, review } = createRatingSchema.parse(req.body);

            // 1. Verify appointment exists, belongs to patient, and is COMPLETED
            const appointment = await prisma.appointment.findUnique({
                where: { id: appointmentId },
            });

            if (!appointment || appointment.patientId !== patientId) {
                res.status(404).json({
                    success: false,
                    message: 'Appointment not found or unauthorized',
                    statusCode: 404,
                } as IApiResponse);
                return;
            }

            if (appointment.status !== AppointmentStatus.COMPLETED) {
                res.status(400).json({
                    success: false,
                    message: 'Can only rate completed appointments',
                    statusCode: 400,
                } as IApiResponse);
                return;
            }

            // 2. Check if rating already exists
            const existingRating = await prisma.rating.findUnique({
                where: { appointmentId },
            });

            if (existingRating) {
                res.status(400).json({
                    success: false,
                    message: 'You have already rated this appointment',
                    statusCode: 400,
                } as IApiResponse);
                return;
            }

            // 3. Create rating
            const newRating = await prisma.rating.create({
                data: {
                    appointmentId,
                    patientId,
                    doctorId: appointment.doctorId,
                    rating,
                    review,
                },
            });

            res.status(201).json({
                success: true,
                message: 'Rating submitted successfully',
                data: newRating,
                statusCode: 201,
            } as IApiResponse);
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid input data',
                    errors: error.issues,
                    statusCode: 400,
                } as IApiResponse);
                return;
            }
            next(error);
        }
    }

    /**
     * Get all ratings for a doctor
     */
    static async getDoctorRatings(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { doctorId } = req.params;

            const ratings = await prisma.rating.findMany({
                where: { doctorId: doctorId as string },
                include: {
                    patient: {
                        include: {
                            user: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                    profileImage: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            res.status(200).json({
                success: true,
                message: 'Ratings fetched successfully',
                data: ratings,
                statusCode: 200,
            } as IApiResponse);
        } catch (error) {
            next(error);
        }
    }
}
