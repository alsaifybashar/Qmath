'use client';

/**
 * WorkShowPanel
 * ─────────────────────────────────────────────────────────────────────────────
 * Implements the three-scenario "show-your-work" flow:
 *
 *  CTA mode        – single ghost button "✨ Stuck? Show work for hints"
 *  Checkpoint mode  – one focused step at a time with completed pills above;
 *                    future steps hidden entirely.
 *  (Full solution) – delegated to caller via onRequestFullSolution()
 *
 * "Focused Step" design:
 *   - Only the active step is shown prominently with spacious layout
 *   - Completed steps collapse into small status pills
 *   - Future steps are completely hidden (no locked placeholders)
 *   - After all steps: a structured diagnosis summary
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, ChevronDown, Check, X, SkipForward, BookOpen, ChevronRight,
} from 'lucide-react';
import { MathRenderer } from './MathRenderer';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type WorkShowMode = 'cta' | 'checkpoints';

export interface StepBreakdown {
    intro: string;
    steps: Array<{ prompt: string; correctAnswer: string; hint?: string }>;
    conclusion: string;
}

type StepStatus = 'idle' | 'correct' | 'wrong' | 'advancing' | 'skipped';

export interface WorkShowPanelProps {
    stepBreakdown: StepBreakdown;
    /** Start mode. 'cta' for pre-submission; 'checkpoints' right after wrong. */
    defaultMode?: WorkShowMode;
    /** Orange = post-wrong (inside WrongFeedback); blue = pre-submission. */
    accentColor?: 'orange' | 'blue';
    /** Called when user clicks "show full solution instead" */
    onRequestFullSolution?: () => void;
    /** Max checkpoints shown. Hard cap per spec. */
    maxCheckpoints?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function normalise(raw: string): string {
    return raw
        .toLowerCase()
        .replace(/\$\$/g, '')
        .replace(/\\\w+/g, '')
        .replace(/[{}\s]/g, '')
        .replace(/\.?0+$/, '');
}

function isClose(user: string, expected: string): boolean {
    return normalise(user) === normalise(expected);
}

/** Strip LaTeX commands for pill display — plain text only */
function stripLatex(text: string): string {
    return text
        .replace(/\$\$?/g, '')
        .replace(/\\[a-zA-Z]+/g, '')
        .replace(/[{}]/g, '')
        .trim();
}

function truncate(text: string, max: number): string {
    const clean = stripLatex(text);
    return clean.length > max ? clean.slice(0, max) + '…' : clean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Colour tokens (orange = post-wrong, blue = pre-submission)
// ─────────────────────────────────────────────────────────────────────────────

function useColors(accent: 'orange' | 'blue') {
    const o = accent === 'orange';
    return {
        // CTA mode
        ctaBg: o ? 'bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20'
            : 'bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20',
        ctaText: o ? 'text-orange-700 dark:text-orange-300' : 'text-blue-700 dark:text-blue-300',
        ctaBorder: o ? 'border-orange-200 dark:border-orange-500/30' : 'border-blue-200 dark:border-blue-500/30',

        // Header
        headingText: o ? 'text-orange-800 dark:text-orange-200' : 'text-blue-800 dark:text-blue-200',
        subText: 'text-zinc-400 dark:text-zinc-500',

        // Focused step card
        focusedCard: o
            ? 'border-orange-200 dark:border-orange-500/40 bg-white dark:bg-zinc-900 shadow-md shadow-orange-500/5'
            : 'border-blue-200 dark:border-blue-500/40 bg-white dark:bg-zinc-900 shadow-md shadow-blue-500/5',

        // Input
        inputFocus: o ? 'focus:border-orange-400 dark:focus:border-orange-500'
            : 'focus:border-blue-400 dark:focus:border-blue-500',

        // Hint
        hintBg: 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20',
        hintText: 'text-amber-800 dark:text-amber-200',

        // Solution button
        solutionBtn: o ? 'text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/30 hover:bg-orange-50 dark:hover:bg-orange-500/10'
            : 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30 hover:bg-blue-50 dark:hover:bg-blue-500/10',

        // Progress track
        trackDone: 'bg-emerald-400',
        trackWrong: 'bg-red-400',
        trackActive: o ? 'bg-orange-400' : 'bg-blue-400',
        trackIdle: 'bg-zinc-200 dark:bg-zinc-700',
        trackSkip: 'bg-zinc-300 dark:bg-zinc-600',

        // Completed step pills
        pillCorrect: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/25',
        pillWrong: 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/25',
        pillSkipped: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700',
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// CompletedStepPill – compact pill for finished steps
// ─────────────────────────────────────────────────────────────────────────────

interface CompletedStepPillProps {
    index: number;
    step: StepBreakdown['steps'][number];
    status: StepStatus;
    userAnswer: string;
    colors: ReturnType<typeof useColors>;
    isExpanded: boolean;
    onToggle: () => void;
}

function CompletedStepPill({
    index, step, status, userAnswer, colors, isExpanded, onToggle,
}: CompletedStepPillProps) {
    const pillClass = status === 'correct' ? colors.pillCorrect
        : status === 'wrong' || status === 'advancing' ? colors.pillWrong
            : colors.pillSkipped;

    return (
        <div>
            <motion.button
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                onClick={onToggle}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${pillClass}`}
            >
                {/* Status icon */}
                {status === 'correct'
                    ? <Check className="w-3 h-3" />
                    : <X className="w-3 h-3" />
                }
                <span>Steg {index + 1}</span>
                <span className="opacity-70 font-normal hidden sm:inline">
                    {truncate(step.prompt, 25)}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
            </motion.button>

            {/* Expandable detail */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className={`mt-2 rounded-xl p-3 text-xs ${pillClass}`}>
                            <div className="mb-1.5">
                                <span className="font-bold opacity-60 uppercase tracking-wide text-[10px]">Fråga: </span>
                                <MathRenderer text={step.prompt} />
                            </div>
                            {userAnswer && (
                                <div className="mb-1">
                                    <span className="font-bold opacity-60 uppercase tracking-wide text-[10px]">Ditt svar: </span>
                                    <span className="font-mono">{userAnswer}</span>
                                </div>
                            )}
                            {status !== 'correct' && (
                                <div>
                                    <span className="font-bold opacity-60 uppercase tracking-wide text-[10px]">Rätt svar: </span>
                                    <span className="font-mono font-bold"><MathRenderer text={step.correctAnswer} /></span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// FocusedStep – spacious single-step card for the active step
// ─────────────────────────────────────────────────────────────────────────────

interface FocusedStepProps {
    index: number;
    totalSteps: number;
    step: StepBreakdown['steps'][number];
    status: StepStatus;
    inputValue: string;
    colors: ReturnType<typeof useColors>;
    onInputChange: (val: string) => void;
    onCheck: () => void;
    onSkip: () => void;
}

function FocusedStep({
    index, totalSteps, step, status, inputValue,
    colors, onInputChange, onCheck, onSkip,
}: FocusedStepProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-focus input when step becomes active
    useEffect(() => {
        if (status === 'idle') {
            // Small delay to let the animation start before focusing
            const t = setTimeout(() => inputRef.current?.focus(), 150);
            return () => clearTimeout(t);
        }
    }, [status]);

    // Auto-scroll into view
    useEffect(() => {
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [index]);

    return (
        <motion.div
            ref={containerRef}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`rounded-2xl border-2 overflow-hidden transition-colors duration-200 ${colors.focusedCard}`}
        >
            <div className="p-5 sm:p-6">
                {/* ── Step header ──────────────────────────────────────────── */}
                <div className="flex items-center gap-3 mb-4">
                    {/* Badge */}
                    <span className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-sm font-bold text-orange-600 dark:text-orange-300 flex-shrink-0">
                        {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                            Steg {index + 1} av {totalSteps}
                        </span>
                    </div>
                </div>

                {/* ── Prompt ───────────────────────────────────────────────── */}
                <div className="text-sm sm:text-base leading-relaxed text-zinc-800 dark:text-zinc-100 mb-5">
                    <MathRenderer text={step.prompt} />
                </div>

                {/* ── Input (idle only) ────────────────────────────────────── */}
                {status === 'idle' && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="flex gap-2 mb-3">
                            <input
                                ref={inputRef}
                                value={inputValue}
                                onChange={(e) => onInputChange(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && inputValue.trim() && onCheck()}
                                placeholder="Skriv ditt svar…"
                                className={[
                                    'flex-1 px-4 py-3 text-base font-mono rounded-xl border-2',
                                    'border-zinc-200 dark:border-zinc-700',
                                    'bg-zinc-50 dark:bg-zinc-800/50',
                                    'text-zinc-900 dark:text-white',
                                    'placeholder:text-zinc-400 dark:placeholder:text-zinc-600',
                                    'focus:outline-none transition-colors',
                                    colors.inputFocus,
                                ].join(' ')}
                            />
                            <button
                                onClick={onCheck}
                                disabled={!inputValue.trim()}
                                className="px-5 py-3 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed text-white dark:text-zinc-900 rounded-xl text-sm font-bold transition-colors"
                            >
                                Kolla
                            </button>
                        </div>

                        {/* Forward link — never "skip" */}
                        <button
                            onClick={onSkip}
                            className="w-full py-2 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 flex items-center justify-center gap-1.5 transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                        >
                            <SkipForward className="w-3.5 h-3.5" />
                            Nästa steg
                        </button>
                    </motion.div>
                )}

                {/* ── Correct confirmation ─────────────────────────────────── */}
                {status === 'correct' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 p-4"
                    >
                        <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                Rätt!
                            </span>
                            <span className="text-sm font-mono text-emerald-600 dark:text-emerald-400 ml-auto">
                                {inputValue}
                            </span>
                        </div>
                    </motion.div>
                )}

                {/* ── Wrong / Advancing — show correct answer ──────────────── */}
                <AnimatePresence>
                    {(status === 'wrong' || status === 'advancing') && (
                        <motion.div
                            key="wrong-reveal"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            <div className={`rounded-xl p-4 ${colors.hintBg}`}>
                                {/* What student answered */}
                                <div className="flex items-center gap-2 mb-2">
                                    <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                                        Ditt svar: <span className="font-mono font-medium text-red-600 dark:text-red-400">{inputValue}</span>
                                    </span>
                                </div>

                                {/* Correct answer */}
                                <div className="flex items-start gap-2 mb-2">
                                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <span className="text-zinc-500 dark:text-zinc-400">Rätt svar: </span>
                                        <span className="font-bold text-zinc-800 dark:text-zinc-100">
                                            <MathRenderer text={step.correctAnswer} />
                                        </span>
                                    </div>
                                </div>

                                {/* Step hint if available */}
                                {step.hint && (
                                    <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed mt-2 pl-6">
                                        💡 {step.hint}
                                    </p>
                                )}

                                {status === 'advancing' && (
                                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-amber-200/50 dark:border-amber-500/15">
                                        <span className="text-xs text-zinc-400 animate-pulse flex items-center gap-1.5">
                                            Fortsätter till nästa steg
                                            <ChevronRight className="w-3 h-3" />
                                        </span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// DiagnosisSummary – structured summary after all steps complete
// ─────────────────────────────────────────────────────────────────────────────

interface DiagnosisSummaryProps {
    checkpoints: StepBreakdown['steps'];
    statuses: StepStatus[];
    inputs: string[];
    conclusion: string;
    colors: ReturnType<typeof useColors>;
}

function DiagnosisSummary({ checkpoints, statuses, inputs, conclusion, colors }: DiagnosisSummaryProps) {
    const firstWrong = statuses.findIndex(s => s === 'wrong' || s === 'skipped');
    const errorCount = statuses.filter(s => s === 'wrong' || s === 'skipped').length;
    const allCorrect = errorCount === 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        >
            <div className={`rounded-2xl border-2 overflow-hidden ${allCorrect
                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
                : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'
                }`}
            >
                {/* Header */}
                <div className="px-5 pt-4 pb-3">
                    <h4 className={`text-sm font-bold ${allCorrect
                        ? 'text-emerald-800 dark:text-emerald-200'
                        : 'text-amber-800 dark:text-amber-200'}`}
                    >
                        {allCorrect ? '✓ Bra jobbat med mellanslagen!' : 'Sammanfattning'}
                    </h4>
                    {allCorrect && (
                        <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                            Alla mellansteg ser rätt ut — felet måste ligga i slutsteget. Kolla din aritmetik i sista beräkningen.
                        </p>
                    )}
                </div>

                {/* Timeline */}
                {!allCorrect && (
                    <div className="px-5 pb-4">
                        <div className="space-y-2">
                            {checkpoints.map((step, i) => {
                                const isWrong = statuses[i] === 'wrong' || statuses[i] === 'skipped';
                                const isFirstWrong = i === firstWrong;

                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.08 }}
                                        className={`flex items-start gap-3 rounded-xl p-3 transition-colors ${isFirstWrong
                                            ? 'bg-amber-100/60 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20'
                                            : 'bg-white/40 dark:bg-zinc-900/30'}`}
                                    >
                                        {/* Status icon */}
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${statuses[i] === 'correct'
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-red-400 text-white'}`}
                                        >
                                            {statuses[i] === 'correct'
                                                ? <Check className="w-3.5 h-3.5" />
                                                : <X className="w-3.5 h-3.5" />
                                            }
                                        </span>

                                        {/* Step details */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-semibold ${isWrong
                                                ? 'text-red-700 dark:text-red-300'
                                                : 'text-emerald-700 dark:text-emerald-300'}`}
                                            >
                                                Steg {i + 1}: <MathRenderer text={step.prompt} />
                                            </p>

                                            {/* Show hint for first wrong step */}
                                            {isFirstWrong && step.hint && (
                                                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed mt-1.5">
                                                    💡 {step.hint}
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Conclusion */}
                        {conclusion && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: checkpoints.length * 0.08 + 0.15 }}
                                className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed mt-3 px-1"
                            >
                                {conclusion}
                            </motion.p>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function WorkShowPanel({
    stepBreakdown,
    defaultMode = 'cta',
    accentColor = 'orange',
    onRequestFullSolution,
    maxCheckpoints = 4,
}: WorkShowPanelProps) {
    const colors = useColors(accentColor);
    const [mode, setMode] = useState<WorkShowMode>(defaultMode);

    // Slice to max checkpoints
    const checkpoints = stepBreakdown.steps.slice(0, maxCheckpoints);

    const [inputs, setInputs] = useState<string[]>(checkpoints.map(() => ''));
    const [statuses, setStatuses] = useState<StepStatus[]>(checkpoints.map(() => 'idle'));
    const [activeStep, setActiveStep] = useState(0);
    const [expandedPill, setExpandedPill] = useState<number | null>(null);

    // ── Checkpoint actions ────────────────────────────────────────────────────

    const checkStep = useCallback((idx: number) => {
        const userInput = inputs[idx].trim();
        if (!userInput) return;

        const correct = isClose(userInput, checkpoints[idx].correctAnswer);
        const ns = [...statuses];
        ns[idx] = correct ? 'correct' : 'wrong';
        setStatuses(ns);

        if (correct) {
            // Correct → move to next step after a brief pause for celebration
            setTimeout(() => {
                if (idx < checkpoints.length - 1) setActiveStep(idx + 1);
            }, 600);
        } else {
            // Wrong → show correct answer for 2s, then auto-advance
            setTimeout(() => {
                setStatuses(prev => { const n = [...prev]; n[idx] = 'advancing'; return n; });
                setTimeout(() => {
                    setStatuses(prev => { const n = [...prev]; n[idx] = 'skipped'; return n; });
                    if (idx < checkpoints.length - 1) setActiveStep(idx + 1);
                }, 800);
            }, 2000);
        }
    }, [inputs, statuses, checkpoints]);

    const skipStep = useCallback((idx: number) => {
        const ns = [...statuses]; ns[idx] = 'skipped'; setStatuses(ns);
        if (idx < checkpoints.length - 1) setActiveStep(idx + 1);
    }, [statuses, checkpoints.length]);

    // ── Progress track ────────────────────────────────────────────────────────

    const trackColor = (s: StepStatus, i: number) =>
        s === 'correct' ? colors.trackDone
            : s === 'wrong' || s === 'skipped' ? colors.trackWrong
                : i === activeStep ? colors.trackActive
                    : colors.trackIdle;

    const setInput = (idx: number, val: string) => {
        const ni = [...inputs]; ni[idx] = val; setInputs(ni);
    };

    const allDone = checkpoints.length > 0 && statuses.every(s => s !== 'idle' && s !== 'advancing');

    // ─────────────────────────────────────────────────────────────────────────
    // CTA mode
    // ─────────────────────────────────────────────────────────────────────────

    if (mode === 'cta') {
        return (
            <motion.button
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                onClick={() => setMode('checkpoints')}
                className={[
                    'w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2',
                    'text-sm font-medium border-2 border-dashed transition-colors',
                    colors.ctaBg, colors.ctaText, colors.ctaBorder,
                ].join(' ')}
            >
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                <span>Fastnat? Visa ditt arbete för ledtrådar</span>
                <span className="text-[11px] opacity-60">(tar ~30 sek)</span>
                <ChevronDown className="w-4 h-4 flex-shrink-0 ml-auto" />
            </motion.button>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Checkpoint mode — Focused Step design
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="overflow-hidden"
        >
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="mb-4">
                <h4 className={`text-sm font-bold ${colors.headingText} leading-tight`}>
                    Låt oss hitta var du fastnade
                </h4>
                <p className={`text-xs mt-0.5 ${colors.subText}`}>
                    Ett steg i taget — svara så gott du kan
                </p>
            </div>

            {/* ── Progress track with label ────────────────────────────────── */}
            {checkpoints.length > 1 && (
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            Steg {Math.min(activeStep + 1, checkpoints.length)} av {checkpoints.length}
                        </span>
                        {allDone && (
                            <span className="text-xs font-medium text-zinc-400">Klart</span>
                        )}
                    </div>
                    <div className="flex gap-1">
                        {checkpoints.map((_, i) => (
                            <motion.div
                                key={i}
                                className={`h-2 flex-1 rounded-full transition-colors duration-300 ${trackColor(statuses[i], i)}`}
                                animate={i === activeStep && !allDone ? { opacity: [1, 0.6, 1] } : { opacity: 1 }}
                                transition={i === activeStep && !allDone ? { duration: 1.5, repeat: Infinity } : {}}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ── Intro text ───────────────────────────────────────────────── */}
            {stepBreakdown.intro && (
                <p className={`text-xs leading-relaxed mb-4 ${colors.subText}`}>
                    {stepBreakdown.intro}
                </p>
            )}

            {/* ── Completed step pills ─────────────────────────────────────── */}
            {activeStep > 0 && !allDone && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {checkpoints.slice(0, activeStep).map((step, i) => (
                        <CompletedStepPill
                            key={i}
                            index={i}
                            step={step}
                            status={statuses[i]}
                            userAnswer={inputs[i]}
                            colors={colors}
                            isExpanded={expandedPill === i}
                            onToggle={() => setExpandedPill(expandedPill === i ? null : i)}
                        />
                    ))}
                </div>
            )}

            {/* ── Active focused step (only one at a time) ─────────────────── */}
            <AnimatePresence mode="wait">
                {!allDone && (
                    <FocusedStep
                        key={activeStep}
                        index={activeStep}
                        totalSteps={checkpoints.length}
                        step={checkpoints[activeStep]}
                        status={statuses[activeStep]}
                        inputValue={inputs[activeStep]}
                        colors={colors}
                        onInputChange={(val) => setInput(activeStep, val)}
                        onCheck={() => checkStep(activeStep)}
                        onSkip={() => skipStep(activeStep)}
                    />
                )}
            </AnimatePresence>

            {/* ── Diagnosis summary (after all steps done) ──────────────────── */}
            <AnimatePresence>
                {allDone && (
                    <DiagnosisSummary
                        checkpoints={checkpoints}
                        statuses={statuses}
                        inputs={inputs}
                        conclusion={stepBreakdown.conclusion}
                        colors={colors}
                    />
                )}
            </AnimatePresence>

            {/* ── Footer: full solution escape ─────────────────────────────── */}
            {onRequestFullSolution && (
                <button
                    onClick={onRequestFullSolution}
                    className={[
                        'mt-4 w-full py-2.5 text-sm font-medium rounded-xl border-2 border-dashed',
                        'flex items-center justify-center gap-2 transition-colors',
                        colors.solutionBtn,
                    ].join(' ')}
                >
                    <BookOpen className="w-4 h-4" />
                    Visa fullständig lösning istället
                </button>
            )}
        </motion.div>
    );
}
