import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { IApiResponse } from '../interfaces/response.interface';
import { AppointmentStatus, Prisma } from '@prisma/client';

// Types for appointment includes
type AppointmentWithDoctor = Prisma.AppointmentGetPayload<{
    include: {
        doctor: {
            include: {
                user: true
            }
        },
        medicalReports: true
    }
}>;

type AppointmentWithDoctorMinimal = Prisma.AppointmentGetPayload<{
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
        },
        medicalReports: true
    }
}>;

// Validation schema for patient appointments query
export const patientAppointmentQuerySchema = z.object({
    type: z.enum(['upcoming', 'past']).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
});

// Validation schema for creating an appointment
export const createAppointmentSchema = z.object({
    doctorId: z.string().uuid().or(z.string()), // UUID or CUID
    appointmentStart: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
    }),
});

export class AppointmentController {
    /**
     * Create a new appointment (Patient only)
     */
    static async createAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const patientId = req.user.id;
            const { doctorId, appointmentStart } = createAppointmentSchema.parse(req.body);

            const requestedStart = new Date(appointmentStart);
            const requestedEnd = new Date(requestedStart);
            requestedEnd.setMinutes(requestedStart.getMinutes() + 30); // Default 30 min slots

            const now = new Date();
            if (requestedStart <= now) {
                res.status(400).json({
                    success: false,
                    message: 'Cannot book appointments in the past',
                    statusCode: 400,
                } as IApiResponse);
                return;
            }

            // Execute in transaction to prevent race conditions
            const result = await prisma.$transaction(async (tx) => {
                // 1. Check if doctor exists and get their user info
                const doctorProfile = await tx.doctorProfile.findFirst({
                    where: { userId: doctorId },
                    include: { user: true }
                });

                if (!doctorProfile) {
                    throw new Error('Doctor not found or profile incomplete');
                }

                // 2. Check if doctor has availability for this day/time
                const dayOfWeek = requestedStart.getDay();
                const timeString = requestedStart.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

                const availability = await tx.availability.findFirst({
                    where: {
                        doctorId,
                        dayOfWeek,
                        isActive: true,
                        startTime: { lte: timeString },
                        endTime: { gte: timeString }
                    }
                });

                if (!availability) {
                    throw new Error('Doctor is not available at this time');
                }

                // 3. Robust overlap check
                const startOfDay = new Date(requestedStart);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(requestedStart);
                endOfDay.setHours(23, 59, 59, 999);

                const todaysAppointments = await tx.appointment.findMany({
                    where: {
                        doctorId,
                        appointmentStart: { gte: startOfDay, lte: endOfDay },
                        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.APPROVED, AppointmentStatus.CONFIRMED] }
                    }
                });

                const isOverlapping = todaysAppointments.some(app => {
                    const appStart = new Date(app.appointmentStart);
                    const appEnd = new Date(appStart);
                    appEnd.setMinutes(appStart.getMinutes() + app.durationMinutes);
                    return (requestedStart < appEnd) && (requestedEnd > appStart);
                });

                if (isOverlapping) {
                    throw new Error('This time slot is already booked');
                }

                // 4. Create the appointment
                const appointment = await tx.appointment.create({
                    data: {
                        patientId,
                        doctorId,
                        appointmentStart: requestedStart,
                        durationMinutes: 30,
                        status: AppointmentStatus.PENDING,
                    },
                    include: {
                        doctor: {
                            include: {
                                user: true
                            }
                        },
                        medicalReports: true
                    }
                });

                return appointment;
            });

            // 5. Send Email Notification (Non-blocking)
            const emailService = require('../utils/email.util').default;
            const timeStr = requestedStart.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            const dateStr = requestedStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

            const appointmentWithDoctor = result as AppointmentWithDoctor;
            emailService.sendBookingConfirmation(
                appointmentWithDoctor.doctor.user.email,
                appointmentWithDoctor.doctor.user.lastName,
                req.user.firstName + ' ' + req.user.lastName,
                dateStr,
                timeStr
            ).catch((err: unknown) => {
                const message = err instanceof Error ? err.message : String(err);
                console.error('Asynchronous booking email failed:', message);
            });

            const formattedResult = {
                ...appointmentWithDoctor,
                doctor: {
                    ...appointmentWithDoctor.doctor.user,
                    doctorProfile: {
                        specialty: appointmentWithDoctor.doctor.specialty,
                        experience: appointmentWithDoctor.doctor.experience,
                        qualification: appointmentWithDoctor.doctor.qualification,
                        consultationFee: appointmentWithDoctor.doctor.consultationFee,
                    }
                }
            };

            res.status(201).json({
                success: true,
                message: 'Appointment booked successfully and is pending approval',
                data: formattedResult,
                statusCode: 201,
            } as IApiResponse);

        } catch (error: unknown) {
            console.error('Error in createAppointment:', error);

            // Handle Prisma unique constraint violation (Race Condition safety net)
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                res.status(400).json({
                    success: false,
                    message: 'This time slot has already been booked by another patient',
                    statusCode: 400,
                } as IApiResponse);
                return;
            }

            if (error instanceof z.ZodError) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid input data',
                    errors: error.issues,
                    statusCode: 400,
                } as IApiResponse);
                return;
            }

            const errorMessage = error instanceof Error ? error.message : 'Failed to book appointment';
            const isKnownError = errorMessage.includes('not found') ||
                errorMessage.includes('available') ||
                errorMessage.includes('booked');

            res.status(isKnownError ? 400 : 500).json({
                success: false,
                message: errorMessage,
                statusCode: isKnownError ? 400 : 500,
            } as IApiResponse);
        }
    }

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
                        },
                        medicalReports: true
                    },
                    orderBy: {
                        appointmentStart: type === 'past' ? 'desc' : 'asc',
                    },
                    skip,
                    take: limit,
                }),
                prisma.appointment.count({ where }),
            ]);

            // Transform data to match frontend expectations (flatten doctor.user)
            const formattedAppointments = (appointments as AppointmentWithDoctorMinimal[]).map(app => {
                const { doctor, ...rest } = app;

                return {
                    ...rest,
                    doctor: {
                        ...doctor.user,
                        doctorProfile: {
                            specialty: doctor.specialty,
                            experience: doctor.experience,
                            qualification: doctor.qualification,
                            consultationFee: doctor.consultationFee,
                        }
                    }
                };
            });

            res.status(200).json({
                success: true,
                message: 'Patient appointments fetched successfully',
                data: {
                    appointments: formattedAppointments,
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

    /**
     * Upload medical reports for an appointment
     */
    static async uploadMedicalReports(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const appointmentId = req.params.id as string;
            const patientId = req.user.id as string;
            const files = req.files as Express.Multer.File[];

            if (!files || files.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'No files uploaded',
                    statusCode: 400,
                } as IApiResponse);
                return;
            }

            // 1. Verify appointment exists and belongs to this patient
            const appointment = await prisma.appointment.findFirst({
                where: {
                    id: appointmentId,
                    patientId: patientId,
                }
            });

            if (!appointment) {
                res.status(404).json({
                    success: false,
                    message: 'Appointment not found or unauthorized',
                    statusCode: 404,
                } as IApiResponse);
                return;
            }

            // 2. Save file metadata to database
            const reports = await prisma.$transaction(
                files.map(file => prisma.medicalReport.create({
                    data: {
                        appointmentId,
                        patientId,
                        fileName: file.originalname,
                        fileUrl: file.path, // Cloudinary URL
                        fileType: file.mimetype,
                        fileSize: file.size,
                    }
                }))
            );

            res.status(201).json({
                success: true,
                message: `${reports.length} report(s) uploaded successfully`,
                data: reports,
                statusCode: 201,
            } as IApiResponse);

        } catch (error: unknown) {
            console.error('Error in uploadMedicalReports:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to upload reports',
                statusCode: 500,
            } as IApiResponse);
        }
    }
}
