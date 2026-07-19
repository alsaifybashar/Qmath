'use server';

import { db } from '@/db/drizzle';
import { topics } from '@/db/schema';
import { studySessions } from '@/db/dashboard-schema';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { emitLearningEvent } from '@/lib/events/emit';

export interface SessionSummary {
    questionsAnswered: number;
    correct: number;
    incorrect: number;
    skipped: number;
    xpEarned: number;
}

/**
 * Create a real study_sessions row for a study run and emit study_session_started.
 * Returns the sessionId that all subsequent attempt/hint/step events reference.
 */
export async function startStudySession(topicId?: string): Promise<{ sessionId: string }> {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');
    const user = { id: session.user.id };

    let courseId: string | null = null;
    if (topicId) {
        const [topic] = await db
            .select({ courseId: topics.courseId })
            .from(topics)
            .where(eq(topics.id, topicId))
            .limit(1);
        courseId = topic?.courseId ?? null;
    }

    const [created] = await db
        .insert(studySessions)
        .values({
            userId: user.id,
            courseId,
            topicId: topicId ?? null,
            startedAt: new Date(),
            sessionType: 'free',
            source: 'study',
        })
        .returning({ id: studySessions.id });

    await emitLearningEvent({
        eventType: 'study_session_started',
        userId: user.id,
        sessionId: created.id,
        topicId,
        payload: { sessionType: 'free', source: 'study' },
    });

    return { sessionId: created.id };
}

/**
 * Close a study session (idempotent: already-ended sessions are left as-is)
 * and emit study_session_ended with the session summary.
 */
export async function endStudySession(sessionId: string, summary: SessionSummary): Promise<void> {
    const session = await auth();
    if (!session?.user?.id) return;
    const user = { id: session.user.id };

    const [row] = await db
        .select({ startedAt: studySessions.startedAt, endedAt: studySessions.endedAt, topicId: studySessions.topicId })
        .from(studySessions)
        .where(and(eq(studySessions.id, sessionId), eq(studySessions.userId, user.id)))
        .limit(1);

    if (!row || row.endedAt) {
        return;
    }

    const endedAt = new Date();
    await db
        .update(studySessions)
        .set({ endedAt })
        .where(eq(studySessions.id, sessionId));

    await emitLearningEvent({
        eventType: 'study_session_ended',
        userId: user.id,
        sessionId,
        topicId: row.topicId,
        payload: {
            durationMs: Math.max(0, endedAt.getTime() - row.startedAt.getTime()),
            questionsAnswered: summary.questionsAnswered,
            correct: summary.correct,
            incorrect: summary.incorrect,
            skipped: summary.skipped,
            xpEarned: summary.xpEarned,
        },
    });
}
