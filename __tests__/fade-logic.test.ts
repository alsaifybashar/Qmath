import { describe, it, expect } from 'vitest';
import { fadePhase, getRevealedSteps } from '../lib/math/fade-logic';
import type { QuestionStep } from '../lib/math/fade-logic';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSteps(n: number): QuestionStep[] {
    return Array.from({ length: n }, (_, i) => ({
        id: `step-${i + 1}`,
        stepNumber: i + 1,
        instruction: `Step ${i + 1}`,
        displayLatex: null,
        hint: null,
        questionType: 'algebra',
    }));
}

function revealedIds(steps: ReturnType<typeof getRevealedSteps>): string[] {
    return steps.filter((s) => s.revealed).map((s) => s.id);
}

function hiddenIds(steps: ReturnType<typeof getRevealedSteps>): string[] {
    return steps.filter((s) => !s.revealed).map((s) => s.id);
}

// ---------------------------------------------------------------------------
// fadePhase
// ---------------------------------------------------------------------------

describe('fadePhase()', () => {
    // Phase 1: mastery in [0.00, 0.35)
    it('returns 1 at mastery 0.0 (absolute floor)', () => {
        expect(fadePhase(0.0)).toBe(1);
    });

    it('returns 1 at mastery 0.34 (just below phase-2 boundary)', () => {
        expect(fadePhase(0.34)).toBe(1);
    });

    it('returns 1 at mastery 0.349999 (just below 0.35)', () => {
        expect(fadePhase(0.349999)).toBe(1);
    });

    // Exact boundary at 0.35 → phase 2
    it('returns 2 at mastery exactly 0.35', () => {
        expect(fadePhase(0.35)).toBe(2);
    });

    // Phase 2: mastery in [0.35, 0.55)
    it('returns 2 at mastery 0.45 (mid phase 2)', () => {
        expect(fadePhase(0.45)).toBe(2);
    });

    it('returns 2 at mastery 0.54 (just below phase-3 boundary)', () => {
        expect(fadePhase(0.54)).toBe(2);
    });

    // Exact boundary at 0.55 → phase 3
    it('returns 3 at mastery exactly 0.55', () => {
        expect(fadePhase(0.55)).toBe(3);
    });

    // Phase 3: mastery in [0.55, 0.75)
    it('returns 3 at mastery 0.65 (mid phase 3)', () => {
        expect(fadePhase(0.65)).toBe(3);
    });

    it('returns 3 at mastery 0.74 (just below phase-4 boundary)', () => {
        expect(fadePhase(0.74)).toBe(3);
    });

    // Exact boundary at 0.75 → phase 4
    it('returns 4 at mastery exactly 0.75', () => {
        expect(fadePhase(0.75)).toBe(4);
    });

    // Phase 4: mastery in [0.75, 1.0]
    it('returns 4 at mastery 0.90', () => {
        expect(fadePhase(0.90)).toBe(4);
    });

    it('returns 4 at mastery 1.0 (ceiling)', () => {
        expect(fadePhase(1.0)).toBe(4);
    });
});

// ---------------------------------------------------------------------------
// getRevealedSteps — step count 0
// ---------------------------------------------------------------------------

describe('getRevealedSteps() with 0 steps', () => {
    it('returns empty array regardless of mastery', () => {
        expect(getRevealedSteps([], 0.0)).toEqual([]);
        expect(getRevealedSteps([], 0.5)).toEqual([]);
        expect(getRevealedSteps([], 1.0)).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// getRevealedSteps — step count 1
// ---------------------------------------------------------------------------

describe('getRevealedSteps() with 1 step', () => {
    const steps = makeSteps(1);

    it('phase 1 (0.0): reveals all 1 step', () => {
        const result = getRevealedSteps(steps, 0.0);
        expect(result[0].revealed).toBe(true);
    });

    it('phase 2 (0.35): Math.ceil(1 * 0.66) = 1 → reveals the single step', () => {
        const result = getRevealedSteps(steps, 0.35);
        expect(result[0].revealed).toBe(true);
    });

    it('phase 3 (0.55): Math.ceil(1 * 0.33) = 1 → reveals the single step', () => {
        const result = getRevealedSteps(steps, 0.55);
        expect(result[0].revealed).toBe(true);
    });

    it('phase 4 (0.75): reveals 0 steps', () => {
        const result = getRevealedSteps(steps, 0.75);
        expect(result[0].revealed).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// getRevealedSteps — step count 2
// ---------------------------------------------------------------------------

describe('getRevealedSteps() with 2 steps', () => {
    const steps = makeSteps(2);

    it('phase 1 (0.0): reveals all 2', () => {
        const result = getRevealedSteps(steps, 0.0);
        expect(revealedIds(result)).toEqual(['step-1', 'step-2']);
        expect(hiddenIds(result)).toEqual([]);
    });

    it('phase 2 (0.35): Math.ceil(2 * 0.66) = Math.ceil(1.32) = 2 → all revealed', () => {
        const result = getRevealedSteps(steps, 0.35);
        expect(revealedIds(result).length).toBe(2);
    });

    it('phase 3 (0.55): Math.ceil(2 * 0.33) = Math.ceil(0.66) = 1 → 1 revealed', () => {
        const result = getRevealedSteps(steps, 0.55);
        expect(revealedIds(result)).toEqual(['step-1']);
        expect(hiddenIds(result)).toEqual(['step-2']);
    });

    it('phase 4 (0.75): 0 revealed', () => {
        const result = getRevealedSteps(steps, 0.75);
        expect(revealedIds(result)).toEqual([]);
        expect(hiddenIds(result)).toEqual(['step-1', 'step-2']);
    });
});

// ---------------------------------------------------------------------------
// getRevealedSteps — step count 3
// ---------------------------------------------------------------------------

describe('getRevealedSteps() with 3 steps', () => {
    const steps = makeSteps(3);

    it('phase 1 (0.0): all 3 revealed', () => {
        expect(revealedIds(getRevealedSteps(steps, 0.0)).length).toBe(3);
    });

    it('phase 2 (0.35): Math.ceil(3 * 0.66) = Math.ceil(1.98) = 2 → 2 revealed', () => {
        const result = getRevealedSteps(steps, 0.35);
        expect(revealedIds(result).length).toBe(2);
        expect(revealedIds(result)).toEqual(['step-1', 'step-2']);
    });

    it('phase 3 (0.55): Math.ceil(3 * 0.33) = Math.ceil(0.99) = 1 → 1 revealed', () => {
        const result = getRevealedSteps(steps, 0.55);
        expect(revealedIds(result).length).toBe(1);
        expect(revealedIds(result)).toEqual(['step-1']);
    });

    it('phase 4 (0.75): 0 revealed', () => {
        expect(revealedIds(getRevealedSteps(steps, 0.75)).length).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// getRevealedSteps — step count 4
// ---------------------------------------------------------------------------

describe('getRevealedSteps() with 4 steps', () => {
    const steps = makeSteps(4);

    it('phase 1 (0.0): all 4 revealed', () => {
        expect(revealedIds(getRevealedSteps(steps, 0.0)).length).toBe(4);
    });

    it('phase 2 (0.35): Math.ceil(4 * 0.66) = Math.ceil(2.64) = 3', () => {
        expect(revealedIds(getRevealedSteps(steps, 0.35)).length).toBe(3);
    });

    it('phase 3 (0.55): Math.ceil(4 * 0.33) = Math.ceil(1.32) = 2', () => {
        expect(revealedIds(getRevealedSteps(steps, 0.55)).length).toBe(2);
    });

    it('phase 4 (0.75): 0 revealed', () => {
        expect(revealedIds(getRevealedSteps(steps, 0.75)).length).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// getRevealedSteps — step count 5
// ---------------------------------------------------------------------------

describe('getRevealedSteps() with 5 steps', () => {
    const steps = makeSteps(5);

    it('phase 1 (0.0): all 5 revealed', () => {
        expect(revealedIds(getRevealedSteps(steps, 0.0)).length).toBe(5);
    });

    it('phase 2 (0.35): Math.ceil(5 * 0.66) = Math.ceil(3.30) = 4', () => {
        expect(revealedIds(getRevealedSteps(steps, 0.35)).length).toBe(4);
    });

    it('phase 3 (0.55): Math.ceil(5 * 0.33) = Math.ceil(1.65) = 2', () => {
        expect(revealedIds(getRevealedSteps(steps, 0.55)).length).toBe(2);
    });

    it('phase 4 (0.75): 0 revealed', () => {
        expect(revealedIds(getRevealedSteps(steps, 0.75)).length).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// getRevealedSteps — revealed flags correctness
// ---------------------------------------------------------------------------

describe('getRevealedSteps() — revealed flag ordering', () => {
    it('always reveals the first i steps (never reveals a gap)', () => {
        const steps = makeSteps(5);
        const result = getRevealedSteps(steps, 0.35);
        const flags = result.map((s) => s.revealed);
        // revealed flags must be a prefix of true followed by false — no gaps allowed
        let seenFalse = false;
        for (const flag of flags) {
            if (seenFalse) {
                expect(flag).toBe(false);
            }
            if (!flag) seenFalse = true;
        }
    });

    it('preserves all original step fields on revealed steps', () => {
        const steps = makeSteps(3);
        const result = getRevealedSteps(steps, 0.0);
        result.forEach((s, i) => {
            expect(s.id).toBe(steps[i].id);
            expect(s.stepNumber).toBe(steps[i].stepNumber);
            expect(s.instruction).toBe(steps[i].instruction);
        });
    });
});

// ---------------------------------------------------------------------------
// getRevealedSteps — exact boundary mastery values
// ---------------------------------------------------------------------------

describe('getRevealedSteps() — exact mastery boundaries', () => {
    const steps = makeSteps(3); // use 3 steps to make percentages visible

    it('mastery 0.35 (exact boundary): enters phase 2 → 2 steps revealed', () => {
        // Just below 0.35 (phase 1) → n=3
        expect(revealedIds(getRevealedSteps(steps, 0.3499)).length).toBe(3);
        // At exactly 0.35 (phase 2) → ceil(3*0.66)=2
        expect(revealedIds(getRevealedSteps(steps, 0.35)).length).toBe(2);
    });

    it('mastery 0.55 (exact boundary): enters phase 3 → 1 step revealed', () => {
        // Just below 0.55 (still phase 2) → ceil(3*0.66)=2
        expect(revealedIds(getRevealedSteps(steps, 0.5499)).length).toBe(2);
        // At exactly 0.55 (phase 3) → ceil(3*0.33)=1
        expect(revealedIds(getRevealedSteps(steps, 0.55)).length).toBe(1);
    });

    it('mastery 0.75 (exact boundary): enters phase 4 → 0 steps revealed', () => {
        // Just below 0.75 (still phase 3) → ceil(3*0.33)=1
        expect(revealedIds(getRevealedSteps(steps, 0.7499)).length).toBe(1);
        // At exactly 0.75 (phase 4) → 0
        expect(revealedIds(getRevealedSteps(steps, 0.75)).length).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// getRevealedSteps — correctAnswer must NEVER appear
// ---------------------------------------------------------------------------

describe('getRevealedSteps() — no answer leakage', () => {
    it('returned RevealedStep objects have no correctAnswer property', () => {
        const steps = makeSteps(3);
        const result = getRevealedSteps(steps, 0.0);
        result.forEach((s) => {
            expect((s as any).correctAnswer).toBeUndefined();
        });
    });
});
