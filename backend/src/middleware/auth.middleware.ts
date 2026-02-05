import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.util';
import { IApiResponse } from '../interfaces/response.interface';
import prisma from '../config/prisma';
import { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user: AuthUser;
    }
  }
}

export type AuthRequest = Request;

/**
 * Authentication middleware
 * Verifies JWT and attaches user to request
 */
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'You are not logged in. Please log in to get access.',
        statusCode: 401,
      } as IApiResponse);
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please log in again.',
        statusCode: 401,
      } as IApiResponse);
    }

    // Check if user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
        statusCode: 401,
      } as IApiResponse);
    }

    // Grant Access
    req.user = user as AuthUser;
    next();
  } catch (error: unknown) {
    next(error);
  }
};

// Alias for convenience
export const authMiddleware = protect;

/**
 * Restrict access to specific roles
 */
export const restrictTo = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
        statusCode: 403,
      } as IApiResponse);
    }
    next();
  };
};