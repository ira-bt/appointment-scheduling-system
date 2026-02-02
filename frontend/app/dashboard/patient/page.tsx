'use client';

import ProtectedRoute from '@/src/components/auth/ProtectedRoute';
import { useAuth } from '@/src/auth/auth.context';
import Link from 'next/link';
import { APP_ROUTES } from '@/src/constants/app-routes';
import { UserRole } from '@/src/types/user.types';
import { useEffect, useState } from 'react';
import { appointmentService } from '@/src/services/appointment.service';
import { Appointment } from '@/src/types/appointment.types';
import AppointmentCard from '@/src/components/appointments/AppointmentCard';

export default function PatientDashboard() {
    const { user, logout } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
    const [type, setType] = useState<'upcoming' | 'past'>('upcoming');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const fetchAppointments = async () => {
            setIsLoadingAppointments(true);
            try {
                const response = await appointmentService.getPatientAppointments({
                    type,
                    page,
                    limit: 5
                });
                setAppointments(response.data.appointments);
                setTotalPages(response.data.pagination.totalPages);
            } catch (error) {
                console.error('Failed to fetch appointments:', error);
            } finally {
                setIsLoadingAppointments(false);
            }
        };

        if (user) {
            fetchAppointments();
        }
    }, [user, type, page]);

    const handleTypeChange = (newType: 'upcoming' | 'past') => {
        setType(newType);
        setPage(1);
    };

    return (
        <ProtectedRoute allowedRoles={[UserRole.PATIENT]}>
            <div className="min-h-screen bg-gray-50 flex flex-col">
                {/* Navbar */}
                <div className="navbar bg-white shadow-sm px-4 lg:px-8 shrink-0">
                    <div className="flex-1">
                        <Link href={APP_ROUTES.HOME} className="text-2xl font-bold text-blue-600">MediScheduler</Link>
                    </div>
                    <div className="flex-none gap-2">
                        <div className="dropdown dropdown-end">
                            <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
                                <div className="w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                    {user?.firstName?.charAt(0)}
                                </div>
                            </label>
                            <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
                                <li><a className="justify-between">Profile</a></li>
                                <li><a>Settings</a></li>
                                <li><button onClick={logout} className="text-red-600">Logout</button></li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 lg:p-8 max-w-5xl mx-auto w-full flex-grow">
                    <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Hello, {user?.firstName}!</h1>
                            <p className="text-gray-600">Manage your appointments and healthcare needs.</p>
                        </div>
                        <Link
                            href={APP_ROUTES.DOCTORS}
                            className="btn bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-lg shadow-md border-none w-full md:w-auto"
                        >
                            Book New Appointment
                        </Link>
                    </header>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        <div className="stats shadow bg-white">
                            <div className="stat">
                                <div className="stat-figure text-blue-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                </div>
                                <div className="stat-title text-gray-500">Upcoming Appointments</div>
                                <div className="stat-value text-blue-600">{type === 'upcoming' ? appointments.length : '-'}</div>
                            </div>
                        </div>

                        <div className="stats shadow bg-white">
                            <div className="stat">
                                <div className="stat-figure text-green-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                </div>
                                <div className="stat-title text-gray-500">Healthy Habits</div>
                                <div className="stat-desc font-medium text-green-600">Keep up the good work!</div>
                            </div>
                        </div>
                    </div>

                    {/* Appointments Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="border-b border-gray-100 p-2">
                            <div className="tabs tabs-boxed bg-white gap-2">
                                <button
                                    onClick={() => handleTypeChange('upcoming')}
                                    className={`tab h-10 px-6 font-medium transition-all ${type === 'upcoming' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                                >
                                    Upcoming
                                </button>
                                <button
                                    onClick={() => handleTypeChange('past')}
                                    className={`tab h-10 px-6 font-medium transition-all ${type === 'past' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                                >
                                    Past History
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            {isLoadingAppointments ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <span className="loading loading-spinner loading-lg text-blue-600"></span>
                                    <p className="mt-4 text-gray-500 font-medium">Loading your appointments...</p>
                                </div>
                            ) : appointments.length > 0 ? (
                                <div className="space-y-4">
                                    {appointments.map((appointment) => (
                                        <AppointmentCard key={appointment.id} appointment={appointment} />
                                    ))}

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="flex justify-center mt-8">
                                            <div className="join bg-white border border-gray-100 shadow-sm">
                                                <button
                                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                                    disabled={page === 1}
                                                    className="join-item btn btn-ghost disabled:bg-transparent"
                                                >
                                                    «
                                                </button>
                                                <button className="join-item btn btn-ghost pointer-events-none">
                                                    Page {page} of {totalPages}
                                                </button>
                                                <button
                                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                                    disabled={page === totalPages}
                                                    className="join-item btn btn-ghost disabled:bg-transparent"
                                                >
                                                    »
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">No {type} appointments</h3>
                                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                                        {type === 'upcoming'
                                            ? "You don't have any scheduled appointments. Find a doctor to book your next visit."
                                            : "You don't have any past appointment records yet."}
                                    </p>
                                    {type === 'upcoming' && (
                                        <Link href={APP_ROUTES.DOCTORS} className="btn bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-lg shadow-md border-none">
                                            Find a Doctor
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
