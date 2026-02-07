'use client';

import { motion } from 'framer-motion';

export interface StreakData {
    current: number;
    longest: number;
    freezeDaysAvailable: number;
    freezeDaysUsed: number;
    totalStudyDays: number;
}

interface StreakTrackerProps {
    streakData: StreakData;
}

export default function StreakTracker({ streakData }: StreakTrackerProps) {
    const milestones = [
        { days: 7, name: 'Week Warrior', emoji: '🥉', unlocked: streakData.longest >= 7 },
        { days: 14, name: 'Fortnight Fighter', emoji: '🥈', unlocked: streakData.longest >= 14 },
        { days: 30, name: 'Month Master', emoji: '🥇', unlocked: streakData.longest >= 30 },
        { days: 60, name: 'Consistency King', emoji: '👑', unlocked: streakData.longest >= 60 },
    ];

    const nextMilestone = milestones.find(m => !m.unlocked) || milestones[milestones.length - 1];
    const progressToNext = Math.min(100, (streakData.current / nextMilestone.days) * 100);

    return (
        <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 border border-orange-200 dark:border-orange-800">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <span className="text-3xl">🔥</span>
                    <div>
                        <h3 className="font-bold text-lg">Study Streak</h3>
                        <p className="text-xs text-zinc-500">Keep the fire burning!</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-black text-orange-600">{streakData.current}</div>
                    <div className="text-xs text-zinc-500">days</div>
                </div>
            </div>

            {/* Progress to Next Milestone */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Next: {nextMilestone.name}</span>
                    <span className="text-xs text-zinc-500">{streakData.current}/{nextMilestone.days}</span>
                </div>
                <div className="h-3 bg-white dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressToNext}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                    />
                </div>
            </div>

            {/* Milestones */}
            <div className="grid grid-cols-4 gap-2 mb-6">
                {milestones.map((milestone) => (
                    <div
                        key={milestone.days}
                        className={`text-center p-3 rounded-lg border ${milestone.unlocked
                                ? 'bg-white dark:bg-zinc-800 border-orange-300 dark:border-orange-700'
                                : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 opacity-40'
                            }`}
                    >
                        <div className="text-2xl mb-1">{milestone.emoji}</div>
                        <div className="text-xs font-bold">{milestone.days}d</div>
                    </div>
                ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-zinc-800 rounded-lg p-3">
                    <div className="text-xs text-zinc-500 mb-1">Longest Streak</div>
                    <div className="text-xl font-bold">{streakData.longest} days</div>
                </div>
                <div className="bg-white dark:bg-zinc-800 rounded-lg p-3">
                    <div className="text-xs text-zinc-500 mb-1">Total Days</div>
                    <div className="text-xl font-bold">{streakData.totalStudyDays}</div>
                </div>
            </div>

            {/* Freeze Days */}
            {streakData.freezeDaysAvailable > 0 && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span>❄️</span>
                            <div>
                                <div className="text-sm font-medium">Freeze Days Available</div>
                                <div className="text-xs text-zinc-500">Protect your streak when you need a break</div>
                            </div>
                        </div>
                        <div className="text-lg font-bold text-blue-600">{streakData.freezeDaysAvailable}</div>
                    </div>
                </div>
            )}
        </div>
    );
}
