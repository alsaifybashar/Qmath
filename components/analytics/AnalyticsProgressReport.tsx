'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    BarChart3,
    BookOpen,
    Brain,
    CheckCircle2,
    Clock,
    Flame,
    Target,
} from 'lucide-react';
import type {
    BehaviouralMetrics,
    ErrorPattern,
    GamificationData,
    ModuleProgress,
    StudentProgress,
} from '@/types/analytics';
import { STAGE_LABELS, percentToStage } from '@/types/analytics';

interface AnalyticsProgressReportProps {
    studentProgress?: StudentProgress[];
    moduleProgress?: ModuleProgress[];
    errorPatterns?: ErrorPattern[];
    behaviouralMetrics?: BehaviouralMetrics;
    gamification?: GamificationData;
    mockSeed?: number;
    studentName?: string;
}

const severityRank = { high: 3, medium: 2, low: 1 } as const;
const mockDate = new Date('2026-06-12T12:00:00.000Z');

function surface(className = '') {
    return [
        'rounded-2xl border border-zinc-200 bg-white shadow-sm shadow-zinc-950/[0.03]',
        'dark:border-white/10 dark:bg-zinc-950/80 dark:shadow-black/20',
        className,
    ].join(' ');
}

function actionTitle(pattern?: ErrorPattern) {
    if (!pattern) return 'Fortsätt med nästa träningspass';

    const labels: Record<ErrorPattern['type'], string> = {
        conceptual: 'Repetera grundbegreppen',
        procedural: 'Träna metodval',
        computational: 'Gör kontrollträning',
        interpretation: 'Öva på att tolka uppgiften',
        notation: 'Rätta notationsvanor',
        incomplete: 'Träna fullständiga svar',
        time_pressure: 'Sänk tempot och höj precisionen',
    };

    return labels[pattern.type];
}

function ProgressBar({ value, tone = 'blue' }: { value: number; tone?: 'blue' | 'emerald' | 'amber' }) {
    const color = {
        blue: 'bg-blue-600 dark:bg-blue-300',
        emerald: 'bg-emerald-500 dark:bg-emerald-300',
        amber: 'bg-amber-500 dark:bg-amber-300',
    }[tone];

    return (
        <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
            <div
                className={`h-full origin-left rounded-full ${color}`}
                style={{ transform: `scaleX(${Math.max(0, Math.min(100, value)) / 100})` }}
            />
        </div>
    );
}

function ReportMetric({
    icon: Icon,
    label,
    value,
    detail,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    detail: string;
}) {
    return (
        <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-zinc-500 dark:text-white/45">
                <Icon className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">{value}</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-white/50">{detail}</p>
        </div>
    );
}

function TopicRow({ topic }: { topic: StudentProgress }) {
    const masteryPct = Math.round((topic.masteryLevel / 5) * 100);
    const gap = Math.max(0, topic.targetMastery - topic.masteryLevel);

    return (
        <div className="grid gap-3 border-t border-zinc-100 py-4 first:border-t-0 first:pt-0 last:pb-0 dark:border-white/10 sm:grid-cols-[1fr_150px] sm:items-center">
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-bold text-zinc-950 dark:text-white">{topic.topicName}</h3>
                    {gap > 0 && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-300/10 dark:text-amber-200">
                            +{gap} nivå
                        </span>
                    )}
                </div>
                <p className="mt-1 text-sm text-zinc-500 dark:text-white/50">
                    {topic.subject} · {Math.round(topic.accuracy * 100)}% träffsäkerhet
                </p>
            </div>
            <div>
                <div className="mb-1 flex justify-between text-xs font-semibold text-zinc-500 dark:text-white/45">
                    <span>Nivå {topic.masteryLevel}/5</span>
                    <span>{masteryPct}%</span>
                </div>
                <ProgressBar value={masteryPct} tone={gap > 0 ? 'amber' : 'emerald'} />
            </div>
        </div>
    );
}

function ModuleRow({ module }: { module: ModuleProgress }) {
    return (
        <div className="border-t border-zinc-100 py-4 first:border-t-0 first:pt-0 last:pb-0 dark:border-white/10">
            <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-sm font-bold text-zinc-950 dark:text-white">{module.moduleName}</h3>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-white/50">
                        {module.questionsAttempted}/{module.questionsTotal} uppgifter · cirka {module.estMinutes} min kvar
                    </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-zinc-700 dark:text-white/70">{module.progress}%</span>
            </div>
            <ProgressBar value={module.progress} />
        </div>
    );
}

function createReportMock(): {
    studentProgress: StudentProgress[];
    moduleProgress: ModuleProgress[];
    errorPatterns: ErrorPattern[];
    behaviouralMetrics: BehaviouralMetrics;
    gamification: GamificationData;
} {
    const studentProgress: StudentProgress[] = [
        {
            topicId: 'eigenvalues',
            topicName: 'Egenvärden',
            subject: 'Linjär algebra',
            masteryLevel: 2,
            targetMastery: 4,
            classAvgMastery: 3,
            attempts: 18,
            accuracy: 0.58,
            lastPracticed: mockDate,
            weeklyAccuracy: [0.45, 0.52, null, 0.6, 0.58, null, 0.63],
        },
        {
            topicId: 'integrals',
            topicName: 'Integraler',
            subject: 'Analys',
            masteryLevel: 3,
            targetMastery: 4,
            classAvgMastery: 3,
            attempts: 26,
            accuracy: 0.71,
            lastPracticed: mockDate,
            weeklyAccuracy: [0.66, 0.68, 0.72, null, 0.71, 0.74, null],
        },
        {
            topicId: 'matrices',
            topicName: 'Matriser',
            subject: 'Linjär algebra',
            masteryLevel: 4,
            targetMastery: 3,
            classAvgMastery: 3,
            attempts: 34,
            accuracy: 0.86,
            lastPracticed: mockDate,
            weeklyAccuracy: [0.82, 0.84, 0.87, 0.86, null, 0.89, 0.9],
        },
        {
            topicId: 'limits',
            topicName: 'Gränsvärden',
            subject: 'Analys',
            masteryLevel: 3,
            targetMastery: 3,
            classAvgMastery: 3,
            attempts: 22,
            accuracy: 0.78,
            lastPracticed: mockDate,
            weeklyAccuracy: [0.7, null, 0.76, 0.79, 0.8, null, 0.78],
        },
        {
            topicId: 'bode',
            topicName: 'Bodediagram',
            subject: 'Reglerteknik',
            masteryLevel: 1,
            targetMastery: 3,
            classAvgMastery: 2,
            attempts: 9,
            accuracy: 0.42,
            lastPracticed: mockDate,
            weeklyAccuracy: [null, 0.38, null, 0.44, null, 0.42, null],
        },
    ];

    const moduleProgress: ModuleProgress[] = [
        {
            moduleId: 'linear-algebra-2',
            moduleName: 'Linjär algebra: egenvärden och rum',
            progress: 42,
            required: 70,
            questionsAttempted: 18,
            questionsTotal: 42,
            estMinutes: 55,
        },
        {
            moduleId: 'analysis-2',
            moduleName: 'Analys: integraler och tillämpningar',
            progress: 58,
            required: 70,
            questionsAttempted: 29,
            questionsTotal: 50,
            estMinutes: 38,
        },
        {
            moduleId: 'control-1',
            moduleName: 'Reglerteknik: frekvenssvar',
            progress: 31,
            required: 60,
            questionsAttempted: 11,
            questionsTotal: 35,
            estMinutes: 60,
        },
    ];

    const errorPatterns: ErrorPattern[] = [
        {
            type: 'conceptual',
            frequency: 14,
            share: 0.34,
            mostRecentAt: mockDate,
            affectedTopics: ['eigenvalues', 'bode'],
            severity: 'high',
            actionableMessage: 'Du tappar mest poäng när begreppen blandas ihop. Repetera definitionerna och lös sedan få, tydliga uppgifter.',
        },
        {
            type: 'computational',
            frequency: 9,
            share: 0.22,
            mostRecentAt: mockDate,
            affectedTopics: ['integrals', 'matrices'],
            severity: 'medium',
            actionableMessage: 'Räknefel dyker upp efter flera steg. Skriv mellanled och kontrollera resultatet innan du går vidare.',
        },
    ];

    const behaviouralMetrics: BehaviouralMetrics = {
        sessionId: 'report-mock',
        sessionStart: mockDate,
        durationSeconds: 1320,
        dataPoints: [],
        summary: {
            avgResponseMs: 6400,
            rapidGuessCount: 4,
            rapidGuessShare: 0.16,
            avgStressLevel: 0.42,
            peakStressAt: 840,
            focusedShare: 0.72,
            distractedShare: 0.2,
            stressedShare: 0.08,
        },
    };

    return {
        studentProgress,
        moduleProgress,
        errorPatterns,
        behaviouralMetrics,
        gamification: {
            xp: 1240,
            weeklyXp: 180,
            streakDays: 6,
            longestStreak: 9,
            examReadinessPct: 64,
            achievements: [],
        },
    };
}

export default function AnalyticsProgressReport({
    studentProgress: progressProp,
    moduleProgress: moduleProp,
    errorPatterns: errorProp,
    behaviouralMetrics: behaviouralProp,
    gamification: gamificationProp,
    studentName,
}: AnalyticsProgressReportProps) {
    const mock = useMemo(() => createReportMock(), []);
    const studentProgress = progressProp ?? mock.studentProgress;
    const moduleProgress = moduleProp ?? mock.moduleProgress;
    const errorPatterns = errorProp ?? mock.errorPatterns;
    const behaviouralMetrics = behaviouralProp ?? mock.behaviouralMetrics;
    const gamification = gamificationProp ?? mock.gamification;

    const stage = STAGE_LABELS[percentToStage(gamification.examReadinessPct)];
    const strongestTopics = studentProgress.filter((topic) => topic.masteryLevel >= topic.targetMastery).length;
    const focusPct = Math.round(behaviouralMetrics.summary.focusedShare * 100);
    const rapidGuessPct = Math.round(behaviouralMetrics.summary.rapidGuessShare * 100);
    const priorityPattern = [...errorPatterns].sort((a, b) => {
        return severityRank[b.severity] * b.share - severityRank[a.severity] * a.share;
    })[0];
    const priorityTopics = [...studentProgress]
        .sort((a, b) => {
            const gapA = Math.max(0, a.targetMastery - a.masteryLevel);
            const gapB = Math.max(0, b.targetMastery - b.masteryLevel);
            return gapB - gapA || a.accuracy - b.accuracy;
        })
        .slice(0, 4);
    const nextModules = [...moduleProgress].sort((a, b) => a.progress - b.progress).slice(0, 3);
    const greeting = studentName ? `, ${studentName}` : '';

    return (
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 text-zinc-950 dark:text-white sm:px-6 lg:px-8">
            <motion.header
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                className="mb-6"
            >
                <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-full bg-blue-50 px-3 py-1 font-bold text-blue-700 dark:bg-blue-300/10 dark:text-blue-200">
                        Progressrapport
                    </span>
                    <span className="text-zinc-500 dark:text-white/45">Uppdaterad efter senaste träningspasset</span>
                </div>
                <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-end">
                    <div>
                        <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
                            Så ligger du till{greeting}
                        </h1>
                        <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600 dark:text-white/60">
                            En kort rapport över vad som går bra, vad som behöver fokus och vilket steg som ger mest effekt nu.
                        </p>
                    </div>
                    <nav aria-label="Analyssektioner" className="flex gap-2 overflow-x-auto lg:justify-end">
                        {[
                            ['Översikt', '#overview'],
                            ['Fokus', '#focus'],
                            ['Moduler', '#modules'],
                        ].map(([label, href]) => (
                            <a
                                key={href}
                                href={href}
                                className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-700 transition hover:border-blue-200 hover:text-blue-700 active:scale-[0.98] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70 dark:hover:text-white"
                            >
                                {label}
                            </a>
                        ))}
                    </nav>
                </div>
            </motion.header>

            <main className="space-y-5">
                <section id="overview" className={surface('p-5 sm:p-6')}>
                    <div className="grid gap-6 lg:grid-cols-[240px_1fr] lg:items-center">
                        <div className="rounded-2xl bg-blue-50 p-5 dark:bg-blue-300/10">
                            <p className="text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-200">
                                Tentaklarhet
                            </p>
                            <p className="mt-2 text-5xl font-bold tracking-tight text-blue-700 dark:text-blue-100">
                                {gamification.examReadinessPct}%
                            </p>
                            <p className="mt-2 text-sm font-semibold text-blue-700/75 dark:text-blue-100/70">{stage}</p>
                            <div className="mt-4">
                                <ProgressBar value={gamification.examReadinessPct} />
                            </div>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            <ReportMetric
                                icon={Target}
                                label="I fas"
                                value={`${strongestTopics}/${studentProgress.length}`}
                                detail="ämnen på mål"
                            />
                            <ReportMetric
                                icon={Brain}
                                label="Fokus"
                                value={`${focusPct}%`}
                                detail="av senaste passet"
                            />
                            <ReportMetric
                                icon={Flame}
                                label="Streak"
                                value={`${gamification.streakDays}`}
                                detail="dagar i rad"
                            />
                            <ReportMetric
                                icon={BarChart3}
                                label="Veckan"
                                value={`+${gamification.weeklyXp}`}
                                detail="XP intjänat"
                            />
                        </div>
                    </div>
                </section>

                <section id="focus" className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
                    <div className={surface('p-5 sm:p-6')}>
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-200">
                                    Gör detta först
                                </p>
                                <h2 className="mt-1 text-xl font-bold">{actionTitle(priorityPattern)}</h2>
                            </div>
                            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                        </div>
                        <p className="max-w-2xl text-sm leading-6 text-zinc-600 dark:text-white/60">
                            {priorityPattern?.actionableMessage ??
                                'Vi ser inget tydligt felmönster just nu. Fortsätt med ett kort blandat pass.'}
                        </p>
                        <div className="mt-5 flex flex-wrap items-center gap-3">
                            <Link
                                href="/study"
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 active:scale-[0.98]"
                            >
                                Starta träning
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <span className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-white/45">
                                <Clock className="h-4 w-4" />
                                15-20 min räcker
                            </span>
                        </div>
                    </div>

                    <div className={surface('p-5 sm:p-6')}>
                        <p className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-white/45">
                            Sessionens signal
                        </p>
                        <div className="mt-4 space-y-4">
                            <div>
                                <div className="mb-1 flex justify-between text-sm font-semibold">
                                    <span>Fokus</span>
                                    <span>{focusPct}%</span>
                                </div>
                                <ProgressBar value={focusPct} tone={focusPct >= 70 ? 'emerald' : 'amber'} />
                            </div>
                            <div>
                                <div className="mb-1 flex justify-between text-sm font-semibold">
                                    <span>Snabba gissningar</span>
                                    <span>{rapidGuessPct}%</span>
                                </div>
                                <ProgressBar value={rapidGuessPct} tone={rapidGuessPct > 20 ? 'amber' : 'emerald'} />
                            </div>
                            <p className="text-sm leading-6 text-zinc-600 dark:text-white/60">
                                Målet är inte mer statistik. Målet är att hitta en rytm där du hinner tänka klart innan du svarar.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
                    <div className={surface('p-5 sm:p-6')}>
                        <div className="mb-4 flex items-center gap-2">
                            <Target className="h-5 w-5 text-blue-600 dark:text-blue-200" />
                            <h2 className="text-lg font-bold">Ämnen att lyfta</h2>
                        </div>
                        {priorityTopics.map((topic) => (
                            <TopicRow key={topic.topicId} topic={topic} />
                        ))}
                    </div>

                    <div id="modules" className={surface('p-5 sm:p-6')}>
                        <div className="mb-4 flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-200" />
                            <h2 className="text-lg font-bold">Nästa moduler</h2>
                        </div>
                        {nextModules.map((module) => (
                            <ModuleRow key={module.moduleId} module={module} />
                        ))}
                    </div>
                </section>

                {!progressProp && (
                    <p className="text-center text-xs text-zinc-500 dark:text-white/35">
                        Visar exempeldata tills riktiga studiedata kopplas in.
                    </p>
                )}
            </main>
        </div>
    );
}
