/**
 * If a user manually visits /dashboard, this page will:
 * Check if they are logged in (if not, sends them to Login).
 * Check their role (sends them to /dashboard/patient or /dashboard/doctor).
 * Show a small, clean loading spinner while the logic is executing.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/auth/auth.context';
import { APP_ROUTES } from '@/src/constants/app-routes';

export default function DashboardRedirect() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push(APP_ROUTES.AUTH.LOGIN);
            } else if (user?.role === 'DOCTOR') {
                router.push(APP_ROUTES.DASHBOARD.DOCTOR);
            } else if (user?.role === 'PATIENT') {
                router.push(APP_ROUTES.DASHBOARD.PATIENT);
            } else {
                router.push(APP_ROUTES.HOME);
            }
        }
    }, [isLoading, isAuthenticated, user, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <p className="text-gray-500 font-medium">Redirecting you to your dashboard...</p>
            </div>
        </div>
    );
}
    