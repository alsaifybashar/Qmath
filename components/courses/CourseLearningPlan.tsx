'use client';

import { useMemo, useState } from 'react';
import type { ElementType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    ArrowRight,
    BookOpenCheck,
    Brain,
    CheckCircle2,
    ChevronDown,
    CircleDot,
    Clock3,
    Flame,
    Layers,
    Play,
    ShieldCheck,
    Sparkles,
    Target,
    Trophy,
    Zap,
} from 'lucide-react';
import type { CourseOverviewData, LearningModule, OverviewTopic } from '@/app/actions/course-overview';

const MODULE_STYLE = {
    foundation: {
        label: 'Start',
        tone: 'from-emerald-500 to-teal-500',
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        border: 'border-emerald-200 dark:border-emerald-900',
        text: 'text-emerald-700 dark:text-emerald-300',
        color: '#10B981',
        icon: Layers,
    },
    core: {
        label: 'Fokus',
        tone: 'from-blue-500 to-indigo-500',
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        border: 'border-blue-200 dark:border-blue-900',
        text: 'text-blue-700 dark:text-blue-300',
        color: '#3585a3',
        icon: Target,
    },
    advanced: {
        label: 'Boost',
        tone: 'from-violet-500 to-fuchsia-500',
        bg: 'bg-violet-50 dark:bg-violet-950/30',
        border: 'border-violet-200 dark:border-violet-900',
        text: 'text-violet-700 dark:text-violet-300',
        color: '#19647e',
        icon: Brain,
    },
} as const;

const DIFFICULTY_LABEL = {
    easy: 'Lätt start',
    medium: 'Lagom nivå',
    hard: 'Utmaning',
} as const;

const PRIORITY_LABEL = {
    critical: 'Måste sitta',
    high: 'Hög effekt',
    medium: 'Bra ROI',
    low: 'Finjustering',
} as const;

function getModuleStyle(module: LearningModule) {
    return MODULE_STYLE[module.phase] ?? MODULE_STYLE.core;
}

function getTopicStatus(index: number) {
    if (index === 0) return 'current';
    if (index < 3) return 'next';
    return 'queued';
}

function flattenTopics(data: CourseOverviewData) {
    return data.modules.flatMap((module) =>
        module.topics.map((topic) => ({
            module,
            topic,
        })),
    );
}

function StatPill({
    icon: Icon,
    label,
    value,
}: {
    icon: ElementType;
    label: string;
    value: string;
}) {
    return (
        <div className="flex min-w-0 items-center gap-2 rounded-lg border border-white/20 bg-white/12 px-3 py-2 text-white backdrop-blur">
            <Icon className="h-4 w-4 flex-shrink-0 text-cyan-100" />
            <div className="min-w-0">
                <p className="text-[11px] font-medium text-cyan-100">{label}</p>
                <p className="truncate text-sm font-bold">{value}</p>
            </div>
        </div>
    );
}

function TopicMission({
    topic,
    module,
    courseCode,
    step,
    isExpanded,
    onToggle,
}: {
    topic: OverviewTopic;
    module: LearningModule;
    courseCode: string;
    step: number;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const style = getModuleStyle(module);
    const status = getTopicStatus(step - 1);
    const StatusIcon = status === 'current' ? CircleDot : status === 'next' ? Zap : CheckCircle2;
    const reward = Math.max(20, Math.round(topic.importance * 12 + topic.estimatedHours * 8));

    return (
        <motion.article
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(step * 0.025, 0.25) }}
            className="group relative rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
        >
            <div className="flex items-start gap-3">
                <div className="relative flex-shrink-0">
                    <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-black text-white shadow-sm"
                        style={{ background: `linear-gradient(135deg, ${style.color}, ${style.color}CC)` }}
                    >
                        {step}
                    </div>
                    {status === 'current' && (
                        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-amber-400 dark:border-zinc-950" />
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className={`rounded-md px-2 py-1 text-[11px] font-bold ${style.bg} ${style.text}`}>
                            {style.label}
                        </span>
                        <span className="rounded-md bg-zinc-100 px-2 py-1 text-[11px] font-bold text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                            {PRIORITY_LABEL[topic.priority]}
                        </span>
                        <span className="rounded-md bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                            +{reward} XP
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={onToggle}
                        className="flex w-full items-start justify-between gap-3 text-left"
                    >
                        <div className="min-w-0">
                            <h3 className="text-base font-black leading-snug text-zinc-950 dark:text-white">
                                {topic.name}
                            </h3>
                            <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                                {topic.description || 'Bygg förståelse med korta, fokuserade pass och direkt övning.'}
                            </p>
                        </div>
                        <ChevronDown
                            className={`mt-1 h-5 w-5 flex-shrink-0 text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                    </button>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                        <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
                            <p className="text-[10px] font-bold uppercase text-zinc-400">Tid</p>
                            <p className="text-sm font-black text-zinc-900 dark:text-white">~{topic.estimatedHours}h</p>
                        </div>
                        <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
                            <p className="text-[10px] font-bold uppercase text-zinc-400">Nivå</p>
                            <p className="truncate text-sm font-black text-zinc-900 dark:text-white">{DIFFICULTY_LABEL[topic.difficulty]}</p>
                        </div>
                        <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
                            <p className="text-[10px] font-bold uppercase text-zinc-400">Vikt</p>
                            <p className="text-sm font-black text-zinc-900 dark:text-white">{topic.importance}/10</p>
                        </div>
                    </div>

                    <AnimatePresence initial={false}>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                                    {topic.studyTips.length > 0 && (
                                        <div className="mb-4">
                                            <p className="mb-2 text-xs font-black uppercase tracking-wide text-zinc-400">Smart start</p>
                                            <div className="grid gap-2 sm:grid-cols-2">
                                                {topic.studyTips.slice(0, 4).map((tip, index) => (
                                                    <div key={index} className="flex gap-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                                                        <Sparkles className="mt-1 h-4 w-4 flex-shrink-0 text-amber-500" />
                                                        <span>{tip}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {topic.commonMistakes.length > 0 && (
                                        <div className="mb-4 rounded-lg border border-rose-100 bg-rose-50 p-3 dark:border-rose-900/50 dark:bg-rose-950/20">
                                            <p className="mb-2 text-xs font-black uppercase tracking-wide text-rose-500">Undvik detta</p>
                                            <p className="text-sm leading-6 text-rose-700 dark:text-rose-300">{topic.commonMistakes[0]}</p>
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <Link
                                            href={`/study?topic=${topic.id}&topicName=${encodeURIComponent(topic.name)}`}
                                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                                        >
                                            <Play className="h-4 w-4 fill-current" />
                                            Starta pass
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <StatusIcon className={`hidden h-5 w-5 flex-shrink-0 sm:block ${status === 'current' ? 'text-amber-500' : status === 'next' ? 'text-blue-500' : 'text-zinc-300 dark:text-zinc-700'}`} />
            </div>
        </motion.article>
    );
}

function ModuleBlock({
    module,
    courseCode,
    startStep,
    expandedTopic,
    onExpand,
}: {
    module: LearningModule;
    courseCode: string;
    startStep: number;
    expandedTopic: string | null;
    onExpand: (topicId: string) => void;
}) {
    const style = getModuleStyle(module);
    const Icon = style.icon;

    return (
        <section className="space-y-3">
            <div className={`rounded-lg border ${style.border} ${style.bg} p-4`}>
                <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${style.tone} text-white shadow-sm`}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-black text-zinc-950 dark:text-white">{module.title}</h2>
                            <span className={`rounded-md bg-white/70 px-2 py-1 text-[11px] font-bold ${style.text} dark:bg-zinc-950/40`}>
                                {module.topics.length} uppdrag
                            </span>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{module.description}</p>
                    </div>
                    <div className="hidden text-right sm:block">
                        <p className="text-xs font-bold uppercase text-zinc-400">Estimat</p>
                        <p className="text-lg font-black text-zinc-950 dark:text-white">{module.totalEstimatedHours}h</p>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {module.topics.map((topic, index) => (
                    <TopicMission
                        key={topic.id}
                        topic={topic}
                        module={module}
                        courseCode={courseCode}
                        step={startStep + index}
                        isExpanded={expandedTopic === topic.id}
                        onToggle={() => onExpand(topic.id)}
                    />
                ))}
            </div>
        </section>
    );
}

export default function CourseLearningPlan({ data }: { data: CourseOverviewData }) {
    const flattened = useMemo(() => flattenTopics(data), [data]);
    const firstTopic = flattened[0]?.topic;
    const highImpact = flattened
        .map(({ topic }) => topic)
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 3);
    const [expandedTopic, setExpandedTopic] = useState<string | null>(firstTopic?.id ?? null);

    const moduleStartSteps = useMemo(() => {
        const starts: number[] = [];
        let step = 1;
        for (const module of data.modules) {
            starts.push(step);
            step += module.topics.length;
        }
        return starts;
    }, [data.modules]);

    const focusMinutes = Math.max(25, Math.min(50, Math.round((data.totalEstimatedHours / Math.max(data.totalTopics, 1)) * 12)));

    return (
        <div className="space-y-6">
            <motion.header
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-lg bg-zinc-950 p-5 text-white shadow-xl dark:bg-zinc-900 sm:p-6"
            >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.22),transparent_32%),radial-gradient(circle_at_88%_18%,rgba(25, 100, 126,0.22),transparent_30%),linear-gradient(135deg,rgba(16,185,129,0.18),transparent_44%)]" />
                <div className="relative grid gap-5 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
                    <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-cyan-100 backdrop-blur">
                            <BookOpenCheck className="h-4 w-4" />
                            Kursplan som belönar nästa steg
                        </div>
                        <h1 className="max-w-3xl text-3xl font-black leading-tight sm:text-4xl">
                            {data.courseName}
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300 sm:text-base">
                            En lugnare väg genom kursen: börja smått, se framsteg direkt och låt högst effekt styra vad du gör härnäst.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <StatPill icon={Target} label="Ämnen" value={`${data.totalTopics}`} />
                        <StatPill icon={Clock3} label="Total tid" value={`~${data.totalEstimatedHours}h`} />
                        <StatPill icon={Layers} label="Faser" value={`${data.totalModules}`} />
                        <StatPill icon={ShieldCheck} label="Tentor" value={`${data.examsAnalyzed}`} />
                    </div>
                </div>
            </motion.header>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <main className="space-y-6">
                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                <Flame className="h-5 w-5" />
                            </div>
                            <p className="text-sm font-black text-zinc-950 dark:text-white">Mikrovinster</p>
                            <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">Varje ämne har tydlig belöning, tid och startknapp.</p>
                        </div>
                        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                <Brain className="h-5 w-5" />
                            </div>
                            <p className="text-sm font-black text-zinc-950 dark:text-white">Mindre brus</p>
                            <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">Detaljer öppnas först när studenten vill gå djupare.</p>
                        </div>
                        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                <Trophy className="h-5 w-5" />
                            </div>
                            <p className="text-sm font-black text-zinc-950 dark:text-white">Progression</p>
                            <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">Faser, prioritet och XP gör vägen lätt att följa.</p>
                        </div>
                    </div>

                    {data.modules.map((module, index) => (
                        <ModuleBlock
                            key={module.id}
                            module={module}
                            courseCode={data.courseCode}
                            startStep={moduleStartSteps[index]}
                            expandedTopic={expandedTopic}
                            onExpand={(topicId) => setExpandedTopic(current => current === topicId ? null : topicId)}
                        />
                    ))}
                </main>

                <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
                    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                        <p className="mb-3 text-xs font-black uppercase tracking-wide text-zinc-400">Högst tentaeffekt</p>
                        <div className="space-y-3">
                            {highImpact.map((topic, index) => (
                                <button
                                    key={topic.id}
                                    type="button"
                                    onClick={() => setExpandedTopic(topic.id)}
                                    className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-900"
                                >
                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs font-black text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                                        {index + 1}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-bold text-zinc-900 dark:text-white">{topic.name}</p>
                                        <p className="text-xs text-zinc-400">{topic.importance}/10 viktighet</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
