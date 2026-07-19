import { z } from 'zod';

/**
 * Learning-event vocabulary for the fading-steps flow.
 *
 * Every event lands as one append-only row in `learning_events`.
 * Payload shapes are versioned: bump `eventVersion` and extend the Zod
 * schema when a payload changes shape — never mutate v1 semantics.
 */

export const LEARNING_EVENT_TYPES = [
    'study_session_started',
    'study_session_ended',
    'answer_submitted',
    'hint_requested',
    'step_revealed',
    'mastery_updated',
    'question_completed',
] as const;

export type LearningEventType = (typeof LEARNING_EVENT_TYPES)[number];

const fadePhase = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);

export const sessionStartedPayload = z.object({
    sessionType: z.enum(['pomodoro', 'free', 'exam_sim']),
    source: z.string(), // which surface started the session, e.g. 'study'
});

export const sessionEndedPayload = z.object({
    durationMs: z.number().int().nonnegative(),
    questionsAnswered: z.number().int().nonnegative(),
    correct: z.number().int().nonnegative(),
    incorrect: z.number().int().nonnegative(),
    skipped: z.number().int().nonnegative(),
    xpEarned: z.number().int().nonnegative(),
});

export const answerSubmittedPayload = z.object({
    answerMode: z.string(), // 'step' | 'multiple_choice' | 'fill_blank' | ...
    isCorrect: z.boolean(),
    rawAnswer: z.string(),
    timeTakenMs: z.number().int().nonnegative().optional(),
    attemptNumber: z.number().int().positive().optional(),
    hintsUsed: z.number().int().nonnegative().optional(),
    helpLevelReached: z.number().int().min(0).max(5).optional(),
});

export const hintRequestedPayload = z.object({
    level: z.number().int().min(1).max(5),
    trigger: z.enum(['idle', 'manual', 'wrong_answer', 'ladder']),
});

export const stepRevealedPayload = z.object({
    stepNumber: z.number().int().positive(),
    trigger: z.enum(['fade_phase', 'ladder', 'wrong_answer']),
    fadePhase: fadePhase,
});

export const masteryUpdatedPayload = z.object({
    previousMastery: z.number().min(0).max(1),
    newMastery: z.number().min(0).max(1),
    previousPhase: fadePhase,
    newPhase: fadePhase,
    phaseChanged: z.boolean(),
    cause: z.enum(['step_correct', 'step_incorrect', 'attempt_correct', 'attempt_incorrect']),
});

export const questionCompletedPayload = z.object({
    isCorrect: z.boolean(),
    totalAttempts: z.number().int().positive(),
    hintsUsed: z.number().int().nonnegative(),
    helpLevelReached: z.number().int().min(0).max(5),
    timeTakenMs: z.number().int().nonnegative().optional(),
    hadSteps: z.boolean(),
});

const base = z.object({
    userId: z.string().min(1),
    sessionId: z.string().nullish(),
    questionId: z.string().nullish(),
    topicId: z.string().nullish(),
    stepId: z.string().nullish(),
});

export const learningEventSchema = z.discriminatedUnion('eventType', [
    base.extend({ eventType: z.literal('study_session_started'), payload: sessionStartedPayload }),
    base.extend({ eventType: z.literal('study_session_ended'), payload: sessionEndedPayload }),
    base.extend({ eventType: z.literal('answer_submitted'), payload: answerSubmittedPayload }),
    base.extend({ eventType: z.literal('hint_requested'), payload: hintRequestedPayload }),
    base.extend({ eventType: z.literal('step_revealed'), payload: stepRevealedPayload }),
    base.extend({ eventType: z.literal('mastery_updated'), payload: masteryUpdatedPayload }),
    base.extend({ eventType: z.literal('question_completed'), payload: questionCompletedPayload }),
]);

export type LearningEvent = z.infer<typeof learningEventSchema>;

/** Current payload version per event type. Bump alongside schema changes. */
export const EVENT_VERSIONS: Record<LearningEventType, number> = {
    study_session_started: 1,
    study_session_ended: 1,
    answer_submitted: 1,
    hint_requested: 1,
    step_revealed: 1,
    mastery_updated: 1,
    question_completed: 1,
};
