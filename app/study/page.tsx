'use client';

import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, ChevronRight, CheckCircle, XCircle, Lightbulb, BookOpen,
    ArrowLeft, Zap, Flame, RotateCcw, Target, Clock, Star,
} from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import 'katex/dist/katex.min.css';

import { FocusedStudyLayout } from '@/components/layout/FocusedStudyLayout';
import { WorkShowPanel } from '@/components/study/WorkShowPanel';
import { MultipleChoiceInput } from '@/components/study/MultipleChoiceInput';
import { GuidedStepSession } from '@/components/study/GuidedStepSession';
import { FillBlankInput } from '@/components/study/FillBlankInput';
import { DragDropInput } from '@/components/study/DragDropInput';
import { ToggleInput } from '@/components/study/ToggleInput';
import { ExpressionBuilderInput } from '@/components/study/ExpressionBuilderInput';
import { SolutionBuilderInput } from '@/components/study/SolutionBuilderInput';
import { MinimalHelpPanel } from '@/components/study/MinimalHelpPanel';
import { HintBubble } from '@/components/study/HintBubble';
import { GuidancePanel } from '@/components/study/GuidancePanel';
import { generateHint } from '@/app/actions/hint-engine';
import type { HintResult } from '@/app/actions/hint-engine';
import { useStudySession } from '@/lib/hooks/useStudySession';
import { useGamification } from '@/components/gamification';

// ── Constants ─────────────────────────────────────────────────────────────────
const HINT_LEVEL_1_DELAY_MS = 45_000;
const HINT_LEVEL_2_DELAY_MS = 90_000;
const WRONG_ATTEMPTS_FOR_LEVEL_3 = 3;

const MOTIVATIONAL_MESSAGES = [
    'Fantastiskt!', 'Perfekt!', 'Bra jobbat!', 'Kanon!',
    'Utmärkt!', 'Imponerande!', 'Precis rätt!', 'Spot on!',
    'Lysande!', 'Rätt på pricken!',
];

const ERROR_TYPE_LABELS: Record<string, string> = {
    conceptual: 'Konceptkoll',
    computational: 'Beräkningsfel',
    notation: 'Notationsproblem',
    interpretation: 'Läs uppgiften igen',
    incomplete: 'Nästan där',
    time_pressure: 'Ta din tid',
};

// ── Dynamic imports ────────────────────────────────────────────────────────────
const BlockMath = dynamic(
    () => import('react-katex').then((mod) => mod.BlockMath),
    { ssr: false }
);

// ── Simple numeric input ───────────────────────────────────────────────────────
function SimpleNumericInput({
    correctAnswer,
    onAnswer,
}: {
    correctAnswer: string;
    onAnswer: (value: string, isCorrect: boolean) => void;
}) {
    const [value, setValue] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    const handleSubmit = () => {
        if (!value.trim() || isSubmitted) return;
        const correct = value.trim().toLowerCase() === correctAnswer.toString().toLowerCase();
        setIsCorrect(correct);
        setIsSubmitted(true);
        onAnswer(value, correct);
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="flex gap-3 w-full max-w-md">
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    disabled={isSubmitted}
                    placeholder="Skriv ditt svar…"
                    className={`flex-1 px-4 py-3.5 text-lg font-mono rounded-xl border-2 transition-all focus:outline-none ${isSubmitted
                            ? isCorrect
                                ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                : 'border-orange-400 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300'
                            : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:border-blue-400 dark:focus:border-blue-500 placeholder:text-zinc-400 dark:placeholder:text-zinc-500'
                        }`}
                />
                <button
                    onClick={handleSubmit}
                    disabled={!value.trim() || isSubmitted}
                    className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-zinc-200 dark:disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-semibold rounded-xl transition-colors disabled:cursor-not-allowed shadow-sm"
                >
                    Svara
                </button>
            </div>
        </div>
    );
}

// ── Page exports ───────────────────────────────────────────────────────────────
export default function StudyHubPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center gap-4 p-4">
                <div className="w-10 h-10 border-2 border-blue-200 dark:border-blue-700 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Hämtar frågor…</p>
            </div>
        }>
            <StudyHubContent />
        </Suspense>
    );
}

// ── Main content ───────────────────────────────────────────────────────────────
function StudyHubContent() {
    const searchParams = useSearchParams();
    const topicId = searchParams.get('topic') ?? undefined;
    const topicName = searchParams.get('topicName') ?? undefined;

    const {
        currentQuestion,
        questionIndex,
        totalQuestions,
        feedbackState,
        currentAttempt,
        sessionProgress,
        sessionTime,
        isSessionComplete,
        isLoading,
        questionsError,
        submitAnswer,
        revealHint,
        toggleAI,
        nextQuestion,
        clearFeedback,
    } = useStudySession(topicId);

    // ── Local state ──────────────────────────────────────────────────────────
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [attemptKey, setAttemptKey] = useState(0);
    const [streak, setStreak] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);

    // ── Gamification ─────────────────────────────────────────────────────────
    const { onCorrectAnswer, onWrongAnswer, onSessionComplete, notifyXP } = useGamification();

    // ── Progressive hint system ──────────────────────────────────────────────
    const [activeHint, setActiveHint] = useState<HintResult | null>(null);
    const [hintVisible, setHintVisible] = useState(false);
    const [highestHintLevel, setHighestHintLevel] = useState(0);
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const hintLevel2TimerRef = useRef<NodeJS.Timeout | null>(null);
    const isLoadingHintRef = useRef(false);

    // ── Streak tracking + alien reactions ─────────────────────────────────────
    const prevFeedbackShowingRef = useRef(false);
    useEffect(() => {
        const nowShowing = feedbackState.isShowing;
        if (nowShowing && !prevFeedbackShowingRef.current) {
            if (feedbackState.isCorrect) {
                setStreak(prev => {
                    const next = prev + 1;
                    setMaxStreak(cur => Math.max(cur, next));
                    // Trigger Qlix alien reaction
                    onCorrectAnswer(next);
                    return next;
                });
            } else if (feedbackState.isCorrect === false) {
                setStreak(0);
                // Trigger Qlix alien encouragement
                onWrongAnswer();
            }
        }
        prevFeedbackShowingRef.current = nowShowing;
    }, [feedbackState.isShowing, feedbackState.isCorrect]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Session complete → alien celebration ──────────────────────────────────
    useEffect(() => {
        if (isSessionComplete) {
            onSessionComplete(sessionProgress.correct, totalQuestions);
        }
    }, [isSessionComplete]); // eslint-disable-line react-hooks/exhaustive-deps

    // XP for this question
    const xpForCorrect = currentQuestion
        ? Math.max(2, 10 + (currentQuestion.difficulty || 1) * 2 - currentAttempt.hintsUsed * 2)
        : 10;

    // Motivational message — rotates with correct answers
    const motivationalMessage =
        MOTIVATIONAL_MESSAGES[sessionProgress.correct % MOTIVATIONAL_MESSAGES.length];

    // ── Idle timer for progressive hints ────────────────────────────────────
    const resetIdleTimer = useCallback(() => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        if (hintLevel2TimerRef.current) clearTimeout(hintLevel2TimerRef.current);
        if (feedbackState.isShowing || !currentQuestion) return;
        if (highestHintLevel < 1) {
            idleTimerRef.current = setTimeout(() => triggerHint(1), HINT_LEVEL_1_DELAY_MS);
        }
        if (highestHintLevel < 2) {
            hintLevel2TimerRef.current = setTimeout(() => triggerHint(2), HINT_LEVEL_2_DELAY_MS);
        }
    }, [feedbackState.isShowing, currentQuestion, highestHintLevel]); // eslint-disable-line

    const triggerHint = useCallback(async (level: 1 | 2 | 3) => {
        if (!currentQuestion || isLoadingHintRef.current) return;
        if (level <= highestHintLevel) return;
        isLoadingHintRef.current = true;
        try {
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
            revealHint(level);
        } catch (err) {
            console.error('[Hint] Failed:', err);
        } finally {
            isLoadingHintRef.current = false;
        }
    }, [currentQuestion, highestHintLevel, currentAttempt.attempts, revealHint]);

    // Trigger level-3 hint after 3 wrong attempts
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

    // Listen for activity to reset idle timer
    useEffect(() => {
        const events = ['keydown', 'mousedown', 'touchstart', 'scroll'];
        const handler = () => resetIdleTimer();
        events.forEach(evt => window.addEventListener(evt, handler, { passive: true }));
        resetIdleTimer();
        return () => {
            events.forEach(evt => window.removeEventListener(evt, handler));
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            if (hintLevel2TimerRef.current) clearTimeout(hintLevel2TimerRef.current);
        };
    }, [resetIdleTimer]);

    // Reset hints on question change
    useEffect(() => {
        setActiveHint(null);
        setHintVisible(false);
        setHighestHintLevel(0);
        isLoadingHintRef.current = false;
    }, [questionIndex]);

    // Keyboard shortcut: H = toggle help
    useEffect(() => {
        const handle = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.key === 'h' || e.key === 'H') setIsHelpOpen(prev => !prev);
        };
        window.addEventListener('keydown', handle);
        return () => window.removeEventListener('keydown', handle);
    }, []);

    const handleTryAgain = useCallback(() => {
        clearFeedback();
        setAttemptKey(prev => prev + 1);
    }, [clearFeedback]);

    const handleHintUsed = useCallback((level: number) => revealHint(level), [revealHint]);

    // ── LOADING ──────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center gap-4 p-4">
                <div className="w-10 h-10 border-2 border-blue-200 dark:border-blue-700 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Hämtar frågor…</p>
            </div>
        );
    }

    // ── ERROR ─────────────────────────────────────────────────────────────────
    if (questionsError) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
                <div className="max-w-sm w-full text-center space-y-4">
                    <div className="w-14 h-14 bg-red-100 dark:bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto">
                        <XCircle className="w-7 h-7 text-red-500" />
                    </div>
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

    // ── EMPTY ─────────────────────────────────────────────────────────────────
    if (!isLoading && totalQuestions === 0) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-sm w-full text-center"
                >
                    <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <BookOpen className="w-8 h-8 text-zinc-400" />
                    </div>
                    <h1 className="text-xl font-semibold mb-2">Inga övningsfrågor ännu</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                        Det finns inga publicerade frågor för det här ämnet. Administratörer kan lägga till frågor under Admin → Frågor.
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

    // ── SESSION COMPLETE ──────────────────────────────────────────────────────
    if (isSessionComplete) {
        const pct = totalQuestions > 0
            ? Math.round((sessionProgress.correct / totalQuestions) * 100)
            : 0;
        const minutes = Math.floor(sessionTime / 60);
        const seconds = String(sessionTime % 60).padStart(2, '0');
        const isPerfect = sessionProgress.correct === totalQuestions;

        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full"
                >
                    {/* Trophy */}
                    <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', delay: 0.15, damping: 10, stiffness: 200 }}
                        className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl ${isPerfect
                                ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                                : 'bg-gradient-to-br from-blue-500 to-violet-600'
                            }`}
                    >
                        <Trophy className="w-12 h-12 text-white" />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="text-center mb-8"
                    >
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                            {isPerfect ? 'Perfekt session!' : 'Session klar!'}
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400">
                            {isPerfect
                                ? 'Alla rätt — fantastiskt jobbat!'
                                : `${pct}% rätt. Fortsätt öva för att bli ännu bättre!`}
                        </p>
                    </motion.div>

                    {/* Stats grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="grid grid-cols-3 gap-3 mb-6"
                    >
                        <StatCard
                            icon={<Target className="w-5 h-5 text-emerald-500" />}
                            value={`${sessionProgress.correct}/${totalQuestions}`}
                            label="Rätt svar"
                            color="emerald"
                        />
                        <StatCard
                            icon={<Zap className="w-5 h-5 text-violet-500" />}
                            value={`+${sessionProgress.xpEarned}`}
                            label="XP intjänat"
                            color="violet"
                        />
                        <StatCard
                            icon={<Clock className="w-5 h-5 text-blue-500" />}
                            value={`${minutes}:${seconds}`}
                            label="Tid"
                            color="blue"
                        />
                    </motion.div>

                    {/* Max streak badge */}
                    {maxStreak >= 3 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.45 }}
                            className="flex items-center justify-center gap-2 mb-6 py-3 px-4 bg-orange-50 dark:bg-orange-500/10 rounded-xl border border-orange-200 dark:border-orange-500/20"
                        >
                            <Flame className="w-5 h-5 text-orange-500" />
                            <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                                Bästa serien: {maxStreak} rätt i rad!
                            </span>
                        </motion.div>
                    )}

                    {/* CTAs */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="space-y-3"
                    >
                        <Link
                            href="/practice"
                            className="flex items-center justify-center gap-2 w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl font-semibold transition-colors shadow-sm"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Öva mer
                        </Link>
                        <Link
                            href="/dashboard"
                            className="block w-full py-3.5 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-2xl font-medium text-center transition-colors"
                        >
                            Gå till startsidan
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        );
    }

    // ── ACTIVE SESSION ────────────────────────────────────────────────────────
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
            topicName={topicName}
            questionNumber={questionIndex + 1}
            totalQuestions={totalQuestions}
            xpEarned={sessionProgress.xpEarned}
            streak={streak}
        >
            <div className="space-y-6">

                {/* ── Question card ─────────────────────────────────────────── */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${currentQuestion?.id}-${attemptKey}`}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.22 }}
                    >
                        {currentQuestion && (
                            <QuestionCard
                                question={currentQuestion}
                                questionIndex={questionIndex}
                                totalQuestions={totalQuestions}
                                onAnswer={(answer, isCorrect) => {
                                    submitAnswer(answer, currentQuestion.correctAnswer, currentQuestion);
                                }}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* ── Feedback ──────────────────────────────────────────────── */}
                <AnimatePresence>
                    {feedbackState.isShowing && feedbackState.isCorrect && (
                        <CorrectFeedback
                            message={feedbackState.message}
                            motivationalMessage={motivationalMessage}
                            xpGained={xpForCorrect}
                            streak={streak}
                            stepBreakdown={currentQuestion?.helps?.stepBreakdown}
                            onContinue={nextQuestion}
                        />
                    )}
                    {feedbackState.isShowing && !feedbackState.isCorrect && (
                        <WrongFeedback
                            message={feedbackState.message}
                            errorType={(feedbackState as any).errorType}
                            attempts={currentAttempt.attempts}
                            correctAnswer={currentAttempt.attempts >= 3 ? String(currentQuestion?.correctAnswer ?? '') : undefined}
                            guidanceSteps={currentQuestion?.helps?.guidanceSteps}
                            stepBreakdown={currentQuestion?.helps?.stepBreakdown}
                            workedExample={currentQuestion?.helps?.workedExample}
                            onTryAgain={handleTryAgain}
                            onSkip={nextQuestion}
                        />
                    )}
                </AnimatePresence>

                {/* ── Auto-hint bubble ──────────────────────────────────────── */}
                {activeHint && !feedbackState.isShowing && (
                    <HintBubble
                        hint={activeHint.hint}
                        hintLevel={activeHint.hintLevel}
                        mathExpression={activeHint.mathExpression}
                        isVisible={hintVisible}
                        onDismiss={() => setHintVisible(false)}
                    />
                )}

                {/* ── Help nudge (subtle, delayed) ──────────────────────────── */}
                {!feedbackState.isShowing && !isHelpOpen && !hintVisible && (
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 3 }}
                        onClick={() => setIsHelpOpen(true)}
                        className="w-full py-3 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors flex items-center justify-center gap-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                    >
                        <Lightbulb className="w-4 h-4" />
                        Behöver du hjälp? Klicka här eller tryck H
                    </motion.button>
                )}
            </div>
        </FocusedStudyLayout>
    );
}

// ── Correct feedback ──────────────────────────────────────────────────────────
function CorrectFeedback({
    message, motivationalMessage, xpGained, streak, stepBreakdown, onContinue,
}: {
    message: string;
    motivationalMessage: string;
    xpGained: number;
    streak: number;
    stepBreakdown?: {
        intro: string;
        steps: Array<{ prompt: string; correctAnswer: string; hint?: string }>;
        conclusion: string;
    };
    onContinue: () => void;
}) {
    const [showSolution, setShowSolution] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -6 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
            {/* ── Green celebration card ─────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 p-5 shadow-lg shadow-emerald-500/20">
                {/* Decorative circles */}
                <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
                <div className="absolute -right-2 -bottom-4 w-16 h-16 rounded-full bg-white/10" />

                <div className="relative flex items-start gap-4">
                    {/* Animated checkmark */}
                    <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', damping: 12, stiffness: 300, delay: 0.05 }}
                        className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                    >
                        <CheckCircle className="w-7 h-7 text-white" />
                    </motion.div>

                    <div className="flex-1 min-w-0 pt-0.5">
                        {/* Headline row */}
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-lg font-bold text-white">{motivationalMessage}</span>

                            {/* XP badge */}
                            <motion.span
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white/20 rounded-full text-sm font-bold text-white"
                            >
                                <Zap className="w-3.5 h-3.5" />
                                +{xpGained} XP
                            </motion.span>

                            {/* Streak badge */}
                            {streak >= 2 && (
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.25, type: 'spring' }}
                                    className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-orange-400/30 rounded-full text-sm font-bold text-white"
                                >
                                    <Flame className="w-3.5 h-3.5" />
                                    {streak} i rad!
                                </motion.span>
                            )}
                        </div>

                        <p className="text-emerald-100 text-sm leading-relaxed">{message}</p>
                    </div>
                </div>

                {/* Action row: solution toggle (left) + next button (right) */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-4 flex gap-2"
                >
                    {stepBreakdown && (
                        <button
                            onClick={() => setShowSolution(prev => !prev)}
                            className="flex items-center gap-1.5 px-3 py-2.5 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white/90 font-medium rounded-xl transition-colors text-sm"
                        >
                            <BookOpen className="w-4 h-4" />
                            {showSolution ? 'Dölj' : 'Visa lösning'}
                        </button>
                    )}
                    <button
                        onClick={onContinue}
                        className="flex-1 py-2.5 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                        Nästa fråga
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </motion.div>
            </div>

            {/* ── Expandable solution panel (below green card) ───────────── */}
            <AnimatePresence>
                {showSolution && stepBreakdown && (
                    <motion.div
                        key="correct-solution"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.28, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="mt-2 rounded-2xl border-2 border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-5 pb-5">
                            <StepBreakdownView breakdown={stepBreakdown} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ── Wrong feedback ────────────────────────────────────────────────────────────
function WrongFeedback({
    message, errorType, attempts, correctAnswer, guidanceSteps, stepBreakdown, workedExample, onTryAgain, onSkip,
}: {
    message: string;
    errorType?: string;
    attempts: number;
    correctAnswer?: string;
    guidanceSteps?: Array<{ id: string; order: number; content: string }>;
    stepBreakdown?: {
        intro: string;
        steps: Array<{ prompt: string; correctAnswer: string; hint?: string }>;
        conclusion: string;
    };
    workedExample?: {
        similarQuestion: string;
        solution: Array<{ step: number; action: string; result: string; explanation?: string }>;
    };
    onTryAgain: () => void;
    onSkip: () => void;
}) {
    // "show work" panel: starts in checkpoint mode so the student can
    // immediately enter their intermediate steps after getting it wrong.
    // Falls back to the full passive solution when requested.
    const [showFullSolution, setShowFullSolution] = useState(false);
    // Whether to bypass guidance and jump straight to solution checkpoints
    const [skipGuidance, setSkipGuidance] = useState(false);
    const label = errorType ? (ERROR_TYPE_LABELS[errorType] ?? 'Inte riktigt') : 'Inte riktigt';
    const hasSteps = !!stepBreakdown?.steps?.length;
    const hasFallback = !!(stepBreakdown || workedExample);
    const hasGuidance = !!guidanceSteps?.length && !skipGuidance;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        >
            <div className="rounded-2xl border-2 border-orange-200 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-500/10 overflow-hidden">
                {/* ── Feedback content ─────────────────────────────────────── */}
                <div className="p-5">
                    <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <XCircle className="w-5 h-5 text-orange-500" />
                        </div>

                        <div className="flex-1 min-w-0">
                            {/* Label + error-type badge */}
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="font-semibold text-orange-800 dark:text-orange-200">{label}</span>
                                {errorType && (
                                    <span className="text-xs px-2 py-0.5 bg-orange-200 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 rounded-full font-medium">
                                        {errorType.replace(/_/g, ' ')}
                                    </span>
                                )}
                            </div>

                            {/* AI-generated explanation — stays visible */}
                            <p className="text-sm text-orange-700 dark:text-orange-300 leading-relaxed">
                                {message}
                            </p>

                            {/* Correct answer revealed after 3 failed attempts */}
                            {correctAnswer && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-500/20"
                                >
                                    <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide mb-1">
                                        Rätt svar
                                    </p>
                                    <p className="text-base font-mono font-bold text-orange-800 dark:text-orange-200">
                                        {correctAnswer}
                                    </p>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Action buttons ───────────────────────────────────────── */}
                <div className="px-5 pb-4 flex gap-3">
                    <button
                        onClick={onTryAgain}
                        className="flex-1 py-3 bg-white dark:bg-zinc-900 hover:bg-orange-50 dark:hover:bg-orange-500/5 border-2 border-orange-200 dark:border-orange-500/30 text-orange-700 dark:text-orange-300 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Försök igen
                    </button>
                    <button
                        onClick={onSkip}
                        className="px-5 py-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-xl font-medium text-sm transition-colors flex items-center gap-2"
                    >
                        Hoppa över
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* ── Admin guidance steps (progressive thinking hints) ────── */}
                {hasGuidance && (
                    <div className="px-5 pb-4">
                        <GuidancePanel
                            steps={guidanceSteps!}
                            onDone={
                                hasSteps
                                    ? () => setSkipGuidance(true)          // → show WorkShowPanel
                                    : hasFallback
                                        ? () => { setSkipGuidance(true); setShowFullSolution(true); } // → show passive solution
                                        : undefined
                            }
                            doneLabel={hasSteps ? 'Visa lösningssteg' : hasFallback ? 'Visa full lösning' : undefined}
                        />
                    </div>
                )}

                {/* ── Interactive WorkShow panel (replaces the passive toggle) ─ */}
                {hasSteps && !showFullSolution && (!hasGuidance) && (
                    <div className="px-5 pb-5">
                        {/* After the first wrong answer, open directly in checkpoint
                            mode so the student can immediately enter their work.
                            On the first attempt (attempts===1) show the softer CTA. */}
                        <WorkShowPanel
                            stepBreakdown={stepBreakdown!}
                            defaultMode={attempts >= 2 ? 'checkpoints' : 'cta'}
                            accentColor="orange"
                            onRequestFullSolution={() => setShowFullSolution(true)}
                        />
                    </div>
                )}

                {/* ── Fallback: full passive solution ──────────────────────── */}
                {hasFallback && (showFullSolution || (!hasSteps && !hasGuidance)) && (
                    <>
                        {/* Show toggle only when WorkShowPanel isn't displayed */}
                        {!showFullSolution && (
                            <div className="px-5 pb-5">
                                <button
                                    onClick={() => setShowFullSolution(true)}
                                    className="w-full py-2.5 px-4 rounded-xl border-2 border-dashed font-medium text-sm transition-all flex items-center justify-center gap-2 border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 hover:bg-orange-100/50 dark:hover:bg-orange-500/10"
                                >
                                    <BookOpen className="w-4 h-4" />
                                    Visa steg-för-steg lösning
                                </button>
                            </div>
                        )}

                        <AnimatePresence>
                            {showFullSolution && (
                                <motion.div
                                    key="solution-panel"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.28, ease: 'easeInOut' }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-5 pb-6 border-t-2 border-orange-200 dark:border-orange-500/30">
                                        {stepBreakdown
                                            ? <StepBreakdownView breakdown={stepBreakdown} />
                                            : workedExample
                                                ? <WorkedExampleView example={workedExample} />
                                                : null
                                        }
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </div>
        </motion.div>
    );
}

// ── Render a solution content block (text + optional $$math$$ blocks) ─────────
function SolutionContent({ content }: { content: string }) {
    // Split on $$...$$ LaTeX blocks and render each segment accordingly
    const parts = content.split(/(\$\$[\s\S]*?\$\$)/g);
    return (
        <div className="space-y-2">
            {parts.map((part, i) => {
                const mathMatch = part.match(/^\$\$([\s\S]*?)\$\$$/);
                if (mathMatch) {
                    return (
                        <div key={i} className="overflow-x-auto py-1">
                            <BlockMath math={mathMatch[1].trim()} />
                        </div>
                    );
                }
                if (part.trim()) {
                    return (
                        <p key={i} className="text-sm text-orange-800 dark:text-orange-200 leading-relaxed whitespace-pre-wrap">
                            {part.trim()}
                        </p>
                    );
                }
                return null;
            })}
        </div>
    );
}

// ── Step-breakdown view (inside solution panel) ───────────────────────────────
function StepBreakdownView({
    breakdown,
}: {
    breakdown: {
        intro: string;
        steps: Array<{ prompt: string; correctAnswer: string; hint?: string }>;
        conclusion: string;
    };
}) {
    // If there's only one step whose prompt is generic ("Lösning"), render
    // it as a flat solution block rather than a numbered list.
    const isSingleBlock =
        breakdown.steps.length === 1 && breakdown.steps[0].prompt === 'Lösning';

    return (
        <div className="pt-5 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-orange-200 dark:bg-orange-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-sm font-bold text-orange-800 dark:text-orange-200 uppercase tracking-wide">
                    Steg-för-steg lösning
                </span>
            </div>

            {/* Intro */}
            {breakdown.intro && (
                <p className="text-sm text-orange-700 dark:text-orange-300 leading-relaxed">
                    {breakdown.intro}
                </p>
            )}

            {/* Single flat block (no ### headers in the admin's markdown) */}
            {isSingleBlock ? (
                <div className="p-4 bg-white/70 dark:bg-zinc-900/50 rounded-xl border border-orange-200 dark:border-orange-500/20">
                    <SolutionContent content={breakdown.steps[0].correctAnswer} />
                </div>
            ) : (
                /* Numbered step list */
                <ol className="space-y-4">
                    {breakdown.steps.map((step, i) => (
                        <li key={i} className="flex gap-3">
                            {/* Step number bubble */}
                            <div className="w-6 h-6 rounded-full bg-orange-300/60 dark:bg-orange-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-orange-700 dark:text-orange-200">
                                    {i + 1}
                                </span>
                            </div>

                            <div className="flex-1 min-w-0">
                                {/* Step label (only if it's not a generic "Step N") */}
                                {step.prompt && !/^step\s*\d+$/i.test(step.prompt) && (
                                    <p className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-2">
                                        {step.prompt}
                                    </p>
                                )}

                                {/* Solution content: text paragraphs + LaTeX blocks */}
                                <div className="p-3 bg-white/70 dark:bg-zinc-900/50 rounded-lg border border-orange-200 dark:border-orange-500/20">
                                    <SolutionContent content={step.correctAnswer} />
                                </div>

                                {step.hint && (
                                    <p className="mt-1.5 text-xs text-orange-500 dark:text-orange-400 italic leading-relaxed">
                                        💡 {step.hint}
                                    </p>
                                )}
                            </div>
                        </li>
                    ))}
                </ol>
            )}

            {/* Conclusion */}
            {breakdown.conclusion && (
                <div className="pt-3 border-t border-orange-200 dark:border-orange-500/20">
                    <p className="text-sm text-orange-700 dark:text-orange-300 leading-relaxed italic">
                        {breakdown.conclusion}
                    </p>
                </div>
            )}
        </div>
    );
}

// ── Worked-example view (inside solution panel) ───────────────────────────────
function WorkedExampleView({
    example,
}: {
    example: {
        similarQuestion: string;
        solution: Array<{ step: number; action: string; result: string; explanation?: string }>;
    };
}) {
    return (
        <div className="pt-5 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-orange-200 dark:bg-orange-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-sm font-bold text-orange-800 dark:text-orange-200 uppercase tracking-wide">
                    Liknande lösning
                </span>
            </div>

            {/* Similar question box */}
            {example.similarQuestion && (
                <div className="p-3 bg-white/70 dark:bg-zinc-900/50 rounded-xl border border-orange-200 dark:border-orange-500/20">
                    <p className="text-xs font-semibold text-orange-500 dark:text-orange-400 uppercase tracking-wide mb-1">
                        Liknande uppgift
                    </p>
                    <p className="text-sm text-orange-800 dark:text-orange-200">{example.similarQuestion}</p>
                </div>
            )}

            {/* Solution steps */}
            <ol className="space-y-3">
                {example.solution.map((step) => (
                    <li key={step.step} className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-orange-300/60 dark:bg-orange-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-orange-700 dark:text-orange-200">{step.step}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-orange-800 dark:text-orange-200 leading-snug">
                                {step.action}
                            </p>
                            <div className="mt-1.5 px-3 py-1.5 bg-white/70 dark:bg-zinc-900/50 rounded-lg border border-orange-200 dark:border-orange-500/20">
                                <span className="text-sm font-mono text-orange-800 dark:text-orange-200">
                                    {step.result}
                                </span>
                            </div>
                            {step.explanation && (
                                <p className="mt-1.5 text-xs text-orange-500 dark:text-orange-400 italic leading-relaxed">
                                    {step.explanation}
                                </p>
                            )}
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    );
}

// ── Stat card (session complete) ───────────────────────────────────────────────
function StatCard({
    icon, value, label, color,
}: {
    icon: React.ReactNode;
    value: string;
    label: string;
    color: 'emerald' | 'violet' | 'blue';
}) {
    const bg = {
        emerald: 'bg-emerald-50 dark:bg-emerald-500/10',
        violet: 'bg-violet-50 dark:bg-violet-500/10',
        blue: 'bg-blue-50 dark:bg-blue-500/10',
    }[color];

    return (
        <div className={`${bg} rounded-2xl p-4 text-center border border-zinc-100 dark:border-zinc-800`}>
            <div className="flex justify-center mb-2">{icon}</div>
            <div className="text-xl font-bold text-zinc-900 dark:text-white">{value}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{label}</div>
        </div>
    );
}

// ── Question card ─────────────────────────────────────────────────────────────
function QuestionCard({
    question,
    questionIndex,
    totalQuestions,
    onAnswer,
}: {
    question: any;
    questionIndex: number;
    totalQuestions: number;
    onAnswer: (answer: string, isCorrect: boolean) => void;
}) {
    const content = question.content;
    const difficulty: number = question.difficulty ?? 1;

    const renderHeader = () => (
        <div className="mb-6">
            {/* Difficulty + type row */}
            <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1" title={`Svårighetsgrad ${difficulty}`}>
                    {[1, 2, 3, 4, 5].map((d) => (
                        <div
                            key={d}
                            className={`w-2 h-2 rounded-full transition-colors ${d <= difficulty
                                    ? difficulty <= 2
                                        ? 'bg-emerald-400'
                                        : difficulty <= 3
                                            ? 'bg-amber-400'
                                            : 'bg-red-400'
                                    : 'bg-zinc-200 dark:bg-zinc-700'
                                }`}
                        />
                    ))}
                </div>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    {difficulty <= 2 ? 'Lätt' : difficulty <= 3 ? 'Medel' : 'Svår'}
                </span>
            </div>

            {/* Question text */}
            {content.question?.text && (
                <h2 className="text-xl md:text-2xl font-semibold text-zinc-900 dark:text-white leading-relaxed">
                    {content.question.text}
                </h2>
            )}

            {/* Math block */}
            {content.question?.math && (
                <div className="mt-4 p-5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-sm overflow-x-auto">
                    <BlockMath math={content.question.math} />
                </div>
            )}
        </div>
    );

    switch (question.type) {
        case 'numeric_input':
            return (
                <div>
                    {renderHeader()}
                    <SimpleNumericInput
                        correctAnswer={question.correctAnswer}
                        onAnswer={(val, isCorrect) => onAnswer(val, isCorrect)}
                    />
                    {/* Pre-submission work-show CTA — only if the question
                        has checkpoint data and the student hasn't answered yet */}
                    {question.helps?.stepBreakdown?.steps?.length > 0 && (
                        <div className="mt-4">
                            <WorkShowPanel
                                stepBreakdown={question.helps.stepBreakdown}
                                defaultMode="cta"
                                accentColor="blue"
                            />
                        </div>
                    )}
                </div>
            );

        case 'multiple_choice':
            return (
                <div>
                    {renderHeader()}
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
                    {renderHeader()}
                    <FillBlankInput
                        question={question}
                        onAnswer={(vals, isCorrect) => onAnswer(JSON.stringify(vals), isCorrect)}
                    />
                </div>
            );

        case 'drag_drop':
            return (
                <div>
                    {renderHeader()}
                    <DragDropInput
                        question={question}
                        onAnswer={(ord, isCorrect) => onAnswer(JSON.stringify(ord), isCorrect)}
                    />
                </div>
            );

        case 'toggle':
            return (
                <div>
                    {renderHeader()}
                    <ToggleInput
                        question={question}
                        onAnswer={(states, isCorrect) => onAnswer(JSON.stringify(states), isCorrect)}
                    />
                </div>
            );

        case 'expression_builder':
            return (
                <div>
                    {renderHeader()}
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
