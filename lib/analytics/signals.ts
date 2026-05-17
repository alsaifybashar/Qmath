/**
 * Behavioural signals derived from learner data.
 *
 * Each signal is a pure function of the input shape. Signals are normalised
 * to a 0–100 score and tagged with an intensity ('low' | 'medium' | 'high')
 * which determines whether they surface to the student.
 *
 * Frameworks referenced:
 *  - Cognitive Load Theory (Sweller) for kognitiv-belastning
 *  - Flow theory (Csíkszentmihályi) for djupfokus
 *  - Approach/avoidance motivation (Elliot) for undvikande
 *  - Self-regulated learning (Zimmerman) for effort-outcome calibration
 */

import type {
    StudentProgress,
    BehaviouralMetrics,
    BehaviouralDataPoint,
    ErrorPattern,
} from '@/types/analytics';

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type SignalId =
    | 'cognitive_load'
    | 'flow_state'
    | 'avoidance'
    | 'effort_outcome';

export type SignalIntensity = 'low' | 'medium' | 'high';

/** A signal is a structured interpretation of behaviour, with evidence trail. */
export interface BehavioralSignal {
    id: SignalId;
    /** Display name in Swedish */
    name: string;
    /** 0–100 score. Higher = stronger signal. */
    score: number;
    intensity: SignalIntensity;
    /** One-line summary of what the signal means right now (Swedish). */
    summary: string;
    /** Concrete observations that drove the score (Swedish, ≤3 items). */
    evidence: string[];
    /** Whether this is a "positive" signal (something to protect) vs. a friction to address. */
    valence: 'protective' | 'friction';
}

export interface SignalInput {
    topics: StudentProgress[];
    metrics: BehaviouralMetrics;
    errorPatterns: ErrorPattern[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Math helpers
// ─────────────────────────────────────────────────────────────────────────────

function mean(xs: number[]): number {
    if (xs.length === 0) return 0;
    return xs.reduce((s, x) => s + x, 0) / xs.length;
}

function stdev(xs: number[]): number {
    if (xs.length < 2) return 0;
    const m = mean(xs);
    return Math.sqrt(mean(xs.map(x => (x - m) ** 2)));
}

function clamp(v: number, lo = 0, hi = 100): number {
    return Math.max(lo, Math.min(hi, v));
}

function classify(score: number): SignalIntensity {
    if (score >= 65) return 'high';
    if (score >= 35) return 'medium';
    return 'low';
}

function daysSince(date: Date, now = new Date()): number {
    return Math.floor((now.getTime() - date.getTime()) / 86400000);
}

// ─────────────────────────────────────────────────────────────────────────────
// Signal 1 · Cognitive Load
// ─────────────────────────────────────────────────────────────────────────────
// Sweller's CLT — when working-memory load exceeds capacity, behaviour shows:
//  (a) rising response-time variance across the session,
//  (b) falling accuracy in the second half,
//  (c) higher stress signature.
// We combine those into a single 0–100 score.

export function cognitiveLoadSignal(
    dataPoints: BehaviouralDataPoint[],
    summary: BehaviouralMetrics['summary'],
): BehavioralSignal {
    if (dataPoints.length < 6) {
        return {
            id: 'cognitive_load',
            name: 'Kognitiv belastning',
            score: 0,
            intensity: 'low',
            summary: 'För få datapunkter för att avgöra belastning.',
            evidence: [],
            valence: 'friction',
        };
    }

    const mid = Math.floor(dataPoints.length / 2);
    const firstHalf = dataPoints.slice(0, mid);
    const secondHalf = dataPoints.slice(mid);

    const rt1 = firstHalf.map(p => p.responseTimeMs);
    const rt2 = secondHalf.map(p => p.responseTimeMs);

    const meanRt1 = mean(rt1);
    const meanRt2 = mean(rt2);
    // Slowdown ratio: how much slower the second half is vs the first.
    const slowdown = meanRt1 > 0 ? (meanRt2 - meanRt1) / meanRt1 : 0;

    // Response-time variability normalised
    const cv1 = meanRt1 > 0 ? stdev(rt1) / meanRt1 : 0;
    const cv2 = meanRt2 > 0 ? stdev(rt2) / meanRt2 : 0;
    const variabilityDelta = cv2 - cv1;

    // Accuracy drop (correct → 1, wrong → 0)
    const acc1 = mean(firstHalf.map(p => (p.isCorrect ? 1 : 0)));
    const acc2 = mean(secondHalf.map(p => (p.isCorrect ? 1 : 0)));
    const accuracyDrop = acc1 - acc2;

    // Score components: each is normalised to 0–1, then weighted.
    const slowdownComp = clamp(slowdown * 100, 0, 60);          // up to +60%
    const variabilityComp = clamp(variabilityDelta * 200, 0, 40);
    const accuracyComp = clamp(accuracyDrop * 100, 0, 30);
    const stressComp = clamp(summary.avgStressLevel * 30, 0, 30);

    const score = clamp(slowdownComp + variabilityComp + accuracyComp + stressComp);
    const intensity = classify(score);

    const evidence: string[] = [];
    if (slowdown > 0.15) {
        evidence.push(
            `Svarstid ökade med ${Math.round(slowdown * 100)}% mot slutet av sessionen.`,
        );
    }
    if (accuracyDrop > 0.1) {
        evidence.push(
            `Träffsäkerhet sjönk ${Math.round(accuracyDrop * 100)} procentenheter i andra halvan.`,
        );
    }
    if (summary.avgStressLevel > 0.55) {
        evidence.push(
            `Genomsnittlig spänning: ${Math.round(summary.avgStressLevel * 100)}%.`,
        );
    }
    if (evidence.length === 0) {
        evidence.push('Stadig svarstid och bibehållen träffsäkerhet genom sessionen.');
    }

    const summaryText =
        intensity === 'high'
            ? 'Din hjärna jobbar hårdare än kapaciteten — dags att avlasta.'
            : intensity === 'medium'
                ? 'Belastningen kröker uppåt — en kort paus eller mindre uppgifter hjälper.'
                : 'Belastningen är välbalanserad just nu.';

    return {
        id: 'cognitive_load',
        name: 'Kognitiv belastning',
        score: Math.round(score),
        intensity,
        summary: summaryText,
        evidence,
        valence: 'friction',
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Signal 2 · Flow State
// ─────────────────────────────────────────────────────────────────────────────
// Flow markers (Csíkszentmihályi):
//  - Sustained focus (focusedShare high)
//  - Response times in the "sweet spot" (not rapid-guessing, not stalling)
//  - Streaks of correct answers
//  - Low rapid-guess share
// Flow is *protective* — we surface it so the student learns to recognise and
// recreate the conditions.

const FLOW_RT_MIN_MS = 4_000;
const FLOW_RT_MAX_MS = 18_000;

export function flowStateSignal(
    dataPoints: BehaviouralDataPoint[],
    summary: BehaviouralMetrics['summary'],
): BehavioralSignal {
    if (dataPoints.length < 5) {
        return {
            id: 'flow_state',
            name: 'Djupfokus',
            score: 0,
            intensity: 'low',
            summary: 'För kort session för att mäta flow.',
            evidence: [],
            valence: 'protective',
        };
    }

    // Longest streak of consecutive "sweet-spot" correct answers
    let bestStreak = 0;
    let current = 0;
    for (const p of dataPoints) {
        const inSweetSpot =
            p.isCorrect &&
            !p.isRapidGuess &&
            p.responseTimeMs >= FLOW_RT_MIN_MS &&
            p.responseTimeMs <= FLOW_RT_MAX_MS;
        if (inSweetSpot) {
            current += 1;
            if (current > bestStreak) bestStreak = current;
        } else {
            current = 0;
        }
    }
    // Streak component: cap streak benefit at 8
    const streakComp = clamp((bestStreak / 8) * 50, 0, 50);

    // Focus component
    const focusComp = clamp(summary.focusedShare * 40, 0, 40);

    // Rapid-guess penalty
    const rapidPenalty = clamp(summary.rapidGuessShare * 25, 0, 25);

    const score = clamp(streakComp + focusComp - rapidPenalty);
    const intensity = classify(score);

    const evidence: string[] = [];
    if (bestStreak >= 4) {
        evidence.push(
            `${bestStreak} korrekta i rad i lugnt tempo — klassisk flow-signatur.`,
        );
    }
    if (summary.focusedShare >= 0.6) {
        evidence.push(`Fokus i ${Math.round(summary.focusedShare * 100)}% av sessionen.`);
    }
    if (summary.rapidGuessShare > 0.2) {
        evidence.push(
            `${Math.round(summary.rapidGuessShare * 100)}% snabba gissningar bröt rytmen.`,
        );
    }
    if (evidence.length === 0) {
        evidence.push('Inga tydliga flow-tecken den här sessionen.');
    }

    const summaryText =
        intensity === 'high'
            ? 'Du var i flow — den här rytmen är värd att återskapa.'
            : intensity === 'medium'
                ? 'Flow tändes men höll inte hela vägen. Se vad som funkade.'
                : 'Begränsat flow — sessionen var fragmenterad eller stressad.';

    return {
        id: 'flow_state',
        name: 'Djupfokus',
        score: Math.round(score),
        intensity,
        summary: summaryText,
        evidence,
        valence: 'protective',
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Signal 3 · Avoidance
// ─────────────────────────────────────────────────────────────────────────────
// Approach/avoidance theory: failure-prone topics are systematically skipped.
// Markers:
//  - Topics with accuracy < 0.5 AND lastPracticed > 7 days
//  - Mastery clearly below target
// We surface the worst-offending topic(s) and recommend a Premack-style warmup.

const AVOIDANCE_ACCURACY_THRESHOLD = 0.5;
const AVOIDANCE_STALE_DAYS = 7;

export function avoidanceSignal(topics: StudentProgress[]): BehavioralSignal {
    const now = new Date();

    const flagged = topics.filter(
        t =>
            t.accuracy < AVOIDANCE_ACCURACY_THRESHOLD &&
            daysSince(t.lastPracticed, now) >= AVOIDANCE_STALE_DAYS &&
            t.masteryLevel < t.targetMastery,
    );

    // Score scales with the count + the gap on the worst topic
    const countComp = clamp(flagged.length * 25, 0, 50);
    const worst = [...flagged].sort(
        (a, b) => a.accuracy - b.accuracy,
    )[0];
    const gap = worst ? worst.targetMastery - worst.masteryLevel : 0;
    const gapComp = clamp((gap / 5) * 100, 0, 50);
    const score = clamp(countComp + gapComp);
    const intensity = classify(score);

    const evidence: string[] = [];
    if (flagged.length > 0) {
        evidence.push(
            `${flagged.length} ämne${flagged.length > 1 ? 'n' : ''} med svag träff och inget pluggat på över en vecka.`,
        );
    }
    if (worst) {
        evidence.push(
            `${worst.topicName}: ${Math.round(worst.accuracy * 100)}% träff, senast för ${daysSince(worst.lastPracticed, now)} dagar sedan.`,
        );
    }
    if (evidence.length === 0) {
        evidence.push('Du återbesöker svaga områden — inget tyder på undvikande.');
    }

    const summaryText =
        intensity === 'high'
            ? 'Ett par ämnen verkar undvikas — vi öppnar dem mjukt nästa gång.'
            : intensity === 'medium'
                ? 'Något ämne har legat ouppvärmt — kort kontakt räcker.'
                : 'Du håller jämn kontakt med dina ämnen.';

    return {
        id: 'avoidance',
        name: 'Undvikande',
        score: Math.round(score),
        intensity,
        summary: summaryText,
        evidence,
        valence: 'friction',
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Signal 4 · Effort-Outcome Calibration
// ─────────────────────────────────────────────────────────────────────────────
// Zimmerman's self-regulated learning — when effort doesn't translate to
// outcome, the learner is using ineffective strategies (re-reading, copying).
// Markers:
//  - Topics with attempts ≥ median + 1·MAD AND masteryLevel < targetMastery
//  - High frequency error patterns of the same type
// Recommendation: switch to active retrieval / self-explanation.

export function effortOutcomeSignal(
    topics: StudentProgress[],
    errorPatterns: ErrorPattern[],
): BehavioralSignal {
    if (topics.length === 0) {
        return {
            id: 'effort_outcome',
            name: 'Insats vs resultat',
            score: 0,
            intensity: 'low',
            summary: 'Inte tillräckligt med data ännu.',
            evidence: [],
            valence: 'friction',
        };
    }

    const attempts = topics.map(t => t.attempts);
    const medianAttempts = [...attempts].sort((a, b) => a - b)[Math.floor(attempts.length / 2)];

    // Topics where the student has tried hard but isn't getting traction
    const stuck = topics.filter(
        t =>
            t.attempts > medianAttempts &&
            t.masteryLevel < t.targetMastery,
    );

    // Repeated conceptual errors are a strong calibration signal
    const conceptualErrors = errorPatterns.filter(
        p => p.type === 'conceptual' && p.severity !== 'low',
    );

    const stuckComp = clamp((stuck.length / Math.max(topics.length, 1)) * 100, 0, 60);
    const conceptualComp = conceptualErrors.length > 0 ? 40 : 0;

    const score = clamp(stuckComp + conceptualComp);
    const intensity = classify(score);

    const evidence: string[] = [];
    if (stuck.length > 0) {
        const topStuck = [...stuck].sort((a, b) => b.attempts - a.attempts)[0];
        evidence.push(
            `${topStuck.topicName}: ${topStuck.attempts} försök men ${Math.round(topStuck.accuracy * 100)}% träff.`,
        );
    }
    if (conceptualErrors.length > 0) {
        evidence.push(
            `${conceptualErrors[0].frequency} återkommande konceptuella fel — passiv repetition räcker inte.`,
        );
    }
    if (evidence.length === 0) {
        evidence.push('Din insats motsvarar resultatet — bra strategival.');
    }

    const summaryText =
        intensity === 'high'
            ? 'Du jobbar hårt men metoden räcker inte — dags att byta strategi.'
            : intensity === 'medium'
                ? 'Insatsen syns inte fullt ut i resultatet — testa aktiv återkallning.'
                : 'Insats och resultat går i takt.';

    return {
        id: 'effort_outcome',
        name: 'Insats vs resultat',
        score: Math.round(score),
        intensity,
        summary: summaryText,
        evidence,
        valence: 'friction',
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Orchestrator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute every signal. Returns them sorted by surface priority:
 *  - high intensity first
 *  - friction signals before protective at equal intensity (act on issues first)
 *  - then by raw score
 */
export function computeSignals(input: SignalInput): BehavioralSignal[] {
    const { topics, metrics, errorPatterns } = input;
    const signals: BehavioralSignal[] = [
        cognitiveLoadSignal(metrics.dataPoints, metrics.summary),
        flowStateSignal(metrics.dataPoints, metrics.summary),
        avoidanceSignal(topics),
        effortOutcomeSignal(topics, errorPatterns),
    ];

    const intensityRank: Record<SignalIntensity, number> = {
        high: 3,
        medium: 2,
        low: 1,
    };

    return signals.sort((a, b) => {
        if (intensityRank[a.intensity] !== intensityRank[b.intensity]) {
            return intensityRank[b.intensity] - intensityRank[a.intensity];
        }
        // Friction first when intensity is equal — actionable issues lead.
        if (a.valence !== b.valence) {
            return a.valence === 'friction' ? -1 : 1;
        }
        return b.score - a.score;
    });
}

/**
 * Pick the top-N signals to surface to the user. We never surface a 'low'
 * signal unless nothing else exists — silence beats noise.
 */
export function topSignals(
    signals: BehavioralSignal[],
    limit = 2,
): BehavioralSignal[] {
    const nonLow = signals.filter(s => s.intensity !== 'low');
    if (nonLow.length >= 1) return nonLow.slice(0, limit);
    // Fallback: if everything is low, return the top one anyway so the panel
    // doesn't look empty — but only one.
    return signals.slice(0, 1);
}
