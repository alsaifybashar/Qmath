/**
 * XP System - Calculate experience points and city levels
 * Based on Swedish specification for gamification
 */

// XP awards for different actions
export const XP_PER_ACTION = {
    correct_answer_easy: 5,
    correct_answer_medium: 10,
    correct_answer_hard: 20,
    correct_answer_very_hard: 30,
    first_attempt_bonus_multiplier: 1.5,
    streak_day: 25,
    reflection_submitted: 15,
    pomodoro_completed: 10,
    mastery_achieved: 100,
    achievement_unlocked: 50,
    helped_other_student: 30, // Future feature
} as const;

// City levels and XP requirements
export const CITY_LEVELS = [
    { level: 1, name: 'Empty Land', xpRequired: 0 },
    { level: 2, name: 'Small Village', xpRequired: 100 },
    { level: 3, name: 'Growing Community', xpRequired: 300 },
    { level: 4, name: 'Town', xpRequired: 600 },
    { level: 5, name: 'City', xpRequired: 1000 },
    { level: 6, name: 'Metropolis', xpRequired: 1500 },
    { level: 7, name: 'World Metropolis', xpRequired: 2500 },
] as const;

// Building unlock requirements
export const BUILDING_UNLOCKS = {
    foundation: {
        name: 'Foundation',
        requirement: 'first_session',
        xp: 0,
        description: 'Your first study session',
    },
    library: {
        name: 'Library',
        requirement: 'questions_solved',
        count: 50,
        description: 'Solve 50 questions',
    },
    observatory: {
        name: 'Observatory',
        requirement: 'accuracy_on_hard',
        percentage: 80,
        description: '80% accuracy on difficult questions',
    },
    garden: {
        name: 'Garden',
        requirement: 'streak_days',
        count: 7,
        description: '7-day study streak',
    },
    bridge: {
        name: 'Bridge',
        requirement: 'chapter_complete',
        description: 'Complete a chapter',
    },
    lighthouse: {
        name: 'Lighthouse',
        requirement: 'help_others',
        count: 5,
        description: 'Help other students (future)',
    },
    university: {
        name: 'University',
        requirement: 'topic_mastery',
        description: 'Achieve mastery on a topic',
    },
} as const;

/**
 * Calculate XP for a question attempt
 */
export function calculateQuestionXP(params: {
    isCorrect: boolean;
    difficultyLevel: number; // 1-5
    isFirstAttempt: boolean;
    hintsUsed: number;
}): number {
    if (!params.isCorrect) return 0;

    let xp = 0;

    // Base XP by difficulty
    switch (params.difficultyLevel) {
        case 1:
            xp = XP_PER_ACTION.correct_answer_easy;
            break;
        case 2:
            xp = XP_PER_ACTION.correct_answer_easy;
            break;
        case 3:
            xp = XP_PER_ACTION.correct_answer_medium;
            break;
        case 4:
            xp = XP_PER_ACTION.correct_answer_hard;
            break;
        case 5:
            xp = XP_PER_ACTION.correct_answer_very_hard;
            break;
        default:
            xp = XP_PER_ACTION.correct_answer_medium;
    }

    // First attempt bonus
    if (params.isFirstAttempt) {
        xp *= XP_PER_ACTION.first_attempt_bonus_multiplier;
    }

    // Penalty for hints (reduce by 10% per hint)
    if (params.hintsUsed > 0) {
        xp *= Math.max(0.5, 1 - params.hintsUsed * 0.1);
    }

    return Math.round(xp);
}

/**
 * Calculate daily streak XP
 */
export function calculateStreakXP(streakDays: number): number {
    return XP_PER_ACTION.streak_day;
}

/**
 * Calculate XP for reflection
 */
export function calculateReflectionXP(): number {
    return XP_PER_ACTION.reflection_submitted;
}

/**
 * Calculate XP for mastery achievement
 */
export function calculateMasteryXP(): number {
    return XP_PER_ACTION.mastery_achieved;
}

/**
 * Get city level from total XP
 */
export function getCityLevel(totalXp: number): {
    level: number;
    name: string;
    currentLevelXp: number;
    nextLevelXp: number;
    progressToNext: number;
} {
    let currentLevelIndex = 0;

    for (let i = 0; i < CITY_LEVELS.length; i++) {
        if (totalXp >= CITY_LEVELS[i].xpRequired) {
            currentLevelIndex = i;
        } else {
            break;
        }
    }

    const currentLevel = CITY_LEVELS[currentLevelIndex];
    const nextLevel = CITY_LEVELS[Math.min(currentLevelIndex + 1, CITY_LEVELS.length - 1)];

    const currentLevelXp = currentLevel.xpRequired;
    const nextLevelXp = nextLevel.xpRequired;
    const xpInCurrentLevel = totalXp - currentLevelXp;
    const xpNeededForNext = nextLevelXp - currentLevelXp;
    const progressToNext = xpNeededForNext > 0 ? (xpInCurrentLevel / xpNeededForNext) * 100 : 100;

    return {
        level: currentLevel.level,
        name: currentLevel.name,
        currentLevelXp,
        nextLevelXp,
        progressToNext: Math.min(100, Math.round(progressToNext)),
    };
}

/**
 * Check which buildings should be unlocked
 */
export function checkBuildingUnlock(params: {
    totalQuestions: number;
    hardQuestionAccuracy: number;
    currentStreak: number;
    chaptersCompleted: number;
    topicsMastered: number;
    studentsHelped: number;
}): Record<string, boolean> {
    return {
        foundation: true, // Always unlocked
        library: params.totalQuestions >= BUILDING_UNLOCKS.library.count!,
        observatory: params.hardQuestionAccuracy >= BUILDING_UNLOCKS.observatory.percentage!,
        garden: params.currentStreak >= BUILDING_UNLOCKS.garden.count!,
        bridge: params.chaptersCompleted >= 1,
        lighthouse: params.studentsHelped >= (BUILDING_UNLOCKS.lighthouse.count || 0),
        university: params.topicsMastered >= 1,
    };
}

/**
 * Calculate building level (1-5 based on progress)
 */
export function calculateBuildingLevel(unlocked: boolean, userProgress: number, maxProgress: number): number {
    if (!unlocked) return 0;

    const ratio = userProgress / maxProgress;
    if (ratio >= 1.0) return 5;
    if (ratio >= 0.8) return 4;
    if (ratio >= 0.6) return 3;
    if (ratio >= 0.4) return 2;
    return 1;
}
