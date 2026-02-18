'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useState } from 'react';

interface TopicBreakdown {
    topicId: string;
    topicName: string;
    mastery: number;
    trend: 'improving' | 'stable' | 'declining';
    recentAccuracy: number;
    lastPracticed: Date | null;
    needsReview: boolean;
}

interface ExamReadinessBarProps {
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

const C = {
    text: '#1A1D2E',
    textMuted: '#A0A5C0',
    border: '#EFF1F8',
};

function getReadinessColor(readiness: number): string {
    if (readiness >= 80) return '#10B981';
    if (readiness >= 60) return '#3B82F6';
    if (readiness >= 40) return '#F59E0B';
    return '#EF4444';
}

function getReadinessGradient(readiness: number): string {
    if (readiness >= 80) return 'linear-gradient(135deg, #10B981, #059669)';
    if (readiness >= 60) return 'linear-gradient(135deg, #3B82F6, #2563EB)';
    if (readiness >= 40) return 'linear-gradient(135deg, #F59E0B, #D97706)';
    return 'linear-gradient(135deg, #EF4444, #DC2626)';
}

function getReadinessLabel(readiness: number): string {
    if (readiness >= 80) return 'Ready';
    if (readiness >= 60) return 'On Track';
    if (readiness >= 40) return 'Needs Work';
    return 'At Risk';
}

function TrendIcon({ trend }: { trend: 'improving' | 'stable' | 'declining' }) {
    if (trend === 'improving') return <TrendingUp className="w-3.5 h-3.5 text-green-500" />;
    if (trend === 'declining') return <TrendingDown className="w-3.5 h-3.5 text-red-500" />;
    return <Minus className="w-3.5 h-3.5 text-zinc-400" />;
}

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
    const color = getReadinessColor(overallReadiness);
    const gradient = getReadinessGradient(overallReadiness);
    const label = getReadinessLabel(overallReadiness);
    const reviewTopics = topicBreakdown.filter(t => t.needsReview);

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
            {/* Header */}
            <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span
                                className="text-xs font-bold px-2.5 py-1 rounded-md text-white"
                                style={{ background: gradient }}
                            >
                                {courseCode}
                            </span>
                            <h3 className="text-base font-semibold" style={{ color: C.text }}>
                                {courseName}
                            </h3>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-2">
                            <span
                                className="text-3xl font-bold"
                                style={{ color }}
                            >
                                {overallReadiness}%
                            </span>
                            <div
                                className="text-xs font-semibold px-2 py-1 rounded-full"
                                style={{
                                    color,
                                    background: `${color}15`,
                                }}
                            >
                                {label}
                            </div>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>
                            Est. Grade: <strong style={{ color: C.text }}>{estimatedGrade}</strong>
                        </p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="h-3 rounded-full overflow-hidden" style={{ background: '#EFF1F8' }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${overallReadiness}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: gradient }}
                    />
                </div>

                {/* Quick stats */}
                <div className="flex items-center gap-6 mt-3">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: C.textMuted }}>
                        <Clock className="w-3.5 h-3.5" />
                        {studyTimeThisWeek}min this week
                    </div>
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: C.textMuted }}>
                        <CheckCircle className="w-3.5 h-3.5" />
                        {questionsThisWeek} questions
                    </div>
                    {reviewTopics.length > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-amber-600">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {reviewTopics.length} need review
                        </div>
                    )}
                </div>

                {/* Expand toggle */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-1 text-xs mt-3 hover:opacity-80 transition-opacity"
                    style={{ color: '#4361EE' }}
                >
                    {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {expanded ? 'Hide' : 'Show'} topic breakdown
                </button>
            </div>

            {/* Expanded topic breakdown */}
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
                            {/* Weakest / strongest summary */}
                            <div className="grid grid-cols-2 gap-4 py-4">
                                <div>
                                    <p className="text-xs font-semibold mb-2 text-red-500">Weakest Topics</p>
                                    {weakestTopics.map((t, i) => (
                                        <p key={i} className="text-xs py-0.5" style={{ color: C.text }}>
                                            • {t}
                                        </p>
                                    ))}
                                </div>
                                <div>
                                    <p className="text-xs font-semibold mb-2 text-green-500">Strongest Topics</p>
                                    {strongestTopics.map((t, i) => (
                                        <p key={i} className="text-xs py-0.5" style={{ color: C.text }}>
                                            • {t}
                                        </p>
                                    ))}
                                </div>
                            </div>

                            {/* All topics */}
                            <div className="space-y-2">
                                {topicBreakdown.slice(0, 10).map(topic => (
                                    <div
                                        key={topic.topicId}
                                        className="flex items-center gap-3 py-2 px-3 rounded-lg"
                                        style={{
                                            background: topic.needsReview ? '#FEF3C7' : '#F8FAFC',
                                        }}
                                    >
                                        <TrendIcon trend={topic.trend} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium truncate" style={{ color: C.text }}>
                                                {topic.topicName}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: '#EFF1F8' }}>
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
