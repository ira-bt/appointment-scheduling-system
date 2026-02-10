'use client';

import ProtectedRoute from '@/src/components/auth/ProtectedRoute';
import { useAuth } from '@/src/auth/auth.context';
import { UserRole } from '@/src/types/user.types';
import ManageAvailability from '@/src/components/doctor/ManageAvalability';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { doctorService } from '@/src/services/doctor.service';
import { Appointment, AppointmentStatus } from '@/src/types/appointment.types';
import { DashboardTab } from '@/src/types/doctor.types';
import DoctorAppointmentCard from '@/src/components/doctor/DoctorAppointmentCard';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/src/utils/api-error';
import { formatBloodType } from '@/src/utils/healthcare';
import { Loader2, Users, CalendarDays, Clock, IndianRupee, CreditCard, BarChart3, ChevronDown, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { APP_ROUTES } from '@/src/constants/app-routes';
import AnalyticsTab from '@/src/components/analytics/AnalyticsTab';
import Pagination from '@/src/components/common/Pagination';
import SortDropdown from '@/src/components/common/SortDropdown';
import FilterBar from '@/src/components/common/FilterBar';
import UserAvatar from '@/src/components/common/UserAvatar';

export default function DoctorDashboard() {
    const { user, logout } = useAuth();
    const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<DashboardTab>(DashboardTab.ANALYTICS);
    const [processingAction, setProcessingAction] = useState<{ id: string, status: AppointmentStatus } | null>(null);
    const [pendingCount, setPendingCount] = useState(0);

    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalAppointments, setTotalAppointments] = useState(0);

    // Sorting state
    const [sortBy, setSortBy] = useState('appointmentStart');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const sortOptions = [
        { label: 'Date (Soonest)', value: 'appointmentStart-asc' },
        { label: 'Date (Latest)', value: 'appointmentStart-desc' },
        { label: 'Status', value: 'status-asc' },
    ];

    const fetchStats = useCallback(async () => {
        try {
            const response = await doctorService.getAppointments({
                status: AppointmentStatus.PENDING,
                page: 1,
                limit: 1
            });
            setPendingCount(response.data.pagination.total);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }, []);

    const fetchAppointments = useCallback(async (isSilent = false) => {
        try {
            if (!isSilent) setLoading(true);
            let statusFilter: AppointmentStatus | undefined;
            if (activeTab === DashboardTab.REQUESTS) statusFilter = AppointmentStatus.PENDING;
            if (activeTab === DashboardTab.APPROVED) statusFilter = AppointmentStatus.APPROVED;
            if (activeTab === DashboardTab.SCHEDULED) statusFilter = AppointmentStatus.CONFIRMED;

            const response = await doctorService.getAppointments({
                status: statusFilter,
                page,
                limit: 10,
                sortBy,
                sortOrder
            });
            setAppointments(response.data.appointments);
            setTotalPages(response.data.pagination.totalPages);
            setTotalAppointments(response.data.pagination.total);

            // If we're on the requests tab, update the pending count too
            if (activeTab === DashboardTab.REQUESTS) {
                setPendingCount(response.data.pagination.total);
            }
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, [activeTab, page, sortBy, sortOrder]);

    useEffect(() => {
        if (user) {
            fetchAppointments();
            fetchStats();
        }
    }, [user, fetchAppointments, fetchStats]);

    const handleTabChange = useCallback((tab: DashboardTab) => {
        setActiveTab(tab);
        setPage(1);
        if (tab === DashboardTab.REQUESTS || tab === DashboardTab.SCHEDULED) {
            setSortBy('appointmentStart');
            setSortOrder('asc');
        } else {
            setSortBy('appointmentStart');
            setSortOrder('desc');
        }
    }, []);

    const handleSortChange = useCallback((value: string) => {
        const [field, order] = value.split('-') as [string, 'asc' | 'desc'];
        setSortBy(field);
        setSortOrder(order || 'asc');
        setPage(1);
    }, []);

    const handleStatusUpdate = async (id: string, status: AppointmentStatus.APPROVED | AppointmentStatus.REJECTED) => {
        try {
            setProcessingAction({ id, status });
            await doctorService.updateAppointmentStatus(id, status);
            toast.success(`Appointment ${status.toLowerCase()} successfully`);
            await Promise.all([
                fetchAppointments(true),
                fetchStats()
            ]);
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setProcessingAction(null);
        }
    };

    // Simple stats display
    const stats = useMemo(() => {
        return {
            pending: pendingCount,
            totalPatients: 0,
            todayCount: 0,
            earnings: 0
        };
    }, [pendingCount]);

    const displayAppointments = useMemo(() => {
        if (activeTab === DashboardTab.HISTORY) {
            return appointments.filter(a =>
                a.status === AppointmentStatus.COMPLETED ||
                a.status === AppointmentStatus.REJECTED ||
                a.status === AppointmentStatus.CANCELLED
            );
        }
        return appointments;
    }, [appointments, activeTab]);

    return (
        <ProtectedRoute allowedRoles={[UserRole.DOCTOR]}>
            <div className="min-h-screen bg-gray-50">
                {/* Sidebar Drawer */}
                <div className="flex h-screen overflow-hidden">
                    {/* Sidebar */}
                    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col shrink-0">
                        <div className="p-6 border-b border-gray-50">
                            <span className="text-xl font-black text-blue-600 tracking-tight">MediScheduler</span>
                        </div>

                        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                            <button
                                onClick={() => handleTabChange(DashboardTab.ANALYTICS)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === DashboardTab.ANALYTICS ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                <BarChart3 className="w-5 h-5" />
                                Analytics
                            </button>

                            <div className="pt-4 pb-2">
                                <p className="px-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Appointments</p>
                            </div>

                            <button
                                onClick={() => handleTabChange(DashboardTab.REQUESTS)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all ${activeTab === DashboardTab.REQUESTS ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5" />
                                    Requests
                                </div>
                                {stats.pending > 0 && (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === DashboardTab.REQUESTS ? 'bg-white text-blue-600' : 'bg-orange-500 text-white'}`}>
                                        {stats.pending}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => handleTabChange(DashboardTab.APPROVED)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === DashboardTab.APPROVED ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                <CalendarDays className="w-5 h-5" />
                                Approved
                            </button>

                            <button
                                onClick={() => handleTabChange(DashboardTab.SCHEDULED)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === DashboardTab.SCHEDULED ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                <CalendarDays className="w-5 h-5" />
                                Scheduled
                            </button>

                            <button
                                onClick={() => handleTabChange(DashboardTab.HISTORY)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === DashboardTab.HISTORY ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                <CalendarDays className="w-5 h-5" />
                                History
                            </button>
                        </nav>

                        <div className="p-4 border-t border-gray-50 space-y-2">
                            <button
                                onClick={() => setIsAvailabilityModalOpen(true)}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all"
                            >
                                <Clock className="w-5 h-5 text-blue-500" />
                                Availability
                            </button>
                            <div className="pt-4 pb-2 border-t border-gray-50">
                                <p className="px-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Account</p>
                            </div>

                            <Link
                                href={APP_ROUTES.DASHBOARD.DOCTOR_PROFILE}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-gray-500 hover:bg-gray-50"
                            >
                                <User className="w-5 h-5" />
                                Profile
                            </Link>

                            <button
                                onClick={logout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-red-500 hover:bg-red-50 mt-auto"
                            >
                                <LogOut className="w-5 h-5" />
                                Logout
                            </button>
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <main className="flex-1 overflow-y-auto bg-gray-50">
                        {/* Top Header */}
                        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
                            <div>
                                <h2 className="text-xl font-black text-gray-900 capitalize">
                                    {activeTab === DashboardTab.ANALYTICS ? 'Practice Analytics' : `${activeTab} Management`}
                                </h2>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-black text-gray-900">Dr. {user?.firstName} {user?.lastName}</p>
                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Medical Professional</p>
                                </div>
                                <UserAvatar
                                    src={user?.profileImage}
                                    firstName={user?.firstName}
                                    variant="square"
                                    className="bg-blue-600 text-white shadow-lg shadow-blue-100 font-black"
                                />
                            </div>
                        </header>

                        <div className="p-6 max-w-6xl mx-auto">
                            {/* Stats Summary - Simple and Industry Grade */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 group hover:shadow-md transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Today</p>
                                            <p className="text-xl font-black text-gray-900">{stats.todayCount} Sessions</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 group hover:shadow-md transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                                            <CalendarDays className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pending</p>
                                            <p className="text-xl font-black text-gray-900">{stats.pending} Requests</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 group hover:shadow-md transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                            <IndianRupee className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Earnings</p>
                                            <p className="text-xl font-black text-gray-900">₹{stats.earnings.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>


                            {/* List Header */}
                            {activeTab !== DashboardTab.ANALYTICS && (
                                <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-800">
                                        Showing {totalAppointments} {activeTab.toLowerCase()}
                                    </h3>
                                    <div className="flex items-center gap-4">
                                        <SortDropdown
                                            options={sortOptions}
                                            currentValue={`${sortBy}-${sortOrder}`}
                                            onSortChange={handleSortChange}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* List */}
                            <div className="min-h-[400px]">
                                {activeTab === DashboardTab.ANALYTICS ? (
                                    <AnalyticsTab />
                                ) : loading ? (
                                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                                        <p className="text-gray-500 font-medium">Loading your appointments...</p>
                                    </div>
                                ) : displayAppointments.length > 0 ? (
                                    <div className="space-y-4 pb-12">
                                        {displayAppointments.map((appointment) => (
                                            <DoctorAppointmentCard
                                                key={appointment.id}
                                                appointment={appointment}
                                                onStatusUpdate={handleStatusUpdate}
                                            />
                                        ))}

                                        <Pagination
                                            currentPage={page}
                                            totalPages={totalPages}
                                            onPageChange={(p) => setPage(p)}
                                            className="mt-8"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm text-center px-4">
                                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                            <Users className="w-10 h-10 text-gray-300" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                                            No {
                                                activeTab === DashboardTab.REQUESTS ? 'pending requests' :
                                                    activeTab === DashboardTab.APPROVED ? 'approved appointments' :
                                                        activeTab === DashboardTab.SCHEDULED ? 'scheduled sessions' :
                                                            'appointment history'
                                            }
                                        </h3>
                                        <p className="text-gray-500 max-w-sm">
                                            {activeTab === DashboardTab.REQUESTS
                                                ? "You're all caught up! New patient booking requests will appear here."
                                                : activeTab === DashboardTab.APPROVED
                                                    ? "Appointments approved by you but awaiting patient payment."
                                                    : activeTab === DashboardTab.SCHEDULED
                                                        ? "You don't have any upcoming confirmed appointments."
                                                        : "Your history is clean. Completed or cancelled appointments will appear here."}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
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
