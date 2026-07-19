import { db } from '@/db/drizzle';
import { questionSteps } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { preParseInput } from '@/lib/math/pre-parser';
import { gradeAnswer } from '@/lib/math/cas-grader';
import { runFeedbackTree } from '@/lib/math/feedback-tree';
import { getRevealedSteps } from '@/lib/math/fade-logic';
import { applyMasteryUpdate } from '@/lib/study/mastery';
import { emitLearningEvent } from '@/lib/events/emit';

export interface CheckStepInput {
    stepId: string;
    questionId: string;
    topicId: string;
    studentInput: string;
    sessionId?: string | null;
}

export type CheckStepResult =
    | { ok: false; status: 400 | 404; error: string }
    | {
        ok: true;
        isCorrect: boolean;
        parsedStudent: string;
        feedback?: string;
        newMastery: number;
        fadePhase: 1 | 2 | 3 | 4;
        phaseChanged: boolean;
        revealedSteps: Array<{
            id: string;
            stepNumber: number;
            instruction: string;
            displayLatex: string | null;
            hint: string | null;
            hintNudge: string | null;
            hintGuided: string | null;
            explanation: string | null;
            questionType: string | null;
            revealed: boolean;
        }>;
    };

/**
 * Server-authoritative fading-step grading: CAS grade → misconception feedback
 * → BKT mastery update → recompute revealed steps at the new mastery.
 *
 * The correct answer is fetched from the DB and never included in the result.
 * Called by both POST /api/check-step and the checkStep server action —
 * auth and rate limiting are the caller's responsibility.
 */
export async function checkStepCore(userId: string, input: CheckStepInput): Promise<CheckStepResult> {
    const { stepId, questionId, topicId, studentInput, sessionId } = input;

    if (
        typeof stepId !== 'string' || !stepId.trim() ||
        typeof questionId !== 'string' || !questionId.trim() ||
        typeof topicId !== 'string' || !topicId.trim() ||
        typeof studentInput !== 'string' || !studentInput.trim()
    ) {
        return { ok: false, status: 400, error: 'Missing or invalid required fields' };
    }

    if (studentInput.length > 1000) {
        return { ok: false, status: 400, error: 'Inmatningen är för lång (max 1000 tecken).' };
    }

    // Fetch correctAnswer from DB (never from client)
    const step = await db.select().from(questionSteps).where(eq(questionSteps.id, stepId)).get();
    if (!step || step.questionId !== questionId) {
        return { ok: false, status: 404, error: 'Step not found' };
    }

    const parsed = preParseInput(studentInput);
    const gradeResult = await gradeAnswer(parsed, step.correctAnswer);
    const { isCorrect } = gradeResult;

    let feedback: string | undefined;
    if (!isCorrect) {
        const result = await runFeedbackTree(studentInput, step.correctAnswer, {
            questionType: (step.questionType as never) ?? 'algebra',
        });
        feedback = result?.message;
    }

    await emitLearningEvent({
        eventType: 'answer_submitted',
        userId,
        sessionId,
        questionId,
        topicId,
        stepId,
        payload: { answerMode: 'step', isCorrect, rawAnswer: studentInput },
    });

    const mastery = await applyMasteryUpdate({
        userId,
        topicId,
        isCorrect,
        cause: isCorrect ? 'step_correct' : 'step_incorrect',
        sessionId,
        questionId,
    });

    // Recompute revealed steps at the new mastery (correctAnswer stripped)
    const allSteps = await db.select({
        id: questionSteps.id,
        stepNumber: questionSteps.stepNumber,
        instruction: questionSteps.instruction,
        displayLatex: questionSteps.displayLatex,
        hint: questionSteps.hint,
        hintNudge: questionSteps.hintNudge,
        hintGuided: questionSteps.hintGuided,
        explanation: questionSteps.explanation,
        questionType: questionSteps.questionType,
    }).from(questionSteps).where(eq(questionSteps.questionId, questionId));

    const sorted = allSteps.sort((a, b) => a.stepNumber - b.stepNumber);
    const revealedSteps = getRevealedSteps(sorted, mastery.newMastery);

    return {
        ok: true,
        isCorrect,
        parsedStudent: parsed,
        feedback,
        newMastery: mastery.newMastery,
        fadePhase: mastery.newPhase,
        phaseChanged: mastery.phaseChanged,
        revealedSteps,
    };
}
