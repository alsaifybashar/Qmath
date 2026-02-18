'use client';

import { motion } from 'framer-motion';
import {
    ArrowLeft, ChevronRight, Play, BookOpen,
    Layers, Target, Brain,
} from 'lucide-react';
import Link from 'next/link';
import type { OverviewTopic } from '@/app/actions/course-overview';

const PHASE_LABEL: Record<string, string> = {
    foundation: 'Grundläggande',
    core: 'Kärna',
    advanced: 'Fördjupning',
};

const PHASE_COLOR: Record<string, string> = {
    foundation: '#10B981',
    core: '#3B82F6',
    advanced: '#8B5CF6',
};

const PHASE_ICON: Record<string, React.ElementType> = {
    foundation: Layers,
    core: Target,
    advanced: Brain,
};

const DIFFICULTY_LABEL: Record<string, string> = {
    easy: 'Grundläggande',
    medium: 'Medel',
    hard: 'Avancerad',
};

const DIFFICULTY_STYLE: Record<string, string> = {
    easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

interface TopicPageProps {
    course: { id: string; name: string; code: string };
    topic: OverviewTopic;
    phase: string;
    courseCode: string;
}

export default function TopicPage({ course, topic, phase, courseCode }: TopicPageProps) {
    const phaseColor = PHASE_COLOR[phase] || PHASE_COLOR.core;
    const PhaseIcon = PHASE_ICON[phase] || Target;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white transition-colors pb-20">
            <div className="fixed inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 dark:from-blue-900/10 dark:via-black dark:to-purple-900/10 pointer-events-none" />

            <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm mb-8">
                    <Link
                        href={`/courses/${courseCode}`}
                        className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {course.code}
                    </Link>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600" />
                    <span className="font-medium text-zinc-900 dark:text-white truncate">{topic.name}</span>
                </div>

                {/* Topic header */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-start gap-4 mb-4">
                        <div
                            className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white"
                            style={{ background: `linear-gradient(135deg, ${phaseColor}, ${phaseColor}CC)` }}
                        >
                            <PhaseIcon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl font-bold mb-1.5">{topic.name}</h1>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${DIFFICULTY_STYLE[topic.difficulty]}`}>
                                    {DIFFICULTY_LABEL[topic.difficulty]}
                                </span>
                                <span className="text-xs text-zinc-400">
                                    {PHASE_LABEL[phase]} · {topic.examFrequency}
                                </span>
                            </div>
                        </div>
                    </div>

                    {topic.description && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                            {topic.description}
                        </p>
                    )}
                </motion.div>

                {/* Action — Start practicing */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Link
                        href={`/study?topic=${topic.id}&course=${courseCode}`}
                        className="flex items-center justify-between w-full px-5 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-md transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                <Play className="w-5 h-5 text-blue-600 dark:text-blue-400 fill-current" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Öva på detta ämne</p>
                                <p className="text-xs text-zinc-400">Starta en övningssession</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                    </Link>
                </motion.div>

                {/* Topic details — compact info */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="mt-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4"
                >
                    {/* Importance */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Viktighet</span>
                        <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                        width: `${(topic.importance / 10) * 100}%`,
                                        backgroundColor: phaseColor,
                                    }}
                                />
                            </div>
                            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">{topic.importance}/10</span>
                        </div>
                    </div>

                    {/* Exam sections */}
                    {topic.examSections.length > 0 && (
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Tentadel</span>
                            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                                {topic.examSections.join(', ')}
                            </span>
                        </div>
                    )}

                    {/* Estimated time */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Uppskattad studietid</span>
                        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">~{topic.estimatedHours}h</span>
                    </div>
                </motion.div>

                {/* Study tips — only if they exist, shown cleanly */}
                {topic.studyTips.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5"
                    >
                        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                            Studietips
                        </p>
                        <ul className="space-y-2">
                            {topic.studyTips.map((tip, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                                    <span
                                        className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold mt-0.5"
                                        style={{ backgroundColor: phaseColor }}
                                    >
                                        {i + 1}
                                    </span>
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}

                {/* Common mistakes */}
                {topic.commonMistakes.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="mt-4 bg-red-50/50 dark:bg-red-900/10 border border-red-200/60 dark:border-red-800/30 rounded-2xl p-5"
                    >
                        <p className="text-xs font-bold text-red-500 dark:text-red-400 uppercase tracking-wider mb-3">
                            Vanliga misstag
                        </p>
                        <ul className="space-y-2">
                            {topic.commonMistakes.map((mistake, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-sm text-red-700 dark:text-red-300">
                                    <span className="flex-shrink-0 text-red-400 mt-0.5">✗</span>
                                    {mistake}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
