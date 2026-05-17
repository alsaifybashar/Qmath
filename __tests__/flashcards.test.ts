import { describe, expect, it } from 'vitest';
import { applyReview, initialState, RATING_XP } from '@/lib/flashcards/fsrs';
import { bucketFor, groupByBucket } from '@/lib/flashcards/state-buckets';

describe('flashcard scheduling', () => {
    it('creates new cards due immediately in the new bucket', () => {
        const state = initialState('card-1');

        expect(state.cardId).toBe('card-1');
        expect(state.state).toBe('new');
        expect(state.reps).toBe(0);
        expect(bucketFor(state)).toBe('ny');
        expect(state.nextReview.getTime()).toBeLessThanOrEqual(Date.now() + 1000);
    });

    it('moves successful reviews into review state and schedules a future review', () => {
        const state = initialState('card-2');
        const reviewed = applyReview(state, 3);

        expect(reviewed.state).toBe('review');
        expect(reviewed.reps).toBe(1);
        expect(reviewed.lastReview).toBeInstanceOf(Date);
        expect(reviewed.nextReview.getTime()).toBeGreaterThan(reviewed.lastReview!.getTime());
        expect(reviewed.scheduledDays).toBeGreaterThanOrEqual(1);
    });

    it('tracks lapses when the student forgets a card', () => {
        const reviewed = applyReview(initialState('card-3'), 1);

        expect(reviewed.state).toBe('learning');
        expect(reviewed.lapses).toBe(1);
        expect(reviewed.reps).toBe(0);
    });

    it('groups cards by learning stability buckets', () => {
        const fresh = initialState('fresh');
        const short = { ...fresh, cardId: 'short', reps: 1, state: 'review' as const, stability: 3 };
        const stable = { ...fresh, cardId: 'stable', reps: 3, state: 'review' as const, stability: 12 };
        const longTerm = { ...fresh, cardId: 'long', reps: 5, state: 'review' as const, stability: 45 };

        const grouped = groupByBucket([
            { id: 'fresh', state: fresh },
            { id: 'short', state: short },
            { id: 'stable', state: stable },
            { id: 'long', state: longTerm },
        ]);

        expect(grouped.ny).toHaveLength(1);
        expect(grouped.repetera_snart).toHaveLength(1);
        expect(grouped.stabil).toHaveLength(1);
        expect(grouped.langtidsminne).toHaveLength(1);
    });
});

describe('flashcard motivation values', () => {
    it('rewards stronger recall ratings with more XP', () => {
        expect(RATING_XP[1]).toBeLessThan(RATING_XP[2]);
        expect(RATING_XP[2]).toBeLessThan(RATING_XP[3]);
        expect(RATING_XP[3]).toBeLessThan(RATING_XP[4]);
    });
});
