'use client';

import { useState, ReactNode, useCallback, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ChevronLeft, X, HelpCircle, Zap, Flame, Sparkles, Brain, Star } from 'lucide-react';

interface FocusedStudyLayoutProps {
    children: ReactNode;
    helpPanel?: ReactNode;
    isHelpOpen?: boolean;
    onHelpToggle?: (open: boolean) => void;
    topicName?: string;
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
    questionNumber = 1,
    totalQuestions = 10,
    xpEarned = 0,
    streak = 0,
    helpPanelWidth = 32,
    onHelpPanelWidthChange,
}: FocusedStudyLayoutProps) {
    const [isMobileHelpOpen, setIsMobileHelpOpen] = useState(false);
    const [isResizingHelp, setIsResizingHelp] = useState(false);

    const handleHelpToggle = useCallback(() => {
        onHelpToggle?.(!isHelpOpen);
    }, [isHelpOpen, onHelpToggle]);

    const progressPct = totalQuestions > 0
        ? Math.round((questionNumber / totalQuestions) * 100)
        : 0;

    const splitActive = isHelpOpen && !!helpPanel;
    const clampedHelpWidth = Math.min(56, Math.max(28, helpPanelWidth));

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
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white transition-colors">

            {/* ── Fixed Header ──────────────────────────────────────────────── */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-100 dark:border-zinc-900">
                <div className="h-14 px-4 flex items-center gap-4">

                    {/* Left: back */}
                    <Link
                        href="/practice"
                        className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors flex-shrink-0"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="text-sm font-medium hidden sm:block">Avsluta</span>
                    </Link>

                    {/* Center: topic + counter */}
                    <div className="flex-1 flex flex-col items-center justify-center min-w-0">
                        {topicName && (
                            <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 truncate max-w-full leading-none mb-0.5">
                                {topicName}
                            </span>
                        )}
                        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 leading-none">
                            {questionNumber} / {totalQuestions}
                        </span>
                    </div>

                    {/* Right: XP + streak + help */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {xpEarned > 0 && (
                            <motion.div
                                key={xpEarned}
                                initial={{ scale: 1.3, opacity: 0.7 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', damping: 10 }}
                                className="flex items-center gap-1 px-2 py-1 bg-violet-50 dark:bg-violet-500/10 rounded-lg"
                            >
                                <Zap className="w-3 h-3 text-violet-500" />
                                <span className="text-xs font-bold text-violet-600 dark:text-violet-400">{xpEarned}</span>
                            </motion.div>
                        )}
                        {streak >= 2 && (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex items-center gap-1 px-2 py-1 bg-orange-50 dark:bg-orange-500/10 rounded-lg"
                            >
                                <Flame className="w-3 h-3 text-orange-500" />
                                <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{streak}</span>
                            </motion.div>
                        )}

                        {/* Help toggle — desktop */}
                        <button
                            onClick={handleHelpToggle}
                            aria-pressed={splitActive}
                            className={`group relative overflow-hidden hidden lg:flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold shadow-sm backdrop-blur-xl transition-all duration-700 ease-in-out ${
                                splitActive
                                    ? 'border-primary-500/50 bg-white/70 text-zinc-950 shadow-lg shadow-primary-500/20 dark:border-white/10 dark:bg-white/10 dark:text-white'
                                    : 'border-zinc-200/50 bg-white/55 text-zinc-600 hover:border-primary-400 hover:text-zinc-950 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-300 dark:hover:border-primary-500/50 dark:hover:text-white shadow-glass'
                            }`}
                        >
                            {/* Neural flow background effect */}
                            <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[length:200%_200%] animate-gradient bg-gradient-to-br from-primary-500/10 via-accent-500/10 to-primary-500/10" />

                            <span className={`relative flex h-6 w-6 items-center justify-center rounded-full transition-all duration-700 group-hover:scale-110 group-hover:rotate-[15deg] ${
                                splitActive
                                    ? 'bg-gradient-to-br from-primary-600 to-accent-600 text-white shadow-lg shadow-primary-600/25'
                                    : 'bg-gradient-to-br from-primary-500/10 to-accent-500/10 text-primary-600 group-hover:bg-gradient-to-br group-hover:from-primary-500 group-hover:to-accent-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary-500/30'
                            }`}>
                                <Star className={`h-3.5 w-3.5 transition-all duration-700 ${splitActive ? 'fill-current' : 'group-hover:fill-current'}`} />
                                <Star className={`absolute -top-0.5 -right-0.5 h-2 w-2 transition-all duration-1000 delay-100 opacity-0 group-hover:opacity-100 group-hover:rotate-[-15deg] ${splitActive ? 'fill-current text-white/80' : 'fill-accent-400 text-accent-400'}`} />
                            </span>
                            <span className="relative z-10">{splitActive ? 'Handledare' : 'Chit-Chat'}</span>

                            {/* Shimmer "Spark" */}
                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-primary-500/5 to-transparent" />
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
                <div className="h-1 bg-zinc-100 dark:bg-zinc-800">
                    <motion.div
                        className="h-full bg-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                </div>
            </header>

            {/* ── Body below fixed header ───────────────────────────────────── */}
            <div className="pt-[60px] min-h-screen flex">

                {/* ── LEFT: Question content ──────────────────────────────── */}
                <main
                    className={`${isResizingHelp ? '' : 'transition-all duration-300 ease-in-out'} overflow-y-auto ${
                        splitActive ? 'lg:flex-none lg:[width:calc(100%_-_var(--help-panel-width))]' : 'flex-1'
                    }`}
                    style={splitActive ? { '--help-panel-width': `${clampedHelpWidth}vw` } as CSSProperties : undefined}
                >
                    <div className={`py-8 lg:py-12 px-4 sm:px-6 ${splitActive ? 'max-w-xl mx-auto lg:px-8' : 'max-w-4xl mx-auto lg:px-8'}`}>
                        {children}
                    </div>
                </main>

                {/* ── RIGHT: AI Tutor panel — desktop only ────────────────── */}
                <AnimatePresence>
                    {splitActive && (
                        <motion.aside
                            key="ai-panel-right"
                            initial={{ x: '100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                            className="hidden lg:flex fixed right-0 top-[60px] bottom-0 flex-col border-l border-white/60 bg-white/45 shadow-[-18px_0_55px_-24px_rgba(24,24,27,0.35)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/45 dark:shadow-[-18px_0_60px_-24px_rgba(0,0,0,0.8)] z-40"
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
                                className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                                onClick={() => setIsMobileHelpOpen(false)}
                            />
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl h-[85vh] overflow-hidden lg:hidden flex flex-col bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800"
                            >
                                {/* Drag handle + close */}
                                <div className="flex-none pt-3 pb-2 px-4 flex flex-col items-center border-b border-zinc-200 dark:border-zinc-800">
                                    <div className="w-10 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full mb-3" />
                                    <div className="flex items-center justify-between w-full">
                                        <span className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                                            <Star className="w-4 h-4 text-violet-500 fill-current" />
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
