import axios from 'axios';
import { AuthResponse, RegisterRequest, LoginRequest } from '@/src/types/user.types';

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
    const token = localStorage.getItem('accessToken');
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
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${BACKEND_BASE_URL}/api/auth/refresh`, {
          refreshToken
        });

        const responseData = response.data as { data: { accessToken: string } };
        const { accessToken } = responseData.data;

        // Update tokens
        localStorage.setItem('accessToken', accessToken);

        // Retry original request with new token
        if (!originalRequest.headers) {
          originalRequest.headers = {};
        }
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
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
    const response = await apiClient.post('/api/auth/login', credentials);
    const responseData = response.data as { data: AuthResponse };
    return responseData.data;
  },

  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/api/auth/register', userData);
    const responseData = response.data as { data: AuthResponse };
    return responseData.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await apiClient.post('/api/auth/refresh', { refreshToken });
    const responseData = response.data as { data: { accessToken: string } };
    return responseData.data;
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
};

export default apiClient;