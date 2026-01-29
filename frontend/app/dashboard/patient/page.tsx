'use client';

import ProtectedRoute from '@/src/components/auth/ProtectedRoute';
import { useAuth } from '@/src/auth/auth.context';
import Link from 'next/link';
import { APP_ROUTES } from '@/src/constants/app-routes';

export default function PatientDashboard() {
    const { user, logout } = useAuth();

    return (
        <ProtectedRoute allowedRoles={['PATIENT']}>
            <div className="min-h-screen bg-gray-50">
                {/* Navbar */}
                <div className="navbar bg-white shadow-sm px-4 lg:px-8">
                    <div className="flex-1">
                        <span className="text-2xl font-bold text-blue-600">MediScheduler</span>
                    </div>
                    <div className="flex-none gap-2">
                        <div className="dropdown dropdown-end">
                            <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
                                <div className="w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                    {user?.firstName?.charAt(0)}
                                </div>
                            </label>
                            <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
                                <li><a className="justify-between">Profile<span className="badge">New</span></a></li>
                                <li><a>Settings</a></li>
                                <li><button onClick={logout}>Logout</button></li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 lg:p-8 max-w-7xl mx-auto">
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">Hello, {user?.firstName}!</h1>
                        <p className="text-gray-600">Welcome to your patient dashboard.</p>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Quick Stats */}
                        <div className="stats shadow bg-white">
                            <div className="stat">
                                <div className="stat-figure text-blue-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                </div>
                                <div className="stat-title">Upcoming Appointments</div>
                                <div className="stat-value text-blue-600">0</div>
                                <div className="stat-desc">Next one: TBD</div>
                            </div>
                        </div>

                        <div className="stats shadow bg-white">
                            <div className="stat">
                                <div className="stat-figure text-secondary">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                                </div>
                                <div className="stat-title">Total Reports</div>
                                <div className="stat-value text-secondary">0</div>
                                <div className="stat-desc">Healthy is wealthy!</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                        <div className="mb-4 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-700">No appointments yet</h2>
                        <p className="text-gray-500 mb-6">You haven't booked any appointments yet. Find a doctor to get started.</p>
                        <Link href={APP_ROUTES.DOCTORS} className="btn btn-primary text-white">Find a Doctor</Link>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
