'use client';

import React from 'react';
import { Filter } from 'lucide-react';

interface FilterOption {
    label: string;
    value: string;
}

interface FilterGroup {
    name: string;
    label: string;
    options: FilterOption[];
    type: 'select' | 'radio';
}

interface FilterBarProps {
    groups: FilterGroup[];
    selectedFilters: Record<string, string>;
    onFilterChange: (name: string, value: string) => void;
    onClearAll?: () => void;
    className?: string;
}

const FilterBar: React.FC<FilterBarProps> = ({
    groups,
    selectedFilters,
    onFilterChange,
    onClearAll,
    className = '',
}) => {
    return (
        <div className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-200 ${className}`}>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-800 flex items-center">
                    <Filter className="h-5 w-5 mr-2 text-blue-600" />
                    Filters
                </h2>
                {onClearAll && (
                    <button
                        onClick={onClearAll}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                        Clear All
                    </button>
                )}
            </div>

            <div className="space-y-5">
                {groups.map((group) => (
                    <div key={group.name} className="form-control">
                        <label className="label pt-0 pb-1.5">
                            <span className="label-text font-semibold text-gray-700 text-sm">{group.label}</span>
                        </label>
                        {group.type === 'select' ? (
                            <select
                                name={group.name}
                                className="select select-bordered select-sm w-full bg-white h-10 text-sm focus:ring-1 focus:ring-blue-500 shadow-sm transition-all"
                                value={selectedFilters[group.name] || ''}
                                onChange={(e) => onFilterChange(group.name, e.target.value)}
                            >
                                <option value="">All {group.label}s</option>
                                {group.options.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="space-y-2 mt-1">
                                {group.options.map((opt) => (
                                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="radio"
                                            name={group.name}
                                            className="radio radio-xs radio-primary"
                                            checked={selectedFilters[group.name] === opt.value}
                                            onChange={() => onFilterChange(group.name, opt.value)}
                                        />
                                        <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                                            {opt.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FilterBar;
