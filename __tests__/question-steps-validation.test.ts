import { describe, it, expect } from 'vitest';
import { questionStepsSchema, validateReadyGate, type StepInput } from '@/lib/validation/question-steps';

const step = (n: number, extra: Partial<StepInput> = {}): StepInput => ({
    stepNumber: n,
    instruction: `Steg ${n}`,
    correctAnswer: 'svar',
    questionType: 'algebra',
    hintNudge: n === 1 ? 'En knuff' : null,
    ...extra,
});

describe('questionStepsSchema', () => {
    it('accepts contiguous, hinted steps', () => {
        expect(questionStepsSchema.safeParse([step(1), step(2), step(3)]).success).toBe(true);
    });

    it('rejects gaps in numbering', () => {
        expect(questionStepsSchema.safeParse([step(1), step(3)]).success).toBe(false);
    });

    it('rejects steps without instruction or facit', () => {
        expect(questionStepsSchema.safeParse([step(1, { instruction: '  ' })]).success).toBe(false);
        expect(questionStepsSchema.safeParse([step(1, { correctAnswer: '' })]).success).toBe(false);
    });

    it('requires at least one hint across the steps', () => {
        expect(questionStepsSchema.safeParse([step(1, { hintNudge: null })]).success).toBe(false);
        expect(questionStepsSchema.safeParse([step(1, { hintNudge: null, hintGuided: 'guidad' })]).success).toBe(true);
    });
});

describe('validateReadyGate', () => {
    it('passes step questions with a worked example', () => {
        expect(validateReadyGate({
            steps: [step(1), step(2)],
            workedExampleMarkdown: 'En genomgång.',
        })).toEqual([]);
    });

    it('blocks step questions missing the worked example', () => {
        const problems = validateReadyGate({
            steps: [step(1)],
            workedExampleMarkdown: null,
        });
        expect(problems.some((p) => p.includes('genomgång'))).toBe(true);
    });

    it('lets questions without steps through (non-step questions)', () => {
        expect(validateReadyGate({ steps: [], workedExampleMarkdown: null })).toEqual([]);
    });
});
