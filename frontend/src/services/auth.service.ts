import axios from 'axios';
import { AuthResponse, RegisterRequest, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest, User, ChangePasswordRequest } from '@/src/types/user.types';
import { STORAGE_KEYS } from '../constants/storage-keys';
import { API } from '../constants/api-routes';
import { APP_ROUTES } from '../constants/app-routes';
import { apiClient } from '../utils/api-client';

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
  },
  changePassword: async (data: ChangePasswordRequest): Promise<{ message: string }> => {
    const response = await apiClient.post(API.AUTH.CHANGE_PASSWORD, data);
    return response.data;
  }
};

export default apiClient;