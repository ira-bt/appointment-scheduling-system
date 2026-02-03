import axios from 'axios';
import { STORAGE_KEYS } from '../constants/storage-keys';
import { API } from '../constants/api-routes';
import { APP_ROUTES } from '../constants/app-routes';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export const apiClient = axios.create({
    baseURL: BACKEND_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for token injection
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't retried yet
        // Also skip redirect if we are on login/register endpoints
        const isAuthEndpoint = originalRequest.url?.includes(API.AUTH.LOGIN) || originalRequest.url?.includes(API.AUTH.REGISTER);

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                // Attempt to refresh token using a fresh axios call (to avoid interceptors)
                const response = await axios.post(`${BACKEND_BASE_URL}${API.AUTH.REFRESH}`, {
                    refreshToken
                });

                const { accessToken } = response.data.data;

                // Store new token
                localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);

                // Update header and retry original request
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                // If refresh fails, clear tokens and redirect to login
                localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
                localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);

                if (typeof window !== 'undefined') {
                    window.location.href = APP_ROUTES.AUTH.LOGIN;
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);
