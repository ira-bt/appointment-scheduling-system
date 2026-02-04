'use client';

import Link from 'next/link';
import { XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { APP_ROUTES } from '@/src/constants/app-routes';

export default function PaymentCancelPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle className="w-12 h-12 text-amber-500" />
                </div>

                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Payment Cancelled</h1>
                <p className="text-slate-500 mb-8">
                    The payment process was not completed. No charges were made. You can try paying again from your dashboard.
                </p>

                <div className="space-y-3">
                    <Link
                        href={APP_ROUTES.DASHBOARD.PATIENT}
                        className="btn btn-outline w-full rounded-xl flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                </div>

                <div className="mt-8 p-4 bg-slate-50 rounded-2xl flex items-start gap-3 text-left">
                    <AlertCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-500 leading-relaxed">
                        If you encountered an issue with the payment provider, please try a different card or contact our support team.
                    </p>
                </div>
            </div>
        </div>
    );
}
