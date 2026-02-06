import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Prisma, Role } from '@prisma/client';
import { IApiResponse } from '../interfaces/response.interface';
import { z } from 'zod';
import { CitySchema, SpecialtySchema } from '../constants/healthcare.constants';
import prisma from '../config/prisma';

// Query validation schema
export const doctorQuerySchema = z.object({
    specialty: z.preprocess((val) => (val === '' ? undefined : val), SpecialtySchema.optional()),
    city: z.preprocess((val) => (val === '' ? undefined : val), CitySchema.optional()),
    minExperience: z.preprocess((val) => (val === '' ? undefined : val), z.coerce.number().optional()),
    maxFee: z.preprocess((val) => (val === '' ? undefined : val), z.coerce.number().optional()),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(4),
    search: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()), // General search for name
});

export class DoctorController {
    /**
     * Get all doctors with filtering and pagination
     */
    static async getDoctors(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            console.log('Fetching doctors with query:', req.query);

            const {
                specialty,
                city,
                minExperience,
                maxFee,
                page,
                limit,
                search
            } = doctorQuerySchema.parse(req.query);

            // Safer pagination values
            const safePage = Math.max(1, page);
            const safeLimit = Math.max(1, Math.min(100, limit));
            const skip = (safePage - 1) * safeLimit;

            // Build where clause with proper type safety
            const where: Prisma.UserWhereInput = {
                role: Role.DOCTOR,
            };

            // Doctor profile filters with proper type safety
            const profileFilters: Prisma.DoctorProfileWhereInput = {};

            if (specialty) {
                profileFilters.specialty = specialty;
            }

            if (minExperience && !isNaN(minExperience)) {
                profileFilters.experience = { gte: minExperience };
            }

            if (maxFee && !isNaN(maxFee)) {
                profileFilters.consultationFee = { lte: maxFee };
            }

            // If we have filters for the profile, use them. 
            // Otherwise, just ensure the profile exists.
            if (Object.keys(profileFilters).length > 0) {
                where.doctorProfile = profileFilters;
            } else {
                where.doctorProfile = { isNot: null };
            }

            // User level filters
            if (city) {
                where.city = { contains: city, mode: 'insensitive' };
            }

            if (search) {
                where.OR = [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                ];
            }

            console.log('Final Prisma where clause:', JSON.stringify(where, null, 2));

            // Execute query with transaction-like count for pagination
            const [doctors, total] = await Promise.all([
                prisma.user.findMany({
                    where,
                    include: {
                        doctorProfile: {
                            include: {
                                ratingsReceived: {
                                    select: {
                                        rating: true
                                    }
                                }
                            }
                        },
                    },
                    skip,
                    take: safeLimit,
                    orderBy: {
                        firstName: 'asc',
                    },
                }),
                prisma.user.count({ where }),
            ]);

            // Remove passwords and calculate average rating
            const sanitizedDoctors = doctors.map(doc => {
                const { password, ...doctorWithoutPassword } = doc;
                const ratings = doctorWithoutPassword.doctorProfile?.ratingsReceived || [];
                const averageRating = ratings.length > 0
                    ? Number((ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length).toFixed(1))
                    : 0;

                return {
                    ...doctorWithoutPassword,
                    doctorProfile: {
                        ...doctorWithoutPassword.doctorProfile,
                        averageRating,
                        reviewCount: ratings.length
                    }
                };
            });

            res.status(200).json({
                success: true,
                message: 'Doctors fetched successfully',
                data: {
                    doctors: sanitizedDoctors,
                    pagination: {
                        total,
                        page: safePage,
                        limit: safeLimit,
                        totalPages: Math.ceil(total / safeLimit),
                    }
                },
                statusCode: 200,
            } as IApiResponse);
        } catch (error) {
            console.error('Error in getDoctors:', error);
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

    /**
     * Get a single doctor by ID
     */
    static async getDoctorById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = req.params.id as string;

            const doctor = await prisma.user.findFirst({
                where: {
                    id,
                    role: Role.DOCTOR,
                    doctorProfile: { isNot: null }
                },
                include: {
                    doctorProfile: {
                        include: {
                            ratingsReceived: {
                                select: {
                                    rating: true
                                }
                            }
                        }
                    },
                },
            });

            if (!doctor) {
                res.status(404).json({
                    success: false,
                    message: 'Doctor not found',
                    statusCode: 404,
                } as IApiResponse);
                return;
            }

            const { password, ...doctorWithoutPassword } = doctor;
            const ratings = doctorWithoutPassword.doctorProfile?.ratingsReceived || [];
            const averageRating = ratings.length > 0
                ? Number((ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length).toFixed(1))
                : 0;

            const sanitizedDoctor = {
                ...doctorWithoutPassword,
                doctorProfile: {
                    ...doctorWithoutPassword.doctorProfile,
                    averageRating,
                    reviewCount: ratings.length
                }
            };

            res.status(200).json({
                success: true,
                message: 'Doctor fetched successfully',
                data: sanitizedDoctor,
                statusCode: 200,
            } as IApiResponse);
        } catch (error) {
            next(error);
        }
    }
}
