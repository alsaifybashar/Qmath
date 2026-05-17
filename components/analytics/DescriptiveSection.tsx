'use client';

/**
 * Module 1 – Descriptive Analytics
 *
 * Design principles:
 *  - Glassmorphic cards mirroring the Question view design language.
 *  - No class-average comparison (per design_principer.md: "Ingen social jämförelse").
 *  - All labels, reference lines and legends inside the charts — no external legends.
 *  - Linear progress bars replaced with stage-progression rings.
 */

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, TrendingUp, BookOpen, LayoutGrid, Radar } from 'lucide-react';
import {
    RadarChart, PolarGrid, PolarAngleAxis, Radar as RechartsRadar,
    ResponsiveContainer, Tooltip,
} from 'recharts';
import type { StudentProgress, ModuleProgress } from '@/types/analytics';
import { accuracyColor, percentToStage } from '@/types/analytics';
import ProgressionRing from './ProgressionRing';

const GLASS_CARD =
    'bg-white/55 dark:bg-zinc-950/55 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-3xl shadow-elevation-3';

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
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-elevation-2">
                        <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                            Nuläge & Utveckling
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Spårning mot kursmål och progression över tid
                        </p>
                    </div>
                </div>

                {/* View toggle */}
                <div className="flex items-center gap-1 p-1 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl text-xs font-medium">
                    <button
                        onClick={() => setActiveView('heatmap')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${activeView === 'heatmap'
                            ? 'bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                        <LayoutGrid className="w-3.5 h-3.5" /> Värmekarta
                    </button>
                    <button
                        onClick={() => setActiveView('radar')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${activeView === 'radar'
                            ? 'bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                        <Radar className="w-3.5 h-3.5" /> Radar
                    </button>
                </div>
            </div>

            {/* Main charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                <div className="lg:col-span-3">
                    <AnimatePresence mode="wait">
                        {activeView === 'heatmap' ? (
                            <motion.div
                                key="heatmap"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.22 }}
                            >
                                <SubjectHeatmap topics={topics} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="radar"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.22 }}
                            >
                                <ComparisonRadar topics={topics.slice(0, 7)} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

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
    orange:  'opacity-85',
    red:     'opacity-75',
    null:    'opacity-40',
};

function SubjectHeatmap({ topics }: { topics: StudentProgress[] }) {
    const [hovered, setHovered] = useState<{ topicIdx: number; dayIdx: number } | null>(null);

    const grouped = useMemo(() => {
        const map: Record<string, StudentProgress[]> = {};
        topics.forEach(t => {
            if (!map[t.subject]) map[t.subject] = [];
            map[t.subject].push(t);
        });
        return Object.entries(map);
    }, [topics]);

    return (
        <div className={`${GLASS_CARD} p-6 h-full`}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Prestation per ämnesområde
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-zinc-400 dark:text-zinc-500">
                    <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-400" /> Svag
                    <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-400" /> OK
                    <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Stark
                    <span className="inline-block w-2.5 h-2.5 rounded-sm bg-zinc-200 dark:bg-zinc-700" /> Ingen data
                </div>
            </div>

            <div className="flex mb-2 pl-[120px] gap-1">
                {DAYS.map(d => (
                    <div key={d} className="flex-1 text-center text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                        {d}
                    </div>
                ))}
            </div>

            <div className="space-y-4">
                {grouped.map(([subject, subjectTopics]) => (
                    <div key={subject}>
                        <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">
                            {subject}
                        </p>
                        <div className="space-y-1">
                            {subjectTopics.map(topic => {
                                const globalIdx = topics.indexOf(topic);
                                return (
                                    <div key={topic.topicId} className="flex items-center gap-1">
                                        <div className="w-[115px] shrink-0 text-right pr-2">
                                            <span className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate block">
                                                {topic.topicName}
                                            </span>
                                        </div>

                                        {topic.weeklyAccuracy.map((acc, dayIdx) => {
                                            const color = acc !== null ? accuracyColor(acc) : 'null';
                                            const isHov = hovered?.topicIdx === globalIdx && hovered?.dayIdx === dayIdx;
                                            const hitTarget = acc !== null && acc >= topic.targetMastery / 5;

                                            return (
                                                <div key={dayIdx} className="relative flex-1">
                                                    <div
                                                        className={`h-5 rounded-md cursor-default transition-all duration-150 ${COLOR_MAP[color]} ${OPACITY_MAP[color]} ${isHov ? 'ring-2 ring-primary-400 dark:ring-primary-500 scale-110' : ''}`}
                                                        onMouseEnter={() => setHovered({ topicIdx: globalIdx, dayIdx })}
                                                        onMouseLeave={() => setHovered(null)}
                                                    />
                                                    {hitTarget && (
                                                        <div className="absolute -top-1 -right-1 pointer-events-none">
                                                            <Target className="w-2.5 h-2.5 text-primary-600 dark:text-primary-400" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        <div className="w-8 shrink-0 text-right">
                                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums">
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
                            className="mt-3 p-3 bg-zinc-900/90 dark:bg-zinc-800/90 backdrop-blur-xl text-white rounded-2xl text-xs"
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
// COMPARISON RADAR (Student vs Target only — no class comparison)
// ─────────────────────────────────────────────────────────────────────────────

interface RadarDatum {
    subject: string;
    student: number;
    target: number;
}

function ComparisonRadar({ topics }: { topics: StudentProgress[] }) {
    const data: RadarDatum[] = topics.map(t => ({
        subject: t.topicName.length > 12 ? t.topicName.slice(0, 11) + '…' : t.topicName,
        student: Math.round((t.masteryLevel / 5) * 100),
        target: Math.round((t.targetMastery / 5) * 100),
    }));

    return (
        <div className={`${GLASS_CARD} p-6 h-full`}>
            <div className="flex items-start justify-between mb-3">
                <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Din väg mot kursmålet
                </h3>
                <div className="flex flex-col gap-1 text-[10px]">
                    <div className="flex items-center gap-1.5">
                        <span className="w-5 h-0.5 bg-primary-500 rounded" />
                        <span className="text-zinc-500 dark:text-zinc-400">Du</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-5 h-0.5 bg-emerald-500 rounded opacity-60" />
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
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fontSize: 10, fill: 'currentColor' }}
                        className="text-zinc-600 dark:text-zinc-400"
                    />

                    {/* Course target — soft green reference frame */}
                    <RechartsRadar
                        name="Kurskrav"
                        dataKey="target"
                        stroke="rgba(16,185,129,0.6)"
                        fill="rgba(16,185,129,0.08)"
                        strokeWidth={1.5}
                        strokeDasharray="4 3"
                    />

                    {/* Student — primary gradient stroke */}
                    <RechartsRadar
                        name="Du"
                        dataKey="student"
                        stroke="rgba(99,102,241,0.95)"
                        fill="rgba(99,102,241,0.20)"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: 'rgb(99,102,241)', strokeWidth: 0 }}
                    />

                    <Tooltip
                        formatter={(v: number | string | undefined) => [`${v ?? ''}%`]}
                        contentStyle={{
                            borderRadius: 14,
                            border: 'none',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                            fontSize: 11,
                            backdropFilter: 'blur(12px)',
                            background: 'rgba(255,255,255,0.85)',
                        }}
                    />
                </RadarChart>
            </ResponsiveContainer>

            {topics.length > 0 && (() => {
                const nearTarget = topics.filter(
                    t => t.masteryLevel >= t.targetMastery - 1,
                ).length;
                const weakest = [...topics].sort((a, b) => a.masteryLevel - b.masteryLevel)[0];
                return (
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 text-center mt-1 leading-relaxed">
                        Du är nära kursmålet i{' '}
                        <strong className="text-zinc-700 dark:text-zinc-300">{nearTarget} av {topics.length}</strong>{' '}
                        områden.{' '}
                        <span className="text-primary-600 dark:text-primary-400 font-medium">
                            {weakest.topicName}
                        </span>{' '}
                        har störst potential just nu.
                    </p>
                );
            })()}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE PROGRESS — STAGE RINGS
// ─────────────────────────────────────────────────────────────────────────────

function ModuleProgressPanel({ modules }: { modules: ModuleProgress[] }) {
    return (
        <div className={`${GLASS_CARD} p-6 h-full`}>
            <div className="flex items-center gap-2 mb-5">
                <BookOpen className="w-4 h-4 text-primary-500 dark:text-primary-400" />
                <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Modulförlopp
                </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {modules.map((mod, i) => {
                    const stage = percentToStage(mod.progress);
                    const shortName = mod.moduleName
                        .replace(/^[^–]+–\s*/, '')
                        .trim();
                    return (
                        <motion.div
                            key={mod.moduleId}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className="flex flex-col items-center text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-white/40 dark:border-white/5 rounded-2xl p-3"
                        >
                            <ProgressionRing
                                value={mod.progress}
                                stage={stage}
                                size="sm"
                            />
                            <div className="mt-2 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 leading-tight line-clamp-2">
                                {shortName}
                            </div>
                            <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 tabular-nums">
                                {mod.questionsAttempted}/{mod.questionsTotal} · krav {mod.required}%
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {modules.length > 0 && (() => {
                const below = modules.filter(m => m.progress < m.required).length;
                return (
                    <div className={`mt-5 pt-4 p-3 rounded-2xl text-[11px] leading-relaxed border ${below === 0
                        ? 'bg-emerald-50/60 dark:bg-emerald-900/20 border-emerald-200/50 dark:border-emerald-700/30 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-50/60 dark:bg-amber-900/20 border-amber-200/50 dark:border-amber-700/30 text-amber-700 dark:text-amber-300'}`}
                    >
                        {below === 0
                            ? '✓ Du uppfyller kurskraven för alla moduler.'
                            : `${below} modul${below > 1 ? 'er' : ''} kvar mot kravnivån — en kort session räcker en bra bit.`}
                    </div>
                );
            })()}
        </div>
    );
}
