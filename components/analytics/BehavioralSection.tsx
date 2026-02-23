'use client';

/**
 * Module 3 – Behavioural Patterns
 *
 * Design principle: Data Storytelling & Enkelhet
 *   • ConcentrationTimeline   – focus vs distracted vs stressed segments (AreaChart)
 *   • StressHeatmap           – per-question stress intensity grid
 *   • NarrativeInsightCard    – human-readable insight cards from computed stats
 *
 * No external legend blocks: all labels live inside the chart area.
 */

import React, { useMemo } from 'react';
import {
    ComposedChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
    ReferenceArea,
    ResponsiveContainer,
    Scatter,
} from 'recharts';
import { motion } from 'framer-motion';
import {
    BehaviouralMetrics,
    BehaviouralDataPoint,
    NarrativeInsight,
    RAPID_GUESS_THRESHOLD_MS,
    FocusState,
} from '@/types/analytics';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const FOCUS_COLORS: Record<FocusState, string> = {
    focused: '#10b981',     // emerald-500
    distracted: '#f59e0b',  // amber-500
    stressed: '#ef4444',    // red-500
};

const FOCUS_BG: Record<FocusState, string> = {
    focused: 'rgba(16, 185, 129, 0.08)',
    distracted: 'rgba(245, 158, 11, 0.08)',
    stressed: 'rgba(239, 68, 68, 0.08)',
};

const FOCUS_LABELS: Record<FocusState, string> = {
    focused: 'Fokuserad',
    distracted: 'Distraherad',
    stressed: 'Stressad',
};

const ACCENT_CLASSES: Record<NarrativeInsight['accent'], {
    border: string; bg: string; icon: string; headline: string;
}> = {
    emerald: {
        border: 'border-emerald-200 dark:border-emerald-800',
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        icon: 'text-emerald-500',
        headline: 'text-emerald-700 dark:text-emerald-300',
    },
    amber: {
        border: 'border-amber-200 dark:border-amber-800',
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        icon: 'text-amber-500',
        headline: 'text-amber-700 dark:text-amber-300',
    },
    red: {
        border: 'border-red-200 dark:border-red-800',
        bg: 'bg-red-50 dark:bg-red-950/30',
        icon: 'text-red-500',
        headline: 'text-red-700 dark:text-red-300',
    },
    blue: {
        border: 'border-blue-200 dark:border-blue-800',
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        icon: 'text-blue-500',
        headline: 'text-blue-700 dark:text-blue-300',
    },
    purple: {
        border: 'border-purple-200 dark:border-purple-800',
        bg: 'bg-purple-50 dark:bg-purple-950/30',
        icon: 'text-purple-500',
        headline: 'text-purple-700 dark:text-purple-300',
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatSeconds(s: number): string {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${s}s`;
}

function formatMs(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
}

/** Infer contiguous focus segments from the data-point array */
function extractSegments(
    points: BehaviouralDataPoint[],
): Array<{ state: FocusState; start: number; end: number }> {
    if (points.length === 0) return [];

    const segments: Array<{ state: FocusState; start: number; end: number }> = [];
    let current: FocusState = points[0].focusState;
    let segStart = points[0].elapsedSeconds;

    for (let i = 1; i < points.length; i++) {
        const pt = points[i];
        if (pt.focusState !== current) {
            segments.push({ state: current, start: segStart, end: pt.elapsedSeconds });
            current = pt.focusState;
            segStart = pt.elapsedSeconds;
        }
    }
    // close final segment
    segments.push({
        state: current,
        start: segStart,
        end: points[points.length - 1].elapsedSeconds,
    });
    return segments;
}

/** Build narrative cards from aggregated session metrics */
export function buildNarrativeInsights(metrics: BehaviouralMetrics): NarrativeInsight[] {
    const { summary, dataPoints } = metrics;
    const insights: NarrativeInsight[] = [];

    // 1. Rapid-guess warning
    if (summary.rapidGuessShare > 0.2) {
        insights.push({
            icon: '⚡',
            headline: 'Du gissade på många svar',
            body: `${Math.round(summary.rapidGuessShare * 100)}% av dina svar skickades på under ${RAPID_GUESS_THRESHOLD_MS / 1000} sekunder. Snabba gissningar minskar lärandeeffekten – försök att ta dig tid att tänka igenom varje steg.`,
            accent: 'red',
            cta: { label: 'Öva metodiskt', href: '/practice' },
        });
    }

    // 2. Average response time story
    const avgSec = summary.avgResponseMs / 1000;
    const lastFive = dataPoints.slice(-5);
    const avgLastFiveSec = lastFive.length > 0
        ? lastFive.reduce((s, p) => s + p.responseTimeMs, 0) / lastFive.length / 1000
        : avgSec;

    if (lastFive.length >= 5) {
        const delta = avgLastFiveSec - avgSec;
        if (delta > 5) {
            insights.push({
                icon: '⏱️',
                headline: 'Du saktar ner mot slutet',
                body: `Du la i snitt ${avgLastFiveSec.toFixed(1)}s per fråga på de sista fem uppgifterna – ${delta.toFixed(1)}s mer än snittet (${avgSec.toFixed(1)}s). Det kan vara ett tecken på mental trötthet.`,
                accent: 'amber',
            });
        } else if (delta < -5) {
            insights.push({
                icon: '🚀',
                headline: 'Du accelererar – kontrollera noggrannheten!',
                body: `Svarstiden sjönk till ${avgLastFiveSec.toFixed(1)}s på de sista fem uppgifterna. Om noggrannheten är hög är det fantastiskt. Om inte – ta ett extra varv.`,
                accent: 'blue',
            });
        }
    }

    // 3. Peak-stress callout
    if (summary.avgStressLevel > 0.6) {
        insights.push({
            icon: '🔥',
            headline: 'Hög stressnivå under sessionen',
            body: `Genomsnittlig stressnivå: ${Math.round(summary.avgStressLevel * 100)}%. Toppad vid ${formatSeconds(summary.peakStressAt)} in i sessionen. Korta pauser och andningsövningar kan hjälpa.`,
            accent: 'red',
        });
    } else if (summary.avgStressLevel < 0.3 && summary.focusedShare > 0.7) {
        insights.push({
            icon: '🎯',
            headline: 'Utmärkt fokus under hela sessionen',
            body: `Du var i fokusläge ${Math.round(summary.focusedShare * 100)}% av sessionen med låg stressnivå (${Math.round(summary.avgStressLevel * 100)}%). Fortsätt på samma sätt!`,
            accent: 'emerald',
        });
    }

    // 4. Distraction pattern
    if (summary.distractedShare > 0.35) {
        insights.push({
            icon: '🌊',
            headline: 'Distraherad under en stor del av sessionen',
            body: `Du var distraherad ${Math.round(summary.distractedShare * 100)}% av sessionen. Prova att stänga av notifieringar eller byta miljö för nästa session.`,
            accent: 'purple',
        });
    }

    // Always provide at least one insight
    if (insights.length === 0) {
        insights.push({
            icon: '📊',
            headline: 'Session genomförd',
            body: `Du besvarade ${dataPoints.length} frågor med ett snitt på ${formatMs(summary.avgResponseMs)} per fråga. ${Math.round(summary.focusedShare * 100)}% av sessionen var du i fokusläge.`,
            accent: 'blue',
        });
    }

    return insights;
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Tooltip for Concentration Timeline
// ─────────────────────────────────────────────────────────────────────────────

function ConcentrationTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
    if (!active || !payload?.length) return null;

    const data = payload[0]?.payload as BehaviouralDataPoint & { x: number };
    if (!data) return null;

    const state = data.focusState;
    const stateColor = FOCUS_COLORS[state];

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-sm max-w-[200px]">
            <p className="font-semibold mb-1" style={{ color: stateColor }}>
                {FOCUS_LABELS[state]}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
                Tid: {formatSeconds(data.elapsedSeconds)}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
                Svarstid: {formatMs(data.responseTimeMs)}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
                Stressnivå: {Math.round(data.stressLevel * 100)}%
            </p>
            {data.isRapidGuess && (
                <p className="text-amber-600 dark:text-amber-400 font-medium mt-1">⚡ Snabb gissning</p>
            )}
            <p className={`mt-1 font-medium ${data.isCorrect ? 'text-emerald-600' : 'text-red-500'}`}>
                {data.isCorrect ? '✓ Rätt' : '✗ Fel'}
            </p>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: ConcentrationTimeline
// ─────────────────────────────────────────────────────────────────────────────

interface ConcentrationTimelineProps {
    dataPoints: BehaviouralDataPoint[];
    peakStressAt: number;
}

function ConcentrationTimeline({ dataPoints, peakStressAt }: ConcentrationTimelineProps) {
    const segments = useMemo(() => extractSegments(dataPoints), [dataPoints]);

    // Normalise response times to 0–1 for the area chart
    const maxRt = useMemo(
        () => Math.max(...dataPoints.map(p => p.responseTimeMs), 1),
        [dataPoints],
    );

    const chartData = useMemo(() =>
        dataPoints.map(p => ({
            ...p,
            x: p.elapsedSeconds,
            normRt: p.responseTimeMs / maxRt,
            stress: p.stressLevel,
            // Scatter position for rapid guesses
            rapidGuess: p.isRapidGuess ? p.responseTimeMs / maxRt : null,
        })),
        [dataPoints, maxRt],
    );

    const totalSeconds = dataPoints.at(-1)?.elapsedSeconds ?? 0;

    // Build x-axis ticks every minute
    const xTicks = useMemo(() => {
        const ticks: number[] = [];
        for (let s = 0; s <= totalSeconds; s += 60) ticks.push(s);
        return ticks;
    }, [totalSeconds]);

    return (
        <div>
            {/* Inline legend — no external legend block */}
            <div className="flex items-center gap-4 mb-3 flex-wrap">
                {(Object.keys(FOCUS_LABELS) as FocusState[]).map(state => (
                    <div key={state} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                        <span
                            className="inline-block w-3 h-3 rounded-sm"
                            style={{ background: FOCUS_COLORS[state] }}
                        />
                        {FOCUS_LABELS[state]}
                    </div>
                ))}
                <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                    <span className="inline-block w-3 h-3 rounded-sm bg-amber-400 opacity-80" />
                    ⚡ Snabb gissning
                </div>
            </div>

            <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={chartData} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.2)" />

                    {/* Coloured background segments per focus state */}
                    {segments.map((seg, i) => (
                        <ReferenceArea
                            key={i}
                            x1={seg.start}
                            x2={seg.end}
                            fill={FOCUS_BG[seg.state]}
                            fillOpacity={1}
                            strokeOpacity={0}
                        />
                    ))}

                    {/* Peak stress marker */}
                    {peakStressAt > 0 && (
                        <ReferenceLine
                            x={peakStressAt}
                            stroke="#ef4444"
                            strokeDasharray="4 3"
                            label={{
                                value: '⚑ Toppad stress',
                                position: 'top',
                                fill: '#ef4444',
                                fontSize: 10,
                            }}
                        />
                    )}

                    <XAxis
                        dataKey="x"
                        type="number"
                        domain={[0, totalSeconds]}
                        ticks={xTicks}
                        tickFormatter={s => `${Math.floor(s / 60)}m`}
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        yAxisId="rt"
                        tickFormatter={v => `${Math.round(v * maxRt / 1000)}s`}
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                        width={36}
                    />
                    <YAxis
                        yAxisId="stress"
                        orientation="right"
                        domain={[0, 1]}
                        tickFormatter={v => `${Math.round(v * 100)}%`}
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                        width={36}
                    />

                    <Tooltip content={<ConcentrationTooltip />} />

                    {/* Stress area */}
                    <Area
                        yAxisId="stress"
                        type="monotone"
                        dataKey="stress"
                        stroke="#ef4444"
                        strokeWidth={1.5}
                        fill="rgba(239,68,68,0.1)"
                        dot={false}
                        name="Stressnivå"
                    />

                    {/* Response-time area */}
                    <Area
                        yAxisId="rt"
                        type="monotone"
                        dataKey="normRt"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fill="rgba(99,102,241,0.08)"
                        dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
                        activeDot={{ r: 5 }}
                        name="Svarstid"
                    />

                    {/* Rapid-guess markers */}
                    <Scatter
                        yAxisId="rt"
                        dataKey="rapidGuess"
                        fill="#f59e0b"
                        shape={(props: any) => {
                            if (props.rapidGuess == null) return <></>;
                            return (
                                <polygon
                                    points={`${props.cx},${props.cy - 6} ${props.cx - 5},${props.cy + 4} ${props.cx + 5},${props.cy + 4}`}
                                    fill="#f59e0b"
                                />
                            );
                        }}
                    />
                </ComposedChart>
            </ResponsiveContainer>

            {/* Inline label row below chart — no split attention */}
            <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mt-1 px-9">
                <span className="text-indigo-500">— Svarstid</span>
                <span className="text-red-400">— Stressnivå</span>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: StressHeatmap
// ─────────────────────────────────────────────────────────────────────────────

interface StressHeatmapProps {
    dataPoints: BehaviouralDataPoint[];
}

function StressHeatmap({ dataPoints }: StressHeatmapProps) {
    /** Map stress 0–1 to a Tailwind-compatible rgba colour */
    function stressColor(level: number): string {
        // low → green, mid → amber, high → red
        if (level < 0.3) return `rgba(16, 185, 129, ${0.2 + level * 0.8})`;
        if (level < 0.65) return `rgba(245, 158, 11, ${0.2 + level * 0.8})`;
        return `rgba(239, 68, 68, ${0.2 + level * 0.8})`;
    }

    // Group into rows of 10 for a grid layout
    const COLS = 10;
    const rows: BehaviouralDataPoint[][] = [];
    for (let i = 0; i < dataPoints.length; i += COLS) {
        rows.push(dataPoints.slice(i, i + COLS));
    }

    return (
        <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Varje ruta = en fråga · Färg = stressnivå · Kant = snabb gissning
            </div>
            <div className="flex flex-col gap-1">
                {rows.map((row, ri) => (
                    <div key={ri} className="flex gap-1">
                        {row.map((pt, ci) => {
                            const qNum = ri * COLS + ci + 1;
                            const borderStyle = pt.isRapidGuess
                                ? '2px solid #f59e0b'
                                : pt.isCorrect
                                    ? '2px solid rgba(16,185,129,0.4)'
                                    : '2px solid rgba(239,68,68,0.4)';

                            return (
                                <div
                                    key={ci}
                                    className="relative group"
                                    title={`Fråga ${qNum}: ${Math.round(pt.stressLevel * 100)}% stress, ${formatMs(pt.responseTimeMs)}, ${pt.isCorrect ? 'rätt' : 'fel'}${pt.isRapidGuess ? ', ⚡ gissning' : ''}`}
                                >
                                    <div
                                        className="w-7 h-7 rounded-sm cursor-default transition-transform group-hover:scale-125"
                                        style={{
                                            background: stressColor(pt.stressLevel),
                                            border: borderStyle,
                                        }}
                                    />
                                    {/* Tiny question number */}
                                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white/70 pointer-events-none">
                                        {qNum}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Inline colour legend below grid */}
            <div className="flex items-center gap-3 mt-3 text-[10px] text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-sm bg-emerald-400" />
                    Låg stress
                </div>
                <div className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-sm bg-amber-400" />
                    Medel stress
                </div>
                <div className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-sm bg-red-400" />
                    Hög stress
                </div>
                <div className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-sm border-2 border-amber-500 bg-transparent" />
                    ⚡ Gissning
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: NarrativeInsightCard
// ─────────────────────────────────────────────────────────────────────────────

function NarrativeInsightCard({ insight, index }: { insight: NarrativeInsight; index: number }) {
    const cls = ACCENT_CLASSES[insight.accent];

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.35 }}
            className={`rounded-xl border p-4 ${cls.border} ${cls.bg}`}
        >
            <div className="flex items-start gap-3">
                <span className={`text-2xl leading-none mt-0.5 ${cls.icon}`}>{insight.icon}</span>
                <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm mb-1 ${cls.headline}`}>{insight.headline}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{insight.body}</p>
                    {insight.cta && (
                        <a
                            href={insight.cta.href}
                            className={`inline-block mt-2 text-xs font-medium underline underline-offset-2 ${cls.headline}`}
                        >
                            {insight.cta.label} →
                        </a>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: SessionStats (summary row)
// ─────────────────────────────────────────────────────────────────────────────

function SessionStats({ metrics }: { metrics: BehaviouralMetrics }) {
    const { summary, dataPoints, durationSeconds } = metrics;

    const stats = [
        {
            label: 'Besvarade frågor',
            value: dataPoints.length,
            sub: null,
            color: 'text-gray-800 dark:text-gray-100',
        },
        {
            label: 'Snitt svarstid',
            value: formatMs(summary.avgResponseMs),
            sub: null,
            color: 'text-indigo-600 dark:text-indigo-400',
        },
        {
            label: 'Snabba gissningar',
            value: summary.rapidGuessCount,
            sub: `${Math.round(summary.rapidGuessShare * 100)}% av svaren`,
            color: summary.rapidGuessShare > 0.2
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400',
        },
        {
            label: 'Fokus',
            value: `${Math.round(summary.focusedShare * 100)}%`,
            sub: `av ${formatSeconds(durationSeconds)}`,
            color: summary.focusedShare > 0.6
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-amber-600 dark:text-amber-400',
        },
        {
            label: 'Snitt stressnivå',
            value: `${Math.round(summary.avgStressLevel * 100)}%`,
            sub: null,
            color: summary.avgStressLevel > 0.6
                ? 'text-red-600 dark:text-red-400'
                : summary.avgStressLevel > 0.35
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400',
        },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {stats.map((s, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.3 }}
                    className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-center"
                >
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{s.label}</p>
                    {s.sub && (
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{s.sub}</p>
                    )}
                </motion.div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT: BehavioralSection
// ─────────────────────────────────────────────────────────────────────────────

interface BehavioralSectionProps {
    metrics: BehaviouralMetrics;
    /** Override narrative insights (if null, auto-generated from metrics) */
    narrativeInsights?: NarrativeInsight[];
}

export default function BehavioralSection({ metrics, narrativeInsights }: BehavioralSectionProps) {
    const insights = useMemo(
        () => narrativeInsights ?? buildNarrativeInsights(metrics),
        [metrics, narrativeInsights],
    );

    const sessionDate = metrics.sessionStart.toLocaleDateString('sv-SE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <section className="space-y-6">
            {/* Section header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Beteendemönster
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Session {sessionDate} · {formatSeconds(metrics.durationSeconds)}
                    </p>
                </div>
            </div>

            {/* Stats row */}
            <SessionStats metrics={metrics} />

            {/* Concentration timeline */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
                <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Koncentrationsgraf
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Svarstid (lila) och stressnivå (röd) per fråga · Bakgrundsfärg = fokustillstånd
                    </p>
                </div>
                <ConcentrationTimeline
                    dataPoints={metrics.dataPoints}
                    peakStressAt={metrics.summary.peakStressAt}
                />
            </div>

            {/* Stress heatmap + narrative — side by side on wider screens */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Stress heatmap */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                        Stressvärmekarta
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        Per fråga – hover för detaljer
                    </p>
                    <StressHeatmap dataPoints={metrics.dataPoints} />
                </div>

                {/* Narrative insights */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Sessionens insikter
                    </h3>
                    {insights.map((insight, i) => (
                        <NarrativeInsightCard key={i} insight={insight} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}
