import { apiClient } from '@/src/utils/api-client';
import { API } from '../constants/api-routes';
import { User, DoctorProfile } from '../types/user.types';

import { AppointmentStatus } from '../types/appointment.types';

export interface DoctorQueryParams {
    specialty?: string;
    city?: string;
    minExperience?: number;
    maxFee?: number;
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface DoctorListResponse {
    success: boolean;
    message: string;
    data: {
        doctors: (User & { doctorProfile: DoctorProfile })[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    };
    statusCode: number;
}

export interface AvailabilityItem {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
}

export interface AvailabilityResponse {
    success: boolean;
    data: AvailabilityItem[];
    message: string;
}

export interface AvailabilityUpdateResponse {
    success: boolean;
    message: string;
}

export interface Slot {
    time: string;
    value: string;
    isAvailable: boolean;
    reason?: 'past' | 'booked' | 'lead_time' | null;
}

export interface SlotsResponse {
    success: boolean;
    data: {
        slots: Slot[];
    };
    message: string;
}

export const doctorService = {
    /**
     * Fetch doctors with filters and pagination
     */
    getDoctors: async (params: DoctorQueryParams): Promise<DoctorListResponse> => {
        const response = await apiClient.get(API.DOCTORS.BASE, { params });
        return response.data;
    },

    /**
     * Get a single doctor by ID
     */
    getDoctorById: async (id: string): Promise<{ success: boolean; data: User & { doctorProfile: DoctorProfile } }> => {
        const response = await apiClient.get(API.DOCTORS.DETAILS(id));
        return response.data;
    },

    /**
     * Get logged-in doctor's current availability schedule
     */
    getAvailability: async (): Promise<AvailabilityResponse> => {
        const response = await apiClient.get(API.DOCTORS.AVAILABILITY);
        return response.data;
    },

    /**
     * Update doctor availability schedule
     */
    updateAvailability: async (availability: AvailabilityItem[]): Promise<AvailabilityUpdateResponse> => {
        const response = await apiClient.post(API.DOCTORS.AVAILABILITY, availability);
        return response.data;
    },

    /**
     * Get available slots for a doctor on a specific date
     */
    getSlots: async (doctorId: string, date: string): Promise<SlotsResponse> => {
        const timezoneOffset = new Date().getTimezoneOffset();
        const response = await apiClient.get(API.DOCTORS.SLOTS(doctorId), {
            params: { date, timezoneOffset: timezoneOffset.toString() }
        });
        return response.data;
    },
    /**
     * Get appointments for the logged-in doctor
     */
    getAppointments: async (params?: {
        status?: AppointmentStatus;
        type?: 'upcoming' | 'past' | 'requests' | 'approved';
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }) => {
        const response = await apiClient.get(API.APPOINTMENTS.LIST_DOCTOR, { params });
        return response.data;
    },

    /**
     * Update appointment status (Approve/Reject)
     */
    updateAppointmentStatus: async (appointmentId: string, status: AppointmentStatus.APPROVED | AppointmentStatus.REJECTED) => {
        const response = await apiClient.patch(API.APPOINTMENTS.UPDATE_STATUS(appointmentId), { status });
        return response.data;
    }
};
