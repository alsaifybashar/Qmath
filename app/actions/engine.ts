
'use server';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { attemptLogs, userMastery } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function submitAnswer(questionId: string, isCorrect: boolean, timeTakenMs: number, hintsUsed: number = 0) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'Not authenticated' };
    }

    try {
        // 1. Log the attempt
        await db.insert(attemptLogs).values({
            userId: session.user.id,
            questionId: questionId,
            isCorrect,
            timeTakenMs,
        });

        // 2. Update Mastery (Simplified BKT logic for now)
        // In a real implementation, we would fetch the topicId from the questionId first
        // For this stub, we assume we have topicId or would query it.

        // Fetch question to get topicId
        const question = await db.query.questions.findFirst({
            where: (questions, { eq }) => eq(questions.id, questionId),
            with: {
                topic: true
            }
        });

        if (question) {
            const topicId = question.topicId;

            // Fetch current mastery
            const currentMasteryRecord = await db.query.userMastery.findFirst({
                where: and(
                    eq(userMastery.userId, session.user.id),
                    eq(userMastery.topicId, topicId)
                )
            });

            let newProbability = currentMasteryRecord?.masteryProbability ?? 0.1;

            // BKT-inspired update with hint penalty
            // Base gain: +0.10 for correct, -0.05 for wrong
            // Hint penalty: each hint used reduces gain by 0.02
            // (per ADAPTIVE_ENGINE_LOGIC.md: "Hint Penalty: Using hints reduces the mastery gain")
            if (isCorrect) {
                const hintPenalty = Math.min(hintsUsed * 0.02, 0.08); // Cap penalty at 0.08
                const gain = Math.max(0.02, 0.10 - hintPenalty); // Min gain of 0.02
                newProbability = Math.min(0.99, newProbability + gain);
                console.log(`[Engine] Correct: +${gain.toFixed(3)} mastery (${hintsUsed} hints used, penalty: -${hintPenalty.toFixed(3)})`);
            } else {
                newProbability = Math.max(0.01, newProbability - 0.05);
            }

            if (currentMasteryRecord) {
                await db.update(userMastery)
                    .set({
                        masteryProbability: newProbability,
                        lastPracticedAt: new Date()
                    })
                    .where(eq(userMastery.id, currentMasteryRecord.id));
            } else {
                await db.insert(userMastery).values({
                    userId: session.user.id,
                    topicId: topicId,
                    masteryProbability: newProbability,
                    lastPracticedAt: new Date(),
                });
            }
        }

        // Phase 5: Update spaced repetition schedule (async, non-blocking)
        if (question?.topicId) {
            import('@/app/actions/notification-engine')
                .then(({ updateReviewSchedule }) => updateReviewSchedule(question.topicId, isCorrect))
                .catch(err => console.warn('[Engine] Spaced repetition update failed:', err));
        }

        return { success: true };
    } catch (error) {
        console.error('Failed to submit answer:', error);
        return { error: 'Failed to record progress' };
    }
}
