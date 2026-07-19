'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useState } from 'react';

// ─── Types (re-exported so callers can import from here) ─────────────────────

export interface TopicBreakdown {
    topicId: string;
    topicName: string;
    mastery: number;
    trend: 'improving' | 'stable' | 'declining';
    recentAccuracy: number;
    lastPracticed: Date | null;
    needsReview: boolean;
}

export interface ExamReadinessBarProps {
    courseName: string;
    courseCode: string;
    overallReadiness: number;
    estimatedGrade: string;
    weakestTopics: string[];
    strongestTopics: string[];
    topicBreakdown: TopicBreakdown[];
    studyTimeThisWeek: number;
    questionsThisWeek: number;
}

// ─── Stage definitions ────────────────────────────────────────────────────────

const STAGES = [
    { label: 'Grund', min: 0 },
    { label: 'God', min: 35 },
    { label: 'Stabil', min: 60 },
    { label: 'Redo', min: 80 },
];

function getStageIndex(readiness: number): number {
    for (let i = STAGES.length - 1; i >= 0; i--) {
        if (readiness >= STAGES[i].min) return i;
    }
    return 0;
}

function getReadinessColor(readiness: number): string {
    if (readiness >= 80) return 'var(--accent-500)';
    if (readiness >= 60) return '#667b45';
    if (readiness >= 35) return '#c27838';
    return '#c65d4b';
}

// ─── Circular ring ────────────────────────────────────────────────────────────

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function CircularReadiness({ readiness }: { readiness: number }) {
    const color = getReadinessColor(readiness);
    const stageIdx = getStageIndex(readiness);
    const stageName = STAGES[stageIdx].label;
    const progress = (readiness / 100) * CIRCUMFERENCE;

    return (
        <div className="relative flex-shrink-0" style={{ width: 140, height: 140 }}>
            <svg width={140} height={140} style={{ transform: 'rotate(-90deg)' }}>
                {/* Track */}
                <circle
                    cx={70} cy={70} r={RADIUS}
                    fill="none" strokeWidth={10}
                    className="stroke-black/10 dark:stroke-white/10"
                />
                {/* Progress */}
                <motion.circle
                    cx={70} cy={70} r={RADIUS}
                    fill="none"
                    stroke={color}
                    strokeWidth={10}
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    initial={{ strokeDashoffset: CIRCUMFERENCE }}
                    animate={{ strokeDashoffset: CIRCUMFERENCE - progress }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-3xl font-extrabold leading-none"
                    style={{ color }}
                >
                    {readiness}%
                </motion.div>
                <div className="dashboard-muted mt-1 text-xs font-semibold">
                    {stageName}
                </div>
            </div>
        </div>
    );
}

// ─── Stage progress dots ──────────────────────────────────────────────────────

function StageIndicator({ readiness }: { readiness: number }) {
    const activeIdx = getStageIndex(readiness);
    const color = getReadinessColor(readiness);

    return (
        <div className="flex items-center gap-1 mt-3">
            {STAGES.map((stage, i) => {
                const isActive = i <= activeIdx;
                return (
                    <div key={stage.label} className="flex items-center gap-1 flex-1">
                        <div className="flex flex-col items-center gap-1 flex-1">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="h-3 w-3 rounded-full border-2 border-teal-950/10 bg-teal-950/10 transition-colors duration-500 dark:border-white/10 dark:bg-white/10"
                                style={{
                                    background: isActive ? color : undefined,
                                    borderColor: isActive ? color : undefined,
                                }}
                            />
                            <span
                                className="text-[9px] font-medium whitespace-nowrap dashboard-subtle"
                                style={{ color: isActive ? color : undefined }}
                            >
                                {stage.label}
                            </span>
                        </div>
                        {i < STAGES.length - 1 && (
                            <div
                                className="h-0.5 flex-1 mb-3 rounded-full bg-teal-950/10 transition-colors duration-500 dark:bg-white/10"
                                style={{ background: i < activeIdx ? color : undefined }}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Trend icon ───────────────────────────────────────────────────────────────

function TrendIcon({ trend }: { trend: 'improving' | 'stable' | 'declining' }) {
    if (trend === 'improving') return <TrendingUp className="w-3.5 h-3.5 text-green-500" />;
    if (trend === 'declining') return <TrendingDown className="w-3.5 h-3.5 text-yellow-500" />;
    return <Minus className="w-3.5 h-3.5 text-zinc-400" />;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ExamReadinessBar({
    courseName,
    courseCode,
    overallReadiness,
    estimatedGrade,
    topicBreakdown,
    studyTimeThisWeek,
    questionsThisWeek,
}: ExamReadinessBarProps) {
    const [expanded, setExpanded] = useState(false);
    const reviewTopics = topicBreakdown.filter(t => t.needsReview);
    const color = getReadinessColor(overallReadiness);

    // Estimated pass probability (simple heuristic, can be replaced by AI)
    const passProbability = Math.min(99, Math.round(overallReadiness * 0.95 + 5));

    return (
        <motion.div
            layout
            className="dashboard-card dashboard-panel dashboard-panel-readiness overflow-hidden"
        >
            {/* ── Header ── */}
            <div className="p-5">
                <div className="flex flex-col gap-5 md:flex-row md:items-start">
                    {/* Circular readiness ring */}
                    <div className="flex flex-col items-center">
                        <CircularReadiness readiness={overallReadiness} />
                        <StageIndicator readiness={overallReadiness} />
                    </div>

                    {/* Right info */}
                    <div className="flex-1 min-w-0">
                        {/* Course badge + name */}
                        <div className="flex items-center gap-2 mb-3">
                            <span
                                className="rounded-md bg-black/[0.055] px-2.5 py-1 text-xs font-bold text-[var(--foreground)] dark:bg-white/10"
                            >
                                {courseCode}
                            </span>
                            <h3 className="truncate text-base font-semibold text-slate-950 dark:text-white">
                                {courseName}
                            </h3>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-1 gap-3 mb-3 sm:grid-cols-3">
                            <div className="dashboard-card-soft p-3 text-center">
                                <div className="dashboard-muted mb-1 text-xs">Beräknat betyg</div>
                                <div className="text-lg font-extrabold text-slate-950 dark:text-white">{estimatedGrade}</div>
                            </div>
                            <div className="dashboard-card-soft p-3 text-center">
                                <div className="dashboard-muted mb-1 text-xs">Sannolikhet att klara</div>
                                <div className="font-extrabold text-lg" style={{ color }}>{passProbability}%</div>
                            </div>
                            <div className="dashboard-card-soft p-3 text-center">
                                <div className="dashboard-muted mb-1 text-xs">Denna vecka</div>
                                <div className="text-lg font-extrabold text-slate-950 dark:text-white">{questionsThisWeek} frågor</div>
                            </div>
                        </div>

                        {/* Quick footer stats */}
                        <div className="dashboard-muted flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {studyTimeThisWeek} min denna vecka
                            </div>
                            {reviewTopics.length > 0 && (
                                <div className="flex items-center gap-1 text-amber-700 dark:text-amber-300">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    {reviewTopics.length} behöver repeteras
                                </div>
                            )}
                            {reviewTopics.length === 0 && (
                                <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Allt i fas
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Expand toggle */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="mt-3 flex min-h-10 items-center gap-1 rounded-full px-2 text-xs font-semibold text-[var(--accent-500)] transition-opacity hover:opacity-80 active:scale-[0.96]"
                >
                    {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {expanded ? 'Dölj detaljer' : 'Visa ämnesöversikt'}
                </button>
            </div>

            {/* ── Expanded topic breakdown ── */}
            <AnimatePresence initial={false}>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-black/10 px-5 pb-5 dark:border-white/10">
                            {/* Topic list */}
                            <div className="space-y-2">
                                {topicBreakdown.slice(0, 10).map(topic => (
                                    <div
                                        key={topic.topicId}
                                        className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${topic.needsReview
                                            ? 'border-amber-300/70 bg-amber-100/70 dark:border-amber-200/20 dark:bg-amber-300/10'
                                            : 'border-black/10 bg-white/45 dark:border-white/10 dark:bg-white/[0.04]'
                                            }`}
                                    >
                                        <TrendIcon trend={topic.trend} />
                                        <div className="flex-1 min-w-0">
                                            <p className="truncate text-xs font-medium text-slate-950 dark:text-white">
                                                {topic.topicName}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                                                <div
                                                    className="h-full origin-left rounded-full transition-transform duration-500 ease-out"
                                                    style={{
                                                        transform: `scaleX(${topic.mastery})`,
                                                        background: getReadinessColor(topic.mastery * 100),
                                                    }}
                                                />
                                            </div>
                                            <span className="dashboard-muted w-10 text-right font-mono text-xs">
                                                {Math.round(topic.mastery * 100)}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
