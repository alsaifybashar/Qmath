'use server';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { eq, and, sql } from 'drizzle-orm';
import {
    userCity,
    userStreaks,
    userAchievements,
    userPersonalRecords,
    questionAttempts,
} from '@/db/dashboard-schema';
import { courses } from '@/db/schema';
import {
    calculateQuestionXP,
    calculateStreakXP,
    calculateMasteryXP,
    getCityLevel,
} from '@/lib/dashboard/xp-system';
import {
    calculateCityProgress,
    calculateWeather,
    ACHIEVEMENTS,
    type UserCityData,
} from '@/lib/dashboard/city-system';

// ============================================================================
// XP MANAGEMENT
// ============================================================================

/**
 * Award XP to user and update city state
 */
export async function awardXP(params: {
    xpAmount: number;
    reason: 'question' | 'streak' | 'mastery' | 'achievement' | 'reflection' | 'pomodoro';
    metadata?: Record<string, unknown>;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Not authenticated' };
    }

    const userId = session.user.id;

    try {
        // Get current city state
        const cityData = await db
            .select()
            .from(userCity)
            .where(eq(userCity.userId, userId))
            .limit(1);

        if (cityData.length === 0) {
            // Initialize city if not exists
            const userCourses = await db.select().from(courses).limit(1);
            await db.insert(userCity).values({
                userId,
                courseId: userCourses[0]?.id || 'default',
                cityLevel: 1,
                totalXp: params.xpAmount,
                buildings: JSON.stringify({}),
                weather: 'sunny',
            });
        } else {
            // Update existing city
            const currentXp = cityData[0].totalXp || 0;
            const newXp = currentXp + params.xpAmount;
            const newLevel = getCityLevel(newXp);

            await db
                .update(userCity)
                .set({
                    totalXp: newXp,
                    cityLevel: newLevel.level,
                    lastUpdated: new Date(),
                })
                .where(eq(userCity.userId, userId));

            // Check for level up achievement
            if (newLevel.level > getCityLevel(currentXp).level) {
                await checkAndAwardAchievement(userId, 'level_up', { newLevel: newLevel.level });
            }
        }

        // Update personal records
        await updatePersonalRecords(userId, { xpEarned: params.xpAmount });

        return { success: true, xpAwarded: params.xpAmount };
    } catch (error) {
        console.error('Error awarding XP:', error);
        return { success: false, error: 'Failed to award XP' };
    }
}

/**
 * Award XP for completing a question
 */
export async function awardQuestionXP(params: {
    isCorrect: boolean;
    difficultyLevel: number;
    isFirstAttempt: boolean;
    hintsUsed: number;
}) {
    const xpAmount = calculateQuestionXP(params);

    if (xpAmount > 0) {
        return awardXP({
            xpAmount,
            reason: 'question',
            metadata: params,
        });
    }

    return { success: true, xpAwarded: 0 };
}

/**
 * Award XP for maintaining streak
 */
export async function awardStreakXP() {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Not authenticated' };
    }

    const userId = session.user.id;

    // Get streak data
    const streakData = await db
        .select()
        .from(userStreaks)
        .where(eq(userStreaks.userId, userId))
        .limit(1);

    if (streakData.length === 0) return { success: true, xpAwarded: 0 };

    const currentStreak = streakData[0].currentStreak || 0;
    const xpAmount = calculateStreakXP(currentStreak);

    // Check for streak achievements
    if (currentStreak === 7) {
        await checkAndAwardAchievement(userId, 'week_warrior', { streakDays: 7 });
    } else if (currentStreak === 30) {
        await checkAndAwardAchievement(userId, 'streak_master', { streakDays: 30 });
    }

    return awardXP({
        xpAmount,
        reason: 'streak',
        metadata: { currentStreak },
    });
}

// ============================================================================
// WEATHER MANAGEMENT
// ============================================================================

/**
 * Update city weather based on recent activity
 */
export async function updateCityWeather() {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Not authenticated' };
    }

    const userId = session.user.id;

    try {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Get activity data
        const [last24h, last7d, streakData] = await Promise.all([
            db
                .select({ isCorrect: questionAttempts.isCorrect })
                .from(questionAttempts)
                .where(
                    and(
                        eq(questionAttempts.userId, userId),
                        sql`${questionAttempts.timestamp} >= ${oneDayAgo.getTime()}`
                    )
                ),
            db
                .select({ isCorrect: questionAttempts.isCorrect })
                .from(questionAttempts)
                .where(
                    and(
                        eq(questionAttempts.userId, userId),
                        sql`${questionAttempts.timestamp} >= ${sevenDaysAgo.getTime()}`
                    )
                ),
            db.select().from(userStreaks).where(eq(userStreaks.userId, userId)).limit(1),
        ]);

        const accuracyLast7d =
            last7d.length > 0
                ? (last7d.filter((a) => a.isCorrect).length / last7d.length) * 100
                : 0;

        const weather = calculateWeather({
            questionsLast24h: last24h.length,
            questionsLast7d: last7d.length,
            currentStreak: streakData[0]?.currentStreak || 0,
            accuracyLast7d,
        });

        // Update city weather
        await db
            .update(userCity)
            .set({
                weather: weather.current,
                lastUpdated: new Date(),
            })
            .where(eq(userCity.userId, userId));

        return { success: true, weather };
    } catch (error) {
        console.error('Error updating weather:', error);
        return { success: false, error: 'Failed to update weather' };
    }
}

// ============================================================================
// ACHIEVEMENT MANAGEMENT
// ============================================================================

/**
 * Check and award an achievement if not already earned
 */
export async function checkAndAwardAchievement(
    userId: string,
    achievementId: string,
    metadata?: Record<string, unknown>
) {
    try {
        // Check if already earned
        const existing = await db
            .select()
            .from(userAchievements)
            .where(
                and(
                    eq(userAchievements.userId, userId),
                    eq(userAchievements.achievementId, achievementId)
                )
            )
            .limit(1);

        if (existing.length > 0) {
            return { success: true, alreadyEarned: true };
        }

        // Get achievement definition
        const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
        if (!achievement) {
            return { success: false, error: 'Achievement not found' };
        }

        // Award achievement
        await db.insert(userAchievements).values({
            userId,
            achievementId,
            category: achievement.category,
            metadata: metadata ? JSON.stringify(metadata) : null,
        });

        // Award XP for achievement
        if (achievement.xpReward > 0) {
            await awardXP({
                xpAmount: achievement.xpReward,
                reason: 'achievement',
                metadata: { achievementId },
            });
        }

        return { success: true, achievement, xpAwarded: achievement.xpReward };
    } catch (error) {
        console.error('Error awarding achievement:', error);
        return { success: false, error: 'Failed to award achievement' };
    }
}

/**
 * Check for progress-based achievements
 */
export async function checkProgressAchievements() {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Not authenticated' };
    }

    const userId = session.user.id;
    const awarded: string[] = [];

    try {
        // Get user stats
        const [totalAttempts, streakData, existingAchievements] = await Promise.all([
            db
                .select({ count: sql<number>`count(*)` })
                .from(questionAttempts)
                .where(eq(questionAttempts.userId, userId)),
            db.select().from(userStreaks).where(eq(userStreaks.userId, userId)).limit(1),
            db.select().from(userAchievements).where(eq(userAchievements.userId, userId)),
        ]);

        const questionsCompleted = Number(totalAttempts[0]?.count || 0);
        const currentStreak = streakData[0]?.currentStreak || 0;
        const earnedIds = new Set(existingAchievements.map((a) => a.achievementId));

        // Check question milestones
        const questionMilestones = [
            { id: 'first_steps', count: 1 },
            { id: 'scholar', count: 50 },
            { id: 'century_club', count: 100 },
            { id: 'knowledge_seeker', count: 500 },
        ];

        for (const milestone of questionMilestones) {
            if (questionsCompleted >= milestone.count && !earnedIds.has(milestone.id)) {
                const result = await checkAndAwardAchievement(userId, milestone.id, {
                    questionsCompleted,
                });
                if (result.success && !result.alreadyEarned) {
                    awarded.push(milestone.id);
                }
            }
        }

        // Check streak milestones
        const streakMilestones = [
            { id: 'week_warrior', count: 7 },
            { id: 'streak_master', count: 30 },
        ];

        for (const milestone of streakMilestones) {
            if (currentStreak >= milestone.count && !earnedIds.has(milestone.id)) {
                const result = await checkAndAwardAchievement(userId, milestone.id, {
                    streakDays: currentStreak,
                });
                if (result.success && !result.alreadyEarned) {
                    awarded.push(milestone.id);
                }
            }
        }

        return { success: true, awarded };
    } catch (error) {
        console.error('Error checking achievements:', error);
        return { success: false, error: 'Failed to check achievements' };
    }
}

// ============================================================================
// PERSONAL RECORDS
// ============================================================================

/**
 * Update personal records
 */
async function updatePersonalRecords(
    userId: string,
    updates: {
        xpEarned?: number;
        problemsToday?: number;
        newStreak?: number;
    }
) {
    try {
        const existing = await db
            .select()
            .from(userPersonalRecords)
            .where(eq(userPersonalRecords.userId, userId))
            .limit(1);

        if (existing.length === 0) {
            // Create initial records
            await db.insert(userPersonalRecords).values({
                userId,
                totalXpEarned: updates.xpEarned || 0,
                mostProblemsOneDay: updates.problemsToday || 0,
                longestStreak: updates.newStreak || 0,
            });
        } else {
            const current = existing[0];
            const updateData: Record<string, unknown> = { updatedAt: new Date() };

            if (updates.xpEarned) {
                updateData.totalXpEarned = (current.totalXpEarned || 0) + updates.xpEarned;
            }

            if (updates.problemsToday && updates.problemsToday > (current.mostProblemsOneDay || 0)) {
                updateData.mostProblemsOneDay = updates.problemsToday;
            }

            if (updates.newStreak && updates.newStreak > (current.longestStreak || 0)) {
                updateData.longestStreak = updates.newStreak;
            }

            await db
                .update(userPersonalRecords)
                .set(updateData)
                .where(eq(userPersonalRecords.userId, userId));
        }
    } catch (error) {
        console.error('Error updating personal records:', error);
    }
}

// ============================================================================
// BUILDING MANAGEMENT
// ============================================================================

/**
 * Get user's city progress
 */
export async function getCityProgress() {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Not authenticated' };
    }

    const userId = session.user.id;

    try {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [cityData, streakData, allAttempts, last24h, last7d, achievements] = await Promise.all([
            db.select().from(userCity).where(eq(userCity.userId, userId)).limit(1),
            db.select().from(userStreaks).where(eq(userStreaks.userId, userId)).limit(1),
            db.select().from(questionAttempts).where(eq(questionAttempts.userId, userId)),
            db
                .select({ isCorrect: questionAttempts.isCorrect })
                .from(questionAttempts)
                .where(
                    and(
                        eq(questionAttempts.userId, userId),
                        sql`${questionAttempts.timestamp} >= ${oneDayAgo.getTime()}`
                    )
                ),
            db
                .select({
                    isCorrect: questionAttempts.isCorrect,
                    difficultyLevel: questionAttempts.difficultyLevel,
                })
                .from(questionAttempts)
                .where(
                    and(
                        eq(questionAttempts.userId, userId),
                        sql`${questionAttempts.timestamp} >= ${sevenDaysAgo.getTime()}`
                    )
                ),
            db.select().from(userAchievements).where(eq(userAchievements.userId, userId)),
        ]);

        const hardQuestions = last7d.filter((a) => (a.difficultyLevel || 0) >= 4);
        const hardCorrect = hardQuestions.filter((a) => a.isCorrect).length;
        const hardQuestionAccuracy =
            hardQuestions.length > 0 ? (hardCorrect / hardQuestions.length) * 100 : 0;

        const last7dCorrect = last7d.filter((a) => a.isCorrect).length;
        const accuracyLast7d = last7d.length > 0 ? (last7dCorrect / last7d.length) * 100 : 0;

        const userData: UserCityData = {
            totalXp: cityData[0]?.totalXp || 0,
            questionsCompleted: allAttempts.length,
            questionsLast24h: last24h.length,
            questionsLast7d: last7d.length,
            currentStreak: streakData[0]?.currentStreak || 0,
            longestStreak: streakData[0]?.longestStreak || 0,
            accuracyLast7d,
            hardQuestionAccuracy,
            studyMinutes: 0, // TODO: Calculate from sessions
            topicsMastered: 0, // TODO: Calculate from mastery
            achievementsUnlocked: achievements.length,
            recentAchievements: achievements
                .filter((a) => a.earnedAt && a.earnedAt.getTime() > sevenDaysAgo.getTime())
                .map((a) => a.achievementId),
        };

        const progress = calculateCityProgress(userData);

        return { success: true, progress };
    } catch (error) {
        console.error('Error getting city progress:', error);
        return { success: false, error: 'Failed to get city progress' };
    }
}
