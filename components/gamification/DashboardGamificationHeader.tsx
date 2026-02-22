'use client';

import { Zap, Flame, Trophy, Star, Sparkles } from 'lucide-react';
import { QlixAlien } from './QlixAlien';
import { XPProgressBar, getLevelInfo } from './XPProgressBar';

const C = {
    bg: '#F0F2F8',
    text: '#1A1D2E',
    textMuted: '#A0A5C0',
    blue: '#4361EE',
    green: '#22C55E',
};

interface DashboardGamificationHeaderProps {
    greeting: string;
    userName: string;
    reviewCount: number;
    totalXP: number;
    currentStreak: number;
}

export function DashboardGamificationHeader({
    greeting,
    userName,
    reviewCount,
    totalXP,
    currentStreak,
}: DashboardGamificationHeaderProps) {
    const { current } = getLevelInfo(totalXP);

    // Pick Qlix mood based on stats
    const qlixMood = currentStreak >= 7
        ? 'cheering' as const
        : currentStreak >= 3
            ? 'happy' as const
            : reviewCount > 5
                ? 'thinking' as const
                : 'waving' as const;

    // Qlix comment based on context
    const qlixComment = currentStreak >= 7
        ? `${currentStreak} dagar i rad! Du är legend! 🔥`
        : currentStreak >= 3
            ? `${currentStreak}-dagarssvit! Fortsätt! 💪`
            : reviewCount > 5
                ? `${reviewCount} ämnen att repetera — du klarar det!`
                : 'Redo att erövra lite matte? ✨';

    return (
        <div className="mb-6">
            {/* Top row: Greeting + XP bar */}
            <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-2xl font-semibold" style={{ color: C.text }}>
                        {greeting}, {userName}
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: C.textMuted }}>
                        {reviewCount > 0
                            ? <><strong style={{ color: C.blue }}>{reviewCount} områden</strong> behöver din uppmärksamhet</>
                            : 'Allt är uppdaterat — bra jobbat!'}
                    </p>
                </div>

                <XPProgressBar totalXp={totalXP} compact className="min-w-[220px]" />
            </div>

            {/* Qlix Companion Card */}
            <div
                className="rounded-2xl p-4 flex items-center gap-4 overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(6,182,212,0.04) 50%, rgba(139,92,246,0.04) 100%)',
                    border: '1px solid rgba(34,197,94,0.12)',
                }}
            >
                {/* Qlix Alien */}
                <div className="flex-shrink-0 relative">
                    <div className="absolute inset-0 -m-3 rounded-full bg-gradient-to-tr from-green-400/15 to-cyan-400/10 blur-xl" />
                    <QlixAlien mood={qlixMood} size={56} />
                </div>

                {/* Qlix Message */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">
                            Qlix säger
                        </span>
                        <Sparkles className="w-3 h-3 text-green-400" />
                    </div>
                    <p className="text-sm text-zinc-700 dark:text-zinc-200 font-medium leading-relaxed">
                        {qlixComment}
                    </p>
                </div>

                {/* Quick stats */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Streak */}
                    {currentStreak > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-500/10 rounded-xl">
                            <Flame className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                                {currentStreak}
                            </span>
                        </div>
                    )}

                    {/* Level badge */}
                    <div
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                        style={{
                            background: `${current.color}11`,
                        }}
                    >
                        <Star className="w-4 h-4" style={{ color: current.color }} />
                        <span className="text-sm font-bold" style={{ color: current.color }}>
                            Lvl {current.level}
                        </span>
                    </div>

                    {/* Total XP */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 dark:bg-violet-500/10 rounded-xl">
                        <Zap className="w-4 h-4 text-violet-500" />
                        <span className="text-sm font-bold text-violet-600 dark:text-violet-400">
                            {totalXP}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
