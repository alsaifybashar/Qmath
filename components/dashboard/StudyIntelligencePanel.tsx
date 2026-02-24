'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, Clock, Target, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { useState, useMemo } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StudyAction {
    topicId: string;
    topicName: string;
    courseCode: string;
    /** Expected percentage-point improvement if student works on this topic */
    expectedImprovement: number;
    /** Urgency 1–5 (5 most urgent) */
    urgency: number;
    estimatedMinutes: number;
    reason: string;
}

interface StudyIntelligencePanelProps {
    actions: StudyAction[];
    /** How many % does the student improve if they do one session now */
    sessionEffect: number;
    /** AI-generated focus text */
    focusRecommendation: string;
    /** Time distribution per subject, e.g. [{ label: 'TATA24', minutes: 45, color: '#4361EE' }] */
    timeDistribution: Array<{ label: string; minutes: number; color: string }>;
    /** Student is on-track / ahead / behind */
    planStatus: 'on-track' | 'ahead' | 'behind' | null;
}

// ─── Palette ─────────────────────────────────────────────────────────────────

const C = {
    surface: '#FFFFFF',
    surfaceAlt: '#F7F8FC',
    border: '#EFF1F8',
    text: '#1A1D2E',
    textSec: '#6B7194',
    textMuted: '#A0A5C0',
    blue: '#4361EE',
    indigo: '#6366F1',
    green: '#22C55E',
    yellow: '#EAB308',
    cardShadow: '0 2px 12px rgba(26,29,46,0.06)',
};

const URGENCY_COLORS: Record<number, string> = {
    5: '#EF4444',
    4: '#F97316',
    3: '#EAB308',
    2: '#22C55E',
    1: '#A0A5C0',
};

const URGENCY_LABELS: Record<number, string> = {
    5: 'Kritisk',
    4: 'Hög',
    3: 'Medel',
    2: 'Låg',
    1: 'Valfri',
};

// ─── Plan status banner ───────────────────────────────────────────────────────

function PlanStatusBanner({ status }: { status: 'on-track' | 'ahead' | 'behind' | null }) {
    if (!status) return null;

    const config = {
        'on-track': {
            bg: 'linear-gradient(90deg,#22C55E15,#22C55E08)',
            border: '#22C55E40',
            icon: '👍',
            text: 'Du ligger i fas',
            sub: 'Bra jobbat, fortsätt i samma takt!',
            color: '#16A34A',
        },
        ahead: {
            bg: 'linear-gradient(90deg,#4361EE15,#6366F115)',
            border: '#4361EE40',
            icon: '🚀',
            text: 'Du är före planen',
            sub: 'Utmärkt! Du har ett försprång inför tentan.',
            color: '#4361EE',
        },
        behind: {
            bg: 'linear-gradient(90deg,#EAB30815,#F9731608)',
            border: '#EAB30840',
            icon: '💪',
            text: 'Lite efter planen',
            sub: 'Det är OK — en fokussession nu sätter dig i fas.',
            color: '#CA8A04',
        },
    }[status];

    return (
        <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4 text-sm"
            style={{ background: config.bg, border: `1px solid ${config.border}` }}
        >
            <span className="text-lg">{config.icon}</span>
            <div>
                <span className="font-bold" style={{ color: config.color }}>{config.text}</span>
                <span className="ml-2" style={{ color: C.textSec }}>{config.sub}</span>
            </div>
        </motion.div>
    );
}

// ─── Time distribution bar ────────────────────────────────────────────────────

function TimeDistributionBar({ distribution }: { distribution: Array<{ label: string; minutes: number; color: string }> }) {
    const total = distribution.reduce((s, d) => s + d.minutes, 0);
    if (total === 0) return null;

    return (
        <div>
            <div className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: C.textMuted }}>
                Optimerad tidsfördelning
            </div>
            {/* Stacked bar */}
            <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-3">
                {distribution.map((d, i) => (
                    <motion.div
                        key={i}
                        initial={{ width: 0 }}
                        animate={{ width: `${(d.minutes / total) * 100}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                        style={{ background: d.color }}
                        title={`${d.label}: ${d.minutes} min`}
                    />
                ))}
            </div>
            {/* Labels */}
            <div className="flex flex-wrap gap-x-4 gap-y-1">
                {distribution.map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: C.textSec }}>
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        <span className="font-medium">{d.label}</span>
                        <span style={{ color: C.textMuted }}>{d.minutes} min</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Priority action row ──────────────────────────────────────────────────────

function ActionRow({ action, index }: { action: StudyAction; index: number }) {
    const urgencyColor = URGENCY_COLORS[action.urgency] || C.textMuted;

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.07 }}
            className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
            style={{ background: C.surfaceAlt, border: `1px solid ${C.border}` }}
        >
            {/* Rank */}
            <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold flex-shrink-0"
                style={{ background: `${urgencyColor}15`, color: urgencyColor }}
            >
                {index + 1}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate" style={{ color: C.text }}>
                        {action.topicName}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${urgencyColor}20`, color: urgencyColor }}>
                        {URGENCY_LABELS[action.urgency]}
                    </span>
                </div>
                <div className="text-xs mt-0.5 truncate" style={{ color: C.textMuted }}>
                    {action.courseCode} · {action.reason}
                </div>
            </div>

            {/* Effect */}
            <div className="text-right flex-shrink-0">
                <div className="text-sm font-bold" style={{ color: C.green }}>
                    +{action.expectedImprovement}%
                </div>
                <div className="flex items-center gap-1 text-[10px]" style={{ color: C.textMuted }}>
                    <Clock className="w-2.5 h-2.5" />
                    {action.estimatedMinutes} min
                </div>
            </div>
        </motion.div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudyIntelligencePanel({
    actions,
    sessionEffect,
    focusRecommendation,
    timeDistribution,
    planStatus,
}: StudyIntelligencePanelProps) {
    const [showAll, setShowAll] = useState(false);
    const [showAI, setShowAI] = useState(false);

    const displayedActions = useMemo(
        () => (showAll ? actions : actions.slice(0, 3)),
        [actions, showAll]
    );

    const topAction = actions[0];

    return (
        <div
            className="rounded-2xl p-6"
            style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: C.cardShadow }}
        >
            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: `${C.indigo}15` }}
                    >
                        <Sparkles className="w-5 h-5" style={{ color: C.indigo }} />
                    </div>
                    <div>
                        <h3 className="font-bold text-base" style={{ color: C.text }}>
                            Study Intelligence
                        </h3>
                        <p className="text-xs" style={{ color: C.textMuted }}>
                            AI-driven prioritering för dig
                        </p>
                    </div>
                </div>

                {/* Session effect chip */}
                {sessionEffect > 0 && (
                    <div
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold"
                        style={{ background: `${C.green}15`, color: C.green }}
                    >
                        <TrendingUp className="w-4 h-4" />
                        +{sessionEffect}% per session
                    </div>
                )}
            </div>

            {/* ── Plan status banner ── */}
            <PlanStatusBanner status={planStatus} />

            {/* ── Smartaste nästa åtgärd ── */}
            {topAction && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-4 p-4 rounded-xl mb-5"
                    style={{
                        background: 'linear-gradient(135deg, #1A1D2E 0%, #2A2F4A 100%)',
                    }}
                >
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${C.indigo}30` }}
                    >
                        <Zap className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 mb-1">
                            Din smartaste nästa åtgärd
                        </div>
                        <div className="text-white font-bold text-sm leading-snug">
                            {topAction.topicName}
                            <span className="ml-2 text-xs font-normal text-white/60">
                                ({topAction.courseCode})
                            </span>
                        </div>
                        <div className="text-xs text-white/50 mt-0.5">{topAction.reason}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <div className="text-lg font-extrabold text-green-400">+{topAction.expectedImprovement}%</div>
                        <div className="text-[10px] text-white/40">{topAction.estimatedMinutes} min</div>
                    </div>
                </motion.div>
            )}

            {/* ── Priority list ── */}
            {actions.length > 0 && (
                <div className="mb-5">
                    <div className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: C.textMuted }}>
                        Prioriteringslista
                    </div>
                    <div className="space-y-2">
                        {displayedActions.map((action, i) => (
                            <ActionRow key={action.topicId} action={action} index={i} />
                        ))}
                    </div>
                    {actions.length > 3 && (
                        <button
                            onClick={() => setShowAll(s => !s)}
                            className="mt-2 flex items-center gap-1 text-xs font-semibold hover:opacity-80 transition-opacity"
                            style={{ color: C.blue }}
                        >
                            {showAll ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            {showAll ? 'Visa färre' : `Visa alla ${actions.length} moment`}
                        </button>
                    )}
                </div>
            )}

            {/* ── AI Focus Recommendation ── */}
            {focusRecommendation && (
                <div className="mb-5">
                    <button
                        onClick={() => setShowAI(s => !s)}
                        className="flex items-center gap-2 text-xs font-semibold mb-2 hover:opacity-80 transition-opacity w-full text-left"
                        style={{ color: C.indigo }}
                    >
                        <Target className="w-3.5 h-3.5" />
                        AI-fokusrekommendation
                        {showAI ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
                    </button>
                    <AnimatePresence>
                        {showAI && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="overflow-hidden"
                            >
                                <div
                                    className="p-3 rounded-xl text-sm leading-relaxed"
                                    style={{ background: `${C.indigo}08`, border: `1px solid ${C.indigo}20`, color: C.textSec }}
                                >
                                    {focusRecommendation}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* ── Time distribution ── */}
            {timeDistribution.length > 0 && (
                <TimeDistributionBar distribution={timeDistribution} />
            )}
        </div>
    );
}
