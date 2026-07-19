'use client';

import { useEffect, useState } from 'react';
import { Eye, Loader2 } from 'lucide-react';
import { FadingStepsSession } from '@/components/study/FadingStepsSession';
import { MasteryIndicator } from '@/components/study/MasteryIndicator';
import { getQuestionSteps } from '@/app/actions/admin-questions';

// One representative mastery per fade phase
const PHASE_PRESETS: Array<{ label: string; mastery: number }> = [
    { label: 'Fas 1 · Fullt stöd', mastery: 0.2 },
    { label: 'Fas 2 · Delvis', mastery: 0.45 },
    { label: 'Fas 3 · Minimalt', mastery: 0.65 },
    { label: 'Fas 4 · Självständig', mastery: 0.9 },
];

export interface StudentPreviewProps {
    questionId: string;
    questionText: string;
    /** Bump to reload steps after the editor saves */
    refreshNonce?: number;
}

/**
 * Renders the REAL student component (FadingStepsSession) against the saved
 * draft steps at a selectable mastery level — what the admin sees is what
 * students get, minus DB writes and CAS grading.
 */
export function StudentPreview({ questionId, questionText, refreshNonce = 0 }: StudentPreviewProps) {
    const [presetIndex, setPresetIndex] = useState(0);
    const [steps, setSteps] = useState<Array<{
        id: string; stepNumber: number; instruction: string; displayLatex: string | null;
        hint: string | null; hintNudge: string | null; hintGuided: string | null;
        explanation: string | null; questionType: string | null; correctAnswer: string;
    }> | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        getQuestionSteps(questionId).then((res) => {
            if (cancelled) return;
            setSteps(res.data ?? []);
            setIsLoading(false);
        });
        return () => { cancelled = true; };
    }, [questionId, refreshNonce]);

    const preset = PHASE_PRESETS[presetIndex];

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-[var(--accent-500)]" />
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">Studentvy</h3>
                </div>
                <div className="flex flex-wrap gap-1">
                    {PHASE_PRESETS.map((p, i) => (
                        <button
                            key={p.label}
                            onClick={() => setPresetIndex(i)}
                            className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-[background-color,scale] duration-150 active:scale-[0.96] ${
                                i === presetIndex
                                    ? 'bg-[var(--accent-500)] text-white'
                                    : 'bg-[var(--background-alt)] text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)]'
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center gap-2 p-4 text-sm text-[var(--foreground-subtle)]">
                    <Loader2 className="h-4 w-4 animate-spin" /> Laddar förhandsgranskning…
                </div>
            ) : !steps || steps.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[var(--border-medium)] p-4 text-center text-xs text-[var(--foreground-subtle)]">
                    Spara steg först — då visas exakt vad studenten ser på varje självständighetsnivå.
                </p>
            ) : (
                <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--background)] p-4">
                    <div className="mb-3">
                        <MasteryIndicator mastery={preset.mastery} />
                    </div>
                    <FadingStepsSession
                        key={`${preset.mastery}-${refreshNonce}`}
                        questionId={questionId}
                        topicId="preview"
                        sessionId={null}
                        questionText={questionText}
                        helpLevelReached={0}
                        revealNonce={0}
                        onComplete={() => { /* preview only */ }}
                        preview={{ steps, mastery: preset.mastery }}
                    />
                </div>
            )}
        </div>
    );
}
