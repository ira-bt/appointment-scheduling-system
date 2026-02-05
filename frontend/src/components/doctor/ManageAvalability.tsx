'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { doctorService, AvailabilityItem } from '@/src/services/doctor.service';
import { getErrorMessage } from '@/src/utils/api-error';

const DAYS = [
    { label: 'Sunday', value: 0 },
    { label: 'Monday', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
    { label: 'Saturday', value: 6 },
];

export default function ManageAvailability({ onClose }: { onClose: () => void }) {
    const [availability, setAvailability] = useState<AvailabilityItem[]>([
        { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isActive: true },
    ]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
        const fetchAvailability = async () => {
            try {
                const response = await doctorService.getAvailability();
                if (response.data && response.data.length > 0) {
                    setAvailability(response.data.map((item: AvailabilityItem) => ({
                        dayOfWeek: item.dayOfWeek,
                        startTime: item.startTime,
                        endTime: item.endTime,
                        isActive: item.isActive,
                    })));
                }
            } catch (err) {
                console.error('Failed to fetch availability:', getErrorMessage(err));
            } finally {
                setInitialLoading(false);
            }
        };
        fetchAvailability();
    }, []);

    const handleAddDay = () => {
        if (availability.length < 7) {
            setAvailability([
                ...availability,
                { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isActive: true },
            ]);
        }
    };

    const handleRemoveDay = (index: number) => {
        setAvailability(availability.filter((_, i) => i !== index));
    };

    const handleChange = (index: number, field: keyof AvailabilityItem, value: AvailabilityItem[keyof AvailabilityItem]) => {
        const newAvailability = [...availability];
        newAvailability[index] = { ...newAvailability[index], [field]: value } as AvailabilityItem;
        setAvailability(newAvailability);
    };

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        try {
            await doctorService.updateAvailability(availability);
            onClose();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden">
            {/* Fixed Header */}
            <div className="p-6 pb-4 border-b border-gray-100 shrink-0">
                <h2 className="text-2xl font-bold text-gray-800">Manage Your Availability</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 min-h-0">
                {initialLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <span className="loading loading-spinner loading-lg text-primary"></span>
                        <p className="text-gray-500 font-medium">Loading your schedule...</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4 mb-2">
                            {availability.map((item, index) => (
                                <div key={index} className="flex flex-wrap items-center gap-4 p-4 border border-gray-100 rounded-lg bg-gray-50 group transition-all hover:shadow-sm">
                                    <div className="flex-1 min-w-[150px]">
                                        <label className="label text-xs font-semibold text-gray-500 uppercase tracking-wider p-0 mb-1">Day</label>
                                        <select
                                            className="select select-bordered select-sm w-full bg-white"
                                            value={item.dayOfWeek}
                                            onChange={(e) => handleChange(index, 'dayOfWeek', parseInt(e.target.value))}
                                        >
                                            {DAYS.map(day => (
                                                <option key={day.value} value={day.value}>{day.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex-1 min-w-[120px]">
                                        <label className="label text-xs font-semibold text-gray-500 uppercase tracking-wider p-0 mb-1">Start Time</label>
                                        <input
                                            type="time"
                                            className="input input-bordered input-sm w-full bg-white"
                                            value={item.startTime}
                                            onChange={(e) => handleChange(index, 'startTime', e.target.value)}
                                        />
                                    </div>

                                    <div className="flex-1 min-w-[120px]">
                                        <label className="label text-xs font-semibold text-gray-500 uppercase tracking-wider p-0 mb-1">End Time</label>
                                        <input
                                            type="time"
                                            className="input input-bordered input-sm w-full bg-white"
                                            value={item.endTime}
                                            onChange={(e) => handleChange(index, 'endTime', e.target.value)}
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 pt-4 sm:pt-6">
                                        <label className="cursor-pointer flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                className="toggle toggle-primary toggle-sm"
                                                checked={item.isActive}
                                                onChange={(e) => handleChange(index, 'isActive', e.target.checked)}
                                            />
                                            <span className="text-sm font-medium text-gray-700">{item.isActive ? 'Active' : 'Off'}</span>
                                        </label>
                                    </div>

                                    <div className="pt-4 sm:pt-6">
                                        <button
                                            onClick={() => handleRemoveDay(index)}
                                            className="btn btn-ghost btn-sm btn-circle text-red-400 hover:text-red-500 hover:bg-red-50"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {error && (
                            <div className="alert alert-error mb-6 text-sm py-3 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span>{error}</span>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Fixed Footer */}
            <div className="p-6 pt-4 border-t border-gray-100 shrink-0 bg-white">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <button
                        onClick={handleAddDay}
                        disabled={availability.length >= 7}
                        className="btn btn-outline btn-primary btn-sm rounded-lg w-full md:w-auto"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Add Working Period
                    </button>

                    <div className="flex gap-3 w-full md:w-auto">
                        <button
                            onClick={onClose}
                            className="btn btn-ghost btn-sm flex-1 md:flex-none"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="btn btn-primary btn-sm min-w-[120px] rounded-lg shadow-md shadow-blue-100 flex-1 md:flex-none flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
