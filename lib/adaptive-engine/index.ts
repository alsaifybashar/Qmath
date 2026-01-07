/**
 * Adaptive Learning Engine
 * 
 * A comprehensive adaptive learning system that combines:
 * - Item Response Theory (IRT) for ability estimation and question selection
 * - Bayesian Knowledge Tracing (BKT) for skill mastery tracking
 * - Spaced Repetition (SM-2 / FSRS) for optimal review scheduling
 * 
 * @example
 * ```typescript
 * import { AdaptiveLearningEngine, useAdaptive } from '@/lib/adaptive-engine';
 * 
 * // Create engine instance
 * const engine = new AdaptiveLearningEngine('user-123');
 * 
 * // Select next question
 * const nextQuestion = engine.selectNextQuestion(questionBank);
 * 
 * // Process answer
 * const result = engine.processAnswer(question, {
 *   submittedAnswer: 'x^2',
 *   correctAnswer: 'x^2',
 *   isCorrect: true,
 *   distanceFromCorrect: 0,
 *   timeTaken: 25000,
 *   hintsUsed: 0,
 *   attemptNumber: 1
 * });
 * ```
 */

// Main engine
export {
    AdaptiveLearningEngine,
    type QuestionItem
} from './engine';

// IRT (Item Response Theory)
export { IRTModel } from './irt';

// Knowledge Tracing
export {
    BayesianKnowledgeTracing,
    KnowledgeStateManager,
    type BKTParams
} from './knowledge-tracing';

// Spaced Repetition
export {
    SM2Algorithm,
    FSRSAlgorithm,
    SpacedRepetitionManager,
    type SM2Card,
    type FSRSCard,
    type SM2Quality,
    type FSRSRating
} from './spaced-repetition';

// Parameters and Types
export type {
    // Performance Metrics
    PerformanceMetrics,
    ErrorPattern,
    HintUsageStats,

    // Temporal Metrics
    TemporalMetrics,

    // Engagement Metrics
    EngagementMetrics,

    // Question Parameters
    QuestionParameters,
    IRTParameters,

    // Answer Analysis
    AnswerAnalysis,

    // Knowledge State
    KnowledgeState,

    // Spaced Repetition State
    SpacedRepetitionState,

    // Main Student State
    StudentLearningState,

    // Session
    StudySession,

    // Recommendations
    AdaptiveRecommendation
} from './parameters';

// React Hooks
export {
    AdaptiveProvider,
    useAdaptive,
    useTopicMastery,
    useRecommendations,
    useExamReadiness,
    useStreak,
    usePerformanceStats
} from './use-adaptive';
