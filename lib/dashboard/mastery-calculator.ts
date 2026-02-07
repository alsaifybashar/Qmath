/**
 * Mastery Level Calculator
 * Determines student mastery level (0-5) based on performance metrics
 */

export type MasteryLevel = 0 | 1 | 2 | 3 | 4 | 5;

export const MASTERY_LEVELS = {
    0: {
        name: 'Not Started',
        color: '#E5E7EB', // Gray
        description: "You haven't started this yet",
        criteria: 'No attempts',
    },
    1: {
        name: 'Familiar',
        color: '#FCD34D', // Yellow
        description: "You've seen the material",
        criteria: 'At least 1 question solved',
    },
    2: {
        name: 'Practicing',
        color: '#F97316', // Orange
        description: 'You are actively practicing',
        criteria: '5+ questions, <60% accuracy',
    },
    3: {
        name: 'Competent',
        color: '#22C55E', // Green
        description: 'You understand the basics',
        criteria: '10+ questions, 60-80% accuracy',
    },
    4: {
        name: 'Skilled',
        color: '#3B82F6', // Blue
        description: 'You are confident with this',
        criteria: '15+ questions, 80-95% accuracy',
    },
    5: {
        name: 'Master',
        color: '#8B5CF6', // Purple
        description: 'You have mastered this topic!',
        criteria: '20+ questions, >95% accuracy, including difficult ones',
    },
} as const;

export interface TopicStats {
    totalAttempts: number;
    correctAttempts: number;
    avgDifficulty: number; // Average difficulty of questions attempted (1-5)
    hasAttemptedDifficult: boolean; // Has attempted difficulty 4 or 5
    consecutiveCorrect: number;
}

/**
 * Calculate mastery level based on performance
 */
export function calculateMasteryLevel(stats: TopicStats): MasteryLevel {
    const { totalAttempts, correctAttempts, avgDifficulty, hasAttemptedDifficult } = stats;

    if (totalAttempts === 0) {
        return 0; // Not started
    }

    const accuracy = correctAttempts / totalAttempts;

    // Level 1: Familiar - at least tried
    if (totalAttempts >= 1 && totalAttempts < 5) {
        return 1;
    }

    // Level 2: Practicing - several attempts but low accuracy
    if (totalAttempts >= 5 && accuracy < 0.6) {
        return 2;
    }

    // Level 3: Competent - decent attempts and accuracy
    if (totalAttempts >= 10 && accuracy >= 0.6 && accuracy < 0.8) {
        return 3;
    }

    // Level 4: Skilled - many attempts, high accuracy
    if (totalAttempts >= 15 && accuracy >= 0.8 && accuracy < 0.95) {
        return 4;
    }

    // Level 5: Master - mastered with difficult questions
    if (totalAttempts >= 20 && accuracy >= 0.95 && hasAttemptedDifficult) {
        return 5;
    }

    // Default fallback - if between thresholds, practicing
    if (accuracy >= 0.8) return 4;
    if (accuracy >= 0.6) return 3;
    return 2;
}

/**
 * Get color for mastery level
 */
export function getMasteryColor(level: MasteryLevel): string {
    return MASTERY_LEVELS[level].color;
}

/**
 * Get name for mastery level
 */
export function getMasteryName(level: MasteryLevel): string {
    return MASTERY_LEVELS[level].name;
}

/**
 * Get description for mastery level
 */
export function getMasteryDescription(level: MasteryLevel): string {
    return MASTERY_LEVELS[level].description;
}

/**
 * Calculate progress within current mastery level (0-100%)
 */
export function calculateMasteryProgress(stats: TopicStats, currentLevel: MasteryLevel): number {
    const { totalAttempts, correctAttempts } = stats;
    const accuracy = totalAttempts > 0 ? correctAttempts / totalAttempts : 0;

    switch (currentLevel) {
        case 0:
            return 0;

        case 1:
            // Progress to level 2: need to reach 5 attempts
            return Math.min(100, (totalAttempts / 5) * 100);

        case 2:
            // Progress to level 3: need 10 attempts and 60% accuracy
            const attemptProgress = Math.min(totalAttempts / 10, 1);
            const accuracyProgress = Math.min(accuracy / 0.6, 1);
            return Math.min(100, (attemptProgress + accuracyProgress) / 2 * 100);

        case 3:
            // Progress to level 4: need 15 attempts and 80% accuracy
            const attemptProg3 = Math.min(totalAttempts / 15, 1);
            const accuracyProg3 = accuracy >= 0.6 ? (accuracy - 0.6) / 0.2 : 0;
            return Math.min(100, (attemptProg3 + accuracyProg3) / 2 * 100);

        case 4:
            // Progress to level 5: need 20 attempts and 95% accuracy
            const attemptProg4 = Math.min(totalAttempts / 20, 1);
            const accuracyProg4 = accuracy >= 0.8 ? (accuracy - 0.8) / 0.15 : 0;
            return Math.min(100, (attemptProg4 + accuracyProg4) / 2 * 100);

        case 5:
            // Already mastered
            return 100;

        default:
            return 0;
    }
}

/**
 * Determine if topic needs more practice
 */
export function needsPractice(stats: TopicStats, currentLevel: MasteryLevel): boolean {
    const { totalAttempts, correctAttempts } = stats;
    const accuracy = totalAttempts > 0 ? correctAttempts / totalAttempts : 0;

    // If accuracy is dropping below current level threshold
    if (currentLevel >= 3 && accuracy < 0.6) return true;
    if (currentLevel >= 4 && accuracy < 0.8) return true;

    // If not enough recent practice
    // (This would check lastPracticedAt in actual implementation)
    return false;
}

/**
 * Get next milestone for current mastery level
 */
export function getNextMilestone(stats: TopicStats, currentLevel: MasteryLevel): string {
    const { totalAttempts, correctAttempts } = stats;
    const accuracy = totalAttempts > 0 ? correctAttempts / totalAttempts : 0;

    switch (currentLevel) {
        case 0:
            return 'Complete your first question';
        case 1:
            return `Solve ${5 - totalAttempts} more questions to advance`;
        case 2:
            const needed2 = 10 - totalAttempts;
            if (needed2 > 0) return `${needed2} more questions needed`;
            return 'Improve accuracy to 60% to advance';
        case 3:
            const needed3 = 15 - totalAttempts;
            if (needed3 > 0) return `${needed3} more questions needed`;
            return 'Improve accuracy to 80% to advance';
        case 4:
            const needed4 = 20 - totalAttempts;
            if (needed4 > 0) return `${needed4} more questions needed`;
            if (!stats.hasAttemptedDifficult) return 'Try some difficult questions';
            return 'Improve accuracy to 95% for mastery';
        case 5:
            return 'Mastered! Keep practicing to maintain';
        default:
            return '';
    }
}
