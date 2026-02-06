import { apiClient } from '../utils/api-client';
import { API } from '../constants/api-routes';
import { Rating } from '../types/appointment.types';

class RatingService {
    /**
     * Submit a rating for an appointment
     */
    async createRating(appointmentId: string, rating: number, review?: string): Promise<Rating> {
        const response = await apiClient.post(API.RATINGS.BASE, { appointmentId, rating, review });
        return response.data.data;
    }

    /**
     * Get ratings for a doctor
     */
    async getDoctorRatings(doctorId: string): Promise<Rating[]> {
        const response = await apiClient.get(API.RATINGS.DOCTOR(doctorId));
        return response.data.data;
    }
}

export const ratingService = new RatingService();
