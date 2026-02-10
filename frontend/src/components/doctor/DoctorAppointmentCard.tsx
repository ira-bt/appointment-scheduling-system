import { useState } from 'react';
import { Appointment, AppointmentStatus, MedicalReport } from '../../types/appointment.types';
import { Check, X, Clock, User, FileText, Loader2, IndianRupee, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { formatBloodType } from '@/src/utils/healthcare';
import { formatDate, formatTime } from '@/src/utils/date';
import UserAvatar from '../common/UserAvatar';

interface DoctorAppointmentCardProps {
    appointment: Appointment;
    onStatusUpdate: (id: string, status: AppointmentStatus.APPROVED | AppointmentStatus.REJECTED) => void;
}

export default function DoctorAppointmentCard({ appointment, onStatusUpdate }: DoctorAppointmentCardProps) {
    const [localAction, setLocalAction] = useState<AppointmentStatus | null>(null);
    const loading = localAction !== null;
    const isApproving = localAction === AppointmentStatus.APPROVED;
    const isRejecting = localAction === AppointmentStatus.REJECTED;
    const isPending = appointment.status === AppointmentStatus.PENDING;
    const startTime = new Date(appointment.appointmentStart);
    const isPast = startTime < new Date();

    const handleAction = async (status: AppointmentStatus.APPROVED | AppointmentStatus.REJECTED) => {
        try {
            setLocalAction(status);
            await onStatusUpdate(appointment.id, status);
        } finally {
            // Loading state will either be cleaned up by re-render (list change) 
            // or reset here if the item stayed in the list
            setLocalAction(null);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
            {/* Header: Patient Info & Time */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <UserAvatar
                        src={appointment.patient?.profileImage}
                        firstName={appointment.patient?.firstName}
                        size="lg"
                        className="bg-blue-50 text-blue-600 font-bold border border-blue-100"
                    />
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">
                            {appointment.patient?.firstName} {appointment.patient?.lastName}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDate(startTime)}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {formatTime(startTime)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${appointment.status === AppointmentStatus.PENDING ? 'bg-orange-50 text-orange-700 border-orange-100' :
                        appointment.status === AppointmentStatus.APPROVED ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            appointment.status === AppointmentStatus.CONFIRMED ? 'bg-green-50 text-green-700 border-green-100' :
                                appointment.status === AppointmentStatus.COMPLETED ? 'bg-gray-50 text-gray-700 border-gray-100' :
                                    'bg-red-50 text-red-700 border-red-100'
                        }`}>
                        {appointment.status}
                    </span>
                    {isPending && !isPast && (
                        <div className="flex gap-2 ml-2">
                            <button
                                onClick={() => handleAction(AppointmentStatus.APPROVED)}
                                disabled={loading}
                                className="btn btn-sm btn-success text-white items-center gap-1"
                            >
                                {isApproving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                Approve
                            </button>
                            <button
                                onClick={() => handleAction(AppointmentStatus.REJECTED)}
                                disabled={loading}
                                className="btn btn-sm btn-error text-white items-center gap-1"
                            >
                                {isRejecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                                Reject
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <hr className="border-gray-50" />

            {/* Content: Details & Reports */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Patient Context</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Blood Type</p>
                            <p className="text-sm font-semibold text-gray-700">{formatBloodType(appointment.patient?.bloodType)}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Allergies</p>
                            <p className="text-sm font-semibold text-gray-700 truncate" title={appointment.patient?.allergies}>
                                {appointment.patient?.allergies || 'None'}
                            </p>
                        </div>
                    </div>
                    {appointment.patient?.medicalHistory && (
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Medical History</p>
                            <p className="text-sm text-gray-600 line-clamp-2 mt-1">{appointment.patient.medicalHistory}</p>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Medical Reports</h4>
                    {appointment.medicalReports && appointment.medicalReports.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {appointment.medicalReports.map((report) => (
                                <a
                                    key={report.id}
                                    href={report.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors border border-blue-100"
                                >
                                    <FileText className="w-3 h-3" />
                                    <span className="max-w-[120px] truncate">{report.fileName}</span>
                                </a>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-gray-400 text-xs italic py-4">
                            <FileText className="w-4 h-4 opacity-50" />
                            No reports attached
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
