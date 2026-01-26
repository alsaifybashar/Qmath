'use client';

import { useReducer, useEffect, useCallback, useState } from 'react';

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
    | { type: 'SUBMIT_ANSWER'; payload: { isCorrect: boolean; feedback: string; misconception?: string; shouldProbePrerequisite?: boolean } }
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

    // Load questions (mock for now)
    useEffect(() => {
        loadQuestions(topicId);
    }, [topicId]);

    const loadQuestions = useCallback((topic?: string) => {
        // Mock questions - in production this would fetch from API/adaptive engine
        const mockQuestions: QuestionWithHelp[] = getMockQuestions(topic);
        dispatch({ type: 'SET_QUESTIONS', payload: mockQuestions });
        dispatch({ type: 'START_SESSION' });
    }, []);

    const submitAnswer = useCallback((answer: string, correctAnswer: any, question?: QuestionWithHelp) => {
        // Simple validation - in production this would call the grade API
        const isCorrect = validateAnswer(answer, correctAnswer);

        let feedback = isCorrect
            ? "Great job! That's correct."
            : "Not quite. Let's try again or get some help.";
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

        // If correct, auto-advance after delay
        if (isCorrect) {
            setTimeout(() => {
                dispatch({ type: 'CLEAR_FEEDBACK' });
                dispatch({ type: 'NEXT_QUESTION' });
            }, 1500);
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
    if (typeof correctAnswer === 'string') {
        return answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    }
    if (typeof correctAnswer === 'number') {
        return parseFloat(answer) === correctAnswer;
    }
    return false;
}

function getMockQuestions(topic?: string): QuestionWithHelp[] {
    // Mock questions for demonstration
    return [
        {
            id: 'q1',
            type: 'numeric_input',
            topicId: topic || 'derivatives',
            difficulty: 3,
            content: {
                question: {
                    text: "Find the derivative of:",
                    math: "f(x) = x^2 + 3x"
                },
                answer: { exact: "2x+3" },
            },
            correctAnswer: "2x+3",
            // NEW: Common wrong answers with specific feedback
            commonWrongAnswers: [
                {
                    answer: "2x",
                    feedback: "You got the first term right (x² → 2x), but you forgot the derivative of 3x. The derivative of 3x is just 3.",
                    misconception: "incomplete-sum-rule"
                },
                {
                    answer: "x+3",
                    feedback: "Remember the power rule: when differentiating x², multiply by the exponent (2) and reduce it by 1.",
                    misconception: "power-rule-error"
                },
                {
                    answer: "2x+3x",
                    feedback: "The derivative of 3x is just 3, not 3x. The constant multiplier stays, but x disappears.",
                    misconception: "linear-term-derivative"
                }
            ],
            prerequisites: [
                { topicId: "power-rule-basics", description: "Understanding the power rule" },
                { topicId: "sum-rule", description: "Derivative of sums" }
            ],
            helps: {
                nudgeHint: "Think about the power rule for each term.",
                guidedHint: "For x², bring down the exponent and reduce it by 1. For 3x, what's the derivative of a linear term?",
                stepBreakdown: {
                    intro: "Let's find the derivative step by step.",
                    steps: [
                        { prompt: "What is the derivative of x²?", correctAnswer: "2x", hint: "Power rule: d/dx(x^n) = nx^(n-1)" },
                        { prompt: "What is the derivative of 3x?", correctAnswer: "3", hint: "The derivative of ax is just a" },
                        { prompt: "What's the final answer (sum of parts)?", correctAnswer: "2x+3" }
                    ],
                    conclusion: "Great! The derivative of x² + 3x is 2x + 3."
                },
                workedExample: {
                    similarQuestion: "Find d/dx of x³ + 2x",
                    solution: [
                        { step: 1, action: "Apply power rule to x³", result: "3x²", explanation: "Bring down 3, reduce exponent to 2" },
                        { step: 2, action: "Apply power rule to 2x", result: "2", explanation: "Derivative of 2x is just 2" },
                        { step: 3, action: "Combine the results", result: "3x² + 2" }
                    ]
                },
                relatedFormulas: [
                    { name: "Power Rule", latex: "\\frac{d}{dx}x^n = nx^{n-1}", explanation: "Multiply by the exponent, then reduce the exponent by 1" },
                    { name: "Sum Rule", latex: "\\frac{d}{dx}[f+g] = f' + g'", explanation: "The derivative of a sum is the sum of derivatives" }
                ],
                relatedTopics: ["power-rule", "sum-rule"]
            },
            aiContext: {
                conceptsTested: ["power rule", "sum rule", "differentiation"],
                commonMistakes: ["forgetting to reduce the exponent", "missing the coefficient"],
                prerequisiteTopics: ["exponents", "algebra basics"],
                teachingApproach: "Start with power rule concept, then show it applies term by term"
            }
        },
        {
            id: 'q2',
            type: 'multiple_choice',
            topicId: topic || 'derivatives',
            difficulty: 2,
            content: {
                question: { text: "Which rule should you apply to find the derivative of sin(x)?" },
                options: [
                    { id: 'a', label: "Power Rule", isCorrect: false },
                    { id: 'b', label: "Trigonometric Rule", isCorrect: true },
                    { id: 'c', label: "Chain Rule", isCorrect: false },
                    { id: 'd', label: "Product Rule", isCorrect: false }
                ],
                correctOptionId: 'b'
            },
            correctAnswer: "b",
            helps: {
                nudgeHint: "Think about what type of function sin(x) is.",
                guidedHint: "sin(x) is a trigonometric function. There are specific rules for trig derivatives.",
                relatedFormulas: [
                    { name: "Sine Derivative", latex: "\\frac{d}{dx}\\sin(x) = \\cos(x)" },
                    { name: "Cosine Derivative", latex: "\\frac{d}{dx}\\cos(x) = -\\sin(x)" }
                ],
                relatedTopics: ["trig-derivatives"]
            },
            aiContext: {
                conceptsTested: ["trigonometric derivatives"],
                commonMistakes: ["confusing with other rules"],
                prerequisiteTopics: ["basic trigonometry"],
            }
        },
        {
            id: 'q3',
            type: 'numeric_input',
            topicId: topic || 'derivatives',
            difficulty: 4,
            content: {
                question: {
                    text: "If f(x) = 3x² - 2x + 1, find f'(2).",
                    math: "f(x) = 3x^2 - 2x + 1"
                },
                answer: { exact: 10 },
            },
            correctAnswer: "10",
            commonWrongAnswers: [
                {
                    answer: "6x-2",
                    feedback: "That's the derivative f'(x), but you need to evaluate it at x=2. Substitute 2 into 6x - 2.",
                    misconception: "forgot-to-evaluate"
                },
                {
                    answer: "12",
                    feedback: "You calculated 6(2) = 12, but forgot to subtract 2. The answer is 6(2) - 2 = 10.",
                    misconception: "arithmetic-error"
                },
                {
                    answer: "8",
                    feedback: "Check your arithmetic: f'(x) = 6x - 2, so f'(2) = 6(2) - 2 = 12 - 2 = 10.",
                    misconception: "arithmetic-error"
                }
            ],
            helps: {
                nudgeHint: "First find the derivative, then substitute x = 2.",
                guidedHint: "f'(x) = 6x - 2. Now evaluate at x = 2: f'(2) = 6(2) - 2 = ?",
                stepBreakdown: {
                    intro: "Let's solve this in two steps: differentiate, then evaluate.",
                    steps: [
                        { prompt: "What is f'(x)?", correctAnswer: "6x-2", hint: "Use power rule on each term" },
                        { prompt: "What is f'(2)?", correctAnswer: "10", hint: "Substitute 2 for x: 6(2) - 2" }
                    ],
                    conclusion: "f'(2) = 6(2) - 2 = 12 - 2 = 10"
                },
                relatedFormulas: [
                    { name: "Power Rule", latex: "\\frac{d}{dx}x^n = nx^{n-1}" },
                    { name: "Constant Rule", latex: "\\frac{d}{dx}c = 0" }
                ],
                relatedTopics: ["power-rule", "evaluating-derivatives"]
            },
            aiContext: {
                conceptsTested: ["power rule", "derivative evaluation"],
                commonMistakes: ["forgetting to substitute", "arithmetic errors"],
                prerequisiteTopics: ["differentiation basics"],
            }
        },
        // NEW: Solution Builder question type
        {
            id: 'q4',
            type: 'solution_builder',
            topicId: topic || 'algebra',
            difficulty: 3,
            content: {
                question: {
                    text: "Solve the equation step by step:",
                    math: "2x + 5 = 13"
                },
                initialEquation: "2x + 5 = 13",
                steps: [
                    {
                        id: 'step1',
                        operation: 'subtract',
                        operationLabel: 'Subtract 5 from both sides',
                        value: '5',
                        resultEquation: "2x = 8",
                        hint: "To isolate the term with x, we need to remove the +5 from the left side."
                    },
                    {
                        id: 'step2',
                        operation: 'divide',
                        operationLabel: 'Divide both sides by 2',
                        value: '2',
                        resultEquation: "x = 4",
                        hint: "Now divide both sides by the coefficient of x to solve for x."
                    }
                ],
                availableOperations: [
                    { id: 'add', label: 'Add to both sides', requiresValue: true, valuePlaceholder: 'What number?' },
                    { id: 'subtract', label: 'Subtract from both sides', requiresValue: true, valuePlaceholder: 'What number?' },
                    { id: 'multiply', label: 'Multiply both sides by', requiresValue: true, valuePlaceholder: 'What number?' },
                    { id: 'divide', label: 'Divide both sides by', requiresValue: true, valuePlaceholder: 'What number?' }
                ]
            },
            correctAnswer: "x=4",
            helps: {
                nudgeHint: "Start by isolating the term with x.",
                guidedHint: "First remove the constant term (+5) by subtracting, then divide to solve for x.",
                relatedFormulas: [
                    { name: "Solving Linear Equations", latex: "ax + b = c \\Rightarrow x = \\frac{c-b}{a}" }
                ],
                relatedTopics: ["linear-equations", "algebra-basics"]
            },
            aiContext: {
                conceptsTested: ["linear equations", "algebraic manipulation"],
                commonMistakes: ["wrong operation order", "arithmetic errors"],
                prerequisiteTopics: ["basic arithmetic", "equation balancing"],
            }
        }
    ];
}

// Export types for use in other components
export type { QuestionWithHelp, StudySessionState, AIMessage };
