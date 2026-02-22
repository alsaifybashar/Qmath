'use client';

import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ChevronLeft, ChevronRight, CheckCircle, XCircle, Lightbulb, BookOpen, ArrowLeft } from 'lucide-react';
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
import { HintBubble } from '@/components/study/HintBubble';

// AI Hint Engine
import { generateHint } from '@/app/actions/hint-engine';
import type { HintResult } from '@/app/actions/hint-engine';

// Hooks
import { useStudySession } from '@/lib/hooks/useStudySession';

// Progressive hint timing (milliseconds)
const HINT_LEVEL_1_DELAY_MS = 45_000; // 45 seconds idle → nudge
const HINT_LEVEL_2_DELAY_MS = 90_000; // 90 seconds idle → formula
const WRONG_ATTEMPTS_FOR_LEVEL_3 = 3;  // 3 wrong attempts → walkthrough

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
                    placeholder="Skriv ditt svar..."
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
                    Kontrollera
                </button>
            </div>
        </div>
    );
}


export default function StudyHubPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-zinc-200 dark:border-zinc-700 border-t-zinc-900 dark:border-t-white rounded-full animate-spin" />
            </div>
        }>
            <StudyHubContent />
        </Suspense>
    );
}

function StudyHubContent() {
    const searchParams = useSearchParams();
    const topicId = searchParams.get('topic') ?? undefined;

    const {
        currentQuestion,
        questionIndex,
        totalQuestions,
        feedbackState,
        currentAttempt,
        isSessionComplete,
        isLoading,
        questionsError,
        submitAnswer,
        revealHint,
        toggleAI,
        nextQuestion,
        clearFeedback,
    } = useStudySession(topicId);

    // Help panel state
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    // Key to reset input components on retry
    const [attemptKey, setAttemptKey] = useState(0);

    // ====== PROGRESSIVE HINT SYSTEM (Phase 1) ======
    const [activeHint, setActiveHint] = useState<HintResult | null>(null);
    const [hintVisible, setHintVisible] = useState(false);
    const [highestHintLevel, setHighestHintLevel] = useState(0);
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const hintLevel2TimerRef = useRef<NodeJS.Timeout | null>(null);
    const isLoadingHintRef = useRef(false);

    // Reset idle timer on any user interaction
    const resetIdleTimer = useCallback(() => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        if (hintLevel2TimerRef.current) clearTimeout(hintLevel2TimerRef.current);

        // Don't set timers if feedback is showing or no question
        if (feedbackState.isShowing || !currentQuestion) return;

        // Level 1 hint after 45s of idle
        if (highestHintLevel < 1) {
            idleTimerRef.current = setTimeout(() => {
                triggerHint(1);
            }, HINT_LEVEL_1_DELAY_MS);
        }

        // Level 2 hint after 90s of idle
        if (highestHintLevel < 2) {
            hintLevel2TimerRef.current = setTimeout(() => {
                triggerHint(2);
            }, HINT_LEVEL_2_DELAY_MS);
        }
    }, [feedbackState.isShowing, currentQuestion, highestHintLevel]);

    // Trigger a hint at the specified level
    const triggerHint = useCallback(async (level: 1 | 2 | 3) => {
        if (!currentQuestion || isLoadingHintRef.current) return;
        if (level <= highestHintLevel) return; // Don't downgrade

        isLoadingHintRef.current = true;

        try {
            // Use pre-authored hints first, then AI
            const existingHints: string[] = [];
            if (currentQuestion.helps?.nudgeHint) existingHints.push(currentQuestion.helps.nudgeHint);
            if (currentQuestion.helps?.guidedHint) existingHints.push(currentQuestion.helps.guidedHint);

            const result = await generateHint({
                questionText: currentQuestion.content?.question?.text || '',
                questionMath: currentQuestion.content?.question?.math,
                correctAnswer: String(currentQuestion.correctAnswer || ''),
                topicId: currentQuestion.topicId,
                studentAnswer: undefined,
                attemptCount: currentAttempt.attempts,
                hintLevel: level,
                existingHints,
                relatedFormulas: currentQuestion.helps?.relatedFormulas,
                conceptsTested: currentQuestion.aiContext?.conceptsTested,
            });

            setActiveHint(result);
            setHintVisible(true);
            setHighestHintLevel(level);
            revealHint(level); // Track in session state

            console.log(`[Hint] ✅ Level ${level} shown (source: ${result.source})`);
        } catch (err) {
            console.error('[Hint] Failed to generate:', err);
        } finally {
            isLoadingHintRef.current = false;
        }
    }, [currentQuestion, highestHintLevel, currentAttempt.attempts, revealHint]);

    // After 3 wrong attempts, show level 3 walkthrough hint
    useEffect(() => {
        if (
            currentAttempt.attempts >= WRONG_ATTEMPTS_FOR_LEVEL_3 &&
            highestHintLevel < 3 &&
            feedbackState.isShowing &&
            !feedbackState.isCorrect
        ) {
            triggerHint(3);
        }
    }, [currentAttempt.attempts, highestHintLevel, feedbackState.isShowing, feedbackState.isCorrect, triggerHint]);

    // Listen for user activity to reset idle timer
    useEffect(() => {
        const events = ['keydown', 'mousedown', 'touchstart', 'scroll'];
        const handler = () => resetIdleTimer();

        events.forEach(evt => window.addEventListener(evt, handler, { passive: true }));
        resetIdleTimer(); // Start the timer

        return () => {
            events.forEach(evt => window.removeEventListener(evt, handler));
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            if (hintLevel2TimerRef.current) clearTimeout(hintLevel2TimerRef.current);
        };
    }, [resetIdleTimer]);

    // Reset hints when question changes
    useEffect(() => {
        setActiveHint(null);
        setHintVisible(false);
        setHighestHintLevel(0);
        isLoadingHintRef.current = false;
    }, [questionIndex]);
    // ====== END PROGRESSIVE HINT SYSTEM ======

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

    // ====== LOADING STATE ======
    if (isLoading) {
        return (
            <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center gap-4 p-4">
                <div className="w-10 h-10 border-2 border-zinc-200 dark:border-zinc-700 border-t-zinc-900 dark:border-t-white rounded-full animate-spin" />
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Hämtar frågor…</p>
            </div>
        );
    }

    // ====== ERROR STATE ======
    if (questionsError) {
        return (
            <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center p-4">
                <div className="max-w-sm w-full text-center space-y-4">
                    <p className="text-red-600 dark:text-red-400 font-medium">{questionsError}</p>
                    <Link
                        href="/practice"
                        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Tillbaka till övning
                    </Link>
                </div>
            </div>
        );
    }

    // ====== EMPTY STATE — no published questions for this topic ======
    if (!isLoading && totalQuestions === 0) {
        return (
            <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-sm w-full text-center"
                >
                    <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <BookOpen className="w-8 h-8 text-zinc-400" />
                    </div>
                    <h1 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                        Inga övningsfrågor ännu
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                        Det finns inga publicerade frågor för det här ämnet just nu.
                        Administratörer kan lägga till och publicera frågor under Admin → Frågor.
                    </p>
                    <Link
                        href="/practice"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-medium transition-colors text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Tillbaka till övning
                    </Link>
                </motion.div>
            </div>
        );
    }

    // ====== SESSION COMPLETE SCREEN ======
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
                        Session avslutad
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-8">
                        Bra jobbat! Ta en paus eller fortsätt öva.
                    </p>

                    <div className="space-y-3">
                        <Link
                            href="/study"
                            className="block w-full py-3 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-medium transition-colors"
                        >
                            Fortsätt studera
                        </Link>
                        <Link
                            href="/"
                            className="block w-full py-3 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium transition-colors"
                        >
                            Tillbaka till hem
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
                                <div className="flex items-center gap-2">
                                    <p className={`font-medium ${feedbackState.isCorrect
                                        ? 'text-green-700 dark:text-green-300'
                                        : 'text-red-700 dark:text-red-300'
                                        }`}>
                                        {feedbackState.isCorrect ? 'Rätt!' : (() => {
                                            const labels: Record<string, string> = {
                                                conceptual: 'Konceptkoll',
                                                computational: 'Beräkningsfel',
                                                notation: 'Notationsproblem',
                                                interpretation: 'Läs frågan igen',
                                                incomplete: 'Nästan där',
                                                time_pressure: 'Ta din tid',
                                            };
                                            return (feedbackState as any).errorType
                                                ? labels[(feedbackState as any).errorType] || 'Inte riktigt'
                                                : 'Inte riktigt';
                                        })()}
                                    </p>
                                    {!feedbackState.isCorrect && (feedbackState as any).errorType && (
                                        <motion.span
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400"
                                        >
                                            {(feedbackState as any).errorType}
                                        </motion.span>
                                    )}
                                </div>
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

                {/* Progressive AI Hint (auto-appears on idle) */}
                {activeHint && !feedbackState.isShowing && (
                    <HintBubble
                        hint={activeHint.hint}
                        hintLevel={activeHint.hintLevel}
                        mathExpression={activeHint.mathExpression}
                        isVisible={hintVisible}
                        onDismiss={() => setHintVisible(false)}
                    />
                )}

                {/* Help hint - Subtle prompt (only if no auto-hint is showing) */}
                {!feedbackState.isShowing && !isHelpOpen && !hintVisible && (
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2 }}
                        onClick={handleRequestHelp}
                        className="w-full py-3 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors flex items-center justify-center gap-2"
                    >
                        <Lightbulb className="w-4 h-4" />
                        Behöver du hjälp? Klicka här eller tryck på H
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
                                Försök igen
                            </button>
                        )}
                        <button
                            onClick={nextQuestion}
                            className={`py-4 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${feedbackState.isCorrect ? 'flex-1' : 'px-8'
                                }`}
                        >
                            {feedbackState.isCorrect ? 'Fortsätt' : 'Hoppa över'}
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
                    Okänd frågetyp: {question.type}
                </div>
            );
    }
}
