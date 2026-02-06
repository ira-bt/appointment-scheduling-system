import Link from 'next/link';
import { User, DoctorProfile } from '@/src/types/user.types';
import { Star } from 'lucide-react';

interface DoctorCardProps {
    doctor: User & { doctorProfile: DoctorProfile };
    onViewProfile: (doctor: User & { doctorProfile: DoctorProfile }) => void;
}

export default function DoctorCard({ doctor, onViewProfile }: DoctorCardProps) {
    const { firstName, lastName, city, doctorProfile } = doctor;
    const { specialty, experience, consultationFee, qualification } = doctorProfile || {};

    return (
        <div
            className="card bg-white shadow-sm border border-gray-100 hover:shadow-md transition-all hover:border-blue-200 cursor-pointer group"
            onClick={() => onViewProfile(doctor)}
        >
            <div className="card-body p-5">
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="avatar">
                            <div className="w-16 h-16 rounded-xl bg-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center justify-center text-blue-600 font-bold text-xl">
                                {firstName[0]}{lastName[0]}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                                Dr. {firstName} {lastName}
                            </h3>
                            <p className="text-blue-600 font-medium text-sm">{specialty || 'General Practitioner'}</p>
                            <p className="text-gray-500 text-xs flex items-center mt-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {city || 'Location N/A'}
                            </p>
                            {doctorProfile.averageRating !== undefined && doctorProfile.averageRating > 0 && (
                                <div className="flex items-center gap-1 mt-1">
                                    <div className="flex items-center">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={`w-3 h-3 ${star <= Math.round(doctorProfile.averageRating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-xs font-bold text-gray-700">{doctorProfile.averageRating}</span>
                                    <span className="text-xs text-gray-400">({doctorProfile.reviewCount})</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">
                            {experience || 0} yrs exp
                        </div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Qualification</p>
                        <p className="text-sm text-gray-700 font-medium truncate">{qualification || 'MD'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Consultation</p>
                        <p className="text-sm text-gray-800 font-bold">₹{consultationFee || 500}</p>
                    </div>
                </div>

                <div className="mt-6 flex space-x-2">
                    <button
                        className="btn btn-ghost btn-sm flex-1 text-blue-600 hover:bg-blue-50"
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewProfile(doctor);
                        }}
                    >
                        View Profile
                    </button>
                    <Link
                        href={`/appointments/book?doctorId=${doctor.id}`}
                        className="btn btn-primary btn-sm flex-1 text-white shadow-sm"
                        onClick={(e) => e.stopPropagation()}
                    >
                        Book Now
                    </Link>
                </div>
            </div>
        </div>
    );
}
