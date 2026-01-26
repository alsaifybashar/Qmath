'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ChevronLeft, ChevronRight, CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import 'katex/dist/katex.min.css';

// Layout Components
import { FocusedStudyLayout } from '@/components/layout/FocusedStudyLayout';

// Question Components
import { MultipleChoiceInput } from '@/components/study/MultipleChoiceInput';
import { GuidedStepSession } from '@/components/study/GuidedStepSession';
import { FillBlankInput } from '@/components/study/FillBlankInput';
import { DragDropInput } from '@/components/study/DragDropInput';
import { ToggleInput } from '@/components/study/ToggleInput';
import { ExpressionBuilderInput } from '@/components/study/ExpressionBuilderInput';
import { SolutionBuilderInput } from '@/components/study/SolutionBuilderInput';

// Help Components
import { MinimalHelpPanel } from '@/components/study/MinimalHelpPanel';

// Hooks
import { useStudySession } from '@/lib/hooks/useStudySession';

// Dynamic KaTeX import
const BlockMath = dynamic(
    () => import('react-katex').then((mod) => mod.BlockMath),
    { ssr: false }
);

// Simple Numeric Input for Study Hub
function SimpleNumericInput({
    correctAnswer,
    onAnswer
}: {
    correctAnswer: string;
    onAnswer: (value: string, isCorrect: boolean) => void;
}) {
    const [value, setValue] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    const handleSubmit = () => {
        if (!value.trim()) return;
        const correct = value.trim().toLowerCase() === correctAnswer.toString().toLowerCase();
        setIsCorrect(correct);
        setIsSubmitted(true);
        onAnswer(value, correct);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isSubmitted) {
            handleSubmit();
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="flex gap-3 w-full max-w-md">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSubmitted}
                    placeholder="Type your answer..."
                    className={`flex-1 px-4 py-3 text-lg font-mono rounded-xl border-2 transition-all focus:outline-none ${isSubmitted
                        ? isCorrect
                            ? 'border-green-500 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300'
                            : 'border-red-500 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300'
                        : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:border-zinc-400 dark:focus:border-zinc-500 placeholder:text-zinc-400 dark:placeholder:text-zinc-500'
                        }`}
                />
                <button
                    onClick={handleSubmit}
                    disabled={!value.trim() || isSubmitted}
                    className="px-6 py-3 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:bg-zinc-200 dark:disabled:bg-zinc-700 text-white dark:text-zinc-900 font-medium rounded-xl transition-colors disabled:cursor-not-allowed"
                >
                    Check
                </button>
            </div>
        </div>
    );
}


export default function StudyHubPage() {
    const {
        currentQuestion,
        questionIndex,
        totalQuestions,
        feedbackState,
        isSessionComplete,
        submitAnswer,
        revealHint,
        toggleAI,
        nextQuestion,
        clearFeedback,
    } = useStudySession();

    // Help panel state
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    // Key to reset input components on retry
    const [attemptKey, setAttemptKey] = useState(0);

    // Auto-dismiss incorrect feedback after 10 seconds
    useEffect(() => {
        if (feedbackState.isShowing && !feedbackState.isCorrect) {
            const timer = setTimeout(() => {
                clearFeedback();
                setAttemptKey(prev => prev + 1);
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [feedbackState.isShowing, feedbackState.isCorrect, clearFeedback]);

    // Keyboard shortcut for help panel
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger if user is typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }
            if (e.key === 'h' || e.key === 'H') {
                setIsHelpOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Open help panel when user requests help
    const handleRequestHelp = useCallback(() => {
        setIsHelpOpen(true);
    }, []);

    // Handle try again
    const handleTryAgain = useCallback(() => {
        clearFeedback();
        setAttemptKey(prev => prev + 1);
    }, [clearFeedback]);

    const handleHintUsed = useCallback((level: number) => {
        revealHint(level);
    }, [revealHint]);

    // Session Complete Screen
    if (isSessionComplete) {
        return (
            <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-sm w-full text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                        className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6"
                    >
                        <Trophy className="w-10 h-10 text-amber-500" />
                    </motion.div>

                    <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">
                        Session Complete
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-8">
                        Great work! Take a break or continue practicing.
                    </p>

                    <div className="space-y-3">
                        <Link
                            href="/study"
                            className="block w-full py-3 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-medium transition-colors"
                        >
                            Continue Studying
                        </Link>
                        <Link
                            href="/"
                            className="block w-full py-3 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium transition-colors"
                        >
                            Back to Home
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Build minimal help panel content
    const helpPanelContent = (
        <MinimalHelpPanel
            nudgeHint={currentQuestion?.helps?.nudgeHint}
            guidedHint={currentQuestion?.helps?.guidedHint}
            relatedFormulas={currentQuestion?.helps?.relatedFormulas}
            onRequestAI={toggleAI}
            onHintUsed={handleHintUsed}
        />
    );

    return (
        <FocusedStudyLayout
            helpPanel={helpPanelContent}
            isHelpOpen={isHelpOpen}
            onHelpToggle={setIsHelpOpen}
            questionNumber={questionIndex + 1}
            totalQuestions={totalQuestions}
        >
            {/* Question Card - Clean and focused */}
            <div className="space-y-8">
                {/* Question Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${currentQuestion?.id}-${attemptKey}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {currentQuestion && (
                            <QuestionRenderer
                                question={currentQuestion}
                                onAnswer={(answer, isCorrect) => {
                                    submitAnswer(answer, currentQuestion.correctAnswer, currentQuestion);
                                }}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Feedback - Simple and clean */}
                <AnimatePresence>
                    {feedbackState.isShowing && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`p-4 rounded-xl flex items-start gap-3 ${feedbackState.isCorrect
                                ? 'bg-green-50 dark:bg-green-500/10'
                                : 'bg-red-50 dark:bg-red-500/10'
                                }`}
                        >
                            {feedbackState.isCorrect ? (
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            ) : (
                                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                                <p className={`font-medium ${feedbackState.isCorrect
                                    ? 'text-green-700 dark:text-green-300'
                                    : 'text-red-700 dark:text-red-300'
                                    }`}>
                                    {feedbackState.isCorrect ? 'Correct!' : 'Not quite'}
                                </p>
                                <p className={`text-sm mt-1 ${feedbackState.isCorrect
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                                    }`}>
                                    {feedbackState.message}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Help hint - Subtle prompt */}
                {!feedbackState.isShowing && !isHelpOpen && (
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2 }}
                        onClick={handleRequestHelp}
                        className="w-full py-3 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors flex items-center justify-center gap-2"
                    >
                        <Lightbulb className="w-4 h-4" />
                        Need help? Click here or press H
                    </motion.button>
                )}

                {/* Action buttons - Show after answer */}
                {feedbackState.isShowing && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3"
                    >
                        {!feedbackState.isCorrect && (
                            <button
                                onClick={handleTryAgain}
                                className="flex-1 py-4 border-2 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium transition-colors"
                            >
                                Try Again
                            </button>
                        )}
                        <button
                            onClick={nextQuestion}
                            className={`py-4 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${feedbackState.isCorrect ? 'flex-1' : 'px-8'
                                }`}
                        >
                            {feedbackState.isCorrect ? 'Continue' : 'Skip'}
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </div>
        </FocusedStudyLayout>
    );
}

// Question Renderer Component - Simplified
function QuestionRenderer({
    question,
    onAnswer
}: {
    question: any;
    onAnswer: (answer: string, isCorrect: boolean) => void;
}) {
    const content = question.content;

    // Render question text - Clean typography
    const renderQuestionText = () => (
        <div className="mb-8">
            {content.question?.text && (
                <h1 className="text-xl md:text-2xl font-medium text-zinc-900 dark:text-white leading-relaxed">
                    {content.question.text}
                </h1>
            )}
            {content.question?.math && (
                <div className="mt-4 p-6 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
                    <BlockMath math={content.question.math} />
                </div>
            )}
        </div>
    );

    switch (question.type) {
        case 'numeric_input':
            return (
                <div>
                    {renderQuestionText()}
                    <SimpleNumericInput
                        correctAnswer={question.correctAnswer}
                        onAnswer={(val, isCorrect) => onAnswer(val, isCorrect)}
                    />
                </div>
            );

        case 'multiple_choice':
            return (
                <div>
                    {renderQuestionText()}
                    <MultipleChoiceInput
                        question={question}
                        onAnswer={(id, isCorrect) => onAnswer(id, isCorrect)}
                    />
                </div>
            );

        case 'guided_steps':
            return (
                <GuidedStepSession
                    question={question}
                    onComplete={() => onAnswer('complete', true)}
                    onExit={() => { }}
                />
            );

        case 'fill_blank':
            return (
                <div>
                    {renderQuestionText()}
                    <FillBlankInput
                        question={question}
                        onAnswer={(vals, isCorrect) => onAnswer(JSON.stringify(vals), isCorrect)}
                    />
                </div>
            );

        case 'drag_drop':
            return (
                <div>
                    {renderQuestionText()}
                    <DragDropInput
                        question={question}
                        onAnswer={(ord, isCorrect) => onAnswer(JSON.stringify(ord), isCorrect)}
                    />
                </div>
            );

        case 'toggle':
            return (
                <div>
                    {renderQuestionText()}
                    <ToggleInput
                        question={question}
                        onAnswer={(states, isCorrect) => onAnswer(JSON.stringify(states), isCorrect)}
                    />
                </div>
            );

        case 'expression_builder':
            return (
                <div>
                    {renderQuestionText()}
                    <ExpressionBuilderInput
                        question={question}
                        onAnswer={(expr, isCorrect) => onAnswer(expr, isCorrect)}
                    />
                </div>
            );

        case 'solution_builder':
            return (
                <SolutionBuilderInput
                    question={question}
                    onAnswer={(isCorrect) => onAnswer(question.correctAnswer, isCorrect)}
                />
            );

        default:
            return (
                <div className="text-center py-8 text-zinc-400">
                    Unknown question type: {question.type}
                </div>
            );
    }
}
