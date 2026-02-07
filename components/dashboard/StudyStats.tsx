'use client';

import { useMemo, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    AreaChart,
    Area
} from 'recharts';
import { motion } from 'framer-motion';

interface StudyStatsProps {
    attempts: any[]; // Using any for now to avoid redundant type definition, ideal would be to import QuestionAttempt type
    totalMinutes: number;
}

export default function StudyStats({ attempts, totalMinutes }: StudyStatsProps) {
    const [activeTab, setActiveTab] = useState<'weekly' | 'hourly'>('weekly');

    // Process data for Weekly Activity (Last 7 days)
    const weeklyData = useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const data = Array(7).fill(0).map((_, i) => ({ day: days[i], count: 0, fullDate: '' }));

        // Populate with mock data relative to today if attempts is empty
        // Or aggregate real attempts
        if (attempts.length > 0) {
            // Initialize with last 7 days from today
            const today = new Date();
            const last7Days = Array(7).fill(0).map((_, i) => {
                const d = new Date();
                d.setDate(today.getDate() - (6 - i));
                return {
                    day: days[d.getDay()],
                    count: 0,
                    date: d.toDateString() // "Mon Feb 01 2026"
                };
            });

            attempts.forEach(a => {
                if (!a.startedAt) return;
                const d = new Date(a.startedAt);
                const dateStr = d.toDateString();
                const dayIndex = last7Days.findIndex(day => day.date === dateStr);
                if (dayIndex !== -1) {
                    last7Days[dayIndex].count++;
                }
            });
            return last7Days;
        } else {
            // Mock data fallback for visualization
            return days.map(d => ({ day: d, count: Math.floor(Math.random() * 15) + 5 }));
        }
    }, [attempts]);

    // Process data for Optimal Hours (Heatmap logic aggregated to Area chart)
    const hourlyData = useMemo(() => {
        const hours = Array(24).fill(0).map((_, i) => ({ hour: i, count: 0 }));

        if (attempts.length > 0) {
            attempts.forEach(a => {
                if (!a.startedAt) return;
                const h = new Date(a.startedAt).getHours();
                hours[h].count++;
            });
        } else {
            // Mock optimal curve (evening peak)
            return hours.map((h, i) => ({
                hour: i,
                count: (i > 18 && i < 22) ? 10 + Math.random() * 5 : Math.max(2, Math.random() * 5)
            }));
        }
        return hours;
    }, [attempts]);

    // Find optimal time (hour with max activity)
    const optimalTime = useMemo(() => {
        const sorted = [...hourlyData].sort((a, b) => b.count - a.count);
        const bestHour = sorted[0].hour;
        const period = bestHour < 12 ? 'Morning' : bestHour < 17 ? 'Afternoon' : 'Evening';
        return { hour: bestHour, period, count: sorted[0].count };
    }, [hourlyData]);

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <span className="text-xl">📈</span>
                        Study Rhythm
                    </h3>
                    <p className="text-xs text-zinc-500">
                        {activeTab === 'weekly' ? 'Activity over last 7 days' : 'Your peak productivity hours'}
                    </p>
                </div>
                <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                    <button
                        onClick={() => setActiveTab('weekly')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'weekly'
                                ? 'bg-white dark:bg-zinc-700 shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-700'
                            }`}
                    >
                        Weekly
                    </button>
                    <button
                        onClick={() => setActiveTab('hourly')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'hourly'
                                ? 'bg-white dark:bg-zinc-700 shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-700'
                            }`}
                    >
                        Hourly
                    </button>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    {activeTab === 'weekly' ? (
                        <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" opacity={0.5} />
                            <XAxis
                                dataKey="day"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#71717a' }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#71717a' }}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                cursor={{ fill: '#f4f4f5', opacity: 0.5 }}
                            />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                {weeklyData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.day === 'Sun' || entry.day === 'Sat' ? '#8b5cf6' : '#3b82f6'} />
                                ))}
                            </Bar>
                        </BarChart>
                    ) : (
                        <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" opacity={0.5} />
                            <XAxis
                                dataKey="hour"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#71717a' }}
                                tickFormatter={(tick) => `${tick}:00`}
                                interval={3}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#71717a' }}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#8b5cf6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorCount)"
                            />
                        </AreaChart>
                    )}
                </ResponsiveContainer>
            </div>

            {/* Insights */}
            <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800 flex items-start gap-3">
                <div className="bg-white dark:bg-zinc-800 p-2 rounded-md shadow-sm">
                    💡
                </div>
                <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">AI Insight</h4>
                    <p className="text-sm font-medium">
                        {activeTab === 'weekly'
                            ? "You're consistent on weekdays! Try a light review on weekends to maintain momentum."
                            : `Your peak productivity is in the ${optimalTime.period} around ${optimalTime.hour}:00. Schedule hard topics then!`}
                    </p>
                </div>
            </div>
        </div>
    );
}
