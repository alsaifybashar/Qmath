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

// ─── Palette ─────────────────────────────────────────────────────────────────

const C = {
    text: '#1A1D2E',
    textMuted: '#A0A5C0',
    border: '#EFF1F8',
};

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
    if (readiness >= 80) return '#22C55E';
    if (readiness >= 60) return '#3B82F6';
    if (readiness >= 35) return '#EAB308';
    return '#94A3B8'; // subdued, not alarming red
}

function getReadinessGradient(readiness: number): string {
    if (readiness >= 80) return 'linear-gradient(135deg, #22C55E, #16A34A)';
    if (readiness >= 60) return 'linear-gradient(135deg, #3B82F6, #2563EB)';
    if (readiness >= 35) return 'linear-gradient(135deg, #EAB308, #CA8A04)';
    return 'linear-gradient(135deg, #94A3B8, #64748B)';
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
                    fill="none" stroke={C.border} strokeWidth={10}
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
                <div className="text-xs font-semibold mt-1" style={{ color: C.textMuted }}>
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
                                className="w-3 h-3 rounded-full border-2 transition-colors duration-500"
                                style={{
                                    background: isActive ? color : C.border,
                                    borderColor: isActive ? color : C.border,
                                }}
                            />
                            <span className="text-[9px] font-medium whitespace-nowrap" style={{ color: isActive ? color : C.textMuted }}>
                                {stage.label}
                            </span>
                        </div>
                        {i < STAGES.length - 1 && (
                            <div
                                className="h-0.5 flex-1 mb-3 rounded-full transition-colors duration-500"
                                style={{ background: i < activeIdx ? color : C.border }}
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
    weakestTopics,
    strongestTopics,
    topicBreakdown,
    studyTimeThisWeek,
    questionsThisWeek,
}: ExamReadinessBarProps) {
    const [expanded, setExpanded] = useState(false);
    const gradient = getReadinessGradient(overallReadiness);
    const reviewTopics = topicBreakdown.filter(t => t.needsReview);
    const color = getReadinessColor(overallReadiness);

    // Estimated pass probability (simple heuristic, can be replaced by AI)
    const passProbability = Math.min(99, Math.round(overallReadiness * 0.95 + 5));

    return (
        <motion.div
            layout
            className="rounded-2xl overflow-hidden"
            style={{
                background: 'white',
                border: `1px solid ${C.border}`,
                boxShadow: '0 2px 12px rgba(26,29,46,0.06)',
            }}
        >
            {/* ── Header ── */}
            <div className="p-5">
                <div className="flex items-start gap-5">
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
                                className="text-xs font-bold px-2.5 py-1 rounded-md text-white"
                                style={{ background: gradient }}
                            >
                                {courseCode}
                            </span>
                            <h3 className="text-base font-semibold truncate" style={{ color: C.text }}>
                                {courseName}
                            </h3>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-3 mb-3">
                            <div
                                className="rounded-xl p-3 text-center"
                                style={{ background: '#F7F8FC' }}
                            >
                                <div className="text-xs mb-1" style={{ color: C.textMuted }}>Beräknat betyg</div>
                                <div className="font-extrabold text-lg" style={{ color: C.text }}>{estimatedGrade}</div>
                            </div>
                            <div
                                className="rounded-xl p-3 text-center"
                                style={{ background: '#F7F8FC' }}
                            >
                                <div className="text-xs mb-1" style={{ color: C.textMuted }}>Sannolikhet att klara</div>
                                <div className="font-extrabold text-lg" style={{ color }}>{passProbability}%</div>
                            </div>
                            <div
                                className="rounded-xl p-3 text-center"
                                style={{ background: '#F7F8FC' }}
                            >
                                <div className="text-xs mb-1" style={{ color: C.textMuted }}>Denna vecka</div>
                                <div className="font-extrabold text-lg" style={{ color: C.text }}>{questionsThisWeek} frågor</div>
                            </div>
                        </div>

                        {/* Quick footer stats */}
                        <div className="flex items-center gap-4 text-xs" style={{ color: C.textMuted }}>
                            <div className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {studyTimeThisWeek} min denna vecka
                            </div>
                            {reviewTopics.length > 0 && (
                                <div className="flex items-center gap-1 text-amber-600">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    {reviewTopics.length} behöver repeteras
                                </div>
                            )}
                            {reviewTopics.length === 0 && (
                                <div className="flex items-center gap-1 text-green-600">
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
                    className="flex items-center gap-1 text-xs mt-3 hover:opacity-80 transition-opacity"
                    style={{ color: '#4361EE' }}
                >
                    {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {expanded ? 'Dölj detaljer' : 'Visa ämnesöversikt'}
                </button>
            </div>

            {/* ── Expanded topic breakdown ── */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 border-t" style={{ borderColor: C.border }}>
                            {/* Topic list */}
                            <div className="space-y-2">
                                {topicBreakdown.slice(0, 10).map(topic => (
                                    <div
                                        key={topic.topicId}
                                        className="flex items-center gap-3 py-2 px-3 rounded-lg"
                                        style={{
                                            background: topic.needsReview ? '#FEFCE8' : '#F8FAFC',
                                            border: topic.needsReview ? '1px solid #FDE68A' : '1px solid transparent',
                                        }}
                                    >
                                        <TrendIcon trend={topic.trend} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium truncate" style={{ color: C.text }}>
                                                {topic.topicName}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: C.border }}>
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{
                                                        width: `${topic.mastery * 100}%`,
                                                        background: getReadinessColor(topic.mastery * 100),
                                                    }}
                                                />
                                            </div>
                                            <span className="text-xs font-mono w-10 text-right" style={{ color: C.textMuted }}>
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
