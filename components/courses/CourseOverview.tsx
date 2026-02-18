'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowRight, Layers, Target, Brain, Sparkles, TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import type { CourseOverviewData, LearningModule, OverviewTopic } from '@/app/actions/course-overview';

// ============================================================================
// PHASE CONFIG — minimal
// ============================================================================

const PHASE_CONFIG = {
    foundation: {
        label: 'Grundläggande',
        icon: Layers,
        accentColor: '#10B981',
        iconBg: 'bg-gradient-to-br from-emerald-400 to-teal-500',
        bg: 'bg-emerald-50 dark:bg-emerald-500/8',
        border: 'border-emerald-200/80 dark:border-emerald-800/40',
        badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    },
    core: {
        label: 'Kärna',
        icon: Target,
        accentColor: '#3B82F6',
        iconBg: 'bg-gradient-to-br from-blue-400 to-indigo-500',
        bg: 'bg-blue-50 dark:bg-blue-500/8',
        border: 'border-blue-200/80 dark:border-blue-800/40',
        badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    },
    advanced: {
        label: 'Fördjupning',
        icon: Brain,
        accentColor: '#8B5CF6',
        iconBg: 'bg-gradient-to-br from-violet-400 to-purple-500',
        bg: 'bg-violet-50 dark:bg-violet-500/8',
        border: 'border-violet-200/80 dark:border-violet-800/40',
        badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    },
} as const;

const DIFFICULTY_DOT = {
    easy: 'bg-emerald-400',
    medium: 'bg-amber-400',
    hard: 'bg-red-400',
} as const;

// ============================================================================
// TOPIC ROW — clickable, minimal
// ============================================================================

function TopicRow({
    topic,
    stepNumber,
    phaseColor,
    courseCode,
    isLast,
}: {
    topic: OverviewTopic;
    stepNumber: number;
    phaseColor: string;
    courseCode: string;
    isLast: boolean;
}) {
    return (
        <div className="relative">
            {/* Connector line */}
            {!isLast && (
                <div
                    className="absolute left-[19px] top-10 bottom-0 w-px z-0"
                    style={{ backgroundColor: `${phaseColor}25` }}
                />
            )}

            <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: stepNumber * 0.03 }}
                className="relative z-10"
            >
                <Link
                    href={`/courses/${courseCode}/topics/${topic.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors group"
                >
                    {/* Step dot */}
                    <div
                        className="flex-shrink-0 w-[38px] h-[38px] rounded-lg flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: `linear-gradient(135deg, ${phaseColor}, ${phaseColor}CC)` }}
                    >
                        {stepNumber}
                    </div>

                    {/* Name + difficulty dot */}
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {topic.name}
                        </span>
                        <span
                            className={`flex-shrink-0 w-2 h-2 rounded-full ${DIFFICULTY_DOT[topic.difficulty]}`}
                            title={topic.difficulty}
                        />
                    </div>

                    {/* Arrow */}
                    <ArrowRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </Link>
            </motion.div>
        </div>
    );
}

// ============================================================================
// MODULE SECTION — clean header + topic list
// ============================================================================

function ModuleSection({
    module,
    globalStartStep,
    courseCode,
}: {
    module: LearningModule;
    globalStartStep: number;
    courseCode: string;
}) {
    const config = PHASE_CONFIG[module.phase];
    const PhaseIcon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: module.orderIndex * 0.1 }}
        >
            {/* Phase header */}
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${config.bg} border ${config.border} mb-2`}>
                <div className={`w-9 h-9 rounded-lg ${config.iconBg} flex items-center justify-center`}>
                    <PhaseIcon className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{module.title}</h3>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${config.badge}`}>
                    {module.topics.length} ämne{module.topics.length !== 1 ? 'n' : ''}
                </span>
            </div>

            {/* Topics */}
            <div className="ml-1">
                {module.topics.map((topic, i) => (
                    <TopicRow
                        key={topic.id}
                        topic={topic}
                        stepNumber={globalStartStep + i}
                        phaseColor={config.accentColor}
                        courseCode={courseCode}
                        isLast={i === module.topics.length - 1}
                    />
                ))}
            </div>
        </motion.div>
    );
}

// ============================================================================
// LEARNING PATH BAR — compact
// ============================================================================

function LearningPathBar({ data }: { data: CourseOverviewData }) {
    const totalTopics = data.totalTopics;

    return (
        <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
            {data.modules.map((mod) => {
                const fraction = mod.topics.length / totalTopics;
                const config = PHASE_CONFIG[mod.phase];
                return (
                    <motion.div
                        key={mod.id}
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${fraction * 100}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                        style={{ backgroundColor: config.accentColor }}
                    />
                );
            })}
        </div>
    );
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

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
        <div className="space-y-6">
            {/* Compact header */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 px-6 py-5 text-white"
            >
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/20 -translate-y-1/3 translate-x-1/3" />
                </div>
                <div className="relative z-10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold leading-tight">Kursöversikt</h2>
                            <p className="text-blue-200 text-xs">
                                {data.totalTopics} ämnen · {data.totalModules} faser · {data.examsAnalyzed} tentor analyserade
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Learning path bar */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Studieväg</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {data.modules.map((mod) => (
                            <div key={mod.id} className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PHASE_CONFIG[mod.phase].accentColor }} />
                                <span className="text-[10px] text-zinc-400">{PHASE_CONFIG[mod.phase].label}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <LearningPathBar data={data} />
            </div>

            {/* Module sections */}
            <div className="space-y-5">
                {data.modules.map((mod, idx) => (
                    <ModuleSection
                        key={mod.id}
                        module={mod}
                        globalStartStep={moduleStartSteps[idx]}
                        courseCode={data.courseCode}
                    />
                ))}
            </div>
        </div>
    );
}
