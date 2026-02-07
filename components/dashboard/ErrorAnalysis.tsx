'use client';

import { useMemo, useState } from 'react';
import {
    PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingDown, Lightbulb, Brain } from 'lucide-react';
import ReflectionModal from './ReflectionModal';

interface Attempt {
    id?: string;
    isCorrect: boolean;
    errorType?: string | null;
    timestamp: Date | string;
    topicId?: string;
    difficultyLevel?: number;
}

interface ErrorAnalysisProps {
    attempts: Attempt[];
}

const ERROR_COLORS: Record<string, string> = {
    'conceptual': '#f59e0b',    // Amber
    'procedural': '#3b82f6',    // Blue
    'computational': '#ef4444', // Red
    'interpretation': '#8b5cf6',// Purple
    'notation': '#10b981',      // Emerald
    'time_pressure': '#6366f1', // Indigo
    'incomplete': '#9ca3af',    // Gray
    'unknown': '#d1d5db'        // Light Gray
};

const ERROR_LABELS: Record<string, string> = {
    'conceptual': 'Conceptual Gap',
    'procedural': 'Wrong Method',
    'computational': 'Calculation Error',
    'interpretation': 'Misread Question',
    'notation': 'Notation Error',
    'time_pressure': 'Ran Out of Time',
    'incomplete': 'Incomplete',
    'unknown': 'Unclassified'
};

export default function ErrorAnalysis({ attempts }: ErrorAnalysisProps) {
    const [reviewAttempt, setReviewAttempt] = useState<Attempt | null>(null);

    // Filter only incorrect attempts
    const errors = useMemo(() => attempts.filter(a => !a.isCorrect), [attempts]);

    const handleReviewClick = () => {
        const unclassified = errors.find((e) => !e.errorType || e.errorType === 'unknown');
        if (unclassified && unclassified.id) {
            setReviewAttempt(unclassified);
        }
    };

    // 1. Error Distribution Data (Pie Chart)
    const distributionData = useMemo(() => {
        const counts: Record<string, number> = {};
        errors.forEach(err => {
            const type = err.errorType || 'unknown';
            counts[type] = (counts[type] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [errors]);

    // 2. Error Trend Data (Bar Chart by Day)
    const trendData = useMemo(() => {
        const last7Days = Array(7).fill(0).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
        });

        const dailyCounts = last7Days.map(date => {
            const count = errors.filter(e => {
                const eDate = new Date(e.timestamp).toISOString().split('T')[0];
                return eDate === date;
            }).length;
            return { date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }), count };
        });

        return dailyCounts;
    }, [errors]);

    // 3. Pattern Detection / Insights
    const insight = useMemo(() => {
        if (errors.length === 0) return { title: "Looking Good!", message: "No errors detected recently. Keep up the streak!" };

        const topError = distributionData[0];
        const percent = Math.round((topError.value / errors.length) * 100);

        if (topError.name === 'conceptual') {
            return {
                title: "Deepen Understanding",
                message: `${percent}% of your errors are conceptual. Try reviewing the core definitions and proofs before practicing.`
            };
        }
        if (topError.name === 'computational') {
            return {
                title: "Double Check Work",
                message: `Calculation errors account for ${percent}% of mistakes. Slow down and verify each step.`
            };
        }
        if (topError.name === 'interpretation') {
            return {
                title: "Read Carefully",
                message: "You're misinterpreting questions often. Highlight keywords in the problem statement."
            };
        }
        return {
            title: "Analyze Pattern",
            message: `Your most common error type is ${ERROR_LABELS[topError.name] || topError.name}. Focus on this area.`
        };
    }, [distributionData, errors.length]);

    if (attempts.length === 0) return null;

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 h-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <span className="text-xl">🛡️</span>
                        Error Analysis
                    </h3>
                    <p className="text-xs text-zinc-500">Understanding your mistake patterns</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Left: Distribution Pie Chart */}
                <div className="h-64 relative">
                    <h4 className="text-sm font-bold mb-2 text-zinc-500 uppercase tracking-wider">Breakdown</h4>
                    {errors.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={distributionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {distributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={ERROR_COLORS[entry.name] || ERROR_COLORS['unknown']} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => [`${value} Errors`, 'Count']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Legend
                                    layout="vertical"
                                    verticalAlign="middle"
                                    align="right"
                                    formatter={(value) => <span className="text-xs text-zinc-500 ml-1">{ERROR_LABELS[value] || value}</span>}
                                    iconSize={8}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                            <Brain size={48} className="mb-2 opacity-50" />
                            <p>No errors to analyze</p>
                        </div>
                    )}
                </div>

                {/* Right: Trend & Insights */}
                <div className="flex flex-col gap-6">
                    {/* Insight Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-xl"
                    >
                        <div className="flex items-start gap-3">
                            <div className="bg-orange-100 dark:bg-orange-800 p-2 rounded-lg text-orange-600 dark:text-orange-200">
                                <Lightbulb size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-orange-800 dark:text-orange-200 text-sm mb-1">{insight.title}</h4>
                                <p className="text-sm text-orange-700 dark:text-orange-300 leading-relaxed">
                                    {insight.message}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Mini Trend Chart */}
                    <div className="flex-1 min-h-[120px]">
                        <h4 className="text-sm font-bold mb-2 text-zinc-500 uppercase tracking-wider">7-Day Trend</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendData}>
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10 }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f4f4f5' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none' }}
                                />
                                <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Unclassified Warning */}
            {distributionData.find(d => d.name === 'unknown') && (
                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <AlertTriangle size={14} className="text-amber-500" />
                        <span>You have <strong>{distributionData.find(d => d.name === 'unknown')?.value}</strong> unclassified errors.</span>
                    </div>
                    <button
                        onClick={handleReviewClick}
                        className="text-xs font-bold text-blue-600 hover:underline"
                    >
                        Review Now
                    </button>
                </div>
            )}
            {reviewAttempt && reviewAttempt.id && (
                <ReflectionModal
                    isOpen={!!reviewAttempt}
                    onClose={() => setReviewAttempt(null)}
                    attempt={{ id: reviewAttempt.id!, timestamp: reviewAttempt.timestamp }}
                />
            )}
        </div>
    );
}
