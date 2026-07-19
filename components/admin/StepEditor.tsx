'use client';

import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, Plus, Sparkles, Trash2 } from 'lucide-react';
import {
    getQuestionSteps,
    saveQuestionSteps,
    getMisconceptionOptions,
} from '@/app/actions/admin-questions';
import { suggestSolutionSteps } from '@/app/actions/ai-question-analysis';
import type { StepInput } from '@/lib/validation/question-steps';

interface EditableStep extends Omit<StepInput, 'stepNumber'> {
    /** Local key — becomes a fresh DB id on save (replace-all semantics) */
    key: string;
}

interface MisconceptionOption {
    id: string;
    code: string;
    description: string;
}

export interface StepEditorProps {
    questionId: string;
    questionContent: string;
    correctAnswer: string;
    questionType: string;
    /** Steps changed — lets the parent refresh its preview */
    onStepsChanged?: (steps: Array<StepInput & { id: string }>) => void;
}

let keyCounter = 0;
const nextKey = () => `step-${Date.now()}-${keyCounter++}`;

const emptyStep = (): EditableStep => ({
    key: nextKey(),
    instruction: '',
    correctAnswer: '',
    displayLatex: '',
    explanation: '',
    hintNudge: '',
    hintGuided: '',
    misconceptionId: null,
    questionType: 'algebra',
});

/**
 * Authoring panel for tonande lösningssteg — writes the normalized
 * question_steps table (not the legacy explanationMarkdown serialization).
 */
export function StepEditor({ questionId, questionContent, correctAnswer, questionType, onStepsChanged }: StepEditorProps) {
    const [steps, setSteps] = useState<EditableStep[]>([]);
    const [misconceptionOptions, setMisconceptionOptions] = useState<MisconceptionOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

    useEffect(() => {
        let cancelled = false;
        Promise.all([getQuestionSteps(questionId), getMisconceptionOptions()]).then(([stepsRes, miscRes]) => {
            if (cancelled) return;
            if (stepsRes.data) {
                setSteps(stepsRes.data.map((s) => ({
                    key: s.id,
                    instruction: s.instruction,
                    correctAnswer: s.correctAnswer,
                    displayLatex: s.displayLatex ?? '',
                    explanation: s.explanation ?? '',
                    hintNudge: s.hintNudge ?? '',
                    hintGuided: s.hintGuided ?? '',
                    misconceptionId: s.misconceptionId,
                    questionType: s.questionType ?? 'algebra',
                })));
            }
            if (miscRes.data) setMisconceptionOptions(miscRes.data);
            setIsLoading(false);
        });
        return () => { cancelled = true; };
    }, [questionId]);

    const update = (key: string, field: keyof EditableStep, value: string | null) => {
        setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, [field]: value } : s)));
    };

    const move = (index: number, dir: -1 | 1) => {
        setSteps((prev) => {
            const next = [...prev];
            const j = index + dir;
            if (j < 0 || j >= next.length) return prev;
            [next[index], next[j]] = [next[j], next[index]];
            return next;
        });
    };

    const toInputs = (list: EditableStep[]): StepInput[] =>
        list.map((s, i) => ({
            stepNumber: i + 1,
            instruction: s.instruction,
            correctAnswer: s.correctAnswer,
            displayLatex: s.displayLatex || null,
            explanation: s.explanation || null,
            hintNudge: s.hintNudge || null,
            hintGuided: s.hintGuided || null,
            misconceptionId: s.misconceptionId || null,
            questionType: s.questionType || 'algebra',
        }));

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        const result = await saveQuestionSteps(questionId, toInputs(steps));
        setIsSaving(false);
        if (result.success) {
            setMessage({ kind: 'ok', text: 'Stegen sparade — uppgiften är åter i utkast tills den granskas.' });
            onStepsChanged?.(toInputs(steps).map((s, i) => ({ ...s, id: steps[i].key })));
        } else {
            setMessage({ kind: 'error', text: result.error ?? 'Kunde inte spara stegen.' });
        }
    };

    const handleSuggest = async () => {
        setIsSuggesting(true);
        setMessage(null);
        const result = await suggestSolutionSteps({
            questionContent,
            correctAnswer,
            questionType,
        });
        setIsSuggesting(false);
        if (result.success) {
            setSteps(result.steps.map((s) => ({
                ...emptyStep(),
                instruction: s.label,
                explanation: s.content,
                correctAnswer: s.expectedAnswer,
            })));
            setMessage({ kind: 'ok', text: `AI föreslog ${result.steps.length} steg — granska, lägg till ledtrådar och spara.` });
        } else {
            setMessage({ kind: 'error', text: result.error });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 p-4 text-sm text-[var(--foreground-subtle)]">
                <Loader2 className="h-4 w-4 animate-spin" /> Laddar steg…
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">Tonande lösningssteg</h3>
                    <p className="text-xs text-[var(--foreground-subtle)]">
                        Normaliserade steg som tonas bort när studentens självständighet ökar.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSuggest}
                        disabled={isSuggesting}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-muted)] px-3 py-2 text-xs font-semibold text-[var(--accent-600)] transition-[background-color,scale] duration-150 active:scale-[0.96] disabled:opacity-50"
                    >
                        {isSuggesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                        Föreslå steg med AI
                    </button>
                    <button
                        onClick={() => setSteps((prev) => [...prev, emptyStep()])}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-medium)] px-3 py-2 text-xs font-semibold text-[var(--foreground-muted)] transition-[background-color,scale] duration-150 hover:bg-[var(--surface-hover)] active:scale-[0.96]"
                    >
                        <Plus className="h-3.5 w-3.5" /> Lägg till steg
                    </button>
                </div>
            </div>

            {steps.length === 0 && (
                <p className="rounded-xl border border-dashed border-[var(--border-medium)] p-4 text-center text-xs text-[var(--foreground-subtle)]">
                    Inga steg ännu — lägg till manuellt eller låt AI föreslå en stegindelning.
                </p>
            )}

            {steps.map((step, i) => (
                <div key={step.key} className="rounded-xl border border-[var(--border-light)] bg-[var(--surface)] p-3 shadow-[var(--shadow-sm)]">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-bold tabular-nums text-[var(--foreground-subtle)]">Steg {i + 1}</span>
                        <div className="flex gap-1">
                            <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded-lg p-1.5 text-[var(--foreground-subtle)] hover:bg-[var(--surface-hover)] disabled:opacity-30" aria-label="Flytta upp">
                                <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => move(i, 1)} disabled={i === steps.length - 1} className="rounded-lg p-1.5 text-[var(--foreground-subtle)] hover:bg-[var(--surface-hover)] disabled:opacity-30" aria-label="Flytta ner">
                                <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setSteps((prev) => prev.filter((s) => s.key !== step.key))} className="rounded-lg p-1.5 text-[var(--error-500)] hover:bg-[var(--surface-hover)]" aria-label="Ta bort steg">
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                        <label className="text-xs text-[var(--foreground-muted)] md:col-span-2">
                            Instruktion *
                            <input value={step.instruction} onChange={(e) => update(step.key, 'instruction', e.target.value)}
                                className="mt-1 w-full rounded-lg border border-[var(--border-medium)] bg-[var(--surface)] px-2.5 py-1.5 text-sm text-[var(--foreground)]" />
                        </label>
                        <label className="text-xs text-[var(--foreground-muted)]">
                            Facit-svar *
                            <input value={step.correctAnswer} onChange={(e) => update(step.key, 'correctAnswer', e.target.value)}
                                className="mt-1 w-full rounded-lg border border-[var(--border-medium)] bg-[var(--surface)] px-2.5 py-1.5 font-mono text-sm text-[var(--foreground)]" />
                        </label>
                        <label className="text-xs text-[var(--foreground-muted)]">
                            Visnings-LaTeX
                            <input value={step.displayLatex ?? ''} onChange={(e) => update(step.key, 'displayLatex', e.target.value)}
                                className="mt-1 w-full rounded-lg border border-[var(--border-medium)] bg-[var(--surface)] px-2.5 py-1.5 font-mono text-sm text-[var(--foreground)]" />
                        </label>
                        <label className="text-xs text-[var(--foreground-muted)] md:col-span-2">
                            Förklaring (visas på förifyllda steg)
                            <textarea value={step.explanation ?? ''} onChange={(e) => update(step.key, 'explanation', e.target.value)} rows={2}
                                className="mt-1 w-full resize-none rounded-lg border border-[var(--border-medium)] bg-[var(--surface)] px-2.5 py-1.5 text-sm text-[var(--foreground)]" />
                        </label>
                        <label className="text-xs text-[var(--foreground-muted)]">
                            Ledtråd — knuff (L1)
                            <input value={step.hintNudge ?? ''} onChange={(e) => update(step.key, 'hintNudge', e.target.value)}
                                className="mt-1 w-full rounded-lg border border-[var(--border-medium)] bg-[var(--surface)] px-2.5 py-1.5 text-sm text-[var(--foreground)]" />
                        </label>
                        <label className="text-xs text-[var(--foreground-muted)]">
                            Ledtråd — guidad (L2)
                            <input value={step.hintGuided ?? ''} onChange={(e) => update(step.key, 'hintGuided', e.target.value)}
                                className="mt-1 w-full rounded-lg border border-[var(--border-medium)] bg-[var(--surface)] px-2.5 py-1.5 text-sm text-[var(--foreground)]" />
                        </label>
                        <label className="text-xs text-[var(--foreground-muted)] md:col-span-2">
                            Vanlig missuppfattning
                            <select
                                value={step.misconceptionId ?? ''}
                                onChange={(e) => update(step.key, 'misconceptionId', e.target.value || null)}
                                className="mt-1 w-full rounded-lg border border-[var(--border-medium)] bg-[var(--surface)] px-2.5 py-1.5 text-sm text-[var(--foreground)]"
                            >
                                <option value="">— ingen kopplad —</option>
                                {misconceptionOptions.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.code}: {m.description.slice(0, 80)}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                </div>
            ))}

            {message && (
                <p className={`rounded-xl px-3 py-2 text-xs ${
                    message.kind === 'ok'
                        ? 'bg-[var(--accent-muted)] text-[var(--accent-600)]'
                        : 'bg-[var(--error-500)]/10 text-[var(--error-600)]'
                }`}>
                    {message.text}
                </p>
            )}

            {steps.length > 0 && (
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary-700)] px-4 py-2 text-sm font-semibold text-[var(--surface)] transition-[background-color,scale] duration-150 hover:bg-[var(--primary-600)] active:scale-[0.96] disabled:opacity-50"
                >
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Spara steg
                </button>
            )}
        </div>
    );
}
