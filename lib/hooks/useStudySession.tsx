'use client';

import { useReducer, useEffect, useCallback, useState } from 'react';
import { classifyError } from '@/app/actions/error-classifier';
import type { ErrorType } from '@/app/actions/error-classifier';
import { checkMathEquivalence } from '@/lib/utils/mathEquivalence';
import { getStudyQuestions } from '@/app/actions/study-questions';

// Types
// Common wrong answer structure for diagnostic feedback
interface CommonWrongAnswer {
    answer: string;
    feedback: string;
    misconception?: string;
}

// Prerequisite question for probing gaps
interface PrerequisiteProbe {
    topicId: string;
    questionId?: string;
    description: string;
}

interface QuestionWithHelp {
    id: string;
    type: 'multiple_choice' | 'numeric_input' | 'fill_blank' | 'guided_steps' | 'drag_drop' | 'toggle' | 'expression_builder' | 'solution_builder';
    topicId: string;
    difficulty: number;
    content: any;
    correctAnswer?: any;
    // NEW: Common wrong answers with targeted feedback
    commonWrongAnswers?: CommonWrongAnswer[];
    // NEW: Prerequisites to probe if student fails
    prerequisites?: PrerequisiteProbe[];
    helps: {
        nudgeHint: string;
        guidedHint: string;
        stepBreakdown?: {
            intro: string;
            steps: Array<{
                prompt: string;
                correctAnswer: string;
                hint?: string;
            }>;
            conclusion: string;
        };
        workedExample?: {
            similarQuestion: string;
            solution: Array<{
                step: number;
                action: string;
                result: string;
                explanation?: string;
            }>;
        };
        relatedFormulas: Array<{
            name: string;
            latex: string;
            explanation?: string;
        }>;
        relatedTopics: string[];
    };
    aiContext: {
        conceptsTested: string[];
        commonMistakes: string[];
        prerequisiteTopics: string[];
        teachingApproach?: string;
    };
}

interface AIMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface StudySessionState {
    // Current question
    currentQuestion: QuestionWithHelp | null;
    questionIndex: number;
    totalQuestions: number;
    questions: QuestionWithHelp[];

    // User's attempt on current question
    currentAttempt: {
        answer: string | null;
        attempts: number;
        hintsUsed: number;
        startTime: Date;
        confidence: number; // 1-5 scale, 0 = not set
    };

    // Help state
    helpState: {
        currentLevel: 0 | 1 | 2 | 3 | 4 | 5;
        hintsRevealed: number[];
        stepBreakdownActive: boolean;
        workedExampleShown: boolean;
    };

    // AI state
    aiState: {
        isOpen: boolean;
        messages: AIMessage[];
        isLoading: boolean;
    };

    // Session progress
    sessionProgress: {
        correct: number;
        incorrect: number;
        skipped: number;
        xpEarned: number;
        startTime: Date;
    };

    // Feedback state
    feedbackState: {
        isShowing: boolean;
        isCorrect: boolean | null;
        message: string;
        misconception?: string; // Detected misconception from common wrong answers
        shouldProbePrerequisite?: boolean; // Flag to trigger prerequisite check
        errorType?: ErrorType; // AI-classified error type
    };

    // Session state
    isSessionActive: boolean;
    isSessionComplete: boolean;
}

type StudySessionAction =
    | { type: 'SET_QUESTIONS'; payload: QuestionWithHelp[] }
    | { type: 'NEXT_QUESTION' }
    | { type: 'PREVIOUS_QUESTION' }
    | { type: 'SKIP_QUESTION' }
    | { type: 'SET_ANSWER'; payload: string }
    | { type: 'SET_CONFIDENCE'; payload: number }
    | { type: 'SUBMIT_ANSWER'; payload: { isCorrect: boolean; feedback: string; misconception?: string; shouldProbePrerequisite?: boolean; errorType?: ErrorType } }
    | { type: 'UPDATE_FEEDBACK'; payload: { message: string; errorType?: ErrorType } }
    | { type: 'CLEAR_FEEDBACK' }
    | { type: 'REVEAL_HINT'; payload: number }
    | { type: 'OPEN_AI' }
    | { type: 'CLOSE_AI' }
    | { type: 'TOGGLE_AI' }
    | { type: 'ADD_AI_MESSAGE'; payload: AIMessage }
    | { type: 'SET_AI_LOADING'; payload: boolean }
    | { type: 'START_SESSION' }
    | { type: 'END_SESSION' };

const initialState: StudySessionState = {
    currentQuestion: null,
    questionIndex: 0,
    totalQuestions: 0,
    questions: [],
    currentAttempt: {
        answer: null,
        attempts: 0,
        hintsUsed: 0,
        startTime: new Date(),
        confidence: 0,
    },
    helpState: {
        currentLevel: 0,
        hintsRevealed: [],
        stepBreakdownActive: false,
        workedExampleShown: false,
    },
    aiState: {
        isOpen: false,
        messages: [],
        isLoading: false,
    },
    sessionProgress: {
        correct: 0,
        incorrect: 0,
        skipped: 0,
        xpEarned: 0,
        startTime: new Date(),
    },
    feedbackState: {
        isShowing: false,
        isCorrect: null,
        message: '',
    },
    isSessionActive: false,
    isSessionComplete: false,
};

function studySessionReducer(state: StudySessionState, action: StudySessionAction): StudySessionState {
    switch (action.type) {
        case 'SET_QUESTIONS':
            return {
                ...state,
                questions: action.payload,
                totalQuestions: action.payload.length,
                currentQuestion: action.payload[0] || null,
                questionIndex: 0,
            };

        case 'NEXT_QUESTION':
            const nextIndex = Math.min(state.questionIndex + 1, state.totalQuestions - 1);
            const isComplete = state.questionIndex >= state.totalQuestions - 1;
            return {
                ...state,
                questionIndex: nextIndex,
                currentQuestion: state.questions[nextIndex] || null,
                currentAttempt: {
                    answer: null,
                    attempts: 0,
                    hintsUsed: 0,
                    startTime: new Date(),
                    confidence: 0,
                },
                helpState: {
                    currentLevel: 0,
                    hintsRevealed: [],
                    stepBreakdownActive: false,
                    workedExampleShown: false,
                },
                feedbackState: {
                    isShowing: false,
                    isCorrect: null,
                    message: '',
                },
                isSessionComplete: isComplete,
            };

        case 'PREVIOUS_QUESTION':
            const prevIndex = Math.max(state.questionIndex - 1, 0);
            return {
                ...state,
                questionIndex: prevIndex,
                currentQuestion: state.questions[prevIndex] || null,
                currentAttempt: {
                    answer: null,
                    attempts: 0,
                    hintsUsed: 0,
                    startTime: new Date(),
                    confidence: 0,
                },
                helpState: {
                    currentLevel: 0,
                    hintsRevealed: [],
                    stepBreakdownActive: false,
                    workedExampleShown: false,
                },
                feedbackState: {
                    isShowing: false,
                    isCorrect: null,
                    message: '',
                },
            };

        case 'SKIP_QUESTION':
            const skipToIndex = Math.min(state.questionIndex + 1, state.totalQuestions - 1);
            return {
                ...state,
                questionIndex: skipToIndex,
                currentQuestion: state.questions[skipToIndex] || null,
                currentAttempt: {
                    answer: null,
                    attempts: 0,
                    hintsUsed: 0,
                    startTime: new Date(),
                    confidence: 0,
                },
                helpState: {
                    currentLevel: 0,
                    hintsRevealed: [],
                    stepBreakdownActive: false,
                    workedExampleShown: false,
                },
                feedbackState: {
                    isShowing: false,
                    isCorrect: null,
                    message: '',
                },
                sessionProgress: {
                    ...state.sessionProgress,
                    skipped: state.sessionProgress.skipped + 1,
                },
            };

        case 'SET_ANSWER':
            return {
                ...state,
                currentAttempt: {
                    ...state.currentAttempt,
                    answer: action.payload,
                },
            };

        case 'SET_CONFIDENCE':
            return {
                ...state,
                currentAttempt: {
                    ...state.currentAttempt,
                    confidence: action.payload,
                },
            };

        case 'SUBMIT_ANSWER':
            const xpGain = action.payload.isCorrect
                ? 10 + (state.currentQuestion?.difficulty || 1) * 2 - state.currentAttempt.hintsUsed * 2
                : 0;
            return {
                ...state,
                currentAttempt: {
                    ...state.currentAttempt,
                    attempts: state.currentAttempt.attempts + 1,
                },
                sessionProgress: {
                    ...state.sessionProgress,
                    correct: state.sessionProgress.correct + (action.payload.isCorrect ? 1 : 0),
                    incorrect: state.sessionProgress.incorrect + (action.payload.isCorrect ? 0 : 1),
                    xpEarned: state.sessionProgress.xpEarned + xpGain,
                },
                feedbackState: {
                    isShowing: true,
                    isCorrect: action.payload.isCorrect,
                    message: action.payload.feedback,
                    misconception: action.payload.misconception,
                    shouldProbePrerequisite: action.payload.shouldProbePrerequisite,
                    errorType: action.payload.errorType,
                },
            };

        case 'UPDATE_FEEDBACK':
            return {
                ...state,
                feedbackState: {
                    ...state.feedbackState,
                    message: action.payload.message,
                    errorType: action.payload.errorType || state.feedbackState.errorType,
                },
            };

        case 'CLEAR_FEEDBACK':
            return {
                ...state,
                feedbackState: {
                    isShowing: false,
                    isCorrect: null,
                    message: '',
                },
            };

        case 'REVEAL_HINT':
            return {
                ...state,
                currentAttempt: {
                    ...state.currentAttempt,
                    hintsUsed: state.currentAttempt.hintsUsed + 1,
                },
                helpState: {
                    ...state.helpState,
                    currentLevel: Math.max(state.helpState.currentLevel, action.payload) as 0 | 1 | 2 | 3 | 4 | 5,
                    hintsRevealed: [...new Set([...state.helpState.hintsRevealed, action.payload])],
                },
            };

        case 'OPEN_AI':
            return {
                ...state,
                aiState: {
                    ...state.aiState,
                    isOpen: true,
                },
            };

        case 'CLOSE_AI':
            return {
                ...state,
                aiState: {
                    ...state.aiState,
                    isOpen: false,
                },
            };

        case 'TOGGLE_AI':
            return {
                ...state,
                aiState: {
                    ...state.aiState,
                    isOpen: !state.aiState.isOpen,
                },
            };

        case 'ADD_AI_MESSAGE':
            return {
                ...state,
                aiState: {
                    ...state.aiState,
                    messages: [...state.aiState.messages, action.payload],
                },
            };

        case 'SET_AI_LOADING':
            return {
                ...state,
                aiState: {
                    ...state.aiState,
                    isLoading: action.payload,
                },
            };

        case 'START_SESSION':
            return {
                ...state,
                isSessionActive: true,
                isSessionComplete: false,
                sessionProgress: {
                    ...state.sessionProgress,
                    startTime: new Date(),
                },
            };

        case 'END_SESSION':
            return {
                ...state,
                isSessionActive: false,
                isSessionComplete: true,
            };

        default:
            return state;
    }
}

export function useStudySession(topicId?: string) {
    const [state, dispatch] = useReducer(studySessionReducer, initialState);
    const [sessionTime, setSessionTime] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [questionsError, setQuestionsError] = useState<string | null>(null);

    // Session timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (state.isSessionActive && !state.isSessionComplete) {
            interval = setInterval(() => {
                setSessionTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [state.isSessionActive, state.isSessionComplete]);

    // Load questions from DB when topicId changes
    useEffect(() => {
        loadQuestions(topicId);
    }, [topicId]); // eslint-disable-line react-hooks/exhaustive-deps

    const loadQuestions = useCallback(async (topic?: string) => {
        setIsLoading(true);
        setQuestionsError(null);
        try {
            const fetchedQuestions = await getStudyQuestions(topic ?? '');
            dispatch({ type: 'SET_QUESTIONS', payload: fetchedQuestions });
            dispatch({ type: 'START_SESSION' });
        } catch (err) {
            console.error('[Study] Failed to load questions:', err);
            setQuestionsError('Kunde inte ladda frågor. Försök ladda om sidan.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const submitAnswer = useCallback((answer: string, correctAnswer: any, question?: QuestionWithHelp) => {
        // Simple validation - in production this would call the grade API
        const isCorrect = validateAnswer(answer, correctAnswer);

        let feedback = isCorrect
            ? 'Du svarade rätt!'
            : 'Inte riktigt, försök igen!';
        let misconception: string | undefined;
        let shouldProbePrerequisite = false;

        // Check common wrong answers for specific feedback
        if (!isCorrect && question?.commonWrongAnswers) {
            const matchedWrongAnswer = question.commonWrongAnswers.find(
                cwa => cwa.answer.toLowerCase().trim() === answer.toLowerCase().trim()
            );
            if (matchedWrongAnswer) {
                feedback = matchedWrongAnswer.feedback;
                misconception = matchedWrongAnswer.misconception;
                // If we detected a misconception, we might want to probe prerequisites
                if (question.prerequisites && question.prerequisites.length > 0) {
                    shouldProbePrerequisite = true;
                }
            }
        }

        dispatch({ type: 'SUBMIT_ANSWER', payload: { isCorrect, feedback, misconception, shouldProbePrerequisite } });

        // If wrong and no specific match from commonWrongAnswers, use AI classification
        if (!isCorrect && !misconception && question) {
            classifyError({
                questionText: question.content?.question?.text || '',
                questionMath: question.content?.question?.math,
                correctAnswer: String(correctAnswer),
                studentAnswer: answer,
                topicId: question.topicId,
                conceptsTested: question.aiContext?.conceptsTested,
            }).then((classification) => {
                // Update feedback with AI classification
                dispatch({
                    type: 'UPDATE_FEEDBACK',
                    payload: {
                        message: classification.feedback,
                        errorType: classification.errorType,
                    },
                });
                console.log(`[Study] Error classified: ${classification.errorType} (${classification.confidence})`);
            }).catch((err) => {
                console.error('[Study] Error classification failed:', err);
            });
        }

        // If correct, auto-advance after delay (2200ms gives celebration time to show)
        if (isCorrect) {
            setTimeout(() => {
                dispatch({ type: 'CLEAR_FEEDBACK' });
                dispatch({ type: 'NEXT_QUESTION' });
            }, 2200);
        }
    }, []);

    const revealHint = useCallback((level: number) => {
        dispatch({ type: 'REVEAL_HINT', payload: level });
    }, []);

    const openAI = useCallback(() => {
        dispatch({ type: 'OPEN_AI' });
    }, []);

    const closeAI = useCallback(() => {
        dispatch({ type: 'CLOSE_AI' });
    }, []);

    const toggleAI = useCallback(() => {
        dispatch({ type: 'TOGGLE_AI' });
    }, []);

    const nextQuestion = useCallback(() => {
        dispatch({ type: 'CLEAR_FEEDBACK' });
        dispatch({ type: 'NEXT_QUESTION' });
    }, []);

    const previousQuestion = useCallback(() => {
        dispatch({ type: 'CLEAR_FEEDBACK' });
        dispatch({ type: 'PREVIOUS_QUESTION' });
    }, []);

    const skipQuestion = useCallback(() => {
        dispatch({ type: 'SKIP_QUESTION' });
    }, []);

    const setAnswer = useCallback((answer: string) => {
        dispatch({ type: 'SET_ANSWER', payload: answer });
    }, []);

    const setConfidence = useCallback((confidence: number) => {
        dispatch({ type: 'SET_CONFIDENCE', payload: confidence });
    }, []);

    const clearFeedback = useCallback(() => {
        dispatch({ type: 'CLEAR_FEEDBACK' });
    }, []);

    const endSession = useCallback(() => {
        dispatch({ type: 'END_SESSION' });
    }, []);

    return {
        // State
        ...state,
        sessionTime,
        isLoading,
        questionsError,
        progress: state.totalQuestions > 0
            ? Math.round((state.questionIndex / state.totalQuestions) * 100)
            : 0,

        // Actions
        submitAnswer,
        setAnswer,
        setConfidence,
        revealHint,
        openAI,
        closeAI,
        toggleAI,
        nextQuestion,
        previousQuestion,
        skipQuestion,
        clearFeedback,
        endSession,
        loadQuestions,
    };
}

// Helper functions
function validateAnswer(answer: string, correctAnswer: any): boolean {
    return checkMathEquivalence(answer, correctAnswer);
}

// Export types for use in other components
export type { QuestionWithHelp, StudySessionState, AIMessage };
