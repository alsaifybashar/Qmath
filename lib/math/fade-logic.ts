// Types for question steps (client-safe - no correctAnswer)
export interface QuestionStep {
    id: string;
    stepNumber: number;
    instruction: string;
    displayLatex: string | null;
    hint: string | null;
    questionType: string | null;
}

export interface RevealedStep extends QuestionStep {
    revealed: boolean;
}

// Returns 1 | 2 | 3 | 4
export function fadePhase(mastery: number): 1 | 2 | 3 | 4 {
    if (mastery < 0.35) return 1;
    if (mastery < 0.55) return 2;
    if (mastery < 0.75) return 3;
    return 4;
}

// Core fade function - pure, no side effects
export function getRevealedSteps(steps: QuestionStep[], mastery: number): RevealedStep[] {
    const n = steps.length;
    const revealCount =
        mastery < 0.35 ? n :
        mastery < 0.55 ? Math.ceil(n * 0.66) :
        mastery < 0.75 ? Math.ceil(n * 0.33) : 0;
    return steps.map((s, i) => ({ ...s, revealed: i < revealCount }));
}
