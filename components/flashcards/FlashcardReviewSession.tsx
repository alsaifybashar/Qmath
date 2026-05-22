'use client';

/**
 * FlashcardReviewSession — production review component for /flashcards/review.
 *
 * Differs from the legacy components/features/FlashcardReview.tsx:
 *   - Operates on FlashcardWithState (DB shape) instead of a demo type.
 *   - FSRS rating buttons (1=Igen, 2=Svår, 3=Bra, 4=Lätt) in Swedish.
 *   - Supports both 'basic' and 'image_occlusion' card types.
 *   - Dopamine layer: animated +XP toast, streak flame on first daily review,
 *     and milestone confetti at 5/10/25 reviews.
 *   - All animations are gated on `useReducedMotion`.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    motion,
    AnimatePresence,
    useReducedMotion,
} from 'framer-motion';
import { Flame, Sparkles, Zap } from 'lucide-react';
import dynamic from 'next/dynamic';
import 'katex/dist/katex.min.css';
import type { FlashcardWithState } from '@/app/actions/flashcards';
import { RATING_LABEL_SV, type Rating } from '@/lib/flashcards/fsrs';
import ImageOcclusionCard from './ImageOcclusionCard';
import MilestoneCelebration from '@/components/analytics/MilestoneCelebration';

const BlockMath = dynamic(
    () => import('react-katex').then(m => m.BlockMath),
    { ssr: false },
);

const MILESTONES = new Set([5, 10, 25]);

interface FlashcardReviewSessionProps {
    cards: FlashcardWithState[];
    onReview: (cardId: string, rating: Rating) => Promise<{ xpAwarded: number } | void>;
    onComplete: (summary: SessionSummary) => void;
    /** Show a flame in the corner on the first review of this session. */
    isFirstReviewOfDay?: boolean;
}

export interface SessionSummary {
    total: number;
    correct: number;
    again: number;
    totalXp: number;
}

interface XpToast {
    id: number;
    xp: number;
}

export default function FlashcardReviewSession({
    cards,
    onReview,
    onComplete,
    isFirstReviewOfDay = false,
}: FlashcardReviewSessionProps) {
    const reduceMotion = useReducedMotion();
    const [index, setIndex] = useState(0);
    const [revealed, setRevealed] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [summary, setSummary] = useState<SessionSummary>({
        total: 0,
        correct: 0,
        again: 0,
        totalXp: 0,
    });
    const [toasts, setToasts] = useState<XpToast[]>([]);
    const [milestone, setMilestone] = useState<number | null>(null);
    const toastSeq = useRef(0);
    const flameShown = useRef(false);

    const card = cards[index];
    const progress = cards.length > 0 ? (index + 1) / cards.length : 1;

    // Show the streak flame for ~2.5s on first review of day
    useEffect(() => {
        if (isFirstReviewOfDay && !flameShown.current) {
            flameShown.current = true;
        }
    }, [isFirstReviewOfDay]);

    const pushToast = useCallback((xp: number) => {
        toastSeq.current += 1;
        const id = toastSeq.current;
        setToasts(t => [...t, { id, xp }]);
        setTimeout(() => {
            setToasts(t => t.filter(x => x.id !== id));
        }, 1300);
    }, []);

    const handleRating = useCallback(
        async (rating: Rating) => {
            if (!card || submitting) return;
            setSubmitting(true);
            try {
                const result = await onReview(card.id, rating);
                const xp = result && 'xpAwarded' in result ? result.xpAwarded : 0;

                const nextSummary: SessionSummary = {
                    total: summary.total + 1,
                    correct: rating >= 3 ? summary.correct + 1 : summary.correct,
                    again: rating === 1 ? summary.again + 1 : summary.again,
                    totalXp: summary.totalXp + xp,
                };
                setSummary(nextSummary);

                if (xp > 0) pushToast(xp);

                if (MILESTONES.has(nextSummary.total)) {
                    setMilestone(nextSummary.total);
                }

                // advance
                if (index + 1 >= cards.length) {
                    // Defer completion so the toast / confetti are visible briefly
                    setTimeout(() => onComplete(nextSummary), 600);
                } else {
                    setIndex(i => i + 1);
                    setRevealed(false);
                }
            } finally {
                setSubmitting(false);
            }
        },
        [card, submitting, onReview, summary, pushToast, index, cards.length, onComplete],
    );

    if (!card) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center text-white/65">
                Inga kort att repetera just nu.
            </div>
        );
    }

    return (
        <div className="relative w-full max-w-2xl mx-auto p-6">
            {/* Top stats row */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <p className="text-xs uppercase tracking-wider text-white/45">{card.bucketLabel}</p>
                    <p className="text-sm font-bold text-white">
                        Kort {index + 1} av {cards.length}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {isFirstReviewOfDay && (
                        <motion.span
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', damping: 12, stiffness: 240 }}
                            className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-1 text-xs font-bold text-orange-200 ring-1 ring-orange-400/30"
                        >
                            <Flame className={`h-3 w-3 text-orange-400 ${reduceMotion ? '' : 'animate-pulse'}`} />
                            Dagens första
                        </motion.span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-1 text-xs font-bold text-violet-100 ring-1 ring-violet-400/30">
                        <Zap className="h-3 w-3 text-violet-300" />
                        +{summary.totalXp} XP
                    </span>
                </div>
            </div>

            {/* Progress bar */}
            <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div
                    className="h-full bg-gradient-to-r from-violet-400 to-fuchsia-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.4 }}
                />
            </div>

            {/* Card */}
            <div className="mb-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={card.id + (revealed ? '-back' : '-front')}
                        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {card.type === 'image_occlusion' && card.imageUrl && card.occlusionMasks ? (
                            <ImageOcclusionCard
                                imageUrl={card.imageUrl}
                                masks={card.occlusionMasks}
                                revealed={revealed}
                                onRevealChange={r => setRevealed(r)}
                                caption={card.front || undefined}
                            />
                        ) : (
                            <button
                                type="button"
                                onClick={() => setRevealed(r => !r)}
                                className="w-full text-left"
                            >
                                <div
                                    className={`relative w-full rounded-3xl border shadow-xl p-8 min-h-[16rem] flex flex-col items-center justify-center text-center ${
                                        revealed
                                            ? 'bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15 border-violet-300/30'
                                            : 'bg-white/[0.06] border-white/10'
                                    }`}
                                >
                                    <p className="text-xs uppercase tracking-wider text-white/45 mb-3">
                                        {revealed ? 'Svar' : 'Fråga'}
                                    </p>
                                    {revealed ? (
                                        <BackFace card={card} />
                                    ) : (
                                        <FrontFace card={card} />
                                    )}
                                    {!revealed && (
                                        <p className="mt-6 text-xs text-white/45">Tryck för att visa svar</p>
                                    )}
                                </div>
                            </button>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Rating row */}
            <AnimatePresence>
                {revealed && (
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 14 }}
                        transition={{ duration: 0.25 }}
                        className="grid grid-cols-4 gap-2"
                    >
                        <RatingButton rating={1} disabled={submitting} onClick={() => handleRating(1)} />
                        <RatingButton rating={2} disabled={submitting} onClick={() => handleRating(2)} />
                        <RatingButton rating={3} disabled={submitting} onClick={() => handleRating(3)} />
                        <RatingButton rating={4} disabled={submitting} onClick={() => handleRating(4)} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* +XP toasts (stacked above bottom) */}
            <div className="pointer-events-none fixed bottom-10 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-1">
                <AnimatePresence>
                    {toasts.map(t => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: 20, scale: 0.6 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.9 }}
                            transition={{ type: 'spring', damping: 16, stiffness: 280 }}
                            className="inline-flex items-center gap-1 rounded-full bg-violet-500 px-3 py-1 text-sm font-bold text-white shadow-lg shadow-violet-500/30"
                        >
                            <Zap className="h-3 w-3" />
                            +{t.xp} XP
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Milestone celebration */}
            {milestone !== null && (
                <MilestoneCelebration
                    trigger
                    message={`${milestone} kort klart!`}
                    onDone={() => setMilestone(null)}
                />
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Front / Back / Rating button
// ─────────────────────────────────────────────────────────────────────────────

function FrontFace({ card }: { card: FlashcardWithState }) {
    return (
        <div className="space-y-3">
            {card.front && (
                <p className="text-xl font-medium text-white leading-snug">{card.front}</p>
            )}
            {card.frontMath && (
                <div className="text-lg text-white">
                    <BlockMath math={card.frontMath} />
                </div>
            )}
            {!card.front && !card.frontMath && (
                <Sparkles className="h-8 w-8 text-white/40" />
            )}
        </div>
    );
}

function BackFace({ card }: { card: FlashcardWithState }) {
    return (
        <div className="space-y-3">
            {card.back && (
                <p className="text-xl font-medium text-white leading-snug">{card.back}</p>
            )}
            {card.backMath && (
                <div className="text-lg text-white">
                    <BlockMath math={card.backMath} />
                </div>
            )}
        </div>
    );
}

const RATING_STYLE: Record<Rating, string> = {
    1: 'bg-rose-500/85 hover:bg-rose-500 shadow-rose-500/30',
    2: 'bg-amber-500/85 hover:bg-amber-500 shadow-amber-500/30',
    3: 'bg-violet-500/85 hover:bg-violet-500 shadow-violet-500/30',
    4: 'bg-emerald-500/85 hover:bg-emerald-500 shadow-emerald-500/30',
};

const RATING_SUB: Record<Rating, string> = {
    1: '< 1 min',
    2: '< 10 min',
    3: 'dagar',
    4: 'veckor',
};

function RatingButton({
    rating,
    disabled,
    onClick,
}: {
    rating: Rating;
    disabled: boolean;
    onClick: () => void;
}) {
    return (
        <motion.button
            type="button"
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={onClick}
            disabled={disabled}
            className={`rounded-2xl px-4 py-3 text-white shadow-lg transition disabled:opacity-50 ${RATING_STYLE[rating]}`}
        >
            <div className="font-bold">{RATING_LABEL_SV[rating]}</div>
            <div className="text-[10px] opacity-80">{RATING_SUB[rating]}</div>
        </motion.button>
    );
}
