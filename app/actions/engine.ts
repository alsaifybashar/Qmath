
'use server';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { attemptLogs, userMastery } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function submitAnswer(questionId: string, isCorrect: boolean, timeTakenMs: number) {
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

            let newProbability = currentMasteryRecord ? parseFloat(currentMasteryRecord.masteryProbability as string) : 0.1;

            // Simple update rule (Upgrade if correct, Downgrade if wrong)
            // Real BKT is more complex (P(L|Obs) ...)
            if (isCorrect) {
                newProbability = Math.min(0.99, newProbability + 0.1);
            } else {
                newProbability = Math.max(0.01, newProbability - 0.05);
            }

            if (currentMasteryRecord) {
                await db.update(userMastery)
                    .set({
                        masteryProbability: newProbability.toString(),
                        lastPracticedAt: new Date()
                    })
                    .where(eq(userMastery.id, currentMasteryRecord.id));
            } else {
                await db.insert(userMastery).values({
                    userId: session.user.id,
                    topicId: topicId,
                    masteryProbability: newProbability.toString(),
                    lastPracticedAt: new Date(),
                });
            }
        }

        return { success: true };
    } catch (error) {
        console.error('Failed to submit answer:', error);
        return { error: 'Failed to record progress' };
    }
}
