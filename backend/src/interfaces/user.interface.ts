import { Role } from '@prisma/client';

export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: Role;
  profileImage?: string;
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
  // Patient-specific fields
  bloodType?: string;
  allergies?: string;
  medicalHistory?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  // Doctor-specific fields
  bio?: string;
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