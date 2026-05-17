'use client';

/**
 * PsychInsightsPanel
 *
 * Surfaces the top behavioural signals computed from learner data and pairs
 * each with an evidence-based study technique the student can apply now.
 *
 * Visual language mirrors AnalyticsDashboard's liquid-theme glass surfaces.
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain,
    ChevronDown,
    Clock,
    Flame,
    Lightbulb,
    Lock,
    MessageCircleQuestion,
    Pause,
    Shuffle,
    Sparkles,
    Timer,
    type LucideIcon,
} from 'lucide-react';
import {
    type BehavioralSignal,
    computeSignals,
    topSignals,
    type SignalInput,
} from '@/lib/analytics/signals';
import {
    primaryTechniqueForSignal,
    type StudyTechnique,
} from '@/lib/analytics/techniques';

const TECHNIQUE_ICONS: Record<StudyTechnique['icon'], LucideIcon> = {
    timer: Timer,
    pause: Pause,
    brain: Brain,
    lightbulb: Lightbulb,
    'message-circle-question': MessageCircleQuestion,
    flame: Flame,
    shuffle: Shuffle,
    lock: Lock,
};

const INTENSITY_TONE: Record<BehavioralSignal['intensity'], {
    chip: string;
    label: string;
}> = {
    high: {
        chip: 'border-amber-200/30 bg-amber-300/15 text-amber-100',
        label: 'Stark signal',
    },
    medium: {
        chip: 'border-blue-200/30 bg-blue-300/15 text-blue-100',
        label: 'Tydlig signal',
    },
    low: {
        chip: 'border-white/15 bg-white/10 text-white/65',
        label: 'Lugn',
    },
};

const VALENCE_ACCENT: Record<BehavioralSignal['valence'], string> = {
    protective: 'from-emerald-300/20 via-transparent to-transparent',
    friction: 'from-amber-300/15 via-transparent to-transparent',
};

function glass(className = '') {
    return [
        'rounded-lg border border-white/15 bg-white/[0.07]',
        'shadow-2xl shadow-black/25 backdrop-blur-md ring-1 ring-white/5',
        className,
    ].join(' ');
}

interface PsychInsightsPanelProps {
    input: SignalInput;
    /** Max number of signal cards to surface. Default 2. */
    limit?: number;
}

export default function PsychInsightsPanel({ input, limit = 2 }: PsychInsightsPanelProps) {
    const signals = useMemo(() => computeSignals(input), [input]);
    const surfaced = useMemo(() => topSignals(signals, limit), [signals, limit]);

    if (surfaced.length === 0) return null;

    return (
        <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={glass('p-4 sm:p-5')}
        >
            <header className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-violet-300/25 bg-violet-400/15 text-violet-100 shadow-lg shadow-violet-500/20">
                    <Sparkles className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-bold uppercase text-violet-200">
                        Så jobbar din hjärna just nu
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-white">
                        {surfaced.length === 1
                            ? '1 mönster att agera på'
                            : `${surfaced.length} mönster att agera på`}
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-white/55">
                        Tolkningar från sessionsdata, med en evidensbaserad teknik per signal.
                    </p>
                </div>
            </header>

            <div className="grid gap-3 lg:grid-cols-2">
                {surfaced.map((signal, i) => (
                    <SignalCard key={signal.id} signal={signal} index={i} />
                ))}
            </div>
        </motion.section>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SignalCard
// ─────────────────────────────────────────────────────────────────────────────

function SignalCard({ signal, index }: { signal: BehavioralSignal; index: number }) {
    const technique = primaryTechniqueForSignal(signal);
    const TechniqueIcon = TECHNIQUE_ICONS[technique.icon];
    const tone = INTENSITY_TONE[signal.intensity];
    const [stepsOpen, setStepsOpen] = useState(false);

    return (
        <motion.article
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.045]"
        >
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${VALENCE_ACCENT[signal.valence]}`} />

            <div className="relative p-4">
                {/* Header: signal name + intensity chip */}
                <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="truncate text-sm font-bold uppercase tracking-wide text-white/75">
                        {signal.name}
                    </h3>
                    <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${tone.chip}`}>
                        {tone.label}
                    </span>
                </div>

                {/* Summary */}
                <p className="text-base font-semibold leading-snug text-white">
                    {signal.summary}
                </p>

                {/* Evidence */}
                {signal.evidence.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                        {signal.evidence.slice(0, 3).map((e, i) => (
                            <li key={i} className="flex gap-2 text-xs leading-5 text-white/60">
                                <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-white/40" />
                                <span>{e}</span>
                            </li>
                        ))}
                    </ul>
                )}

                {/* Score bar — visual anchor */}
                <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase text-white/40">
                        <span>Signalstyrka</span>
                        <span className="tabular-nums">{signal.score} / 100</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${signal.score}%` }}
                            transition={{ duration: 0.9, delay: 0.1 + index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                            className={[
                                'h-full rounded-full',
                                signal.valence === 'protective'
                                    ? 'bg-gradient-to-r from-emerald-300 to-blue-300'
                                    : 'bg-gradient-to-r from-amber-300 to-blue-300',
                            ].join(' ')}
                        />
                    </div>
                </div>

                {/* Technique recommendation */}
                <div className="mt-4 rounded-lg border border-white/15 bg-white/[0.06] p-3">
                    <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white">
                            <TechniqueIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-white/45">
                                <span>Teknik</span>
                                <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-1.5 py-0.5">
                                    <Clock className="h-3 w-3" />
                                    {technique.durationMin} min
                                </span>
                            </div>
                            <h4 className="mt-0.5 text-sm font-bold text-white">{technique.name}</h4>
                            <p className="mt-1 text-xs leading-5 text-white/65">
                                {technique.oneliner}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setStepsOpen(v => !v)}
                        className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold uppercase text-white/55 transition hover:text-white"
                        aria-expanded={stepsOpen}
                    >
                        {stepsOpen ? 'Dölj' : 'Visa stegen'}
                        <ChevronDown
                            className={`h-3 w-3 transition-transform ${stepsOpen ? 'rotate-180' : ''}`}
                        />
                    </button>

                    <AnimatePresence initial={false}>
                        {stepsOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                className="overflow-hidden"
                            >
                                <ol className="mt-3 space-y-2 border-l border-white/10 pl-3 text-xs leading-5 text-white/70">
                                    {technique.steps.map((step, i) => (
                                        <li key={i} className="relative">
                                            <span className="absolute -left-[14px] top-1 inline-flex h-3 w-3 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[8px] font-bold text-white/80">
                                                {i + 1}
                                            </span>
                                            {step}
                                        </li>
                                    ))}
                                </ol>
                                <p className="mt-3 rounded-md border border-white/10 bg-white/[0.04] p-2 text-[11px] italic leading-5 text-white/55">
                                    {technique.whyItWorks}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.article>
    );
}
