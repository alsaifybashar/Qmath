/**
 * Knowledge Tracing Implementation
 * 
 * Implements Bayesian Knowledge Tracing (BKT) and Deep Knowledge Tracing concepts
 * to track skill mastery over time.
 */

import { KnowledgeState, AnswerAnalysis } from './parameters';

// ============================================================================
// BAYESIAN KNOWLEDGE TRACING (BKT)
// ============================================================================

export interface BKTParams {
    /** P(L0) - Probability of initial mastery */
    pInit: number;

    /** P(T) - Probability of learning after practice (transition) */
    pLearn: number;

    /** P(G) - Probability of guessing correctly when not mastered */
    pGuess: number;

    /** P(S) - Probability of slipping (wrong answer despite mastery) */
    pSlip: number;
}

// Default parameters (can be learned from data)
const DEFAULT_BKT_PARAMS: BKTParams = {
    pInit: 0.1,   // Low initial mastery assumed
    pLearn: 0.2,  // 20% chance of learning after each practice
    pGuess: 0.25, // 25% guess rate (for 4-option MC)
    pSlip: 0.1    // 10% careless error rate
};

export class BayesianKnowledgeTracing {
    private params: BKTParams;

    constructor(params: Partial<BKTParams> = {}) {
        this.params = { ...DEFAULT_BKT_PARAMS, ...params };
    }

    /**
     * Update mastery probability based on observed response
     * 
     * Uses Bayes' theorem to update P(mastered | response)
     */
    updateMastery(
        currentMastery: number,
        isCorrect: boolean
    ): number {
        const { pGuess, pSlip, pLearn } = this.params;

        let posteriorMastery: number;

        if (isCorrect) {
            // P(L|Correct) using Bayes' theorem
            // P(Correct|Learned) = 1 - pSlip
            // P(Correct|~Learned) = pGuess
            const pCorrectGivenLearned = 1 - pSlip;
            const pCorrectGivenNotLearned = pGuess;

            const numerator = currentMastery * pCorrectGivenLearned;
            const denominator =
                currentMastery * pCorrectGivenLearned +
                (1 - currentMastery) * pCorrectGivenNotLearned;

            posteriorMastery = numerator / denominator;
        } else {
            // P(L|Incorrect) using Bayes' theorem
            // P(Incorrect|Learned) = pSlip
            // P(Incorrect|~Learned) = 1 - pGuess
            const pIncorrectGivenLearned = pSlip;
            const pIncorrectGivenNotLearned = 1 - pGuess;

            const numerator = currentMastery * pIncorrectGivenLearned;
            const denominator =
                currentMastery * pIncorrectGivenLearned +
                (1 - currentMastery) * pIncorrectGivenNotLearned;

            posteriorMastery = numerator / denominator;
        }

        // Apply learning transition
        // P(L_next) = P(L|response) + (1 - P(L|response)) * pLearn
        const afterLearning = posteriorMastery + (1 - posteriorMastery) * pLearn;

        // Clamp to avoid 0 or 1 (prevents lock-in)
        return Math.max(0.01, Math.min(0.99, afterLearning));
    }

    /**
     * Predict probability of correct on next attempt
     */
    predictCorrect(currentMastery: number): number {
        const { pGuess, pSlip } = this.params;

        // P(Correct) = P(L) * (1 - pSlip) + (1 - P(L)) * pGuess
        return currentMastery * (1 - pSlip) + (1 - currentMastery) * pGuess;
    }

    /**
     * Check if skill is considered "mastered"
     * Typical threshold is 0.95
     */
    isMastered(currentMastery: number, threshold: number = 0.95): boolean {
        return currentMastery >= threshold;
    }

    /**
     * Calculate number of practices needed to reach mastery
     */
    practicesNeeded(
        currentMastery: number,
        targetMastery: number = 0.95
    ): number {
        const { pLearn } = this.params;

        if (currentMastery >= targetMastery) return 0;
        if (pLearn === 0) return Infinity;

        // Simplified: assumes all correct answers
        // ln(1 - target) = ln(1 - current) + n * ln(1 - pLearn)
        const n = Math.log(1 - targetMastery) - Math.log(1 - currentMastery);
        const divisor = Math.log(1 - pLearn);

        return Math.ceil(n / divisor);
    }

    /**
     * Adjust parameters based on question type
     */
    adjustForQuestionType(
        type: 'multiple_choice' | 'numeric' | 'proof_step'
    ): BKTParams {
        switch (type) {
            case 'multiple_choice':
                return { ...this.params, pGuess: 0.25, pSlip: 0.05 };
            case 'numeric':
                return { ...this.params, pGuess: 0.05, pSlip: 0.15 };
            case 'proof_step':
                return { ...this.params, pGuess: 0.02, pSlip: 0.20 };
            default:
                return this.params;
        }
    }
}

// ============================================================================
// KNOWLEDGE STATE MANAGER
// ============================================================================

export class KnowledgeStateManager {
    private state: KnowledgeState;
    private bkt: BayesianKnowledgeTracing;

    constructor(initialState?: Partial<KnowledgeState>) {
        this.bkt = new BayesianKnowledgeTracing();
        this.state = {
            masteryByTopic: {},
            lastPracticed: {},
            decayRate: {},
            practiceCount: {},
            estimatedAbility: 0,
            abilityConfidence: 1.5, // High uncertainty initially
            ...initialState
        };
    }

    /**
     * Process an answer and update knowledge state
     */
    processAnswer(
        topicId: string,
        analysis: AnswerAnalysis,
        questionType: 'multiple_choice' | 'numeric' | 'proof_step' = 'multiple_choice'
    ): void {
        // Get or initialize topic mastery
        const currentMastery = this.state.masteryByTopic[topicId] ?? 0.1;

        // Adjust BKT params for question type
        const adjustedBkt = new BayesianKnowledgeTracing(
            this.bkt.adjustForQuestionType(questionType)
        );

        // Apply time-based decay first
        const decayedMastery = this.applyDecay(topicId, currentMastery);

        // Update mastery based on response
        const newMastery = adjustedBkt.updateMastery(
            decayedMastery,
            analysis.isCorrect
        );

        // Adjust for response time (fast correct = higher confidence)
        const timeAdjustedMastery = this.adjustForResponseTime(
            newMastery,
            analysis.timeTaken,
            analysis.isCorrect
        );

        // Adjust for hints used
        const hintAdjustedMastery = this.adjustForHints(
            timeAdjustedMastery,
            analysis.hintsUsed,
            analysis.isCorrect
        );

        // Update state
        this.state.masteryByTopic[topicId] = hintAdjustedMastery;
        this.state.lastPracticed[topicId] = new Date();
        this.state.practiceCount[topicId] =
            (this.state.practiceCount[topicId] ?? 0) + 1;

        // Update overall ability estimate
        this.updateAbilityEstimate();
    }

    /**
     * Apply forgetting curve decay based on time since last practice
     */
    private applyDecay(topicId: string, currentMastery: number): number {
        const lastPracticed = this.state.lastPracticed[topicId];
        if (!lastPracticed) return currentMastery;

        const daysSince = (Date.now() - lastPracticed.getTime()) / (1000 * 60 * 60 * 24);

        // Get topic-specific decay rate or use default
        const decayRate = this.state.decayRate[topicId] ?? 0.1;

        // Exponential decay: M(t) = M(0) * e^(-λt)
        // Modified to approach a floor (not complete forgetting)
        const floor = 0.1;
        const decayedMastery = floor + (currentMastery - floor) *
            Math.exp(-decayRate * daysSince);

        return Math.max(floor, decayedMastery);
    }

    /**
     * Adjust mastery based on response time
     * Fast correct = higher confidence in mastery
     * Slow correct = might be guessing or working through
     */
    private adjustForResponseTime(
        mastery: number,
        timeTaken: number,
        isCorrect: boolean
    ): number {
        // Expected time varies by question, using 30s as baseline
        const expectedTime = 30000; // 30 seconds
        const timeRatio = timeTaken / expectedTime;

        if (isCorrect) {
            if (timeRatio < 0.5) {
                // Very fast - high confidence
                return mastery + (1 - mastery) * 0.05;
            } else if (timeRatio > 2) {
                // Very slow - might have struggled
                return mastery - mastery * 0.02;
            }
        } else {
            if (timeRatio < 0.3) {
                // Too fast to be trying - careless
                return mastery; // No change, likely careless
            }
        }

        return mastery;
    }

    /**
     * Adjust mastery based on hint usage
     */
    private adjustForHints(
        mastery: number,
        hintsUsed: number,
        isCorrect: boolean
    ): number {
        if (hintsUsed === 0) return mastery;

        // Each hint reduces the "credit" for a correct answer
        const hintPenalty = 0.1 * hintsUsed;

        if (isCorrect) {
            // Correct with hints = partial mastery update
            return mastery - hintPenalty * (mastery - 0.5);
        } else {
            // Wrong even with hints = lower mastery
            return mastery - hintPenalty * 0.1;
        }
    }

    /**
     * Update overall ability estimate based on all topic masteries
     */
    private updateAbilityEstimate(): void {
        const masteries = Object.values(this.state.masteryByTopic);
        if (masteries.length === 0) return;

        // Weighted average, more recent topics weighted higher
        const avgMastery = masteries.reduce((a, b) => a + b, 0) / masteries.length;

        // Convert to IRT-like scale (-3 to 3)
        // logit transformation
        const clampedMastery = Math.max(0.01, Math.min(0.99, avgMastery));
        this.state.estimatedAbility = Math.log(clampedMastery / (1 - clampedMastery));

        // Reduce confidence interval as we get more data
        this.state.abilityConfidence = Math.max(
            0.3, // Minimum confidence interval
            1.5 / Math.sqrt(masteries.length)
        );
    }

    /**
     * Get topics sorted by priority (weakest first, with recency consideration)
     */
    getPriorityTopics(availableTopics: string[]): string[] {
        return availableTopics.sort((a, b) => {
            const masteryA = this.state.masteryByTopic[a] ?? 0.1;
            const masteryB = this.state.masteryByTopic[b] ?? 0.1;

            // Prioritize lower mastery
            // But also consider time since last practice
            const daysSinceA = this.getDaysSinceLastPractice(a);
            const daysSinceB = this.getDaysSinceLastPractice(b);

            // Score = mastery - decay_bonus
            // Lower score = higher priority
            const scoreA = masteryA - Math.min(0.2, daysSinceA * 0.01);
            const scoreB = masteryB - Math.min(0.2, daysSinceB * 0.01);

            return scoreA - scoreB;
        });
    }

    private getDaysSinceLastPractice(topicId: string): number {
        const lastPracticed = this.state.lastPracticed[topicId];
        if (!lastPracticed) return 30; // Assume 30 days if never practiced
        return (Date.now() - lastPracticed.getTime()) / (1000 * 60 * 60 * 24);
    }

    /**
     * Get current knowledge state
     */
    getState(): KnowledgeState {
        return { ...this.state };
    }

    /**
     * Get mastery for a specific topic
     */
    getTopicMastery(topicId: string): number {
        return this.state.masteryByTopic[topicId] ?? 0.1;
    }

    /**
     * Check if topic is mastered
     */
    isTopicMastered(topicId: string, threshold: number = 0.85): boolean {
        return this.getTopicMastery(topicId) >= threshold;
    }
}
