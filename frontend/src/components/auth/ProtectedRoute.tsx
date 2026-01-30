'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/auth/auth.context';
import { APP_ROUTES } from '@/src/constants/app-routes';
import { UserRole } from '@/src/types/user.types';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push(APP_ROUTES.AUTH.LOGIN);
            } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
                // Redirect to their own dashboard if they try to access the other one
                const targetRoute = user.role === UserRole.PATIENT
                    ? APP_ROUTES.DASHBOARD.PATIENT
                    : APP_ROUTES.DASHBOARD.DOCTOR;
                router.push(targetRoute);
            }
        }
    }, [isLoading, isAuthenticated, user, allowedRoles, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <span className="loading loading-spinner loading-lg text-blue-600"></span>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return null;
    }

    return <>{children}</>;
}
