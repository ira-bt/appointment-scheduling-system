import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/password.util';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.util';
import { IRegisterUserRequest, ILoginUserRequest, IAuthResponse } from '../interfaces/user.interface';
import { IToken } from '../interfaces/token.interface';
import emailService from '../utils/email.util';
import { IApiResponse } from '../interfaces/response.interface';
import { validateEmail, validatePassword } from '../utils/validation.util';

const prisma = new PrismaClient();

export class UserController {
  // Register a new user
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

      // Validate required fields
      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required',
          statusCode: 400,
        } as IApiResponse);
        return;
      }

      if (!password) {
        res.status(400).json({
          success: false,
          message: 'Password is required',
          statusCode: 400,
        } as IApiResponse);
        return;
      }

      if (!firstName) {
        res.status(400).json({
          success: false,
          message: 'First name is required',
          statusCode: 400,
        } as IApiResponse);
        return;
      }

      if (!lastName) {
        res.status(400).json({
          success: false,
          message: 'Last name is required',
          statusCode: 400,
        } as IApiResponse);
        return;
      }

      if (!role) {
        res.status(400).json({
          success: false,
          message: 'Role is required',
          statusCode: 400,
        } as IApiResponse);
        return;
      }

      // Validate email format
      if (!validateEmail(email)) {
        res.status(400).json({
          success: false,
          message: 'Invalid email format',
          statusCode: 400,
        } as IApiResponse);
        return;
      }

      // Validate password strength
      if (!validatePassword(password)) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters with at least 1 uppercase, 1 lowercase, 1 number, and 1 special character',
          statusCode: 400,
        } as IApiResponse);
        return;
      }

      // Validate name format
      if (firstName && !/^[A-Za-z]{2,}$/.test(firstName)) {
        res.status(400).json({
          success: false,
          message: 'First name must contain only alphabetic characters and be at least 2 characters',
          statusCode: 400,
        } as IApiResponse);
        return;
      }

      if (lastName && !/^[A-Za-z]{2,}$/.test(lastName)) {
        res.status(400).json({
          success: false,
          message: 'Last name must contain only alphabetic characters and be at least 2 characters',
          statusCode: 400,
        } as IApiResponse);
        return;
      }

      // Validate phone number if provided
      if (phoneNumber && !/^\+?(\d{10}|\d{11}|\d{12}|\d{13}|\d{14}|\d{15})$/.test(phoneNumber)) {
        res.status(400).json({
          success: false,
          message: 'Phone number must be 10-15 digits',
          statusCode: 400,
        } as IApiResponse);
        return;
      }

      // Role-specific validation
      if (role === 'PATIENT') {
        if (emergencyContactPhone && !/^\+?(\d{10}|\d{11}|\d{12}|\d{13}|\d{14}|\d{15})$/.test(emergencyContactPhone)) {
          res.status(400).json({
            success: false,
            message: 'Emergency contact phone must be 10-15 digits',
            statusCode: 400,
          } as IApiResponse);
          return;
        }
      }

      if (role === 'DOCTOR') {
        if (experience !== undefined && experience !== null && experience < 0) {
          res.status(400).json({
            success: false,
            message: 'Experience cannot be negative',
            statusCode: 400,
          } as IApiResponse);
          return;
        }
        if (consultationFee !== undefined && consultationFee !== null && consultationFee < 0) {
          res.status(400).json({
            success: false,
            message: 'Consultation fee cannot be negative',
            statusCode: 400,
          } as IApiResponse);
          return;
        }
      }

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

      // Create the user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phoneNumber,
          role,
        },
      });

      // Create role-specific profile with additional data
      if (role === 'PATIENT') {
        await prisma.patientProfile.create({
          data: {
            userId: user.id,
            bloodType: bloodType as any, // Type assertion to handle enum conversion
            allergies,
            medicalHistory,
            emergencyContactName,
            emergencyContactPhone
          },
        });
      } else if (role === 'DOCTOR') {
        await prisma.doctorProfile.create({
          data: {
            userId: user.id,
            bio,
            experience,
            qualification,
            consultationFee
          },
        });
      }

      // Send welcome email
      await emailService.sendWelcomeEmail(user.email, user.firstName);

      // Generate tokens
      const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      // Store refresh token in database
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

  // Login user
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password }: ILoginUserRequest = req.body;

      // Validate required fields
      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required',
          statusCode: 400,
        } as IApiResponse);
        return;
      }

      if (!password) {
        res.status(400).json({
          success: false,
          message: 'Password is required',
          statusCode: 400,
        } as IApiResponse);
        return;
      }

      // Validate email format
      if (!validateEmail(email)) {
        res.status(400).json({
          success: false,
          message: 'Invalid email format',
          statusCode: 400,
        } as IApiResponse);
        return;
      }

      // Validate password strength (at least 8 characters)
      if (password.length < 8) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters',
          statusCode: 400,
        } as IApiResponse);
        return;
      }

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

      // Revoke all existing refresh tokens for this user (to ensure single device login)
      await prisma.refreshToken.updateMany({
        where: {
          userId: user.id,
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
}