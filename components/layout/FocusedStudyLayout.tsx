'use client';

import { useState, ReactNode, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    ChevronLeft, X, Lightbulb, HelpCircle
} from 'lucide-react';

interface FocusedStudyLayoutProps {
    children: ReactNode;
    helpPanel?: ReactNode;
    isHelpOpen?: boolean;
    onHelpToggle?: (open: boolean) => void;
    currentCourse?: string;
    questionNumber?: number;
    totalQuestions?: number;
}

export function FocusedStudyLayout({
    children,
    helpPanel,
    isHelpOpen = false,
    onHelpToggle,
    currentCourse = "Calculus I",
    questionNumber = 1,
    totalQuestions = 10
}: FocusedStudyLayoutProps) {
    const [isMobileHelpOpen, setIsMobileHelpOpen] = useState(false);

    const handleHelpToggle = useCallback(() => {
        if (onHelpToggle) {
            onHelpToggle(!isHelpOpen);
        }
    }, [isHelpOpen, onHelpToggle]);

    const handleMobileHelpToggle = useCallback(() => {
        setIsMobileHelpOpen(!isMobileHelpOpen);
    }, [isMobileHelpOpen]);

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white transition-colors">
            {/* Minimal Header */}
            <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-100 dark:border-zinc-900">
                <div className="h-full px-4 flex items-center justify-between">
                    {/* Left: Back button */}
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="text-sm font-medium hidden sm:block">Exit</span>
                    </Link>

                    {/* Center: Progress indicator */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-zinc-400">
                            {questionNumber} / {totalQuestions}
                        </span>
                        <div className="w-32 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-zinc-400 dark:bg-zinc-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    </div>

                    {/* Right: Help button (desktop) */}
                    <button
                        onClick={handleHelpToggle}
                        className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isHelpOpen
                                ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300'
                                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            }`}
                    >
                        <Lightbulb className="w-4 h-4" />
                        <span>Help</span>
                    </button>

                    {/* Right: Help button (mobile) */}
                    <button
                        onClick={handleMobileHelpToggle}
                        className="lg:hidden p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <HelpCircle className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="pt-14 min-h-screen flex">
                {/* Main Content - Centered */}
                <main className={`flex-1 transition-all duration-300 ${isHelpOpen && helpPanel ? 'lg:mr-96' : ''
                    }`}>
                    <div className="max-w-2xl mx-auto px-4 py-8 lg:py-12">
                        {children}
                    </div>
                </main>

                {/* Help Panel (Desktop - Slide in from right) */}
                <AnimatePresence>
                    {isHelpOpen && helpPanel && (
                        <motion.aside
                            initial={{ x: '100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="hidden lg:block fixed right-0 top-14 bottom-0 w-96 bg-zinc-50 dark:bg-zinc-900 border-l border-zinc-100 dark:border-zinc-800 overflow-y-auto"
                        >
                            <div className="sticky top-0 bg-zinc-50 dark:bg-zinc-900 p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                <h3 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <Lightbulb className="w-4 h-4 text-amber-500" />
                                    Help & Resources
                                </h3>
                                <button
                                    onClick={handleHelpToggle}
                                    className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
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

                {/* Mobile Help Panel (Bottom Sheet) */}
                <AnimatePresence>
                    {isMobileHelpOpen && helpPanel && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/30 z-40 lg:hidden"
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
                                            Help & Resources
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
