'use client';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';
import FlashcardReviewSession, {
    type SessionSummary,
} from '@/components/flashcards/FlashcardReviewSession';
import MilestoneCelebration from '@/components/analytics/MilestoneCelebration';
import { reviewFlashcard, type FlashcardWithState } from '@/app/actions/flashcards';
import type { Rating } from '@/lib/flashcards/fsrs';

interface ReviewClientProps {
    cards: FlashcardWithState[];
    isFirstReviewOfDay: boolean;
}

export default function ReviewClient({ cards, isFirstReviewOfDay }: ReviewClientProps) {
    const [summary, setSummary] = useState<SessionSummary | null>(null);

    const handleReview = useCallback(async (cardId: string, rating: Rating) => {
        const result = await reviewFlashcard(cardId, rating);
        return { xpAwarded: result.xpAwarded };
    }, []);

    const handleComplete = useCallback((s: SessionSummary) => {
        setSummary(s);
    }, []);

    if (summary) {
        return <CompletionSummary summary={summary} />;
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            <FlashcardReviewSession
                cards={cards}
                onReview={handleReview}
                onComplete={handleComplete}
                isFirstReviewOfDay={isFirstReviewOfDay}
            />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Completion summary
// ─────────────────────────────────────────────────────────────────────────────

function CompletionSummary({ summary }: { summary: SessionSummary }) {
    const accuracy = summary.total > 0
        ? Math.round((summary.correct / summary.total) * 100)
        : 0;

    return (
        <div className="relative mx-auto max-w-xl px-4 py-12 text-center text-white">
            <MilestoneCelebration trigger message="Pass klart!" />

            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 14, stiffness: 220 }}
                className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-blue-400 shadow-xl shadow-emerald-500/30"
            >
                <Sparkles className="h-10 w-10 text-zinc-950" />
            </motion.div>

            <h1 className="text-3xl font-bold">Bra jobbat!</h1>
            <p className="mt-1 text-sm text-white/60">
                Du har repeterat {summary.total} kort. Långtidsminnet tackar.
            </p>

            <div className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-3">
                <Stat label="Totalt" value={`${summary.total}`} />
                <Stat label="Träffsäkerhet" value={`${accuracy}%`} />
                <Stat label="XP" value={`+${summary.totalXp}`} icon={<Zap className="h-3 w-3" />} />
            </div>

            <div className="mt-8 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
                <Link
                    href="/flashcards/review"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-bold text-zinc-950 transition hover:bg-violet-100"
                >
                    Ett pass till
                    <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                    href="/flashcards"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-4 py-2 text-sm font-bold text-white/80 transition hover:bg-white/10"
                >
                    Tillbaka till översikten
                </Link>
            </div>
        </div>
    );
}

function Stat({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon?: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-center">
            <p className="inline-flex items-center justify-center gap-1 text-xl font-bold text-white">
                {icon}
                {value}
            </p>
            <p className="mt-0.5 text-[11px] uppercase tracking-wider text-white/45">
                {label}
            </p>
        </div>
    );
}
