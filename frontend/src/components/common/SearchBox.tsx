'use client';

import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBoxProps {
    placeholder?: string;
    initialValue?: string;
    onSearch: (value: string) => void;
    debounceMs?: number;
    className?: string;
}

const SearchBox: React.FC<SearchBoxProps> = ({
    placeholder = 'Search...',
    initialValue = '',
    onSearch,
    debounceMs = 300,
    className = '',
}) => {
    const [value, setValue] = useState(initialValue);
    const isFirstMount = React.useRef(true);

    useEffect(() => {
        // Skip calling onSearch on mount if value is initialValue
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }

        const timer = setTimeout(() => {
            onSearch(value);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [value, onSearch, debounceMs]);

    const handleClear = () => {
        setValue('');
    };

    return (
        <div className={`relative ${className}`}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
                type="text"
                className="input input-bordered w-full pl-10 pr-10 h-11 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder={placeholder}
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
            {value && (
                <button
                    onClick={handleClear}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
};

export default SearchBox;
