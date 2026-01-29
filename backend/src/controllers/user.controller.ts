import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { hashPassword, comparePassword } from '../utils/password.util';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.util';
import { IRegisterUserRequest, ILoginUserRequest, IAuthResponse } from '../interfaces/user.interface';
import emailService from '../utils/email.util';
import { IApiResponse } from '../interfaces/response.interface';
import prisma from '../config/prisma';

export class UserController {
  /**
   * Register a new user
   * Validation is handled by middleware
   */
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        phoneNumber,
        role,
        city,
        // Patient-specific fields
        bloodType,
        allergies,
        medicalHistory,
        emergencyContactName,
        emergencyContactPhone,
        // Doctor-specific fields
        bio,
        specialty,
        experience,
        qualification,
        consultationFee
      }: IRegisterUserRequest = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'User with this email already exists',
          statusCode: 409,
        } as IApiResponse);
        return;
      }

      // Hash the password
      const hashedPassword = await hashPassword(password);

      // Create the user and their profile in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            phoneNumber,
            role,
            city,
          },
        });

        if (role === 'PATIENT') {
          await tx.patientProfile.create({
            data: {
              userId: user.id,
              bloodType: bloodType as any, // Cast to BloodType enum
              allergies,
              medicalHistory,
              emergencyContactName,
              emergencyContactPhone
            },
          });
        } else if (role === 'DOCTOR') {
          await tx.doctorProfile.create({
            data: {
              userId: user.id,
              bio,
              specialty,
              experience,
              qualification,
              consultationFee
            },
          });
        }

        return user;
      });

      // Send welcome email (asynchronous, don't block response)
      emailService.sendWelcomeEmail(result.email, result.firstName).catch(err => {
        console.error('Failed to send welcome email:', err);
      });

      // Generate tokens
      const payload = {
        userId: result.id,
        email: result.email,
        role: result.role,
      };

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      // Store refresh token in database
      await prisma.refreshToken.create({
        data: {
          userId: result.id,
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      const response: IAuthResponse = {
        accessToken,
        refreshToken,
        user: {
          id: result.id,
          email: result.email,
          firstName: result.firstName,
          lastName: result.lastName,
          phoneNumber: result.phoneNumber || undefined,
          role: result.role,
          city: result.city || undefined,
          profileImage: result.profileImage || undefined,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
        },
      };

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: response,
        statusCode: 201,
      } as IApiResponse<IAuthResponse>);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * Validation is handled by middleware
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password }: ILoginUserRequest = req.body;

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
          statusCode: 401,
        } as IApiResponse);
        return;
      }

      // Compare password
      const isPasswordValid = await comparePassword(password, user.password);

      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
          statusCode: 401,
        } as IApiResponse);
        return;
      }

      // Revoke all existing refresh tokens for this user
      await prisma.refreshToken.updateMany({
        where: {
          userId: user.id,
          isRevoked: false
        },
        data: {
          isRevoked: true,
        },
      });

      // Generate new tokens
      const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      // Store new refresh token in database
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      const response: IAuthResponse = {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber || undefined,
          role: user.role,
          city: user.city || undefined,
          profileImage: user.profileImage || undefined,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      };

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: response,
        statusCode: 200,
      } as IApiResponse<IAuthResponse>);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   * Uses refresh token to issue new access and refresh tokens
   */
  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token is required',
          statusCode: 400,
        } as IApiResponse);
        return;
      }

      // Verify the refresh token
      const decoded = verifyRefreshToken(refreshToken);
      if (!decoded) {
        res.status(401).json({
          success: false,
          message: 'Invalid or expired refresh token',
          statusCode: 401,
        } as IApiResponse);
        return;
      }

      // Check if token exists in database and is not revoked
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
        res.status(401).json({
          success: false,
          message: 'Invalid, expired, or revoked refresh token',
          statusCode: 401,
        } as IApiResponse);
        return;
      }

      // Revoke the old refresh token
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { isRevoked: true },
      });

      // Generate new tokens
      const payload = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };

      const newAccessToken = generateAccessToken(payload);
      const newRefreshToken = generateRefreshToken(payload);

      // Store the new refresh token
      await prisma.refreshToken.create({
        data: {
          userId: decoded.userId,
          token: newRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      res.status(200).json({
        success: true,
        message: 'Tokens refreshed successfully',
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
        statusCode: 200,
      } as IApiResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Forgot password
   * Generates a reset token and sends an email
   */
  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // For security reasons, don't reveal if user exists
        res.status(200).json({
          success: true,
          message: 'If an account with that email exists, we have sent a reset link',
          statusCode: 200,
        } as IApiResponse);
        return;
      }

      // Generate random token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store token in database
      await prisma.passwordResetToken.create({
        data: {
          email,
          token: resetToken,
          expiresAt,
        },
      });

      // Send email
      emailService.sendPasswordResetEmail(email, user.firstName, resetToken).catch(err => {
        console.error('Failed to send password reset email:', err);
      });

      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, we have sent a reset link',
        statusCode: 200,
      } as IApiResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password
   * Verifies the reset token and updates the password
   */
  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body;

      // Find valid token
      const resetTokenRecord = await prisma.passwordResetToken.findUnique({
        where: { token },
      });

      if (!resetTokenRecord || resetTokenRecord.isUsed || resetTokenRecord.expiresAt < new Date()) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token',
          statusCode: 400,
        } as IApiResponse);
        return;
      }

      // Update user password and invalidate tokens
      const hashedPassword = await hashPassword(password);

      await prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
          where: { email: resetTokenRecord.email },
          data: { password: hashedPassword },
        });

        // Mark token as used
        await tx.passwordResetToken.update({
          where: { id: resetTokenRecord.id },
          data: { isUsed: true },
        });

        // Revoke all refresh tokens for security
        await tx.refreshToken.updateMany({
          where: { userId: user.id },
          data: { isRevoked: true },
        });
      });

      res.status(200).json({
        success: true,
        message: 'Password reset successful. All active sessions have been logged out.',
        statusCode: 200,
      } as IApiResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   * Authenticated user changes their own password
   */
  static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id; // From protect middleware

      // Fetch user with password
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
          statusCode: 404,
        } as IApiResponse);
        return;
      }

      // Check current password
      const isMatch = await comparePassword(currentPassword, user.password);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          message: 'Incorrect current password',
          statusCode: 401,
        } as IApiResponse);
        return;
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password and revoke all tokens
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: { password: hashedPassword },
        });

        // Revoke all existing sessions
        await tx.refreshToken.updateMany({
          where: { userId },
          data: { isRevoked: true },
        });
      });

      res.status(200).json({
        success: true,
        message: 'Password updated successfully. Please log in again with your new password.',
        statusCode: 200,
      } as IApiResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   * Authenticated user fetches their own profile
   */
  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user.id; // From protect middleware

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          patientProfile: true,
          doctorProfile: true,
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
          statusCode: 404,
        } as IApiResponse);
        return;
      }

      // Remove sensitive data
      const { password, ...userWithoutPassword } = user;

      res.status(200).json({
        success: true,
        message: 'User profile fetched successfully',
        data: userWithoutPassword,
        statusCode: 200,
      } as IApiResponse);
    } catch (error) {
      next(error);
    }
  }
}
