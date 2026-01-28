import { create } from 'zustand';
import { AuthResponse, User } from '@/src/types/user.types';
import { authService } from '@/src/services/auth.service';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<AuthResponse | null>;
  register: (userData: any) => Promise<AuthResponse | null>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });

      const data = await authService.login({ email, password });

      // Store tokens in localStorage
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);

      // Set axios defaults
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;

      set({
        user: data.user,
        token: data.accessToken,
        isAuthenticated: true,
        isLoading: false
      });

      return data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Login failed',
        isLoading: false
      });
      throw error;
    }
  },

  register: async (userData: any) => {
    try {
      set({ isLoading: true, error: null });

      const data = await authService.register(userData);

      // Store tokens in localStorage
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);

      // Set axios defaults
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;

      set({
        user: data.user,
        token: data.accessToken,
        isAuthenticated: true,
        isLoading: false
      });

      return data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Registration failed',
        isLoading: false
      });
      throw error;
    }
  },

  logout: () => {
    // Remove tokens from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

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
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const { accessToken } = await authService.refreshToken(refreshToken);

      // Update tokens
      localStorage.setItem('accessToken', accessToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      set({ token: accessToken });
    } catch (error) {
      get().logout();
      throw error;
    }
  },

  checkAuthStatus: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      // Verify token by making a request to a protected endpoint
      // For now, we'll just set the user as authenticated if token exists
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // TODO: Implement actual token verification endpoint
      // const response = await axios.get(`${BACKEND_BASE_URL}/api/auth/me`);
      // set({ user: response.data.user, isAuthenticated: true, token });
      
      // For now, just set the token and assume authenticated
      set({ token, isAuthenticated: true });
    } catch (error) {
      // If token verification fails, remove invalid tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      delete axios.defaults.headers.common['Authorization'];
      set({ token: null, isAuthenticated: false });
    }
  }
}));