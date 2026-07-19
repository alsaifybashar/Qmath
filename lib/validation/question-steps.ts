import { z } from 'zod';

/**
 * Validation gate for fading-step questions. Runs when steps are saved and
 * again when a question is moved to 'ready' — nothing reaches students
 * without passing here.
 */

export const stepInputSchema = z.object({
    stepNumber: z.number().int().positive(),
    instruction: z.string().trim().min(1, 'Varje steg behöver en instruktion.'),
    correctAnswer: z.string().trim().min(1, 'Varje steg behöver ett facit-svar.'),
    displayLatex: z.string().trim().max(2000).nullish(),
    explanation: z.string().trim().max(4000).nullish(),
    hintNudge: z.string().trim().max(1000).nullish(),
    hintGuided: z.string().trim().max(2000).nullish(),
    misconceptionId: z.string().trim().nullish(),
    questionType: z.string().trim().default('algebra'),
});

export type StepInput = z.infer<typeof stepInputSchema>;

export const questionStepsSchema = z
    .array(stepInputSchema)
    .max(20, 'Max 20 steg per uppgift.')
    .refine(
        (steps) => steps.every((s, i) => s.stepNumber === i + 1),
        'Stegen måste vara numrerade 1, 2, 3 … utan luckor.',
    )
    .refine(
        (steps) => steps.length === 0 || steps.some((s) => s.hintNudge || s.hintGuided),
        'Minst ett steg behöver en ledtråd (knuff eller guidad).',
    );

/**
 * Question-level gate for the draft → ready transition.
 * Returns a list of human-readable problems; empty = pass.
 */
export function validateReadyGate(input: {
    steps: StepInput[];
    workedExampleMarkdown: string | null;
}): string[] {
    const problems: string[] = [];

    if (input.steps.length > 0) {
        const parsed = questionStepsSchema.safeParse(input.steps);
        if (!parsed.success) {
            problems.push(...parsed.error.issues.map((i) => i.message));
        }
        if (!input.workedExampleMarkdown?.trim()) {
            problems.push('Uppgifter med tonande steg behöver en genomgång (worked example) för hjälpstegen.');
        }
    }

    return [...new Set(problems)];
}
