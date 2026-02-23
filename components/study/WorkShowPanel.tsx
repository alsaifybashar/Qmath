'use client';

/**
 * WorkShowPanel
 * ─────────────────────────────────────────────────────────────────────────────
 * Implements the three-scenario "show-your-work" flow from the spec:
 *
 *  CTA mode      – single ghost button "✨ Stuck? Show work for hints"
 *  Checkpoint mode – 2–4 interactive intermediate-step inputs validated
 *                   individually, with targeted hint per wrong step
 *  (Full solution) – delegated to caller via onRequestFullSolution()
 *
 * Validation strategy:
 *   1. Normalise both strings (strip whitespace, LaTeX commands, lowercase)
 *   2. If they match → ✓
 *   3. If not → show the step hint + expected answer + "Mine matches" escape
 *      hatch for complex LaTeX expressions where string matching fails
 *
 * Usage:
 *   <WorkShowPanel
 *     stepBreakdown={question.helps.stepBreakdown}
 *     defaultMode="cta"              // or "checkpoints" after a wrong answer
 *     accentColor="orange"           // "blue" for pre-submission
 *     onRequestFullSolution={...}    // show the passive solution panel
 *   />
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, ChevronDown, Check, X, SkipForward, BookOpen,
} from 'lucide-react';

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

/**
 * Normalise a math expression to a comparable canonical string:
 *   - lowercase, no whitespace
 *   - strip $$ delimiters, common LaTeX commands and braces
 *   - strip trailing zeros after decimal  (e.g. "3.00" → "3")
 */
function normalise(raw: string): string {
    return raw
        .toLowerCase()
        .replace(/\$\$/g, '')
        .replace(/\\\w+/g, '')      // \frac, \cdot, etc.
        .replace(/[{}\s]/g, '')
        .replace(/\.?0+$/, '');     // trailing zeros
}

function isClose(user: string, expected: string): boolean {
    return normalise(user) === normalise(expected);
}

// ─────────────────────────────────────────────────────────────────────────────
// Colour tokens (orange = post-wrong, blue = pre-submission)
// ─────────────────────────────────────────────────────────────────────────────

function useColors(accent: 'orange' | 'blue') {
    const o = accent === 'orange';
    return {
        ctaBg: o ? 'bg-orange-50  dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20'
            : 'bg-blue-50   dark:bg-blue-500/10   hover:bg-blue-100   dark:hover:bg-blue-500/20',
        ctaText: o ? 'text-orange-700 dark:text-orange-300' : 'text-blue-700 dark:text-blue-300',
        ctaBorder: o ? 'border-orange-200 dark:border-orange-500/30' : 'border-blue-200 dark:border-blue-500/30',
        headingText: o ? 'text-orange-800 dark:text-orange-200' : 'text-blue-800 dark:text-blue-200',
        subText: 'text-zinc-400 dark:text-zinc-500',
        activeCard: o ? 'border-orange-300 dark:border-orange-500/50 bg-white dark:bg-zinc-900'
            : 'border-blue-300   dark:border-blue-500/50   bg-white dark:bg-zinc-900',
        idleCard: 'border-zinc-200 dark:border-zinc-700/50 bg-zinc-50/80 dark:bg-zinc-800/40',
        correctCard: 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10',
        wrongCard: 'border-red-200 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/5',
        skippedCard: 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30 opacity-60',
        inputFocus: o ? 'focus:border-orange-400 dark:focus:border-orange-500'
            : 'focus:border-blue-400   dark:focus:border-blue-500',
        hintBg: 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20',
        hintText: 'text-amber-800 dark:text-amber-200',
        solutionBtn: o ? 'text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/30 hover:bg-orange-50 dark:hover:bg-orange-500/10'
            : 'text-blue-600   dark:text-blue-400   border-blue-200   dark:border-blue-500/30   hover:bg-blue-50   dark:hover:bg-blue-500/10',
        trackDone: 'bg-emerald-400',
        trackWrong: 'bg-red-400',
        trackActive: o ? 'bg-orange-400' : 'bg-blue-400',
        trackIdle: 'bg-zinc-200 dark:bg-zinc-700',
        trackSkip: 'bg-zinc-300 dark:bg-zinc-600',
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Step row sub-component
// ─────────────────────────────────────────────────────────────────────────────

interface StepRowProps {
    index: number;
    step: StepBreakdown['steps'][number];
    status: StepStatus;
    isActive: boolean;
    isLocked: boolean;
    inputValue: string;
    colors: ReturnType<typeof useColors>;
    onInputChange: (val: string) => void;
    onCheck: () => void;
    onSkip: () => void;
}

function StepRow({
    index, step, status, isActive, isLocked, inputValue,
    colors, onInputChange, onCheck, onSkip,
}: StepRowProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isActive && status === 'idle') inputRef.current?.focus();
    }, [isActive, status]);

    const cardClass = [
        'rounded-xl border-2 overflow-hidden transition-all duration-200',
        status === 'correct' ? colors.correctCard
            : status === 'wrong' || status === 'advancing' ? colors.wrongCard
                : status === 'skipped' ? colors.skippedCard
                    : isLocked ? colors.idleCard
                        : isActive ? colors.activeCard
                            : colors.idleCard,
    ].join(' ');

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.25 }}
            className={cardClass}
        >
            <div className="p-3">
                {/* ── Label row ─────────────────────────────────────────── */}
                <div className="flex items-center justify-between mb-2 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        {/* Step badge */}
                        <span className={[
                            'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0',
                            status === 'correct' ? 'bg-emerald-500 text-white'
                                : status === 'wrong' || status === 'advancing' ? 'bg-red-400 text-white'
                                    : status === 'skipped' ? 'bg-zinc-400 text-white'
                                        : isActive ? 'bg-blue-500 text-white'
                                            : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500',
                        ].join(' ')}>
                            {status === 'correct' ? <Check className="w-3 h-3" />
                                : status === 'wrong' || status === 'advancing' ? <X className="w-3 h-3" />
                                    : status === 'skipped' ? '↷'
                                        : index + 1}
                        </span>

                        {/* Prompt */}
                        <span className={[
                            'text-xs font-semibold truncate',
                            status === 'correct' ? 'text-emerald-700 dark:text-emerald-300'
                                : status === 'wrong' || status === 'advancing' ? 'text-red-700 dark:text-red-300'
                                    : 'text-zinc-600 dark:text-zinc-400',
                        ].join(' ')}>
                            Steg {index + 1}: {step.prompt}
                        </span>
                    </div>

                    {/* Skip — only for idle, non-locked steps */}
                    {status === 'idle' && !isLocked && (
                        <button
                            onClick={onSkip}
                            className="text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 flex items-center gap-0.5 transition-colors flex-shrink-0"
                        >
                            <SkipForward className="w-2.5 h-2.5" />
                            Hoppa
                        </button>
                    )}
                </div>

                {/* ── Input (idle + active only) ────────────────────────── */}
                {status === 'idle' && !isLocked && (
                    <div className="flex gap-2">
                        <input
                            ref={inputRef}
                            value={inputValue}
                            onChange={(e) => onInputChange(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && inputValue.trim() && onCheck()}
                            placeholder="Ditt svar för detta steg…"
                            className={[
                                'flex-1 px-3 py-2 text-sm font-mono rounded-lg border-2',
                                'border-zinc-200 dark:border-zinc-700',
                                'bg-white dark:bg-zinc-900',
                                'text-zinc-900 dark:text-white',
                                'placeholder:text-zinc-400 dark:placeholder:text-zinc-600',
                                'focus:outline-none transition-colors',
                                colors.inputFocus,
                            ].join(' ')}
                        />
                        <button
                            onClick={onCheck}
                            disabled={!inputValue.trim()}
                            className="px-3 py-2 bg-zinc-900 dark:bg-zinc-700 hover:bg-zinc-800 dark:hover:bg-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-colors"
                        >
                            Kolla
                        </button>
                    </div>
                )}

                {/* ── Correct — echo their answer ───────────────────────── */}
                {status === 'correct' && (
                    <p className="text-xs font-mono text-emerald-700 dark:text-emerald-300 mt-1 truncate">
                        ✓ {inputValue}
                    </p>
                )}

                {/* ── Wrong / Advancing — show correct answer, auto-advances ── */}
                <AnimatePresence>
                    {(status === 'wrong' || status === 'advancing') && (
                        <motion.div
                            key="wrong-reveal"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className={`mt-2 rounded-lg p-2.5 ${colors.hintBg}`}>
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">
                                        Rätt svar:
                                    </span>
                                    <code className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-100 bg-white/90 dark:bg-zinc-900/90 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                                        {step.correctAnswer}
                                    </code>
                                    {status === 'advancing' && (
                                        <span className="text-[10px] text-zinc-400 ml-auto animate-pulse">Fortsätter…</span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Locked — greyed placeholder ───────────────────────── */}
                {isLocked && (
                    <p className="text-[10px] text-zinc-400 mt-1 italic">Lås upp föregående steg först</p>
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

    // Slice to max checkpoints per spec ("Chunking: max 1–2 critical todos")
    const checkpoints = stepBreakdown.steps.slice(0, maxCheckpoints);

    const [inputs, setInputs] = useState<string[]>(checkpoints.map(() => ''));
    const [statuses, setStatuses] = useState<StepStatus[]>(checkpoints.map(() => 'idle'));
    const [activeStep, setActiveStep] = useState(0);

    // ── Checkpoint actions ────────────────────────────────────────────────────

    const checkStep = useCallback((idx: number) => {
        const userInput = inputs[idx].trim();
        if (!userInput) return;

        const correct = isClose(userInput, checkpoints[idx].correctAnswer);
        const ns = [...statuses];
        ns[idx] = correct ? 'correct' : 'wrong';
        setStatuses(ns);

        if (correct) {
            // Correct → move to next step immediately
            if (idx < checkpoints.length - 1) setActiveStep(idx + 1);
        } else {
            // Wrong → show correct answer for 1.5s, then auto-advance
            setTimeout(() => {
                setStatuses(prev => { const n = [...prev]; n[idx] = 'advancing'; return n; });
                setTimeout(() => {
                    setStatuses(prev => { const n = [...prev]; n[idx] = 'skipped'; return n; });
                    if (idx < checkpoints.length - 1) setActiveStep(idx + 1);
                }, 600);
            }, 1500);
        }
    }, [inputs, statuses, checkpoints]);

    const skipStep = useCallback((idx: number) => {
        const ns = [...statuses]; ns[idx] = 'skipped'; setStatuses(ns);
        if (idx < checkpoints.length - 1) setActiveStep(idx + 1);
    }, [statuses, checkpoints.length]);

    // ── Progress track ────────────────────────────────────────────────────────

    const trackColor = (s: StepStatus, i: number) =>
        s === 'correct' ? colors.trackDone
            : s === 'wrong' ? colors.trackWrong
                : s === 'skipped' ? colors.trackSkip
                    : i === activeStep ? colors.trackActive
                        : colors.trackIdle;

    const setInput = (idx: number, val: string) => {
        const ni = [...inputs]; ni[idx] = val; setInputs(ni);
    };

    // ── Error summary (for targeted diagnosis) ──────────────────────────────────────

    const firstWrong = statuses.findIndex(s => s === 'wrong' || s === 'skipped');
    const errorCount = statuses.filter(s => s === 'wrong' || s === 'skipped').length;


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
    // Checkpoint mode
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="overflow-hidden"
        >
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="mb-3">
                <h4 className={`text-sm font-bold ${colors.headingText} leading-tight`}>
                    Låt oss hitta var du fastnade
                </h4>
                <p className={`text-xs mt-0.5 ${colors.subText}`}>
                    Fyll i dina mellansteg — du kan hoppa över steg du är säker på
                </p>
            </div>

            {/* ── Progress track ───────────────────────────────────────────── */}
            {checkpoints.length > 1 && (
                <div className="flex gap-1 mb-3">
                    {checkpoints.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${trackColor(statuses[i], i)}`}
                        />
                    ))}
                </div>
            )}

            {/* ── Intro text ───────────────────────────────────────────────── */}
            {stepBreakdown.intro && (
                <p className={`text-xs leading-relaxed mb-3 ${colors.subText}`}>
                    {stepBreakdown.intro}
                </p>
            )}

            {/* ── Steps ────────────────────────────────────────────────────── */}
            <div className="space-y-2">
                {checkpoints.map((step, i) => (
                    <StepRow
                        key={i}
                        index={i}
                        step={step}
                        status={statuses[i]}
                        isActive={i === activeStep}
                        isLocked={i > activeStep && statuses[i] === 'idle'}
                        inputValue={inputs[i]}
                        colors={colors}
                        onInputChange={(val) => setInput(i, val)}
                        onCheck={() => checkStep(i)}
                        onSkip={() => skipStep(i)}
                    />
                ))}
            </div>

            {/* ── Diagnosis banner (after all steps done) ──────────────────── */}
            <AnimatePresence>
                {allDone && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mt-3 rounded-xl p-3 border-2 ${errorCount === 0
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
                            : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'
                            }`}
                    >
                        {errorCount === 0 ? (
                            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                ✓ Alla mellansteg ser rätt ut — felet måste ligga i slutsteget. Kolla din aritmetik i sista beräkningen.
                            </p>
                        ) : firstWrong >= 0 ? (
                            <div>
                                <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 mb-1">
                                    Felet uppstod i steg {firstWrong + 1}: "{checkpoints[firstWrong].prompt}"
                                </p>
                                {checkpoints[firstWrong].hint && (
                                    <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                                        {checkpoints[firstWrong].hint}
                                    </p>
                                )}
                            </div>
                        ) : null}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Footer: full solution escape ─────────────────────────────── */}
            {onRequestFullSolution && (
                <button
                    onClick={onRequestFullSolution}
                    className={[
                        'mt-3 w-full py-2.5 text-sm font-medium rounded-xl border-2 border-dashed',
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
