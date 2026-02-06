import { Appointment, AppointmentStatus } from '@/src/types/appointment.types';
import { formatDate, formatTime } from '@/src/utils/date';
import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import { paymentService } from '@/src/services/payment.service';
import { Loader2, CreditCard, ChevronRight, Clock, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ReviewModal from './ReviewModal';

interface AppointmentCardProps {
    appointment: Appointment;
}

const statusColors: Record<AppointmentStatus, string> = {
    [AppointmentStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    [AppointmentStatus.APPROVED]: 'bg-blue-100 text-blue-800 border-blue-200',
    [AppointmentStatus.CONFIRMED]: 'bg-green-100 text-green-800 border-green-200',
    [AppointmentStatus.COMPLETED]: 'bg-gray-100 text-gray-800 border-gray-200',
    [AppointmentStatus.REJECTED]: 'bg-red-100 text-red-800 border-red-200',
    [AppointmentStatus.CANCELLED]: 'bg-red-100 text-red-800 border-red-200',
};

export default function AppointmentCard({ appointment }: AppointmentCardProps) {
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const doctor = appointment.doctor;
    const doctorName = doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'Unknown Doctor';
    const specialty = doctor?.doctorProfile?.specialty || 'General';
    const statusColor = statusColors[appointment.status] || 'bg-gray-100 text-gray-800';
    const isPast = new Date(appointment.appointmentStart) < new Date();
    const [timeLeft, setTimeLeft] = useState<string | null>(null);

    const isExpired = useMemo(() => {
        if (!appointment.paymentExpiryTime) return false;
        return new Date(appointment.paymentExpiryTime) < new Date();
    }, [appointment.paymentExpiryTime]);

    useEffect(() => {
        if (appointment.status !== AppointmentStatus.APPROVED || !appointment.paymentExpiryTime || isExpired) {
            setTimeLeft(null);
            return;
        }

        const calculateTimeLeft = () => {
            const expiryDate = new Date(appointment.paymentExpiryTime!);
            const now = new Date();
            const difference = expiryDate.getTime() - now.getTime();

            if (difference <= 0) {
                setTimeLeft('00:00');
                return false;
            }

            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);
            setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            return true;
        };

        calculateTimeLeft();
        const timer = setInterval(() => {
            const hasTime = calculateTimeLeft();
            if (!hasTime) {
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [appointment.paymentExpiryTime, appointment.status, isExpired]);

    const handlePayment = async () => {
        setPaymentLoading(true);
        try {
            const response = await paymentService.createCheckoutSession(appointment.id);
            const { url } = response.data.data;
            if (url) {
                window.location.href = url;
            } else {
                throw new Error('Payment URL not found');
            }
        } catch (error) {
            console.error('Payment redirect failed:', error);
            toast.error('Failed to initiate payment. Please try again.');
        } finally {
            setPaymentLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xl overflow-hidden shrink-0">
                    {doctor?.profileImage ? (
                        <Image
                            src={doctor.profileImage}
                            alt={doctorName}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        doctor?.firstName?.charAt(0)
                    )}
                </div>
                <div>
                    <h3 className="font-bold text-gray-800 text-lg">{doctorName}</h3>
                    <p className="text-blue-600 text-sm font-medium">{specialty}</p>
                    <div className="flex items-center gap-2 mt-2 text-gray-500 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatDate(appointment.appointmentStart)}</span>
                        <span className="mx-1">•</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formatTime(appointment.appointmentStart)}</span>
                    </div>
                </div>
            </div>

            {appointment.medicalReports && appointment.medicalReports.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-50 w-full">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Medical Reports</p>
                    <div className="flex flex-wrap gap-2">
                        {appointment.medicalReports.map((report) => (
                            <a
                                key={report.id}
                                href={report.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {report.fileName}
                            </a>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-row md:flex-col items-center md:items-end gap-3 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-50">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColor}`}>
                    {appointment.status}
                </span>
                <div className="flex flex-col items-end gap-2">
                    {timeLeft && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md border border-orange-100 animate-pulse">
                            <Clock className="w-3 h-3" />
                            <span>Expires in: {timeLeft}</span>
                        </div>
                    )}
                    <div className="flex gap-2">
                        {appointment.status === AppointmentStatus.APPROVED && !isPast && !isExpired && (
                            <button
                                onClick={handlePayment}
                                disabled={paymentLoading}
                                className="btn btn-sm btn-primary rounded-lg shadow-md flex items-center gap-2 min-w-[120px]"
                            >
                                {paymentLoading ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <CreditCard className="w-3.5 h-3.5" />
                                )}
                                {paymentLoading ? 'Redirecting...' : 'Pay Now'}
                            </button>
                        )}
                        {appointment.status === AppointmentStatus.COMPLETED && !appointment.rating && (
                            <button
                                onClick={() => setShowReviewModal(true)}
                                className="btn btn-sm bg-blue-50 text-blue-600 hover:bg-blue-100 border-none rounded-lg font-bold"
                            >
                                Give Review
                            </button>
                        )}
                        {appointment.status === AppointmentStatus.COMPLETED && appointment.rating && (
                            <div className="flex items-center gap-1 text-yellow-500 bg-yellow-50 px-2 py-1 rounded-md border border-yellow-100">
                                <Star className="w-3.5 h-3.5 fill-yellow-500" />
                                <span className="text-xs font-bold">{appointment.rating.rating}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showReviewModal && (
                <ReviewModal
                    appointmentId={appointment.id}
                    doctorName={doctorName}
                    onClose={() => setShowReviewModal(false)}
                    onSuccess={() => {
                        window.location.reload();
                    }}
                />
            )}
        </div >
    );
}
