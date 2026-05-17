'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Zap, TrendingUp } from 'lucide-react';
import { GamificationData, percentToStage } from '@/types/analytics';
import MotivationalCard, { Pace } from './MotivationalCard';
import ProgressionRing from './ProgressionRing';
import AchievementBadge from './AchievementBadge';

function paceFromReadiness(pct: number): Pace {
    if (pct >= 75) return 'ahead';
    if (pct >= 45) return 'on-track';
    return 'behind';
}

interface ChipProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    tone: 'violet' | 'orange' | 'primary';
    delay?: number;
}

function StatChip({ icon, label, value, tone, delay = 0 }: ChipProps) {
    const tones: Record<ChipProps['tone'], string> = {
        violet:
            'from-violet-500/20 to-violet-500/5 text-violet-700 dark:text-violet-300 ring-violet-300/40 dark:ring-violet-500/30',
        orange:
            'from-orange-500/20 to-amber-500/5 text-orange-700 dark:text-orange-300 ring-orange-300/40 dark:ring-orange-500/30',
        primary:
            'from-primary-500/20 to-accent-500/5 text-primary-700 dark:text-primary-300 ring-primary-300/40 dark:ring-primary-500/30',
    };

    return (
        <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay, type: 'spring', damping: 18, stiffness: 280 }}
            className={[
                'inline-flex items-center gap-2 rounded-full pl-2 pr-3 py-1.5',
                'bg-gradient-to-br',
                tones[tone],
                'ring-1 backdrop-blur-xl',
            ].join(' ')}
        >
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/70 dark:bg-zinc-900/60">
                {icon}
            </span>
            <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold tabular-nums">{value}</span>
                <span className="text-[10px] uppercase tracking-wide opacity-70 font-medium">{label}</span>
            </div>
        </motion.div>
    );
}

interface AnalyticsHeroProps {
    gamification: GamificationData;
    studentName?: string;
}

export default function AnalyticsHero({ gamification, studentName }: AnalyticsHeroProps) {
    const {
        xp,
        weeklyXp,
        streakDays,
        examReadinessPct,
        achievements,
    } = gamification;

    const pace = paceFromReadiness(examReadinessPct);
    const examStage = percentToStage(examReadinessPct);

    return (
        <motion.section
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
        >
            {/* Aurora background */}
            <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-primary-500/8 via-transparent to-accent-500/8 blur-2xl" />

            <div className="relative bg-white/60 dark:bg-zinc-950/55 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-3xl shadow-elevation-3 overflow-hidden">
                {/* Subtle top gradient line */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/40 to-transparent" />

                <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 lg:gap-10 items-center">
                    {/* Left – greeting + motivation + chips */}
                    <div className="space-y-5 min-w-0">
                        <div>
                            <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-primary-600/80 dark:text-primary-400/80">
                                Läranalys
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 leading-tight">
                                Din väg framåt
                            </h1>
                        </div>

                        <MotivationalCard pace={pace} name={studentName} />

                        <div className="flex flex-wrap items-center gap-2.5">
                            <StatChip
                                icon={<Zap size={14} className="text-violet-600 dark:text-violet-300" strokeWidth={2.5} />}
                                label="XP"
                                value={xp.toLocaleString('sv-SE')}
                                tone="violet"
                                delay={0.1}
                            />
                            <StatChip
                                icon={<Flame size={14} className="text-orange-600 dark:text-orange-300" strokeWidth={2.5} />}
                                label={streakDays === 1 ? 'dag' : 'dagar'}
                                value={streakDays}
                                tone="orange"
                                delay={0.18}
                            />
                            <StatChip
                                icon={<TrendingUp size={14} className="text-primary-600 dark:text-primary-300" strokeWidth={2.5} />}
                                label="denna vecka"
                                value={`+${weeklyXp}`}
                                tone="primary"
                                delay={0.26}
                            />
                        </div>
                    </div>

                    {/* Right – exam readiness ring */}
                    <div className="flex justify-center lg:justify-end">
                        <ProgressionRing
                            value={examReadinessPct}
                            stage={examStage}
                            label="Tentaklarhet"
                            sublabel="vägen mot Redo"
                            size="lg"
                        />
                    </div>
                </div>

                {/* Achievement strip */}
                <div className="px-6 md:px-8 pb-6">
                    <div className="text-[11px] font-semibold tracking-wide uppercase text-zinc-500 dark:text-zinc-400 mb-3">
                        Prestationer
                    </div>
                    <div className="flex items-center gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                        {achievements.map((badge, i) => (
                            <div key={badge.id} className="snap-start">
                                <AchievementBadge badge={badge} index={i} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.section>
    );
}
