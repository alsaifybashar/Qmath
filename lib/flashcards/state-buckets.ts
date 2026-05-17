/**
 * Classifies a card into one of four user-facing buckets per design_principer.md
 * ("🧩 Flashcards & Repetition"):
 *
 *   Ny             — never reviewed, or still in 'new' state
 *   Repetera snart — learning / relearning / very low stability (< 7d)
 *   Stabil         — stability between 7 and 30 days
 *   Långtidsminne  — stability ≥ 30 days
 *
 * The thresholds are chosen to map intuitively to the forgetting curve: a
 * stability of 30 days corresponds to ≥90% retention over a month.
 */

import type { CardStateRow } from './fsrs';

export type StateBucket = 'ny' | 'repetera_snart' | 'stabil' | 'langtidsminne';

export const BUCKET_LABEL_SV: Record<StateBucket, string> = {
    ny: 'Ny',
    repetera_snart: 'Repetera snart',
    stabil: 'Stabil',
    langtidsminne: 'Långtidsminne',
};

export const BUCKET_ORDER: StateBucket[] = [
    'ny',
    'repetera_snart',
    'stabil',
    'langtidsminne',
];

const STABLE_DAYS = 7;
const LONG_TERM_DAYS = 30;

export function bucketFor(row: CardStateRow): StateBucket {
    if (row.state === 'new' || row.reps === 0) return 'ny';
    if (row.state === 'learning' || row.state === 'relearning') return 'repetera_snart';
    if (row.stability < STABLE_DAYS) return 'repetera_snart';
    if (row.stability < LONG_TERM_DAYS) return 'stabil';
    return 'langtidsminne';
}

/** Group a list of state rows by bucket; ordering is preserved within group. */
export function groupByBucket<T extends { state: CardStateRow }>(
    rows: T[],
): Record<StateBucket, T[]> {
    const groups: Record<StateBucket, T[]> = {
        ny: [],
        repetera_snart: [],
        stabil: [],
        langtidsminne: [],
    };
    for (const r of rows) {
        groups[bucketFor(r.state)].push(r);
    }
    return groups;
}

/** Pretty colour token for a bucket — used by chips/badges. */
export const BUCKET_TONE: Record<StateBucket, string> = {
    ny: 'sky',
    repetera_snart: 'amber',
    stabil: 'emerald',
    langtidsminne: 'violet',
};
