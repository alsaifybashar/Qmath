'use client';

/**
 * FeedbackRenderer — Animated feedback display for CAS grading results.
 *
 * States:
 *  correct        → green celebration with confetti ring
 *  partial        → amber nudge with hint
 *  wrong          → animated red card with misconception message + collapsible hint
 *  syntax_error   → neutral gray "we couldn't read this"
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, ChevronDown, Lightbulb, ExternalLink } from 'lucide-react';

export interface FeedbackData {
    code: string;
    message: string;
    hint?: string;
    remediationTopicSlug?: string;
}

interface FeedbackRendererProps {
    isCorrect: boolean;
    partialScore: number;
    feedback: FeedbackData | null;
    parsedStudent?: string;
    onTryAgain?: () => void;
    onShowHint?: () => void;
}

export function FeedbackRenderer({
    isCorrect,
    partialScore,
    feedback,
    parsedStudent,
    onTryAgain,
}: FeedbackRendererProps) {
    const [hintOpen, setHintOpen] = useState(false);

    if (isCorrect) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ type: 'spring', stiffness: 340, damping: 22 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30"
            >
                <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.05 }}
                >
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                </motion.div>
                <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                    Rätt svar!
                </span>
            </motion.div>
        );
    }

    // Partial: high partial score but not fully correct (e.g. forgot C)
    if (!isCorrect && partialScore >= 0.7) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/5 overflow-hidden"
            >
                <div className="flex items-start gap-3 px-4 py-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                            Nästan rätt!
                        </p>
                        {feedback?.message && (
                            <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
                                {feedback.message}
                            </p>
                        )}
                    </div>
                </div>

                {feedback?.hint && (
                    <div className="border-t border-amber-100 dark:border-amber-500/20">
                        <button
                            onClick={() => setHintOpen(v => !v)}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100/50 dark:hover:bg-amber-500/10 transition-colors"
                        >
                            <Lightbulb className="w-3.5 h-3.5" />
                            {hintOpen ? 'Dölj tips' : 'Visa tips'}
                            <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform ${hintOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                            {hintOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <p className="px-4 pb-3 text-sm text-amber-700 dark:text-amber-300">
                                        {feedback.hint}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {onTryAgain && (
                    <div className="px-4 pb-3">
                        <button
                            onClick={onTryAgain}
                            className="px-4 py-2 rounded-lg text-sm font-medium border border-amber-200 dark:border-amber-300/30 text-amber-700 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-400/10 transition-colors"
                        >
                            Skriv om
                        </button>
                    </div>
                )}
            </motion.div>
        );
    }

    // Wrong
    return (
        <motion.div
            initial={{ opacity: 0, y: 8, x: -4 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/5 overflow-hidden"
        >
            <div className="flex items-start gap-3 px-4 py-3">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, delay: 0.05 }}
                >
                    <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                </motion.div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                        Inte riktigt
                    </p>
                    {feedback?.message && (
                        <p className="text-sm text-red-700 dark:text-red-400 mt-0.5 leading-relaxed">
                            {feedback.message}
                        </p>
                    )}
                    {parsedStudent && (
                        <p className="text-xs text-red-500/70 dark:text-red-400/50 mt-1 font-mono">
                            Tolkades som: {parsedStudent}
                        </p>
                    )}
                </div>
            </div>

            {(feedback?.hint || feedback?.remediationTopicSlug) && (
                <div className="border-t border-red-100 dark:border-red-500/20">
                    <button
                        onClick={() => setHintOpen(v => !v)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100/50 dark:hover:bg-red-500/10 transition-colors"
                    >
                        <Lightbulb className="w-3.5 h-3.5" />
                        {hintOpen ? 'Dölj tips' : 'Visa tips'}
                        <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform ${hintOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {hintOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="px-4 pb-3 space-y-2">
                                    {feedback.hint && (
                                        <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                                            {feedback.hint}
                                        </p>
                                    )}
                                    {feedback.remediationTopicSlug && (
                                        <a
                                            href={`/study?topic=${feedback.remediationTopicSlug}`}
                                            className="inline-flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 hover:underline font-medium"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                            Repetera grunderna för detta
                                        </a>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {onTryAgain && (
                <div className="px-4 pb-3 border-t border-amber-200 dark:border-amber-300/20 pt-2">
                    <button
                        onClick={onTryAgain}
                        className="px-4 py-2 rounded-lg text-sm font-medium border border-amber-200 dark:border-amber-300/30 text-amber-700 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-400/10 transition-colors"
                    >
                        Skriv om
                    </button>
                </div>
            )}
        </motion.div>
    );
}
