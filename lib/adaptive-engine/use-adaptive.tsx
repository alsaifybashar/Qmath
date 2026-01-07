'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import {
    AdaptiveLearningEngine,
    QuestionItem,
    StudentLearningState,
    AnswerAnalysis,
    AdaptiveRecommendation
} from '@/lib/adaptive-engine/engine';

// ============================================================================
// CONTEXT TYPES
// ============================================================================

interface AdaptiveContextType {
    // Engine instance
    engine: AdaptiveLearningEngine | null;

    // Current state
    studentState: StudentLearningState | null;
    currentQuestion: QuestionItem | null;
    isLoading: boolean;

    // Session management
    isSessionActive: boolean;
    startSession: (type?: 'learning' | 'review' | 'exam_prep' | 'practice') => void;
    endSession: () => void;

    // Question flow
    selectNextQuestion: (availableQuestions: QuestionItem[], targetTopicId?: string) => QuestionItem | null;
    submitAnswer: (answer: string, timeTaken: number, hintsUsed?: number) => SubmitResult;

    // State access
    getTopicMastery: (topicId: string) => number;
    getRecommendations: (count?: number) => AdaptiveRecommendation[];
    getExamReadiness: () => number;

    // Configuration
    setExamDate: (date: Date) => void;

    // Scaffolding
    shouldScaffold: boolean;
    scaffoldQuestion: QuestionItem | null;
    resetScaffold: () => void;
}

interface SubmitResult {
    isCorrect: boolean;
    masteryChange: number;
    abilityChange: number;
    shouldScaffold: boolean;
    nextReviewDate: Date | null;
    feedback: string;
}

// ============================================================================
// CONTEXT
// ============================================================================

const AdaptiveContext = createContext<AdaptiveContextType | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface AdaptiveProviderProps {
    children: React.ReactNode;
    userId: string;
    initialState?: Partial<StudentLearningState>;
}

export function AdaptiveProvider({ children, userId, initialState }: AdaptiveProviderProps) {
    const [engine] = useState(() => new AdaptiveLearningEngine(userId, initialState));
    const [studentState, setStudentState] = useState<StudentLearningState | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<QuestionItem | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [shouldScaffold, setShouldScaffold] = useState(false);
    const [scaffoldQuestion, setScaffoldQuestion] = useState<QuestionItem | null>(null);

    // Load saved state on mount
    useEffect(() => {
        const savedState = localStorage.getItem(`qmath_state_${userId}`);
        if (savedState) {
            try {
                engine.importState(savedState);
            } catch (e) {
                console.warn('Failed to load saved state:', e);
            }
        }
        setStudentState(engine.getStudentState());
    }, [engine, userId]);

    // Save state periodically
    useEffect(() => {
        if (!studentState) return;

        const saveInterval = setInterval(() => {
            const state = engine.exportState();
            localStorage.setItem(`qmath_state_${userId}`, state);
        }, 30000); // Save every 30 seconds

        return () => clearInterval(saveInterval);
    }, [engine, userId, studentState]);

    // Start session
    const startSession = useCallback((type: 'learning' | 'review' | 'exam_prep' | 'practice' = 'practice') => {
        engine.startSession(type);
        setIsSessionActive(true);
        setStudentState(engine.getStudentState());
    }, [engine]);

    // End session
    const endSession = useCallback(() => {
        engine.endSession();
        setIsSessionActive(false);
        setStudentState(engine.getStudentState());

        // Save state
        const state = engine.exportState();
        localStorage.setItem(`qmath_state_${userId}`, state);
    }, [engine, userId]);

    // Select next question
    const selectNextQuestion = useCallback((
        availableQuestions: QuestionItem[],
        targetTopicId?: string
    ): QuestionItem | null => {
        const question = engine.selectNextQuestion(availableQuestions, targetTopicId);
        if (question) {
            setCurrentQuestion(question);
            setShouldScaffold(false);
            setScaffoldQuestion(null);
        }
        return question;
    }, [engine]);

    // Submit answer
    const submitAnswer = useCallback((
        answer: string,
        timeTaken: number,
        hintsUsed: number = 0
    ): SubmitResult => {
        if (!currentQuestion) {
            return {
                isCorrect: false,
                masteryChange: 0,
                abilityChange: 0,
                shouldScaffold: false,
                nextReviewDate: null,
                feedback: 'No question selected'
            };
        }

        setIsLoading(true);

        // Calculate distance from correct answer (simple for now)
        const isCorrect = answer.toLowerCase().trim() ===
            currentQuestion.correctAnswer.toLowerCase().trim();

        const distanceFromCorrect = isCorrect ? 0 : 1;

        const analysis: AnswerAnalysis = {
            submittedAnswer: answer,
            correctAnswer: currentQuestion.correctAnswer,
            isCorrect,
            distanceFromCorrect,
            timeTaken,
            hintsUsed,
            attemptNumber: 1
        };

        const result = engine.processAnswer(currentQuestion, analysis);

        setStudentState(engine.getStudentState());
        setIsLoading(false);

        // Handle scaffolding
        if (result.shouldScaffold && currentQuestion.scaffoldQuestions?.length) {
            setShouldScaffold(true);
            setScaffoldQuestion(currentQuestion.scaffoldQuestions[0]);
        }

        // Generate feedback
        let feedback = '';
        if (isCorrect) {
            if (result.masteryUpdate > 0.1) {
                feedback = 'Excellent! Your mastery is improving significantly!';
            } else if (result.masteryUpdate > 0) {
                feedback = 'Correct! Keep up the good work.';
            } else {
                feedback = 'Correct!';
            }
        } else {
            if (result.shouldScaffold) {
                feedback = "Let's break this down into simpler steps.";
            } else {
                feedback = `The correct answer was: ${currentQuestion.correctAnswer}`;
            }
        }

        return {
            isCorrect,
            masteryChange: result.masteryUpdate,
            abilityChange: result.abilityUpdate,
            shouldScaffold: result.shouldScaffold,
            nextReviewDate: result.nextReviewDate,
            feedback
        };
    }, [currentQuestion, engine]);

    // Get topic mastery
    const getTopicMastery = useCallback((topicId: string): number => {
        return engine.getTopicMastery(topicId);
    }, [engine]);

    // Get recommendations
    const getRecommendations = useCallback((count: number = 3): AdaptiveRecommendation[] => {
        return engine.getRecommendations(count);
    }, [engine]);

    // Get exam readiness
    const getExamReadiness = useCallback((): number => {
        return engine.getStudentState().examReadinessScore;
    }, [engine]);

    // Set exam date
    const setExamDate = useCallback((date: Date): void => {
        engine.setExamDate(date);
        setStudentState(engine.getStudentState());
    }, [engine]);

    // Reset scaffold
    const resetScaffold = useCallback(() => {
        setShouldScaffold(false);
        setScaffoldQuestion(null);
    }, []);

    const value = useMemo(() => ({
        engine,
        studentState,
        currentQuestion,
        isLoading,
        isSessionActive,
        startSession,
        endSession,
        selectNextQuestion,
        submitAnswer,
        getTopicMastery,
        getRecommendations,
        getExamReadiness,
        setExamDate,
        shouldScaffold,
        scaffoldQuestion,
        resetScaffold
    }), [
        engine,
        studentState,
        currentQuestion,
        isLoading,
        isSessionActive,
        startSession,
        endSession,
        selectNextQuestion,
        submitAnswer,
        getTopicMastery,
        getRecommendations,
        getExamReadiness,
        setExamDate,
        shouldScaffold,
        scaffoldQuestion,
        resetScaffold
    ]);

    return (
        <AdaptiveContext.Provider value={value}>
            {children}
        </AdaptiveContext.Provider>
    );
}

// ============================================================================
// HOOK
// ============================================================================

export function useAdaptive(): AdaptiveContextType {
    const context = useContext(AdaptiveContext);
    if (!context) {
        throw new Error('useAdaptive must be used within an AdaptiveProvider');
    }
    return context;
}

// ============================================================================
// ADDITIONAL HOOKS
// ============================================================================

/**
 * Hook for tracking mastery on a specific topic
 */
export function useTopicMastery(topicId: string): number {
    const { getTopicMastery, studentState } = useAdaptive();

    return useMemo(() => {
        return getTopicMastery(topicId);
    }, [getTopicMastery, topicId, studentState]);
}

/**
 * Hook for getting personalized recommendations
 */
export function useRecommendations(count: number = 3): AdaptiveRecommendation[] {
    const { getRecommendations, studentState } = useAdaptive();

    return useMemo(() => {
        return getRecommendations(count);
    }, [getRecommendations, count, studentState]);
}

/**
 * Hook for exam readiness tracking
 */
export function useExamReadiness(): {
    score: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    daysUntilExam: number | null;
    focusAreas: string[];
} {
    const { studentState } = useAdaptive();

    return useMemo(() => ({
        score: studentState?.examReadinessScore ?? 0,
        riskLevel: studentState?.riskLevel ?? 'critical',
        daysUntilExam: studentState?.temporal.daysUntilExam ?? null,
        focusAreas: studentState?.recommendedFocusAreas ?? []
    }), [studentState]);
}

/**
 * Hook for study streak
 */
export function useStreak(): {
    current: number;
    longest: number;
} {
    const { studentState } = useAdaptive();

    return useMemo(() => ({
        current: studentState?.engagement.currentStreak ?? 0,
        longest: studentState?.engagement.longestStreak ?? 0
    }), [studentState]);
}

/**
 * Hook for performance stats
 */
export function usePerformanceStats(): {
    accuracy: number;
    totalSolved: number;
    avgTimePerQuestion: number;
    peakPerformanceWindow: string;
} {
    const { studentState } = useAdaptive();

    return useMemo(() => ({
        accuracy: studentState?.performance.accuracyRate ?? 0,
        totalSolved: studentState?.engagement.totalQuestionsSolved ?? 0,
        avgTimePerQuestion: studentState?.temporal.avgTimePerQuestion ?? 0,
        peakPerformanceWindow: studentState?.temporal.peakPerformanceWindow ?? 'Unknown'
    }), [studentState]);
}
