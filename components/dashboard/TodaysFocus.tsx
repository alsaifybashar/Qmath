'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import type { DailyRecommendation } from './DailyFocus';

// ============================================================================
// TYPES
// ============================================================================

interface TodaysFocusProps {
    recommendations: DailyRecommendation[];
    userName: string;
}

// ============================================================================
// MAIN COMPONENT - Hero-style single focus card
// ============================================================================

export default function TodaysFocus({ recommendations, userName }: TodaysFocusProps) {
    const [showAll, setShowAll] = useState(false);
    const heroRecommendation = recommendations[0];
    const otherRecommendations = recommendations.slice(1, 4);

    if (!heroRecommendation) {
        return <EmptyState userName={userName} />;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
        >
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-pink-500/10" />

            {/* Floating orbs background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl"
                    animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                />
            </div>

            <div className="relative p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <motion.div
                            className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <span className="text-xl">🎯</span>
                        </motion.div>
                        <div>
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Dagens Fokus</h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {getTimeBasedGreeting()}, {userName}!
                            </p>
                        </div>
                    </div>
                    <motion.div
                        className="px-3 py-1.5 bg-gradient-to-r from-amber-400/20 to-orange-400/20 rounded-full border border-amber-400/30"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                            ⚡ Prioritet
                        </span>
                    </motion.div>
                </div>

                {/* Hero Recommendation Card */}
                <HeroCard recommendation={heroRecommendation} />

                {/* Other recommendations collapsed list */}
                {otherRecommendations.length > 0 && (
                    <div className="mt-4">
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                        >
                            <motion.span
                                animate={{ rotate: showAll ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                ▼
                            </motion.span>
                            {showAll ? 'Dölj' : `${otherRecommendations.length} fler`} rekommendationer
                        </button>

                        <AnimatePresence>
                            {showAll && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden mt-3 space-y-2"
                                >
                                    {otherRecommendations.map((rec, idx) => (
                                        <MiniRecommendationCard key={rec.id} recommendation={rec} index={idx} />
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ============================================================================
// HERO CARD COMPONENT
// ============================================================================

function HeroCard({ recommendation: rec }: { recommendation: DailyRecommendation }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            whileHover={{ y: -2 }}
            className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200/50 dark:border-blue-700/30 p-5"
        >
            {/* Shimmer effect on hover */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: '200%' }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    />
                )}
            </AnimatePresence>

            <div className="relative">
                {/* Topic header */}
                <div className="flex items-start gap-4 mb-4">
                    <motion.div
                        animate={{ scale: isHovered ? 1.1 : 1 }}
                        className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl shadow-lg shadow-blue-500/25"
                    >
                        {rec.icon}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                {getTypeLabel(rec.type)}
                            </span>
                            <span className="text-xs text-zinc-400">•</span>
                            <span className="text-xs text-zinc-500">
                                {rec.metadata.daysSince ? `${rec.metadata.daysSince}d sedan senaste övning` : 'Nytt ämne'}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">
                            {rec.topicTitle}
                        </h3>
                    </div>
                </div>

                {/* AI-generated explanation - the "why" */}
                <div className="mb-5 p-4 rounded-lg bg-white/60 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-700/30">
                    <div className="flex items-start gap-2">
                        <span className="text-lg">💡</span>
                        <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            "{generateNaturalExplanation(rec)}"
                        </p>
                    </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-3 mb-5">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 dark:bg-zinc-800/60 rounded-lg border border-zinc-200/50 dark:border-zinc-700/30">
                        <ClockIcon className="w-4 h-4 text-zinc-400" />
                        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">~{rec.estimatedTimeMinutes} min</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 dark:bg-zinc-800/60 rounded-lg border border-zinc-200/50 dark:border-zinc-700/30">
                        <span className="text-sm">
                            {'●'.repeat(rec.difficulty)}
                            {'○'.repeat(5 - rec.difficulty)}
                        </span>
                        <span className="text-xs text-zinc-500">Svårighetsgrad</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200/50 dark:border-amber-700/30">
                        <BoltIcon className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-bold text-amber-600 dark:text-amber-400">+{rec.xpReward} XP</span>
                    </div>
                </div>

                {/* CTA Button */}
                <Link
                    href={`/practice/${rec.topicId}?type=${rec.type}`}
                    className="group relative block w-full"
                >
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="relative overflow-hidden px-6 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-[length:200%_auto] rounded-xl text-white font-bold text-center shadow-lg shadow-blue-500/25"
                    >
                        {/* Animated gradient */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-[length:200%_auto]"
                            animate={{ backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        />

                        {/* Glow pulse */}
                        <motion.div
                            className="absolute inset-0 bg-white/20 rounded-xl"
                            animate={{ opacity: [0, 0.3, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />

                        <span className="relative flex items-center justify-center gap-2">
                            Starta övning
                            <motion.span
                                animate={{ x: [0, 4, 0] }}
                                transition={{ duration: 1, repeat: Infinity }}
                            >
                                →
                            </motion.span>
                        </span>
                    </motion.div>
                </Link>
            </div>
        </motion.div>
    );
}

// ============================================================================
// MINI RECOMMENDATION CARD (for expandable list)
// ============================================================================

function MiniRecommendationCard({ recommendation: rec, index }: { recommendation: DailyRecommendation; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
        >
            <Link
                href={`/practice/${rec.topicId}?type=${rec.type}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/50 dark:border-zinc-700/30 hover:border-blue-300 dark:hover:border-blue-600 transition-all hover:shadow-md"
            >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-700 dark:to-zinc-800 flex items-center justify-center text-xl">
                    {rec.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-zinc-900 dark:text-white truncate">{rec.topicTitle}</h4>
                    <p className="text-xs text-zinc-500 truncate">{rec.message}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400">+{rec.xpReward} XP</span>
                    <span className="text-xs text-zinc-400">~{rec.estimatedTimeMinutes}m</span>
                </div>
            </Link>
        </motion.div>
    );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyState({ userName }: { userName: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700/50 p-6 text-center"
        >
            <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-6xl mb-4"
            >
                🎉
            </motion.div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                Du är ikapp, {userName}!
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Inga brådskande repetitioner eller rekommendationer just nu. Känn dig fri att utforska vilket ämne som helst eller ta en välförtjänt paus!
            </p>
            <Link
                href="/topics"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
                Utforska ämnen
                <span>→</span>
            </Link>
        </motion.div>
    );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getTimeBasedGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 5) return 'God natt';
    if (hour < 12) return 'God morgon';
    if (hour < 17) return 'God eftermiddag';
    if (hour < 21) return 'God kväll';
    return 'God natt';
}

function getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        review: 'Dags att repetera',
        strengthen: 'Behöver övning',
        new_content: 'Nytt ämne',
        challenge: 'Utmaning',
        warm_up: 'Uppvärmning',
        deep_dive: 'Djupdykning',
    };
    return labels[type] || 'Övning';
}

function generateNaturalExplanation(rec: DailyRecommendation): string {
    // Generate a natural language explanation based on the recommendation metadata
    const explanations: string[] = [];

    if (rec.type === 'review' && rec.metadata.daysSince) {
        explanations.push(`Det har gått ${rec.metadata.daysSince} dagar sedan du övade på detta ämne.`);
    }

    if (rec.metadata.errorRate && rec.metadata.errorRate > 0.3) {
        const accuracy = Math.round((1 - rec.metadata.errorRate) * 100);
        explanations.push(`Din noggrannhet sjönk till ${accuracy}% på detta ämne.`);
    }

    if (rec.metadata.masteryGain && rec.metadata.masteryGain > 0.1) {
        explanations.push(`En snabb session kan öka din bemästring med ${Math.round(rec.metadata.masteryGain * 100)}%.`);
    }

    if (rec.type === 'new_content') {
        explanations.push("Detta är ett utmärkt tillfälle att lära sig något nytt!");
    }

    if (rec.type === 'challenge') {
        explanations.push("Redo för en utmaning? Testa dina färdigheter med svårare problem.");
    }

    // Default explanation if none generated
    if (explanations.length === 0) {
        explanations.push(rec.message || "Att öva på detta ämne hjälper dig att stärka din förståelse.");
    }

    // Add a motivational ending
    const endings = [
        " En fokuserad 10-minuters session kan göra stor skillnad.",
        " Konsekvens slår intensitet – låt oss behålla momentum!",
        " Små steg leder till stora förbättringar.",
    ];

    return explanations.join(' ') + endings[Math.floor(Math.random() * endings.length)];
}

// ============================================================================
// ICONS
// ============================================================================

function ClockIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
        </svg>
    );
}

function BoltIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
            />
        </svg>
    );
}
