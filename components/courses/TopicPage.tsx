'use client';

import { motion } from 'framer-motion';
import type { ElementType, ReactNode } from 'react';
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Brain,
    ChevronRight,
    Clock,
    Flame,
    Gauge,
    Layers,
    Lightbulb,
    Play,
    ShieldCheck,
    Sparkles,
    Target,
    Trophy,
    Zap,
} from 'lucide-react';
import Link from 'next/link';
import type { OverviewTopic } from '@/app/actions/course-overview';

const PHASE_CONFIG = {
    foundation: { label: 'Start', icon: Layers, accent: '#34D399' },
    core: { label: 'Kärna', icon: Target, accent: '#5ea6bd' },
    advanced: { label: 'Fördjupning', icon: Brain, accent: '#5ea6bd' },
} as const;

const PRIORITY_CONFIG = {
    critical: { label: 'Hög effekt', icon: Flame, color: 'text-rose-200' },
    high: { label: 'Viktig', icon: Zap, color: 'text-amber-200' },
    medium: { label: 'Stabil', icon: ShieldCheck, color: 'text-blue-200' },
    low: { label: 'Bonus', icon: Sparkles, color: 'text-white/65' },
} as const;

interface TopicPageProps {
    course: { id: string; name: string; code: string };
    topic: OverviewTopic;
    phase: string;
    courseCode: string;
}

function glass(className = '') {
    return [
        'rounded-lg border border-white/15 bg-white/[0.07]',
        'shadow-2xl shadow-black/25 backdrop-blur-md ring-1 ring-white/5',
        className,
    ].join(' ');
}

function MiniStat({
    icon: Icon,
    label,
    value,
}: {
    icon: ElementType;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-lg border border-white/10 bg-white/[0.045] px-3 py-2">
            <div className="mb-1 flex items-center gap-1.5 text-white/45">
                <Icon className="h-3.5 w-3.5" />
                <span className="text-[11px] font-bold uppercase">{label}</span>
            </div>
            <p className="truncate text-sm font-bold text-white">{value}</p>
        </div>
    );
}

function Step({ index, children }: { index: number; children: ReactNode }) {
    return (
        <li className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.045] p-3 text-sm leading-6 text-white/75">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/12 text-xs font-bold text-white">
                {index}
            </span>
            <span>{children}</span>
        </li>
    );
}

export default function TopicPage({ course, topic, phase, courseCode }: TopicPageProps) {
    const config = PHASE_CONFIG[phase as keyof typeof PHASE_CONFIG] || PHASE_CONFIG.core;
    const PhaseIcon = config.icon;
    const priority = PRIORITY_CONFIG[topic.priority];
    const PriorityIcon = priority.icon;
    const firstTips = topic.studyTips.slice(0, 3);
    const firstMistakes = topic.commonMistakes.slice(0, 2);

    return (
        <div className="liquid-theme relative min-h-screen overflow-hidden bg-slate-50 pb-20 text-zinc-950 dark:bg-[#08091f] dark:text-white">
            <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(53, 133, 163,0.18),transparent_28%),radial-gradient(circle_at_88%_10%,rgba(25, 100, 126,0.14),transparent_30%),radial-gradient(circle_at_52%_90%,rgba(16,185,129,0.13),transparent_34%),linear-gradient(135deg,#f8fbff_0%,#edf4ff_48%,#f7f3ff_100%)] dark:bg-[radial-gradient(circle_at_12%_14%,rgba(53, 133, 163,0.45),transparent_28%),radial-gradient(circle_at_88%_10%,rgba(25, 100, 126,0.38),transparent_30%),radial-gradient(circle_at_52%_90%,rgba(16,185,129,0.24),transparent_34%),linear-gradient(135deg,#050816_0%,#11164e_48%,#24104f_100%)]" />
            <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.55),transparent_24%,rgba(255,255,255,0.24)_52%,transparent_76%)] dark:bg-[linear-gradient(115deg,rgba(255,255,255,0.10),transparent_24%,rgba(255,255,255,0.04)_52%,transparent_76%)]" />

            <div className="relative z-10 mx-auto max-w-5xl px-4 py-8">
                <div className="mb-5 flex items-center gap-2 text-sm">
                    <Link
                        href={`/courses/${courseCode}`}
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-white/55 backdrop-blur-md transition hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {course.code}
                    </Link>
                    <ChevronRight className="h-3.5 w-3.5 text-white/25" />
                    <span className="truncate font-medium text-white/80">{topic.name}</span>
                </div>

                <motion.section
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={glass('p-5 sm:p-6')}
                >
                    <div className="grid gap-6 lg:grid-cols-[1fr_280px] lg:items-center">
                        <div className="min-w-0">
                            <div className="mb-4 flex flex-wrap items-center gap-2">
                                <span
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-bold"
                                    style={{ color: config.accent }}
                                >
                                    <PhaseIcon className="h-3.5 w-3.5" />
                                    {config.label}
                                </span>
                                <span className={`inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-bold ${priority.color}`}>
                                    <PriorityIcon className="h-3.5 w-3.5" />
                                    {priority.label}
                                </span>
                            </div>

                            <h1 className="text-3xl font-bold tracking-normal sm:text-4xl">{topic.name}</h1>
                            {topic.description && (
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">{topic.description}</p>
                            )}
                            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                                <Link
                                    href={`/study?topic=${topic.id}&course=${courseCode}`}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-emerald-100"
                                >
                                    <Play className="h-4 w-4 fill-current" />
                                    Starta träning
                                </Link>
                                <Link
                                    href={`/courses/${courseCode}`}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white/75 transition hover:bg-white/[0.10] hover:text-white"
                                >
                                    Kursresan
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>

                        <div className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-4 shadow-xl shadow-emerald-500/10">
                            <div className="mb-3 flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-300/15 text-emerald-100">
                                    <Trophy className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase text-emerald-200">Fokusvärde</p>
                                    <p className="text-2xl font-bold text-white">{topic.importance}/10</p>
                                </div>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-blue-300"
                                    style={{ width: `${Math.max(10, Math.min(100, topic.importance * 10))}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </motion.section>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <MiniStat icon={Gauge} label="Tentafokus" value={topic.examFrequency || 'Ej angivet'} />
                    <MiniStat icon={Clock} label="Tid" value={`~${topic.estimatedHours}h`} />
                    <MiniStat icon={BookOpen} label="Frågor" value={topic.questionCount != null ? `${topic.questionCount}` : 'Ej angivet'} />
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
                    <section className={glass('p-4')}>
                        <div className="mb-3 flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-blue-200" />
                            <h2 className="text-base font-bold">Gör detta först</h2>
                        </div>

                        {firstTips.length > 0 ? (
                            <ol className="space-y-2">
                                {firstTips.map((tip, index) => (
                                    <Step key={index} index={index + 1}>{tip}</Step>
                                ))}
                            </ol>
                        ) : (
                            <p className="rounded-lg border border-white/10 bg-white/[0.045] p-3 text-sm leading-6 text-white/60">
                                Starta en träningssession och låt frågorna visa nästa konkreta steg.
                            </p>
                        )}
                    </section>

                    {firstMistakes.length > 0 && (
                        <section className={glass('p-4')}>
                            <div className="mb-3 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-rose-200" />
                                <h2 className="text-base font-bold">Undvik</h2>
                            </div>
                            <div className="space-y-2">
                                {firstMistakes.map((mistake, index) => (
                                    <p
                                        key={index}
                                        className="rounded-lg border border-rose-200/15 bg-rose-400/10 p-3 text-sm leading-6 text-rose-100/85"
                                    >
                                        {mistake}
                                    </p>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}
