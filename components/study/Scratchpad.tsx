'use client';

/**
 * Kladdblock — rough-work area, deliberately separate from the official
 * answer field. Dashed border signals "this is never graded".
 * Ported from the question-view prototype into the moss & parchment system.
 */
export function Scratchpad({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    return (
        <div className="rounded-2xl border border-dashed border-[var(--border-medium)] bg-[var(--background-alt)] p-4">
            <div className="mb-2">
                <p className="text-sm font-semibold text-[var(--foreground)]">Kladdblock</p>
                <p className="text-xs text-[var(--foreground-subtle)] [text-wrap:pretty]">
                    Testa idéer och mellanled här — det rättas aldrig.
                </p>
            </div>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={3}
                placeholder="Mellanled, en snabb skiss, ett motexempel…"
                className="w-full resize-none rounded-xl border border-[var(--border-light)] bg-[var(--surface)] px-4 py-3 text-sm leading-6 text-[var(--foreground)] outline-none transition-[border-color] duration-150 placeholder:text-[var(--foreground-subtle)] focus:border-[var(--border-focus)]"
            />
        </div>
    );
}
