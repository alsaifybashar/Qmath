'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Snowflake, Trophy, Star, TrendingUp } from 'lucide-react';
import { useState } from 'react';

export interface StreakData {
    current: number;
    longest: number;
    freezeDaysAvailable: number;
    freezeDaysUsed: number;
    totalStudyDays: number;
    /** Correct answers per minute — optional */
    efficiencyScore?: number;
    /** Performance score 0-100 per weekday index (0=Mon … 6=Sun) */
    weekdayPerformance?: number[];
}

interface StreakTrackerProps {
    streakData: StreakData;
}

// Animated flame component
function AnimatedFlame({ size = 'normal' }: { size?: 'small' | 'normal' | 'large' }) {
    const sizeClasses = {
        small: 'w-5 h-5',
        normal: 'w-8 h-8',
        large: 'w-12 h-12'
    };

    return (
        <motion.div
            className="relative"
            animate={{
                scale: [1, 1.1, 1],
            }}
            transition={{
                duration: 0.5,
                repeat: Infinity,
                ease: "easeInOut"
            }}
        >
            <Flame className={`${sizeClasses[size]} text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]`} />
            {/* Glow effect */}
            <motion.div
                className="absolute inset-0 bg-orange-500/30 blur-lg rounded-full"
                animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [0.8, 1.2, 0.8]
                }}
                transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
        </motion.div>
    );
}

// Confetti particle for celebrations
function ConfettiParticle({ delay, colorIndex, x, yExtra }: { delay: number; colorIndex: number; x: number; yExtra: number }) {
    const colors = ['bg-orange-400', 'bg-red-400', 'bg-yellow-400', 'bg-pink-400'];
    const randomColor = colors[colorIndex % colors.length];

    return (
        <motion.div
            className={`absolute w-2 h-2 ${randomColor} rounded-full`}
            initial={{ y: 0, x: 0, opacity: 1, scale: 0 }}
            animate={{
                y: -100 - yExtra,
                x,
                opacity: 0,
                scale: 1,
                rotate: 360
            }}
            transition={{
                duration: 1,
                delay,
                ease: "easeOut"
            }}
        />
    );
}

export default function StreakTracker({ streakData }: StreakTrackerProps) {
    const [showCelebration, setShowCelebration] = useState(false);

    const milestones = [
        { days: 7, name: 'Veckokrigare', emoji: '🥉', icon: Trophy, unlocked: streakData.longest >= 7 },
        { days: 14, name: 'Tvåveckorskrigare', emoji: '🥈', icon: Star, unlocked: streakData.longest >= 14 },
        { days: 30, name: 'Månadsmästare', emoji: '🥇', icon: TrendingUp, unlocked: streakData.longest >= 30 },
        { days: 60, name: 'Konsistenskung', emoji: '👑', icon: Flame, unlocked: streakData.longest >= 60 },
    ];

    const nextMilestone = milestones.find(m => !m.unlocked) || milestones[milestones.length - 1];
    const progressToNext = Math.min(100, (streakData.current / nextMilestone.days) * 100);

    // Determine streak status for visual feedback
    const isOnFire = streakData.current >= 7;
    const isCold = streakData.current === 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className={`relative overflow-hidden rounded-2xl p-6 border transition-all duration-300 ${isOnFire
                ? 'bg-gradient-to-br from-orange-50 via-red-50/50 to-yellow-50 dark:from-orange-900/30 dark:via-red-900/20 dark:to-yellow-900/20 border-orange-200 dark:border-orange-700/50 shadow-lg shadow-orange-500/10'
                : isCold
                    ? 'bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-900/20 dark:to-slate-900/20 border-blue-200 dark:border-blue-700/50'
                    : 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800'
                }`}
        >
            {/* Celebration confetti */}
            <AnimatePresence>
                {showCelebration && (
                    <div className="absolute top-1/2 left-1/2">
                        {[...Array(12)].map((_, i) => (
                            <ConfettiParticle
                                key={i}
                                delay={i * 0.05}
                                colorIndex={i}
                                x={(i % 4) * 25 - 37}
                                yExtra={i * 5}
                            />
                        ))}
                    </div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    {isOnFire ? (
                        <AnimatedFlame size="normal" />
                    ) : isCold ? (
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <Snowflake className="w-8 h-8 text-blue-400" />
                        </motion.div>
                    ) : (
                        <Flame className="w-8 h-8 text-orange-400" />
                    )}
                    <div>
                        <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Studie-streak</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {isOnFire ? "Du är i zonen! 🔥" : isCold ? "Börja din streak idag!" : "Fortsätt så!"}
                        </p>
                    </div>
                </div>

                {/* Current streak counter */}
                <motion.div
                    className="text-right"
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setShowCelebration(true)}
                    onAnimationComplete={() => setTimeout(() => setShowCelebration(false), 1500)}
                >
                    <motion.div
                        key={streakData.current}
                        initial={{ scale: 1.2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`text-4xl font-black ${isOnFire ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-700 dark:text-zinc-300'}`}
                    >
                        {streakData.current}
                    </motion.div>
                    <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">dagar</div>
                </motion.div>
            </div>

            {/* Progress to Next Milestone */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                        Nästa: {nextMilestone.emoji} {nextMilestone.name}
                    </span>
                    <span className="text-xs font-medium text-zinc-500 bg-white/50 dark:bg-zinc-800/50 px-2 py-0.5 rounded-full">
                        {streakData.current}/{nextMilestone.days}
                    </span>
                </div>
                <div className="h-3 bg-white/80 dark:bg-zinc-800/80 rounded-full overflow-hidden shadow-inner">
                    <motion.div
                        className="h-full bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 relative"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressToNext}%` }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {/* Shimmer effect on progress bar */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                        />
                    </motion.div>
                </div>
            </div>

            {/* Milestones Grid */}
            <div className="grid grid-cols-4 gap-2 mb-6">
                {milestones.map((milestone, idx) => (
                    <motion.div
                        key={milestone.days}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ scale: milestone.unlocked ? 1.05 : 1, y: milestone.unlocked ? -2 : 0 }}
                        className={`relative text-center p-3 rounded-xl border transition-all cursor-default ${milestone.unlocked
                            ? 'bg-white dark:bg-zinc-800 border-orange-200 dark:border-orange-700 shadow-sm hover:shadow-md'
                            : 'bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-700 opacity-50'
                            }`}
                    >
                        {/* Unlocked glow */}
                        {milestone.unlocked && (
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded-xl"
                                animate={{ opacity: [0.5, 0.8, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        )}
                        <div className="relative">
                            <motion.div
                                className="text-2xl mb-1"
                                animate={milestone.unlocked ? { rotate: [0, -5, 5, 0] } : {}}
                                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                            >
                                {milestone.emoji}
                            </motion.div>
                            <div className="text-xs font-bold text-zinc-600 dark:text-zinc-300">{milestone.days}d</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Stats Row — 2×2 grid */}
            <div className="grid grid-cols-2 gap-3">
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm rounded-xl p-4 border border-zinc-200/50 dark:border-zinc-700/50"
                >
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 font-medium">🏆 Längsta streak</div>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-white">{streakData.longest} <span className="text-sm font-normal text-zinc-500">dagar</span></div>
                </motion.div>
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm rounded-xl p-4 border border-zinc-200/50 dark:border-zinc-700/50"
                >
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 font-medium">📅 Totalt antal dagar</div>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-white">{streakData.totalStudyDays}</div>
                </motion.div>

                {/* Efficiency score */}
                {streakData.efficiencyScore !== undefined && (
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm rounded-xl p-4 border border-zinc-200/50 dark:border-zinc-700/50"
                    >
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 font-medium">⚡ Effektivitetspoäng</div>
                        <div className="text-2xl font-bold text-orange-500">
                            {streakData.efficiencyScore.toFixed(1)}
                            <span className="text-sm font-normal text-zinc-500 ml-1">rätt/min</span>
                        </div>
                    </motion.div>
                )}

                {/* Weekday mini heatmap */}
                {streakData.weekdayPerformance && streakData.weekdayPerformance.length === 7 && (
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm rounded-xl p-4 border border-zinc-200/50 dark:border-zinc-700/50"
                    >
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 font-medium">📆 Bästa studiedag</div>
                        <div className="flex gap-1 items-end">
                            {(['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'] as const).map((label, i) => {
                                const val = streakData.weekdayPerformance![i];
                                const maxVal = Math.max(...streakData.weekdayPerformance!, 1);
                                const h = Math.max(6, Math.round((val / maxVal) * 32));
                                const isMax = val === maxVal && val > 0;
                                return (
                                    <div key={label} className="flex flex-col items-center gap-1 flex-1">
                                        <div
                                            className="w-full rounded-sm transition-all"
                                            style={{
                                                height: h,
                                                background: isMax
                                                    ? 'linear-gradient(180deg,#f97316,#ea580c)'
                                                    : val > 0 ? 'rgba(249,115,22,0.35)' : '#f4f4f5',
                                            }}
                                            title={`${label}: ${val} poäng`}
                                        />
                                        <span className="text-[9px] text-zinc-400">{label[0]}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Freeze Days */}
            {streakData.freezeDaysAvailable > 0 && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl border border-blue-200/50 dark:border-blue-700/50"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <motion.div
                                animate={{ rotate: [0, 15, -15, 0] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                <Snowflake className="w-5 h-5 text-blue-500" />
                            </motion.div>
                            <div>
                                <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Frysdagar</div>
                                <div className="text-xs text-zinc-500 dark:text-zinc-400">Skydda din streak</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {[...Array(streakData.freezeDaysAvailable)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center border border-blue-200 dark:border-blue-700"
                                >
                                    <Snowflake className="w-4 h-4 text-blue-500" />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
