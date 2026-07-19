'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    Brain,
    CheckCircle2,
    Clock,
    Flame,
    HelpCircle,
    Layers,
    ShieldCheck,
    Sparkles,
    Target,
    Trophy,
    Zap,
} from 'lucide-react';
import Link from 'next/link';
import type { CourseOverviewData, LearningModule, OverviewTopic } from '@/app/actions/course-overview';

const PHASE_CONFIG = {
    foundation: {
        label: 'Start',
        icon: Layers,
        accent: '#10B981',
        chip: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    },
    core: {
        label: 'Kärna',
        icon: Target,
        accent: '#3585a3',
        chip: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
    },
    advanced: {
        label: 'Fördjupning',
        icon: Brain,
        accent: '#19647e',
        chip: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
    },
    practice: {
        label: 'Träning',
        icon: HelpCircle,
        accent: '#dfa81b',
        chip: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    },
} as const;

const PRIORITY_CONFIG = {
    critical: { label: 'Hög effekt', icon: Flame, color: 'text-rose-600 dark:text-rose-300', bg: 'bg-rose-500/10' },
    high: { label: 'Viktig', icon: Zap, color: 'text-amber-600 dark:text-amber-300', bg: 'bg-amber-500/10' },
    medium: { label: 'Stabil', icon: ShieldCheck, color: 'text-blue-600 dark:text-blue-300', bg: 'bg-blue-500/10' },
    low: { label: 'Bonus', icon: Sparkles, color: 'text-zinc-500 dark:text-white/55', bg: 'bg-zinc-500/10' },
} as const;

function Surface({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`rounded-2xl bg-white/76 shadow-[0_0_0_1px_rgba(15,23,42,0.07),0_8px_32px_rgba(15,23,42,0.08)] backdrop-blur-[22px] dark:bg-white/[0.07] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_18px_48px_rgba(0,0,0,0.24)] ${className}`}>
            {children}
        </div>
    );
}

function getModuleConfig(module: LearningModule) {
    return module.id === 'module-practice'
        ? PHASE_CONFIG.practice
        : PHASE_CONFIG[module.phase as keyof typeof PHASE_CONFIG];
}

function getTopicScore(topic: OverviewTopic) {
    const priorityBoost = topic.priority === 'critical' ? 4 : topic.priority === 'high' ? 2 : 0;
    const questionBoost = topic.questionCount && topic.questionCount > 0 ? 1 : 0;
    return topic.importance + priorityBoost + questionBoost;
}

function RecommendedMission({ data }: { data: CourseOverviewData }) {
    const recommended = useMemo(() => {
        return data.modules
            .flatMap((module) => module.topics.map((topic) => ({ topic, module })))
            .sort((a, b) => getTopicScore(b.topic) - getTopicScore(a.topic))[0];
    }, [data.modules]);

    if (!recommended) return null;

    const priority = PRIORITY_CONFIG[recommended.topic.priority];
    const PriorityIcon = priority.icon;

    return (
        <Surface className="overflow-hidden">
            <div className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Nästa bästa steg</p>
                        <h3 className="mt-1 truncate text-xl font-bold text-zinc-950 dark:text-white">{recommended.topic.name}</h3>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-white/55">
                            <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 ${priority.bg} ${priority.color}`}>
                                <PriorityIcon className="h-3.5 w-3.5" />
                                {priority.label}
                            </span>
                            <span>{recommended.topic.examFrequency || 'Tentafokus okänt'}</span>
                            <span className="tabular-nums">~{recommended.topic.estimatedHours}h</span>
                        </div>
                    </div>
                </div>
                <Link
                    href={`/study?topic=${recommended.topic.id}&topicName=${encodeURIComponent(recommended.topic.name)}`}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-bold text-white transition-[background-color,scale] duration-150 ease-out hover:bg-emerald-700 active:scale-[0.96] dark:bg-white dark:text-zinc-950 dark:hover:bg-emerald-100"
                >
                    Starta
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </Surface>
    );
}

function TopicNode({
    topic,
    module,
    stepNumber,
    courseCode,
}: {
    topic: OverviewTopic;
    module: LearningModule;
    stepNumber: number;
    courseCode: string;
}) {
    const config = getModuleConfig(module);
    const priority = PRIORITY_CONFIG[topic.priority];
    const PriorityIcon = priority.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ type: 'spring', duration: 0.22, bounce: 0, delay: Math.min(stepNumber * 0.015, 0.18) }}
        >
            <Link
                href={`/study?topic=${topic.id}&topicName=${encodeURIComponent(topic.name)}`}
                className="group flex min-h-[96px] items-center gap-3 rounded-xl bg-white/62 p-3 shadow-[0_0_0_1px_rgba(15,23,42,0.06)] transition-[transform,background-color,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_0_0_1px_rgba(15,23,42,0.08),0_8px_20px_rgba(15,23,42,0.08)] active:scale-[0.96] dark:bg-white/[0.045] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)] dark:hover:bg-white/[0.075]"
            >
                <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm tabular-nums"
                    style={{ background: `linear-gradient(135deg, ${config.accent}, ${config.accent}cc)` }}
                >
                    {stepNumber}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h4 className="truncate text-sm font-bold text-zinc-950 dark:text-white">{topic.name}</h4>
                        <PriorityIcon className={`h-3.5 w-3.5 shrink-0 ${priority.color}`} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-white/50">
                        <span>{topic.examFrequency || 'Ej angivet'}</span>
                        {topic.questionCount != null && topic.questionCount > 0 && <span className="tabular-nums">{topic.questionCount} frågor</span>}
                    </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-zinc-300 transition-[transform,color] duration-150 ease-out group-hover:translate-x-0.5 group-hover:text-zinc-700 dark:text-white/25 dark:group-hover:text-white" />
            </Link>
        </motion.div>
    );
}

function ModuleJourney({
    module,
    startStep,
    courseCode,
}: {
    module: LearningModule;
    startStep: number;
    courseCode: string;
}) {
    const config = getModuleConfig(module);
    const Icon = config.icon;

    return (
        <Surface className="p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.chip}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="truncate text-base font-bold text-zinc-950 dark:text-white">{module.title}</h3>
                        <p className="text-xs text-zinc-500 dark:text-white/50">{config.label} · {module.topics.length} uppdrag</p>
                    </div>
                </div>
                <div className="hidden items-center gap-1.5 rounded-lg bg-zinc-950/[0.04] px-2.5 py-1.5 text-xs font-semibold text-zinc-500 dark:bg-white/[0.06] dark:text-white/55 sm:flex">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="tabular-nums">~{module.totalEstimatedHours}h</span>
                </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
                {module.topics.map((topic, index) => (
                    <TopicNode
                        key={topic.id}
                        topic={topic}
                        module={module}
                        stepNumber={startStep + index}
                        courseCode={courseCode}
                    />
                ))}
            </div>
        </Surface>
    );
}

export default function CourseOverview({ data }: { data: CourseOverviewData }) {
    const moduleStartSteps = useMemo(() => {
        const starts: number[] = [];
        let step = 1;
        for (const mod of data.modules) {
            starts.push(step);
            step += mod.topics.length;
        }
        return starts;
    }, [data.modules]);

    return (
        <div className="space-y-4">
            <Surface className="overflow-hidden p-5 sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="mb-4 inline-flex items-center gap-2 rounded-xl bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-700 ring-1 ring-blue-500/15 dark:text-blue-200">
                            <Trophy className="h-3.5 w-3.5" />
                            Kursöversikt
                        </div>
                        <h2 className="max-w-2xl text-balance text-2xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-3xl">
                            Kursens ämnen och prioritering
                        </h2>
                        <p className="mt-2 max-w-2xl text-pretty text-sm leading-6 text-zinc-500 dark:text-white/55">
                            Prioritet, tentakoppling och uppskattad tid samlas i en skannbar ordning.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold text-zinc-600 dark:text-white/60">
                        <span className="rounded-lg bg-zinc-950/[0.04] px-3 py-2 tabular-nums dark:bg-white/[0.06]">{data.totalTopics} ämnen</span>
                        <span className="rounded-lg bg-zinc-950/[0.04] px-3 py-2 tabular-nums dark:bg-white/[0.06]">{data.examsAnalyzed} tentor</span>
                        <span className="rounded-lg bg-zinc-950/[0.04] px-3 py-2 tabular-nums dark:bg-white/[0.06]">~{data.totalEstimatedHours}h</span>
                    </div>
                </div>
            </Surface>

            <div className="space-y-4">
                {data.modules.map((mod, idx) => (
                    <ModuleJourney
                        key={mod.id}
                        module={mod}
                        startStep={moduleStartSteps[idx]}
                        courseCode={data.courseCode}
                    />
                ))}
            </div>
        </div>
    );
}
