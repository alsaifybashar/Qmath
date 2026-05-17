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
        accent: '#34D399',
        glow: 'shadow-emerald-500/20',
    },
    core: {
        label: 'Kärna',
        icon: Target,
        accent: '#60A5FA',
        glow: 'shadow-blue-500/20',
    },
    advanced: {
        label: 'Fördjupning',
        icon: Brain,
        accent: '#A78BFA',
        glow: 'shadow-violet-500/20',
    },
    practice: {
        label: 'Träning',
        icon: HelpCircle,
        accent: '#FBBF24',
        glow: 'shadow-amber-500/20',
    },
} as const;

const PRIORITY_CONFIG = {
    critical: { label: 'Hög effekt', icon: Flame, color: 'text-rose-200' },
    high: { label: 'Viktig', icon: Zap, color: 'text-amber-200' },
    medium: { label: 'Stabil', icon: ShieldCheck, color: 'text-blue-200' },
    low: { label: 'Bonus', icon: Sparkles, color: 'text-white/65' },
} as const;

function glass(className = '') {
    return [
        'rounded-lg border border-white/15 bg-white/[0.07]',
        'shadow-2xl shadow-black/25 backdrop-blur-md ring-1 ring-white/5',
        className,
    ].join(' ');
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
        <section className={glass('p-4 sm:p-5')}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-emerald-300/25 bg-emerald-400/15 text-emerald-100 shadow-lg shadow-emerald-500/20">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold uppercase text-emerald-200">Nästa bästa steg</p>
                        <h3 className="mt-1 truncate text-xl font-bold text-white">{recommended.topic.name}</h3>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-white/65">
                            <span className={`inline-flex items-center gap-1 ${priority.color}`}>
                                <PriorityIcon className="h-3.5 w-3.5" />
                                {priority.label}
                            </span>
                            <span>{recommended.topic.examFrequency || 'Tentafokus okänt'}</span>
                            <span>~{recommended.topic.estimatedHours}h</span>
                        </div>
                    </div>
                </div>
                <Link
                    href={`/courses/${data.courseCode}/topics/${recommended.topic.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-emerald-100"
                >
                    Starta
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </section>
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(stepNumber * 0.02, 0.22) }}
        >
            <Link
                href={`/courses/${courseCode}/topics/${topic.id}`}
                className="group flex min-h-[96px] items-center gap-3 rounded-lg border border-white/10 bg-white/[0.045] p-3 transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.075]"
            >
                <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white shadow-lg ${config.glow}`}
                    style={{ background: `linear-gradient(135deg, ${config.accent}, ${config.accent}99)` }}
                >
                    {stepNumber}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h4 className="truncate text-sm font-bold text-white">{topic.name}</h4>
                        <PriorityIcon className={`h-3.5 w-3.5 shrink-0 ${priority.color}`} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/55">
                        <span>{topic.examFrequency || 'Ej angivet'}</span>
                        {topic.questionCount != null && topic.questionCount > 0 && <span>{topic.questionCount} frågor</span>}
                    </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-white" />
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
        <section className={glass('p-4')}>
            <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15"
                        style={{ backgroundColor: `${config.accent}20`, color: config.accent }}
                    >
                        <Icon className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white">{module.title}</h3>
                        <p className="text-xs text-white/50">{config.label} · {module.topics.length} uppdrag</p>
                    </div>
                </div>
                <div className="hidden items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-xs font-semibold text-white/65 sm:flex">
                    <Clock className="h-3.5 w-3.5" />
                    ~{module.totalEstimatedHours}h
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
        </section>
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
        <div className="space-y-4 text-white">
            <motion.section
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className={glass('overflow-hidden p-5 sm:p-6')}
            >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-white/12 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-blue-100">
                            <Trophy className="h-3.5 w-3.5" />
                            Kursresa
                        </div>
                        <h2 className="max-w-2xl text-2xl font-bold tracking-normal sm:text-3xl">
                            Välj ett uppdrag. Bygg momentum.
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
                            Vi visar bara det som hjälper dig ta nästa steg: prioritet, tentakoppling och träning.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold text-white/70">
                        <span className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2">{data.totalTopics} uppdrag</span>
                        <span className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2">{data.examsAnalyzed} tentor</span>
                        <span className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2">~{data.totalEstimatedHours}h</span>
                    </div>
                </div>
            </motion.section>

            <RecommendedMission data={data} />

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
