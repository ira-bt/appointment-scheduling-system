import { apiClient } from '../utils/api-client';
import { API } from '../constants/api-routes';

export interface CreateAppointmentRequest {
    doctorId: string;
    appointmentStart: string;
}

export const appointmentService = {
    /**
     * Create a new appointment
     */
    createAppointment: async (data: CreateAppointmentRequest) => {
        const response = await apiClient.post(API.APPOINTMENTS.BASE, data);
        return response.data;
    },

    /**
     * Get patient appointments
     */
    getPatientAppointments: async (params?: { type?: 'upcoming' | 'past'; page?: number; limit?: number }) => {
        const response = await apiClient.get(API.APPOINTMENTS.LIST_PATIENT, { params });
        return response.data;
    }
};
