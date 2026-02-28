'use client';

import { useState, ReactNode, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ChevronLeft, X, Lightbulb, HelpCircle, Zap, Flame } from 'lucide-react';

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
}: FocusedStudyLayoutProps) {
    const [isMobileHelpOpen, setIsMobileHelpOpen] = useState(false);

    const handleHelpToggle = useCallback(() => {
        onHelpToggle?.(!isHelpOpen);
    }, [isHelpOpen, onHelpToggle]);

    const progressPct = totalQuestions > 0
        ? Math.round((questionNumber / totalQuestions) * 100)
        : 0;

    const splitActive = isHelpOpen && !!helpPanel;

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
                            className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                splitActive
                                    ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300'
                                    : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            }`}
                        >
                            <Lightbulb className="w-4 h-4" />
                            <span>{splitActive ? 'Dölj handledare' : 'Hjälp'}</span>
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
                    className={`transition-all duration-300 ease-in-out overflow-y-auto ${
                        splitActive ? 'lg:w-1/2 flex-none' : 'flex-1'
                    }`}
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
                            className="hidden lg:flex fixed right-0 top-[60px] bottom-0 w-1/2 flex-col border-l border-zinc-200 dark:border-zinc-800 shadow-[-12px_0_30px_-8px_rgba(0,0,0,0.08)] dark:shadow-[-12px_0_30px_-8px_rgba(0,0,0,0.4)] z-40"
                        >
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
                                            <Lightbulb className="w-4 h-4 text-violet-500" />
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
