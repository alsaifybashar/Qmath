'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface DailyAttempt {
    date: Date;
    total: number;
    correct: number;
}

interface WeeklyProgressProps {
    attempts: DailyAttempt[];
    previousWeekAccuracy?: number;
}

// ============================================================================
// WEEKLY PROGRESS COMPONENT
// ============================================================================

export default function WeeklyProgress({ attempts, previousWeekAccuracy }: WeeklyProgressProps) {
    // Process weekly data
    const weekData = useMemo(() => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

        // Get this week's Monday
        const monday = new Date(today);
        monday.setDate(today.getDate() + mondayOffset);
        monday.setHours(0, 0, 0, 0);

        // Initialize week data
        const weekStats = days.map((name, idx) => {
            const date = new Date(monday);
            date.setDate(monday.getDate() + idx);
            return {
                name,
                date,
                total: 0,
                correct: 0,
                accuracy: 0,
                isFuture: date > today,
                isToday: date.toDateString() === today.toDateString(),
            };
        });

        // Fill in actual data
        attempts.forEach(attempt => {
            const attemptDate = new Date(attempt.date);
            attemptDate.setHours(0, 0, 0, 0);

            const dayIndex = weekStats.findIndex(
                d => d.date.toDateString() === attemptDate.toDateString()
            );

            if (dayIndex !== -1) {
                weekStats[dayIndex].total += attempt.total;
                weekStats[dayIndex].correct += attempt.correct;
            }
        });

        // Calculate accuracy for each day
        weekStats.forEach(day => {
            if (day.total > 0) {
                day.accuracy = Math.round((day.correct / day.total) * 100);
            }
        });

        return weekStats;
    }, [attempts]);

    // Calculate overall stats
    const stats = useMemo(() => {
        const totalQuestions = weekData.reduce((sum, d) => sum + d.total, 0);
        const totalCorrect = weekData.reduce((sum, d) => sum + d.correct, 0);
        const avgAccuracy = totalQuestions > 0
            ? Math.round((totalCorrect / totalQuestions) * 100)
            : 0;

        const improvement = previousWeekAccuracy
            ? avgAccuracy - previousWeekAccuracy
            : null;

        return {
            totalQuestions,
            totalCorrect,
            avgAccuracy,
            improvement,
            studyDays: weekData.filter(d => d.total > 0).length,
        };
    }, [weekData, previousWeekAccuracy]);

    const maxValue = Math.max(...weekData.map(d => d.total), 1);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
        >
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <motion.div
                            className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center"
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <span className="text-xl">📈</span>
                        </motion.div>
                        <div>
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">This Week</h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Daily activity breakdown
                            </p>
                        </div>
                    </div>

                    {/* Improvement badge */}
                    {stats.improvement !== null && (
                        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full border ${stats.improvement >= 0
                                ? 'bg-green-50 dark:bg-green-900/30 border-green-200/50 dark:border-green-700/30'
                                : 'bg-red-50 dark:bg-red-900/30 border-red-200/50 dark:border-red-700/30'
                            }`}>
                            <span className={`text-sm font-bold ${stats.improvement >= 0
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                                }`}>
                                {stats.improvement >= 0 ? '↑' : '↓'} {Math.abs(stats.improvement)}%
                            </span>
                            <span className="text-xs text-zinc-500">vs last week</span>
                        </div>
                    )}
                </div>

                {/* Bar chart */}
                <div className="mb-6">
                    <div className="flex items-end justify-between gap-2 h-40">
                        {weekData.map((day, idx) => (
                            <div key={day.name} className="flex-1 flex flex-col items-center">
                                {/* Bar */}
                                <div className="relative w-full flex justify-center mb-2 h-28">
                                    {day.isFuture ? (
                                        <div className="w-3/4 bg-zinc-100 dark:bg-zinc-800 rounded-t-lg border border-dashed border-zinc-300 dark:border-zinc-600 h-full" />
                                    ) : (
                                        <motion.div
                                            className={`w-3/4 rounded-t-lg relative overflow-hidden ${day.isToday
                                                    ? 'bg-gradient-to-t from-blue-500 to-purple-500'
                                                    : getBarColor(day.accuracy)
                                                }`}
                                            initial={{ height: 0 }}
                                            animate={{ height: day.total > 0 ? `${(day.total / maxValue) * 100}%` : '4px' }}
                                            transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                                            style={{ minHeight: day.total > 0 ? '20px' : '4px' }}
                                        >
                                            {/* Shimmer effect */}
                                            {day.isToday && (
                                                <motion.div
                                                    className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent"
                                                    animate={{ y: ['-100%', '200%'] }}
                                                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                                                />
                                            )}

                                            {/* Value on top */}
                                            {day.total > 0 && (
                                                <motion.div
                                                    className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-zinc-600 dark:text-zinc-400"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.8 + idx * 0.1 }}
                                                >
                                                    {day.accuracy}%
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    )}
                                </div>

                                {/* Day label */}
                                <span className={`text-xs font-medium ${day.isToday
                                        ? 'text-blue-600 dark:text-blue-400 font-bold'
                                        : 'text-zinc-500 dark:text-zinc-400'
                                    }`}>
                                    {day.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stats summary */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                        <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                            {stats.totalQuestions}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">Questions</div>
                    </div>
                    <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                        <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                            {stats.avgAccuracy}%
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">Accuracy</div>
                    </div>
                    <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                        <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                            {stats.studyDays}/7
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">Study Days</div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getBarColor(accuracy: number): string {
    if (accuracy >= 80) return 'bg-green-500';
    if (accuracy >= 60) return 'bg-amber-500';
    if (accuracy >= 40) return 'bg-orange-500';
    return 'bg-zinc-300 dark:bg-zinc-600';
}

// ============================================================================
// UTILITY: Process raw attempts into daily data
// ============================================================================

export function processAttemptsToDaily(
    attempts: Array<{ timestamp?: Date; isCorrect?: boolean }>
): DailyAttempt[] {
    const dailyMap = new Map<string, { total: number; correct: number }>();

    attempts.forEach(attempt => {
        if (!attempt.timestamp) return;

        const dateKey = new Date(attempt.timestamp).toDateString();
        const existing = dailyMap.get(dateKey) || { total: 0, correct: 0 };
        existing.total++;
        if (attempt.isCorrect) existing.correct++;
        dailyMap.set(dateKey, existing);
    });

    return Array.from(dailyMap.entries()).map(([dateStr, data]) => ({
        date: new Date(dateStr),
        total: data.total,
        correct: data.correct,
    }));
}
