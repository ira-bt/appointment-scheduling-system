'use client';

import ProtectedRoute from '@/src/components/auth/ProtectedRoute';
import { useAuth } from '@/src/auth/auth.context';
import { UserRole } from '@/src/types/user.types';
import ManageAvailability from '@/src/components/doctor/ManageAvalability';
import { useState } from 'react';

export default function DoctorDashboard() {
    const { user, logout } = useAuth();
    const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);

    return (
        <ProtectedRoute allowedRoles={[UserRole.DOCTOR]}>
            <div className="min-h-screen bg-gray-50">
                {/* Navbar */}
                <div className="navbar bg-white shadow-sm px-4 lg:px-8">
                    <div className="flex-1">
                        <span className="text-2xl font-bold text-blue-600">MediScheduler <span className="text-gray-400 font-normal">| Doctor Port</span></span>
                    </div>
                    <div className="flex-none gap-2">
                        <div className="dropdown dropdown-end">
                            <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
                                <div className="w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                    {user?.firstName?.charAt(0)}
                                </div>
                            </label>
                            <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
                                <li><a className="justify-between">My Profile</a></li>
                                <li><button onClick={() => setIsAvailabilityModalOpen(true)}>Availability Settings</button></li>
                                <li><button onClick={logout}>Logout</button></li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 lg:p-8 max-w-7xl mx-auto">
                    <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Welcome back, Dr. {user?.lastName}</h1>
                            <p className="text-gray-600">Here&apos;s an overview of your practice today.</p>
                        </div>
                        <button
                            onClick={() => setIsAvailabilityModalOpen(true)}
                            className="btn bg-blue-600 hover:bg-blue-700 text-white rounded-lg border-none shadow-lg shadow-blue-100 px-6"
                        >
                            Update Availability
                        </button>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="stats shadow bg-white">
                            <div className="stat">
                                <div className="stat-title text-gray-500">Appointments Today</div>
                                <div className="stat-value text-blue-600 text-3xl">0</div>
                                <div className="stat-desc text-green-500">Next one at 10:00 AM</div>
                            </div>
                        </div>

                        <div className="stats shadow bg-white">
                            <div className="stat">
                                <div className="stat-title text-gray-500">Pending Requests</div>
                                <div className="stat-value text-orange-500 text-3xl">0</div>
                                <div className="stat-desc text-gray-400">Needs your review</div>
                            </div>
                        </div>

                        <div className="stats shadow bg-white">
                            <div className="stat">
                                <div className="stat-title text-gray-500">Total Patients</div>
                                <div className="stat-value text-gray-800 text-3xl">0</div>
                                <div className="stat-desc text-gray-400">Lifetime count</div>
                            </div>
                        </div>

                        <div className="stats shadow bg-white">
                            <div className="stat">
                                <div className="stat-title text-gray-500">Total Earnings</div>
                                <div className="stat-value text-green-600 text-3xl">₹0</div>
                                <div className="stat-desc text-gray-400">This month</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                                <h2 className="font-bold text-gray-800">Todays Schedule</h2>
                                <button className="text-blue-600 text-sm font-medium">View Full Calendar</button>
                            </div>
                            <div className="p-8 text-center text-gray-400">
                                <p>No appointments scheduled for today.</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="font-bold text-gray-800 mb-4">Patient Reviews</h2>
                            <div className="text-center py-8 text-gray-400">
                                <p>No reviews received yet.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Availability Modal */}
                {isAvailabilityModalOpen && (
                    <div className="modal modal-open">
                        <div className="modal-box p-0 max-w-4xl bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-2xl">
                            <ManageAvailability onClose={() => setIsAvailabilityModalOpen(false)} />
                        </div>
                        <form method="dialog" className="modal-backdrop">
                            <button onClick={() => setIsAvailabilityModalOpen(false)}>close</button>
                        </form>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
