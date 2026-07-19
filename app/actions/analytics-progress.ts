'use server';

import { db } from '@/db/drizzle';
import { topics, courses } from '@/db/schema';
import { userTopicMastery, questionAttempts } from '@/db/dashboard-schema';
import { and, eq, gte, sql } from 'drizzle-orm';
import { auth } from '@/auth';
import type { StudentProgress } from '@/types/analytics';

/** Course requirement shown as the reference line in charts (0–5 scale) */
const DEFAULT_TARGET_MASTERY = 4;

/**
 * Real per-topic progress for the analytics report, computed from
 * user_topic_mastery (kept current by the study grading spine) and
 * question_attempts. Returns null when the student has no practice history
 * yet — the report then falls back to its demo dataset.
 */
export async function getAnalyticsProgress(): Promise<StudentProgress[] | null> {
    const session = await auth();
    if (!session?.user?.id) return null;
    const userId = session.user.id;

    const rows = await db
        .select({
            topicId: userTopicMastery.topicId,
            masteryLevel: userTopicMastery.masteryLevel,
            totalAttempts: userTopicMastery.totalAttempts,
            correctAttempts: userTopicMastery.correctAttempts,
            lastPracticedAt: userTopicMastery.lastPracticedAt,
            topicName: topics.title,
            subject: courses.name,
        })
        .from(userTopicMastery)
        .innerJoin(topics, eq(topics.id, userTopicMastery.topicId))
        .leftJoin(courses, eq(courses.id, topics.courseId))
        .where(eq(userTopicMastery.userId, userId));

    if (rows.length === 0) return null;

    // Class average mastery per topic (all users)
    const classAvgs = await db
        .select({
            topicId: userTopicMastery.topicId,
            avg: sql<number>`avg(${userTopicMastery.masteryLevel})`,
        })
        .from(userTopicMastery)
        .groupBy(userTopicMastery.topicId);
    const classAvgByTopic = new Map(classAvgs.map((r) => [r.topicId, Number(r.avg ?? 0)]));

    // Accuracy per day for the last 7 days, per topic
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recent = await db
        .select({
            topicId: questionAttempts.topicId,
            isCorrect: questionAttempts.isCorrect,
            timestamp: questionAttempts.timestamp,
        })
        .from(questionAttempts)
        .where(and(eq(questionAttempts.userId, userId), gte(questionAttempts.timestamp, weekAgo)));

    const dayBuckets = new Map<string, { correct: number; total: number }[]>();
    for (const a of recent) {
        const dayIndex = Math.min(6, Math.floor((Date.now() - a.timestamp.getTime()) / (24 * 60 * 60 * 1000)));
        const buckets = dayBuckets.get(a.topicId) ?? Array.from({ length: 7 }, () => ({ correct: 0, total: 0 }));
        const bucket = buckets[6 - dayIndex]; // oldest first
        bucket.total += 1;
        if (a.isCorrect) bucket.correct += 1;
        dayBuckets.set(a.topicId, buckets);
    }

    return rows.map((row) => {
        const buckets = dayBuckets.get(row.topicId);
        const total = row.totalAttempts ?? 0;
        return {
            topicId: row.topicId,
            topicName: row.topicName,
            masteryLevel: row.masteryLevel ?? 0,
            targetMastery: DEFAULT_TARGET_MASTERY,
            classAvgMastery: classAvgByTopic.get(row.topicId) ?? 0,
            attempts: total,
            accuracy: total > 0 ? (row.correctAttempts ?? 0) / total : 0,
            lastPracticed: row.lastPracticedAt ?? new Date(0),
            weeklyAccuracy: buckets
                ? buckets.map((b) => (b.total > 0 ? b.correct / b.total : null))
                : Array.from({ length: 7 }, () => null),
            subject: row.subject ?? 'Matematik',
        };
    });
}
