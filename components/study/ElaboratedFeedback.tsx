'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle, CheckCircle2, XCircle, BookOpen,
    ChevronDown, ChevronUp, ArrowRight, Sparkles, Brain
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { MathRenderer } from './MathRenderer';
import type { ErrorClassification } from '@/app/actions/error-classifier';

const BlockMath = dynamic(
    () => import('react-katex').then((mod) => mod.BlockMath),
    { ssr: false }
);

// ============================================================================
// TYPES
// ============================================================================

interface ElaboratedFeedbackProps {
    isCorrect: boolean;
    classification?: ErrorClassification | null;
    correctAnswer: string;
    studentAnswer: string;
    explanationMarkdown?: string;
    /** Callback to start a prerequisite detour */
    onReviewPrerequisite?: (topicId: string) => void;
    /** Callback to see a worked example */
    onSeeWorkedExample?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Elaborated Feedback Panel
 *
 * Replaces simple "correct/incorrect" toasts with rich, research-backed feedback:
 *   1. What went wrong (specific to the error type)
 *   2. The relevant concept/formula (linked)
 *   3. "Granska detta begrepp" button → triggers prerequisite detour
 *   4. "Se löst exempel" button → leverages existing faded worked examples
 *
 * Research: elaborated feedback (d = 0.49) vs. simple correctness feedback (d = 0.05)
 */
export function ElaboratedFeedback({
    isCorrect,
    classification,
    correctAnswer,
    studentAnswer,
    explanationMarkdown,
    onReviewPrerequisite,
    onSeeWorkedExample,
}: ElaboratedFeedbackProps) {
    const [expanded, setExpanded] = useState(!isCorrect); // Auto-expand on wrong answer
    const [showExplanation, setShowExplanation] = useState(false);

    // ── Correct answer feedback ──
    if (isCorrect) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-2xl"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-500/20 rounded-xl">
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <p className="font-semibold text-green-800 dark:text-green-300">Rätt svar!</p>
                        {classification?.feedback && (
                            <p className="text-sm text-green-700 dark:text-green-400 mt-0.5">
                                {classification.feedback}
                            </p>
                        )}
                    </div>
                </div>

                {/* Explanation toggle */}
                {explanationMarkdown && (
                    <div className="mt-3 pt-3 border-t border-green-200/50 dark:border-green-500/10">
                        <button
                            onClick={() => setShowExplanation(!showExplanation)}
                            className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 hover:text-green-700 transition-colors"
                        >
                            <BookOpen className="w-4 h-4" />
                            {showExplanation ? 'Dölj lösning' : 'Visa lösning'}
                            {showExplanation ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        <AnimatePresence>
                            {showExplanation && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="mt-2 text-sm text-green-800 dark:text-green-300 overflow-hidden"
                                >
                                    <div className="p-3 bg-green-100/50 dark:bg-green-500/5 rounded-xl">
                                        {explanationMarkdown}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </motion.div>
        );
    }

    // ── Wrong answer feedback ──
    const errorTypeLabels: Record<string, { label: string; color: string; icon: typeof AlertTriangle }> = {
        conceptual: { label: 'Begreppsfel', color: 'red', icon: Brain },
        computational: { label: 'Beräkningsfel', color: 'orange', icon: AlertTriangle },
        notation: { label: 'Notationsfel', color: 'amber', icon: AlertTriangle },
        interpretation: { label: 'Tolkningsfel', color: 'purple', icon: AlertTriangle },
        incomplete: { label: 'Ofullständigt svar', color: 'blue', icon: AlertTriangle },
        time_pressure: { label: 'Tidsbrist', color: 'zinc', icon: AlertTriangle },
    };

    const errorInfo = classification ? errorTypeLabels[classification.errorType] || errorTypeLabels.computational : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/15 rounded-2xl overflow-hidden"
        >
            {/* Header */}
            <div
                className="p-4 cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-500/15 rounded-xl shrink-0">
                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-red-800 dark:text-red-300">Inte riktigt</p>
                            {errorInfo && (
                                <span className={`text-xs px-2 py-0.5 rounded-full bg-${errorInfo.color}-100 dark:bg-${errorInfo.color}-500/10 text-${errorInfo.color}-700 dark:text-${errorInfo.color}-400 font-medium`}>
                                    {errorInfo.label}
                                </span>
                            )}
                        </div>

                        {/* Primary feedback — specific to the error */}
                        {classification?.feedbackSv ? (
                            <p className="text-sm text-red-700 dark:text-red-400 mt-1 leading-relaxed">
                                {classification.feedbackSv}
                            </p>
                        ) : classification?.feedback ? (
                            <p className="text-sm text-red-700 dark:text-red-400 mt-1 leading-relaxed">
                                {classification.feedback}
                            </p>
                        ) : (
                            <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                                Det rätta svaret är <span className="font-mono font-bold">{correctAnswer}</span>
                            </p>
                        )}

                        {/* Misconception badge */}
                        {classification?.misconceptionCode && (
                            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-medium">
                                <Sparkles className="w-3 h-3" />
                                Vanligt tankemönster identifierat
                            </div>
                        )}
                    </div>

                    <button className="p-1 text-red-400 shrink-0">
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Expanded details */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 space-y-3">
                            {/* Your answer vs correct */}
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="p-3 bg-red-100/50 dark:bg-red-500/5 rounded-xl">
                                    <div className="text-xs text-red-500 dark:text-red-400 mb-1 font-medium">Ditt svar</div>
                                    <div className="break-all">
                                        {studentAnswer ? (
                                            <MathRenderer text={studentAnswer} className="font-mono text-red-800 dark:text-red-300" />
                                        ) : (
                                            <div className="font-mono text-red-800 dark:text-red-300">(tomt)</div>
                                        )}
                                    </div>
                                </div>
                                <div className="p-3 bg-green-100/50 dark:bg-green-500/5 rounded-xl">
                                    <div className="text-xs text-green-600 dark:text-green-400 mb-1 font-medium">Rätt svar</div>
                                    <div className="break-all">
                                        {correctAnswer ? (
                                            <MathRenderer text={correctAnswer} className="font-mono text-green-800 dark:text-green-300" />
                                        ) : (
                                            <div className="font-mono text-green-800 dark:text-green-300">(ingen)</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Explanation */}
                            {explanationMarkdown && (
                                <div className="p-3 bg-white/50 dark:bg-zinc-800/50 rounded-xl text-sm text-zinc-700 dark:text-zinc-300">
                                    <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 mb-2">
                                        <BookOpen className="w-3 h-3" />
                                        Lösning
                                    </div>
                                    <div className="leading-relaxed">
                                        {typeof explanationMarkdown === 'string' ? (
                                            <MathRenderer text={explanationMarkdown} />
                                        ) : (
                                            explanationMarkdown
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-2 pt-1">
                                {classification?.remediationTopicId && onReviewPrerequisite && (
                                    <button
                                        onClick={() => onReviewPrerequisite(classification.remediationTopicId!)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-xl text-sm font-medium hover:bg-amber-200 dark:hover:bg-amber-500/20 transition-colors"
                                    >
                                        <Brain className="w-4 h-4" />
                                        Granska detta begrepp
                                    </button>
                                )}
                                {onSeeWorkedExample && (
                                    <button
                                        onClick={onSeeWorkedExample}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-xl text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-500/20 transition-colors"
                                    >
                                        <BookOpen className="w-4 h-4" />
                                        Se löst exempel
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
