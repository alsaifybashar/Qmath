/**
 * Spaced Repetition System (SRS)
 * Advanced scheduler for optimal review timing based on mastery and performance
 * Combines SM-2 algorithm principles with Leitner box system and forgetting curve
 */

import { MasteryLevel } from './mastery-calculator';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

// Base review intervals in days for each mastery level (SM-2 inspired)
const BASE_INTERVALS: Record<MasteryLevel, number> = {
    0: 0,   // Not started - no review needed
    1: 1,   // Familiar - review tomorrow
    2: 2,   // Practicing - review in 2 days
    3: 4,   // Competent - review in 4 days
    4: 7,   // Skilled - review in 1 week
    5: 14,  // Master - review in 2 weeks
};

// Easiness factors (how quickly intervals grow)
const EASINESS_FACTORS: Record<MasteryLevel, number> = {
    0: 1.0,
    1: 1.3,
    2: 1.5,
    3: 1.8,
    4: 2.1,
    5: 2.5,
};

// Maximum interval to prevent topics from being forgotten completely
const MAX_INTERVAL_DAYS = 60;

// Minimum interval for failed reviews
const MIN_INTERVAL_DAYS = 1;

// Forgetting curve parameters (based on Ebbinghaus)
const FORGETTING_CURVE = {
    INITIAL_RETENTION: 1.0,
    DECAY_RATE: 0.7, // Higher = slower forgetting
    RETRIEVAL_BOOST: 1.5, // Boost from successful retrieval
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

export interface ReviewHistoryItem {
    date: Date;
    wasCorrect: boolean;
    responseTime: number; // milliseconds
    difficulty: number; // 1-5
}

export interface TopicReviewState {
    topicId: string;
    masteryLevel: MasteryLevel;
    lastReviewDate: Date | null;
    nextReviewDate: Date | null;
    easinessFactor: number;
    consecutiveCorrect: number;
    totalReviews: number;
    averageRetentionScore: number;
    reviewHistory: ReviewHistoryItem[];
}

/**
 * Calculate next review date using adaptive spaced repetition
 */
export function calculateNextReview(params: {
    lastReviewDate: Date;
    masteryLevel: MasteryLevel;
    wasCorrect: boolean;
    consecutiveCorrect: number;
    currentEasiness?: number;
    responseQuality?: number; // 0-5, how well they answered
    previousInterval?: number; // days since last review
}): { nextDate: Date; newEasiness: number; newInterval: number } {
    const {
        lastReviewDate,
        masteryLevel,
        wasCorrect,
        consecutiveCorrect,
        currentEasiness = EASINESS_FACTORS[masteryLevel],
        responseQuality = wasCorrect ? 4 : 2,
        previousInterval = BASE_INTERVALS[masteryLevel],
    } = params;

    let newInterval: number;
    let newEasiness = currentEasiness;

    if (!wasCorrect) {
        // Wrong answer: reset interval, decrease easiness
        newInterval = MIN_INTERVAL_DAYS;
        newEasiness = Math.max(1.3, currentEasiness - 0.2);
    } else {
        // Correct answer: apply SM-2 inspired formula
        if (consecutiveCorrect === 1) {
            newInterval = 1;
        } else if (consecutiveCorrect === 2) {
            newInterval = 3;
        } else {
            // Apply easiness factor for subsequent reviews
            newInterval = Math.round(previousInterval * newEasiness);
        }

        // Adjust easiness based on response quality (SM-2 formula)
        newEasiness = Math.max(
            1.3,
            currentEasiness + (0.1 - (5 - responseQuality) * (0.08 + (5 - responseQuality) * 0.02))
        );

        // Bonus for consistent streak
        if (consecutiveCorrect > 3) {
            const streakBonus = Math.floor(consecutiveCorrect / 3);
            newInterval += streakBonus;
        }

        // Mastery level modifier
        const masteryModifier = 1 + (masteryLevel * 0.1);
        newInterval = Math.round(newInterval * masteryModifier);

        // Cap at maximum
        newInterval = Math.min(newInterval, MAX_INTERVAL_DAYS);
    }

    // Calculate next date
    const nextDate = new Date(lastReviewDate);
    nextDate.setDate(nextDate.getDate() + newInterval);

    return { nextDate, newEasiness, newInterval };
}

/**
 * Check if topic is due for review
 */
export function isDueForReview(nextReviewDate: Date | null): boolean {
    if (!nextReviewDate) return true;
    return new Date() >= nextReviewDate;
}

/**
 * Check if topic is overdue (past review date)
 */
export function isOverdue(nextReviewDate: Date | null): { overdue: boolean; daysPast: number } {
    if (!nextReviewDate) return { overdue: false, daysPast: 0 };

    const now = new Date();
    if (now < nextReviewDate) return { overdue: false, daysPast: 0 };

    const daysPast = Math.floor((now.getTime() - nextReviewDate.getTime()) / (1000 * 60 * 60 * 24));
    return { overdue: true, daysPast };
}

// ============================================================================
// FORGETTING CURVE CALCULATIONS
// ============================================================================

/**
 * Calculate retention probability based on Ebbinghaus forgetting curve
 * R = e^(-t/S) where t is time and S is memory strength
 */
export function calculateRetention(params: {
    daysSinceReview: number;
    masteryLevel: MasteryLevel;
    consecutiveCorrect: number;
    reviewCount: number;
}): number {
    const { daysSinceReview, masteryLevel, consecutiveCorrect, reviewCount } = params;

    if (daysSinceReview === 0) return 1.0;

    // Memory strength increases with mastery and reviews
    const baseStrength = 1 + (masteryLevel * 0.5) + (consecutiveCorrect * 0.3);
    const reviewBonus = Math.log(reviewCount + 1) * 0.5;
    const memoryStrength = baseStrength + reviewBonus;

    // Apply forgetting curve formula
    const retention = Math.exp(-daysSinceReview / (memoryStrength * FORGETTING_CURVE.DECAY_RATE * 10));

    return Math.max(0, Math.min(1, retention));
}

/**
 * Calculate forgetting risk (0-1) based on time since last practice
 * Risk increases as retention decreases
 */
export function calculateForgettingRisk(params: {
    lastPracticedAt: Date | null;
    masteryLevel: MasteryLevel;
    nextReviewDate: Date | null;
    consecutiveCorrect?: number;
    reviewCount?: number;
}): number {
    const {
        lastPracticedAt,
        masteryLevel,
        nextReviewDate,
        consecutiveCorrect = 0,
        reviewCount = 0,
    } = params;

    if (!lastPracticedAt) {
        return 0; // Never practiced, no risk of forgetting
    }

    const now = new Date();
    const daysSinceLastPractice = Math.floor(
        (now.getTime() - lastPracticedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate retention
    const retention = calculateRetention({
        daysSinceReview: daysSinceLastPractice,
        masteryLevel,
        consecutiveCorrect,
        reviewCount,
    });

    // Risk is inverse of retention
    let risk = 1 - retention;

    // Additional risk if overdue
    if (nextReviewDate) {
        const { overdue, daysPast } = isOverdue(nextReviewDate);
        if (overdue) {
            const expectedInterval = BASE_INTERVALS[masteryLevel] || 7;
            const overdueMultiplier = 1 + (daysPast / expectedInterval) * 0.5;
            risk = Math.min(1, risk * overdueMultiplier);
        }
    }

    return Math.round(risk * 100) / 100;
}

// ============================================================================
// TOPIC PRIORITIZATION
// ============================================================================

export interface DueTopicInfo {
    id: string;
    title: string;
    priority: number;
    forgettingRisk: number;
    daysSinceLastPractice: number;
    daysOverdue: number;
    retentionEstimate: number;
    urgency: 'critical' | 'high' | 'medium' | 'low';
    recommendedAction: string;
}

/**
 * Get topics due for review, sorted by priority
 */
export function getTopicsDueForReview(topics: Array<{
    id: string;
    title: string;
    lastPracticedAt: Date | null;
    nextReviewDate: Date | null;
    masteryLevel: MasteryLevel;
    consecutiveCorrect?: number;
    reviewCount?: number;
}>): DueTopicInfo[] {
    const now = new Date();

    const dueTopics = topics
        .filter(topic => topic.lastPracticedAt && isDueForReview(topic.nextReviewDate))
        .map(topic => {
            const daysSinceLastPractice = topic.lastPracticedAt
                ? Math.floor((now.getTime() - topic.lastPracticedAt.getTime()) / (1000 * 60 * 60 * 24))
                : 999;

            const { overdue, daysPast } = isOverdue(topic.nextReviewDate);

            const forgettingRisk = calculateForgettingRisk({
                lastPracticedAt: topic.lastPracticedAt,
                masteryLevel: topic.masteryLevel,
                nextReviewDate: topic.nextReviewDate,
                consecutiveCorrect: topic.consecutiveCorrect,
                reviewCount: topic.reviewCount,
            });

            const retentionEstimate = calculateRetention({
                daysSinceReview: daysSinceLastPractice,
                masteryLevel: topic.masteryLevel,
                consecutiveCorrect: topic.consecutiveCorrect || 0,
                reviewCount: topic.reviewCount || 0,
            });

            // Calculate priority score
            const masteryWeight = topic.masteryLevel * 10; // Prioritize higher mastery topics
            const riskWeight = forgettingRisk * 100;
            const overdueWeight = daysPast * 5;
            const priority = masteryWeight + riskWeight + overdueWeight;

            // Determine urgency
            const urgency: 'critical' | 'high' | 'medium' | 'low' =
                forgettingRisk > 0.8 ? 'critical' :
                    forgettingRisk > 0.6 ? 'high' :
                        forgettingRisk > 0.3 ? 'medium' : 'low';

            // Generate recommendation
            const recommendedAction = getReviewRecommendation({
                daysSinceLastPractice,
                masteryLevel: topic.masteryLevel,
                forgettingRisk,
            });

            return {
                id: topic.id,
                title: topic.title,
                priority,
                forgettingRisk,
                daysSinceLastPractice,
                daysOverdue: daysPast,
                retentionEstimate: Math.round(retentionEstimate * 100) / 100,
                urgency,
                recommendedAction,
            };
        });

    // Sort by priority (highest first)
    return dueTopics.sort((a, b) => b.priority - a.priority);
}

/**
 * Get review recommendation message
 */
export function getReviewRecommendation(params: {
    daysSinceLastPractice: number;
    masteryLevel: MasteryLevel;
    forgettingRisk: number;
}): string {
    const { daysSinceLastPractice, masteryLevel, forgettingRisk } = params;

    if (forgettingRisk > 0.8) {
        return `⚠️ Critical! Last practiced ${daysSinceLastPractice} days ago - review immediately to prevent significant forgetting`;
    }

    if (forgettingRisk > 0.6) {
        return `Review needed soon - ${daysSinceLastPractice} days since last practice. A quick review will reinforce your memory.`;
    }

    if (forgettingRisk > 0.3) {
        return `Good time to review - practicing now will strengthen your long-term retention.`;
    }

    if (masteryLevel >= 4) {
        return `Maintenance review - refresh your mastery to keep it at peak level`;
    }

    return `Keep the momentum going - regular reviews build lasting knowledge`;
}

// ============================================================================
// SESSION PLANNING
// ============================================================================

/**
 * Calculate optimal review session length
 */
export function calculateOptimalSessionLength(params: {
    topicsCount: number;
    averageMastery: number;
    userPreference?: 'quick' | 'standard' | 'thorough';
}): { minutes: number; questionsPerTopic: number; breakdown: string } {
    const { topicsCount, averageMastery, userPreference = 'standard' } = params;

    // Base time per topic depends on mastery (lower mastery = more time needed)
    const baseMinPerTopic = 5 - (averageMastery * 0.5);

    // Adjust for user preference
    const preferenceMultiplier =
        userPreference === 'quick' ? 0.6 :
            userPreference === 'thorough' ? 1.5 : 1.0;

    const minutesPerTopic = baseMinPerTopic * preferenceMultiplier;
    const totalMinutes = Math.round(topicsCount * minutesPerTopic);

    // Questions per topic
    const questionsPerTopic = Math.ceil(3 * preferenceMultiplier);

    // Round to nearest 5 minutes
    const roundedMinutes = Math.ceil(totalMinutes / 5) * 5;

    const breakdown = `${topicsCount} topics × ${questionsPerTopic} questions each ≈ ${roundedMinutes} minutes`;

    return {
        minutes: roundedMinutes,
        questionsPerTopic,
        breakdown,
    };
}

/**
 * Create an optimized review schedule for multiple topics
 */
export function createReviewSchedule(topics: DueTopicInfo[], maxMinutes: number = 30): {
    schedule: Array<{ topicId: string; title: string; order: number; estimatedMinutes: number }>;
    totalMinutes: number;
    topicsIncluded: number;
    topicsDeferred: number;
} {
    const schedule: Array<{ topicId: string; title: string; order: number; estimatedMinutes: number }> = [];
    let totalMinutes = 0;
    const avgTimePerTopic = 5;

    // Add topics in priority order until time limit
    for (let i = 0; i < topics.length; i++) {
        const topic = topics[i];
        const estimatedMinutes = topic.urgency === 'critical' ? 7 :
            topic.urgency === 'high' ? 6 :
                topic.urgency === 'medium' ? 5 : 4;

        if (totalMinutes + estimatedMinutes <= maxMinutes) {
            schedule.push({
                topicId: topic.id,
                title: topic.title,
                order: schedule.length + 1,
                estimatedMinutes,
            });
            totalMinutes += estimatedMinutes;
        }
    }

    return {
        schedule,
        totalMinutes,
        topicsIncluded: schedule.length,
        topicsDeferred: topics.length - schedule.length,
    };
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Calculate review statistics
 */
export function calculateReviewStats(history: ReviewHistoryItem[]): {
    totalReviews: number;
    accuracyRate: number;
    averageResponseTime: number;
    streakCurrent: number;
    streakBest: number;
    retentionTrend: 'improving' | 'stable' | 'declining';
} {
    if (history.length === 0) {
        return {
            totalReviews: 0,
            accuracyRate: 0,
            averageResponseTime: 0,
            streakCurrent: 0,
            streakBest: 0,
            retentionTrend: 'stable',
        };
    }

    const correctCount = history.filter(h => h.wasCorrect).length;
    const accuracyRate = correctCount / history.length;
    const averageResponseTime = history.reduce((sum, h) => sum + h.responseTime, 0) / history.length;

    // Calculate streaks
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].wasCorrect) {
            tempStreak++;
            if (i === history.length - 1 || history[i + 1]?.wasCorrect) {
                currentStreak = tempStreak;
            }
            bestStreak = Math.max(bestStreak, tempStreak);
        } else {
            if (i === history.length - 1) currentStreak = 0;
            tempStreak = 0;
        }
    }

    // Calculate retention trend (last 7 vs previous 7 reviews)
    let retentionTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (history.length >= 14) {
        const recent7 = history.slice(-7);
        const previous7 = history.slice(-14, -7);
        const recentAccuracy = recent7.filter(h => h.wasCorrect).length / 7;
        const previousAccuracy = previous7.filter(h => h.wasCorrect).length / 7;

        if (recentAccuracy > previousAccuracy + 0.1) retentionTrend = 'improving';
        else if (recentAccuracy < previousAccuracy - 0.1) retentionTrend = 'declining';
    }

    return {
        totalReviews: history.length,
        accuracyRate: Math.round(accuracyRate * 100) / 100,
        averageResponseTime: Math.round(averageResponseTime),
        streakCurrent: currentStreak,
        streakBest: bestStreak,
        retentionTrend,
    };
}

/**
 * Predict when user will next need to review a topic
 */
export function predictNextReviewDate(params: {
    currentMastery: MasteryLevel;
    consecutiveCorrect: number;
    averageRetention: number;
}): { date: Date; confidence: number; interval: number } {
    const { currentMastery, consecutiveCorrect, averageRetention } = params;

    // Base interval from mastery
    let interval = BASE_INTERVALS[currentMastery];

    // Adjust based on consecutive correct
    if (consecutiveCorrect > 2) {
        interval = Math.round(interval * (1 + consecutiveCorrect * 0.1));
    }

    // Adjust based on average retention
    if (averageRetention > 0.8) {
        interval = Math.round(interval * 1.2);
    } else if (averageRetention < 0.6) {
        interval = Math.round(interval * 0.8);
    }

    // Cap interval
    interval = Math.min(interval, MAX_INTERVAL_DAYS);

    // Calculate confidence (higher for consistent performers)
    const confidence = Math.min(0.95, 0.5 + (consecutiveCorrect * 0.1) + (averageRetention * 0.2));

    const date = new Date();
    date.setDate(date.getDate() + interval);

    return { date, confidence: Math.round(confidence * 100) / 100, interval };
}
