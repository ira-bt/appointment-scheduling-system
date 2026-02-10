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
    UPDATE_PROFILE: '/update',
    UPLOAD_PROFILE_IMAGE: '/profile-image',
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
    CHECK_CONFLICT: '/check-conflict',
    UPLOAD_REPORTS: '/:id/reports',
    UPDATE_STATUS: '/:id/status',
  },
  PAYMENTS: {
    BASE: '/payments',
    CREATE_SESSION: '/create-checkout-session',
    WEBHOOK: '/webhook',
  },
  ANALYTICS: {
    BASE: '/analytics',
    DOCTOR: '/doctor',
  },
  RATINGS: {
    BASE: '/ratings',
    CREATE: '/',
    DOCTOR: '/doctor/:doctorId',
  },
};

export const FRONTEND_ROUTES = {
  PAYMENT_SUCCESS: '/payment/success',
  PAYMENT_CANCEL: '/payment/cancel',
};
