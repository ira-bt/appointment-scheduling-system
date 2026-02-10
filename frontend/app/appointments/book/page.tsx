'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';
import { UserRole, User, DoctorProfile } from '@/src/types/user.types';
import { APP_ROUTES } from '@/src/constants/app-routes';
import { formatDate, formatLocalizedTime } from '@/src/utils/date';
import { doctorService } from '@/src/services/doctor.service';
import BookingCalendar from '@/src/components/booking/BookingCalendar';
import SlotPicker from '@/src/components/booking/SlotPicker';
import { appointmentService } from '@/src/services/appointment.service';
import { getErrorMessage } from '@/src/utils/api-error';
import { ReportUpload } from '@/src/components/booking/ReportUpload';
import { CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';

function BookingPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const doctorId = searchParams.get('doctorId');

    const [doctor, setDoctor] = useState<(User & { doctorProfile: DoctorProfile }) | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [selectedSlotISO, setSelectedSlotISO] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [bookedAppointmentId, setBookedAppointmentId] = useState<string | null>(null);

    const [conflictInfo, setConflictInfo] = useState<{ hasConflict: boolean; conflict?: { status: string; startTime: string; doctorName: string } } | null>(null);
    const [showConflictConfirm, setShowConflictConfirm] = useState(false);

    useEffect(() => {
        if (!doctorId) {
            router.push(APP_ROUTES.DASHBOARD.PATIENT);
            return;
        }

        const fetchDoctor = async () => {
            try {
                const response = await doctorService.getDoctorById(doctorId);
                setDoctor(response.data);
            } catch (err) {
                setError(getErrorMessage(err));
            } finally {
                setLoading(false);
            }
        };

        fetchDoctor();
    }, [doctorId, router]);

    useEffect(() => {
        const checkConflict = async () => {
            if (!selectedSlotISO) {
                setConflictInfo(null);
                return;
            }

            try {
                const response = await appointmentService.checkConflict(selectedSlotISO);
                setConflictInfo(response.data);
            } catch (err) {
                console.error('Conflict check failed:', err);
            }
        };

        checkConflict();
    }, [selectedSlotISO]);

    const performBooking = async () => {
        if (!doctorId || !selectedSlotISO) return;

        setBookingLoading(true);
        try {
            const response = await appointmentService.createAppointment({
                doctorId,
                appointmentStart: selectedSlotISO
            });

            setBookedAppointmentId(response.data.id);
        } catch (err) {
            alert(getErrorMessage(err));
        } finally {
            setBookingLoading(false);
            setShowConflictConfirm(false);
        }
    };

    const handleBooking = async () => {
        if (conflictInfo?.hasConflict) {
            setShowConflictConfirm(true);
        } else {
            await performBooking();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg text-blue-600"></span>
            </div>
        );
    }

    if (error || !doctor) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-red-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
                    <p className="text-gray-600 mb-6">{error || 'Doctor not found'}</p>
                    <button
                        onClick={() => router.back()}
                        className="btn btn-primary w-full"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (bookedAppointmentId) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="bg-white p-8 rounded-2xl shadow-sm text-center border border-slate-100">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Booking Successful!</h2>
                        <p className="text-slate-500 text-lg">Your appointment with Dr. {doctor.firstName} {doctor.lastName} is now pending approval.</p>
                    </div>

                    <ReportUpload
                        appointmentId={bookedAppointmentId}
                        onSuccess={() => router.push(`${APP_ROUTES.DASHBOARD.PATIENT}?booked=true`)}
                        onCancel={() => router.push(`${APP_ROUTES.DASHBOARD.PATIENT}?booked=true`)}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="mb-8 flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors group font-medium"
                >
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:bg-blue-50 group-hover:border-blue-100 shadow-sm transition-all">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    <span>Back to Search</span>
                </button>

                {/* Header */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                    <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black shrink-0 shadow-lg shadow-blue-100 ring-4 ring-white">
                        {doctor.firstName[0]}{doctor.lastName[0]}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-800">Book Appointment</h1>
                        <p className="text-gray-500 font-medium mt-1">with Dr. {doctor.firstName} {doctor.lastName}</p>
                        <div className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full mt-3 uppercase tracking-wider">
                            {doctor.doctorProfile.specialty}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Calendar Section */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 px-1">
                            <span className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-sm">1</span>
                            Select Date
                        </h2>
                        <BookingCalendar
                            selectedDate={selectedDate}
                            onDateSelect={(date) => {
                                setSelectedDate(date);
                                setSelectedSlot(null);
                                setSelectedSlotISO(null);
                            }}
                        />
                    </div>

                    {/* Slots Section */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 px-1">
                            <span className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-sm">2</span>
                            Select Time Slot
                        </h2>
                        {selectedDate ? (
                            <SlotPicker
                                doctorId={doctor.id}
                                selectedDate={selectedDate}
                                onSlotSelect={(time, iso) => {
                                    setSelectedSlot(time);
                                    setSelectedSlotISO(iso);
                                }}
                                selectedSlot={selectedSlot}
                            />
                        ) : (
                            <div className="bg-white p-12 rounded-2xl border border-gray-100 border-dashed text-center">
                                <p className="text-gray-400">Please select a date first</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer / Summary */}
                {selectedDate && selectedSlot && (
                    <div className="mt-12 bg-white p-6 rounded-2xl shadow-lg border border-blue-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">You&apos;re booking for</p>
                                    <p className="text-slate-800 font-bold text-base sm:text-lg">
                                        {selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at {selectedSlot}
                                    </p>
                                </div>
                            </div>

                            {/* Conflict Warning */}
                            {conflictInfo?.hasConflict && (
                                <div className="flex-1 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in zoom-in duration-300 max-w-lg">
                                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-amber-600">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-amber-800 text-[10px] font-black uppercase tracking-widest leading-none mb-1">Schedule Conflict</p>
                                        <p className="text-amber-700 text-xs">
                                            You have a <span className="font-bold underline">{conflictInfo.conflict?.status}</span> appointment
                                            with <span className="font-bold">Dr. {conflictInfo.conflict?.doctorName}</span> at <span className="font-bold">{formatLocalizedTime(conflictInfo.conflict?.startTime || '')}</span>.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleBooking}
                                disabled={bookingLoading}
                                className="btn btn-primary btn-lg px-10 rounded-2xl shadow-xl shadow-blue-100 w-full sm:w-auto min-w-[200px] h-14 border-none transition-all hover:-translate-y-0.5 active:scale-95"
                            >
                                {bookingLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span className="font-bold">Booking...</span>
                                    </>
                                ) : (
                                    <span className="font-bold uppercase tracking-wider text-sm">Confirm Booking</span>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Conflict Confirmation Modal */}
            {showConflictConfirm && conflictInfo?.hasConflict && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in slide-in-from-bottom-8 duration-500">
                        <div className="bg-amber-500 p-6 flex flex-col items-center text-white text-center">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold">Appointment Conflict</h3>
                            <p className="text-amber-50/90 text-sm mt-1">You already have an appointment at this time.</p>
                        </div>

                        <div className="p-8">
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6">
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Existing Appointment</p>
                                <div className="space-y-1">
                                    <p className="text-slate-800 font-bold">Dr. {conflictInfo.conflict?.doctorName}</p>
                                    <p className="text-slate-600 text-sm">{formatDate(conflictInfo.conflict?.startTime || '')} at {formatLocalizedTime(conflictInfo.conflict?.startTime || '')}</p>
                                    <p className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 uppercase">
                                        {conflictInfo.conflict?.status}
                                    </p>
                                </div>
                            </div>

                            <p className="text-slate-600 text-sm text-center mb-8">
                                Would you like to select a different time slot or proceed with this booking anyway?
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => setShowConflictConfirm(false)}
                                    className="btn btn-primary rounded-2xl py-4 h-auto"
                                >
                                    Choose Another Slot
                                </button>
                                <button
                                    onClick={performBooking}
                                    disabled={bookingLoading}
                                    className="btn btn-ghost text-slate-500 hover:text-slate-800 rounded-2xl"
                                >
                                    {bookingLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : 'Proceed Anyway'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function BookingPage() {
    return (
        <ProtectedRoute allowedRoles={[UserRole.PATIENT]}>
            <Suspense fallback={
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <span className="loading loading-spinner loading-lg text-blue-600"></span>
                </div>
            }>
                <BookingPageContent />
            </Suspense>
        </ProtectedRoute>
    );
}
