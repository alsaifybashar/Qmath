import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    learningEventSchema,
    LEARNING_EVENT_TYPES,
    EVENT_VERSIONS,
    type LearningEvent,
} from '@/lib/events/types';

const insertedValues: unknown[] = [];

vi.mock('@/db/drizzle', () => ({
    db: {
        insert: vi.fn(() => ({
            values: vi.fn(async (v: unknown) => {
                insertedValues.push(v);
            }),
        })),
    },
}));

import { emitLearningEvent } from '@/lib/events/emit';

const validEvents: LearningEvent[] = [
    {
        eventType: 'study_session_started',
        userId: 'u1',
        sessionId: 's1',
        topicId: 't1',
        payload: { sessionType: 'free', source: 'study' },
    },
    {
        eventType: 'study_session_ended',
        userId: 'u1',
        sessionId: 's1',
        payload: { durationMs: 60000, questionsAnswered: 5, correct: 3, incorrect: 1, skipped: 1, xpEarned: 30 },
    },
    {
        eventType: 'answer_submitted',
        userId: 'u1',
        sessionId: 's1',
        questionId: 'q1',
        topicId: 't1',
        payload: { answerMode: 'step', isCorrect: true, rawAnswer: '2x', hintsUsed: 1, helpLevelReached: 2 },
    },
    {
        eventType: 'hint_requested',
        userId: 'u1',
        questionId: 'q1',
        payload: { level: 1, trigger: 'idle' },
    },
    {
        eventType: 'step_revealed',
        userId: 'u1',
        questionId: 'q1',
        stepId: 'st1',
        payload: { stepNumber: 2, trigger: 'ladder', fadePhase: 3 },
    },
    {
        eventType: 'mastery_updated',
        userId: 'u1',
        topicId: 't1',
        payload: {
            previousMastery: 0.4,
            newMastery: 0.58,
            previousPhase: 2,
            newPhase: 3,
            phaseChanged: true,
            cause: 'step_correct',
        },
    },
    {
        eventType: 'question_completed',
        userId: 'u1',
        sessionId: 's1',
        questionId: 'q1',
        payload: { isCorrect: true, totalAttempts: 2, hintsUsed: 1, helpLevelReached: 2, hadSteps: true },
    },
];

describe('learning event schemas', () => {
    it('covers every event type in the vocabulary', () => {
        const covered = new Set(validEvents.map((e) => e.eventType));
        for (const type of LEARNING_EVENT_TYPES) {
            expect(covered.has(type)).toBe(true);
            expect(EVENT_VERSIONS[type]).toBeGreaterThanOrEqual(1);
        }
    });

    it('round-trips every valid event', () => {
        for (const event of validEvents) {
            expect(learningEventSchema.parse(event)).toEqual(event);
        }
    });

    it('rejects a payload that does not match the event type', () => {
        const result = learningEventSchema.safeParse({
            eventType: 'hint_requested',
            userId: 'u1',
            payload: { stepNumber: 2, trigger: 'ladder', fadePhase: 3 },
        });
        expect(result.success).toBe(false);
    });

    it('rejects out-of-range values', () => {
        const result = learningEventSchema.safeParse({
            eventType: 'mastery_updated',
            userId: 'u1',
            payload: {
                previousMastery: 1.4,
                newMastery: 0.5,
                previousPhase: 2,
                newPhase: 3,
                phaseChanged: true,
                cause: 'step_correct',
            },
        });
        expect(result.success).toBe(false);
    });
});

describe('emitLearningEvent', () => {
    beforeEach(() => {
        insertedValues.length = 0;
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('inserts a validated row with the current event version', async () => {
        await emitLearningEvent(validEvents[2]);
        expect(insertedValues).toHaveLength(1);
        expect(insertedValues[0]).toMatchObject({
            userId: 'u1',
            sessionId: 's1',
            eventType: 'answer_submitted',
            eventVersion: EVENT_VERSIONS.answer_submitted,
            questionId: 'q1',
        });
    });

    it('normalizes missing optional references to null', async () => {
        await emitLearningEvent(validEvents[3]);
        expect(insertedValues[0]).toMatchObject({ sessionId: null, topicId: null, stepId: null });
    });

    it('swallows validation failures instead of throwing', async () => {
        await expect(
            emitLearningEvent({
                eventType: 'hint_requested',
                userId: '',
                payload: { level: 99, trigger: 'idle' },
            } as never),
        ).resolves.toBeUndefined();
        expect(insertedValues).toHaveLength(0);
        expect(console.error).toHaveBeenCalled();
    });
});
