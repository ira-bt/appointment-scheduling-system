'use client';

import React, { useState, useEffect } from 'react';
import { doctorService } from '@/src/services/doctor.service';
import { getErrorMessage } from '@/src/utils/api-error';
import { formatDateToISO } from '@/src/utils/date';

interface SlotPickerProps {
    doctorId: string;
    selectedDate: Date;
    onSlotSelect: (slot: string) => void;
    selectedSlot: string | null;
}

export default function SlotPicker({ doctorId, selectedDate, onSlotSelect, selectedSlot }: SlotPickerProps) {
    const [slots, setSlots] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSlots = async () => {
            setLoading(true);
            setError(null);
            try {
                // Format date as YYYY-MM-DD using local time to avoid timezone offset issues
                const formattedDate = formatDateToISO(selectedDate);
                const response = await doctorService.getSlots(doctorId, formattedDate);
                setSlots(response.data.slots);
            } catch (err) {
                setError(getErrorMessage(err));
            } finally {
                setLoading(false);
            }
        };

        fetchSlots();
    }, [doctorId, selectedDate]);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Available Slots
            </h3>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <span className="loading loading-spinner loading-md text-blue-600"></span>
                    <p className="text-sm text-gray-400 font-medium">Fetching slots...</p>
                </div>
            ) : error ? (
                <div className="alert alert-error text-xs rounded-xl shadow-sm py-3 border-none bg-red-50 text-red-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <span>{error}</span>
                </div>
            ) : slots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-8 h-8 text-gray-300">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zM14.25 15h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zM16.5 15h.008v.008H16.5V15zm0 2.25h.008v.008H16.5v-.008z" />
                        </svg>
                    </div>
                    <p className="text-gray-500 font-medium">No slots available for this date.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {slots.map((slot) => (
                        <button
                            key={slot}
                            onClick={() => onSlotSelect(slot)}
                            className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all duration-200
                                ${selectedSlot === slot
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100'
                                    : 'bg-white border-gray-100 text-gray-700 hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-600'
                                }`}
                        >
                            {slot}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
