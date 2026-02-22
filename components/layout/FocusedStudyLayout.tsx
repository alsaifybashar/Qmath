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

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white transition-colors">

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-100 dark:border-zinc-900">
                {/* Main header row */}
                <div className="h-14 px-4 flex items-center gap-4">

                    {/* Left: back link */}
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
                        {/* XP counter — animates on change */}
                        {xpEarned > 0 && (
                            <motion.div
                                key={xpEarned}
                                initial={{ scale: 1.3, opacity: 0.7 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', damping: 10 }}
                                className="flex items-center gap-1 px-2 py-1 bg-violet-50 dark:bg-violet-500/10 rounded-lg"
                            >
                                <Zap className="w-3 h-3 text-violet-500" />
                                <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                                    {xpEarned}
                                </span>
                            </motion.div>
                        )}

                        {/* Streak badge (shows at 2+) */}
                        {streak >= 2 && (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex items-center gap-1 px-2 py-1 bg-orange-50 dark:bg-orange-500/10 rounded-lg"
                            >
                                <Flame className="w-3 h-3 text-orange-500" />
                                <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                                    {streak}
                                </span>
                            </motion.div>
                        )}

                        {/* Help — desktop */}
                        <button
                            onClick={handleHelpToggle}
                            className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                isHelpOpen
                                    ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                    : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            }`}
                        >
                            <Lightbulb className="w-4 h-4" />
                            <span>Hjälp</span>
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

                {/* Colored progress bar */}
                <div className="h-1 bg-zinc-100 dark:bg-zinc-800">
                    <motion.div
                        className="h-full bg-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                </div>
            </header>

            {/* ── Main content (offset 60px = 56px header + 4px bar) ─────────── */}
            <div className="pt-[60px] min-h-screen flex">
                <main className={`flex-1 transition-all duration-300 ${
                    isHelpOpen && helpPanel ? 'lg:mr-96' : ''
                }`}>
                    <div className="max-w-2xl mx-auto px-4 py-8 lg:py-12">
                        {children}
                    </div>
                </main>

                {/* Help panel — desktop (slide in from right) */}
                <AnimatePresence>
                    {isHelpOpen && helpPanel && (
                        <motion.aside
                            initial={{ x: '100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="hidden lg:block fixed right-0 top-[60px] bottom-0 w-96 bg-white dark:bg-zinc-900 border-l border-zinc-100 dark:border-zinc-800 overflow-y-auto"
                        >
                            <div className="sticky top-0 bg-white dark:bg-zinc-900 p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                <h3 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <Lightbulb className="w-4 h-4 text-amber-500" />
                                    Hjälp & resurser
                                </h3>
                                <button
                                    onClick={handleHelpToggle}
                                    className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-4">
                                {helpPanel}
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* Help panel — mobile (bottom sheet) */}
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
                                className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-zinc-900 rounded-t-2xl max-h-[80vh] overflow-y-auto lg:hidden"
                            >
                                <div className="sticky top-0 bg-white dark:bg-zinc-900 p-4 border-b border-zinc-100 dark:border-zinc-800">
                                    <div className="w-10 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full mx-auto mb-3" />
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <Lightbulb className="w-4 h-4 text-amber-500" />
                                            Hjälp & resurser
                                        </h3>
                                        <button
                                            onClick={() => setIsMobileHelpOpen(false)}
                                            className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4 pb-8">
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
