'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { validateStudentAnswer } from '@/lib/study/answer-validation';
import { checkMathEquivalence } from '@/lib/utils/mathEquivalence';
import { MathRenderer } from './MathRenderer';
import type {
    SolutionStepRule,
    SolutionStepsAnswerConfig,
    SolutionStepsAnswerPayload,
    SolutionStepsGradingConfig,
} from '@/types/study';

interface SolutionStepsQuestionLike {
    id: string;
    type: 'solution_steps';
    topicId: string;
    difficulty: number;
    correctAnswer?: unknown;
    answerConfig?: SolutionStepsAnswerConfig | null;
    gradingConfig?: SolutionStepsGradingConfig | null;
}

interface SolutionStepsInputProps {
    question: SolutionStepsQuestionLike;
    onAnswer: (answer: SolutionStepsAnswerPayload, isCorrect: boolean) => void;
}

function buildLines(count: number) {
    return Array.from({ length: count }, (_, index) => ({
        id: `line-${index + 1}`,
        value: '',
    }));
}

function validateStep(step: SolutionStepRule | undefined, value: string): boolean | null {
    if (!step || !value.trim()) return null;
    return [step.expectedAnswer, ...(step.alternativeForms ?? [])]
        .some((candidate) => candidate && checkMathEquivalence(value, candidate));
}

export function SolutionStepsInput({ question, onAnswer }: SolutionStepsInputProps) {
    const answerConfig = question.answerConfig ?? {};
    const gradingConfig = question.gradingConfig ?? { steps: [] };
    const expectedSteps = gradingConfig.steps ?? [];
    const initialLineCount = answerConfig.initialLineCount ?? Math.max(expectedSteps.length, 2);
    const maxLines = answerConfig.maxLines ?? Math.max(expectedSteps.length + 2, 6);
    const allowAddLine = answerConfig.allowAddLine ?? true;
    const allowRemoveLine = answerConfig.allowRemoveLine ?? true;
    const immediateValidation = answerConfig.immediateValidation ?? true;
    const placeholder = answerConfig.placeholder ?? 'Skriv nästa steg';

    const [lines, setLines] = useState(() => buildLines(initialLineCount));
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [showHints, setShowHints] = useState<Record<string, boolean>>({});

    useEffect(() => {
        setLines(buildLines(initialLineCount));
        setIsSubmitted(false);
        setShowHints({});
    }, [question.id, initialLineCount]);

    const payload: SolutionStepsAnswerPayload = useMemo(() => ({
        mode: 'solution_steps',
        lines,
        finalAnswer: lines.map((line) => line.value.trim()).filter(Boolean).at(-1),
    }), [lines]);

    const updateLine = (id: string, value: string) => {
        setLines((current) => current.map((line) => (line.id === id ? { ...line, value } : line)));
    };

    const addLine = () => {
        if (lines.length >= maxLines) return;
        setLines((current) => [...current, { id: `line-${current.length + 1}`, value: '' }]);
    };

    const removeLine = (id: string) => {
        if (lines.length <= 1) return;
        setLines((current) => current.filter((line) => line.id !== id));
    };

    const handleSubmit = () => {
        const isCorrect = validateStudentAnswer(question, payload, question.correctAnswer);
        setIsSubmitted(true);
        onAnswer(payload, isCorrect);
    };

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 px-4 py-3">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Lös steg för steg</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Lägg in varje mellanled på en egen rad. Systemet kan kontrollera raderna direkt när de matchar de förväntade stegen.
                </p>
            </div>

            <div className="space-y-3">
                {lines.map((line, index) => {
                    const step = expectedSteps[index];
                    const stepState = (isSubmitted || immediateValidation) ? validateStep(step, line.value) : null;
                    const showHint = showHints[line.id] && step?.hint;

                    return (
                        <div key={line.id} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
                            <div className="mb-3 flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-100 px-2 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                                            {index + 1}
                                        </span>
                                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                            {step?.prompt || `Steg ${index + 1}`}
                                        </span>
                                    </div>
                                    {stepState !== null && line.value.trim() && (
                                        <p className={`mt-2 text-xs font-medium ${stepState ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                            {stepState ? 'Det här steget matchar den förväntade lösningen.' : 'Det här steget avviker från den förväntade lösningen.'}
                                        </p>
                                    )}
                                </div>

                                {allowRemoveLine && !isSubmitted && lines.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeLine(line.id)}
                                        className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-red-500 dark:hover:bg-zinc-900"
                                        aria-label={`Ta bort steg ${index + 1}`}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <textarea
                                value={line.value}
                                disabled={isSubmitted}
                                onChange={(event) => updateLine(line.id, event.target.value)}
                                rows={2}
                                placeholder={placeholder}
                                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-4 py-3 font-mono text-base text-zinc-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:text-zinc-100 placeholder:text-zinc-400"
                            />

                            {step?.hint && (
                                <div className="mt-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowHints((current) => ({ ...current, [line.id]: !current[line.id] }))}
                                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400"
                                    >
                                        {showHint ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                        {showHint ? 'Dölj ledtråd' : 'Visa ledtråd'}
                                    </button>
                                    {showHint && (
                                        <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-900 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
                                            <MathRenderer text={step.hint} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {allowAddLine && !isSubmitted && lines.length < maxLines && (
                <button
                    type="button"
                    onClick={addLine}
                    className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:border-blue-400 hover:text-blue-600 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-blue-500 dark:hover:text-blue-400"
                >
                    <Plus className="w-4 h-4" />
                    Lägg till rad
                </button>
            )}

            <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitted}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-semibold transition-colors ${
                    isSubmitted
                        ? 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
            >
                <CheckCircle2 className="w-4 h-4" />
                Skicka lösningssteg
            </motion.button>
        </div>
    );
}

export default SolutionStepsInput;
