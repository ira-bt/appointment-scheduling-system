'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/auth/auth.context';
import { getErrorMessage } from '@/src/utils/api-error';
import { REGEX } from '@/src/constants/regex.constants';
import { APP_ROUTES } from '@/src/constants/app-routes';
import { UserRole } from '@/src/types/user.types';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const router = useRouter();
  const { login, isLoading } = useAuth();

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'email':
        if (!value) return 'Email is required';
        if (!REGEX.EMAIL.test(value)) return 'Email is invalid';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!REGEX.PASSWORD.test(value as string))
          return 'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validate the field and update errors
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));

    // Check if form is valid after each change
    setTimeout(() => {
      validateForm();
    }, 0);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!REGEX.EMAIL.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    // else if (formData.password.length < 8) {
    //   newErrors.password = 'Password must be at least 8 characters';
    // } 
    // else if (!REGEX.PASSWORD.test(formData.password)) {
    //   newErrors.password = 'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character, min length 8';
    // }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0 && !!formData.email && !!formData.password;
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
      const response = await login(formData.email, formData.password);
      const role = response.user.role;

      if (role === UserRole.PATIENT) {
        router.push(APP_ROUTES.DASHBOARD.PATIENT);
      } else if (role === UserRole.DOCTOR) {
        router.push(APP_ROUTES.DASHBOARD.DOCTOR);
      } else {
        router.push(APP_ROUTES.DASHBOARD.BASE);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="card w-full max-w-md bg-white shadow-sm border border-gray-200">
        <div className="card-body p-8">
          <div className="text-center mb-8">
            <div className="bg-blue-600 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Welcome Back</h1>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
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
                  <span className="label-text-alt text-red-500 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.email}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label pb-2">
                <span className="label-text font-medium text-gray-700">Password</span>
              </label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                className={`input input-bordered w-full px-4 py-3 rounded-lg border ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                value={formData.password}
                onChange={handleChange}
                required
              />
              {errors.password && (
                <label className="label pt-2">
                  <span className="label-text-alt text-red-500 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.password}
                  </span>
                </label>
              )}
            </div>

            <div className="flex items-center justify-end">
              <Link href={APP_ROUTES.AUTH.FORGOT_PASSWORD} title="Forgot Password" className="text-sm font-medium text-blue-600 hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className={`btn ${isFormValid && !isLoading ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'} text-white w-full py-3 rounded-lg font-medium`}
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <span className="loading loading-spinner loading-xs mr-2"></span>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <br></br>
          <div className="text-center">
            <p className="text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href={APP_ROUTES.AUTH.REGISTER} className="text-blue-600 font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}