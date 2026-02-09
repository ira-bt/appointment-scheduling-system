import { Role, BloodType } from '@prisma/client';

export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: Role;
  city?: string;
  profileImage?: string;
  patientProfile?: any;
  doctorProfile?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRegisterUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: Role;
  city?: string;
  // Patient-specific fields
  bloodType?: BloodType;
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

export interface ILoginUserRequest {
  email: string;
  password: string;
}

export interface IAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: IUser;
}

export interface ITokenPayload {
  userId: string;
  email: string;
  role: Role;
}