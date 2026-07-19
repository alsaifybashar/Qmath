import { describe, it, expect } from 'vitest';
import { masteryLevelFromProbability } from '@/lib/study/mastery';
import { BayesianKnowledgeTracing } from '@/lib/adaptive-engine/knowledge-tracing';
import { fadePhase } from '@/lib/math/fade-logic';

describe('masteryLevelFromProbability', () => {
    it('maps probability bands to the 0-5 dashboard levels', () => {
        expect(masteryLevelFromProbability(0.05)).toBe(0);
        expect(masteryLevelFromProbability(0.1)).toBe(0);
        expect(masteryLevelFromProbability(0.2)).toBe(1);
        expect(masteryLevelFromProbability(0.35)).toBe(2);
        expect(masteryLevelFromProbability(0.55)).toBe(3);
        expect(masteryLevelFromProbability(0.75)).toBe(4);
        expect(masteryLevelFromProbability(0.95)).toBe(5);
    });

    it('stays aligned with the fade-phase thresholds', () => {
        // Level 2 begins where fade phase 2 begins, and so on — the student-visible
        // "fewer steps" moments should coincide with dashboard level-ups.
        expect(fadePhase(0.35)).toBe(2);
        expect(masteryLevelFromProbability(0.35)).toBe(2);
        expect(fadePhase(0.55)).toBe(3);
        expect(masteryLevelFromProbability(0.55)).toBe(3);
        expect(fadePhase(0.75)).toBe(4);
        expect(masteryLevelFromProbability(0.75)).toBe(4);
    });
});

describe('BKT progression through fade phases', () => {
    it('reaches phase 4 (no prefilled steps) after a run of correct step answers', () => {
        const bkt = new BayesianKnowledgeTracing();
        let mastery = 0.1;
        let updates = 0;
        while (fadePhase(mastery) < 4 && updates < 50) {
            mastery = bkt.updateMastery(mastery, true);
            updates++;
        }
        expect(fadePhase(mastery)).toBe(4);
        // Sanity: should take a handful of correct answers, not 1 and not 50
        expect(updates).toBeGreaterThanOrEqual(2);
        expect(updates).toBeLessThan(15);
    });

    it('drops mastery (and can drop phase) on incorrect answers', () => {
        const bkt = new BayesianKnowledgeTracing();
        const before = 0.6;
        const after = bkt.updateMastery(before, false);
        expect(after).toBeLessThan(before);
    });
});
