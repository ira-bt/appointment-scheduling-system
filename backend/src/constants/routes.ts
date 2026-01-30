export const API = '/api';

export const ROUTES = {
  AUTH: {
    BASE: '/auth',
    REGISTER: '/register',
    LOGIN: '/login',
    REFRESH: '/refresh',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    CHANGE_PASSWORD: '/change-password',
  },
  USERS: {
    BASE: '/users',
    ME: '/me',
  },
  DOCTORS: {
    BASE: '/doctors',
    LIST: '/',
    DETAILS: '/:id',
    AVAILABILITY: '/availability',
    SLOTS: '/:id/slots',
  },
  APPOINTMENTS: {
    BASE: '/appointments',
    LIST_PATIENT: '/patient',
  },
};
