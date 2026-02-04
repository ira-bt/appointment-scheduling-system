import { apiClient } from '../utils/api-client';
import { API } from '../constants/api-routes';

export const paymentService = {
    /**
     * Create a Stripe Checkout Session
     */
    createCheckoutSession: async (appointmentId: string) => {
        return apiClient.post(API.PAYMENTS.CREATE_SESSION, { appointmentId });
    }
};
