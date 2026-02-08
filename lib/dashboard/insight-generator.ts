// Server-safe insight generation utilities
// This file can be imported in both server and client components

import type { LearningInsight } from '@/components/dashboard/InsightCard';

/**
 * Generate sample learning insights based on session count.
 * This is a placeholder that generates static insights.
 * In production, this would analyze actual user data from the database.
 */
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
