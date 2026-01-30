import { apiClient } from '@/src/utils/api-client';
import { API } from '../constants/api-routes';
import { AppointmentQueryParams, AppointmentListResponse } from '../types/appointment.types';

export const appointmentService = {
    /**
     * Fetch patient appointments with filters and pagination
     */
    getPatientAppointments: async (params: AppointmentQueryParams): Promise<AppointmentListResponse> => {
        const response = await apiClient.get(API.APPOINTMENTS.LIST_PATIENT, { params });
        return response.data;
    },
};
