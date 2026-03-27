import { fadePhase } from '@/lib/math/fade-logic';

const PHASE_LABELS = {
    1: 'Fas 1: Fullt stöd',
    2: 'Fas 2: Delvis stöd',
    3: 'Fas 3: Minimalt stöd',
    4: 'Fas 4: Självständig',
};

const PHASE_COLORS = {
    1: 'bg-red-400',
    2: 'bg-yellow-400',
    3: 'bg-blue-400',
    4: 'bg-green-500',
};

export function MasteryIndicator({ mastery }: { mastery: number }) {
    const phase = fadePhase(mastery);
    const pct = Math.round(mastery * 100);
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>{PHASE_LABELS[phase]}</span>
                <span>{pct}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${PHASE_COLORS[phase]}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}
