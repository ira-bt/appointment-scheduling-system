'use client';

import React from 'react';
import { ArrowUpDown } from 'lucide-react';

interface SortOption {
    label: string;
    value: string;
}

interface SortDropdownProps {
    options: SortOption[];
    currentValue: string;
    onSortChange: (value: string) => void;
    label?: string;
    className?: string;
}

const SortDropdown: React.FC<SortDropdownProps> = ({
    options,
    currentValue,
    onSortChange,
    label = 'Sort by',
    className = '',
}) => {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <span className="text-sm font-medium text-gray-500 whitespace-nowrap">{label}:</span>
            <div className="relative inline-block w-48">
                <select
                    className="select select-bordered select-sm w-full bg-white h-10 text-sm font-medium pl-8 pr-10 focus:ring-1 focus:ring-blue-500 shadow-sm appearance-none transition-all"
                    value={currentValue}
                    onChange={(e) => onSortChange(e.target.value)}
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
                </div>
            </div>
        </div>
    );
};

export default SortDropdown;
