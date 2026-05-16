'use client';

import { useState, useRef, useEffect } from 'react';
import { CheckCircle, Lock, ChevronRight, Loader2 } from 'lucide-react';
import type { RevealedStep } from '@/lib/math/fade-logic';

interface StepRendererProps {
    steps: RevealedStep[];
    onStepSubmit: (stepId: string, input: string) => Promise<{ isCorrect: boolean; feedback?: string }>;
    disabled?: boolean;
}

interface StepState {
    done: boolean;
    input: string;
    feedback: string | undefined;
    submitting: boolean;
    error: boolean;
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
        steps.map(() => ({ done: false, input: '', feedback: undefined, submitting: false, error: false }))
    );

    // Reset when steps array changes (e.g. after mastery update)
    useEffect(() => {
        setStepStates(steps.map(() => ({ done: false, input: '', feedback: undefined, submitting: false, error: false })));
        setActiveStep(0);
        setAllDone(false);
    }, [steps.length]);

    const revealedSteps = steps.filter((s) => s.revealed);
    const hiddenSteps = steps.filter((s) => !s.revealed);

    const handleSubmit = async (stepIndex: number) => {
        const step = revealedSteps[stepIndex];
        const input = stepStates[stepIndex]?.input.trim();
        if (!input || stepStates[stepIndex]?.submitting || stepStates[stepIndex]?.done) return;

        setStepStates((prev) =>
            prev.map((s, i) => i === stepIndex ? { ...s, submitting: true, feedback: undefined, error: false } : s)
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
                            ? { ...s, submitting: false, feedback: result.feedback ?? 'Inte riktigt — titta på steget igen.', error: true }
                            : s
                    )
                );
            }
        } catch {
            setStepStates((prev) =>
                prev.map((s, i) =>
                    i === stepIndex
                        ? { ...s, submitting: false, feedback: 'Något gick fel — ladda om sidan.', error: true }
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
                const state = stepStates[index] ?? { done: false, input: '', feedback: undefined, submitting: false, error: false };
                const isActive = index === activeStep && !state.done;
                const isPast = state.done;
                const isFuture = index > activeStep && !state.done;

                return (
                    <div
                        key={step.id}
                        className={`rounded-xl border p-4 transition-all ${
                            isPast
                                ? 'border-emerald-200 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-500/5 opacity-70'
                                : isActive
                                ? 'border-blue-300 dark:border-blue-600 bg-white dark:bg-zinc-900 shadow-sm'
                                : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 opacity-50'
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                isPast
                                    ? 'bg-emerald-500 text-white'
                                    : isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-zinc-300 dark:bg-zinc-600 text-zinc-600 dark:text-zinc-300'
                            }`}>
                                {isPast ? <CheckCircle className="h-4 w-4" /> : step.stepNumber}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${
                                    isPast ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-900 dark:text-zinc-100'
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
                                                        prev.map((s, i) => i === index ? { ...s, input: e.target.value, error: false } : s)
                                                    )
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSubmit(index);
                                                }}
                                                disabled={disabled || state.submitting || state.done}
                                                placeholder="Skriv ditt svar…"
                                                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-mono transition-colors focus:outline-none focus:ring-2 ${
                                                    state.error
                                                        ? 'border-orange-400 bg-orange-50 dark:bg-orange-500/10 focus:ring-orange-300'
                                                        : 'border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-blue-400 dark:focus:ring-blue-500 placeholder:text-zinc-400 dark:placeholder:text-zinc-500'
                                                }`}
                                            />
                                            <button
                                                onClick={() => handleSubmit(index)}
                                                disabled={!state.input.trim() || disabled || state.submitting || state.done}
                                                className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:bg-zinc-200 dark:disabled:bg-zinc-700 disabled:text-zinc-400 shadow-sm"
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
                                            <p className="rounded-lg bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-700 px-3 py-2 text-sm text-orange-700 dark:text-orange-300">
                                                {state.feedback}
                                            </p>
                                        )}

                                        {step.hint && (
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                                                Tips: {step.hint}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
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
