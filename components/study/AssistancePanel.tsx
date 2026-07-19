'use client';

import { ReactNode } from 'react';
import { Brain, Lightbulb, Sparkles } from 'lucide-react';

export type AssistanceLevel = 0 | 1 | 2 | 3 | 4 | 5;

export const ASSISTANCE_MODE_LABELS: Record<AssistanceLevel, string> = {
    0: 'Observerar',
    1: 'Knuff',
    2: 'Guidad ledtråd',
    3: 'Lösningssteg',
    4: 'Genomgång',
    5: 'Chit-Chat',
};

interface Stage {
    level: 1 | 2 | 3 | 4 | 5;
    title: string;
    copy: string;
    action: string;
}

export interface AssistancePanelProps {
    /** Highest assistance level used on the current question */
    currentLevel: AssistanceLevel;
    /** The page decides what each level does (hint, step reveal, worked example, AI) */
    onEscalate: (level: 1 | 2 | 3 | 4 | 5) => void;
    /** Question has authored fading steps — changes what level 3 offers */
    hasSteps: boolean;
    /** Wrong attempts on the current question — at 2+ we gently suggest the next level */
    wrongAttempts: number;
    /** Latest generated/authored hint to show under the ladder */
    activeHint?: { level: number; text: string; math?: string } | null;
    /** When the AI companion is open it takes over the panel body */
    aiOpen: boolean;
    /** Rendered AIPanel node (shown when aiOpen) */
    aiPanel?: ReactNode;
}

/**
 * The canonical assistance ladder ("tonande stöd"). One panel, five levels:
 * nudge → guided hint → step reveal → worked example → AI companion.
 * Escalation is always offered, never forced — calm copy, no urgency.
 */
export function AssistancePanel({
    currentLevel,
    onEscalate,
    hasSteps,
    wrongAttempts,
    activeHint,
    aiOpen,
    aiPanel,
}: AssistancePanelProps) {
    const stages: Stage[] = [
        {
            level: 1,
            title: 'En liten knuff',
            copy: 'En försiktig ledtråd som pekar din tanke i rätt riktning.',
            action: 'Visa knuff',
        },
        {
            level: 2,
            title: 'Formel eller koncept',
            copy: 'Se verktyget som passar här — utan att uppgiften löses åt dig.',
            action: 'Visa ledtråd',
        },
        {
            level: 3,
            title: hasSteps ? 'Nästa lösningssteg' : 'Vägledning steg för steg',
            copy: hasSteps
                ? 'Lås upp nästa steg i lösningen och fyll i resten själv.'
                : 'Följ en tankegång i små steg, ett i taget.',
            action: 'Visa steg',
        },
        {
            level: 4,
            title: 'Genomgång',
            copy: 'Se hela lösningen förklarad — bra att läsa efter egna försök.',
            action: 'Visa genomgång',
        },
        {
            level: 5,
            title: 'Chit-Chat',
            copy: 'Prata med din studiekompis om just den här uppgiften.',
            action: 'Öppna Chit-Chat',
        },
    ];

    const suggestedLevel = wrongAttempts >= 2 && currentLevel < 5
        ? ((currentLevel + 1) as 1 | 2 | 3 | 4 | 5)
        : null;

    return (
        <aside className="flex h-full flex-col overflow-hidden">
            <div className="border-b border-[var(--border-light)] p-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-500)] text-white">
                        <Brain className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[var(--foreground)]">Stöd när du vill</p>
                        <p className="truncate text-xs text-[var(--foreground-subtle)]">
                            Läge: {ASSISTANCE_MODE_LABELS[currentLevel]}
                        </p>
                    </div>
                </div>
            </div>

            {aiOpen && aiPanel ? (
                <div className="min-h-0 flex-1">{aiPanel}</div>
            ) : (
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                    <div className="rounded-xl border border-[var(--border-light)] bg-[var(--background-alt)] p-3">
                        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent-600)]">
                            Tonande stöd
                        </p>
                        <p className="mt-1 text-xs leading-5 text-[var(--foreground-muted)] [text-wrap:pretty]">
                            Stödet trappas upp i din takt — från en knuff till en full genomgång. Ju säkrare
                            du blir, desto mindre visar vi automatiskt.
                        </p>
                    </div>

                    {suggestedLevel !== null && (
                        <div className="rounded-xl border border-[var(--accent-border)] bg-[var(--accent-muted)] p-3">
                            <p className="text-xs leading-5 text-[var(--foreground)] [text-wrap:pretty]">
                                Det är helt okej att ta hjälp — vill du ha{' '}
                                <button
                                    onClick={() => onEscalate(suggestedLevel)}
                                    className="font-semibold text-[var(--accent-600)] underline underline-offset-2"
                                >
                                    {stages[suggestedLevel - 1].title.toLowerCase()}
                                </button>
                                ?
                            </p>
                        </div>
                    )}

                    <div className="space-y-2">
                        {stages.map((stage) => {
                            const used = currentLevel >= stage.level;
                            const isSuggested = stage.level === suggestedLevel;
                            return (
                                <button
                                    key={stage.level}
                                    onClick={() => onEscalate(stage.level)}
                                    className={`w-full rounded-xl border p-3 text-left transition-colors duration-150 ${
                                        used
                                            ? 'border-[var(--accent-border)] bg-[var(--accent-muted)]'
                                            : isSuggested
                                            ? 'border-[var(--accent-border)] bg-[var(--surface)] hover:bg-[var(--accent-muted)]'
                                            : 'border-[var(--border-light)] bg-[var(--surface)] hover:border-[var(--accent-border)]'
                                    }`}
                                >
                                    <div className="mb-1 flex items-center justify-between gap-3">
                                        <span className="text-sm font-semibold text-[var(--foreground)]">
                                            {stage.title}
                                        </span>
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${
                                                used
                                                    ? 'bg-[var(--accent-500)] text-white'
                                                    : 'bg-[var(--background-alt)] text-[var(--foreground-subtle)]'
                                            }`}
                                        >
                                            L{stage.level}
                                        </span>
                                    </div>
                                    <p className="text-xs leading-5 text-[var(--foreground-muted)] [text-wrap:pretty]">{stage.copy}</p>
                                    <p className="mt-2 text-xs font-semibold text-[var(--accent-600)]">
                                        {stage.action}
                                    </p>
                                </button>
                            );
                        })}
                    </div>

                    {activeHint && (
                        <div className="rounded-xl border border-[var(--border-light)] bg-[var(--surface)] p-3 shadow-[var(--shadow-sm)]">
                            <div className="mb-2 flex items-center gap-2">
                                <Lightbulb className="h-4 w-4 text-[var(--accent-500)]" />
                                <h3 className="text-sm font-semibold text-[var(--foreground)]">
                                    Aktuell ledtråd
                                </h3>
                                <span className="ml-auto rounded-full border border-[var(--border-light)] px-2 py-0.5 text-[10px] tabular-nums text-[var(--foreground-subtle)]">
                                    Nivå {activeHint.level}
                                </span>
                            </div>
                            <p className="text-sm leading-6 text-[var(--foreground-muted)] [text-wrap:pretty]">{activeHint.text}</p>
                        </div>
                    )}

                    <p className="flex items-center gap-1.5 px-1 text-[11px] text-[var(--foreground-subtle)]">
                        <Sparkles className="h-3 w-3" />
                        Att ta hjälp räknas inte emot dig — det är så man lär sig.
                    </p>
                </div>
            )}
        </aside>
    );
}
