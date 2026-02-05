'use client';

import React, { useEffect, useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, Cell
} from 'recharts';
import {
    TrendingUp, Users, Calendar, DollarSign, Star,
    ArrowUpRight, ArrowDownRight, Filter
} from 'lucide-react';
import { analyticsService, AnalyticsSummary, DailyMetric } from '@/src/services/analytics.service';
import { getErrorMessage } from '@/src/utils/api-error';

export default function AnalyticsTab() {
    const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
    const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState('15'); // days

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const response = await analyticsService.getDoctorAnalytics();
                setSummary(response.data.summary);
                setDailyMetrics(response.data.dailyMetrics);
            } catch (err) {
                setError(getErrorMessage(err));
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [dateRange]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <span className="loading loading-spinner loading-lg text-blue-600"></span>
            </div>
        );
    }

    if (error || !summary) {
        return (
            <div className="p-8 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-3">
                <span className="alert alert-error">{error || 'Failed to load analytics'}</span>
            </div>
        );
    }

    const stats = [
        {
            label: 'Total Revenue',
            value: `₹${summary.totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            color: 'bg-emerald-500',
            trend: '+12.5%',
            isPositive: true
        },
        {
            label: 'Total Patients',
            value: summary.totalPatients,
            icon: Users,
            color: 'bg-blue-500',
            trend: '+5.2%',
            isPositive: true
        },
        {
            label: 'Completed',
            value: summary.completedAppointments,
            icon: Calendar,
            color: 'bg-purple-500',
            trend: '+8.1%',
            isPositive: true
        },
    ];

    // Format date for display in charts
    const chartData = dailyMetrics.map(d => ({
        ...d,
        displayDate: new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    }));

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                        <div className="flex items-start justify-between">
                            <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-opacity-20`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${stat.trend === 'Stable' ? 'bg-slate-50 text-slate-500' :
                                stat.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                }`}>
                                {stat.trend !== 'Stable' && (stat.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />)}
                                {stat.trend}
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
                            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Trend Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Revenue & Trends</h3>
                            <p className="text-sm text-slate-500">Daily performance over the last {dateRange} days</p>
                        </div>
                        <div className="flex bg-slate-50 p-1 rounded-xl">
                            <button className="px-4 py-1.5 text-xs font-bold bg-white text-blue-600 rounded-lg shadow-sm border border-slate-100">Last 15d</button>
                            <button className="px-4 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-600" disabled>Custom</button>
                        </div>
                    </div>

                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="displayDate"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                                    tickFormatter={(val) => `₹${val}`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    formatter={(value: number | string | undefined) => [`₹${(Number(value) || 0).toLocaleString()}`, 'Revenue']}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#10b981"
                                    strokeWidth={4}
                                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Growth / Appointment Distribution */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 font-primary">Appointment Volume</h3>
                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="displayDate"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Bar dataKey="appointments" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-50">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">Peak Performance Day</span>
                            <span className="font-bold text-slate-900">
                                {chartData.reduce((prev, current) => (prev.appointments > current.appointments) ? prev : current).displayDate}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
