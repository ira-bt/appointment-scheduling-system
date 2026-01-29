export const APP_ROUTES = {
  HOME: '/',
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
  },
  DASHBOARD: {
    BASE: '/dashboard',
    PATIENT: '/dashboard/patient',
    DOCTOR: '/dashboard/doctor',
  },
} as const;
