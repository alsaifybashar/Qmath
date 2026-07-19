'use client';

import { useState, ReactNode, useCallback, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { ChevronLeft, X, HelpCircle, Zap, Flame, MessageCircle, PanelRightOpen } from 'lucide-react';
import QuickAddTrigger from '@/components/flashcards/QuickAddTrigger';
import { drawerTransition, focusTransition, motionDuration, shellSpring } from '@/lib/motion';

interface FocusedStudyLayoutProps {
    children: ReactNode;
    helpPanel?: ReactNode;
    isHelpOpen?: boolean;
    onHelpToggle?: (open: boolean) => void;
    topicName?: string;
    topicId?: string;
    questionId?: string;
    questionText?: string;
    questionNumber?: number;
    totalQuestions?: number;
    xpEarned?: number;
    streak?: number;
    helpPanelWidth?: number;
    onHelpPanelWidthChange?: (width: number) => void;
}

export function FocusedStudyLayout({
    children,
    helpPanel,
    isHelpOpen = false,
    onHelpToggle,
    topicName,
    topicId,
    questionId,
    questionText,
    questionNumber = 1,
    totalQuestions = 10,
    xpEarned = 0,
    streak = 0,
    helpPanelWidth = 32,
    onHelpPanelWidthChange,
}: FocusedStudyLayoutProps) {
    const [isMobileHelpOpen, setIsMobileHelpOpen] = useState(false);
    const [isResizingHelp, setIsResizingHelp] = useState(false);
    const reduceMotion = useReducedMotion();

    const handleHelpToggle = useCallback(() => {
        onHelpToggle?.(!isHelpOpen);
    }, [isHelpOpen, onHelpToggle]);

    const progressPct = totalQuestions > 0
        ? Math.round((questionNumber / totalQuestions) * 100)
        : 0;

    const splitActive = isHelpOpen && !!helpPanel;
    const clampedHelpWidth = Math.min(56, Math.max(28, helpPanelWidth));
    const shouldStretchQuestionPane = splitActive && clampedHelpWidth >= 50;

    const handleHelpResizeStart = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
        if (!onHelpPanelWidthChange) return;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        setIsResizingHelp(true);
        const previousCursor = document.body.style.cursor;
        const previousUserSelect = document.body.style.userSelect;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const applyWidth = (clientX: number) => {
            const nextWidth = ((window.innerWidth - clientX) / window.innerWidth) * 100;
            onHelpPanelWidthChange(Math.min(56, Math.max(28, Math.round(nextWidth))));
        };

        applyWidth(event.clientX);

        const handlePointerMove = (moveEvent: PointerEvent) => {
            applyWidth(moveEvent.clientX);
        };

        const handlePointerUp = () => {
            setIsResizingHelp(false);
            document.body.style.cursor = previousCursor;
            document.body.style.userSelect = previousUserSelect;
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);
    }, [onHelpPanelWidthChange]);

    return (
        <div className="study-focus min-h-screen bg-zinc-50 text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-white">

            {/* ── Fixed Header ──────────────────────────────────────────────── */}
            <header className="fixed left-0 right-0 top-0 z-50 border-b border-zinc-200/80 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/92">
                <div className="mx-auto flex h-14 max-w-[1680px] items-center gap-4 px-4">

                    {/* Left: back */}
                    <Link
                        href="/practice"
                        className="flex flex-shrink-0 items-center gap-1.5 rounded-lg px-1.5 py-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="text-sm font-medium hidden sm:block">Avsluta</span>
                    </Link>

                    {/* Center: topic + counter */}
                    <div className="flex-1 flex flex-col items-center justify-center min-w-0">
                        {topicName && (
                            <span className="mb-0.5 max-w-full truncate text-[11px] font-semibold leading-none text-zinc-500 dark:text-zinc-400">
                                {topicName}
                            </span>
                        )}
                        <span className="text-sm font-bold leading-none text-zinc-800 dark:text-zinc-200">
                            {questionNumber} / {totalQuestions}
                        </span>
                    </div>

                    {/* Right: XP + streak + help */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {xpEarned > 0 && (
                            <motion.div
                                key={xpEarned}
                                initial={reduceMotion ? false : { scale: 0.96, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={reduceMotion ? { duration: 0 } : shellSpring}
                                className="flex items-center gap-1 rounded-lg bg-violet-50 px-2 py-1 dark:bg-violet-500/10"
                            >
                                <Zap className="w-3 h-3 text-violet-500" />
                                <span className="text-xs font-bold text-violet-600 dark:text-violet-400">{xpEarned}</span>
                            </motion.div>
                        )}
                        {streak >= 2 && (
                            <motion.div
                                initial={reduceMotion ? false : { scale: 0.96, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={reduceMotion ? { duration: 0 } : shellSpring}
                                className="flex items-center gap-1 px-2 py-1 bg-orange-50 dark:bg-orange-500/10 rounded-lg"
                            >
                                <Flame className="w-3 h-3 text-orange-500" />
                                <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{streak}</span>
                            </motion.div>
                        )}

                        {/* Quick-add flashcard */}
                        <QuickAddTrigger
                            topicName={topicName}
                            topicId={topicId}
                            sourceContextId={questionId}
                            prefillFront={questionText}
                        />

                        {/* Help toggle — desktop */}
                        <button
                            onClick={handleHelpToggle}
                            aria-pressed={splitActive}
                            className={`hidden items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-semibold shadow-sm transition lg:flex ${
                                splitActive
                                    ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-300/25 dark:bg-blue-300/10 dark:text-blue-100'
                                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-blue-200 hover:text-blue-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:text-white'
                            }`}
                        >
                            {splitActive ? <PanelRightOpen className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
                            <span>{splitActive ? 'AI öppen' : 'Fråga AI'}</span>
                        </button>

                        {/* Help — mobile */}
                        <button
                            onClick={() => setIsMobileHelpOpen(true)}
                            className="lg:hidden p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <HelpCircle className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="h-0.5 bg-zinc-100 dark:bg-zinc-900">
                    <motion.div
                        className="h-full origin-left bg-blue-600 dark:bg-blue-300"
                        initial={reduceMotion ? false : { scaleX: 0 }}
                        animate={{ scaleX: progressPct / 100 }}
                        transition={reduceMotion ? { duration: 0 } : focusTransition}
                    />
                </div>
            </header>

            {/* ── Body below fixed header ───────────────────────────────────── */}
            <div className="pt-[60px] min-h-screen flex">

                {/* ── LEFT: Question content ──────────────────────────────── */}
                <main
                    className={`overflow-y-auto ${
                        splitActive ? 'lg:flex-none lg:[width:calc(100%_-_var(--help-panel-width))]' : 'flex-1'
                    }`}
                    style={splitActive ? { '--help-panel-width': `${clampedHelpWidth}vw` } as CSSProperties : undefined}
                >
                    <div className={`px-4 py-6 sm:px-6 lg:py-10 ${shouldStretchQuestionPane ? 'w-full lg:px-8' : 'mx-auto max-w-4xl lg:px-8'}`}>
                        {children}
                    </div>
                </main>

                {/* ── RIGHT: AI Tutor panel — desktop only ────────────────── */}
                <AnimatePresence>
                    {splitActive && (
                        <motion.aside
                            key="ai-panel-right"
                            initial={reduceMotion ? false : { x: 24, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={reduceMotion ? { opacity: 0 } : { x: 24, opacity: 0 }}
                            transition={reduceMotion ? { duration: 0 } : focusTransition}
                            className="fixed bottom-0 right-0 top-[60px] z-40 hidden flex-col border-l border-zinc-200 bg-white shadow-[-18px_0_55px_-28px_rgba(24,24,27,0.32)] dark:border-white/10 dark:bg-zinc-950 dark:shadow-[-18px_0_60px_-30px_rgba(0,0,0,0.8)] lg:flex"
                            style={{ width: `${clampedHelpWidth}vw` }}
                        >
                            <div
                                role="separator"
                                aria-orientation="vertical"
                                aria-label="Ändra bredd på AI-handledaren"
                                aria-valuemin={28}
                                aria-valuemax={56}
                                aria-valuenow={clampedHelpWidth}
                                onPointerDown={handleHelpResizeStart}
                                className={`group absolute inset-y-0 left-0 z-20 -translate-x-1/2 cursor-col-resize touch-none px-2 ${
                                    isResizingHelp ? 'select-none' : ''
                                }`}
                            >
                                <div className={`h-full w-px transition-colors ${
                                    isResizingHelp
                                        ? 'bg-violet-500'
                                        : 'bg-transparent group-hover:bg-violet-400/70'
                                }`} />
                                <div className={`absolute left-1/2 top-1/2 flex h-16 w-2 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border backdrop-blur-xl transition-all ${
                                    isResizingHelp
                                        ? 'border-violet-400 bg-violet-500 shadow-lg shadow-violet-500/20'
                                        : 'border-white/70 bg-white/70 opacity-0 shadow-sm group-hover:opacity-100 dark:border-white/10 dark:bg-zinc-900/80'
                                }`}>
                                    <div className={`h-8 w-0.5 rounded-full ${
                                        isResizingHelp ? 'bg-white' : 'bg-zinc-400 dark:bg-zinc-500'
                                    }`} />
                                </div>
                            </div>
                            {helpPanel}
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* ── Mobile bottom sheet ─────────────────────────────────── */}
                <AnimatePresence>
                    {isMobileHelpOpen && helpPanel && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: reduceMotion ? 0 : motionDuration.fast }}
                                className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                                onClick={() => setIsMobileHelpOpen(false)}
                            />
                            <motion.div
                                initial={reduceMotion ? false : { y: '100%' }}
                                animate={{ y: 0 }}
                                exit={reduceMotion ? { opacity: 0 } : { y: '100%' }}
                                transition={reduceMotion ? { duration: 0 } : drawerTransition}
                                className="fixed inset-x-0 bottom-0 z-50 flex h-[85vh] flex-col overflow-hidden rounded-t-2xl border-t border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-950 lg:hidden"
                            >
                                {/* Drag handle + close */}
                                <div className="flex-none pt-3 pb-2 px-4 flex flex-col items-center border-b border-zinc-200 dark:border-zinc-800">
                                    <div className="w-10 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full mb-3" />
                                    <div className="flex items-center justify-between w-full">
                                        <span className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                                            <MessageCircle className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                                            AI-handledare
                                        </span>
                                        <button
                                            onClick={() => setIsMobileHelpOpen(false)}
                                            className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded-lg"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    {helpPanel}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
