'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { doctorService, DoctorQueryParams } from '@/src/services/doctor.service';
import { CITIES, SPECIALTIES } from '@/src/constants/healthcare.constants';
import DoctorCard from '@/src/components/doctor/DoctorCard';
import DoctorDetailsModal from '@/src/components/doctor/DoctorDetailsModal';
import { User, DoctorProfile } from '@/src/types/user.types';
import Link from 'next/link';
import { APP_ROUTES } from '@/src/constants/app-routes';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';
import { getErrorMessage } from '@/src/utils/api-error';
import { ArrowLeft, Stethoscope, MessageSquare, Filter, X } from 'lucide-react';
import SearchBox from '@/src/components/common/SearchBox';
import FilterBar from '@/src/components/common/FilterBar';
import Pagination from '@/src/components/common/Pagination';
import SortDropdown from '@/src/components/common/SortDropdown';
import { useAuthStore } from '@/src/store/auth.store';

export default function DoctorDiscoveryPage() {
    const { user } = useAuthStore();
    const [doctors, setDoctors] = useState<(User & { doctorProfile: DoctorProfile })[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<(User & { doctorProfile: DoctorProfile }) | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [filters, setFilters] = useState<DoctorQueryParams>(() => ({
        page: 1,
        limit: 4,
        specialty: '',
        city: useAuthStore.getState().user?.city || '',
        search: '',
        sortBy: 'firstName',
        sortOrder: 'asc'
    }));

    const [pagination, setPagination] = useState({
        total: 0,
        totalPages: 0,
    });
    const initialCity = useAuthStore.getState().user?.city;
    const hasInitializedCity = useRef(!!initialCity);

    const filterGroups = [
        {
            name: 'specialty',
            label: 'Specialty',
            type: 'select' as const,
            options: SPECIALTIES.map(s => ({ label: s, value: s }))
        },
        {
            name: 'city',
            label: 'City',
            type: 'select' as const,
            options: CITIES.map(c => ({ label: c, value: c }))
        }
    ];

    const sortOptions = [
        { label: 'Name (A-Z)', value: 'firstName-asc' },
        { label: 'Name (Z-A)', value: 'firstName-desc' },
        { label: 'Consultation Fee (Low-High)', value: 'consultationFee-asc' },
        { label: 'Consultation Fee (High-Low)', value: 'consultationFee-desc' },
        { label: 'Experience (High-Low)', value: 'experience-desc' }
    ];

    const handleSortChange = useCallback((value: string) => {
        const [sortBy, sortOrder] = value.split('-') as [string, 'asc' | 'desc'];
        setFilters(prev => ({ ...prev, sortBy, sortOrder, page: 1 }));
    }, []);

    const handleSearch = useCallback((search: string) => {
        setFilters(prev => ({ ...prev, search, page: 1 }));
    }, []);

    const handleFilterUpdate = useCallback((name: string, value: string) => {
        setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
    }, []);

    const handleClearFilters = useCallback(() => {
        setFilters({
            page: 1,
            limit: 4,
            specialty: '',
            city: '',
            search: '',
            sortBy: 'firstName',
            sortOrder: 'asc'
        });
    }, []);

    // ... fetchDoctors remains basically the same, just adjust the debounce logic if needed
    // Actually, SearchBox handles debounce now. So we can remove the timer from useEffect.

    const fetchDoctors = useCallback(async () => {
        try {
            setLoading(true);
            const response = await doctorService.getDoctors(filters);
            if (response.success) {
                setDoctors(response.data.doctors);
                setPagination({
                    total: response.data.pagination.total,
                    totalPages: response.data.pagination.totalPages,
                });
            }
        } catch (err: unknown) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchDoctors();
    }, [fetchDoctors]);

    // Set initial city from user profile ONLY ONCE
    useEffect(() => {
        if (user?.city && filters.city === '' && !hasInitializedCity.current) {
            setFilters(prev => ({ ...prev, city: user.city }));
            hasInitializedCity.current = true;
        }
    }, [user, filters.city]);

    const handlePageChange = useCallback((newPage: number) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    }, []);

    const handleViewProfile = (doctor: User & { doctorProfile: DoctorProfile }) => {
        setSelectedDoctor(doctor);
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 py-4 sm:py-6 sticky top-0 z-20">
                    <div className="container mx-auto px-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <Link href={APP_ROUTES.DASHBOARD.BASE} className="p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center shrink-0">
                                    <ArrowLeft className="h-5 w-5 text-gray-600" />
                                </Link>
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Find a Doctor</h1>
                                    <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Search and book appointments with top healthcare providers</p>
                                </div>
                            </div>

                            <div className="w-full md:max-w-md">
                                <SearchBox
                                    placeholder="Search by doctor name..."
                                    initialValue={filters.search}
                                    onSearch={handleSearch}
                                />
                            </div>
                        </div>
                    </div>
                </header>

                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Filters Sidebar */}
                        <aside className="hidden lg:block w-72 space-y-6">
                            <FilterBar
                                groups={filterGroups}
                                selectedFilters={{ specialty: filters.specialty || '', city: filters.city || '' }}
                                onFilterChange={handleFilterUpdate}
                                onClearAll={handleClearFilters}
                            />

                            <div className="bg-blue-600 p-6 rounded-2xl text-white">
                                <h3 className="font-bold text-lg mb-2">Need Help?</h3>
                                <p className="text-blue-100 text-sm mb-4">Can&apos;t find the right doctor? Our support team is here to assist you 24/7.</p>
                                <button className="btn bg-white text-blue-600 border-none hover:bg-blue-50 w-full flex items-center justify-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Chat with us
                                </button>
                            </div>
                        </aside>

                        {/* Doctors Listing */}
                        <main className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <div className="flex items-center justify-between w-full sm:w-auto">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Stethoscope className="w-5 h-5 text-blue-600" />
                                        <span className="font-medium">{pagination.total} Doctors available</span>
                                    </div>
                                    <button
                                        onClick={() => setShowMobileFilters(true)}
                                        className="lg:hidden flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg"
                                    >
                                        <Filter className="w-4 h-4" />
                                        Filters
                                    </button>
                                </div>
                                <SortDropdown
                                    options={sortOptions}
                                    currentValue={`${filters.sortBy}-${filters.sortOrder}`}
                                    onSortChange={handleSortChange}
                                />
                            </div>

                            {/* Mobile Filters Drawer Overlay */}
                            {showMobileFilters && (
                                <div className="fixed inset-0 z-50 lg:hidden">
                                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)} />
                                    <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-2xl p-6 flex flex-col animate-in slide-in-from-right duration-300">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xl font-bold text-gray-800">Filters</h3>
                                            <button onClick={() => setShowMobileFilters(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                                <X className="w-6 h-6 text-gray-500" />
                                            </button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto">
                                            <FilterBar
                                                groups={filterGroups}
                                                selectedFilters={{ specialty: filters.specialty || '', city: filters.city || '' }}
                                                onFilterChange={(name, value) => {
                                                    handleFilterUpdate(name, value);
                                                }}
                                                onClearAll={handleClearFilters}
                                                className="shadow-none border-none p-0"
                                            />
                                        </div>
                                        <button
                                            onClick={() => setShowMobileFilters(false)}
                                            className="btn btn-primary w-full mt-6"
                                        >
                                            Show Results
                                        </button>
                                    </div>
                                </div>
                            )}

                            {loading ? (
                                <div className="flex flex-col items-center justify-center min-h-[400px]">
                                    <span className="loading loading-spinner loading-lg text-primary mb-4"></span>
                                    <p className="text-gray-500 font-medium">Finding best doctors for you...</p>
                                </div>
                            ) : error ? (
                                <div className="alert alert-error">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <span>{error}</span>
                                </div>
                            ) : doctors.length > 0 ? (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                                        {doctors.map(doctor => (
                                            <DoctorCard
                                                key={doctor.id}
                                                doctor={doctor}
                                                onViewProfile={handleViewProfile}
                                            />
                                        ))}
                                    </div>

                                    <Pagination
                                        currentPage={filters.page!}
                                        totalPages={pagination.totalPages}
                                        onPageChange={handlePageChange}
                                        className="mt-12 pb-12"
                                    />
                                </div>
                            ) : (
                                <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-200 text-center">
                                    <div className="bg-gray-100 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 text-gray-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">No Doctors Found</h3>
                                    <p className="text-gray-600 mb-8 max-w-sm mx-auto">We couldn&apos;t find any healthcare providers matching your current search or filters. Try adjusting your criteria.</p>
                                    <button
                                        onClick={handleClearFilters}
                                        className="btn btn-primary px-8"
                                    >
                                        Clear All Filters
                                    </button>
                                </div>
                            )}
                        </main>
                    </div>
                </div>

                <DoctorDetailsModal
                    doctor={selectedDoctor}
                    onClose={() => setSelectedDoctor(null)}
                />
            </div>
        </ProtectedRoute>
    );
}
