'use client';

import Link from 'next/link';
import { useAuth } from '@/src/auth/auth.context';
import { APP_ROUTES } from '@/src/constants/app-routes';

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href={APP_ROUTES.HOME} className="flex items-center space-x-2">
            <div className="bg-primary p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-primary">MediScheduler</span>
          </Link>

          <nav>
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="hidden md:inline text-gray-600">Welcome, {user?.firstName}!</span>
                <Link
                  href={user?.role === 'DOCTOR' ? APP_ROUTES.DASHBOARD.DOCTOR : APP_ROUTES.DASHBOARD.PATIENT}
                  className="btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Dashboard
                </Link>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link href={APP_ROUTES.AUTH.LOGIN} className="btn btn-ghost text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-lg">
                  Login
                </Link>
                <Link href={APP_ROUTES.AUTH.REGISTER} className="btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12 md:py-24">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-12 md:mb-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 leading-tight mb-4">
              Schedule Healthcare <span className="text-blue-600">Appointments</span> Effortlessly
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-lg">
              Connect with healthcare professionals and manage your appointments in one place.
              Our platform makes healthcare scheduling simple and convenient.
            </p>

            {!isAuthenticated && (
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href={APP_ROUTES.AUTH.REGISTER} className="btn bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium">
                  Get Started
                </Link>
                <Link href={APP_ROUTES.AUTH.LOGIN} className="btn border border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg text-lg font-medium">
                  Sign In
                </Link>
              </div>
            )}

            {isAuthenticated && (
              <div>
                <p className="text-lg text-gray-700 mb-6">
                  Welcome back, {user?.firstName}! Ready to manage your appointments?
                </p>
                <Link
                  href={user?.role === 'DOCTOR' ? APP_ROUTES.DASHBOARD.DOCTOR : APP_ROUTES.DASHBOARD.PATIENT}
                  className="btn bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium"
                >
                  Go to Dashboard
                </Link>
              </div>
            )}
          </div>

          <div className="md:w-1/2 flex justify-center">
            <div className="relative">
              <div className="bg-blue-600 rounded-2xl p-8 w-80 h-80 flex items-center justify-center">
                <div className="bg-white rounded-xl p-6 shadow-xl w-64 h-64 flex flex-col items-center justify-center text-center">
                  <div className="bg-blue-100 p-3 rounded-full mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-lg mb-2">Easy Scheduling</h3>
                  <p className="text-sm text-gray-600">Book appointments in seconds</p>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-green-100 text-green-800 rounded-xl p-4 shadow-lg">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium">Trusted by 10k+ users</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our simple 3-step process makes scheduling healthcare appointments easy and stress-free
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <div className="bg-blue-100 text-blue-800 rounded-full w-16 h-16 flex items-center justify-center mb-6 mx-auto">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Find a Healthcare Provider</h3>
              <p className="text-gray-600">
                Browse through our network of qualified healthcare professionals based on specialty, location, and availability.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <div className="bg-blue-100 text-blue-800 rounded-full w-16 h-16 flex items-center justify-center mb-6 mx-auto">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Schedule Appointment</h3>
              <p className="text-gray-600">
                Select an available time slot and book your appointment with just a few clicks. Receive instant confirmation.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <div className="bg-blue-100 text-blue-800 rounded-full w-16 h-16 flex items-center justify-center mb-6 mx-auto">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Receive Care</h3>
              <p className="text-gray-600">
                Attend your appointment and receive quality healthcare services. Manage follow-ups and prescriptions easily.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">What Our Users Say</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join thousands of satisfied patients and healthcare providers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className={`w-5 h-5 ${i < 4 ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461c.969 0 1.371-1.24.588-1.81L9.049 2.927zm0 0c1.14-.342 1.14-2.127 0-1.785L7.95 3.675c-.783.57-1.838-.197-1.539-1.118l1.07-3.292c.3-.921 1.603-.921 1.902 0l1.07 3.292c.3.921 1.355 1.688.572 1.118L9.049 2.927z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 italic mb-6">
                &ldquo;This platform has revolutionized how I manage my appointments. So convenient and user-friendly!&rdquo;
              </p>
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-800 font-bold">JD</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">John Doe</h4>
                  <p className="text-sm text-gray-500">Patient</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className={`w-5 h-5 ${i < 5 ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461c.969 0 1.371-1.24.588-1.81L9.049 2.927zm0 0c1.14-.342 1.14-2.127 0-1.785L7.95 3.675c-.783.57-1.838-.197-1.539-1.118l1.07-3.292c.3-.921 1.603-.921 1.902 0l1.07 3.292c.3.921 1.355 1.688.572 1.118L9.049 2.927z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 italic mb-6">
                &ldquo;Managing patient appointments has never been easier. Highly recommend this platform!&ldquo;
              </p>
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-800 font-bold">JS</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">Dr. Jane Smith</h4>
                  <p className="text-sm text-gray-500">Healthcare Provider</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className={`w-5 h-5 ${i < 4 ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461c.969 0 1.371-1.24.588-1.81L9.049 2.927zm0 0c1.14-.342 1.14-2.127 0-1.785L7.95 3.675c-.783.57-1.838-.197-1.539-1.118l1.07-3.292c.3-.921 1.603-.921 1.902 0l1.07 3.292c.3.921 1.355 1.688.572 1.118L9.049 2.927z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 italic mb-6">
                &ldquo;The scheduling system has reduced no-shows significantly and improved our workflow.&ldquo;
              </p>
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-800 font-bold">MR</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">Michael Roberts</h4>
                  <p className="text-sm text-gray-500">Clinic Manager</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}