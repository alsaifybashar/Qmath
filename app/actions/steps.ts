'use server';

import { auth } from '@/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { checkStepCore, type CheckStepInput, type CheckStepResult } from '@/lib/study/check-step-core';
import { emitLearningEvent } from '@/lib/events/emit';

export type CheckStepActionResult =
    | CheckStepResult
    | { ok: false; status: 429; error: string };

/**
 * Server action wrapper around the fading-step grading core.
 * Same pipeline as POST /api/check-step; server actions are the app's
 * dominant calling convention so new UI goes through here.
 */
export async function checkStep(input: CheckStepInput): Promise<CheckStepActionResult> {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    const { allowed } = await checkRateLimit(session.user.id, 'grading');
    if (!allowed) {
        return { ok: false, status: 429, error: 'För många förfrågningar. Vänta en stund.' };
    }

    return checkStepCore(session.user.id, input);
}

/**
 * Telemetry: a hidden step was revealed to the student (assistance ladder or
 * wrong-answer escalation, as opposed to fade-phase prefills at load).
 */
/**
 * Telemetry: the student finished every remaining step of a fading-step
 * question. Step-level correctness was already recorded by checkStep.
 */
export async function recordQuestionCompleted(input: {
    sessionId?: string | null;
    questionId: string;
    topicId: string;
    totalAttempts: number;
    helpLevelReached: number;
}): Promise<void> {
    const session = await auth();
    if (!session?.user?.id) return;

    await emitLearningEvent({
        eventType: 'question_completed',
        userId: session.user.id,
        sessionId: input.sessionId,
        questionId: input.questionId,
        topicId: input.topicId,
        payload: {
            isCorrect: true,
            totalAttempts: input.totalAttempts,
            hintsUsed: 0,
            helpLevelReached: Math.min(5, Math.max(0, input.helpLevelReached)),
            hadSteps: true,
        },
    });
}

export async function recordStepRevealed(input: {
    sessionId?: string | null;
    questionId: string;
    topicId: string;
    stepId: string;
    stepNumber: number;
    trigger: 'ladder' | 'wrong_answer';
    fadePhase: 1 | 2 | 3 | 4;
}): Promise<void> {
    const session = await auth();
    if (!session?.user?.id) return;

    await emitLearningEvent({
        eventType: 'step_revealed',
        userId: session.user.id,
        sessionId: input.sessionId,
        questionId: input.questionId,
        topicId: input.topicId,
        stepId: input.stepId,
        payload: { stepNumber: input.stepNumber, trigger: input.trigger, fadePhase: input.fadePhase },
    });
}
