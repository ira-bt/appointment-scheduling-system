import { apiClient } from '@/src/utils/api-client';
import { API } from '../constants/api-routes';
import { User, DoctorProfile } from '../types/user.types';

export interface DoctorQueryParams {
    specialty?: string;
    city?: string;
    minExperience?: number;
    maxFee?: number;
    page?: number;
    limit?: number;
    search?: string;
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

export interface SlotsResponse {
    success: boolean;
    data: {
        slots: string[];
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
        const response = await apiClient.get(API.DOCTORS.SLOTS(doctorId), { params: { date } });
        return response.data;
    },
};
