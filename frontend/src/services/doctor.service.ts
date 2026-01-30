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

export const doctorService = {
    /**
     * Fetch doctors with filters and pagination
     */
    getDoctors: async (params: DoctorQueryParams): Promise<DoctorListResponse> => {
        // Convert numbers to strings for query params if needed, 
        // but axios handles objects in params well.
        const response = await apiClient.get(API.DOCTORS.BASE, { params });
        return response.data;
    },
};
