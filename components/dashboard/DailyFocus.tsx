'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

export type RecommendationType = 'review' | 'strengthen' | 'new_content' | 'challenge' | 'warm_up' | 'deep_dive';

export interface DailyRecommendation {
    id: string;
    type: RecommendationType;
    topicId: string;
    topicTitle: string;
    priority: number;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    icon: string;
    estimatedTimeMinutes: number;
    difficulty: 1 | 2 | 3 | 4 | 5;
    xpReward: number;
    questionCount: number;
    metadata: {
        reason: string;
        errorRate?: number;
        daysSince?: number;
        difficulty?: number;
        streak?: number;
        masteryGain?: number;
        prerequisitesCleared?: string[];
        weakPatterns?: string[];
    };
}

interface DailyFocusProps {
    recommendations: DailyRecommendation[];
    userName: string;
    studyTip?: { tip: string; icon: string; category: string };
    sessionEstimate?: { totalMinutes: number; totalXP: number; totalQuestions: number };
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function DailyFocus({
    recommendations,
    userName,
    studyTip,
    sessionEstimate,
}: DailyFocusProps) {
    const [selectedCard, setSelectedCard] = useState<string | null>(null);
    const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
    const [skippedTasks, setSkippedTasks] = useState<Set<string>>(new Set());
    const [focusMode, setFocusMode] = useState<'all' | 'review' | 'learn' | 'challenge'>('all');

    // Filter recommendations based on focus mode
    const filteredRecommendations = useMemo(() => {
        if (focusMode === 'all') return recommendations;

        const modeMapping: Record<string, RecommendationType[]> = {
            review: ['review', 'warm_up'],
            learn: ['new_content', 'strengthen', 'deep_dive'],
            challenge: ['challenge'],
        };

        return recommendations.filter(r => modeMapping[focusMode]?.includes(r.type));
    }, [recommendations, focusMode]);

    // Calculate session stats
    const sessionStats = useMemo(() => {
        const active = filteredRecommendations.filter(
            r => !completedTasks.has(r.id) && !skippedTasks.has(r.id)
        );
        return {
            totalMinutes: active.reduce((sum, r) => sum + r.estimatedTimeMinutes, 0),
            totalXP: active.reduce((sum, r) => sum + r.xpReward, 0),
            totalQuestions: active.reduce((sum, r) => sum + r.questionCount, 0),
            completedCount: completedTasks.size,
            remainingCount: active.length,
        };
    }, [filteredRecommendations, completedTasks, skippedTasks]);

    const handleComplete = (id: string) => {
        setCompletedTasks(prev => new Set([...prev, id]));
    };

    const handleSkip = (id: string) => {
        setSkippedTasks(prev => new Set([...prev, id]));
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden h-full flex flex-col">
            {/* Header with gradient */}
            <div className="relative p-6 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white">
                <div className="absolute inset-0 bg-black/10" />
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">📋</span>
                            <h2 className="text-xl font-bold">Daily Focus</h2>
                        </div>
                        <div className="text-sm opacity-80">
                            {getGreeting()}, {userName}!
                        </div>
                    </div>

                    {/* Session estimate bar */}
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full">
                            <ClockIcon className="w-4 h-4" />
                            <span>{sessionStats.totalMinutes} min</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full">
                            <BoltIcon className="w-4 h-4" />
                            <span>{sessionStats.totalXP} XP</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full">
                            <QuestionIcon className="w-4 h-4" />
                            <span>{sessionStats.totalQuestions} Q</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Focus mode tabs */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800">
                {(['all', 'review', 'learn', 'challenge'] as const).map(mode => (
                    <button
                        key={mode}
                        onClick={() => setFocusMode(mode)}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${focusMode === mode
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                            }`}
                    >
                        {getModeLabel(mode)}
                        {focusMode === mode && (
                            <motion.div
                                layoutId="focusModeIndicator"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Recommendations list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <AnimatePresence mode="popLayout">
                    {filteredRecommendations.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-12"
                        >
                            <div className="text-6xl mb-4">🎉</div>
                            <h3 className="text-lg font-bold mb-2">You're all caught up!</h3>
                            <p className="text-sm text-zinc-500">
                                No {focusMode !== 'all' ? `${focusMode} ` : ''}recommendations right now.
                                Feel free to explore any topic you'd like.
                            </p>
                        </motion.div>
                    ) : (
                        filteredRecommendations.map((rec, index) => {
                            const isCompleted = completedTasks.has(rec.id);
                            const isSkipped = skippedTasks.has(rec.id);

                            if (isCompleted || isSkipped) return null;

                            return (
                                <RecommendationCard
                                    key={rec.id}
                                    recommendation={rec}
                                    index={index}
                                    isSelected={selectedCard === rec.id}
                                    onSelect={() => setSelectedCard(selectedCard === rec.id ? null : rec.id)}
                                    onComplete={() => handleComplete(rec.id)}
                                    onSkip={() => handleSkip(rec.id)}
                                />
                            );
                        })
                    )}
                </AnimatePresence>

                {/* Completed tasks indicator */}
                {completedTasks.size > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-4 text-sm text-green-600 dark:text-green-400"
                    >
                        ✓ {completedTasks.size} task{completedTasks.size > 1 ? 's' : ''} completed
                    </motion.div>
                )}
            </div>

            {/* Study tip footer */}
            {studyTip && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-t border-amber-200 dark:border-amber-800/30"
                >
                    <div className="flex items-start gap-3">
                        <span className="text-xl">{studyTip.icon || '💡'}</span>
                        <div>
                            <h4 className="font-bold text-sm mb-1 text-amber-900 dark:text-amber-100">
                                Study Tip
                            </h4>
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                {studyTip.tip}
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Default study tip if none provided */}
            {!studyTip && filteredRecommendations.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 border-t border-blue-200 dark:border-blue-800/30"
                >
                    <div className="flex items-start gap-3">
                        <span className="text-xl">💡</span>
                        <div>
                            <h4 className="font-bold text-sm mb-1">Study Tip</h4>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                Focus on one recommendation at a time. Deep understanding beats rushing through all of them!
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

// ============================================================================
// RECOMMENDATION CARD
// ============================================================================

interface RecommendationCardProps {
    recommendation: DailyRecommendation;
    index: number;
    isSelected: boolean;
    onSelect: () => void;
    onComplete: () => void;
    onSkip: () => void;
}

function RecommendationCard({
    recommendation: rec,
    index,
    isSelected,
    onSelect,
    onComplete,
    onSkip,
}: RecommendationCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    const colors = getTypeColors(rec.type);
    const urgencyBadge = getUrgencyBadge(rec.urgency);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ delay: index * 0.1 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className={`relative rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${isSelected
                    ? `${colors.borderSelected} ${colors.bgSelected}`
                    : `${colors.border} ${colors.bg} hover:${colors.borderHover}`
                }`}
            onClick={onSelect}
        >
            {/* Urgency indicator bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${colors.urgencyBar}`} />

            {/* Priority badge */}
            {index === 0 && (
                <div className="absolute -top-2 -right-2 z-10">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: 'spring' }}
                        className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg"
                    >
                        Top Priority
                    </motion.div>
                </div>
            )}

            {/* Main content */}
            <div className="p-4">
                <div className="flex items-start gap-3">
                    {/* Icon */}
                    <motion.div
                        animate={{ scale: isHovered ? 1.1 : 1 }}
                        className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colors.iconBg}`}
                    >
                        {rec.icon}
                    </motion.div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                            <div>
                                <div className={`text-xs font-semibold uppercase tracking-wide mb-0.5 ${colors.label}`}>
                                    {getTypeLabel(rec.type)}
                                </div>
                                <h3 className="font-bold text-base leading-tight">{rec.topicTitle}</h3>
                            </div>

                            {/* Stats badges */}
                            <div className="flex flex-col gap-1 items-end flex-shrink-0">
                                <div className="flex items-center gap-1 text-xs text-zinc-500">
                                    <ClockIcon className="w-3.5 h-3.5" />
                                    ~{rec.estimatedTimeMinutes}m
                                </div>
                                <div className={`flex items-center gap-1 text-xs font-medium ${colors.xp}`}>
                                    <BoltIcon className="w-3.5 h-3.5" />
                                    +{rec.xpReward} XP
                                </div>
                            </div>
                        </div>

                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3 line-clamp-2">
                            {rec.message}
                        </p>

                        {/* Metadata tags */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {rec.metadata.daysSince && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${colors.tag}`}>
                                    {rec.metadata.daysSince}d ago
                                </span>
                            )}
                            {rec.metadata.errorRate && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${colors.tag}`}>
                                    {Math.round((1 - rec.metadata.errorRate) * 100)}% accuracy
                                </span>
                            )}
                            {rec.questionCount && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${colors.tag}`}>
                                    {rec.questionCount} questions
                                </span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${colors.tag}`}>
                                {'⭐'.repeat(rec.difficulty)}{'☆'.repeat(5 - rec.difficulty)}
                            </span>
                        </div>

                        {/* Expanded details */}
                        <AnimatePresence>
                            {isSelected && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700">
                                        {/* Weak patterns */}
                                        {rec.metadata.weakPatterns && rec.metadata.weakPatterns.length > 0 && (
                                            <div className="mb-3">
                                                <div className="text-xs font-medium text-zinc-500 mb-1">
                                                    Focus areas:
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {rec.metadata.weakPatterns.map((pattern, i) => (
                                                        <span
                                                            key={i}
                                                            className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded"
                                                        >
                                                            {pattern}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Prerequisites cleared */}
                                        {rec.metadata.prerequisitesCleared && rec.metadata.prerequisitesCleared.length > 0 && (
                                            <div className="mb-3">
                                                <div className="text-xs font-medium text-zinc-500 mb-1">
                                                    Prerequisites completed:
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {rec.metadata.prerequisitesCleared.map((prereq, i) => (
                                                        <span
                                                            key={i}
                                                            className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded"
                                                        >
                                                            ✓ {prereq}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Mastery gain indicator */}
                                        {rec.metadata.masteryGain && (
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-xs text-zinc-500">Potential mastery gain:</span>
                                                <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${rec.metadata.masteryGain * 100}%` }}
                                                        className="h-full bg-gradient-to-r from-green-400 to-emerald-500"
                                                    />
                                                </div>
                                                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                                    +{(rec.metadata.masteryGain * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                        )}

                                        {/* Action buttons */}
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={`/practice/${rec.topicId}?type=${rec.type}`}
                                                className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm text-center transition-all ${colors.button}`}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {getActionButtonText(rec.type)}
                                            </Link>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSkip();
                                                }}
                                                className="px-4 py-2.5 rounded-lg font-medium text-sm border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                            >
                                                Skip
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Quick action when not expanded */}
                        {!isSelected && (
                            <div className="flex items-center gap-2">
                                <Link
                                    href={`/practice/${rec.topicId}?type=${rec.type}`}
                                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${colors.button}`}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {getActionButtonText(rec.type)}
                                </Link>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSkip();
                                    }}
                                    className="px-4 py-2 rounded-lg text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                                >
                                    Skip
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 5) return 'Good night';
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Good night';
}

function getModeLabel(mode: 'all' | 'review' | 'learn' | 'challenge'): string {
    const labels: Record<string, string> = {
        all: 'All',
        review: 'Review',
        learn: 'Learn',
        challenge: 'Challenge',
    };
    return labels[mode] || mode;
}

function getTypeLabel(type: RecommendationType): string {
    const labels: Record<RecommendationType, string> = {
        review: 'Review',
        strengthen: 'Strengthen',
        new_content: 'New Topic',
        challenge: 'Challenge',
        warm_up: 'Warm Up',
        deep_dive: 'Deep Dive',
    };
    return labels[type] || 'Practice';
}

function getActionButtonText(type: RecommendationType): string {
    const texts: Record<RecommendationType, string> = {
        review: 'Start Review →',
        strengthen: 'Practice Now →',
        new_content: 'Start Learning →',
        challenge: 'Take Challenge →',
        warm_up: 'Quick Warm-up →',
        deep_dive: 'Deep Dive →',
    };
    return texts[type] || 'Start →';
}

function getUrgencyBadge(urgency: 'low' | 'medium' | 'high' | 'critical'): { text: string; class: string } | null {
    if (urgency === 'low') return null;

    const badges: Record<string, { text: string; class: string }> = {
        medium: { text: 'Recommended', class: 'bg-blue-100 text-blue-700' },
        high: { text: 'Important', class: 'bg-orange-100 text-orange-700' },
        critical: { text: 'Urgent', class: 'bg-red-100 text-red-700' },
    };
    return badges[urgency] || null;
}

function getTypeColors(type: RecommendationType) {
    const colorSchemes: Record<RecommendationType, {
        bg: string;
        bgSelected: string;
        border: string;
        borderHover: string;
        borderSelected: string;
        label: string;
        button: string;
        iconBg: string;
        tag: string;
        xp: string;
        urgencyBar: string;
    }> = {
        review: {
            bg: 'bg-blue-50/50 dark:bg-blue-900/10',
            bgSelected: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-200/50 dark:border-blue-800/50',
            borderHover: 'border-blue-300 dark:border-blue-700',
            borderSelected: 'border-blue-400 dark:border-blue-600',
            label: 'text-blue-600 dark:text-blue-400',
            button: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25',
            iconBg: 'bg-blue-100 dark:bg-blue-900/50',
            tag: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
            xp: 'text-blue-600 dark:text-blue-400',
            urgencyBar: 'bg-blue-500',
        },
        strengthen: {
            bg: 'bg-orange-50/50 dark:bg-orange-900/10',
            bgSelected: 'bg-orange-50 dark:bg-orange-900/20',
            border: 'border-orange-200/50 dark:border-orange-800/50',
            borderHover: 'border-orange-300 dark:border-orange-700',
            borderSelected: 'border-orange-400 dark:border-orange-600',
            label: 'text-orange-600 dark:text-orange-400',
            button: 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/25',
            iconBg: 'bg-orange-100 dark:bg-orange-900/50',
            tag: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300',
            xp: 'text-orange-600 dark:text-orange-400',
            urgencyBar: 'bg-orange-500',
        },
        new_content: {
            bg: 'bg-green-50/50 dark:bg-green-900/10',
            bgSelected: 'bg-green-50 dark:bg-green-900/20',
            border: 'border-green-200/50 dark:border-green-800/50',
            borderHover: 'border-green-300 dark:border-green-700',
            borderSelected: 'border-green-400 dark:border-green-600',
            label: 'text-green-600 dark:text-green-400',
            button: 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/25',
            iconBg: 'bg-green-100 dark:bg-green-900/50',
            tag: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
            xp: 'text-green-600 dark:text-green-400',
            urgencyBar: 'bg-green-500',
        },
        challenge: {
            bg: 'bg-purple-50/50 dark:bg-purple-900/10',
            bgSelected: 'bg-purple-50 dark:bg-purple-900/20',
            border: 'border-purple-200/50 dark:border-purple-800/50',
            borderHover: 'border-purple-300 dark:border-purple-700',
            borderSelected: 'border-purple-400 dark:border-purple-600',
            label: 'text-purple-600 dark:text-purple-400',
            button: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25',
            iconBg: 'bg-purple-100 dark:bg-purple-900/50',
            tag: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
            xp: 'text-purple-600 dark:text-purple-400',
            urgencyBar: 'bg-gradient-to-r from-purple-500 to-pink-500',
        },
        warm_up: {
            bg: 'bg-amber-50/50 dark:bg-amber-900/10',
            bgSelected: 'bg-amber-50 dark:bg-amber-900/20',
            border: 'border-amber-200/50 dark:border-amber-800/50',
            borderHover: 'border-amber-300 dark:border-amber-700',
            borderSelected: 'border-amber-400 dark:border-amber-600',
            label: 'text-amber-600 dark:text-amber-400',
            button: 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25',
            iconBg: 'bg-amber-100 dark:bg-amber-900/50',
            tag: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
            xp: 'text-amber-600 dark:text-amber-400',
            urgencyBar: 'bg-amber-400',
        },
        deep_dive: {
            bg: 'bg-teal-50/50 dark:bg-teal-900/10',
            bgSelected: 'bg-teal-50 dark:bg-teal-900/20',
            border: 'border-teal-200/50 dark:border-teal-800/50',
            borderHover: 'border-teal-300 dark:border-teal-700',
            borderSelected: 'border-teal-400 dark:border-teal-600',
            label: 'text-teal-600 dark:text-teal-400',
            button: 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/25',
            iconBg: 'bg-teal-100 dark:bg-teal-900/50',
            tag: 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300',
            xp: 'text-teal-600 dark:text-teal-400',
            urgencyBar: 'bg-teal-500',
        },
    };

    return colorSchemes[type] || colorSchemes.review;
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

function QuestionIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
        </svg>
    );
}
