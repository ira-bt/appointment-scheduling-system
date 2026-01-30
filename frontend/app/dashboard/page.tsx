'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/auth/auth.context';
import { APP_ROUTES } from '@/src/constants/app-routes';
import { UserRole } from '@/src/types/user.types';

export default function DashboardRedirect() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push(APP_ROUTES.AUTH.LOGIN);
            } else {
                if (user?.role === UserRole.DOCTOR) {
                    router.push(APP_ROUTES.DASHBOARD.DOCTOR);
                } else {
                    router.push(APP_ROUTES.DASHBOARD.PATIENT);
                }
            }
        }
    }, [user, isAuthenticated, isLoading, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <p className="mt-4 text-gray-600 font-medium">Redirecting to your dashboard...</p>
            </div>
        </div>
    );
}
