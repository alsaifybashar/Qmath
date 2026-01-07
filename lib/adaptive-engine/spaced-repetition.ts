/**
 * Spaced Repetition Algorithm (SM-2 and FSRS)
 * 
 * Implements spaced repetition to optimize long-term retention
 * by scheduling reviews at optimal intervals.
 */

import { SpacedRepetitionState } from './parameters';

// ============================================================================
// SM-2 ALGORITHM (SuperMemo 2)
// ============================================================================

export interface SM2Card {
    id: string;
    easinessFactor: number;  // EF, starts at 2.5
    interval: number;        // Days until next review
    repetitions: number;     // Number of successful reviews
    nextReviewDate: Date;
    lastReviewDate?: Date;
}

export type SM2Quality = 0 | 1 | 2 | 3 | 4 | 5;
// 0 - Complete blackout
// 1 - Incorrect, but recognized upon seeing answer
// 2 - Incorrect, but seems easy to remember
// 3 - Correct with serious difficulty
// 4 - Correct after hesitation
// 5 - Perfect response

export class SM2Algorithm {
    /**
     * Process a review and update card scheduling
     */
    static review(card: SM2Card, quality: SM2Quality): SM2Card {
        const newCard = { ...card };

        // Calculate new easiness factor
        // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        const efDelta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
        newCard.easinessFactor = Math.max(1.3, card.easinessFactor + efDelta);

        if (quality < 3) {
            // Failed review - reset
            newCard.repetitions = 0;
            newCard.interval = 1;
        } else {
            // Successful review
            newCard.repetitions += 1;

            if (newCard.repetitions === 1) {
                newCard.interval = 1;
            } else if (newCard.repetitions === 2) {
                newCard.interval = 6;
            } else {
                newCard.interval = Math.round(
                    card.interval * newCard.easinessFactor
                );
            }
        }

        // Set next review date
        newCard.lastReviewDate = new Date();
        newCard.nextReviewDate = new Date(
            Date.now() + newCard.interval * 24 * 60 * 60 * 1000
        );

        return newCard;
    }

    /**
     * Initialize a new card
     */
    static createCard(id: string): SM2Card {
        return {
            id,
            easinessFactor: 2.5,
            interval: 0,
            repetitions: 0,
            nextReviewDate: new Date()
        };
    }

    /**
     * Check if card is due for review
     */
    static isDue(card: SM2Card): boolean {
        return new Date() >= card.nextReviewDate;
    }

    /**
     * Calculate overdue factor (how late is the review)
     */
    static overdueFactor(card: SM2Card): number {
        const now = Date.now();
        const due = card.nextReviewDate.getTime();

        if (now <= due) return 0;

        const overdueDays = (now - due) / (24 * 60 * 60 * 1000);
        return overdueDays / Math.max(1, card.interval);
    }
}

// ============================================================================
// FSRS (Free Spaced Repetition Scheduler)
// ============================================================================

export interface FSRSCard {
    id: string;
    stability: number;       // S - memory stability (days)
    difficulty: number;      // D - inherent difficulty (0-10)
    elapsedDays: number;     // Days since last review
    scheduledDays: number;   // Scheduled interval
    reps: number;            // Review count
    lapses: number;          // Fail count
    state: 'new' | 'learning' | 'review' | 'relearning';
    lastReview?: Date;
    nextReview: Date;
}

export type FSRSRating = 1 | 2 | 3 | 4;
// 1 - Again (forgot)
// 2 - Hard (significant difficulty)
// 3 - Good (correct with some effort)
// 4 - Easy (perfect recall)

// FSRS-4.5 parameters (optimized defaults)
const FSRS_PARAMS = {
    w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61],
    requestRetention: 0.9, // Target 90% retention
    maximumInterval: 36500, // 100 years max
};

export class FSRSAlgorithm {
    /**
     * Calculate retrievability (probability of recall)
     * R = (1 + t / (9 * S))^(-1)
     */
    static retrievability(stability: number, elapsedDays: number): number {
        return Math.pow(1 + elapsedDays / (9 * stability), -1);
    }

    /**
     * Calculate next interval based on desired retention
     * I = 9 * S * ((1/R)^(1/W) - 1)
     */
    static nextInterval(stability: number, requestedRetention: number = 0.9): number {
        const interval = 9 * stability * (Math.pow(1 / requestedRetention, 1) - 1);
        return Math.min(FSRS_PARAMS.maximumInterval, Math.max(1, Math.round(interval)));
    }

    /**
     * Update stability after review
     */
    static updateStability(
        card: FSRSCard,
        rating: FSRSRating,
        elapsedDays: number
    ): number {
        const { w } = FSRS_PARAMS;
        const r = this.retrievability(card.stability, elapsedDays);

        if (rating === 1) {
            // Forget - stability decreases
            return w[11] * Math.pow(card.difficulty + 1, -w[12]) *
                (Math.pow(card.stability + 1, w[13]) - 1) *
                Math.exp((1 - r) * w[14]);
        }

        // Recall - stability increases
        const hardPenalty = rating === 2 ? w[15] : 1;
        const easyBonus = rating === 4 ? w[16] : 1;

        return card.stability * (
            1 +
            Math.exp(w[8]) *
            (11 - card.difficulty) *
            Math.pow(card.stability, -w[9]) *
            (Math.exp((1 - r) * w[10]) - 1) *
            hardPenalty *
            easyBonus
        );
    }

    /**
     * Update difficulty after review
     */
    static updateDifficulty(
        currentDifficulty: number,
        rating: FSRSRating
    ): number {
        const { w } = FSRS_PARAMS;

        // Mean reversion
        const deltaDifficulty = w[6] * (rating - 3);
        const newDifficulty = currentDifficulty - deltaDifficulty;

        // Clamp to [1, 10]
        return Math.min(10, Math.max(1, newDifficulty));
    }

    /**
     * Process a review
     */
    static review(card: FSRSCard, rating: FSRSRating): FSRSCard {
        const newCard = { ...card };
        const now = new Date();

        // Calculate elapsed days
        const elapsedDays = card.lastReview
            ? (now.getTime() - card.lastReview.getTime()) / (24 * 60 * 60 * 1000)
            : 0;

        newCard.elapsedDays = elapsedDays;

        // Update stability and difficulty
        newCard.stability = this.updateStability(card, rating, elapsedDays);
        newCard.difficulty = this.updateDifficulty(card.difficulty, rating);

        // Update state
        if (rating === 1) {
            newCard.lapses += 1;
            newCard.state = card.state === 'new' ? 'learning' : 'relearning';
        } else {
            newCard.reps += 1;
            newCard.state = 'review';
        }

        // Calculate next interval
        const interval = this.nextInterval(newCard.stability);
        newCard.scheduledDays = interval;
        newCard.nextReview = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
        newCard.lastReview = now;

        return newCard;
    }

    /**
     * Create a new card
     */
    static createCard(id: string, initialDifficulty: number = 5): FSRSCard {
        const { w } = FSRS_PARAMS;

        return {
            id,
            stability: w[4],  // Initial stability
            difficulty: initialDifficulty,
            elapsedDays: 0,
            scheduledDays: 1,
            reps: 0,
            lapses: 0,
            state: 'new',
            nextReview: new Date()
        };
    }

    /**
     * Check if card is due
     */
    static isDue(card: FSRSCard): boolean {
        return new Date() >= card.nextReview;
    }
}

// ============================================================================
// SPACED REPETITION MANAGER
// ============================================================================

export class SpacedRepetitionManager {
    private state: SpacedRepetitionState;
    private algorithm: 'sm2' | 'fsrs';

    constructor(
        initialState?: Partial<SpacedRepetitionState>,
        algorithm: 'sm2' | 'fsrs' = 'fsrs'
    ) {
        this.algorithm = algorithm;
        this.state = {
            nextReviewDates: {},
            easinessFactors: {},
            intervals: {},
            repetitions: {},
            dueItems: [],
            ...initialState
        };
    }

    /**
     * Add an item to the spaced repetition system
     */
    addItem(itemId: string): void {
        this.state.nextReviewDates[itemId] = new Date();
        this.state.easinessFactors[itemId] = 2.5;
        this.state.intervals[itemId] = 0;
        this.state.repetitions[itemId] = 0;
        this.updateDueItems();
    }

    /**
     * Process a review
     */
    processReview(itemId: string, quality: number): void {
        // Ensure item exists
        if (!this.state.nextReviewDates[itemId]) {
            this.addItem(itemId);
        }

        // Get current state
        const currentEF = this.state.easinessFactors[itemId] ?? 2.5;
        const currentInterval = this.state.intervals[itemId] ?? 0;
        const currentReps = this.state.repetitions[itemId] ?? 0;

        // Create card for SM2 processing
        const card: SM2Card = {
            id: itemId,
            easinessFactor: currentEF,
            interval: currentInterval,
            repetitions: currentReps,
            nextReviewDate: new Date()
        };

        // Process with SM2
        const qualityRating = Math.round(Math.max(0, Math.min(5, quality))) as SM2Quality;
        const updatedCard = SM2Algorithm.review(card, qualityRating);

        // Update state
        this.state.nextReviewDates[itemId] = updatedCard.nextReviewDate;
        this.state.easinessFactors[itemId] = updatedCard.easinessFactor;
        this.state.intervals[itemId] = updatedCard.interval;
        this.state.repetitions[itemId] = updatedCard.repetitions;

        this.updateDueItems();
    }

    /**
     * Convert answer correctness/difficulty to SM2 quality rating
     */
    static answerToQuality(
        isCorrect: boolean,
        timeTaken: number,       // in ms
        expectedTime: number,    // in ms
        hintsUsed: number
    ): SM2Quality {
        if (!isCorrect) {
            // Wrong answers get 0-2 based on closeness
            return hintsUsed > 2 ? 0 : hintsUsed > 0 ? 1 : 2;
        }

        // Correct answers
        const timeRatio = timeTaken / expectedTime;

        if (hintsUsed > 0) {
            return 3; // Correct but needed help
        } else if (timeRatio > 2) {
            return 3; // Correct but slow (struggled)
        } else if (timeRatio > 1) {
            return 4; // Correct with some hesitation
        } else {
            return 5; // Fast and correct - perfect
        }
    }

    /**
     * Update list of due items
     */
    private updateDueItems(): void {
        const now = new Date();
        this.state.dueItems = Object.entries(this.state.nextReviewDates)
            .filter(([_, date]) => date <= now)
            .map(([id]) => id);
    }

    /**
     * Get items due for review
     */
    getDueItems(): string[] {
        this.updateDueItems();
        return [...this.state.dueItems];
    }

    /**
     * Get next review date for an item
     */
    getNextReviewDate(itemId: string): Date | null {
        return this.state.nextReviewDates[itemId] ?? null;
    }

    /**
     * Get full state
     */
    getState(): SpacedRepetitionState {
        return { ...this.state };
    }

    /**
     * Get study load for next N days
     */
    getStudyLoad(days: number): Record<string, number> {
        const load: Record<string, number> = {};
        const now = Date.now();

        for (let i = 0; i < days; i++) {
            const dayStart = now + i * 24 * 60 * 60 * 1000;
            const dayEnd = dayStart + 24 * 60 * 60 * 1000;
            const dateKey = new Date(dayStart).toISOString().split('T')[0];

            load[dateKey] = Object.values(this.state.nextReviewDates)
                .filter(date => {
                    const time = date.getTime();
                    return time >= dayStart && time < dayEnd;
                })
                .length;
        }

        return load;
    }
}
