'use client';

import ProtectedRoute from '@/src/components/auth/ProtectedRoute';
import { useAuth } from '@/src/auth/auth.context';
import { UserRole } from '@/src/types/user.types';
import ManageAvailability from '@/src/components/doctor/ManageAvalability';
import { useState, useEffect, useMemo } from 'react';
import { doctorService } from '@/src/services/doctor.service';
import { Appointment, AppointmentStatus } from '@/src/types/appointment.types';
import { DashboardTab } from '@/src/types/doctor.types';
import DoctorAppointmentCard from '@/src/components/doctor/DoctorAppointmentCard';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/src/utils/api-error';
import { formatBloodType } from '@/src/utils/healthcare';
import { Loader2, Users, CalendarDays, Clock, IndianRupee, CreditCard } from 'lucide-react';

export default function DoctorDashboard() {
    const { user, logout } = useAuth();
    const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<DashboardTab>(DashboardTab.REQUESTS);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const response = await doctorService.getAppointments({ limit: 50 });
            setAppointments(response.data.appointments);
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, status: AppointmentStatus.APPROVED | AppointmentStatus.REJECTED) => {
        try {
            setActionLoading(true);
            await doctorService.updateAppointmentStatus(id, status);
            toast.success(`Appointment ${status.toLowerCase()} successfully`);
            fetchAppointments();
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setActionLoading(false);
        }
    };

    // Derived statistics
    const stats = useMemo(() => {
        const today = new Date().toDateString();
        const pending = appointments.filter(a => a.status === AppointmentStatus.PENDING).length;
        const totalPatients = new Set(appointments.map(a => a.patientId)).size;
        const todayCount = appointments.filter(a =>
            new Date(a.appointmentStart).toDateString() === today &&
            (a.status === AppointmentStatus.APPROVED || a.status === AppointmentStatus.CONFIRMED)
        ).length;

        // Estimated earnings (sum of completed consultations)
        const earnings = appointments.reduce((sum, app) => {
            if (app.status === AppointmentStatus.COMPLETED) {
                return sum + (app.consultationFee || 500);
            }
            return sum;
        }, 0);

        return { pending, totalPatients, todayCount, earnings };
    }, [appointments]);

    const filteredAppointments = useMemo(() => {
        if (activeTab === DashboardTab.REQUESTS) {
            return appointments.filter(a => a.status === AppointmentStatus.PENDING);
        } else if (activeTab === DashboardTab.APPROVED) {
            return appointments.filter(a => a.status === AppointmentStatus.APPROVED);
        } else {
            return appointments.filter(a => a.status === AppointmentStatus.CONFIRMED || a.status === AppointmentStatus.COMPLETED);
        }
    }, [appointments, activeTab]);

    return (
        <ProtectedRoute allowedRoles={[UserRole.DOCTOR]}>
            <div className="min-h-screen bg-gray-50">
                {/* Navbar */}
                <div className="navbar bg-white shadow-sm px-4 lg:px-8 border-b border-gray-100">
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
                        <div className="stats shadow-sm bg-white border border-gray-100">
                            <div className="stat">
                                <div className="stat-title text-gray-500 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-blue-500" />
                                    Today&apos;s Sessions
                                </div>
                                <div className="stat-value text-blue-600 text-3xl">{stats.todayCount}</div>
                                <div className="stat-desc text-gray-400">Scheduled for today</div>
                            </div>
                        </div>

                        <div className="stats shadow-sm bg-white border border-gray-100">
                            <div className="stat">
                                <div className="stat-title text-gray-500 flex items-center gap-2">
                                    <CalendarDays className="w-4 h-4 text-orange-500" />
                                    Pending Requests
                                </div>
                                <div className="stat-value text-orange-500 text-3xl">{stats.pending}</div>
                                <div className="stat-desc text-gray-400">Needs your review</div>
                            </div>
                        </div>

                        <div className="stats shadow-sm bg-white border border-gray-100">
                            <div className="stat">
                                <div className="stat-title text-gray-500 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-purple-500" />
                                    Total Patients
                                </div>
                                <div className="stat-value text-gray-800 text-3xl">{stats.totalPatients}</div>
                                <div className="stat-desc text-gray-400">Engaged over lifetime</div>
                            </div>
                        </div>

                        <div className="stats shadow-sm bg-white border border-gray-100">
                            <div className="stat">
                                <div className="stat-title text-gray-500 flex items-center gap-2">
                                    <IndianRupee className="w-4 h-4 text-green-500" />
                                    Monthly Earnings
                                </div>
                                <div className="stat-value text-green-600 text-3xl">₹{stats.earnings}</div>
                                <div className="stat-desc text-gray-400">Consultations completed</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        {/* Tabs */}
                        <div className="tabs tabs-boxed bg-white w-fit border border-gray-100 p-1">
                            <button
                                onClick={() => setActiveTab(DashboardTab.REQUESTS)}
                                className={`tab transition-all ${activeTab === DashboardTab.REQUESTS ? 'bg-blue-600 text-white rounded-lg' : 'text-gray-500'}`}
                            >
                                Requests
                                {stats.pending > 0 && <span className="ml-2 badge badge-sm bg-orange-500 text-white border-none">{stats.pending}</span>}
                            </button>
                            <button
                                onClick={() => setActiveTab(DashboardTab.APPROVED)}
                                className={`tab transition-all ${activeTab === DashboardTab.APPROVED ? 'bg-blue-600 text-white rounded-lg' : 'text-gray-500'}`}
                            >
                                Approved
                            </button>
                            <button
                                onClick={() => setActiveTab(DashboardTab.SCHEDULED)}
                                className={`tab transition-all ${activeTab === DashboardTab.SCHEDULED ? 'bg-blue-600 text-white rounded-lg' : 'text-gray-500'}`}
                            >
                                Scheduled
                            </button>
                        </div>

                        {/* List */}
                        <div className="min-h-[400px]">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                                    <p className="text-gray-500 font-medium">Loading your appointments...</p>
                                </div>
                            ) : filteredAppointments.length > 0 ? (
                                <div className="space-y-4">
                                    {filteredAppointments.map((appointment) => (
                                        <DoctorAppointmentCard
                                            key={appointment.id}
                                            appointment={appointment}
                                            onStatusUpdate={handleStatusUpdate}
                                            loading={actionLoading}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm text-center px-4">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                        <Users className="w-10 h-10 text-gray-300" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                                        No {activeTab === DashboardTab.REQUESTS ? 'pending requests' : activeTab === DashboardTab.APPROVED ? 'approved appointments' : 'scheduled appointments'}
                                    </h3>
                                    <p className="text-gray-500 max-w-sm">
                                        {activeTab === DashboardTab.REQUESTS
                                            ? "You're all caught up! New patient booking requests will appear here."
                                            : activeTab === DashboardTab.APPROVED
                                                ? "Appointments approved by you but awaiting patient payment."
                                                : "You don't have any confirmed or completed appointments yet."}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Availability Modal */}
                {isAvailabilityModalOpen && (
                    <div className="modal modal-open px-4">
                        <div className="modal-box p-0 max-w-4xl h-[85vh] bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-2xl">
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
