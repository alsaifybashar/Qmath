import { describe, expect, it } from 'vitest';
import {
    normalizeAnswerMode,
    serializeStudentAnswer,
    validateStudentAnswer,
} from '@/lib/study/answer-validation';

describe('answer-validation', () => {
    it('maps legacy free_response questions to rich_math_text', () => {
        expect(normalizeAnswerMode({ type: 'free_response' })).toBe('rich_math_text');
    });

    it('maps free_form_symbolic questions to symbolic_input', () => {
        expect(normalizeAnswerMode({ type: 'free_form_symbolic' })).toBe('symbolic_input');
    });

    it('grades symbolic input using accepted equivalent forms', () => {
        const question = {
            type: 'symbolic_input',
            gradingConfig: {
                exact: '(s+1)/(s^2+4)',
                acceptedForms: ['(s + 1)*(s^2 + 4)^(-1)'],
            },
        };

        expect(validateStudentAnswer(question, '(s + 1)*(s^2 + 4)^(-1)', '(s+1)/(s^2+4)')).toBe(true);
    });

    it('validates matrix grid answers cell-by-cell', () => {
        const question = {
            type: 'matrix_grid',
            gradingConfig: {
                expectedValues: [
                    ['1', '0'],
                    ['0', '1'],
                ],
                requireExactDimensions: true,
            },
        };

        const answer = {
            mode: 'matrix_grid' as const,
            rows: 2,
            cols: 2,
            values: [
                ['1', '0'],
                ['0', '1'],
            ],
        };

        expect(validateStudentAnswer(question, answer, null)).toBe(true);
    });

    it('rejects solution steps when an intermediate line is wrong', () => {
        const question = {
            type: 'solution_steps',
            gradingConfig: {
                steps: [
                    { id: '1', prompt: 'Expand', expectedAnswer: '2x + 2' },
                    { id: '2', prompt: 'Factor', expectedAnswer: '2(x + 1)' },
                ],
                requireAllSteps: true,
            },
        };

        const answer = {
            mode: 'solution_steps' as const,
            lines: [
                { id: 'line-1', value: '2x + 3' },
                { id: 'line-2', value: '2(x + 1)' },
            ],
            finalAnswer: '2(x + 1)',
        };

        expect(validateStudentAnswer(question, answer, null)).toBe(false);
    });

    it('grades rich math text from the final answer field', () => {
        const question = {
            type: 'rich_math_text',
            gradingConfig: {
                finalAnswer: '1/2',
                acceptedForms: ['0.5'],
            },
        };

        const answer = {
            mode: 'rich_math_text' as const,
            content: 'Using the power rule, we get ...',
            finalAnswer: '0.5',
        };

        expect(validateStudentAnswer(question, answer, '1/2')).toBe(true);
    });

    it('serializes structured answers into readable strings for telemetry', () => {
        const answer = {
            mode: 'solution_steps' as const,
            lines: [
                { id: '1', value: 'A = B' },
                { id: '2', value: 'B = C' },
            ],
            finalAnswer: 'C',
        };

        expect(serializeStudentAnswer(answer)).toBe('A = B => B = C');
    });
});
