import { fadePhase } from '@/lib/math/fade-logic';

const PHASE_LABELS: Record<1 | 2 | 3 | 4, string> = {
    1: 'Fullt stöd',
    2: 'Delvis stöd',
    3: 'Minimalt stöd',
    4: 'Självständig',
};

// Fade-phase boundaries (see lib/math/fade-logic.ts) shown as ticks on the bar
const PHASE_BOUNDARIES = [35, 55, 75];

export function MasteryIndicator({ mastery }: { mastery: number }) {
    const phase = fadePhase(mastery);
    const pct = Math.round(mastery * 100);
    return (
        <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground-subtle)]">
                    Självständighet
                </span>
                <span className="text-xs text-[var(--foreground-muted)]">
                    {PHASE_LABELS[phase]}
                    <span className="ml-2 tabular-nums font-semibold text-[var(--foreground)]">{pct}%</span>
                </span>
            </div>
            <div className="relative h-1.5 overflow-hidden rounded-full bg-[var(--border-light)]">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--accent-500)] to-[var(--accent-400)]"
                    style={{ width: `${pct}%` }}
                />
                {PHASE_BOUNDARIES.map((b) => (
                    <span
                        key={b}
                        className="absolute top-0 h-full w-px bg-[var(--surface)] opacity-80"
                        style={{ left: `${b}%` }}
                    />
                ))}
            </div>
        </div>
    );
}
