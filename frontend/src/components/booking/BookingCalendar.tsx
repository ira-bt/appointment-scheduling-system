'use client';

import React, { useState } from 'react';

interface BookingCalendarProps {
    onDateSelect: (date: Date) => void;
    selectedDate: Date | null;
}

export default function BookingCalendar({ onDateSelect, selectedDate }: BookingCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const daysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const firstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const monthName = currentMonth.toLocaleString('default', { month: 'long' });
    const year = currentMonth.getFullYear();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const renderDays = () => {
        const totalDays = daysInMonth(currentMonth);
        const startDay = firstDayOfMonth(currentMonth);
        const days = [];

        // Fill empty slots for previous month
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-10 w-10"></div>);
        }

        // Fill days of current month
        for (let i = 1; i <= totalDays; i++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
            const isToday = date.getTime() === today.getTime();
            const isSelected = selectedDate?.getTime() === date.getTime();
            // Disable if it's in the past OR if it's today (due to 24h lead time rule)
            const isDisabled = date <= today;

            days.push(
                <button
                    key={i}
                    onClick={() => !isDisabled && onDateSelect(date)}
                    disabled={isDisabled}
                    className={`h-10 w-10 flex items-center justify-center rounded-full text-sm font-medium transition-all relative
                        ${isSelected ? 'bg-blue-600 text-white shadow-md shadow-blue-200' :
                            isToday ? 'border-2 border-gray-300 text-gray-400' :
                                isDisabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'}`}
                >
                    {i}
                </button>
            );
        }

        return days;
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-800">{monthName} {year}</h3>
                <div className="flex gap-2">
                    <button
                        onClick={handlePrevMonth}
                        className="btn btn-ghost btn-xs btn-circle hover:bg-blue-50 hover:text-blue-600"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>
                    <button
                        onClick={handleNextMonth}
                        className="btn btn-ghost btn-xs btn-circle hover:bg-blue-50 hover:text-blue-600"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="h-10 w-10 flex items-center justify-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {day.charAt(0)}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {renderDays()}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                    <span className="text-gray-500 font-medium">Selected</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full border-2 border-gray-300"></div>
                    <span className="text-gray-500 font-medium">Today (Restricted)</span>
                </div>
            </div>
        </div>
    );
}
