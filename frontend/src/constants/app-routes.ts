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
    PATIENT_PROFILE: '/dashboard/patient/profile',
    DOCTOR: '/dashboard/doctor',
    DOCTOR_PROFILE: '/dashboard/doctor/profile',
  },
  DOCTORS: '/doctors',
  APPOINTMENTS: {
    BOOK: '/appointments/book',
  },
  PAYMENT: {
    SUCCESS: '/payment/success',
    CANCEL: '/payment/cancel',
  },
} as const;
