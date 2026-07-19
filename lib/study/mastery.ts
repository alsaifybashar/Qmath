import { db } from '@/db/drizzle';
import { userMastery } from '@/db/schema';
import { userTopicMastery } from '@/db/dashboard-schema';
import { and, eq } from 'drizzle-orm';
import { BayesianKnowledgeTracing } from '@/lib/adaptive-engine/knowledge-tracing';
import { fadePhase } from '@/lib/math/fade-logic';
import { emitLearningEvent } from '@/lib/events/emit';

export interface MasteryUpdate {
    previousMastery: number;
    newMastery: number;
    previousPhase: 1 | 2 | 3 | 4;
    newPhase: 1 | 2 | 3 | 4;
    phaseChanged: boolean;
}

export type BktQuestionKind = 'multiple_choice' | 'numeric' | 'proof_step';

/** Map masteryProbability [0,1] onto userTopicMastery's 0–5 gamified levels. */
export function masteryLevelFromProbability(p: number): number {
    if (p >= 0.95) return 5;
    if (p >= 0.75) return 4;
    if (p >= 0.55) return 3;
    if (p >= 0.35) return 2;
    if (p > 0.1) return 1;
    return 0;
}

/**
 * The single write path for mastery. Runs BKT, upserts the canonical
 * `user_mastery` row, dual-writes the `user_topic_mastery` read-model the
 * dashboard consumes, and emits mastery_updated. Both check-step grading and
 * submitAttempt go through here — nothing else may write mastery.
 */
export async function applyMasteryUpdate(input: {
    userId: string;
    topicId: string;
    isCorrect: boolean;
    cause: 'step_correct' | 'step_incorrect' | 'attempt_correct' | 'attempt_incorrect';
    questionKind?: BktQuestionKind;
    sessionId?: string | null;
    questionId?: string | null;
}): Promise<MasteryUpdate> {
    const { userId, topicId, isCorrect } = input;

    const base = new BayesianKnowledgeTracing();
    const bkt = input.questionKind
        ? new BayesianKnowledgeTracing(base.adjustForQuestionType(input.questionKind))
        : base;

    // The canonical mastery record and dashboard read-model are updated in one
    // async libSQL transaction so serverless instances cannot observe a partial write.
    const update = await db.transaction(async (tx): Promise<MasteryUpdate> => {
        const existing = await tx
            .select()
            .from(userMastery)
            .where(and(eq(userMastery.userId, userId), eq(userMastery.topicId, topicId)))
            .get();

        const previousMastery = existing?.masteryProbability ?? 0.1;
        const newMastery = bkt.updateMastery(previousMastery, isCorrect);
        const now = new Date();

        if (existing) {
            await tx.update(userMastery)
                .set({ masteryProbability: newMastery, lastPracticedAt: now })
                .where(and(eq(userMastery.userId, userId), eq(userMastery.topicId, topicId)))
                .run();
        } else {
            await tx.insert(userMastery).values({
                userId,
                topicId,
                masteryProbability: newMastery,
                lastPracticedAt: now,
            }).run();
        }

        const existingTopic = await tx
            .select()
            .from(userTopicMastery)
            .where(and(eq(userTopicMastery.userId, userId), eq(userTopicMastery.topicId, topicId)))
            .get();

        if (existingTopic) {
            await tx.update(userTopicMastery)
                .set({
                    masteryLevel: masteryLevelFromProbability(newMastery),
                    totalAttempts: (existingTopic.totalAttempts ?? 0) + 1,
                    correctAttempts: (existingTopic.correctAttempts ?? 0) + (isCorrect ? 1 : 0),
                    consecutiveCorrect: isCorrect ? (existingTopic.consecutiveCorrect ?? 0) + 1 : 0,
                    lastPracticedAt: now,
                    updatedAt: now,
                })
                .where(and(eq(userTopicMastery.userId, userId), eq(userTopicMastery.topicId, topicId)))
                .run();
        } else {
            await tx.insert(userTopicMastery).values({
                userId,
                topicId,
                masteryLevel: masteryLevelFromProbability(newMastery),
                totalAttempts: 1,
                correctAttempts: isCorrect ? 1 : 0,
                consecutiveCorrect: isCorrect ? 1 : 0,
                lastPracticedAt: now,
            }).run();
        }

        const previousPhase = fadePhase(previousMastery);
        const newPhase = fadePhase(newMastery);
        return {
            previousMastery,
            newMastery,
            previousPhase,
            newPhase,
            phaseChanged: previousPhase !== newPhase,
        };
    });

    await emitLearningEvent({
        eventType: 'mastery_updated',
        userId,
        sessionId: input.sessionId,
        questionId: input.questionId,
        topicId,
        payload: { ...update, cause: input.cause },
    });

    return update;
}
