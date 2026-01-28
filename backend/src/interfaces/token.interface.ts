import { Role } from '@prisma/client';

export interface IToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
}

export interface ITokenPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface IRefreshToken extends IToken {}

export interface IPasswordResetToken extends IToken {
  email: string;
  isUsed: boolean;
}