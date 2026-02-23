'use client';

/**
 * GuidancePanel
 * ─────────────────────────────────────────────────────────────────────────────
 * Displays admin-authored guidance steps progressively after a wrong answer.
 *
 * Design principles:
 *  - Guides the student's THINKING — never reveals the correct answer
 *  - Steps are revealed one at a time to avoid overwhelming the student
 *  - Each step is plain text/markdown with optional inline math ($...$)
 *  - A "Nästa ledtråd" button reveals the next step
 *  - When all steps are shown, offers to move to the solution checkpoints
 *
 * Usage:
 *   <GuidancePanel
 *     steps={question.helps.guidanceSteps}
 *     onDone={onRequestFullSolution}
 *   />
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ChevronDown, BookOpen, CheckCircle } from 'lucide-react';
import dynamic from 'next/dynamic';

// Render inline math inside a guidance step content string.
// Splits on $...$ (inline) and $$...$$ (block) delimiters.
function GuidanceContent({ content }: { content: string }) {
    // We lazily import InlineMath to avoid SSR issues
    const InlineMath = dynamic(
        () => import('react-katex').then((m) => m.InlineMath),
        { ssr: false, loading: () => <span>…</span> }
    );
    const BlockMath = dynamic(
        () => import('react-katex').then((m) => m.BlockMath),
        { ssr: false, loading: () => <span>…</span> }
    );

    // First split on $$...$$ (block), then on $...$ (inline)
    const blockParts = content.split(/(\$\$[\s\S]*?\$\$)/g);
    return (
        <span className="text-sm text-orange-800 dark:text-orange-200 leading-relaxed">
            {blockParts.map((part, bi) => {
                const blockMatch = part.match(/^\$\$([\s\S]*?)\$\$$/);
                if (blockMatch) {
                    return (
                        <div key={bi} className="overflow-x-auto py-1 my-1">
                            <BlockMath math={blockMatch[1].trim()} />
                        </div>
                    );
                }
                // Inline math within the text segment
                const inlineParts = part.split(/(\$[^$]+?\$)/g);
                return (
                    <span key={bi}>
                        {inlineParts.map((seg, si) => {
                            const inlineMatch = seg.match(/^\$([^$]+?)\$$/);
                            if (inlineMatch) {
                                return <InlineMath key={si} math={inlineMatch[1]} />;
                            }
                            return <span key={si}>{seg}</span>;
                        })}
                    </span>
                );
            })}
        </span>
    );
}

export interface GuidancePanelProps {
    steps: Array<{ id: string; order: number; content: string }>;
    /** Called when the student is done with guidance and wants the solution */
    onDone?: () => void;
    /** Label for the "done" button. Defaults to "Visa lösningssteg" */
    doneLabel?: string;
}

export function GuidancePanel({ steps, onDone, doneLabel = 'Visa lösningssteg' }: GuidancePanelProps) {
    const sorted = [...steps].sort((a, b) => a.order - b.order);
    const [revealedCount, setRevealedCount] = useState(0);
    const [isStarted, setIsStarted] = useState(false);

    const allRevealed = revealedCount >= sorted.length;
    const nextStep = sorted[revealedCount];

    const handleStart = () => {
        setIsStarted(true);
        setRevealedCount(1);
    };

    const handleNext = () => {
        setRevealedCount(c => Math.min(c + 1, sorted.length));
    };

    return (
        <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-500/8 overflow-hidden">
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="px-4 py-3 flex items-center gap-2.5 border-b border-amber-200/60 dark:border-amber-500/20">
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                        Ledtrådar
                    </p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400">
                        {isStarted
                            ? `${revealedCount} av ${sorted.length} visade`
                            : `${sorted.length} vägledningssteg tillgängliga`}
                    </p>
                </div>
                {/* Progress dots */}
                {isStarted && (
                    <div className="flex gap-1">
                        {sorted.map((_, i) => (
                            <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                    i < revealedCount
                                        ? 'bg-amber-500 dark:bg-amber-400'
                                        : 'bg-amber-200 dark:bg-amber-700'
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Content area ────────────────────────────────────────────── */}
            <div className="px-4 py-3 space-y-2.5">
                {!isStarted && (
                    <button
                        type="button"
                        onClick={handleStart}
                        className="w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100/60 dark:hover:bg-amber-500/10 font-medium text-sm transition-all flex items-center justify-center gap-2"
                    >
                        <Lightbulb className="w-4 h-4" />
                        Visa första ledtråden
                    </button>
                )}

                {/* Revealed steps */}
                <AnimatePresence initial={false}>
                    {isStarted && sorted.slice(0, revealedCount).map((step, i) => (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                            className="flex items-start gap-3"
                        >
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold transition-colors ${
                                i < revealedCount - 1
                                    ? 'bg-amber-200 dark:bg-amber-700 text-amber-700 dark:text-amber-200'
                                    : 'bg-amber-500 dark:bg-amber-400 text-white dark:text-amber-900'
                            }`}>
                                {i + 1}
                            </div>
                            <GuidanceContent content={step.content} />
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Next hint / done buttons */}
                {isStarted && !allRevealed && (
                    <motion.button
                        key="next-hint"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        type="button"
                        onClick={handleNext}
                        className="flex items-center gap-2 text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 text-xs font-medium transition-colors py-1"
                    >
                        <ChevronDown className="w-3.5 h-3.5" />
                        Nästa ledtråd ({revealedCount + 1}/{sorted.length})
                    </motion.button>
                )}

                {isStarted && allRevealed && onDone && (
                    <motion.button
                        key="done-btn"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        type="button"
                        onClick={onDone}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-100 dark:bg-amber-500/15 hover:bg-amber-200 dark:hover:bg-amber-500/25 text-amber-800 dark:text-amber-200 text-sm font-medium transition-colors border border-amber-200 dark:border-amber-500/30"
                    >
                        <BookOpen className="w-4 h-4" />
                        {doneLabel}
                    </motion.button>
                )}

                {isStarted && allRevealed && !onDone && (
                    <motion.div
                        key="all-shown"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs"
                    >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Alla ledtrådar visade
                    </motion.div>
                )}
            </div>
        </div>
    );
}
