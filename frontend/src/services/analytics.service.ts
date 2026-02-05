import { apiClient } from '@/src/utils/api-client';
import { API } from '../constants/api-routes';

export interface AnalyticsSummary {
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    totalRevenue: number;
    totalPatients: number;
}

export interface DailyMetric {
    date: string;
    appointments: number;
    revenue: number;
}

export interface AnalyticsResponse {
    success: boolean;
    data: {
        summary: AnalyticsSummary;
        dailyMetrics: DailyMetric[];
    };
    message: string;
}

export const analyticsService = {
    /**
     * Get analytics for the logged-in doctor
     */
    getDoctorAnalytics: async (startDate?: string, endDate?: string): Promise<AnalyticsResponse> => {
        const response = await apiClient.get(`${API.ANALYTICS.BASE}${API.ANALYTICS.DOCTOR}`, {
            params: { startDate, endDate }
        });
        return response.data;
    }
};
