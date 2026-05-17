'use client';

/**
 * Module 3 – Behavioural Patterns
 *
 * Design principles (psykologisk medvetenhet):
 *  - Glassmorphic chrome matching the rest of /analytics.
 *  - Minimal red — stress shown in amber gradients; red reserved for the peak marker.
 *  - "Sessionsrytm" framing (was "Stressvärmekarta") to lower aggression.
 *  - Session-win celebration when focus > 70%.
 *  - Gradient-text stat tiles with scale-in-bounce entrance.
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
import { Sparkles, Brain } from 'lucide-react';
import {
    BehaviouralMetrics,
    BehaviouralDataPoint,
    NarrativeInsight,
    RAPID_GUESS_THRESHOLD_MS,
    FocusState,
} from '@/types/analytics';
import MilestoneCelebration from './MilestoneCelebration';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const GLASS_CARD =
    'bg-white/55 dark:bg-zinc-950/55 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-3xl shadow-elevation-3';

const FOCUS_COLORS: Record<FocusState, string> = {
    focused: '#10b981',
    distracted: '#f59e0b',
    stressed: '#f59e0b',
};

const FOCUS_BG: Record<FocusState, string> = {
    focused: 'rgba(16, 185, 129, 0.08)',
    distracted: 'rgba(245, 158, 11, 0.08)',
    stressed: 'rgba(245, 158, 11, 0.14)',
};

const FOCUS_LABELS: Record<FocusState, string> = {
    focused: 'Fokuserad',
    distracted: 'Distraherad',
    stressed: 'Spänd',
};

const ACCENT_CLASSES: Record<NarrativeInsight['accent'], {
    border: string; bg: string; icon: string; headline: string;
}> = {
    emerald: {
        border: 'border-emerald-200/60 dark:border-emerald-700/40',
        bg: 'bg-emerald-50/60 dark:bg-emerald-950/30',
        icon: 'text-emerald-500',
        headline: 'text-emerald-700 dark:text-emerald-300',
    },
    amber: {
        border: 'border-amber-200/60 dark:border-amber-700/40',
        bg: 'bg-amber-50/60 dark:bg-amber-950/30',
        icon: 'text-amber-500',
        headline: 'text-amber-700 dark:text-amber-300',
    },
    red: {
        border: 'border-red-200/60 dark:border-red-700/40',
        bg: 'bg-red-50/60 dark:bg-red-950/30',
        icon: 'text-red-500',
        headline: 'text-red-700 dark:text-red-300',
    },
    blue: {
        border: 'border-blue-200/60 dark:border-blue-700/40',
        bg: 'bg-blue-50/60 dark:bg-blue-950/30',
        icon: 'text-blue-500',
        headline: 'text-blue-700 dark:text-blue-300',
    },
    purple: {
        border: 'border-purple-200/60 dark:border-purple-700/40',
        bg: 'bg-purple-50/60 dark:bg-purple-950/30',
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
    segments.push({
        state: current,
        start: segStart,
        end: points[points.length - 1].elapsedSeconds,
    });
    return segments;
}

export function buildNarrativeInsights(metrics: BehaviouralMetrics): NarrativeInsight[] {
    const { summary, dataPoints } = metrics;
    const insights: NarrativeInsight[] = [];

    // Rapid-guess warning — amber, not red
    if (summary.rapidGuessShare > 0.2) {
        insights.push({
            icon: '⚡',
            headline: 'Snabba svar tar över ibland',
            body: `${Math.round(summary.rapidGuessShare * 100)}% av dina svar skickades på under ${RAPID_GUESS_THRESHOLD_MS / 1000} sekunder. En lugnare takt brukar ge bättre inlärning.`,
            accent: 'amber',
            cta: { label: 'Öva metodiskt', href: '/practice' },
        });
    }

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
                body: `Du la i snitt ${avgLastFiveSec.toFixed(1)}s per fråga på de sista fem uppgifterna – ${delta.toFixed(1)}s mer än snittet (${avgSec.toFixed(1)}s). Kan vara dags för en kort paus.`,
                accent: 'amber',
            });
        } else if (delta < -5) {
            insights.push({
                icon: '🚀',
                headline: 'Du accelererar — håll koll på noggrannheten',
                body: `Svarstiden sjönk till ${avgLastFiveSec.toFixed(1)}s på de sista fem uppgifterna. Snabbt och rätt? Toppen. Annars — ta ett extra varv.`,
                accent: 'blue',
            });
        }
    }

    if (summary.avgStressLevel > 0.6) {
        insights.push({
            icon: '🌬️',
            headline: 'Lite spänt under sessionen',
            body: `Genomsnittlig spänning: ${Math.round(summary.avgStressLevel * 100)}%. Toppad vid ${formatSeconds(summary.peakStressAt)} in. Korta pauser och andningsövningar gör skillnad.`,
            accent: 'amber',
        });
    } else if (summary.avgStressLevel < 0.3 && summary.focusedShare > 0.7) {
        insights.push({
            icon: '🎯',
            headline: 'Utmärkt fokus genom hela sessionen',
            body: `Du var i fokusläge ${Math.round(summary.focusedShare * 100)}% av sessionen med låg spänning (${Math.round(summary.avgStressLevel * 100)}%). Fortsätt på samma sätt!`,
            accent: 'emerald',
        });
    }

    if (summary.distractedShare > 0.35) {
        insights.push({
            icon: '🌊',
            headline: 'Distraherad större delen av tiden',
            body: `Du var distraherad ${Math.round(summary.distractedShare * 100)}% av sessionen. Stäng av notifieringar eller byt miljö för nästa pass.`,
            accent: 'purple',
        });
    }

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
// Custom Tooltip
// ─────────────────────────────────────────────────────────────────────────────

interface RechartsTooltipPayload {
    payload: BehaviouralDataPoint & { x: number };
}

function ConcentrationTooltip({ active, payload }: { active?: boolean; payload?: RechartsTooltipPayload[] }) {
    if (!active || !payload?.length) return null;

    const data = payload[0]?.payload;
    if (!data) return null;

    const state = data.focusState;
    const stateColor = FOCUS_COLORS[state];

    return (
        <div className="bg-white/85 dark:bg-zinc-950/85 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-2xl p-3 shadow-elevation-3 text-sm max-w-[220px]">
            <p className="font-semibold mb-1" style={{ color: stateColor }}>
                {FOCUS_LABELS[state]}
            </p>
            <p className="text-zinc-600 dark:text-zinc-400 text-xs">
                Tid: {formatSeconds(data.elapsedSeconds)}
            </p>
            <p className="text-zinc-600 dark:text-zinc-400 text-xs">
                Svarstid: {formatMs(data.responseTimeMs)}
            </p>
            <p className="text-zinc-600 dark:text-zinc-400 text-xs">
                Spänning: {Math.round(data.stressLevel * 100)}%
            </p>
            {data.isRapidGuess && (
                <p className="text-amber-600 dark:text-amber-400 font-medium mt-1 text-xs">⚡ Snabb gissning</p>
            )}
            <p className={`mt-1 font-medium text-xs ${data.isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {data.isCorrect ? '✓ Rätt' : '✗ Fel'}
            </p>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Concentration Timeline
// ─────────────────────────────────────────────────────────────────────────────

function ConcentrationTimeline({
    dataPoints,
    peakStressAt,
}: {
    dataPoints: BehaviouralDataPoint[];
    peakStressAt: number;
}) {
    const segments = useMemo(() => extractSegments(dataPoints), [dataPoints]);

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
            rapidGuess: p.isRapidGuess ? p.responseTimeMs / maxRt : null,
        })),
        [dataPoints, maxRt],
    );

    const totalSeconds = dataPoints.at(-1)?.elapsedSeconds ?? 0;

    const xTicks = useMemo(() => {
        const ticks: number[] = [];
        for (let s = 0; s <= totalSeconds; s += 60) ticks.push(s);
        return ticks;
    }, [totalSeconds]);

    return (
        <div>
            <div className="flex items-center gap-4 mb-3 flex-wrap">
                {(Object.keys(FOCUS_LABELS) as FocusState[]).map(state => (
                    <div key={state} className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                        <span
                            className="inline-block w-3 h-3 rounded-sm"
                            style={{ background: FOCUS_COLORS[state] }}
                        />
                        {FOCUS_LABELS[state]}
                    </div>
                ))}
                <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                    <span className="inline-block w-3 h-3 rounded-sm bg-amber-400 opacity-80" />
                    ⚡ Snabb gissning
                </div>
            </div>

            <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={chartData} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.2)" />

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

                    {peakStressAt > 0 && (
                        <ReferenceLine
                            x={peakStressAt}
                            stroke="#ef4444"
                            strokeDasharray="4 3"
                            label={{
                                value: '⚑ Toppad spänning',
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

                    {/* Spänning area — amber, not red */}
                    <Area
                        yAxisId="stress"
                        type="monotone"
                        dataKey="stress"
                        stroke="#f59e0b"
                        strokeWidth={1.5}
                        fill="rgba(245,158,11,0.12)"
                        dot={false}
                        name="Spänning"
                    />

                    <Area
                        yAxisId="rt"
                        type="monotone"
                        dataKey="normRt"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fill="rgba(99,102,241,0.10)"
                        dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
                        activeDot={{ r: 5 }}
                        name="Svarstid"
                    />

                    <Scatter
                        yAxisId="rt"
                        dataKey="rapidGuess"
                        fill="#f59e0b"
                        shape={(props: { cx?: number; cy?: number; rapidGuess?: number | null }) => {
                            const { cx, cy, rapidGuess } = props;
                            if (rapidGuess == null || cx == null || cy == null) return <></>;
                            return (
                                <polygon
                                    points={`${cx},${cy - 6} ${cx - 5},${cy + 4} ${cx + 5},${cy + 4}`}
                                    fill="#f59e0b"
                                />
                            );
                        }}
                    />
                </ComposedChart>
            </ResponsiveContainer>

            <div className="flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 px-9">
                <span className="text-indigo-500">— Svarstid</span>
                <span className="text-amber-500">— Spänning</span>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sessionsrytm (was StressHeatmap)
// ─────────────────────────────────────────────────────────────────────────────

function Sessionsrytm({ dataPoints }: { dataPoints: BehaviouralDataPoint[] }) {
    /** Map stress 0–1 to emerald→amber gradient (no red). */
    function rhythmColor(level: number): string {
        if (level < 0.3) return `rgba(16, 185, 129, ${0.25 + level * 0.7})`;
        if (level < 0.65) return `rgba(132, 178, 80, ${0.3 + level * 0.6})`;
        return `rgba(245, 158, 11, ${0.35 + level * 0.55})`;
    }

    const COLS = 10;
    const rows: BehaviouralDataPoint[][] = [];
    for (let i = 0; i < dataPoints.length; i += COLS) {
        rows.push(dataPoints.slice(i, i + COLS));
    }

    return (
        <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                Varje ruta = en fråga · Färg = energinivå · Kant = snabb gissning
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
                                    : '2px solid rgba(245,158,11,0.4)';

                            return (
                                <motion.div
                                    key={ci}
                                    initial={{ scale: 0.6, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: (ri * COLS + ci) * 0.015, duration: 0.3 }}
                                    className="relative group"
                                    title={`Fråga ${qNum}: ${Math.round(pt.stressLevel * 100)}% energi, ${formatMs(pt.responseTimeMs)}, ${pt.isCorrect ? 'rätt' : 'fel'}${pt.isRapidGuess ? ', ⚡ gissning' : ''}`}
                                >
                                    <div
                                        className="w-7 h-7 rounded-lg cursor-default transition-transform group-hover:scale-125"
                                        style={{
                                            background: rhythmColor(pt.stressLevel),
                                            border: borderStyle,
                                        }}
                                    />
                                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white/70 pointer-events-none">
                                        {qNum}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-3 mt-3 text-[10px] text-zinc-500 dark:text-zinc-400">
                <div className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-sm bg-emerald-400" />
                    Lugn
                </div>
                <div className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-sm bg-lime-500" />
                    I farten
                </div>
                <div className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-sm bg-amber-400" />
                    Spänd
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
// Narrative Insight Card
// ─────────────────────────────────────────────────────────────────────────────

function NarrativeInsightCard({ insight, index }: { insight: NarrativeInsight; index: number }) {
    const cls = ACCENT_CLASSES[insight.accent];

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={`rounded-2xl border backdrop-blur-xl p-4 ${cls.border} ${cls.bg}`}
        >
            <div className="flex items-start gap-3">
                <span className={`text-2xl leading-none mt-0.5 ${cls.icon}`}>{insight.icon}</span>
                <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm mb-1 ${cls.headline}`}>{insight.headline}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">{insight.body}</p>
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
// SessionStats — glassmorphic tiles with gradient text
// ─────────────────────────────────────────────────────────────────────────────

function SessionStats({ metrics }: { metrics: BehaviouralMetrics }) {
    const { summary, dataPoints, durationSeconds } = metrics;

    const stats: Array<{ label: string; value: string | number; sub: string | null; tone: 'primary' | 'success' | 'amber' }> = [
        {
            label: 'Besvarade frågor',
            value: dataPoints.length,
            sub: null,
            tone: 'primary',
        },
        {
            label: 'Snitt svarstid',
            value: formatMs(summary.avgResponseMs),
            sub: null,
            tone: 'primary',
        },
        {
            label: 'Snabba gissningar',
            value: summary.rapidGuessCount,
            sub: `${Math.round(summary.rapidGuessShare * 100)}% av svaren`,
            tone: summary.rapidGuessShare > 0.2 ? 'amber' : 'success',
        },
        {
            label: 'Fokus',
            value: `${Math.round(summary.focusedShare * 100)}%`,
            sub: `av ${formatSeconds(durationSeconds)}`,
            tone: summary.focusedShare > 0.6 ? 'success' : 'amber',
        },
        {
            label: 'Energinivå',
            value: `${Math.round(summary.avgStressLevel * 100)}%`,
            sub: null,
            tone: summary.avgStressLevel > 0.6 ? 'amber' : 'success',
        },
    ];

    const toneClasses: Record<'primary' | 'success' | 'amber', string> = {
        primary: 'from-primary-600 to-accent-600 dark:from-primary-300 dark:to-accent-300',
        success: 'from-emerald-500 to-teal-500 dark:from-emerald-300 dark:to-teal-300',
        amber: 'from-amber-500 to-orange-500 dark:from-amber-300 dark:to-orange-300',
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {stats.map((s, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.85, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: i * 0.07, type: 'spring', damping: 18, stiffness: 240 }}
                    className="bg-white/55 dark:bg-zinc-950/55 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-2xl p-3 text-center shadow-elevation-2"
                >
                    <p className={`text-2xl font-bold tabular-nums bg-clip-text text-transparent bg-gradient-to-br ${toneClasses[s.tone]}`}>
                        {s.value}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-tight">{s.label}</p>
                    {s.sub && (
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">{s.sub}</p>
                    )}
                </motion.div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Session-win celebration card
// ─────────────────────────────────────────────────────────────────────────────

function SessionWinCard({ focusedShare }: { focusedShare: number }) {
    const pct = Math.round(focusedShare * 100);
    return (
        <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-3xl border border-emerald-200/60 dark:border-emerald-700/40 backdrop-blur-2xl bg-gradient-to-br from-emerald-500/15 via-primary-500/8 to-emerald-500/15 p-5 md:p-6 shadow-elevation-3"
        >
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
            <div className="relative flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-elevation-2 animate-glow-pulse">
                    <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-emerald-700 dark:text-emerald-300">
                        Stark session
                    </div>
                    <h4 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white leading-tight mt-0.5">
                        {pct}% i fokus — bra jobbat!
                    </h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                        Du höll koncentrationen igenom större delen av sessionen. Notera vad som funkade — det här är ditt mönster.
                    </p>
                </div>
            </div>
            <MilestoneCelebration trigger={true} />
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

interface BehavioralSectionProps {
    metrics: BehaviouralMetrics;
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

    const isStrongSession = metrics.summary.focusedShare > 0.7;

    return (
        <section className="space-y-6">
            {/* Section header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-elevation-2">
                    <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                        Hur du arbetar
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Session {sessionDate} · {formatSeconds(metrics.durationSeconds)}
                    </p>
                </div>
            </div>

            {isStrongSession && <SessionWinCard focusedShare={metrics.summary.focusedShare} />}

            <SessionStats metrics={metrics} />

            {/* Concentration timeline */}
            <div className={`${GLASS_CARD} p-6`}>
                <div className="mb-4">
                    <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                        Koncentrationsgraf
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Svarstid (lila) och spänning (amber) per fråga · Bakgrund = fokustillstånd
                    </p>
                </div>
                <ConcentrationTimeline
                    dataPoints={metrics.dataPoints}
                    peakStressAt={metrics.summary.peakStressAt}
                />
            </div>

            {/* Sessionsrytm + narrative */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className={`${GLASS_CARD} p-6`}>
                    <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                        Sessionsrytm
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                        Per fråga — håll musen över för detaljer
                    </p>
                    <Sessionsrytm dataPoints={metrics.dataPoints} />
                </div>

                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider px-1">
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
