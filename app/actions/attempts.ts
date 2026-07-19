'use server';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { attemptLogs, questions, userMastery } from '@/db/schema';
import { questionAttempts, studySessions } from '@/db/dashboard-schema';
import { and, eq } from 'drizzle-orm';
import { applyMasteryUpdate, type BktQuestionKind } from '@/lib/study/mastery';
import { emitLearningEvent } from '@/lib/events/emit';
import { gradeAnswer } from '@/lib/math/cas-grader';
import { fadePhase } from '@/lib/math/fade-logic';
import { z } from 'zod';

export interface SubmitAttemptInput {
    attemptId: string;
    sessionId: string | null;
    questionId: string;
    topicId: string;
    /** Which input component produced the answer, e.g. 'multiple_choice', 'fill_blank' */
    answerMode: string;
    rawAnswer: string;
    timeTakenMs: number;
    attemptNumber: number;
    hintsUsed: number;
    helpLevelReached: number;
    errorType?: string;
    confidenceRating?: number;
}

export interface SubmitAttemptResult {
    isCorrect: boolean;
    newMastery: number;
    fadePhase: 1 | 2 | 3 | 4;
    phaseChanged: boolean;
}

const submitAttemptSchema = z.object({
    attemptId: z.string().uuid(),
    sessionId: z.string().uuid().nullable(),
    questionId: z.string().uuid(),
    topicId: z.string().uuid(),
    answerMode: z.string().regex(/^[a-z0-9_-]{1,64}$/),
    rawAnswer: z.string().min(1).max(1000),
    timeTakenMs: z.number().int().min(0).max(24 * 60 * 60 * 1000),
    attemptNumber: z.number().int().min(1).max(100),
    hintsUsed: z.number().int().min(0).max(20),
    helpLevelReached: z.number().int().min(0).max(5),
    errorType: z.string().max(64).optional(),
    confidenceRating: z.number().int().min(1).max(5).optional(),
}).strict();

async function gradeQuestion(questionType: string, studentAnswer: string, correctAnswer: string): Promise<boolean> {
    if (questionType === 'multiple_choice' || questionType === 'toggle') {
        const normalize = (value: string) => value.normalize('NFC').trim().toLocaleLowerCase('en-US');
        return normalize(studentAnswer) === normalize(correctAnswer);
    }
    return (await gradeAnswer(studentAnswer, correctAnswer)).isCorrect;
}

/** BKT guess/slip parameters differ by how gameable the input type is. */
function bktKindFor(answerMode: string): BktQuestionKind | undefined {
    switch (answerMode) {
        case 'multiple_choice':
        case 'toggle':
            return 'multiple_choice';
        case 'numeric_input':
        case 'fill_blank':
            return 'numeric';
        default:
            return undefined;
    }
}

/**
 * Persist one answered question from the study flow: attempt_logs (canonical
 * log) + question_attempts (dashboard read-model), mastery via the single
 * write path, and the answer_submitted / question_completed events.
 */
export async function submitAttempt(input: SubmitAttemptInput): Promise<SubmitAttemptResult> {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }
    const userId = session.user.id;
    const parsed = submitAttemptSchema.safeParse(input);
    if (!parsed.success) throw new Error('Invalid attempt');
    input = parsed.data;

    const duplicate = await db
        .select({ id: attemptLogs.id, isCorrect: attemptLogs.isCorrect })
        .from(attemptLogs)
        .where(and(eq(attemptLogs.id, input.attemptId), eq(attemptLogs.userId, userId)))
        .limit(1)
        .get();
    if (duplicate) {
        const current = await db
            .select({ masteryProbability: userMastery.masteryProbability })
            .from(userMastery)
            .where(and(eq(userMastery.userId, userId), eq(userMastery.topicId, input.topicId)))
            .limit(1)
            .get();
        const probability = current?.masteryProbability ?? 0.1;
        return {
            isCorrect: duplicate.isCorrect,
            newMastery: probability,
            fadePhase: fadePhase(probability),
            phaseChanged: false,
        };
    }

    if (input.sessionId) {
        const ownedSession = await db
            .select({ id: studySessions.id })
            .from(studySessions)
            .where(and(eq(studySessions.id, input.sessionId), eq(studySessions.userId, userId)))
            .limit(1)
            .get();
        if (!ownedSession) throw new Error('Study session not found');
    }

    const question = await db
        .select({
            id: questions.id,
            topicId: questions.topicId,
            difficultyTier: questions.difficultyTier,
            questionType: questions.questionType,
            correctAnswer: questions.correctAnswer,
            isPublished: questions.isPublished,
        })
        .from(questions)
        .where(eq(questions.id, input.questionId))
        .get();

    if (!question || question.topicId !== input.topicId || (!question.isPublished && session.user.role === 'student')) {
        throw new Error('Question not found');
    }

    const rawAnswer = input.rawAnswer.slice(0, 1000);
    const isCorrect = await gradeQuestion(question.questionType, rawAnswer, question.correctAnswer);
    const now = new Date();

    await db.insert(attemptLogs).values({
        id: input.attemptId,
        userId,
        questionId: input.questionId,
        isCorrect,
        timeTakenMs: input.timeTakenMs,
        studentAnswerRaw: rawAnswer,
        confidenceRating: input.confidenceRating,
        hintsUsed: input.hintsUsed,
        helpLevelReached: input.helpLevelReached,
        sessionId: input.sessionId,
    });

    await db.insert(questionAttempts).values({
        userId,
        sessionId: input.sessionId,
        questionId: input.questionId,
        topicId: input.topicId,
        difficultyLevel: question.difficultyTier ?? 1,
        startedAt: new Date(now.getTime() - Math.max(0, input.timeTakenMs)),
        completedAt: now,
        isCorrect,
        attempts: input.attemptNumber,
        hintsUsed: input.hintsUsed,
        errorType: input.errorType,
    });

    await emitLearningEvent({
        eventType: 'answer_submitted',
        userId,
        sessionId: input.sessionId,
        questionId: input.questionId,
        topicId: input.topicId,
        payload: {
            answerMode: input.answerMode,
            isCorrect,
            rawAnswer,
            timeTakenMs: Math.max(0, input.timeTakenMs),
            attemptNumber: input.attemptNumber,
            hintsUsed: input.hintsUsed,
            helpLevelReached: input.helpLevelReached,
        },
    });

    const mastery = await applyMasteryUpdate({
        userId,
        topicId: input.topicId,
        isCorrect,
        cause: isCorrect ? 'attempt_correct' : 'attempt_incorrect',
        questionKind: bktKindFor(input.answerMode),
        sessionId: input.sessionId,
        questionId: input.questionId,
    });

    if (isCorrect) {
        await emitLearningEvent({
            eventType: 'question_completed',
            userId,
            sessionId: input.sessionId,
            questionId: input.questionId,
            topicId: input.topicId,
            payload: {
                isCorrect: true,
                totalAttempts: input.attemptNumber,
                hintsUsed: input.hintsUsed,
                helpLevelReached: input.helpLevelReached,
                timeTakenMs: Math.max(0, input.timeTakenMs),
                hadSteps: false,
            },
        });
    }

    return {
        isCorrect,
        newMastery: mastery.newMastery,
        fadePhase: mastery.newPhase,
        phaseChanged: mastery.phaseChanged,
    };
}
