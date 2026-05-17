/**
 * FSRS adapter — translates between the persisted card-state shape
 * (db/dashboard-schema.ts → flashcardCardState) and the FSRSAlgorithm.
 *
 * The FSRSAlgorithm class itself (lib/adaptive-engine/spaced-repetition.ts)
 * is the source of truth for the algorithm; this module is a thin wrapper
 * around it that knows how to round-trip our DB rows.
 */

import { FSRSAlgorithm, FSRSCard, FSRSRating } from '@/lib/adaptive-engine/spaced-repetition';

/** DB-shape snapshot of a card's FSRS state. */
export interface CardStateRow {
    cardId: string;
    stability: number;
    difficulty: number;
    elapsedDays: number;
    scheduledDays: number;
    reps: number;
    lapses: number;
    state: 'new' | 'learning' | 'review' | 'relearning';
    lastReview: Date | null;
    nextReview: Date;
}

export type Rating = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy

export const RATING_LABEL_SV: Record<Rating, string> = {
    1: 'Igen',
    2: 'Svår',
    3: 'Bra',
    4: 'Lätt',
};

export const RATING_XP: Record<Rating, number> = {
    1: 3,
    2: 5,
    3: 8,
    4: 10,
};

function toAlgorithmCard(row: CardStateRow): FSRSCard {
    return {
        id: row.cardId,
        stability: row.stability,
        difficulty: row.difficulty,
        elapsedDays: row.elapsedDays,
        scheduledDays: row.scheduledDays,
        reps: row.reps,
        lapses: row.lapses,
        state: row.state,
        lastReview: row.lastReview ?? undefined,
        nextReview: row.nextReview,
    };
}

function fromAlgorithmCard(card: FSRSCard): CardStateRow {
    return {
        cardId: card.id,
        stability: card.stability,
        difficulty: card.difficulty,
        elapsedDays: card.elapsedDays,
        scheduledDays: card.scheduledDays,
        reps: card.reps,
        lapses: card.lapses,
        state: card.state,
        lastReview: card.lastReview ?? null,
        nextReview: card.nextReview,
    };
}

/** Build the initial state for a new card. The card is due *now*. */
export function initialState(cardId: string): CardStateRow {
    const fresh = FSRSAlgorithm.createCard(cardId);
    return fromAlgorithmCard(fresh);
}

/** Apply a review rating to a current state row, returning the next row. */
export function applyReview(current: CardStateRow, rating: Rating): CardStateRow {
    const algoCard = toAlgorithmCard(current);
    const next = FSRSAlgorithm.review(algoCard, rating as FSRSRating);
    return fromAlgorithmCard(next);
}

/** Approx. probability of recall right now (0–1). */
export function retrievability(row: CardStateRow, now = new Date()): number {
    if (!row.lastReview) return 1;
    const elapsedDays =
        (now.getTime() - row.lastReview.getTime()) / (24 * 60 * 60 * 1000);
    if (row.stability <= 0) return 1;
    return FSRSAlgorithm.retrievability(row.stability, elapsedDays);
}
