'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/auth/auth.context';
import { getErrorMessage } from '@/src/utils/api-error';
import { REGEX } from '@/src/constants/regex.constants';
import { APP_ROUTES } from '@/src/constants/app-routes';
import { UserRole } from '@/src/types/user.types';
import { CITIES, SPECIALTIES, BLOOD_TYPES } from '@/src/constants/healthcare.constants';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: UserRole.PATIENT,
    city: '',
    // Patient-specific fields
    bloodType: '',
    allergies: '',
    medicalHistory: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    // Doctor-specific fields
    bio: '',
    specialty: '',
    experience: 0,
    qualification: '',
    consultationFee: 500,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { register, isLoading } = useAuth();

  // Validation functions
  const validateField = (name: string, value: string | number) => {
    switch (name) {
      case 'email':
        if (!value) return 'Email is required';
        if (!REGEX.EMAIL.test(value as string)) return 'Email is invalid';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if ((value as string).length < 8) return 'Password must be at least 8 characters';
        if (!REGEX.PASSWORD.test(value as string))
          return 'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character';
        return '';
      case 'firstName':
        if (!value) return 'First name is required';
        if (!REGEX.NAME.test(value as string)) return 'First name must contain only letters and be at least 2 characters';
        return '';
      case 'lastName':
        if (!value) return 'Last name is required';
        if (!REGEX.NAME.test(value as string)) return 'Last name must contain only letters and be at least 2 characters';
        return '';
      case 'phoneNumber':
        if (value && !REGEX.PHONE.test(value as string)) return 'Phone number must be 10 digits';
        return '';
      case 'emergencyContactPhone':
        if (value && !REGEX.PHONE.test(value as string)) return 'Emergency contact phone must be 10 digits';
        return '';
      case 'experience':
        if (value && (value as number) < 0) return 'Experience cannot be negative';
        return '';
      case 'consultationFee':
        if (value && (value as number) < 0) return 'Consultation fee cannot be negative';
        return '';
      case 'city':
        if (!value) return 'City is required';
        return '';
      case 'specialty':
        if (formData.role === UserRole.DOCTOR && !value) return 'Specialty is required';
        return '';
      case 'bloodType':
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const fieldValue = name === 'experience' || name === 'consultationFee' ? Number(value) : value;

    setFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }));

    // Validate the field and update errors
    const fieldError = validateField(name, fieldValue);
    setErrors(prev => ({
      ...prev,
      [name]: fieldError
    }));

    const newData = {
      ...formData,
      [name]: fieldValue
    };

    // Check if form is valid after each change using latest data
    validateForm(newData);
  };

  const validateForm = (data = formData) => {
    const newErrors: Record<string, string> = {};

    // Basic required fields
    if (!data.firstName.trim()) newErrors.firstName = 'First name is required';
    else if (!REGEX.NAME.test(data.firstName)) newErrors.firstName = 'First name must contain only letters and be at least 2 characters';

    if (!data.lastName.trim()) newErrors.lastName = 'Last name is required';
    else if (!REGEX.NAME.test(data.lastName)) newErrors.lastName = 'Last name must contain only letters and be at least 2 characters';

    if (!data.email.trim()) newErrors.email = 'Email is required';
    else if (!REGEX.EMAIL.test(data.email)) newErrors.email = 'Email is invalid';

    if (!data.password) newErrors.password = 'Password is required';
    // else if (data.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    else if (!REGEX.PASSWORD.test(data.password))
      newErrors.password = 'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character, min length 8';

    if (!data.city) newErrors.city = 'City is required';

    // Phone number validation
    if (data.phoneNumber && !REGEX.PHONE.test(data.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be 10 digits';
    }

    // Role-specific validations
    if (data.role === UserRole.PATIENT) {
      if (!data.bloodType) newErrors.bloodType = 'Blood type is required';
      if (data.emergencyContactPhone && !REGEX.PHONE.test(data.emergencyContactPhone)) {
        newErrors.emergencyContactPhone = 'Emergency contact phone must be 10 digits';
      }
    }

    if (data.role === UserRole.DOCTOR) {
      if (!data.specialty) newErrors.specialty = 'Specialty is required';
      if (data.experience < 0) newErrors.experience = 'Experience cannot be negative';
      if (data.consultationFee < 0) newErrors.consultationFee = 'Consultation fee cannot be negative';
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    setIsFormValid(isValid);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate the form
    if (!validateForm()) {
      return;
    }

    try {
      // Prepare registration data with only the fields needed
      const registrationData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
        city: formData.city,
        // Patient-specific fields
        bloodType: formData.bloodType,
        allergies: formData.allergies,
        medicalHistory: formData.medicalHistory,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        // Doctor-specific fields
        bio: formData.bio,
        specialty: formData.specialty,
        experience: formData.experience,
        qualification: formData.qualification,
        consultationFee: formData.consultationFee,
      };

      const response = await register(registrationData);
      if (response) {
        const role = response.user.role;
        if (role === UserRole.PATIENT) {
          router.push(APP_ROUTES.DASHBOARD.PATIENT);
        } else if (role === UserRole.DOCTOR) {
          router.push(APP_ROUTES.DASHBOARD.DOCTOR);
        } else {
          router.push(APP_ROUTES.DASHBOARD.BASE);
        }
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="card w-full max-w-2xl bg-white shadow-sm border border-gray-200">
        <div className="card-body p-6 sm:p-10">
          <div className="text-center mb-8">
            <div className="bg-blue-600 p-4 rounded-3xl w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-100 ring-4 ring-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">Create Account</h1>
            <p className="text-slate-500 mt-2 text-sm sm:text-base">Join our healthcare platform today</p>
          </div>

          {error && (
            <div className="alert alert-error mb-6 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label pb-2">
                  <span className="label-text font-medium text-gray-700">First Name</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="First name"
                  className={`input input-bordered w-full px-4 py-3 rounded-lg border ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
                {errors.firstName && (
                  <label className="label pt-2">
                    <span className="label-text-alt text-red-500 flex items-start whitespace-normal">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{errors.firstName}</span>
                    </span>
                  </label>
                )}
              </div>
              <div className="form-control">
                <label className="label pb-2">
                  <span className="label-text font-medium text-gray-700">Last Name</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last name"
                  className={`input input-bordered w-full px-4 py-3 rounded-lg border ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
                {errors.lastName && (
                  <label className="label pt-2">
                    <span className="label-text-alt text-red-500 flex items-start whitespace-normal">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{errors.lastName}</span>
                    </span>
                  </label>
                )}
              </div>
            </div>

            <div className="form-control">
              <label className="label pb-2">
                <span className="label-text font-medium text-gray-700">Email</span>
              </label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                className={`input input-bordered w-full px-4 py-3 rounded-lg border ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                value={formData.email}
                onChange={handleChange}
                required
              />
              {errors.email && (
                <label className="label pt-2">
                  <span className="label-text-alt text-red-500 flex items-start whitespace-normal">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{errors.email}</span>
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label pb-2">
                <span className="label-text font-medium text-gray-700">Phone Number</span>
              </label>
              <input
                type="tel"
                name="phoneNumber"
                placeholder="Enter your phone number"
                className={`input input-bordered w-full px-4 py-3 rounded-lg border ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`}
                value={formData.phoneNumber}
                onChange={handleChange}
              />
              {errors.phoneNumber && (
                <label className="label pt-2">
                  <span className="label-text-alt text-red-500 flex items-start whitespace-normal">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{errors.phoneNumber}</span>
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label pb-2">
                <span className="label-text font-medium text-gray-700">City</span>
              </label>
              <select
                name="city"
                className={`select select-bordered w-full px-4 py-3 rounded-lg border ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                value={formData.city}
                onChange={handleChange}
                required
              >
                <option value="">Select your city</option>
                {CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              {errors.city && (
                <label className="label pt-2">
                  <span className="label-text-alt text-red-500 flex items-start whitespace-normal">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{errors.city}</span>
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label pb-2">
                <span className="label-text font-medium text-gray-700">Role</span>
              </label>
              <select
                name="role"
                className="select select-bordered w-full px-4 py-3 rounded-lg border border-gray-300"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value={UserRole.PATIENT}>Patient</option>
                <option value={UserRole.DOCTOR}>Healthcare Provider</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label pb-2">
                <span className="label-text font-medium text-gray-700">Password</span>
              </label>
              <input
                type="password"
                name="password"
                placeholder="Create a password"
                className={`input input-bordered w-full px-4 py-3 rounded-lg border ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                value={formData.password}
                onChange={handleChange}
                required
              />
              {errors.password && (
                <label className="label pt-2">
                  <span className="label-text-alt text-red-500 flex items-start whitespace-normal">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{errors.password}</span>
                  </span>
                </label>
              )}
            </div>

            {/* Role-specific fields */}
            {formData.role === UserRole.PATIENT && (
              <div className="space-y-6 p-6 sm:p-8 bg-blue-50/50 rounded-3xl border border-blue-100 flex flex-col gap-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-black text-blue-600 uppercase tracking-wider">Patient Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-control">
                    <label className="label pb-2">
                      <span className="label-text font-medium text-gray-700">Blood Type</span>
                    </label>
                    <select
                      name="bloodType"
                      className="select select-bordered w-full px-4 py-3 rounded-lg border border-gray-300"
                      value={formData.bloodType}
                      onChange={handleChange}
                    >
                      <option value="">Select blood type</option>
                      {BLOOD_TYPES.map(type => (
                        <option key={type} value={type}>
                          {type.replace('_POS', '+').replace('_NEG', '-')}
                        </option>
                      ))}
                    </select>
                    {errors.bloodType && (
                      <label className="label pt-2">
                        <span className="label-text-alt text-red-500 flex items-start whitespace-normal">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{errors.bloodType}</span>
                        </span>
                      </label>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label pb-2">
                      <span className="label-text font-medium text-gray-700">Emergency Contact Name</span>
                    </label>
                    <input
                      type="text"
                      name="emergencyContactName"
                      placeholder="Emergency contact name"
                      className="input input-bordered w-full px-4 py-3 rounded-lg border border-gray-300"
                      value={formData.emergencyContactName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-control">
                    <label className="label pb-2">
                      <span className="label-text font-medium text-gray-700">Emergency Contact Phone</span>
                    </label>
                    <input
                      type="tel"
                      name="emergencyContactPhone"
                      placeholder="Emergency contact phone"
                      className={`input input-bordered w-full px-4 py-3 rounded-lg border ${errors.emergencyContactPhone ? 'border-red-500' : 'border-gray-300'}`}
                      value={formData.emergencyContactPhone}
                      onChange={handleChange}
                    />
                    {errors.emergencyContactPhone && (
                      <label className="label pt-2">
                        <span className="label-text-alt text-red-500 flex items-start whitespace-normal">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{errors.emergencyContactPhone}</span>
                        </span>
                      </label>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label pb-2">
                      <span className="label-text font-medium text-gray-700">Allergies</span>
                    </label>
                    <input
                      type="text"
                      name="allergies"
                      placeholder="Known allergies"
                      className="input input-bordered w-full px-4 py-3 rounded-lg border border-gray-300"
                      value={formData.allergies}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label pb-2">
                    <span className="label-text font-medium text-gray-700">Medical History</span>
                  </label>
                  <textarea
                    name="medicalHistory"
                    placeholder="Past surgeries, treatments, chronic conditions"
                    className="textarea textarea-bordered w-full px-4 py-3 rounded-lg border border-gray-300 min-h-[100px]"
                    value={formData.medicalHistory}
                    onChange={handleChange}
                    rows={3}
                  ></textarea>
                </div>
              </div>
            )}

            {formData.role === UserRole.DOCTOR && (
              <div className="space-y-6 p-6 sm:p-8 bg-emerald-50/50 rounded-3xl border border-emerald-100 flex flex-col gap-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-black text-emerald-600 uppercase tracking-wider">Provider Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-control">
                    <label className="label pb-2">
                      <span className="label-text font-medium text-gray-700">Years of Experience</span>
                    </label>
                    <input
                      type="number"
                      name="experience"
                      placeholder="Years of experience"
                      className={`input input-bordered w-full px-4 py-3 rounded-lg border ${errors.experience ? 'border-red-500' : 'border-gray-300'}`}
                      value={formData.experience}
                      onChange={handleChange}
                      min="0"
                    />
                    {errors.experience && (
                      <label className="label pt-2">
                        <span className="label-text-alt text-red-500 flex items-start whitespace-normal">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{errors.experience}</span>
                        </span>
                      </label>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label pb-2">
                      <span className="label-text font-medium text-gray-700">Qualification</span>
                    </label>
                    <input
                      type="text"
                      name="qualification"
                      placeholder="Medical qualifications"
                      className="input input-bordered w-full px-4 py-3 rounded-lg border border-gray-300"
                      value={formData.qualification}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label pb-2">
                    <span className="label-text font-medium text-gray-700">Specialty</span>
                  </label>
                  <select
                    name="specialty"
                    className={`select select-bordered w-full px-4 py-3 rounded-lg border ${errors.specialty ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.specialty}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select your specialty</option>
                    {SPECIALTIES.map(specialty => (
                      <option key={specialty} value={specialty}>{specialty}</option>
                    ))}
                  </select>
                  {errors.specialty && (
                    <label className="label pt-2">
                      <span className="label-text-alt text-red-500 flex items-start whitespace-normal">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{errors.specialty}</span>
                      </span>
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-control">
                    <label className="label pb-2">
                      <span className="label-text font-medium text-gray-700">Consultation Fee ($)</span>
                    </label>
                    <input
                      type="number"
                      name="consultationFee"
                      placeholder="Consultation fee"
                      className={`input input-bordered w-full px-4 py-3 rounded-lg border ${errors.consultationFee ? 'border-red-500' : 'border-gray-300'}`}
                      value={formData.consultationFee}
                      onChange={handleChange}
                      min="0"
                    />
                    {errors.consultationFee && (
                      <label className="label pt-2">
                        <span className="label-text-alt text-red-500 flex items-start whitespace-normal">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{errors.consultationFee}</span>
                        </span>
                      </label>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label pb-2">
                      <span className="label-text font-medium text-gray-700">Bio</span>
                    </label>
                    <input
                      type="text"
                      name="bio"
                      placeholder="Short bio"
                      className="input input-bordered w-full px-4 py-3 rounded-lg border border-gray-300"
                      value={formData.bio}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className={`btn ${isFormValid && !isLoading ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'} text-white w-full py-3 rounded-lg font-medium`}
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <span className="loading loading-spinner loading-xs mr-2"></span>
                  Creating account...
                </span>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>

          <br></br>
          <div className="text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href={APP_ROUTES.AUTH.LOGIN} className="text-blue-600 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}