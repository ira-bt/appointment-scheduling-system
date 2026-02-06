export const API_BASE = '/api';

export const API = {
  AUTH: {
    BASE: `${API_BASE}/auth`,
    LOGIN: `${API_BASE}/auth/login`,
    REGISTER: `${API_BASE}/auth/register`,
    REFRESH: `${API_BASE}/auth/refresh`,
    FORGOT_PASSWORD: `${API_BASE}/auth/forgot-password`,
    RESET_PASSWORD: `${API_BASE}/auth/reset-password`,
  },
  USERS: {
    ME: `${API_BASE}/users/me`,
  },
  DOCTORS: {
    BASE: `${API_BASE}/doctors`,
    DETAILS: (id: string) => `${API_BASE}/doctors/${id}`,
    AVAILABILITY: `${API_BASE}/doctors/availability`,
    SLOTS: (doctorId: string) => `${API_BASE}/doctors/${doctorId}/slots`,
  },
  APPOINTMENTS: {
    BASE: `${API_BASE}/appointments`,
    LIST_PATIENT: `${API_BASE}/appointments/patient`,
    LIST_DOCTOR: `${API_BASE}/appointments/doctor`,
    UPLOAD_REPORTS: (id: string) => `${API_BASE}/appointments/${id}/reports`,
    UPDATE_STATUS: (id: string) => `${API_BASE}/appointments/${id}/status`,
  },
  PAYMENTS: {
    BASE: `${API_BASE}/payments`,
    CREATE_SESSION: `${API_BASE}/payments/create-checkout-session`,
  },
  ANALYTICS: {
    BASE: `${API_BASE}/analytics`,
    DOCTOR: '/doctor',
  },
  RATINGS: {
    BASE: `${API_BASE}/ratings`,
    DOCTOR: (doctorId: string) => `${API_BASE}/ratings/doctor/${doctorId}`,
  },
} as const;
