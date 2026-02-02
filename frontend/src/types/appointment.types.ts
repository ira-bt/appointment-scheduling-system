import { User, DoctorProfile } from './user.types';

export interface MedicalReport {
    id: string;
    appointmentId: string;
    patientId: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    createdAt: string | Date;
}

export enum AppointmentStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    CONFIRMED = 'CONFIRMED',
    COMPLETED = 'COMPLETED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED'
}

export interface Appointment {
    id: string;
    patientId: string;
    doctorId: string;
    appointmentStart: string | Date;
    appointmentEnd: string | Date;
    status: AppointmentStatus;
    reason?: string;
    notes?: string;
    consultationFee: number;
    paymentStatus: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    doctor?: User & {
        doctorProfile: DoctorProfile;
    };
    patient?: User;
    medicalReports?: MedicalReport[];
}

export interface AppointmentQueryParams {
    type?: 'upcoming' | 'past';
    page?: number;
    limit?: number;
}

export interface AppointmentListResponse {
    success: boolean;
    message: string;
    data: {
        appointments: Appointment[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    };
    statusCode: number;
}
