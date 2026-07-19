'use client';

import { Lightbulb, BookOpen, Brain, PenLine } from 'lucide-react';

export interface BottomCommandBarProps {
    /** Escalate the assistance ladder (1 knuff … 5 Chit-Chat) */
    onEscalate: (level: 1 | 2 | 3 | 4 | 5) => void;
    /** "Jag har fastnat" — the page picks the next sensible ladder level */
    onStuck: () => void;
    onToggleScratchpad: () => void;
    /** Hidden while feedback/completion cards need the student's attention */
    visible: boolean;
    /** Shift left when the help panel is open on desktop */
    isSplitView: boolean;
}

/**
 * Quick-help chrome pinned above the fold — the one place translucency is
 * used, per the design system ("translucency is reserved for chrome").
 * Every action is a shortcut into the assistance ladder.
 */
export function BottomCommandBar({ onEscalate, onStuck, onToggleScratchpad, visible, isSplitView }: BottomCommandBarProps) {
    if (!visible) return null;

    const itemClass =
        'inline-flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors duration-150';

    return (
        <div
            className={`pointer-events-none fixed inset-x-0 bottom-4 z-30 flex px-4 ${
                isSplitView ? 'justify-center xl:pr-[36vw]' : 'justify-center'
            }`}
        >
            <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg-elevated)] p-1.5 shadow-[var(--shadow-xl)] backdrop-blur-md">
                <button
                    onClick={onStuck}
                    className={`${itemClass} text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)]`}
                >
                    <Lightbulb className="h-4 w-4" />
                    Jag har fastnat
                </button>
                <button
                    onClick={() => onEscalate(4)}
                    className={`${itemClass} text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)]`}
                >
                    <BookOpen className="h-4 w-4" />
                    Genomgång
                </button>
                <button
                    onClick={onToggleScratchpad}
                    className={`${itemClass} text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)]`}
                >
                    <PenLine className="h-4 w-4" />
                    Kladdblock
                </button>
                <button
                    onClick={() => onEscalate(5)}
                    className={`${itemClass} bg-[var(--accent-500)] text-white hover:bg-[var(--accent-600)]`}
                >
                    <Brain className="h-4 w-4" />
                    Chit-Chat
                </button>
            </div>
        </div>
    );
}
