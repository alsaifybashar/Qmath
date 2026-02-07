/**
 * Daily Focus Recommendation Engine
 * AI-driven recommendations for optimal learning path
 * Based on spaced repetition, weak areas, curriculum progression, and challenge readiness
 */

import { getTopicsDueForReview, getReviewRecommendation, calculateForgettingRisk } from './spaced-repetition';
import { MasteryLevel } from './mastery-calculator';

export type RecommendationType = 'review' | 'strengthen' | 'new_content' | 'challenge' | 'warm_up' | 'deep_dive';

export interface DailyRecommendation {
    id: string;
    type: RecommendationType;
    topicId: string;
    topicTitle: string;
    priority: number; // 0-1, higher is more important
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

export interface TopicData {
    id: string;
    title: string;
    masteryLevel: MasteryLevel;
    lastPracticedAt: Date | null;
    nextReviewDate: Date | null;
    totalAttempts: number;
    correctAttempts: number;
    errorRate: number;
    avgDifficulty: number;
    avgTimePerQuestion: number; // in seconds
    prerequisites: string[];
    isPrerequisiteFor: string[];
    conceptTags: string[];
    recentMistakes: MistakePattern[];
}

export interface MistakePattern {
    conceptType: string; // e.g., "algebraic_manipulation", "sign_errors", "formula_application"
    frequency: number;
    lastOccurred: Date;
    examples: string[];
}

export interface UserPerformanceData {
    topics: TopicData[];
    recentAccuracy: number; // Overall accuracy last 7 days
    totalQuestionsLast7Days: number;
    totalQuestionsLast24h: number;
    averageSessionLength: number; // in minutes
    preferredDifficulty: number; // 1-5
    learningVelocity: number; // topics mastered per week
    currentStreak: number;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    energyLevel: 'low' | 'medium' | 'high'; // Based on recent performance patterns
}

export interface RecommendationContext {
    userId: string;
    performanceData: UserPerformanceData;
    sessionGoal?: 'quick' | 'standard' | 'deep'; // 10min, 20min, 45min
    focusMode?: 'review' | 'learn' | 'challenge' | 'balanced';
}

// ============================================================================
// MAIN RECOMMENDATION ENGINE
// ============================================================================

/**
 * Generate daily focus recommendations using multi-factor analysis
 */
export async function generateDailyFocus(
    userId: string,
    performanceData: UserPerformanceData,
    options: {
        maxRecommendations?: number;
        sessionGoal?: 'quick' | 'standard' | 'deep';
        focusMode?: 'review' | 'learn' | 'challenge' | 'balanced';
    } = {}
): Promise<DailyRecommendation[]> {
    const { maxRecommendations = 4, sessionGoal = 'standard', focusMode = 'balanced' } = options;
    const recommendations: DailyRecommendation[] = [];

    // Analyze user's current state
    const userState = analyzeUserState(performanceData);

    // 1. CRITICAL REVIEWS - Topics at high risk of forgetting
    const criticalReviews = generateCriticalReviews(performanceData, userState);
    recommendations.push(...criticalReviews);

    // 2. WEAK AREA STRENGTHENING - Topics with identified problem patterns
    const weakAreaRecs = generateWeakAreaRecommendations(performanceData, userState);
    recommendations.push(...weakAreaRecs);

    // 3. WARM-UP - Light practice to build momentum (if morning/start of session)
    if (performanceData.totalQuestionsLast24h < 5 && performanceData.timeOfDay !== 'night') {
        const warmUp = generateWarmUpRecommendation(performanceData);
        if (warmUp) recommendations.push(warmUp);
    }

    // 4. NEW CONTENT - Next topic based on prerequisites and readiness
    const newContentRecs = generateNewContentRecommendations(performanceData, userState);
    recommendations.push(...newContentRecs);

    // 5. CHALLENGE PROBLEMS - For high performers
    if (userState.readyForChallenge) {
        const challengeRecs = generateChallengeRecommendations(performanceData, userState);
        recommendations.push(...challengeRecs);
    }

    // 6. DEEP DIVE - For topics close to mastery
    if (sessionGoal === 'deep' || focusMode === 'learn') {
        const deepDiveRecs = generateDeepDiveRecommendations(performanceData);
        recommendations.push(...deepDiveRecs);
    }

    // Apply focus mode filter
    const filteredRecs = applyFocusModeFilter(recommendations, focusMode);

    // Score and sort by priority
    const scoredRecs = scoreRecommendations(filteredRecs, userState, sessionGoal);

    // Return top recommendations with unique topics
    return deduplicateByTopic(scoredRecs).slice(0, maxRecommendations);
}

// ============================================================================
// USER STATE ANALYSIS
// ============================================================================

interface UserState {
    energyLevel: 'low' | 'medium' | 'high';
    learningMomentum: number; // 0-1
    readyForChallenge: boolean;
    needsReview: boolean;
    hasWeakAreas: boolean;
    optimalDifficulty: number;
    streakBonus: number;
}

function analyzeUserState(data: UserPerformanceData): UserState {
    const { topics, recentAccuracy, totalQuestionsLast7Days, currentStreak } = data;

    // Calculate learning momentum
    const recentActivity = Math.min(1, totalQuestionsLast7Days / 50);
    const accuracyBonus = recentAccuracy > 0.8 ? 0.2 : 0;
    const learningMomentum = recentActivity * 0.7 + accuracyBonus + (currentStreak > 0 ? 0.1 : 0);

    // Determine energy level from time of day and recent performance
    const baseEnergy = data.energyLevel ||
        (data.timeOfDay === 'morning' ? 'high' :
            data.timeOfDay === 'afternoon' ? 'medium' :
                data.timeOfDay === 'evening' ? 'medium' : 'low');

    // Check if ready for challenge
    const readyForChallenge =
        recentAccuracy > 0.85 &&
        totalQuestionsLast7Days >= 15 &&
        topics.filter(t => t.masteryLevel >= 4).length >= 2;

    // Check if reviews are needed
    const dueTopics = getTopicsDueForReview(
        topics.map(t => ({
            id: t.id,
            title: t.title,
            lastPracticedAt: t.lastPracticedAt,
            nextReviewDate: t.nextReviewDate,
            masteryLevel: t.masteryLevel,
        }))
    );
    const needsReview = dueTopics.length > 0;

    // Check for weak areas
    const weakTopics = topics.filter(t => t.totalAttempts >= 5 && t.errorRate > 0.35);
    const hasWeakAreas = weakTopics.length > 0;

    // Calculate optimal difficulty
    const avgMastery = topics.length > 0
        ? topics.reduce((sum, t) => sum + t.masteryLevel, 0) / topics.length
        : 2;
    const optimalDifficulty = Math.min(5, Math.max(1, Math.round(avgMastery + (recentAccuracy > 0.8 ? 0.5 : -0.5))));

    // Streak bonus for XP
    const streakBonus = Math.min(0.5, currentStreak * 0.05);

    return {
        energyLevel: baseEnergy,
        learningMomentum,
        readyForChallenge,
        needsReview,
        hasWeakAreas,
        optimalDifficulty,
        streakBonus,
    };
}

// ============================================================================
// RECOMMENDATION GENERATORS
// ============================================================================

function generateCriticalReviews(data: UserPerformanceData, state: UserState): DailyRecommendation[] {
    const recommendations: DailyRecommendation[] = [];

    const dueTopics = getTopicsDueForReview(
        data.topics.map(t => ({
            id: t.id,
            title: t.title,
            lastPracticedAt: t.lastPracticedAt,
            nextReviewDate: t.nextReviewDate,
            masteryLevel: t.masteryLevel,
        }))
    );

    // Sort by forgetting risk
    const criticalTopics = dueTopics
        .filter(t => t.forgettingRisk > 0.3)
        .slice(0, 2);

    for (const dueT of criticalTopics) {
        const topic = data.topics.find(t => t.id === dueT.id);
        if (!topic) continue;

        const urgency = dueT.forgettingRisk > 0.7 ? 'critical' :
            dueT.forgettingRisk > 0.5 ? 'high' : 'medium';

        recommendations.push({
            id: `review-${topic.id}`,
            type: 'review',
            topicId: topic.id,
            topicTitle: topic.title,
            priority: 0.9 + dueT.forgettingRisk * 0.1,
            urgency,
            message: getReviewRecommendation({
                daysSinceLastPractice: dueT.daysSinceLastPractice,
                masteryLevel: topic.masteryLevel,
                forgettingRisk: dueT.forgettingRisk,
            }),
            icon: urgency === 'critical' ? '🚨' : '🔄',
            estimatedTimeMinutes: calculateReviewTime(topic),
            difficulty: Math.min(5, topic.masteryLevel + 1) as 1 | 2 | 3 | 4 | 5,
            xpReward: calculateXPReward('review', topic.masteryLevel, state.streakBonus),
            questionCount: 5 + Math.floor(topic.masteryLevel),
            metadata: {
                reason: 'Spaced repetition - prevent forgetting',
                daysSince: dueT.daysSinceLastPractice,
                masteryGain: 0.1,
            },
        });
    }

    return recommendations;
}

function generateWeakAreaRecommendations(data: UserPerformanceData, state: UserState): DailyRecommendation[] {
    const recommendations: DailyRecommendation[] = [];

    // Find topics with high error rates and analyze patterns
    const weakTopics = data.topics
        .filter(t => t.totalAttempts >= 5 && t.errorRate > 0.35)
        .sort((a, b) => b.errorRate - a.errorRate)
        .slice(0, 2);

    for (const topic of weakTopics) {
        const weakPatterns = analyzeWeakPatterns(topic);
        const urgency = topic.errorRate > 0.6 ? 'high' : 'medium';

        recommendations.push({
            id: `strengthen-${topic.id}`,
            type: 'strengthen',
            topicId: topic.id,
            topicTitle: topic.title,
            priority: 0.7 + topic.errorRate * 0.2,
            urgency,
            message: generateStrengtheningMessage(topic, weakPatterns),
            icon: '💪',
            estimatedTimeMinutes: 15 + Math.floor(topic.errorRate * 10),
            difficulty: Math.max(1, topic.masteryLevel) as 1 | 2 | 3 | 4 | 5,
            xpReward: calculateXPReward('strengthen', topic.masteryLevel, state.streakBonus),
            questionCount: 8,
            metadata: {
                reason: 'Targeted practice for improvement',
                errorRate: topic.errorRate,
                weakPatterns,
                masteryGain: 0.2,
            },
        });
    }

    return recommendations;
}

function generateWarmUpRecommendation(data: UserPerformanceData): DailyRecommendation | null {
    // Find an easy topic with good mastery for warm-up
    const warmUpCandidates = data.topics
        .filter(t => t.masteryLevel >= 3 && t.errorRate < 0.3)
        .sort((a, b) => b.masteryLevel - a.masteryLevel);

    if (warmUpCandidates.length === 0) return null;

    const topic = warmUpCandidates[0];

    return {
        id: `warmup-${topic.id}`,
        type: 'warm_up',
        topicId: topic.id,
        topicTitle: topic.title,
        priority: 0.6,
        urgency: 'low',
        message: "Start your session with a quick warm-up! Build confidence before tackling harder topics.",
        icon: '🌅',
        estimatedTimeMinutes: 5,
        difficulty: 2,
        xpReward: 15,
        questionCount: 3,
        metadata: {
            reason: 'Mental warm-up to build momentum',
            masteryGain: 0.05,
        },
    };
}

function generateNewContentRecommendations(data: UserPerformanceData, state: UserState): DailyRecommendation[] {
    const recommendations: DailyRecommendation[] = [];

    // Find topics not yet started with prerequisites met
    const availableTopics = findAvailableNewTopics(data.topics);

    for (const topic of availableTopics.slice(0, 1)) {
        const prereqTopics = topic.prerequisites
            .map(pId => data.topics.find(t => t.id === pId))
            .filter(Boolean)
            .map(t => t!.title);

        recommendations.push({
            id: `new-${topic.id}`,
            type: 'new_content',
            topicId: topic.id,
            topicTitle: topic.title,
            priority: 0.65,
            urgency: 'medium',
            message: prereqTopics.length > 0
                ? `You've mastered ${prereqTopics.slice(0, 2).join(' and ')} - you're ready for this!`
                : "Start your learning journey with this foundational topic!",
            icon: '🚀',
            estimatedTimeMinutes: 25,
            difficulty: 2,
            xpReward: calculateXPReward('new_content', 0, state.streakBonus),
            questionCount: 10,
            metadata: {
                reason: 'Prerequisites completed',
                prerequisitesCleared: prereqTopics,
                masteryGain: 0.3,
            },
        });
    }

    return recommendations;
}

function generateChallengeRecommendations(data: UserPerformanceData, state: UserState): DailyRecommendation[] {
    const recommendations: DailyRecommendation[] = [];

    // Find mastered topics for challenge
    const masteredTopics = data.topics
        .filter(t => t.masteryLevel >= 4)
        .sort((a, b) => a.avgDifficulty - b.avgDifficulty); // Choose topic with lower avg difficulty first

    if (masteredTopics.length === 0) return recommendations;

    const topic = masteredTopics[Math.floor(Math.random() * Math.min(3, masteredTopics.length))];

    recommendations.push({
        id: `challenge-${topic.id}`,
        type: 'challenge',
        topicId: topic.id,
        topicTitle: topic.title,
        priority: 0.5,
        urgency: 'low',
        message: "Ready for a challenge? These advanced problems will test your full understanding!",
        icon: '⭐',
        estimatedTimeMinutes: 15,
        difficulty: 5,
        xpReward: calculateXPReward('challenge', 5, state.streakBonus),
        questionCount: 5,
        metadata: {
            reason: 'You\'re performing exceptionally - time to push boundaries!',
            difficulty: 5,
            masteryGain: 0.15,
        },
    });

    return recommendations;
}

function generateDeepDiveRecommendations(data: UserPerformanceData): DailyRecommendation[] {
    const recommendations: DailyRecommendation[] = [];

    // Find topics close to mastery (level 3-4)
    const nearMasteryTopics = data.topics
        .filter(t => t.masteryLevel >= 3 && t.masteryLevel < 5)
        .sort((a, b) => b.masteryLevel - a.masteryLevel);

    if (nearMasteryTopics.length === 0) return recommendations;

    const topic = nearMasteryTopics[0];
    const pointsToMastery = 5 - topic.masteryLevel;

    recommendations.push({
        id: `deepdive-${topic.id}`,
        type: 'deep_dive',
        topicId: topic.id,
        topicTitle: topic.title,
        priority: 0.55,
        urgency: 'low',
        message: `You're ${pointsToMastery === 1 ? 'one level' : `${pointsToMastery} levels`} away from mastery! A focused session could get you there.`,
        icon: '🎯',
        estimatedTimeMinutes: 30,
        difficulty: (topic.masteryLevel + 1) as 1 | 2 | 3 | 4 | 5,
        xpReward: calculateXPReward('deep_dive', topic.masteryLevel, 0),
        questionCount: 15,
        metadata: {
            reason: 'Close to mastery - push to the finish line',
            masteryGain: 0.25,
        },
    });

    return recommendations;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function analyzeWeakPatterns(topic: TopicData): string[] {
    const patterns: string[] = [];

    if (topic.recentMistakes && topic.recentMistakes.length > 0) {
        // Group by concept type
        const conceptCounts = topic.recentMistakes.reduce((acc, m) => {
            acc[m.conceptType] = (acc[m.conceptType] || 0) + m.frequency;
            return acc;
        }, {} as Record<string, number>);

        // Get top 2 problem areas
        const sorted = Object.entries(conceptCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2);

        patterns.push(...sorted.map(([concept]) => formatConceptName(concept)));
    }

    if (patterns.length === 0) {
        // Default patterns based on error rate
        if (topic.errorRate > 0.5) {
            patterns.push('Core concept understanding');
        } else {
            patterns.push('Application and problem-solving');
        }
    }

    return patterns;
}

function formatConceptName(concept: string): string {
    return concept
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function generateStrengtheningMessage(topic: TopicData, patterns: string[]): string {
    const accuracy = Math.round((1 - topic.errorRate) * 100);

    if (patterns.length > 0) {
        return `Focus on ${patterns[0].toLowerCase()} to improve your ${accuracy}% accuracy. Targeted practice helps!`;
    }

    return `With focused practice, you can boost your ${accuracy}% accuracy. Let's work on the tricky parts!`;
}

function findAvailableNewTopics(topics: TopicData[]): TopicData[] {
    const notStarted = topics.filter(t => t.totalAttempts === 0);

    // Check prerequisites
    return notStarted.filter(topic => {
        if (topic.prerequisites.length === 0) return true;

        return topic.prerequisites.every(prereqId => {
            const prereq = topics.find(t => t.id === prereqId);
            return prereq && prereq.masteryLevel >= 3;
        });
    });
}

function calculateReviewTime(topic: TopicData): number {
    const baseTime = 10;
    const masteryBonus = (5 - topic.masteryLevel) * 2;
    const errorPenalty = topic.errorRate * 5;
    return Math.round(baseTime + masteryBonus + errorPenalty);
}

function calculateXPReward(
    type: RecommendationType,
    masteryLevel: number,
    streakBonus: number
): number {
    const baseXP: Record<RecommendationType, number> = {
        review: 20,
        strengthen: 30,
        new_content: 40,
        challenge: 60,
        warm_up: 10,
        deep_dive: 50,
    };

    const base = baseXP[type] || 20;
    const masteryMultiplier = 1 + masteryLevel * 0.1;
    const streakMultiplier = 1 + streakBonus;

    return Math.round(base * masteryMultiplier * streakMultiplier);
}

function applyFocusModeFilter(
    recommendations: DailyRecommendation[],
    focusMode: 'review' | 'learn' | 'challenge' | 'balanced'
): DailyRecommendation[] {
    if (focusMode === 'balanced') return recommendations;

    const modeTypes: Record<string, RecommendationType[]> = {
        review: ['review', 'warm_up'],
        learn: ['new_content', 'deep_dive', 'strengthen'],
        challenge: ['challenge', 'deep_dive'],
    };

    const allowedTypes = modeTypes[focusMode] || [];
    const filtered = recommendations.filter(r => allowedTypes.includes(r.type));

    // If too few after filtering, add some balanced options
    if (filtered.length < 2) {
        const remaining = recommendations.filter(r => !allowedTypes.includes(r.type));
        return [...filtered, ...remaining.slice(0, 2 - filtered.length)];
    }

    return filtered;
}

function scoreRecommendations(
    recommendations: DailyRecommendation[],
    state: UserState,
    sessionGoal: 'quick' | 'standard' | 'deep'
): DailyRecommendation[] {
    return recommendations.map(rec => {
        let score = rec.priority;

        // Adjust for session goal
        if (sessionGoal === 'quick' && rec.estimatedTimeMinutes > 15) {
            score *= 0.7;
        } else if (sessionGoal === 'deep' && rec.type === 'warm_up') {
            score *= 0.5;
        }

        // Adjust for user energy
        if (state.energyLevel === 'low' && rec.difficulty >= 4) {
            score *= 0.8;
        } else if (state.energyLevel === 'high' && rec.type === 'challenge') {
            score *= 1.2;
        }

        // Urgency boost
        const urgencyBoost: Record<string, number> = {
            critical: 0.3,
            high: 0.2,
            medium: 0.1,
            low: 0,
        };
        score += urgencyBoost[rec.urgency] || 0;

        return { ...rec, priority: Math.min(1, score) };
    }).sort((a, b) => b.priority - a.priority);
}

function deduplicateByTopic(recommendations: DailyRecommendation[]): DailyRecommendation[] {
    const seen = new Set<string>();
    return recommendations.filter(rec => {
        if (seen.has(rec.topicId)) return false;
        seen.add(rec.topicId);
        return true;
    });
}

// ============================================================================
// ANALYTICS & INSIGHTS
// ============================================================================

/**
 * Get weak areas summary with detailed analysis
 */
export function getWeakAreasSummary(topics: TopicData[]): {
    count: number;
    topics: Array<{ id: string; title: string; errorRate: number; patterns: string[] }>;
    overallWeakness: 'none' | 'mild' | 'moderate' | 'significant';
    recommendation: string;
} {
    const weak = topics
        .filter(t => t.totalAttempts >= 5 && t.errorRate > 0.35)
        .map(t => ({
            id: t.id,
            title: t.title,
            errorRate: t.errorRate,
            patterns: analyzeWeakPatterns(t),
        }))
        .sort((a, b) => b.errorRate - a.errorRate);

    const overallWeakness: 'none' | 'mild' | 'moderate' | 'significant' =
        weak.length === 0 ? 'none' :
            weak.length <= 2 ? 'mild' :
                weak.length <= 4 ? 'moderate' : 'significant';

    const recommendation =
        overallWeakness === 'none' ? "Great job! No significant weak areas detected." :
            overallWeakness === 'mild' ? "Focus on these topics and you'll be back on track quickly." :
                overallWeakness === 'moderate' ? "Consider dedicating a few sessions to these areas." :
                    "Let's work through these one at a time. Consistency is key!";

    return { count: weak.length, topics: weak, overallWeakness, recommendation };
}

/**
 * Get study readiness score (0-100)
 */
export function getStudyReadinessScore(performanceData: UserPerformanceData): number {
    const { topics, recentAccuracy, totalQuestionsLast7Days } = performanceData;

    let score = 0;

    // Base score from mastery distribution (0-60 points)
    const masteryScores = topics.map(t => t.masteryLevel);
    const avgMastery = masteryScores.length > 0
        ? masteryScores.reduce((sum: number, m: number) => sum + m, 0) / masteryScores.length
        : 0;
    score += avgMastery * 12;

    // Bonus for balanced learning (0-20 points)
    const masteryStdDev = masteryScores.length > 0 ? calculateStdDev(masteryScores) : 0;
    score += Math.max(0, 20 - masteryStdDev * 5);

    // Bonus for recent activity (0-20 points)
    const recentlyPracticed = topics.filter(t => {
        if (!t.lastPracticedAt) return false;
        const daysSince = (Date.now() - t.lastPracticedAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 7;
    }).length;
    score += topics.length > 0 ? (recentlyPracticed / topics.length) * 20 : 0;

    return Math.min(100, Math.round(score));
}

function calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    return Math.sqrt(variance);
}

/**
 * Get personalized study tip based on patterns
 */
export function getPersonalizedTip(
    performanceData: UserPerformanceData,
    focusType?: RecommendationType
): { tip: string; icon: string; category: string } {
    const { topics, recentAccuracy, totalQuestionsLast7Days, currentStreak } = performanceData;

    // Streak encouragement
    if (currentStreak >= 7) {
        return {
            tip: `Amazing! ${currentStreak}-day streak! Your consistency is paying off.`,
            icon: '🔥',
            category: 'motivation',
        };
    }

    // Low activity
    if (totalQuestionsLast7Days < 5) {
        return {
            tip: "Even 10 minutes of daily practice makes a huge difference. Let's start small!",
            icon: '⏰',
            category: 'engagement',
        };
    }

    // High accuracy
    if (recentAccuracy > 0.9) {
        return {
            tip: "Outstanding accuracy! Consider tackling more challenging topics to keep growing.",
            icon: '🌟',
            category: 'challenge',
        };
    }

    // Many weak areas
    const weakCount = getWeakAreasSummary(topics).count;
    if (weakCount > 3) {
        return {
            tip: "Focus on one topic at a time. Deep understanding beats broad coverage.",
            icon: '🎯',
            category: 'focus',
        };
    }

    // Focus type specific tips
    if (focusType === 'review') {
        return {
            tip: "Quick reviews now prevent major forgetting later. Your future self will thank you!",
            icon: '💡',
            category: 'spaced-repetition',
        };
    }

    if (focusType === 'challenge') {
        return {
            tip: "Challenge problems build problem-solving skills. Don't worry about getting them wrong!",
            icon: '💪',
            category: 'growth-mindset',
        };
    }

    // Default encouragement
    return {
        tip: "You're making steady progress. Consistency is the key to mastery!",
        icon: '📈',
        category: 'general',
    };
}

/**
 * Calculate estimated session completion
 */
export function calculateSessionEstimate(recommendations: DailyRecommendation[]): {
    totalMinutes: number;
    totalXP: number;
    totalQuestions: number;
    breakdown: { type: RecommendationType; count: number; minutes: number }[];
} {
    const breakdown = recommendations.reduce((acc, rec) => {
        const existing = acc.find(b => b.type === rec.type);
        if (existing) {
            existing.count++;
            existing.minutes += rec.estimatedTimeMinutes;
        } else {
            acc.push({ type: rec.type, count: 1, minutes: rec.estimatedTimeMinutes });
        }
        return acc;
    }, [] as { type: RecommendationType; count: number; minutes: number }[]);

    return {
        totalMinutes: recommendations.reduce((sum, r) => sum + r.estimatedTimeMinutes, 0),
        totalXP: recommendations.reduce((sum, r) => sum + r.xpReward, 0),
        totalQuestions: recommendations.reduce((sum, r) => sum + r.questionCount, 0),
        breakdown,
    };
}
