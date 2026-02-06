'use client';

import { User, DoctorProfile } from '@/src/types/user.types';
import Link from 'next/link';
import { Star } from 'lucide-react';

interface DoctorDetailsModalProps {
    doctor: (User & { doctorProfile: DoctorProfile }) | null;
    onClose: () => void;
}

export default function DoctorDetailsModal({ doctor, onClose }: DoctorDetailsModalProps) {
    if (!doctor) return null;

    const { firstName, lastName, city, doctorProfile } = doctor;
    const { specialty, experience, consultationFee, qualification, bio } = doctorProfile || {};

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-2xl p-0 overflow-hidden rounded-2xl bg-white">
                {/* Header/Cover */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white relative">
                    <button
                        onClick={onClose}
                        className="btn btn-sm btn-circle absolute right-4 top-4 bg-white/20 border-none text-white hover:bg-white/30"
                    >
                        ✕
                    </button>
                    <div className="flex items-center space-x-6">
                        <div className="avatar">
                            <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold text-3xl border border-white/30">
                                {firstName[0]}{lastName[0]}
                            </div>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold">Dr. {firstName} {lastName}</h2>
                            <p className="text-blue-100 text-lg mt-1">{specialty || 'General Practitioner'}</p>
                            <div className="flex items-center mt-2 text-blue-50">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {city || 'Location N/A'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gray-50 p-4 rounded-xl text-center">
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Experience</p>
                            <p className="text-xl font-bold text-gray-800">{experience || 0} Years</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl text-center">
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Fee</p>
                            <p className="text-xl font-bold text-gray-800">₹{consultationFee || 500}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl text-center">
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Ratings</p>
                            <div className="flex flex-col items-center justify-center">
                                <div className="flex items-center text-xl font-bold text-gray-800">
                                    <span className="text-yellow-400 mr-1">★</span>
                                    {doctorProfile?.averageRating || '0.0'}
                                </div>
                                <div className="flex items-center gap-0.5 mt-1">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                            key={s}
                                            className={`w-3 h-3 ${s <= Math.round(doctorProfile?.averageRating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                        />
                                    ))}
                                    <span className="text-[10px] text-gray-400 ml-1">({doctorProfile?.reviewCount || 0})</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2 border-l-4 border-blue-600 pl-3">About Doctor</h3>
                            <p className="text-gray-600 leading-relaxed">
                                {bio || `Dr. ${firstName} ${lastName} is a highly experienced ${specialty || 'General Practitioner'} dedicated to providing compassionate and comprehensive healthcare. With over ${experience || 5} years in the field, they have helped numerous patients achieve better health outcomes through personalized care plans.`}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2 border-l-4 border-blue-600 pl-3">Qualifications</h3>
                            <p className="text-gray-600">{qualification || 'MD, MBBS'}</p>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="modal-action mt-10">
                        <div className="flex w-full space-x-4">
                            <button onClick={onClose} className="btn btn-ghost flex-1">
                                Close
                            </button>
                            <Link
                                href={`/appointments/book?doctorId=${doctor.id}`}
                                className="btn btn-primary flex-1 text-white"
                            >
                                Book Appointment
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop bg-gray-900/50 backdrop-blur-sm" onClick={onClose}></div>
        </div>
    );
}
