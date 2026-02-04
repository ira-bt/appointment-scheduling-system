'use client';

import Link from 'next/link';
import { CheckCircle2, Calendar, ArrowRight } from 'lucide-react';
import { APP_ROUTES } from '@/src/constants/app-routes';

export default function PaymentSuccessPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>

                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Payment Received!</h1>
                <p className="text-slate-500 mb-8">
                    Your appointment has been successfully confirmed. You can now view it in your dashboard.
                </p>

                <div className="space-y-3">
                    <Link
                        href={APP_ROUTES.DASHBOARD.PATIENT}
                        className="btn btn-primary w-full rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                    >
                        <Calendar className="w-4 h-4" />
                        Go to Dashboard
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <p className="text-slate-400 text-xs mt-8">
                    A confirmation email has been sent to your registered email address.
                </p>
            </div>
        </div>
    );
}
