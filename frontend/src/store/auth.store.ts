import { create } from 'zustand';
import { AuthResponse, User } from '@/src/types/user.types';
import { authService } from '@/src/services/auth.service';
import { RegisterRequest } from '@/src/types/user.types';
import axios from 'axios';
import { getErrorMessage } from '../utils/api-error';
import { STORAGE_KEYS } from '../constants/storage-keys';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (userData: RegisterRequest) => Promise<AuthResponse | null>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });

      const data = await authService.login({ email, password });

      // Store tokens in localStorage
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);

      // Set axios defaults
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;

      set({
        user: data.user,
        token: data.accessToken,
        isAuthenticated: true,
        isLoading: false
      });

      return data;
    } catch (error: unknown) {
      set({
        error: getErrorMessage(error),
        isLoading: false,
      });
      throw error;
    }
  },

  register: async (userData: RegisterRequest) => {
    try {
      set({ isLoading: true, error: null });

      const data = await authService.register(userData);

      // Store tokens in localStorage
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);

      // Set axios defaults
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;

      set({
        user: data.user,
        token: data.accessToken,
        isAuthenticated: true,
        isLoading: false
      });

      return data;
    } catch (error: unknown) {
      set({
        error: getErrorMessage(error),
        isLoading: false
      });
      throw error;
    }
  },

  logout: () => {
    // Remove tokens from localStorage
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);

    // Remove authorization header
    delete axios.defaults.headers.common['Authorization'];

    authService.logout();

    set({
      user: null,
      token: null,
      isAuthenticated: false
    });
  },

  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const { accessToken } = await authService.refreshToken(refreshToken);

      // Update tokens
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      set({ token: accessToken });
    } catch (error: unknown) {
      get().logout();
      throw error;
    }
  },

  checkAuthStatus: async () => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      set({ isLoading: true });

      // Set axios defaults for the verification request
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Fetch user profile to verify token
      const user = await authService.getMe();

      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      // If token verification fails, remove invalid tokens
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      delete axios.defaults.headers.common['Authorization'];
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  }
}));