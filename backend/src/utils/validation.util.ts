import { Request, Response, NextFunction } from 'express';

// Validation utility functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  // Password must be at least 8 characters with at least 1 uppercase, 1 lowercase, 1 number, and 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const validateName = (name: string): boolean => {
  // Name must contain only alphabetic characters and be at least 2 characters
  const nameRegex = /^[A-Za-z]{2,}$/;
  return nameRegex.test(name);
};

export const validatePhoneNumber = (phone: string): boolean => {
  if (!phone) return true; // Phone is optional
  // Phone number must be 10-15 digits
  const phoneRegex = /^\+?(\d{10}|\d{11}|\d{12}|\d{13}|\d{14}|\d{15})$/;
  return phoneRegex.test(phone);
};

// No need for this function since we're not using it in the validation
// export const validateString = (str: string, minLength: number = 1): boolean => {
//   return str && str.length >= minLength;
// };

export const validateNumber = (num: number, min: number = 0): boolean => {
  return num !== undefined && num !== null && num >= min;
};

// Validation middleware
export const validateRegisterBody = (req: Request, res: Response, next: NextFunction) => {
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
  } = req.body;

  // Required fields validation
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
      statusCode: 400,
    });
  }

  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Password is required',
      statusCode: 400,
    });
  }

  if (!firstName) {
    return res.status(400).json({
      success: false,
      message: 'First name is required',
      statusCode: 400,
    });
  }

  if (!lastName) {
    return res.status(400).json({
      success: false,
      message: 'Last name is required',
      statusCode: 400,
    });
  }

  if (!role) {
    return res.status(400).json({
      success: false,
      message: 'Role is required',
      statusCode: 400,
    });
  }

  // Format validation
  if (!validateEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format',
      statusCode: 400,
    });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters with at least 1 uppercase, 1 lowercase, 1 number, and 1 special character',
      statusCode: 400,
    });
  }

  if (firstName && typeof firstName === 'string' && !validateName(firstName)) {
    return res.status(400).json({
      success: false,
      message: 'First name must contain only letters and be at least 2 characters',
      statusCode: 400,
    });
  }

  if (lastName && typeof lastName === 'string' && !validateName(lastName)) {
    return res.status(400).json({
      success: false,
      message: 'Last name must contain only letters and be at least 2 characters',
      statusCode: 400,
    });
  }

  if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid phone number format',
      statusCode: 400,
    });
  }

  // Role-specific validation
  if (role === 'DOCTOR') {
    if (experience !== undefined && experience !== null && typeof experience === 'number' && experience < 0) {
      return res.status(400).json({
        success: false,
        message: 'Experience cannot be negative',
        statusCode: 400,
      });
    }
    if (consultationFee !== undefined && consultationFee !== null && typeof consultationFee === 'number' && consultationFee < 0) {
      return res.status(400).json({
        success: false,
        message: 'Consultation fee cannot be negative',
        statusCode: 400,
      });
    }
  }

  if (role === 'PATIENT') {
    if (emergencyContactPhone && !validatePhoneNumber(emergencyContactPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid emergency contact phone number format',
        statusCode: 400,
      });
    }

    // Validate blood type if provided
    if (bloodType && !['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG'].includes(bloodType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blood type',
        statusCode: 400,
      });
    }
  }

  if (role === 'DOCTOR') {
    // Validate experience if provided
    if (experience !== undefined && experience !== null && typeof experience === 'number' && experience < 0) {
      return res.status(400).json({
        success: false,
        message: 'Experience cannot be negative',
        statusCode: 400,
      });
    }

    // Validate consultation fee if provided
    if (consultationFee !== undefined && consultationFee !== null && typeof consultationFee === 'number' && consultationFee < 0) {
      return res.status(400).json({
        success: false,
        message: 'Consultation fee cannot be negative',
        statusCode: 400,
      });
    }
  }

  next();
};

export const validateLoginBody = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
      statusCode: 400,
    });
  }

  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Password is required',
      statusCode: 400,
    });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format',
      statusCode: 400,
    });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters with at least 1 uppercase, 1 lowercase, 1 number, and 1 special character',
      statusCode: 400,
    });
  }

  next();
};