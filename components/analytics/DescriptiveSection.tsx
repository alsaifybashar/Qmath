'use client';

/**
 * Module 1 – Descriptive Analytics
 *
 * Design principle (undvik delad uppmärksamhet):
 *  - All labels, reference lines and legends are rendered INSIDE the charts.
 *  - No external legends that force the eye to jump.
 *  - Course target / own goal appear as inline reference marks.
 */

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, TrendingUp, BookOpen, LayoutGrid, Radar } from 'lucide-react';
import {
    RadarChart, PolarGrid, PolarAngleAxis, Radar as RechartsRadar,
    ResponsiveContainer, Tooltip,
} from 'recharts';
import type { StudentProgress, ModuleProgress } from '@/types/analytics';
import { accuracyColor, MASTERY_LABELS } from '@/types/analytics';

// ─────────────────────────────────────────────────────────────────────────────
// SECTION CONTAINER
// ─────────────────────────────────────────────────────────────────────────────

interface DescriptiveSectionProps {
    topics: StudentProgress[];
    modules: ModuleProgress[];
}

export default function DescriptiveSection({ topics, modules }: DescriptiveSectionProps) {
    const [activeView, setActiveView] = useState<'heatmap' | 'radar'>('heatmap');

    return (
        <section className="space-y-6">
            {/* Section header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                            Nuläge & Utveckling
                        </h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Spårning mot kursmål och progression över tid
                        </p>
                    </div>
                </div>

                {/* View toggle */}
                <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-medium">
                    <button
                        onClick={() => setActiveView('heatmap')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${activeView === 'heatmap'
                            ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                        <LayoutGrid className="w-3.5 h-3.5" /> Värmekarta
                    </button>
                    <button
                        onClick={() => setActiveView('radar')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${activeView === 'radar'
                            ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                        <Radar className="w-3.5 h-3.5" /> Radar
                    </button>
                </div>
            </div>

            {/* Main charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                {/* Left: Heatmap or Radar (3 cols) */}
                <div className="lg:col-span-3">
                    <AnimatePresence mode="wait">
                        {activeView === 'heatmap' ? (
                            <motion.div
                                key="heatmap"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <SubjectHeatmap topics={topics} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="radar"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ComparisonRadar topics={topics.slice(0, 7)} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right: Module progress bars (2 cols) */}
                <div className="lg:col-span-2">
                    <ModuleProgressPanel modules={modules} />
                </div>
            </div>
        </section>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBJECT HEATMAP
// ─────────────────────────────────────────────────────────────────────────────
// Grid: rows = topics, cols = last 7 days.
// Reference mark: a small target icon at the column where the student
// first hit the required mastery level — no external legend needed.

const DAYS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

const COLOR_MAP: Record<string, string> = {
    emerald: 'bg-emerald-500 dark:bg-emerald-400',
    amber:   'bg-amber-400 dark:bg-amber-400',
    orange:  'bg-orange-500 dark:bg-orange-400',
    red:     'bg-red-500 dark:bg-red-400',
    null:    'bg-zinc-100 dark:bg-zinc-800',
};

const OPACITY_MAP: Record<string, string> = {
    emerald: 'opacity-100',
    amber:   'opacity-90',
    orange:  'opacity-80',
    red:     'opacity-70',
    null:    'opacity-40',
};

function SubjectHeatmap({ topics }: { topics: StudentProgress[] }) {
    const [hovered, setHovered] = useState<{ topicIdx: number; dayIdx: number } | null>(null);

    // Group topics by subject
    const grouped = useMemo(() => {
        const map: Record<string, StudentProgress[]> = {};
        topics.forEach(t => {
            if (!map[t.subject]) map[t.subject] = [];
            map[t.subject].push(t);
        });
        return Object.entries(map);
    }, [topics]);

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Prestation per ämnesområde
                </h3>
                {/* Inline legend — embedded, not external */}
                <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                    <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-500" /> Svag
                    <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-400" /> OK
                    <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Stark
                    <span className="inline-block w-2.5 h-2.5 rounded-sm bg-zinc-200 dark:bg-zinc-700" /> Ingen data
                </div>
            </div>

            {/* Day headers */}
            <div className="flex mb-2 pl-[120px] gap-1">
                {DAYS.map(d => (
                    <div key={d} className="flex-1 text-center text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                        {d}
                    </div>
                ))}
            </div>

            {/* Rows */}
            <div className="space-y-4">
                {grouped.map(([subject, subjectTopics]) => (
                    <div key={subject}>
                        {/* Subject group label */}
                        <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">
                            {subject}
                        </p>
                        <div className="space-y-1">
                            {subjectTopics.map((topic, tIdx) => {
                                const globalIdx = topics.indexOf(topic);
                                return (
                                    <div key={topic.topicId} className="flex items-center gap-1">
                                        {/* Topic label — integrated, truncated */}
                                        <div className="w-[115px] shrink-0 text-right pr-2">
                                            <span className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate block">
                                                {topic.topicName}
                                            </span>
                                        </div>

                                        {/* 7-day cells */}
                                        {topic.weeklyAccuracy.map((acc, dayIdx) => {
                                            const color = acc !== null ? accuracyColor(acc) : 'null';
                                            const isHov = hovered?.topicIdx === globalIdx && hovered?.dayIdx === dayIdx;
                                            // Did this topic first hit target on this day? (simple heuristic)
                                            const hitTarget = acc !== null && acc >= topic.targetMastery / 5;

                                            return (
                                                <div key={dayIdx} className="relative flex-1">
                                                    <div
                                                        className={`h-5 rounded-sm cursor-default transition-all duration-150 ${COLOR_MAP[color]} ${OPACITY_MAP[color]} ${isHov ? 'ring-2 ring-zinc-400 dark:ring-zinc-500 scale-110' : ''}`}
                                                        onMouseEnter={() => setHovered({ topicIdx: globalIdx, dayIdx })}
                                                        onMouseLeave={() => setHovered(null)}
                                                    />
                                                    {/* Inline target marker — no external legend */}
                                                    {hitTarget && (
                                                        <div className="absolute -top-1 -right-1 pointer-events-none">
                                                            <Target className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {/* Inline target label */}
                                        <div className="w-8 shrink-0 text-right">
                                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                                                {Math.round(topic.accuracy * 100)}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Hover tooltip — embedded in component */}
            <AnimatePresence>
                {hovered && (() => {
                    const t = topics[hovered.topicIdx];
                    const acc = t.weeklyAccuracy[hovered.dayIdx];
                    return (
                        <motion.div
                            key="tooltip"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mt-3 p-3 bg-zinc-900 dark:bg-zinc-700 text-white rounded-xl text-xs"
                        >
                            <strong>{t.topicName}</strong> — {DAYS[hovered.dayIdx]}:&nbsp;
                            {acc !== null ? `${Math.round(acc * 100)}% träffsäkerhet` : 'Ingen aktivitet'}
                            {' '}· Kurskrav: {Math.round(t.targetMastery / 5 * 100)}%
                        </motion.div>
                    );
                })()}
            </AnimatePresence>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPARISON RADAR
// ─────────────────────────────────────────────────────────────────────────────
// Two polygons: student vs class average.
// Labels are rendered directly on the axis — no external legend.

interface RadarDatum {
    subject: string;
    student: number;
    classAvg: number;
    target: number;
}

function ComparisonRadar({ topics }: { topics: StudentProgress[] }) {
    const data: RadarDatum[] = topics.map(t => ({
        subject: t.topicName.length > 12 ? t.topicName.slice(0, 11) + '…' : t.topicName,
        student:  Math.round((t.masteryLevel / 5) * 100),
        classAvg: Math.round((t.classAvgMastery / 5) * 100),
        target:   Math.round((t.targetMastery / 5) * 100),
    }));

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 h-full">
            <div className="flex items-start justify-between mb-3">
                <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Individ vs Klass
                </h3>
                {/* Inline legend — embedded directly here, not external */}
                <div className="flex flex-col gap-1 text-[10px]">
                    <div className="flex items-center gap-1.5">
                        <span className="w-5 h-0.5 bg-blue-500 rounded" />
                        <span className="text-zinc-500 dark:text-zinc-400">Du</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-5 h-0.5 bg-amber-400 rounded border-dashed" style={{ borderStyle: 'dashed', borderWidth: '0 0 2px', background: 'none' }} />
                        <span className="text-zinc-500 dark:text-zinc-400">Klassens snitt</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-5 h-0.5 bg-emerald-500 rounded" style={{ opacity: 0.5 }} />
                        <span className="text-zinc-500 dark:text-zinc-400">Kurskrav</span>
                    </div>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid
                        stroke="currentColor"
                        className="text-zinc-200 dark:text-zinc-700"
                        strokeWidth={0.5}
                    />
                    {/* Axis labels integrated directly into chart */}
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fontSize: 10, fill: 'currentColor' }}
                        className="text-zinc-600 dark:text-zinc-400"
                    />

                    {/* Course target — filled green area as reference frame */}
                    <RechartsRadar
                        name="Kurskrav"
                        dataKey="target"
                        stroke="rgba(16,185,129,0.6)"
                        fill="rgba(16,185,129,0.08)"
                        strokeWidth={1.5}
                        strokeDasharray="4 3"
                    />

                    {/* Class average */}
                    <RechartsRadar
                        name="Klassens snitt"
                        dataKey="classAvg"
                        stroke="rgba(251,191,36,0.9)"
                        fill="rgba(251,191,36,0.1)"
                        strokeWidth={2}
                        strokeDasharray="6 2"
                    />

                    {/* Student — bold, on top */}
                    <RechartsRadar
                        name="Du"
                        dataKey="student"
                        stroke="rgba(59,130,246,0.95)"
                        fill="rgba(59,130,246,0.18)"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: 'rgb(59,130,246)', strokeWidth: 0 }}
                    />

                    <Tooltip
                        formatter={(v: number, name: string) => [`${v}%`, name]}
                        contentStyle={{
                            borderRadius: 10,
                            border: 'none',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                            fontSize: 11,
                        }}
                    />
                </RadarChart>
            </ResponsiveContainer>

            {/* Inline insight sentence — no external legend */}
            {topics.length > 0 && (() => {
                const weakest = [...topics].sort((a, b) => a.masteryLevel - b.masteryLevel)[0];
                const aboveClass = topics.filter(t => t.masteryLevel > t.classAvgMastery).length;
                return (
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 text-center mt-1 leading-relaxed">
                        Du presterar över klassnittet i{' '}
                        <strong className="text-zinc-700 dark:text-zinc-300">{aboveClass} av {topics.length}</strong>{' '}
                        ämnen.{' '}
                        <span className="text-red-500 dark:text-red-400">{weakest.topicName}</span>{' '}
                        är det område som har störst potential.
                    </p>
                );
            })()}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE PROGRESS BARS
// ─────────────────────────────────────────────────────────────────────────────
// Each bar contains an inline reference tick for the required threshold.
// No external legend needed.

function ModuleProgressPanel({ modules }: { modules: ModuleProgress[] }) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 h-full">
            <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Modulförlopp
                </h3>
            </div>

            <div className="space-y-5">
                {modules.map((mod, i) => {
                    const isAboveTarget = mod.progress >= mod.required;
                    const barColor = isAboveTarget
                        ? 'bg-emerald-500'
                        : mod.progress >= mod.required * 0.75
                            ? 'bg-amber-400'
                            : 'bg-red-500';

                    return (
                        <motion.div
                            key={mod.moduleId}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.07 }}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[160px]">
                                    {mod.moduleName}
                                </span>
                                <span className={`text-[11px] font-bold tabular-nums ${isAboveTarget ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                    {mod.progress}%
                                </span>
                            </div>

                            {/* Progress track with inline reference tick */}
                            <div className="relative h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-visible">
                                {/* Filled bar */}
                                <motion.div
                                    className={`h-full rounded-full ${barColor}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(mod.progress, 100)}%` }}
                                    transition={{ duration: 0.8, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                                />
                                {/* Inline required-threshold marker — no external legend */}
                                <div
                                    className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
                                    style={{ left: `${mod.required}%` }}
                                >
                                    <div className="w-0.5 h-4 bg-blue-600 dark:bg-blue-400 rounded-full" />
                                </div>
                            </div>

                            {/* Sub-line: questions + required label integrated */}
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                                    {mod.questionsAttempted}/{mod.questionsTotal} uppgifter
                                </span>
                                <span className="text-[10px] text-blue-500 dark:text-blue-400">
                                    Krav: {mod.required}%
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Summary at bottom — integrated insight, no chart-jump */}
            {modules.length > 0 && (() => {
                const below = modules.filter(m => m.progress < m.required).length;
                return (
                    <div className={`mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 p-3 rounded-xl text-[11px] leading-relaxed ${below === 0
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'}`}
                    >
                        {below === 0
                            ? '✓ Du uppfyller kurskraven för alla moduler!'
                            : `${below} modul${below > 1 ? 'er' : ''} kräver mer uppmärksamhet — den blå linjen visar minimikravet.`}
                    </div>
                );
            })()}
        </div>
    );
}
