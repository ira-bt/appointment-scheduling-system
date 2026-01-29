'use client';

import { useState, useEffect, useCallback } from 'react';
import { doctorService, DoctorQueryParams } from '@/src/services/doctor.service';
import { CITIES, SPECIALTIES } from '@/src/constants/healthcare.constants';
import DoctorCard from '@/src/components/doctor/DoctorCard';
import { User, DoctorProfile } from '@/src/types/user.types';
import Link from 'next/link';
import { APP_ROUTES } from '@/src/constants/app-routes';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';
import { getErrorMessage } from '@/src/utils/api-error';

export default function DoctorDiscoveryPage() {
    const [doctors, setDoctors] = useState<(User & { doctorProfile: DoctorProfile })[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState<DoctorQueryParams>({
        page: 1,
        limit: 6,
        specialty: '',
        city: '',
        search: '',
    });
    const [pagination, setPagination] = useState({
        total: 0,
        totalPages: 0,
    });

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
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchDoctors();
        }, 300); // Debounce search
        return () => clearTimeout(timer);
    }, [fetchDoctors]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
    };

    const handlePageChange = (newPage: number) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 py-6">
                    <div className="container mx-auto px-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <Link href={APP_ROUTES.DASHBOARD.BASE} className="text-blue-600 text-sm font-medium hover:underline flex items-center mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Back
                                </Link>
                                <h1 className="text-3xl font-bold text-gray-800">Find a Doctor</h1>
                                <p className="text-gray-600">Search and book appointments with top healthcare providers</p>
                            </div>

                            <div className="flex-1 max-w-md relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    name="search"
                                    placeholder="Search by doctor name..."
                                    className="input input-bordered w-full pl-10 h-12 bg-white"
                                    value={filters.search}
                                    onChange={handleFilterChange}
                                />
                            </div>
                        </div>
                    </div>
                </header>

                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Filters Sidebar */}
                        <aside className="w-full lg:w-72 space-y-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                                <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                    </svg>
                                    Filters
                                </h2>

                                <div className="space-y-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-semibold text-gray-700">Specialty</span>
                                        </label>
                                        <select
                                            name="specialty"
                                            className="select select-bordered w-full bg-white shadow-sm"
                                            value={filters.specialty}
                                            onChange={handleFilterChange}
                                        >
                                            <option value="">All Specialties</option>
                                            {SPECIALTIES.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-semibold text-gray-700">City</span>
                                        </label>
                                        <select
                                            name="city"
                                            className="select select-bordered w-full bg-white shadow-sm"
                                            value={filters.city}
                                            onChange={handleFilterChange}
                                        >
                                            <option value="">All Cities</option>
                                            {CITIES.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <button
                                        onClick={() => setFilters({ page: 1, limit: 6, specialty: '', city: '', search: '' })}
                                        className="btn btn-outline btn-sm w-full mt-4"
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            </div>

                            {/* Help Widget */}
                            <div className="bg-blue-600 p-6 rounded-2xl text-white">
                                <h3 className="font-bold text-lg mb-2">Need Help?</h3>
                                <p className="text-blue-100 text-sm mb-4">Can&apos;t find the right doctor? Our support team is here to assist you 24/7.</p>
                                <button className="btn bg-white text-blue-600 border-none hover:bg-blue-50 w-full">Chat with us</button>
                            </div>
                        </aside>

                        {/* Doctors Listing */}
                        <main className="flex-1">
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
                                            <DoctorCard key={doctor.id} doctor={doctor} />
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {pagination.totalPages > 1 && (
                                        <div className="flex justify-center mt-12 pb-12">
                                            <div className="join bg-white shadow-sm border border-gray-200">
                                                <button
                                                    className="join-item btn btn-sm bg-white border-none disabled:bg-gray-50"
                                                    onClick={() => handlePageChange(filters.page! - 1)}
                                                    disabled={filters.page === 1}
                                                >
                                                    Previous
                                                </button>
                                                {[...Array(pagination.totalPages)].map((_, i) => (
                                                    <button
                                                        key={i + 1}
                                                        className={`join-item btn btn-sm border-none ${filters.page === i + 1 ? 'btn-primary' : 'bg-white hover:bg-gray-100'}`}
                                                        onClick={() => handlePageChange(i + 1)}
                                                    >
                                                        {i + 1}
                                                    </button>
                                                ))}
                                                <button
                                                    className="join-item btn btn-sm bg-white border-none disabled:bg-gray-50"
                                                    onClick={() => handlePageChange(filters.page! + 1)}
                                                    disabled={filters.page === pagination.totalPages}
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    )}
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
                                        onClick={() => setFilters({ page: 1, limit: 6, specialty: '', city: '', search: '' })}
                                        className="btn btn-primary px-8"
                                    >
                                        Clear All Filters
                                    </button>
                                </div>
                            )}
                        </main>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
