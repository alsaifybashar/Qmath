import { AttemptEvent } from "../data-model/types";

export interface UserState {
    masteryMap: Record<string, number>; // topicId -> probability
}

export class AdaptiveLearningEngine {

    static calculateMasteryUpdate(
        currentMastery: number,
        attempt: AttemptEvent,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        topicDifficulty: number
    ): number {
        /* 
          Bayesian Knowledge Tracing (Simplified)
          p(L) = mastery probability
          p(S) = slip probability (knew it but messed up) ~ 0.1
          p(G) = guess probability (didn't know but got it right) ~ 0.2
          
          Posterior if Correct:
          P(L|Correct) = (P(L) * (1 - P(S))) / (P(L)*(1-P(S)) + (1-P(L))*P(G))
          
          Posterior if Incorrect:
          P(L|Incorrect) = (P(L) * P(S)) / (P(L)*P(S) + (1-P(L))*(1-P(G)))
        */

        // TODO: Adjust slip/guess based on generic difficulty vs user rating
        const pS = 0.1;
        const pG = 0.2; // Higher if multiple choice
        const pL = currentMastery;

        let posterior = pL;

        if (attempt.is_correct) {
            // If correct, confidence in mastery increases
            posterior = (pL * (1 - pS)) / (pL * (1 - pS) + (1 - pL) * pG);
        } else {
            // If incorrect, confidence decreases
            posterior = (pL * pS) / (pL * pS + (1 - pL) * (1 - pG));
        }

        // Clamp for safety to avoid 0 or 1 lock-in
        return Math.max(0.01, Math.min(0.99, posterior));
    }

    static suggestNextTopic(
        userState: UserState,
        availableTopics: string[]
    ): string | null {
        // Find topic with mastery closest to 0.5 (Zone of Proximal Development)
        let bestTopic = null;
        let minDiff = 1.0;

        for (const topicId of availableTopics) {
            const mastery = userState.masteryMap[topicId] || 0.1; // Default to low mastery
            const diff = Math.abs(mastery - 0.5);
            if (diff < minDiff) {
                minDiff = diff;
                bestTopic = topicId;
            }
        }
        return bestTopic;
    }
}
