import jwt from 'jsonwebtoken';
import { ITokenPayload } from '../interfaces/token.interface';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export const generateAccessToken = (payload: ITokenPayload): string => {
  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: ITokenPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): ITokenPayload | null => {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET) as ITokenPayload;
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): ITokenPayload | null => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as ITokenPayload;
  } catch (error) {
    return null;
  }
};