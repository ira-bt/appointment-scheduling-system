export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: UserRole;
  city?: string;
  profileImage?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  patientProfile?: PatientProfile;
  doctorProfile?: DoctorProfile;
}

export interface PatientProfile {
  userId: string;
  bloodType?: string;
  allergies?: string;
  medicalHistory?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface DoctorProfile {
  userId: string;
  bio?: string;
  specialty?: string;
  experience?: number;
  qualification?: string;
  consultationFee: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: UserRole;
  city?: string;
  // Patient-specific fields
  bloodType?: string;
  allergies?: string;
  medicalHistory?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  // Doctor-specific fields
  bio?: string;
  specialty?: string;
  experience?: number;
  qualification?: string;
  consultationFee?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string | null;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}