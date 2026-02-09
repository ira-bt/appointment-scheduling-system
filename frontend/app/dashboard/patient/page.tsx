'use client';

import ProtectedRoute from '@/src/components/auth/ProtectedRoute';
import { useAuth } from '@/src/auth/auth.context';
import Link from 'next/link';
import { APP_ROUTES } from '@/src/constants/app-routes';
import { UserRole } from '@/src/types/user.types';
import { useEffect, useState, useCallback } from 'react';
import { appointmentService } from '@/src/services/appointment.service';
import { Appointment } from '@/src/types/appointment.types';
import AppointmentCard from '@/src/components/appointments/AppointmentCard';
import Pagination from '@/src/components/common/Pagination';
import SortDropdown from '@/src/components/common/SortDropdown';
import { Calendar, Clock, CheckCircle, ArrowRight } from 'lucide-react';

export default function PatientDashboard() {
    const { user, logout } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
    const [type, setType] = useState<'upcoming' | 'past'>('upcoming');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalAppointments, setTotalAppointments] = useState(0);
    const [sortBy, setSortBy] = useState('appointmentStart');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const sortOptions = [
        { label: 'Date (Soonest)', value: 'appointmentStart-asc' },
        { label: 'Date (Latest)', value: 'appointmentStart-desc' },
        { label: 'Status', value: 'status-asc' },
    ];

    const fetchAppointments = useCallback(async () => {
        setIsLoadingAppointments(true);
        try {
            const response = await appointmentService.getPatientAppointments({
                type,
                page,
                limit: 5,
                sortBy,
                sortOrder
            });
            setAppointments(response.data.appointments);
            setTotalPages(response.data.pagination.totalPages);
            setTotalAppointments(response.data.pagination.total);
        } catch (error) {
            console.error('Failed to fetch appointments:', error);
        } finally {
            setIsLoadingAppointments(false);
        }
    }, [type, page, sortBy, sortOrder]);

    useEffect(() => {
        if (user) {
            fetchAppointments();
        }
    }, [user, fetchAppointments]);

    const handleTypeChange = useCallback((newType: 'upcoming' | 'past') => {
        setType(newType);
        setPage(1);
        setSortBy('appointmentStart');
        setSortOrder(newType === 'upcoming' ? 'asc' : 'desc');
    }, []);

    const handleSortChange = useCallback((value: string) => {
        const [field, order] = value.split('-') as [string, 'asc' | 'desc'];
        setSortBy(field);
        setSortOrder(order || 'asc');
        setPage(1);
    }, []);

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
                            <Calendar className="w-4 h-4 mr-2" />
                            Book New Appointment
                        </Link>
                    </header>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        <div className="stats shadow bg-white">
                            <div className="stat">
                                <div className="stat-figure text-blue-600">
                                    <Clock className="w-8 h-8" />
                                </div>
                                <div className="stat-title text-gray-500">Scheduled Appointments</div>
                                <div className="stat-value text-blue-600">{totalAppointments}</div>
                                <div className="stat-desc text-gray-400">Total {type}</div>
                            </div>
                        </div>

                        <div className="stats shadow bg-white">
                            <div className="stat">
                                <div className="stat-figure text-green-600">
                                    <CheckCircle className="w-8 h-8" />
                                </div>
                                <div className="stat-title text-gray-500">Account Status</div>
                                <div className="stat-value text-green-600 text-2xl mt-1">Verified</div>
                                <div className="stat-desc font-medium text-green-600">Patient Dashboard Active</div>
                            </div>
                        </div>
                    </div>

                    {/* Appointments Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="border-b border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="tabs tabs-boxed bg-gray-50 p-1 w-fit">
                                <button
                                    onClick={() => handleTypeChange('upcoming')}
                                    className={`tab h-9 px-4 text-sm font-semibold transition-all ${type === 'upcoming' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Upcoming
                                </button>
                                <button
                                    onClick={() => handleTypeChange('past')}
                                    className={`tab h-9 px-4 text-sm font-semibold transition-all ${type === 'past' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Past History
                                </button>
                            </div>

                            <SortDropdown
                                options={sortOptions}
                                currentValue={`${sortBy}-${sortOrder}`}
                                onSortChange={handleSortChange}
                            />
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

                                    <Pagination
                                        currentPage={page}
                                        totalPages={totalPages}
                                        onPageChange={(p) => setPage(p)}
                                        className="mt-8"
                                    />
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Calendar className="h-10 w-10 text-blue-300" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">No {type} appointments</h3>
                                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                                        {type === 'upcoming'
                                            ? "You don't have any scheduled appointments. Find a doctor to book your next visit."
                                            : "You don't have any past appointment records yet."}
                                    </p>
                                    {type === 'upcoming' && (
                                        <Link href={APP_ROUTES.DOCTORS} className="btn bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-lg shadow-md border-none inline-flex items-center gap-2">
                                            Find a Doctor
                                            <ArrowRight className="w-4 h-4" />
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
