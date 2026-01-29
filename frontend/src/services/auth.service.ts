import axios from 'axios';
import { AuthResponse, RegisterRequest, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest, User } from '@/src/types/user.types';
import { STORAGE_KEYS } from '../constants/storage-keys';
import { API } from '../constants/api-routes';
import { APP_ROUTES } from '../constants/app-routes';
// Define the base URL for the backend API
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// Create axios instance
const apiClient = axios.create({
  baseURL: BACKEND_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${BACKEND_BASE_URL}${API.AUTH.REFRESH}`, {
          refreshToken
        });

        const responseData = response.data as { data: { accessToken: string } };
        const { accessToken } = responseData.data;

        // Update tokens
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);

        // Retry original request with new token
        if (!originalRequest.headers) {
          originalRequest.headers = {};
        }
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
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

// Auth API service
export const authService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post(API.AUTH.LOGIN, credentials);
    const responseData = response.data as { data: AuthResponse };
    return responseData.data;
  },

  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post(API.AUTH.REGISTER, userData);
    const responseData = response.data as { data: AuthResponse };
    return responseData.data;
  },

  refreshToken: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const response = await apiClient.post(API.AUTH.REFRESH, { refreshToken });
    const responseData = response.data as { data: { accessToken: string } };
    return responseData.data;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post(API.AUTH.FORGOT_PASSWORD, { email });
    return response.data;
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<{ message: string }> => {
    const response = await apiClient.post(API.AUTH.RESET_PASSWORD, data);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get(API.USERS.ME);
    const responseData = response.data as { data: User };
    return responseData.data;
  }
};

export default apiClient;