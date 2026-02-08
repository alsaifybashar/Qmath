'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface LearningInsight {
    id: string;
    type: 'time_of_day' | 'topic_correlation' | 'error_pattern' | 'streak_impact' | 'difficulty_preference' | 'general';
    title: string;
    description: string;
    icon: string;
    confidence: number; // 0-1
    dataPoints: number; // Number of sessions analyzed
}

interface InsightCardProps {
    insights: LearningInsight[];
    autoRotate?: boolean;
    rotationInterval?: number;
}

// ============================================================================
// INSIGHT CARD COMPONENT
// ============================================================================

export default function InsightCard({
    insights,
    autoRotate = true,
    rotationInterval = 8000
}: InsightCardProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Auto-rotate insights
    useEffect(() => {
        if (!autoRotate || isPaused || insights.length <= 1) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % insights.length);
        }, rotationInterval);

        return () => clearInterval(timer);
    }, [autoRotate, isPaused, insights.length, rotationInterval]);

    if (insights.length === 0) {
        return <EmptyInsightState />;
    }

    const currentInsight = insights[currentIndex];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-pink-500/10" />

            <div className="relative p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <motion.div
                            className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center"
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <span className="text-xl">💡</span>
                        </motion.div>
                        <div>
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Learning Insight</h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                AI-detected pattern
                            </p>
                        </div>
                    </div>

                    {/* Confidence badge */}
                    <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-full border border-emerald-200/50 dark:border-emerald-700/30">
                        <span className="text-xs">✓</span>
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            {Math.round(currentInsight.confidence * 100)}% confident
                        </span>
                    </div>
                </div>

                {/* Insight content with animation */}
                <div className="relative min-h-[120px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentInsight.id}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                            className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200/50 dark:border-indigo-700/30"
                        >
                            <div className="flex items-start gap-4">
                                <motion.div
                                    className="text-4xl"
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    {currentInsight.icon}
                                </motion.div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-zinc-900 dark:text-white mb-2">
                                        {currentInsight.title}
                                    </h3>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                        {currentInsight.description}
                                    </p>
                                    <div className="mt-3 text-xs text-zinc-400">
                                        Based on {currentInsight.dataPoints} practice sessions
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Navigation dots */}
                {insights.length > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-4">
                        <button
                            onClick={() => setCurrentIndex((prev) => (prev - 1 + insights.length) % insights.length)}
                            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                            aria-label="Previous insight"
                        >
                            ←
                        </button>
                        <div className="flex gap-2">
                            {insights.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex
                                            ? 'w-6 bg-indigo-500'
                                            : 'bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-400'
                                        }`}
                                    aria-label={`Go to insight ${idx + 1}`}
                                />
                            ))}
                        </div>
                        <button
                            onClick={() => setCurrentIndex((prev) => (prev + 1) % insights.length)}
                            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                            aria-label="Next insight"
                        >
                            →
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyInsightState() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6"
        >
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <span className="text-xl">💡</span>
                </div>
                <div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Learning Insights</h2>
                    <p className="text-xs text-zinc-500">Patterns detected from your study sessions</p>
                </div>
            </div>
            <div className="p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-600 text-center">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Keep studying! We'll detect patterns in your learning behavior soon.
                </p>
            </div>
        </motion.div>
    );
}

// ============================================================================
// INSIGHT GENERATOR (utility function for generating sample insights)
// ============================================================================

export function generateSampleInsights(sessionCount: number): LearningInsight[] {
    if (sessionCount < 5) return [];

    const insights: LearningInsight[] = [];

    // Time-of-day insight
    insights.push({
        id: 'time-insight',
        type: 'time_of_day',
        title: 'Peak Performance Hours',
        description: "You solve problems 40% faster during evening hours (6-9 PM). Consider scheduling your hardest topics for this time.",
        icon: '🌙',
        confidence: 0.85,
        dataPoints: sessionCount,
    });

    // Error pattern insight
    insights.push({
        id: 'error-insight',
        type: 'error_pattern',
        title: 'Common Mistake Pattern',
        description: "60% of your errors involve sign changes in equations. Pay extra attention when working with negative numbers.",
        icon: '⚠️',
        confidence: 0.78,
        dataPoints: Math.floor(sessionCount * 0.8),
    });

    // Streak impact
    insights.push({
        id: 'streak-insight',
        type: 'streak_impact',
        title: 'Streak Power',
        description: "Your accuracy is 15% higher on 5+ day streaks! Consistency really pays off for you.",
        icon: '🔥',
        confidence: 0.92,
        dataPoints: sessionCount,
    });

    // Difficulty preference
    insights.push({
        id: 'difficulty-insight',
        type: 'difficulty_preference',
        title: 'Challenge Seeker',
        description: "You excel at hard problems but sometimes rush through easy ones. Slow down on basics to avoid careless errors.",
        icon: '💪',
        confidence: 0.72,
        dataPoints: Math.floor(sessionCount * 0.6),
    });

    return insights;
}
