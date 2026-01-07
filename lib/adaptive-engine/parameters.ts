/**
 * Adaptive Learning Parameters
 * 
 * This module defines all the parameters that the adaptive learning engine
 * collects and analyzes to personalize the learning experience.
 */

// ============================================================================
// PERFORMANCE & ACCURACY METRICS
// ============================================================================

export interface PerformanceMetrics {
    /** Total number of questions answered correctly */
    correctAnswers: number;

    /** Total number of questions answered incorrectly */
    wrongAnswers: number;

    /** Accuracy rate (0-1) */
    accuracyRate: number;

    /** First attempt success rate - measures true understanding vs trial-and-error */
    firstAttemptSuccessRate: number;

    /** Distribution of error types */
    errorPatterns: ErrorPattern[];

    /** Hint usage statistics */
    hintUsage: HintUsageStats;

    /** How often student abandons questions without answering */
    abandonRate: number;
}

export interface ErrorPattern {
    type: 'computational' | 'conceptual' | 'notation' | 'careless' | 'method_selection';
    frequency: number;
    topicIds: string[];
    lastOccurrence: Date;
}

export interface HintUsageStats {
    totalHintsUsed: number;
    avgHintsPerQuestion: number;
    questionsWithHints: number;
    questionsWithoutHints: number;
}

// ============================================================================
// TEMPORAL & TIME-BASED METRICS
// ============================================================================

export interface TemporalMetrics {
    /** Average time spent solving a question (in milliseconds) */
    avgTimePerQuestion: number;

    /** Time variance - consistent vs wildly variable response times */
    timeVariance: number;

    /** Total hours spent learning */
    totalHoursSpent: number;

    /** Average session duration in minutes */
    avgSessionDuration: number;

    /** Best performance time window (e.g., "18:00-20:00") */
    peakPerformanceWindow: string;

    /** Time of day patterns (performance by hour) */
    hourlyPerformance: Record<number, number>;

    /** Days remaining until exam */
    daysUntilExam: number | null;

    /** Time between study sessions (for spaced repetition) */
    avgDaysBetweenSessions: number;
}

// ============================================================================
// ENGAGEMENT & BEHAVIOR METRICS
// ============================================================================

export interface EngagementMetrics {
    /** Current streak (consecutive days of practice) */
    currentStreak: number;

    /** Longest streak achieved */
    longestStreak: number;

    /** Total questions solved */
    totalQuestionsSolved: number;

    /** Questions solved per topic */
    questionsByTopic: Record<string, number>;

    /** Learning velocity - how quickly they're improving */
    learningVelocity: number;

    /** Preferred content format (visual, text, interactive) */
    preferredModality: 'visual' | 'text' | 'interactive' | 'mixed';

    /** Session patterns - regular vs sporadic */
    sessionRegularity: number;

    /** Does the student review before attempting problems? */
    reviewBeforePractice: boolean;
}

// ============================================================================
// QUESTION-SPECIFIC PARAMETERS
// ============================================================================

export interface QuestionParameters {
    /** Question ID */
    questionId: string;

    /** Topic area */
    topicId: string;

    /** Difficulty level (1-10) */
    difficulty: number;

    /** Question type */
    type: 'multiple_choice' | 'numeric' | 'proof_step' | 'fill_blank';

    /** Character count of the question */
    characterCount: number;

    /** Number of steps required to solve */
    stepsRequired: number;

    /** Prerequisites required */
    prerequisites: string[];

    /** IRT Parameters */
    irtParams: IRTParameters;
}

export interface IRTParameters {
    /** Item difficulty (b parameter) - higher = harder */
    difficulty: number;

    /** Item discrimination (a parameter) - how well it differentiates ability levels */
    discrimination: number;

    /** Guessing parameter (c parameter) - probability of correct guess */
    guessing: number;
}

// ============================================================================
// ANSWER ANALYSIS
// ============================================================================

export interface AnswerAnalysis {
    /** The student's submitted answer */
    submittedAnswer: string;

    /** The correct answer */
    correctAnswer: string;

    /** Whether the answer was correct */
    isCorrect: boolean;

    /** How far the answer was from correct (0-1, 0 = exact match) */
    distanceFromCorrect: number;

    /** Time taken to answer (ms) */
    timeTaken: number;

    /** Number of hints used */
    hintsUsed: number;

    /** Confidence level (if collected, 1-5) */
    confidenceLevel?: number;

    /** Was this a first attempt or retry? */
    attemptNumber: number;
}

// ============================================================================
// KNOWLEDGE STATE (for Knowledge Tracing)
// ============================================================================

export interface KnowledgeState {
    /** Topic ID -> Mastery probability (0-1) */
    masteryByTopic: Record<string, number>;

    /** Topic ID -> Last practiced timestamp */
    lastPracticed: Record<string, Date>;

    /** Topic ID -> Forgetting curve decay rate */
    decayRate: Record<string, number>;

    /** Topic ID -> Number of times practiced */
    practiceCount: Record<string, number>;

    /** Overall estimated ability (theta in IRT) */
    estimatedAbility: number;

    /** Confidence interval for ability estimate */
    abilityConfidence: number;
}

// ============================================================================
// SPACED REPETITION STATE
// ============================================================================

export interface SpacedRepetitionState {
    /** Item ID -> Next review date */
    nextReviewDates: Record<string, Date>;

    /** Item ID -> Easiness factor (SM-2 EF) */
    easinessFactors: Record<string, number>;

    /** Item ID -> Current interval in days */
    intervals: Record<string, number>;

    /** Item ID -> Number of correct repetitions */
    repetitions: Record<string, number>;

    /** Items due for review today */
    dueItems: string[];
}

// ============================================================================
// COMPREHENSIVE STUDENT LEARNING STATE
// ============================================================================

export interface StudentLearningState {
    userId: string;

    /** Performance metrics */
    performance: PerformanceMetrics;

    /** Time-based metrics */
    temporal: TemporalMetrics;

    /** Engagement metrics */
    engagement: EngagementMetrics;

    /** Knowledge tracing state */
    knowledge: KnowledgeState;

    /** Spaced repetition state */
    spacedRepetition: SpacedRepetitionState;

    /** Last updated timestamp */
    lastUpdated: Date;

    /** Exam readiness score (0-100) */
    examReadinessScore: number;

    /** Risk level for upcoming exam */
    riskLevel: 'low' | 'medium' | 'high' | 'critical';

    /** Recommended focus areas */
    recommendedFocusAreas: string[];
}

// ============================================================================
// SESSION TRACKING
// ============================================================================

export interface StudySession {
    sessionId: string;
    userId: string;
    startTime: Date;
    endTime?: Date;

    /** Questions attempted in this session */
    questionsAttempted: AnswerAnalysis[];

    /** Total focus time (excluding pauses) */
    focusTimeMs: number;

    /** Number of long pauses (>60s) */
    pauseCount: number;

    /** Topics covered */
    topicsCovered: string[];

    /** Session type (learning, review, exam_prep, practice) */
    sessionType: 'learning' | 'review' | 'exam_prep' | 'practice';
}

// ============================================================================
// ADAPTIVE RECOMMENDATIONS
// ============================================================================

export interface AdaptiveRecommendation {
    type: 'question' | 'topic' | 'review' | 'break' | 'concept';
    priority: 'high' | 'medium' | 'low';

    /** What to study/practice */
    target: string;
    targetId: string;

    /** Why this is recommended */
    reason: string;

    /** Estimated time to complete */
    estimatedMinutes: number;

    /** Expected impact on readiness score */
    expectedImpact: number;

    /** Optimal difficulty for this user on this topic */
    recommendedDifficulty: number;
}
