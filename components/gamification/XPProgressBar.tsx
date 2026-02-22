'use client';

import { motion } from 'framer-motion';
import { Zap, Star, Trophy, Flame } from 'lucide-react';
import { QlixAlien } from './QlixAlien';

// ─── Level definitions ──────────────────────────────────────────────────────
const LEVELS = [
    { level: 1, title: 'Nybörjare', xp: 0, color: '#94a3b8', emoji: '🌱' },
    { level: 2, title: 'Utforskare', xp: 100, color: '#22c55e', emoji: '🌿' },
    { level: 3, title: 'Lärling', xp: 300, color: '#3b82f6', emoji: '📘' },
    { level: 4, title: 'Adept', xp: 600, color: '#8b5cf6', emoji: '⚡' },
    { level: 5, title: 'Mästare', xp: 1000, color: '#f59e0b', emoji: '🌟' },
    { level: 6, title: 'Expert', xp: 1800, color: '#ef4444', emoji: '🔥' },
    { level: 7, title: 'Legend', xp: 3000, color: '#ec4899', emoji: '👑' },
    { level: 8, title: 'Galaktisk Guru', xp: 5000, color: '#06b6d4', emoji: '🚀' },
];

export function getLevelInfo(totalXp: number) {
    let current = LEVELS[0];
    let next = LEVELS[1];

    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (totalXp >= LEVELS[i].xp) {
            current = LEVELS[i];
            next = LEVELS[Math.min(i + 1, LEVELS.length - 1)];
            break;
        }
    }

    const xpInLevel = totalXp - current.xp;
    const xpNeeded = next.xp - current.xp;
    const progress = xpNeeded > 0 ? Math.min(100, (xpInLevel / xpNeeded) * 100) : 100;

    return { current, next, xpInLevel, xpNeeded, progress };
}

// ─── XP Progress Bar ─────────────────────────────────────────────────────────
interface XPProgressBarProps {
    totalXp: number;
    showAlien?: boolean;
    compact?: boolean;
    className?: string;
}

export function XPProgressBar({ totalXp, showAlien = false, compact = false, className = '' }: XPProgressBarProps) {
    const { current, next, xpInLevel, xpNeeded, progress } = getLevelInfo(totalXp);

    if (compact) {
        return (
            <div className={`flex items-center gap-2.5 ${className}`}>
                <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-md"
                    style={{
                        background: `linear-gradient(135deg, ${current.color}, ${current.color}dd)`,
                        boxShadow: `0 3px 10px ${current.color}44`,
                    }}
                >
                    {current.level}
                </div>
                <div className="flex-1">
                    <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                        <motion.div
                            className="h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            style={{ background: `linear-gradient(90deg, ${current.color}, ${next.color})` }}
                        />
                    </div>
                </div>
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                    {xpInLevel}/{xpNeeded} XP
                </span>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            <div
                className="rounded-2xl p-5 overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(6,182,212,0.06) 100%)',
                    border: '1px solid rgba(34,197,94,0.15)',
                }}
            >
                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        {showAlien ? (
                            <QlixAlien mood="happy" size={40} />
                        ) : (
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                                style={{
                                    background: `linear-gradient(135deg, ${current.color}, ${current.color}cc)`,
                                    boxShadow: `0 4px 15px ${current.color}33`,
                                }}
                            >
                                {current.level}
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                                    Nivå {current.level}
                                </span>
                                <span className="text-sm">{current.emoji}</span>
                            </div>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                {current.title}
                            </span>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="flex items-center gap-1 text-sm font-bold" style={{ color: current.color }}>
                            <Zap className="w-4 h-4" />
                            {totalXp} XP
                        </div>
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">
                            Totalt intjänat
                        </span>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="relative">
                    <div className="h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden shadow-inner">
                        <motion.div
                            className="h-full rounded-full relative"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                            style={{
                                background: `linear-gradient(90deg, ${current.color}, ${next.color})`,
                                boxShadow: `0 0 10px ${current.color}40`,
                            }}
                        >
                            {/* Shimmer effect */}
                            <div className="absolute inset-0 animate-shimmer" />
                        </motion.div>
                    </div>

                    {/* Progress label */}
                    <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">
                            {xpInLevel} / {xpNeeded} XP till nivå {next.level}
                        </span>
                        <span className="text-xs font-medium" style={{ color: next.color }}>
                            {next.title} {next.emoji}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Achievement Badge ──────────────────────────────────────────────────────
interface AchievementBadgeProps {
    emoji: string;
    name: string;
    description: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    unlocked: boolean;
    unlockedAt?: Date;
}

const RARITY_COLORS = {
    common: { bg: 'from-zinc-400 to-zinc-500', border: 'border-zinc-300 dark:border-zinc-600', text: 'text-zinc-500' },
    uncommon: { bg: 'from-emerald-400 to-green-500', border: 'border-emerald-300 dark:border-emerald-600', text: 'text-emerald-500' },
    rare: { bg: 'from-blue-400 to-indigo-500', border: 'border-blue-300 dark:border-blue-600', text: 'text-blue-500' },
    epic: { bg: 'from-purple-400 to-violet-500', border: 'border-purple-300 dark:border-purple-600', text: 'text-purple-500' },
    legendary: { bg: 'from-amber-400 to-orange-500', border: 'border-amber-300 dark:border-amber-600', text: 'text-amber-500' },
};

export function AchievementBadge({ emoji, name, description, rarity, unlocked, unlockedAt }: AchievementBadgeProps) {
    const colors = RARITY_COLORS[rarity];

    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className={`relative rounded-xl border p-4 transition-all ${unlocked
                ? `${colors.border} bg-white dark:bg-zinc-800/50`
                : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 opacity-50'
                }`}
        >
            <div className="flex items-start gap-3">
                <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-md ${unlocked
                        ? `bg-gradient-to-br ${colors.bg} text-white`
                        : 'bg-zinc-200 dark:bg-zinc-700 grayscale'
                        }`}
                >
                    {emoji}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-100 truncate">
                            {name}
                        </span>
                        <span className={`text-[10px] uppercase font-bold tracking-wider ${colors.text}`}>
                            {rarity}
                        </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        {description}
                    </p>
                    {unlocked && unlockedAt && (
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
                            Upplåst {unlockedAt.toLocaleDateString('sv-SE')}
                        </p>
                    )}
                </div>
                {unlocked && (
                    <div className="flex-shrink-0">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                            <Trophy className="w-3 h-3 text-emerald-500" />
                        </div>
                    </div>
                )}
            </div>

            {/* Locked overlay */}
            {!unlocked && (
                <div className="absolute inset-0 rounded-xl flex items-center justify-center">
                    <span className="text-2xl grayscale opacity-50">🔒</span>
                </div>
            )}
        </motion.div>
    );
}

// ─── Streak Display ─────────────────────────────────────────────────────────
interface StreakDisplayProps {
    currentStreak: number;
    longestStreak: number;
    weekDays: boolean[]; // 7 booleans for Mon-Sun
}

export function StreakDisplay({ currentStreak, longestStreak, weekDays }: StreakDisplayProps) {
    const dayLabels = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];

    return (
        <div className="rounded-2xl p-5 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-500/10 dark:to-amber-500/10 border border-orange-200 dark:border-orange-500/20">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <span className="font-semibold text-zinc-800 dark:text-zinc-100">Studiesvit</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">{currentStreak}</span>
                    <span className="text-sm text-orange-500/70">dagar</span>
                </div>
            </div>

            {/* Week visualization */}
            <div className="flex items-center justify-between gap-1">
                {dayLabels.map((label, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.05, type: 'spring', damping: 12 }}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${weekDays[i]
                                ? 'bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-sm shadow-orange-500/30'
                                : 'bg-orange-100 dark:bg-orange-500/10 text-orange-300 dark:text-orange-700'
                                }`}
                        >
                            {weekDays[i] ? '🔥' : '·'}
                        </motion.div>
                        <span className="text-[10px] text-zinc-400 font-medium">{label}</span>
                    </div>
                ))}
            </div>

            {longestStreak > 0 && (
                <div className="flex items-center gap-1 mt-3 text-xs text-orange-500/70">
                    <Star className="w-3 h-3" />
                    Längsta sviten: {longestStreak} dagar
                </div>
            )}
        </div>
    );
}
