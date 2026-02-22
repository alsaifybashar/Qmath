/**
 * Analytics type definitions for the three-module learning dashboard.
 *
 * Module 1 – Descriptive Analytics  (current state & development)
 * Module 2 – Prescriptive Analytics (action-oriented feedback)
 * Module 3 – Behavioural Patterns   (gaming the system & affect)
 */

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1 · Descriptive Analytics
// ─────────────────────────────────────────────────────────────────────────────

/** Per-topic snapshot used by the heatmap and radar chart */
export interface StudentProgress {
    topicId: string;
    topicName: string;
    /** 0–5 mastery scale (maps to proficiency bands) */
    masteryLevel: number;
    /** Course requirement that appears as the reference line in charts */
    targetMastery: number;
    /** Class-average mastery for the comparison radar */
    classAvgMastery: number;
    /** Total number of attempts */
    attempts: number;
    /** 0–1 accuracy ratio */
    accuracy: number;
    lastPracticed: Date;
    /** Accuracy per day for the last 7 days (0–1, undefined = no data) */
    weeklyAccuracy: (number | null)[];
    /** High-level subject area used to group heatmap cells */
    subject: string;
}

/** Module-level progress for the progress-bar section */
export interface ModuleProgress {
    moduleId: string;
    moduleName: string;
    /** 0–100 percentage */
    progress: number;
    /** 0–100 minimum required to pass */
    required: number;
    questionsAttempted: number;
    questionsTotal: number;
    /** Estimated minutes to complete */
    estMinutes: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 2 · Prescriptive Analytics
// ─────────────────────────────────────────────────────────────────────────────

export type ErrorType =
    | 'conceptual'
    | 'procedural'
    | 'computational'
    | 'interpretation'
    | 'notation'
    | 'incomplete'
    | 'time_pressure';

/** A cluster of similar errors found in the student's attempt history */
export interface ErrorPattern {
    type: ErrorType;
    /** Absolute count in the analysis window */
    frequency: number;
    /** 0–1 share of all errors */
    share: number;
    mostRecentAt: Date;
    /** Topics most affected by this error type */
    affectedTopics: string[];
    severity: 'low' | 'medium' | 'high';
    /** Human-readable actionable description */
    actionableMessage: string;
}

/** A single item surfaced by the prescriptive algorithm (max 2 shown at once) */
export interface PrescriptiveTodo {
    id: string;
    /** Priority rank — only rank 1 and 2 are ever rendered */
    rank: 1 | 2;
    title: string;
    description: string;
    /** Where the student should go to address this */
    href: string;
    /** Estimated minutes needed */
    estMinutes: number;
    /** Which error pattern drives this recommendation */
    drivenBy: ErrorType;
    difficulty: 'easy' | 'medium' | 'hard';
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 3 · Behavioural Patterns
// ─────────────────────────────────────────────────────────────────────────────

export type FocusState = 'focused' | 'distracted' | 'stressed';

/** One data-point on the concentration timeline */
export interface BehaviouralDataPoint {
    /** Seconds from start of session */
    elapsedSeconds: number;
    /** Response time for the question answered at this moment */
    responseTimeMs: number;
    /** Whether this was a rapid guess (< RAPID_GUESS_THRESHOLD_MS) */
    isRapidGuess: boolean;
    /** 0–1, inferred from click density / keyboard pressure patterns */
    interactionScore: number;
    /** Inferred focus state */
    focusState: FocusState;
    /** 0–1 stress level derived from response time + interaction score */
    stressLevel: number;
    questionType: 'multiple_choice' | 'numeric' | 'proof_step';
    isCorrect: boolean;
}

/** Aggregated metrics for a whole study session */
export interface BehaviouralMetrics {
    sessionId: string;
    sessionStart: Date;
    /** Total session duration in seconds */
    durationSeconds: number;
    /** Question-level timeline */
    dataPoints: BehaviouralDataPoint[];
    /** Aggregates */
    summary: {
        avgResponseMs: number;
        rapidGuessCount: number;
        rapidGuessShare: number;
        avgStressLevel: number;
        peakStressAt: number; // elapsedSeconds
        focusedShare: number;
        distractedShare: number;
        stressedShare: number;
    };
}

/**
 * A narrative insight card derived from behavioural data.
 * The text is generated from templates so it reads like a human story.
 */
export interface NarrativeInsight {
    icon: string;
    headline: string;
    body: string;
    /** Visual accent colour (Tailwind class fragment, e.g. 'amber') */
    accent: 'amber' | 'red' | 'emerald' | 'blue' | 'purple';
    /** Optional call-to-action */
    cta?: { label: string; href: string };
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared utilities
// ─────────────────────────────────────────────────────────────────────────────

/** Minimum response time (ms) below which a MC answer is flagged as a rapid guess */
export const RAPID_GUESS_THRESHOLD_MS = 3_000;

/** Mastery level → human label */
export const MASTERY_LABELS: Record<number, string> = {
    0: 'Inte startad',
    1: 'Introduktion',
    2: 'Grundläggande',
    3: 'Under utveckling',
    4: 'Avancerad',
    5: 'Bemästrad',
};

/** Accuracy band → colour token */
export function accuracyColor(accuracy: number): string {
    if (accuracy >= 0.85) return 'emerald';
    if (accuracy >= 0.65) return 'amber';
    if (accuracy >= 0.40) return 'orange';
    return 'red';
}
