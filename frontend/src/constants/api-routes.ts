export const API_BASE = '/api';

export const API = {
  AUTH: {
    BASE: `${API_BASE}/auth`,
    LOGIN: `${API_BASE}/auth/login`,
    REGISTER: `${API_BASE}/auth/register`,
    REFRESH: `${API_BASE}/auth/refresh`,
  },
} as const;
