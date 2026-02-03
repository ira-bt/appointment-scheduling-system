'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';
import { UserRole, User, DoctorProfile } from '@/src/types/user.types';
import { APP_ROUTES } from '@/src/constants/app-routes';
import { doctorService } from '@/src/services/doctor.service';
import BookingCalendar from '@/src/components/booking/BookingCalendar';
import SlotPicker from '@/src/components/booking/SlotPicker';
import { appointmentService } from '@/src/services/appointment.service';
import { getErrorMessage } from '@/src/utils/api-error';
import { ReportUpload } from '@/src/components/booking/ReportUpload';
import { CheckCircle2, Loader2 } from 'lucide-react';

function BookingPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const doctorId = searchParams.get('doctorId');

    const [doctor, setDoctor] = useState<(User & { doctorProfile: DoctorProfile }) | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [bookedAppointmentId, setBookedAppointmentId] = useState<string | null>(null);

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

    const handleBooking = async () => {
        if (!doctorId || !selectedDate || !selectedSlot) return;

        setBookingLoading(true);
        try {
            // Combine date and slot time
            const [hours, minutes] = selectedSlot.split(':');
            const appointmentDate = new Date(selectedDate);
            appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const response = await appointmentService.createAppointment({
                doctorId,
                appointmentStart: appointmentDate.toISOString()
            });

            setBookedAppointmentId(response.data.id);
        } catch (err) {
            alert(getErrorMessage(err));
        } finally {
            setBookingLoading(false);
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
                {/* Header */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 flex items-center gap-6">
                    <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shrink-0">
                        {doctor.firstName[0]}{doctor.lastName[0]}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Book Appointment</h1>
                        <p className="text-gray-500">with Dr. {doctor.firstName} {doctor.lastName}</p>
                        <p className="text-blue-600 font-medium text-sm mt-1">{doctor.doctorProfile.specialty}</p>
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
                                onSlotSelect={setSelectedSlot}
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
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">You&apos;re booking for</p>
                                    <p className="text-gray-800 font-bold">
                                        {selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} at {selectedSlot}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleBooking}
                                disabled={bookingLoading}
                                className="btn btn-primary btn-lg px-12 rounded-2xl shadow-xl shadow-blue-100 w-full md:w-auto min-w-[200px] flex items-center justify-center gap-2"
                            >
                                {bookingLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Booking Now...</span>
                                    </>
                                ) : 'Confirm Booking'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
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
