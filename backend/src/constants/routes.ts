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
    LIST_DOCTOR: '/doctor',
    CREATE: '/',
    UPLOAD_REPORTS: '/:id/reports',
    UPDATE_STATUS: '/:id/status',
  },
  PAYMENTS: {
    BASE: '/payments',
    CREATE_SESSION: '/create-checkout-session',
    WEBHOOK: '/webhook',
  },
};

export const FRONTEND_ROUTES = {
  PAYMENT_SUCCESS: '/payment/success',
  PAYMENT_CANCEL: '/payment/cancel',
};
