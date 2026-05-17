'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Trophy, Star, Shield, Target, Sparkles, LucideIcon } from 'lucide-react';
import { AchievementBadgeData } from '@/types/analytics';

const ICON_MAP: Record<AchievementBadgeData['icon'], LucideIcon> = {
    flame: Flame,
    trophy: Trophy,
    star: Star,
    shield: Shield,
    target: Target,
    sparkles: Sparkles,
};

interface AchievementBadgeProps {
    badge: AchievementBadgeData;
    index?: number;
}

export default function AchievementBadge({ badge, index = 0 }: AchievementBadgeProps) {
    const [hover, setHover] = useState(false);
    const Icon = ICON_MAP[badge.icon];
    const unlocked = badge.unlocked;

    return (
        <motion.div
            className="relative flex-shrink-0"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.06, type: 'spring', damping: 18, stiffness: 260 }}
            onHoverStart={() => setHover(true)}
            onHoverEnd={() => setHover(false)}
            onFocus={() => setHover(true)}
            onBlur={() => setHover(false)}
        >
            <button
                type="button"
                aria-label={badge.name}
                className={[
                    'relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all',
                    'backdrop-blur-2xl border focus:outline-none focus:ring-2 focus:ring-primary-400/60',
                    unlocked
                        ? 'bg-gradient-to-br from-primary-500 to-accent-500 border-white/60 dark:border-white/10 shadow-elevation-3 animate-glow-pulse'
                        : 'bg-white/45 dark:bg-zinc-950/45 border-white/60 dark:border-white/10 grayscale opacity-50',
                ].join(' ')}
            >
                <Icon
                    size={28}
                    className={unlocked ? 'text-white drop-shadow-md' : 'text-zinc-500 dark:text-zinc-400'}
                    strokeWidth={2}
                />
                {unlocked && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-zinc-900" />
                )}
            </button>

            <AnimatePresence>
                {hover && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.95 }}
                        transition={{ duration: 0.18, delay: 0.05 }}
                        className="absolute z-30 left-1/2 top-full mt-3 -translate-x-1/2 w-56 pointer-events-none"
                    >
                        <div className="bg-white/85 dark:bg-zinc-950/85 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-2xl shadow-elevation-3 p-3 text-left">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={[
                                    'text-[10px] font-semibold tracking-wide uppercase',
                                    unlocked ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500',
                                ].join(' ')}>
                                    {unlocked ? 'Upplåst' : 'Låst'}
                                </span>
                            </div>
                            <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{badge.name}</div>
                            <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-snug">
                                {badge.description}
                            </div>
                            {badge.progress && !unlocked && (
                                <div className="mt-2">
                                    <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{
                                                width: `${Math.min(100, (badge.progress.current / badge.progress.target) * 100)}%`,
                                            }}
                                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                            className="h-full bg-gradient-to-r from-primary-500 to-accent-500"
                                        />
                                    </div>
                                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 tabular-nums">
                                        {badge.progress.current} / {badge.progress.target}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
