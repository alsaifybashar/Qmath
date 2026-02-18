'use server';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { eq, and, gte, desc, sql } from 'drizzle-orm';
import {
    userTopicMastery,
    questionAttempts,
    studySessions,
} from '@/db/dashboard-schema';
import { courses, topics, enrollments } from '@/db/schema';

// ============ TYPES ============

export interface ExamReadiness {
    courseId: string;
    courseName: string;
    courseCode: string;
    overallReadiness: number; // 0-100
    topicBreakdown: {
        topicId: string;
        topicName: string;
        mastery: number; // 0-1
        trend: 'improving' | 'stable' | 'declining';
        recentAccuracy: number; // 0-1
        lastPracticed: Date | null;
        needsReview: boolean;
    }[];
    weakestTopics: string[]; // top 3 weakest topic names
    strongestTopics: string[]; // top 3 strongest topic names
    estimatedGrade: string; // e.g. "B+", "C"
    studyTimeThisWeek: number; // minutes
    questionsThisWeek: number;
}

export interface DashboardInsight {
    type: 'warning' | 'success' | 'tip' | 'milestone';
    title: string;
    message: string;
    actionLabel?: string;
    actionHref?: string;
    priority: number; // 1-10, higher = more important
}

export interface WeakestTopicDetail {
    topicId: string;
    topicName: string;
    courseCode: string;
    mastery: number;
    totalAttempts: number;
    accuracy: number;
    commonErrorTypes: string[];
    suggestedAction: string;
}

export interface StudyPattern {
    mostProductiveDay: string;
    mostProductiveHour: number;
    averageSessionMinutes: number;
    consistencyScore: number; // 0-100
    activeDays: number; // out of last 30
}

// ============ MAIN FUNCTIONS ============

/**
 * Get exam readiness for all enrolled courses.
 * Zero AI cost — pure database queries + arithmetic.
 */
export async function getExamReadiness(): Promise<ExamReadiness[]> {
    const session = await auth();
    if (!session?.user?.id) return [];

    const userId = session.user.id;
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Fetch all data in parallel
    const [userCourses, allMastery, recentAttempts, olderAttempts, allTopics, sessionsData] = await Promise.all([
        // Enrolled courses
        db.select({
            id: courses.id,
            name: courses.name,
            code: courses.code,
        })
            .from(enrollments)
            .innerJoin(courses, eq(enrollments.courseId, courses.id))
            .where(eq(enrollments.userId, userId)),

        // All mastery records
        db.select().from(userTopicMastery)
            .where(eq(userTopicMastery.userId, userId)),

        // Last 7 days attempts
        db.select().from(questionAttempts)
            .where(and(
                eq(questionAttempts.userId, userId),
                gte(questionAttempts.timestamp, sevenDaysAgo),
            )),

        // 7-14 days ago (for trend comparison)
        db.select().from(questionAttempts)
            .where(and(
                eq(questionAttempts.userId, userId),
                gte(questionAttempts.timestamp, fourteenDaysAgo),
            )),

        // All topics
        db.select().from(topics),

        // Study sessions this week
        db.select({
            startedAt: studySessions.startedAt,
            endedAt: studySessions.endedAt,
        })
            .from(studySessions)
            .where(and(
                eq(studySessions.userId, userId),
                gte(studySessions.startedAt, sevenDaysAgo),
            )),
    ]);

    // Calculate per-course readiness
    return userCourses.map(course => {
        const courseTopics = allTopics.filter(t => t.courseId === course.id);
        const courseTopicIds = new Set(courseTopics.map(t => t.id));

        const courseMastery = allMastery.filter(m => courseTopicIds.has(m.topicId));
        const courseRecentAttempts = recentAttempts.filter(a => courseTopicIds.has(a.topicId));
        const courseOlderAttempts = olderAttempts.filter(a =>
            courseTopicIds.has(a.topicId) && a.timestamp && a.timestamp < sevenDaysAgo
        );

        // Per-topic breakdown
        const topicBreakdown = courseTopics.map(topic => {
            const mastery = courseMastery.find(m => m.topicId === topic.id);
            const masteryLevel = (mastery?.masteryLevel || 0) / 5;

            // Recent accuracy for this topic
            const topicRecent = courseRecentAttempts.filter(a => a.topicId === topic.id);
            const topicOlder = courseOlderAttempts.filter(a => a.topicId === topic.id);

            const recentAccuracy = topicRecent.length > 0
                ? topicRecent.filter(a => a.isCorrect).length / topicRecent.length
                : 0;
            const olderAccuracy = topicOlder.length > 0
                ? topicOlder.filter(a => a.isCorrect).length / topicOlder.length
                : 0;

            // Determine trend
            let trend: 'improving' | 'stable' | 'declining' = 'stable';
            if (topicRecent.length >= 3 && topicOlder.length >= 3) {
                const diff = recentAccuracy - olderAccuracy;
                if (diff > 0.1) trend = 'improving';
                else if (diff < -0.1) trend = 'declining';
            }

            return {
                topicId: topic.id,
                topicName: topic.title || 'Unknown',
                mastery: masteryLevel,
                trend,
                recentAccuracy,
                lastPracticed: mastery?.lastPracticedAt || null,
                needsReview: masteryLevel < 0.6 || trend === 'declining',
            };
        });

        // Sort to find weakest/strongest
        const sorted = [...topicBreakdown].sort((a, b) => a.mastery - b.mastery);
        const weakestTopics = sorted.slice(0, 3).map(t => t.topicName);
        const strongestTopics = sorted.slice(-3).reverse().map(t => t.topicName);

        // Overall readiness = weighted average of mastery
        const avgMastery = topicBreakdown.length > 0
            ? topicBreakdown.reduce((sum, t) => sum + t.mastery, 0) / topicBreakdown.length
            : 0;
        const overallReadiness = Math.round(avgMastery * 100);

        // Estimate grade
        const estimatedGrade = estimateGrade(avgMastery);

        // Study stats
        const studyTimeThisWeek = sessionsData.reduce((acc, s) => {
            if (s.startedAt && s.endedAt) {
                return acc + Math.min((s.endedAt.getTime() - s.startedAt.getTime()) / 60000, 180);
            }
            return acc;
        }, 0);

        return {
            courseId: course.id,
            courseName: course.name,
            courseCode: course.code || 'N/A',
            overallReadiness,
            topicBreakdown,
            weakestTopics,
            strongestTopics,
            estimatedGrade,
            studyTimeThisWeek: Math.round(studyTimeThisWeek),
            questionsThisWeek: courseRecentAttempts.length,
        };
    });
}

/**
 * Generate smart dashboard insights (zero AI cost).
 * Analyzes study patterns and suggests actions.
 */
export async function getDashboardInsights(): Promise<DashboardInsight[]> {
    const session = await auth();
    if (!session?.user?.id) return [];

    const userId = session.user.id;
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [mastery, recentAttempts, monthlyAttempts] = await Promise.all([
        db.select().from(userTopicMastery).where(eq(userTopicMastery.userId, userId)),
        db.select().from(questionAttempts).where(and(
            eq(questionAttempts.userId, userId),
            gte(questionAttempts.timestamp, sevenDaysAgo),
        )),
        db.select().from(questionAttempts).where(and(
            eq(questionAttempts.userId, userId),
            gte(questionAttempts.timestamp, thirtyDaysAgo),
        )),
    ]);

    const insights: DashboardInsight[] = [];

    // 1. Declining topics warning
    const decliningTopics = mastery.filter(m => {
        const recent = recentAttempts.filter(a => a.topicId === m.topicId);
        if (recent.length < 3) return false;
        const accuracy = recent.filter(a => a.isCorrect).length / recent.length;
        return accuracy < 0.5 && (m.masteryLevel || 0) >= 3;
    });

    if (decliningTopics.length > 0) {
        insights.push({
            type: 'warning',
            title: 'Topics Need Attention',
            message: `${decliningTopics.length} topic${decliningTopics.length > 1 ? 's' : ''} you previously mastered ${decliningTopics.length > 1 ? 'are' : 'is'} showing lower accuracy this week. Review them before they slip further.`,
            actionLabel: 'Review Now',
            actionHref: '/study',
            priority: 9,
        });
    }

    // 2. Consistency check
    const uniqueDays = new Set(
        recentAttempts
            .filter(a => a.timestamp)
            .map(a => a.timestamp!.toDateString())
    ).size;

    if (uniqueDays <= 2) {
        insights.push({
            type: 'tip',
            title: 'Stay Consistent',
            message: `You've studied ${uniqueDays} day${uniqueDays !== 1 ? 's' : ''} this week. Studying a little each day is more effective than cramming. Try for 4+ days!`,
            actionLabel: 'Start Session',
            actionHref: '/study',
            priority: 7,
        });
    } else if (uniqueDays >= 5) {
        insights.push({
            type: 'success',
            title: 'Great Consistency!',
            message: `You've studied ${uniqueDays} out of 7 days this week. Your consistency is paying off — keep it up!`,
            priority: 3,
        });
    }

    // 3. Error pattern detection
    const computationalErrors = recentAttempts.filter(a => a.errorType === 'computational').length;
    const conceptualErrors = recentAttempts.filter(a => a.errorType === 'conceptual').length;
    const totalWrong = recentAttempts.filter(a => !a.isCorrect).length;

    if (totalWrong > 5) {
        if (computationalErrors > totalWrong * 0.5) {
            insights.push({
                type: 'tip',
                title: 'Watch Your Arithmetic',
                message: `Most of your mistakes this week (${computationalErrors}/${totalWrong}) are computational errors. Slow down on the calculation steps.`,
                priority: 6,
            });
        } else if (conceptualErrors > totalWrong * 0.4) {
            insights.push({
                type: 'tip',
                title: 'Review Core Concepts',
                message: `Many of your mistakes (${conceptualErrors}/${totalWrong}) suggest concept gaps. Re-read the theory before practicing more.`,
                actionLabel: 'Browse Topics',
                actionHref: '/courses',
                priority: 7,
            });
        }
    }

    // 4. Mastery milestone
    const masteredTopics = mastery.filter(m => (m.masteryLevel || 0) >= 4).length;
    const milestones = [5, 10, 25, 50, 100];
    const reachedMilestone = milestones.find(m => masteredTopics >= m && masteredTopics < m + 3);
    if (reachedMilestone) {
        insights.push({
            type: 'milestone',
            title: `${reachedMilestone} Topics Mastered!`,
            message: `You've mastered ${masteredTopics} topics. That's a significant achievement!`,
            priority: 4,
        });
    }

    // 5. Spaced repetition reminder
    const topicsNeedingReview = mastery.filter(m => {
        if (!m.nextReviewDate) return false;
        return m.nextReviewDate <= now;
    });

    if (topicsNeedingReview.length > 0) {
        insights.push({
            type: 'warning',
            title: 'Topics Due for Review',
            message: `${topicsNeedingReview.length} topic${topicsNeedingReview.length > 1 ? 's are' : ' is'} due for spaced repetition review. Reviewing now maximizes long-term retention.`,
            actionLabel: 'Review Topics',
            actionHref: '/study',
            priority: 8,
        });
    }

    // Sort by priority descending
    return insights.sort((a, b) => b.priority - a.priority);
}

/**
 * Get study pattern analytics (zero AI cost).
 */
export async function getStudyPatterns(): Promise<StudyPattern | null> {
    const session = await auth();
    if (!session?.user?.id) return null;

    const userId = session.user.id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [attempts, sessions] = await Promise.all([
        db.select({
            timestamp: questionAttempts.timestamp,
            isCorrect: questionAttempts.isCorrect,
        })
            .from(questionAttempts)
            .where(and(
                eq(questionAttempts.userId, userId),
                gte(questionAttempts.timestamp, thirtyDaysAgo),
            )),
        db.select({
            startedAt: studySessions.startedAt,
            endedAt: studySessions.endedAt,
        })
            .from(studySessions)
            .where(and(
                eq(studySessions.userId, userId),
                gte(studySessions.startedAt, thirtyDaysAgo),
            )),
    ]);

    if (attempts.length === 0) return null;

    // Most productive day
    const dayBuckets: Record<string, number> = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    attempts.forEach(a => {
        if (a.timestamp) {
            const day = dayNames[a.timestamp.getDay()];
            dayBuckets[day] = (dayBuckets[day] || 0) + 1;
        }
    });
    const mostProductiveDay = Object.entries(dayBuckets).sort(([, a], [, b]) => b - a)[0]?.[0] || 'Unknown';

    // Most productive hour
    const hourBuckets: Record<number, number> = {};
    attempts.forEach(a => {
        if (a.timestamp) {
            const hour = a.timestamp.getHours();
            hourBuckets[hour] = (hourBuckets[hour] || 0) + 1;
        }
    });
    const mostProductiveHour = Number(Object.entries(hourBuckets).sort(([, a], [, b]) => b - a)[0]?.[0] ?? 14);

    // Average session length
    const sessionLengths = sessions
        .filter(s => s.startedAt && s.endedAt)
        .map(s => Math.min((s.endedAt!.getTime() - s.startedAt.getTime()) / 60000, 180));
    const averageSessionMinutes = sessionLengths.length > 0
        ? Math.round(sessionLengths.reduce((a, b) => a + b, 0) / sessionLengths.length)
        : 0;

    // Consistency score (active days / 30 * 100)
    const activeDays = new Set(
        attempts
            .filter(a => a.timestamp)
            .map(a => a.timestamp!.toDateString())
    ).size;
    const consistencyScore = Math.round((activeDays / 30) * 100);

    return {
        mostProductiveDay,
        mostProductiveHour,
        averageSessionMinutes,
        consistencyScore,
        activeDays,
    };
}

// ============ HELPERS ============

function estimateGrade(mastery: number): string {
    if (mastery >= 0.9) return 'A';
    if (mastery >= 0.85) return 'A-';
    if (mastery >= 0.8) return 'B+';
    if (mastery >= 0.75) return 'B';
    if (mastery >= 0.7) return 'B-';
    if (mastery >= 0.65) return 'C+';
    if (mastery >= 0.6) return 'C';
    if (mastery >= 0.55) return 'C-';
    if (mastery >= 0.5) return 'D';
    return 'F';
}
