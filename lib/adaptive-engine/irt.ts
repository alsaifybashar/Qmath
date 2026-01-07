/**
 * Item Response Theory (IRT) Implementation
 * 
 * IRT is used to:
 * 1. Estimate student ability (θ)
 * 2. Calculate probability of correct answers
 * 3. Select optimal difficulty questions
 * 4. Create Computer Adaptive Testing (CAT)
 */

import { IRTParameters } from './parameters';

export class IRTModel {
    /**
     * 3-Parameter Logistic Model (3PL)
     * 
     * P(θ) = c + (1 - c) / (1 + e^(-a(θ - b)))
     * 
     * Where:
     * - θ (theta) = student ability
     * - a = discrimination parameter
     * - b = difficulty parameter
     * - c = guessing parameter (pseudo-chance)
     */
    static probabilityCorrect(
        studentAbility: number,
        itemParams: IRTParameters
    ): number {
        const { difficulty: b, discrimination: a, guessing: c } = itemParams;

        const exponent = -a * (studentAbility - b);
        const logistic = 1 / (1 + Math.exp(exponent));

        return c + (1 - c) * logistic;
    }

    /**
     * 2-Parameter Logistic Model (2PL)
     * Simplified version without guessing parameter
     */
    static probabilityCorrect2PL(
        studentAbility: number,
        difficulty: number,
        discrimination: number = 1.0
    ): number {
        const exponent = -discrimination * (studentAbility - difficulty);
        return 1 / (1 + Math.exp(exponent));
    }

    /**
     * 1-Parameter Logistic Model (1PL / Rasch Model)
     * Simplest form - only considers difficulty
     */
    static probabilityCorrectRasch(
        studentAbility: number,
        difficulty: number
    ): number {
        return 1 / (1 + Math.exp(-(studentAbility - difficulty)));
    }

    /**
     * Information Function
     * 
     * Measures how much "information" a question provides about ability.
     * Questions are most informative when difficulty matches ability.
     */
    static itemInformation(
        studentAbility: number,
        itemParams: IRTParameters
    ): number {
        const p = this.probabilityCorrect(studentAbility, itemParams);
        const q = 1 - p;
        const { discrimination: a, guessing: c } = itemParams;

        // Information = a² * (p - c)² * q / ((1 - c)² * p)
        if (p === 0 || p === 1) return 0;

        const numerator = Math.pow(a, 2) * Math.pow(p - c, 2) * q;
        const denominator = Math.pow(1 - c, 2) * p;

        return numerator / denominator;
    }

    /**
     * Maximum Likelihood Estimation (MLE) for Ability
     * 
     * Updates ability estimate based on response pattern.
     * Uses Newton-Raphson iteration.
     */
    static updateAbilityMLE(
        currentAbility: number,
        responses: { itemParams: IRTParameters; isCorrect: boolean }[],
        maxIterations: number = 10,
        tolerance: number = 0.001
    ): number {
        let theta = currentAbility;

        for (let iter = 0; iter < maxIterations; iter++) {
            let firstDerivative = 0;
            let secondDerivative = 0;

            for (const { itemParams, isCorrect } of responses) {
                const p = this.probabilityCorrect(theta, itemParams);
                const q = 1 - p;
                const { discrimination: a, guessing: c } = itemParams;

                const u = isCorrect ? 1 : 0;

                // First derivative of log-likelihood
                const pStar = (p - c) / (1 - c);
                firstDerivative += a * (u - p) * pStar / (p * q);

                // Second derivative (negative)
                secondDerivative -= Math.pow(a, 2) * pStar * pStar * q / p;
            }

            if (secondDerivative === 0) break;

            const delta = firstDerivative / (-secondDerivative);
            theta += delta;

            // Clamp to reasonable range
            theta = Math.max(-4, Math.min(4, theta));

            if (Math.abs(delta) < tolerance) break;
        }

        return theta;
    }

    /**
     * Expected A Posteriori (EAP) Estimation
     * 
     * Bayesian approach - more stable than MLE, especially with few responses.
     * Assumes normal prior for ability.
     */
    static updateAbilityEAP(
        responses: { itemParams: IRTParameters; isCorrect: boolean }[],
        priorMean: number = 0,
        priorSD: number = 1,
        quadraturePoints: number = 40
    ): { ability: number; standardError: number } {
        // Gauss-Hermite quadrature points
        const points: number[] = [];
        const weights: number[] = [];

        const step = 8 / (quadraturePoints - 1);
        for (let i = 0; i < quadraturePoints; i++) {
            const x = -4 + i * step;
            points.push(x);
            // Normal prior weight
            weights.push(Math.exp(-Math.pow((x - priorMean) / priorSD, 2) / 2));
        }

        // Calculate likelihood at each point
        const likelihoods = points.map(theta => {
            let logLikelihood = 0;
            for (const { itemParams, isCorrect } of responses) {
                const p = this.probabilityCorrect(theta, itemParams);
                logLikelihood += isCorrect ? Math.log(p) : Math.log(1 - p);
            }
            return Math.exp(logLikelihood);
        });

        // Posterior
        const posterior = likelihoods.map((l, i) => l * weights[i]);
        const posteriorSum = posterior.reduce((a, b) => a + b, 0);

        if (posteriorSum === 0) {
            return { ability: priorMean, standardError: priorSD };
        }

        // Normalize
        const normalizedPosterior = posterior.map(p => p / posteriorSum);

        // Expected value (ability estimate)
        const ability = points.reduce((sum, x, i) => sum + x * normalizedPosterior[i], 0);

        // Standard error
        const variance = points.reduce(
            (sum, x, i) => sum + Math.pow(x - ability, 2) * normalizedPosterior[i],
            0
        );
        const standardError = Math.sqrt(variance);

        return { ability, standardError };
    }

    /**
     * Select Next Item for CAT (Computer Adaptive Testing)
     * 
     * Selects the item that provides maximum information at current ability level.
     */
    static selectNextItem(
        currentAbility: number,
        availableItems: { id: string; params: IRTParameters }[],
        usedItemIds: Set<string>
    ): { id: string; params: IRTParameters } | null {
        let bestItem = null;
        let maxInfo = -Infinity;

        for (const item of availableItems) {
            if (usedItemIds.has(item.id)) continue;

            const info = this.itemInformation(currentAbility, item.params);
            if (info > maxInfo) {
                maxInfo = info;
                bestItem = item;
            }
        }

        return bestItem;
    }

    /**
     * Map difficulty to IRT scale
     * Converts 1-10 difficulty to IRT b parameter (-3 to 3)
     */
    static difficultyToIRT(difficulty: number): number {
        // Map 1-10 to approximately -3 to 3
        return (difficulty - 5.5) * 0.6;
    }

    /**
     * Map IRT scale to difficulty
     * Converts IRT b parameter to 1-10 scale
     */
    static irtToDifficulty(b: number): number {
        return (b / 0.6) + 5.5;
    }

    /**
     * Calculate test-level information
     */
    static testInformation(
        studentAbility: number,
        items: IRTParameters[]
    ): number {
        return items.reduce(
            (sum, item) => sum + this.itemInformation(studentAbility, item),
            0
        );
    }

    /**
     * Calculate reliability at a given ability level
     */
    static reliabilityAtAbility(
        studentAbility: number,
        items: IRTParameters[]
    ): number {
        const info = this.testInformation(studentAbility, items);
        return info / (info + 1);
    }
}
