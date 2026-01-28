import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/password.util';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.util';
import { IRegisterUserRequest, ILoginUserRequest, IAuthResponse } from '../interfaces/user.interface';
import emailService from '../utils/email.util';
import { IApiResponse } from '../interfaces/response.interface';

const prisma = new PrismaClient();

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
        // Patient-specific fields
        bloodType,
        allergies,
        medicalHistory,
        emergencyContactName,
        emergencyContactPhone,
        // Doctor-specific fields
        bio,
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
          },
        });

        if (role === 'PATIENT') {
          await tx.patientProfile.create({
            data: {
              userId: user.id,
              bloodType: bloodType as any,
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
}
