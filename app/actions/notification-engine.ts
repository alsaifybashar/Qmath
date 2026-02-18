'use server';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { eq, and, lte, gte, desc, sql } from 'drizzle-orm';
import { userTopicMastery } from '@/db/dashboard-schema';
import { topics } from '@/db/schema';

// ============ TYPES ============

export interface ReviewNotification {
    id: string;
    topicId: string;
    topicName: string;
    courseCode: string;
    masteryLevel: number; // 0-5
    urgency: 'overdue' | 'due_today' | 'upcoming';
    daysSinceReview: number;
    nextReviewDate: Date;
    suggestedAction: string;
    priority: number; // 1-10
}

export interface NotificationSummary {
    overdue: number;
    dueToday: number;
    upcoming: number;
    total: number;
    notifications: ReviewNotification[];
}

// ============ SPACED REPETITION INTERVALS ============

/**
 * SM-2 inspired intervals based on consecutive correct answers.
 * Lower mastery levels have shorter intervals to reinforce learning.
 */
const REVIEW_INTERVALS: Record<number, number> = {
    0: 1,   // 0 consecutive correct: review next day
    1: 2,   // 1 consecutive correct: 2 days
    2: 4,   // 2 consecutive correct: 4 days
    3: 7,   // 3 consecutive correct: 1 week
    4: 14,  // 4 consecutive correct: 2 weeks
    5: 30,  // 5 consecutive correct: 1 month
    6: 60,  // 6 consecutive correct: 2 months
    7: 120, // 7+ consecutive correct: 4 months
};

function getReviewInterval(consecutiveCorrect: number): number {
    if (consecutiveCorrect >= 7) return REVIEW_INTERVALS[7];
    return REVIEW_INTERVALS[consecutiveCorrect] || 1;
}

// ============ MAIN FUNCTIONS ============

/**
 * Calculate and update next review dates based on spaced repetition.
 * Called after each study session to schedule future reviews.
 */
export async function updateReviewSchedule(topicId: string, isCorrect: boolean): Promise<void> {
    const session = await auth();
    if (!session?.user?.id) return;

    const userId = session.user.id;

    const [mastery] = await db.select()
        .from(userTopicMastery)
        .where(and(
            eq(userTopicMastery.userId, userId),
            eq(userTopicMastery.topicId, topicId),
        ))
        .limit(1);

    if (!mastery) return;

    const now = new Date();
    let consecutiveCorrect = mastery.consecutiveCorrect || 0;

    if (isCorrect) {
        consecutiveCorrect += 1;
    } else {
        // Reset on wrong answer — moves topic back in the schedule
        consecutiveCorrect = Math.max(0, Math.floor(consecutiveCorrect / 2));
    }

    const intervalDays = getReviewInterval(consecutiveCorrect);
    const nextReview = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    await db.update(userTopicMastery)
        .set({
            consecutiveCorrect,
            nextReviewDate: nextReview,
            lastPracticedAt: now,
            updatedAt: now,
        })
        .where(eq(userTopicMastery.id, mastery.id));

    console.log(`[SpacedRepetition] Topic "${topicId}": ${consecutiveCorrect} consecutive → review in ${intervalDays} days`);
}

/**
 * Get all pending review notifications.
 * Zero AI cost — pure database queries + date math.
 */
export async function getReviewNotifications(): Promise<NotificationSummary> {
    const session = await auth();
    if (!session?.user?.id) {
        return { overdue: 0, dueToday: 0, upcoming: 0, total: 0, notifications: [] };
    }

    const userId = session.user.id;
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    // Get all mastery records with review dates
    const masteryRecords = await db.select({
        id: userTopicMastery.id,
        topicId: userTopicMastery.topicId,
        masteryLevel: userTopicMastery.masteryLevel,
        lastPracticedAt: userTopicMastery.lastPracticedAt,
        nextReviewDate: userTopicMastery.nextReviewDate,
        consecutiveCorrect: userTopicMastery.consecutiveCorrect,
    })
        .from(userTopicMastery)
        .where(and(
            eq(userTopicMastery.userId, userId),
            lte(userTopicMastery.nextReviewDate, threeDaysFromNow),
        ));

    // Get topic details
    const allTopics = await db.select({
        id: topics.id,
        title: topics.title,
        courseId: topics.courseId,
    }).from(topics);

    const topicMap = new Map(allTopics.map(t => [t.id, t]));

    // Build notifications
    const notifications: ReviewNotification[] = masteryRecords
        .map(m => {
            const topic = topicMap.get(m.topicId);
            if (!topic) return null;

            const reviewDate = m.nextReviewDate || now;
            const daysSinceReview = m.lastPracticedAt
                ? Math.floor((now.getTime() - m.lastPracticedAt.getTime()) / (24 * 60 * 60 * 1000))
                : 999;

            // Determine urgency
            let urgency: 'overdue' | 'due_today' | 'upcoming';
            if (reviewDate < todayStart) {
                urgency = 'overdue';
            } else if (reviewDate <= todayEnd) {
                urgency = 'due_today';
            } else {
                urgency = 'upcoming';
            }

            // Calculate priority
            let priority = 5;
            if (urgency === 'overdue') priority = 9;
            else if (urgency === 'due_today') priority = 7;
            if ((m.masteryLevel || 0) < 3) priority = Math.min(10, priority + 1);

            // Suggested action based on mastery
            const level = m.masteryLevel || 0;
            let suggestedAction = 'Quick review (5 questions)';
            if (level <= 1) suggestedAction = 'Full practice session (15+ questions)';
            else if (level <= 3) suggestedAction = 'Focused review (10 questions)';
            else if (level >= 4) suggestedAction = 'Quick refresher (3 questions)';

            return {
                id: m.id,
                topicId: m.topicId,
                topicName: topic.title || 'Unknown Topic',
                courseCode: '', // Would need join to get course code
                masteryLevel: level,
                urgency,
                daysSinceReview,
                nextReviewDate: reviewDate,
                suggestedAction,
                priority,
            };
        })
        .filter((n): n is ReviewNotification => n !== null)
        .sort((a, b) => b.priority - a.priority);

    const overdue = notifications.filter(n => n.urgency === 'overdue').length;
    const dueToday = notifications.filter(n => n.urgency === 'due_today').length;
    const upcoming = notifications.filter(n => n.urgency === 'upcoming').length;

    return {
        overdue,
        dueToday,
        upcoming,
        total: notifications.length,
        notifications,
    };
}

/**
 * Dismiss a review notification by bumping its next review date by 1 day.
 */
export async function snoozeReview(masteryId: string): Promise<void> {
    const session = await auth();
    if (!session?.user?.id) return;

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.update(userTopicMastery)
        .set({
            nextReviewDate: tomorrow,
            updatedAt: new Date(),
        })
        .where(eq(userTopicMastery.id, masteryId));
}

/**
 * Mark a review as complete — updates the spaced repetition schedule.
 */
export async function completeReview(topicId: string, questionsCorrect: number, totalQuestions: number): Promise<void> {
    const accuracy = totalQuestions > 0 ? questionsCorrect / totalQuestions : 0;
    // If accuracy >= 80%, treat as correct for spaced repetition
    await updateReviewSchedule(topicId, accuracy >= 0.8);
}
