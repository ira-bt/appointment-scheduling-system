'use client';

import React, { useEffect, useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, Cell
} from 'recharts';
import {
    TrendingUp, Calendar, DollarSign, Star,
    ArrowUpRight, ArrowDownRight, Filter, AlertCircle, Loader2
} from 'lucide-react';
import { analyticsService, AnalyticsSummary, DailyMetric } from '@/src/services/analytics.service';
import { getErrorMessage } from '@/src/utils/api-error';

export default function AnalyticsTab() {
    const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
    const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState('15'); // days
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [customDates, setCustomDates] = useState({
        start: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (isInitialLoad) setLoading(true);
            else setIsRefreshing(true);
            try {
                let start, end;
                if (dateRange === 'custom') {
                    // For custom, we don't auto-fetch in the effect to prevent flicker on every keystroke
                    return;
                } else {
                    const days = parseInt(dateRange);
                    const endDate = new Date();
                    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
                    start = startDate.toISOString().split('T')[0];
                    end = endDate.toISOString().split('T')[0];
                }

                const response = await analyticsService.getDoctorAnalytics(start, end);
                setSummary(response.data.summary);
                setDailyMetrics(response.data.dailyMetrics);
                setError(null);
            } catch (err) {
                setError(getErrorMessage(err));
            } finally {
                setLoading(false);
                setIsInitialLoad(false);
                setIsRefreshing(false);
            }
        };

        fetchAnalytics();
    }, [dateRange]);

    const handleApplyCustomRange = async () => {
        setIsRefreshing(true);
        try {
            const response = await analyticsService.getDoctorAnalytics(customDates.start, customDates.end);
            setSummary(response.data.summary);
            setDailyMetrics(response.data.dailyMetrics);
            setError(null);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsRefreshing(false);
        }
    };

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
            label: 'Estimated Revenue',
            value: `₹${summary.totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            color: 'bg-emerald-500',
            trend: '+12.5%',
            isPositive: true
        },
        {
            label: 'Completed Visits',
            value: summary.completedAppointments,
            icon: Calendar,
            color: 'bg-blue-500',
            trend: '+8.1%',
            isPositive: true
        },
        {
            label: 'Pending/Cancelled',
            value: summary.cancelledAppointments,
            icon: AlertCircle,
            color: 'bg-orange-500',
            trend: 'Stable',
            isPositive: true
        },
    ];

    // Format date for display in charts
    const chartData = dailyMetrics.map(d => ({
        ...d,
        displayDate: new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    }));

    return (
        <div className="space-y-4 animate-in fade-in duration-700">
            {/* Range Selector */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex bg-gray-50 p-1 rounded-2xl">
                        {[
                            { label: '7 Days', value: '7' },
                            { label: '15 Days', value: '15' },
                            { label: '30 Days', value: '30' },
                            { label: 'Custom', value: 'custom' },
                        ].map((range) => (
                            <button
                                key={range.value}
                                onClick={() => setDateRange(range.value)}
                                className={`px-6 py-2 text-xs font-black rounded-xl transition-all ${dateRange === range.value
                                    ? 'bg-white text-blue-600 shadow-sm border border-gray-100'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>

                    {isRefreshing && !isInitialLoad && (
                        <div className="flex items-center gap-2 text-blue-600 animate-pulse">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Refreshing...</span>
                        </div>
                    )}
                </div>

                {dateRange === 'custom' && (
                    <div className="flex items-center gap-3 animate-in slide-in-from-right-4 duration-300">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-1">From</span>
                            <input
                                type="date"
                                value={customDates.start}
                                max={today}
                                onChange={(e) => setCustomDates(prev => ({ ...prev, start: e.target.value }))}
                                className="bg-gray-50 border-none rounded-xl text-xs font-bold p-2 focus:ring-2 focus:ring-blue-100 transition-all"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-1">To</span>
                            <input
                                type="date"
                                value={customDates.end}
                                max={today}
                                onChange={(e) => setCustomDates(prev => ({ ...prev, end: e.target.value }))}
                                className="bg-gray-50 border-none rounded-xl text-xs font-bold p-2 focus:ring-2 focus:ring-blue-100 transition-all"
                            />
                        </div>
                        <button
                            onClick={handleApplyCustomRange}
                            disabled={isRefreshing}
                            className="mt-5 px-4 py-2 bg-blue-600 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 transition-all"
                        >
                            {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                        </button>
                    </div>
                )}
            </div>


            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                        <div className="flex items-start justify-between">
                            <div className={`w-10 h-10 ${stat.color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-opacity-20`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${stat.trend === 'Stable' ? 'bg-slate-50 text-slate-500' :
                                stat.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                }`}>
                                {stat.trend !== 'Stable' && (stat.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />)}
                                {stat.trend}
                            </div>
                        </div>
                        <div className="mt-3">
                            <h3 className="text-slate-500 text-[13px] font-medium">{stat.label}</h3>
                            <p className="text-xl font-bold text-slate-900 mt-0.5">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Trend Chart */}
                <div className="lg:col-span-2 bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Revenue & Trends</h3>
                            <p className="text-[12px] text-slate-500">
                                {dateRange === 'custom'
                                    ? `From ${new Date(customDates.start).toLocaleDateString()} to ${new Date(customDates.end).toLocaleDateString()}`
                                    : `Over the last ${dateRange} days`
                                }
                            </p>
                        </div>
                    </div>

                    <div className="h-[250px] w-full">
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
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 font-primary">Appointment Volume</h3>
                    <div className="flex-1 h-[250px]">
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

                    <div className="mt-4 pt-4 border-t border-slate-50">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 uppercase tracking-tighter font-bold">Peak Day</span>
                            <span className="font-bold text-slate-900">
                                {chartData.length > 0
                                    ? chartData.reduce((prev, current) => (prev.appointments > current.appointments) ? prev : current).displayDate
                                    : 'No data'
                                }
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
