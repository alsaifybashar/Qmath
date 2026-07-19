'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle, Lock, ChevronRight, Loader2 } from 'lucide-react';
import type { RevealedStep } from '@/lib/math/fade-logic';
import { motionDuration, motionEase } from '@/lib/motion';

interface StepRendererProps {
    steps: Array<RevealedStep & { hintNudge?: string | null }>;
    onStepSubmit: (stepId: string, input: string) => Promise<{ isCorrect: boolean; feedback?: string }>;
    disabled?: boolean;
}

interface StepState {
    done: boolean;
    input: string;
    feedback: string | undefined;
    submitting: boolean;
    error: boolean;
    animateError: boolean;
}

// Lazy-load KaTeX to avoid SSR issues
interface KatexLike {
    render(tex: string, element: HTMLElement, options?: { throwOnError?: boolean; displayMode?: boolean; output?: string }): void;
}
let katex: KatexLike | null = null;
if (typeof window !== 'undefined') {
    import('katex').then((m) => { katex = (m.default ?? m) as unknown as KatexLike; });
}

function StepLatex({ latex }: { latex: string }) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!ref.current) return;
        const render = () => {
            if (!ref.current) return;
            if (katex) {
                try {
                    katex.render(latex, ref.current, { throwOnError: false, displayMode: true, output: 'html' });
                } catch {
                    if (ref.current) ref.current.textContent = latex;
                }
            } else {
                // KaTeX not loaded yet — retry shortly
                setTimeout(render, 100);
            }
        };
        render();
    }, [latex]);
    return <div ref={ref} className="my-2 overflow-x-auto text-center" />;
}

export function StepRenderer({ steps, onStepSubmit, disabled }: StepRendererProps) {
    const [activeStep, setActiveStep] = useState(0);
    const [allDone, setAllDone] = useState(false);
    const [stepStates, setStepStates] = useState<StepState[]>(() =>
        steps.map(() => ({ done: false, input: '', feedback: undefined, submitting: false, error: false, animateError: false }))
    );
    const reduceMotion = useReducedMotion();

    // Reset when steps array changes (e.g. after mastery update)
    useEffect(() => {
        setStepStates(steps.map(() => ({ done: false, input: '', feedback: undefined, submitting: false, error: false, animateError: false })));
        setActiveStep(0);
        setAllDone(false);
    }, [steps.length]);

    const revealedSteps = steps.filter((s) => s.revealed);
    const hiddenSteps = steps.filter((s) => !s.revealed);

    const handleSubmit = async (stepIndex: number, pointerInitiated: boolean) => {
        const step = revealedSteps[stepIndex];
        const input = stepStates[stepIndex]?.input.trim();
        if (!input || stepStates[stepIndex]?.submitting || stepStates[stepIndex]?.done) return;

        setStepStates((prev) =>
            prev.map((s, i) => i === stepIndex ? { ...s, submitting: true, feedback: undefined, error: false, animateError: false } : s)
        );

        try {
            const result = await onStepSubmit(step.id, input);
            if (result.isCorrect) {
                setStepStates((prev) =>
                    prev.map((s, i) => i === stepIndex ? { ...s, submitting: false, done: true, error: false } : s)
                );
                // Move to next step
                const nextIndex = stepIndex + 1;
                if (nextIndex < revealedSteps.length) {
                    setActiveStep(nextIndex);
                } else {
                    setAllDone(true);
                }
            } else {
                setStepStates((prev) =>
                    prev.map((s, i) =>
                        i === stepIndex
                            ? {
                                ...s,
                                submitting: false,
                                feedback: result.feedback ?? 'Inte riktigt — titta på steget igen.',
                                error: true,
                                animateError: pointerInitiated && !reduceMotion,
                            }
                            : s
                    )
                );
            }
        } catch {
            setStepStates((prev) =>
                prev.map((s, i) =>
                    i === stepIndex
                        ? { ...s, submitting: false, feedback: 'Något gick fel — ladda om sidan.', error: true, animateError: false }
                        : s
                )
            );
        }
    };

    if (allDone) {
        return (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 p-6 text-center">
                <CheckCircle className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
                <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                    Alla steg klara!
                </p>
                <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">
                    Bra jobbat — du har löst alla lösningssteg.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Revealed steps */}
            {revealedSteps.map((step, index) => {
                const state = stepStates[index] ?? { done: false, input: '', feedback: undefined, submitting: false, error: false, animateError: false };
                const isActive = index === activeStep && !state.done;
                const isPast = state.done;
                const isFuture = index > activeStep && !state.done;

                return (
                    <motion.div
                        key={step.id}
                        animate={state.animateError ? { x: [-4, 4, -3, 3, 0] } : { x: 0 }}
                        transition={{ duration: motionDuration.wrong, ease: motionEase.out }}
                        className={`rounded-2xl border p-4 transition-[opacity,box-shadow] duration-200 ${
                            isPast
                                ? 'border-[var(--border-light)] bg-[var(--background-alt)] opacity-70'
                                : isActive
                                ? 'border-[var(--accent-border)] bg-[var(--surface)] shadow-[var(--shadow-lg)]'
                                : 'border-[var(--border-light)] bg-[var(--background-alt)] opacity-50'
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${
                                isPast
                                    ? 'bg-[var(--success-500)] text-white'
                                    : isActive
                                    ? 'bg-[var(--accent-500)] text-white'
                                    : 'bg-[var(--neutral-300)] text-[var(--foreground-muted)]'
                            }`}>
                                {isPast ? (
                                    <motion.span
                                        initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: reduceMotion ? 0 : motionDuration.correct, ease: motionEase.out }}
                                        className="inline-flex"
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                    </motion.span>
                                ) : step.stepNumber}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium [text-wrap:pretty] ${
                                    isPast ? 'text-[var(--foreground-subtle)]' : 'text-[var(--foreground)]'
                                }`}>
                                    {step.instruction}
                                </p>

                                {step.displayLatex && (
                                    <StepLatex latex={step.displayLatex} />
                                )}

                                {isActive && (
                                    <div className="mt-3 space-y-2">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={state.input}
                                                onChange={(e) =>
                                                    setStepStates((prev) =>
                                                        prev.map((s, i) => i === index ? { ...s, input: e.target.value, error: false, animateError: false } : s)
                                                    )
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSubmit(index, false);
                                                }}
                                                disabled={disabled || state.submitting || state.done}
                                                placeholder="Skriv ditt svar…"
                                                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-mono transition-[border-color,box-shadow] duration-150 focus:outline-none focus:ring-2 ${
                                                    state.error
                                                        ? 'border-[var(--warning-400)] bg-[var(--surface)] focus:ring-[var(--warning-400)]'
                                                        : 'border-[var(--border-medium)] bg-[var(--surface)] text-[var(--foreground)] focus:ring-[var(--border-focus)] placeholder:text-[var(--foreground-subtle)]'
                                                }`}
                                            />
                                            <button
                                                onClick={(event) => handleSubmit(index, event.detail > 0)}
                                                disabled={!state.input.trim() || disabled || state.submitting || state.done}
                                                className="flex items-center gap-1 rounded-xl bg-[var(--primary-700)] px-4 py-2 text-sm font-semibold text-[var(--surface)] transition-colors duration-150 hover:bg-[var(--primary-600)] disabled:cursor-not-allowed disabled:bg-[var(--neutral-200)] disabled:text-[var(--foreground-subtle)] shadow-[var(--shadow-sm)]"
                                            >
                                                {state.submitting ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                )}
                                                Svara
                                            </button>
                                        </div>

                                        {state.feedback && (
                                            <p className="rounded-xl border border-[var(--warning-400)]/40 bg-[var(--warning-400)]/10 px-3 py-2 text-sm text-[var(--foreground)] [text-wrap:pretty]">
                                                {state.feedback}
                                            </p>
                                        )}

                                        {(step.hintNudge || step.hint) && (
                                            <p className="text-xs italic text-[var(--foreground-subtle)]">
                                                Tips: {step.hintNudge ?? step.hint}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                );
            })}

            {/* Hidden (faded) steps */}
            {hiddenSteps.map((step) => (
                <div
                    key={step.id}
                    className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-4 opacity-40"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-300 dark:bg-zinc-600">
                            <Lock className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                        </div>
                        <p className="text-sm text-zinc-400 dark:text-zinc-500">
                            Steg {step.stepNumber} — lås upp med ökad kunskapsnivå
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
