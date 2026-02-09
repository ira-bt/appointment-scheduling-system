import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { REGEX } from '../constants/regex.constants';
import { CITIES, CitySchema, SPECIALTIES, SpecialtySchema, BloodTypeSchema } from '../constants/healthcare.constants';
import { Role } from '@prisma/client';

// Validation utility functions (keeping them for direct use if needed)
export const validateEmail = (email: string): boolean => {
  const emailRegex = REGEX.EMAIL;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  const passwordRegex = REGEX.PASSWORD;
  return passwordRegex.test(password);
};

export const validateName = (name: string): boolean => {
  const nameRegex = REGEX.NAME;
  return nameRegex.test(name);
};

export const validatePhoneNumber = (phone: string): boolean => {
  if (!phone) return true;
  const phoneRegex = REGEX.PHONE;
  return phoneRegex.test(phone);
};

// Zod Schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().regex(REGEX.PASSWORD, 'Password must be at least 8 characters with at least 1 uppercase, 1 lowercase, 1 number, and 1 special character'),
  firstName: z.string().regex(REGEX.NAME, 'First name must contain only letters and be at least 2 characters'),
  lastName: z.string().regex(REGEX.NAME, 'Last name must contain only letters and be at least 2 characters'),
  phoneNumber: z.string().regex(REGEX.PHONE, 'Invalid phone number format').optional().or(z.literal('')),
  role: z.nativeEnum(Role),
  city: CitySchema,

  // Patient-specific fields
  bloodType: z.preprocess((val) => (val === '' ? undefined : val), BloodTypeSchema.optional()),
  allergies: z.string().optional(),
  medicalHistory: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().regex(REGEX.PHONE, 'Invalid emergency contact phone number format').optional().or(z.literal('')),

  // Doctor-specific fields
  bio: z.string().optional(),
  specialty: z.preprocess((val) => (val === '' ? undefined : val), SpecialtySchema.optional()),
  experience: z.number().min(0, 'Experience cannot be negative').optional(),
  qualification: z.string().optional(),
  consultationFee: z.number().min(0, 'Consultation fee cannot be negative').optional(),
}).refine((data) => {
  if (data.role === Role.DOCTOR) {
    return true; // Additional doctor checks can go here
  }
  return true;
}, {
  message: "Invalid role-specific data",
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().regex(REGEX.PASSWORD, 'Password must be at least 8 characters with at least 1 uppercase, 1 lowercase, 1 number, and 1 special character'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().regex(REGEX.PASSWORD, 'New password must be at least 8 characters with at least 1 uppercase, 1 lowercase, 1 number, and 1 special character'),
});

// Role-specific fields for validation
const PATIENT_ONLY_FIELDS = [
  'bloodType',
  'allergies',
  'medicalHistory',
  'emergencyContactName',
  'emergencyContactPhone'
];

const DOCTOR_ONLY_FIELDS = [
  'bio',
  'specialty',
  'experience',
  'qualification',
  'consultationFee'
];

export const updateProfileSchema = z.object({
  firstName: z.string().regex(REGEX.NAME, 'First name must contain only letters and be at least 2 characters').optional().or(z.literal('')),
  lastName: z.string().regex(REGEX.NAME, 'Last name must contain only letters and be at least 2 characters').optional().or(z.literal('')),
  phoneNumber: z.string().regex(REGEX.PHONE, 'Invalid phone number format').optional().or(z.literal('')),
  city: CitySchema.optional(),

  // Role-agnostic but handled specifically in controller based on role
  // Patient-specific fields
  bloodType: z.preprocess((val) => (val === '' ? undefined : val), BloodTypeSchema.optional()),
  allergies: z.string().optional(),
  medicalHistory: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().regex(REGEX.PHONE, 'Invalid emergency contact phone number format').optional().or(z.literal('')),

  // Doctor-specific fields
  bio: z.string().optional(),
  specialty: z.preprocess((val) => (val === '' ? undefined : val), SpecialtySchema.optional()),
  experience: z.number().min(0, 'Experience cannot be negative').optional(),
  qualification: z.string().optional(),
  consultationFee: z.number().min(0, 'Consultation fee cannot be negative').optional(),
});

// Validation middleware
export const validateRegisterBody = (req: Request, res: Response, next: NextFunction) => {
  try {
    registerSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.issues[0].message,
        errors: error.issues,
        statusCode: 400,
      });
    }
    next(error);
  }
};

export const validateLoginBody = (req: Request, res: Response, next: NextFunction) => {
  try {
    loginSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.issues[0].message,
        errors: error.issues,
        statusCode: 400,
      });
    }
    next(error);
  }
};

export const validateForgotPasswordBody = (req: Request, res: Response, next: NextFunction) => {
  try {
    forgotPasswordSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.issues[0].message,
        errors: error.issues,
        statusCode: 400,
      });
    }
    next(error);
  }
};

export const validateResetPasswordBody = (req: Request, res: Response, next: NextFunction) => {
  try {
    resetPasswordSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.issues[0].message,
        errors: error.issues,
        statusCode: 400,
      });
    }
    next(error);
  }
};

export const validateChangePasswordBody = (req: Request, res: Response, next: NextFunction) => {
  try {
    changePasswordSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.issues[0].message,
        errors: error.issues,
        statusCode: 400,
      });
    }
    next(error);
  }
};

export const validateUpdateProfileBody = (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = req.user?.role;
    const bodyKeys = Object.keys(req.body);

    // Strict role-based field checking
    if (role === Role.DOCTOR) {
      const invalidFields = bodyKeys.filter(key => PATIENT_ONLY_FIELDS.includes(key));
      if (invalidFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Doctors cannot update patient-specific fields: ${invalidFields.join(', ')}`,
          statusCode: 400,
        });
      }
    } else if (role === Role.PATIENT) {
      const invalidFields = bodyKeys.filter(key => DOCTOR_ONLY_FIELDS.includes(key));
      if (invalidFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Patients cannot update doctor-specific fields: ${invalidFields.join(', ')}`,
          statusCode: 400,
        });
      }
    }

    updateProfileSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.issues[0].message,
        errors: error.issues,
        statusCode: 400,
      });
    }
    next(error);
  }
};
