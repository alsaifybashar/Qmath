/**
 * City System - Complete gamification engine for Virtual City
 * Handles buildings, weather, achievements, and city progression
 */

// ============================================================================
// BUILDING DEFINITIONS
// ============================================================================

export interface BuildingDefinition {
    id: string;
    name: string;
    emoji: string;
    category: 'core' | 'academic' | 'social' | 'special';
    description: string;
    unlockRequirement: {
        type: 'xp' | 'questions' | 'streak' | 'accuracy' | 'mastery' | 'time' | 'achievement';
        value: number;
        description: string;
    };
    maxLevel: number;
    levelRequirements: number[]; // Progress needed for each level
    bonuses: {
        xpMultiplier?: number;
        streakProtection?: boolean;
        unlockHints?: boolean;
    };
    position: { x: number; y: number };
    size: { width: number; height: number };
}

export const BUILDINGS: BuildingDefinition[] = [
    // Core buildings (always visible)
    {
        id: 'town_hall',
        name: 'Town Hall',
        emoji: '🏛️',
        category: 'core',
        description: 'The heart of your learning city. Grows with your overall progress.',
        unlockRequirement: { type: 'xp', value: 0, description: 'Start your journey' },
        maxLevel: 5,
        levelRequirements: [0, 100, 300, 600, 1000],
        bonuses: { xpMultiplier: 1.0 },
        position: { x: 220, y: 280 },
        size: { width: 80, height: 100 },
    },
    {
        id: 'library',
        name: 'Library',
        emoji: '📚',
        category: 'academic',
        description: 'A repository of knowledge. Grows as you solve more questions.',
        unlockRequirement: { type: 'questions', value: 25, description: 'Solve 25 questions' },
        maxLevel: 5,
        levelRequirements: [25, 75, 150, 300, 500],
        bonuses: { unlockHints: true },
        position: { x: 80, y: 260 },
        size: { width: 70, height: 80 },
    },
    {
        id: 'observatory',
        name: 'Observatory',
        emoji: '🔭',
        category: 'academic',
        description: 'Reach for the stars! Built through mastering difficult concepts.',
        unlockRequirement: { type: 'accuracy', value: 75, description: '75% accuracy on hard questions' },
        maxLevel: 5,
        levelRequirements: [75, 80, 85, 90, 95],
        bonuses: { xpMultiplier: 1.2 },
        position: { x: 360, y: 220 },
        size: { width: 60, height: 100 },
    },
    {
        id: 'garden',
        name: 'Zen Garden',
        emoji: '🌸',
        category: 'social',
        description: 'A peaceful retreat that blooms with consistent study habits.',
        unlockRequirement: { type: 'streak', value: 5, description: '5-day study streak' },
        maxLevel: 5,
        levelRequirements: [5, 10, 21, 30, 50],
        bonuses: { streakProtection: true },
        position: { x: 300, y: 320 },
        size: { width: 80, height: 40 },
    },
    {
        id: 'workshop',
        name: 'Workshop',
        emoji: '🔧',
        category: 'academic',
        description: 'Where skills are forged. Built through practice and persistence.',
        unlockRequirement: { type: 'time', value: 300, description: '5 hours of study time' },
        maxLevel: 5,
        levelRequirements: [300, 600, 1200, 2400, 5000],
        bonuses: { xpMultiplier: 1.1 },
        position: { x: 140, y: 320 },
        size: { width: 60, height: 50 },
    },
    {
        id: 'academy',
        name: 'Academy',
        emoji: '🎓',
        category: 'academic',
        description: 'The pinnacle of learning. Built by achieving topic mastery.',
        unlockRequirement: { type: 'mastery', value: 1, description: 'Master 1 topic' },
        maxLevel: 5,
        levelRequirements: [1, 3, 5, 8, 12],
        bonuses: { xpMultiplier: 1.3 },
        position: { x: 420, y: 280 },
        size: { width: 70, height: 90 },
    },
    {
        id: 'lighthouse',
        name: 'Lighthouse',
        emoji: '🗼',
        category: 'special',
        description: 'Guides your way through challenging topics. Unlocked by perseverance.',
        unlockRequirement: { type: 'questions', value: 100, description: 'Solve 100 questions' },
        maxLevel: 5,
        levelRequirements: [100, 200, 350, 500, 750],
        bonuses: { unlockHints: true },
        position: { x: 480, y: 300 },
        size: { width: 40, height: 80 },
    },
    {
        id: 'monument',
        name: 'Monument',
        emoji: '🗿',
        category: 'special',
        description: 'A testament to your achievements. Grows with unlocked achievements.',
        unlockRequirement: { type: 'achievement', value: 3, description: 'Unlock 3 achievements' },
        maxLevel: 5,
        levelRequirements: [3, 6, 10, 15, 20],
        bonuses: { xpMultiplier: 1.15 },
        position: { x: 30, y: 320 },
        size: { width: 40, height: 60 },
    },
];

// ============================================================================
// ACHIEVEMENT DEFINITIONS
// ============================================================================

export interface AchievementDefinition {
    id: string;
    name: string;
    emoji: string;
    description: string;
    category: 'learning' | 'habits' | 'growth' | 'special';
    requirement: {
        type: string;
        value: number;
    };
    xpReward: number;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
    // Learning achievements
    {
        id: 'first_steps',
        name: 'First Steps',
        emoji: '👣',
        description: 'Complete your first question',
        category: 'learning',
        requirement: { type: 'questions_completed', value: 1 },
        xpReward: 10,
        rarity: 'common',
    },
    {
        id: 'scholar',
        name: 'Scholar',
        emoji: '📖',
        description: 'Complete 50 questions',
        category: 'learning',
        requirement: { type: 'questions_completed', value: 50 },
        xpReward: 50,
        rarity: 'uncommon',
    },
    {
        id: 'century_club',
        name: 'Century Club',
        emoji: '💯',
        description: 'Complete 100 questions',
        category: 'learning',
        requirement: { type: 'questions_completed', value: 100 },
        xpReward: 100,
        rarity: 'rare',
    },
    {
        id: 'knowledge_seeker',
        name: 'Knowledge Seeker',
        emoji: '🔍',
        description: 'Complete 500 questions',
        category: 'learning',
        requirement: { type: 'questions_completed', value: 500 },
        xpReward: 250,
        rarity: 'epic',
    },
    {
        id: 'perfect_score',
        name: 'Perfect Score',
        emoji: '⭐',
        description: 'Get 10 correct answers in a row',
        category: 'learning',
        requirement: { type: 'consecutive_correct', value: 10 },
        xpReward: 75,
        rarity: 'rare',
    },
    {
        id: 'master_mind',
        name: 'Master Mind',
        emoji: '🧠',
        description: 'Achieve mastery in a topic',
        category: 'learning',
        requirement: { type: 'topics_mastered', value: 1 },
        xpReward: 150,
        rarity: 'rare',
    },
    // Habit achievements
    {
        id: 'week_warrior',
        name: 'Week Warrior',
        emoji: '🔥',
        description: '7-day study streak',
        category: 'habits',
        requirement: { type: 'streak_days', value: 7 },
        xpReward: 100,
        rarity: 'uncommon',
    },
    {
        id: 'streak_master',
        name: 'Streak Master',
        emoji: '🔥',
        description: '30-day study streak',
        category: 'habits',
        requirement: { type: 'streak_days', value: 30 },
        xpReward: 300,
        rarity: 'epic',
    },
    {
        id: 'early_bird',
        name: 'Early Bird',
        emoji: '🌅',
        description: 'Study before 8 AM',
        category: 'habits',
        requirement: { type: 'early_study', value: 1 },
        xpReward: 25,
        rarity: 'common',
    },
    {
        id: 'night_owl',
        name: 'Night Owl',
        emoji: '🦉',
        description: 'Study after 10 PM',
        category: 'habits',
        requirement: { type: 'late_study', value: 1 },
        xpReward: 25,
        rarity: 'common',
    },
    {
        id: 'pomodoro_pro',
        name: 'Pomodoro Pro',
        emoji: '🍅',
        description: 'Complete 10 Pomodoro sessions',
        category: 'habits',
        requirement: { type: 'pomodoros_completed', value: 10 },
        xpReward: 75,
        rarity: 'uncommon',
    },
    // Growth achievements
    {
        id: 'comeback_kid',
        name: 'Comeback Kid',
        emoji: '💪',
        description: 'Recover from 3 wrong answers to get 5 correct in a row',
        category: 'growth',
        requirement: { type: 'comeback', value: 1 },
        xpReward: 50,
        rarity: 'uncommon',
    },
    {
        id: 'reflective_learner',
        name: 'Reflective Learner',
        emoji: '🪞',
        description: 'Submit 10 error reflections',
        category: 'growth',
        requirement: { type: 'reflections', value: 10 },
        xpReward: 100,
        rarity: 'rare',
    },
    {
        id: 'level_up',
        name: 'Level Up',
        emoji: '⬆️',
        description: 'Reach city level 3',
        category: 'growth',
        requirement: { type: 'city_level', value: 3 },
        xpReward: 150,
        rarity: 'uncommon',
    },
    {
        id: 'metropolis',
        name: 'Metropolis',
        emoji: '🌆',
        description: 'Reach city level 7',
        category: 'growth',
        requirement: { type: 'city_level', value: 7 },
        xpReward: 500,
        rarity: 'legendary',
    },
    // Special achievements
    {
        id: 'builder',
        name: 'Builder',
        emoji: '🏗️',
        description: 'Unlock 5 buildings',
        category: 'special',
        requirement: { type: 'buildings_unlocked', value: 5 },
        xpReward: 200,
        rarity: 'epic',
    },
];

// ============================================================================
// WEATHER SYSTEM
// ============================================================================

export type WeatherType = 'sunny' | 'partly_cloudy' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';

export interface WeatherState {
    current: WeatherType;
    intensity: number; // 0-1
    description: string;
}

/**
 * Calculate weather based on recent study activity
 * More activity = better weather
 */
export function calculateWeather(params: {
    questionsLast24h: number;
    questionsLast7d: number;
    currentStreak: number;
    accuracyLast7d: number;
}): WeatherState {
    // Calculate activity score (0-100)
    const dailyScore = Math.min(100, params.questionsLast24h * 5);
    const weeklyScore = Math.min(100, params.questionsLast7d * 2);
    const streakScore = Math.min(100, params.currentStreak * 10);
    const accuracyScore = params.accuracyLast7d;

    const overallScore = (dailyScore * 0.3 + weeklyScore * 0.3 + streakScore * 0.2 + accuracyScore * 0.2);

    if (overallScore >= 80) {
        return {
            current: 'sunny',
            intensity: 1,
            description: 'Brilliant sunshine! Your city is thriving!',
        };
    } else if (overallScore >= 60) {
        return {
            current: 'partly_cloudy',
            intensity: 0.8,
            description: 'Pleasant weather with a few clouds.',
        };
    } else if (overallScore >= 40) {
        return {
            current: 'cloudy',
            intensity: 0.6,
            description: 'Overcast skies. Keep studying to bring the sun!',
        };
    } else if (overallScore >= 20) {
        return {
            current: 'rainy',
            intensity: 0.4,
            description: 'Rainy day. Your city needs more attention.',
        };
    } else {
        return {
            current: 'stormy',
            intensity: 0.2,
            description: 'Storm clouds gather. Time to get back on track!',
        };
    }
}

// ============================================================================
// TIME OF DAY SYSTEM
// ============================================================================

export type TimeOfDay = 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';

export interface TimeState {
    current: TimeOfDay;
    hour: number;
    skyGradient: string;
    ambientLight: number; // 0-1
}

export function getTimeOfDay(hour?: number): TimeState {
    const currentHour = hour ?? new Date().getHours();

    if (currentHour >= 5 && currentHour < 7) {
        return {
            current: 'dawn',
            hour: currentHour,
            skyGradient: 'linear-gradient(to bottom, #1e3a5f 0%, #f97316 30%, #fcd34d 100%)',
            ambientLight: 0.6,
        };
    } else if (currentHour >= 7 && currentHour < 12) {
        return {
            current: 'morning',
            hour: currentHour,
            skyGradient: 'linear-gradient(to bottom, #3b82f6 0%, #60a5fa 50%, #93c5fd 100%)',
            ambientLight: 0.9,
        };
    } else if (currentHour >= 12 && currentHour < 17) {
        return {
            current: 'afternoon',
            hour: currentHour,
            skyGradient: 'linear-gradient(to bottom, #2563eb 0%, #60a5fa 100%)',
            ambientLight: 1.0,
        };
    } else if (currentHour >= 17 && currentHour < 20) {
        return {
            current: 'evening',
            hour: currentHour,
            skyGradient: 'linear-gradient(to bottom, #1e3a5f 0%, #f97316 40%, #fcd34d 100%)',
            ambientLight: 0.7,
        };
    } else {
        return {
            current: 'night',
            hour: currentHour,
            skyGradient: 'linear-gradient(to bottom, #0f172a 0%, #1e293b 50%, #334155 100%)',
            ambientLight: 0.3,
        };
    }
}

// ============================================================================
// CITY STATE CALCULATOR
// ============================================================================

export interface CityProgress {
    level: number;
    levelName: string;
    totalXp: number;
    xpToNextLevel: number;
    xpProgress: number; // 0-100 percentage
    buildings: BuildingState[];
    weather: WeatherState;
    timeOfDay: TimeState;
    inhabitants: number;
    recentAchievements: string[];
}

export interface BuildingState {
    definition: BuildingDefinition;
    unlocked: boolean;
    level: number;
    progress: number; // 0-100 percentage to next level
    progressValue: number; // actual value
}

export interface UserCityData {
    totalXp: number;
    questionsCompleted: number;
    questionsLast24h: number;
    questionsLast7d: number;
    currentStreak: number;
    longestStreak: number;
    accuracyLast7d: number;
    hardQuestionAccuracy: number;
    studyMinutes: number;
    topicsMastered: number;
    achievementsUnlocked: number;
    recentAchievements: string[];
}

const CITY_LEVEL_NAMES = [
    'Empty Plot',
    'Small Camp',
    'Village',
    'Town',
    'City',
    'Metropolis',
    'World Capital',
];

const CITY_LEVEL_XP = [0, 100, 300, 600, 1000, 1800, 3000];

export function calculateCityProgress(userData: UserCityData): CityProgress {
    // Calculate city level
    let level = 1;
    let xpForCurrentLevel = 0;
    let xpForNextLevel = CITY_LEVEL_XP[1];

    for (let i = CITY_LEVEL_XP.length - 1; i >= 0; i--) {
        if (userData.totalXp >= CITY_LEVEL_XP[i]) {
            level = i + 1;
            xpForCurrentLevel = CITY_LEVEL_XP[i];
            xpForNextLevel = CITY_LEVEL_XP[Math.min(i + 1, CITY_LEVEL_XP.length - 1)];
            break;
        }
    }

    const xpInLevel = userData.totalXp - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - xpForCurrentLevel;
    const xpProgress = xpNeeded > 0 ? Math.min(100, (xpInLevel / xpNeeded) * 100) : 100;

    // Calculate building states
    const buildings: BuildingState[] = BUILDINGS.map((def) => {
        const { unlocked, level: bLevel, progress, progressValue } = calculateBuildingState(def, userData);
        return {
            definition: def,
            unlocked,
            level: bLevel,
            progress,
            progressValue,
        };
    });

    // Calculate weather
    const weather = calculateWeather({
        questionsLast24h: userData.questionsLast24h,
        questionsLast7d: userData.questionsLast7d,
        currentStreak: userData.currentStreak,
        accuracyLast7d: userData.accuracyLast7d,
    });

    // Get time of day
    const timeOfDay = getTimeOfDay();

    // Calculate inhabitants (based on city level and activity)
    const baseInhabitants = level * 2;
    const activityBonus = Math.floor(userData.questionsLast7d / 10);
    const inhabitants = Math.min(20, baseInhabitants + activityBonus);

    return {
        level,
        levelName: CITY_LEVEL_NAMES[level - 1] || 'Unknown',
        totalXp: userData.totalXp,
        xpToNextLevel: xpForNextLevel - userData.totalXp,
        xpProgress,
        buildings,
        weather,
        timeOfDay,
        inhabitants,
        recentAchievements: userData.recentAchievements,
    };
}

function calculateBuildingState(
    def: BuildingDefinition,
    userData: UserCityData
): { unlocked: boolean; level: number; progress: number; progressValue: number } {
    let progressValue = 0;
    let unlocked = false;

    // Get the relevant progress value based on requirement type
    switch (def.unlockRequirement.type) {
        case 'xp':
            progressValue = userData.totalXp;
            unlocked = progressValue >= def.unlockRequirement.value;
            break;
        case 'questions':
            progressValue = userData.questionsCompleted;
            unlocked = progressValue >= def.unlockRequirement.value;
            break;
        case 'streak':
            progressValue = userData.longestStreak;
            unlocked = progressValue >= def.unlockRequirement.value;
            break;
        case 'accuracy':
            progressValue = userData.hardQuestionAccuracy;
            unlocked = progressValue >= def.unlockRequirement.value;
            break;
        case 'mastery':
            progressValue = userData.topicsMastered;
            unlocked = progressValue >= def.unlockRequirement.value;
            break;
        case 'time':
            progressValue = userData.studyMinutes;
            unlocked = progressValue >= def.unlockRequirement.value;
            break;
        case 'achievement':
            progressValue = userData.achievementsUnlocked;
            unlocked = progressValue >= def.unlockRequirement.value;
            break;
    }

    if (!unlocked) {
        // Return progress towards unlocking
        const unlockProgress = Math.min(100, (progressValue / def.unlockRequirement.value) * 100);
        return { unlocked: false, level: 0, progress: unlockProgress, progressValue };
    }

    // Calculate building level
    let level = 1;
    for (let i = def.levelRequirements.length - 1; i >= 0; i--) {
        if (progressValue >= def.levelRequirements[i]) {
            level = i + 1;
            break;
        }
    }

    // Calculate progress to next level
    const currentLevelReq = def.levelRequirements[level - 1] || 0;
    const nextLevelReq = def.levelRequirements[level] || def.levelRequirements[level - 1];
    const levelProgress = nextLevelReq > currentLevelReq
        ? Math.min(100, ((progressValue - currentLevelReq) / (nextLevelReq - currentLevelReq)) * 100)
        : 100;

    return { unlocked: true, level: Math.min(level, def.maxLevel), progress: levelProgress, progressValue };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getAchievementById(id: string): AchievementDefinition | undefined {
    return ACHIEVEMENTS.find((a) => a.id === id);
}

export function getBuildingById(id: string): BuildingDefinition | undefined {
    return BUILDINGS.find((b) => b.id === id);
}

export function getRarityColor(rarity: AchievementDefinition['rarity']): string {
    switch (rarity) {
        case 'common':
            return '#94a3b8';
        case 'uncommon':
            return '#22c55e';
        case 'rare':
            return '#3b82f6';
        case 'epic':
            return '#a855f7';
        case 'legendary':
            return '#f59e0b';
        default:
            return '#94a3b8';
    }
}
