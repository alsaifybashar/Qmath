'use client';

/**
 * AnalyticsDashboard – root container for the learning analytics page.
 *
 * Layout: a single scrolling experience with a hero strip at the top,
 * followed by three progressively-revealed sections:
 *   1. Descriptive  (DescriptiveSection)  — Kunskapsläge
 *   2. Prescriptive (PrescriptiveSection) — Åtgärder
 *   3. Behavioural  (BehavioralSection)   — Beteende
 *
 * Exports `generateMockData()` so the demo page can pass in realistic data
 * without a database round-trip.
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    StudentProgress,
    ModuleProgress,
    ErrorPattern,
    BehaviouralMetrics,
    BehaviouralDataPoint,
    FocusState,
    GamificationData,
    AchievementBadgeData,
    percentToStage,
    RAPID_GUESS_THRESHOLD_MS,
} from '@/types/analytics';
import {
    AlertTriangle,
    Brain,
    CheckCircle2,
    Clock,
    Flame,
    Gauge,
    Play,
    ShieldCheck,
    Sparkles,
    Target,
    Trophy,
    Zap,
} from 'lucide-react';
import Link from 'next/link';
import PsychInsightsPanel from './PsychInsightsPanel';

// ─────────────────────────────────────────────────────────────────────────────
// Mock data factory
// ─────────────────────────────────────────────────────────────────────────────

/** Deterministic seeded pseudo-random (no external dep) */
function seededRng(seed: number) {
    let s = seed;
    return () => {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        return (s >>> 0) / 0x100000000;
    };
}

export interface AnalyticsMockData {
    studentProgress: StudentProgress[];
    moduleProgress: ModuleProgress[];
    errorPatterns: ErrorPattern[];
    behaviouralMetrics: BehaviouralMetrics;
    gamification: GamificationData;
}

export function generateMockData(seed = 42): AnalyticsMockData {
    const rng = seededRng(seed);

    // ── Student Progress (per-topic) ──────────────────────────────────────────
    const topicDefs: Array<{ id: string; name: string; subject: string }> = [
        { id: 'vectors', name: 'Vektorer', subject: 'Linjär algebra' },
        { id: 'matrices', name: 'Matriser', subject: 'Linjär algebra' },
        { id: 'determinants', name: 'Determinanter', subject: 'Linjär algebra' },
        { id: 'eigenvalues', name: 'Egenvärden', subject: 'Linjär algebra' },
        { id: 'limits', name: 'Gränsvärden', subject: 'Analys' },
        { id: 'derivatives', name: 'Derivata', subject: 'Analys' },
        { id: 'integrals', name: 'Integraler', subject: 'Analys' },
        { id: 'series', name: 'Serier', subject: 'Analys' },
        { id: 'ode', name: 'Differentialekvationer', subject: 'Analys' },
        { id: 'feedback', name: 'Återkoppling', subject: 'Reglerteknik' },
        { id: 'pid', name: 'PID-reglering', subject: 'Reglerteknik' },
        { id: 'bode', name: 'Bodediagram', subject: 'Reglerteknik' },
    ];

    const now = new Date();

    const studentProgress: StudentProgress[] = topicDefs.map((t, i) => {
        const mastery = Math.min(5, Math.max(0, Math.round(rng() * 5)));
        const classAvg = Math.min(5, Math.max(0, Math.round(rng() * 5)));
        const accuracy = 0.3 + rng() * 0.65;
        const attempts = 5 + Math.floor(rng() * 40);

        const weeklyAccuracy: (number | null)[] = Array.from({ length: 7 }, () => {
            const r = rng();
            return r < 0.3 ? null : Math.round((0.3 + rng() * 0.65) * 100) / 100;
        });

        const daysAgo = Math.floor(rng() * 14);
        const lastPracticed = new Date(now.getTime() - daysAgo * 86400000);

        return {
            topicId: t.id,
            topicName: t.name,
            masteryLevel: mastery,
            targetMastery: 3 + (i % 3 === 0 ? 1 : 0),
            classAvgMastery: classAvg,
            attempts,
            accuracy,
            lastPracticed,
            weeklyAccuracy,
            subject: t.subject,
        };
    });

    // ── Module Progress ───────────────────────────────────────────────────────
    const moduleDefs = [
        { id: 'mod1', name: 'Linjär algebra – Vektorer & Matriser', total: 40 },
        { id: 'mod2', name: 'Linjär algebra – Egenvärden & Rum', total: 30 },
        { id: 'mod3', name: 'Envariabelanalys – Gränsvärden & Derivata', total: 50 },
        { id: 'mod4', name: 'Envariabelanalys – Integraler & Serier', total: 45 },
        { id: 'mod5', name: 'Reglerteknik – Grundkoncept', total: 35 },
    ];

    const moduleProgress: ModuleProgress[] = moduleDefs.map(m => {
        const attempted = Math.floor(rng() * m.total);
        return {
            moduleId: m.id,
            moduleName: m.name,
            progress: Math.round((attempted / m.total) * 100),
            required: 60 + Math.floor(rng() * 20),
            questionsAttempted: attempted,
            questionsTotal: m.total,
            estMinutes: Math.round((m.total - attempted) * 2.5),
        };
    });

    // ── Error Patterns ────────────────────────────────────────────────────────
    const errorDefs: Array<{
        type: ErrorPattern['type'];
        severity: ErrorPattern['severity'];
        msg: string;
    }> = [
        {
            type: 'conceptual',
            severity: 'high',
            msg: 'Du blandar ihop egenvektorer med egenvärden. Läs teorin en gång till och testa sedan igen.',
        },
        {
            type: 'computational',
            severity: 'medium',
            msg: 'Räknefel uppstår framför allt i matrixmultiplikation. Kontrollera varje steg separat.',
        },
        {
            type: 'time_pressure',
            severity: 'high',
            msg: 'Under tentaliknande förhållanden ökar felfrekvensen markant – träna på tidspress.',
        },
        {
            type: 'notation',
            severity: 'low',
            msg: 'Inkonsekvent notation leder till poängavdrag. Använd kursens notation genomgående.',
        },
    ];

    const totalErrors = 80 + Math.floor(rng() * 60);

    const errorPatterns: ErrorPattern[] = errorDefs.map(e => {
        const freq = Math.floor(rng() * 30) + 5;
        const daysAgo = Math.floor(rng() * 7);
        return {
            type: e.type,
            frequency: freq,
            share: freq / totalErrors,
            mostRecentAt: new Date(now.getTime() - daysAgo * 86400000),
            affectedTopics: topicDefs
                .filter(() => rng() > 0.6)
                .slice(0, 3)
                .map(t => t.id),
            severity: e.severity,
            actionableMessage: e.msg,
        };
    });

    // ── Behavioural Metrics ───────────────────────────────────────────────────
    const TOTAL_QUESTIONS = 25;
    const SESSION_DURATION = 1200;

    const dataPoints: BehaviouralDataPoint[] = Array.from({ length: TOTAL_QUESTIONS }, (_, i) => {
        const t = i / TOTAL_QUESTIONS;
        const stressBase = t < 0.65
            ? t * 0.9
            : (1 - t) * 1.3;
        const stressLevel = Math.min(1, Math.max(0, stressBase + (rng() - 0.5) * 0.25));

        const focusState: FocusState = stressLevel > 0.65
            ? 'stressed'
            : stressLevel > 0.35
                ? (rng() > 0.6 ? 'distracted' : 'focused')
                : 'focused';

        const baseRt = focusState === 'stressed'
            ? 4000 - stressLevel * 2000
            : focusState === 'distracted'
                ? 8000 + rng() * 6000
                : 5000 + rng() * 4000;
        const responseTimeMs = Math.max(800, Math.round(baseRt + (rng() - 0.5) * 2000));
        const isRapidGuess = responseTimeMs < RAPID_GUESS_THRESHOLD_MS && rng() > 0.3;
        const isCorrect = rng() > (stressLevel * 0.4 + 0.2);

        const questionTypes: BehaviouralDataPoint['questionType'][] = [
            'multiple_choice', 'numeric', 'proof_step',
        ];

        return {
            elapsedSeconds: Math.round((i / TOTAL_QUESTIONS) * SESSION_DURATION),
            responseTimeMs,
            isRapidGuess,
            interactionScore: 0.3 + rng() * 0.7,
            focusState,
            stressLevel,
            questionType: questionTypes[Math.floor(rng() * 3)],
            isCorrect,
        };
    });

    const rapidGuessCount = dataPoints.filter(p => p.isRapidGuess).length;
    const avgResponseMs = Math.round(
        dataPoints.reduce((s, p) => s + p.responseTimeMs, 0) / dataPoints.length,
    );
    const peakStressPoint = dataPoints.reduce((prev, cur) =>
        cur.stressLevel > prev.stressLevel ? cur : prev,
    );

    const focusedCount = dataPoints.filter(p => p.focusState === 'focused').length;
    const distractedCount = dataPoints.filter(p => p.focusState === 'distracted').length;
    const stressedCount = dataPoints.filter(p => p.focusState === 'stressed').length;

    const sessionStart = new Date(now.getTime() - SESSION_DURATION * 1000 - 3600000);

    const behaviouralMetrics: BehaviouralMetrics = {
        sessionId: `mock-${seed}`,
        sessionStart,
        durationSeconds: SESSION_DURATION,
        dataPoints,
        summary: {
            avgResponseMs,
            rapidGuessCount,
            rapidGuessShare: rapidGuessCount / TOTAL_QUESTIONS,
            avgStressLevel: dataPoints.reduce((s, p) => s + p.stressLevel, 0) / TOTAL_QUESTIONS,
            peakStressAt: peakStressPoint.elapsedSeconds,
            focusedShare: focusedCount / TOTAL_QUESTIONS,
            distractedShare: distractedCount / TOTAL_QUESTIONS,
            stressedShare: stressedCount / TOTAL_QUESTIONS,
        },
    };

    // ── Gamification ──────────────────────────────────────────────────────────
    const avgMastery =
        studentProgress.reduce((s, t) => s + t.masteryLevel, 0) / studentProgress.length;
    const examReadinessPct = Math.round(Math.min(100, Math.max(0, (avgMastery / 5) * 100)));

    const xp = 800 + Math.floor(rng() * 1200);
    const weeklyXp = 80 + Math.floor(rng() * 200);
    const streakDays = 3 + Math.floor(rng() * 22);
    const longestStreak = Math.max(streakDays, streakDays + Math.floor(rng() * 10));
    const totalAttempts = studentProgress.reduce((s, t) => s + t.attempts, 0);
    const masteredTopics = studentProgress.filter(t => t.masteryLevel >= 4).length;
    const focusedShare = behaviouralMetrics.summary.focusedShare;

    const achievements: AchievementBadgeData[] = [
        {
            id: 'veckokrigare',
            name: 'Veckokrigare',
            description: 'Plugga 7 dagar i rad.',
            icon: 'flame',
            unlocked: longestStreak >= 7,
            progress: longestStreak >= 7 ? undefined : { current: longestStreak, target: 7 },
        },
        {
            id: 'manadsmastare',
            name: 'Månadsmästare',
            description: 'Plugga 30 dagar i rad.',
            icon: 'trophy',
            unlocked: longestStreak >= 30,
            progress: longestStreak >= 30 ? undefined : { current: longestStreak, target: 30 },
        },
        {
            id: 'fokusstjarna',
            name: 'Fokusstjärna',
            description: 'Håll över 70% fokus i en session.',
            icon: 'star',
            unlocked: focusedShare >= 0.7,
            progress: focusedShare >= 0.7
                ? undefined
                : { current: Math.round(focusedShare * 100), target: 70 },
        },
        {
            id: 'tempo',
            name: 'Tempokänsla',
            description: 'Genomför 100 frågor totalt.',
            icon: 'shield',
            unlocked: totalAttempts >= 100,
            progress: totalAttempts >= 100 ? undefined : { current: totalAttempts, target: 100 },
        },
        {
            id: 'precision',
            name: 'Precision',
            description: 'Bemästra minst 3 ämnen.',
            icon: 'target',
            unlocked: masteredTopics >= 3,
            progress: masteredTopics >= 3 ? undefined : { current: masteredTopics, target: 3 },
        },
        {
            id: 'redo',
            name: 'Redo för tenta',
            description: 'Nå 90% tentaklarhet.',
            icon: 'sparkles',
            unlocked: examReadinessPct >= 90,
            progress: examReadinessPct >= 90
                ? undefined
                : { current: examReadinessPct, target: 90 },
        },
    ];

    const gamification: GamificationData = {
        xp,
        weeklyXp,
        streakDays,
        longestStreak,
        examReadinessPct,
        achievements,
    };

    return {
        studentProgress,
        moduleProgress,
        errorPatterns,
        behaviouralMetrics,
        gamification,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline helpers — keep layout-glue local, no extra files
// ─────────────────────────────────────────────────────────────────────────────

function glass(className = '') {
    return [
        'rounded-2xl border border-black/10 bg-white text-zinc-950 shadow-md shadow-black/5',
        'dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:shadow-black/25',
        className,
    ].join(' ');
}

function actionTitle(pattern: ErrorPattern) {
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

function MiniMetric({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
}) {
    return (
        <div className={glass('p-4')}>
            <Icon className="mb-3 h-5 w-5 text-blue-600 dark:text-blue-300" />
            <p className="text-[11px] font-bold uppercase text-zinc-500 dark:text-white/45">{label}</p>
            <p className="mt-1 text-lg font-bold text-zinc-950 dark:text-white">{value}</p>
        </div>
    );
}

function TopicFocusRow({ topic }: { topic: StudentProgress }) {
    const targetPct = Math.max(5, Math.min(100, (topic.masteryLevel / Math.max(topic.targetMastery, 1)) * 100));

    return (
        <div className="rounded-xl border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-zinc-950 dark:text-white">{topic.topicName}</h3>
                    <p className="text-xs text-zinc-500 dark:text-white/45">{topic.subject}</p>
                </div>
                <span className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-bold text-zinc-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70">
                    {Math.round(topic.accuracy * 100)}%
                </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
                <div
                    className="h-full origin-left rounded-full bg-blue-600 transition-transform duration-500 ease-out dark:bg-blue-300"
                    style={{ transform: `scaleX(${targetPct / 100})` }}
                />
            </div>
        </div>
    );
}

function InsightLine({
    icon: Icon,
    label,
    value,
    tone,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    tone: 'emerald' | 'amber' | 'blue';
}) {
    const toneClass = {
        emerald: 'text-emerald-200 bg-emerald-400/10 border-emerald-300/20',
        amber: 'text-amber-200 bg-amber-400/10 border-amber-300/20',
        blue: 'text-blue-200 bg-blue-400/10 border-blue-300/20',
    }[tone];

    return (
        <div className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${toneClass}`}>
            <span className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
            </span>
            <span className="text-sm font-bold text-zinc-950 dark:text-white">{value}</span>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Props & main component
// ─────────────────────────────────────────────────────────────────────────────

export interface AnalyticsDashboardProps {
    studentProgress?: StudentProgress[];
    moduleProgress?: ModuleProgress[];
    errorPatterns?: ErrorPattern[];
    behaviouralMetrics?: BehaviouralMetrics;
    gamification?: GamificationData;
    /** Override default seed used for mock data */
    mockSeed?: number;
    /** Optional student first name for hero greeting */
    studentName?: string;
}

export default function AnalyticsDashboard({
    studentProgress: progressProp,
    moduleProgress: moduleProp,
    errorPatterns: errorProp,
    behaviouralMetrics: behaviouralProp,
    gamification: gamificationProp,
    mockSeed = 42,
    studentName,
}: AnalyticsDashboardProps) {
    const mock = useMemo(() => generateMockData(mockSeed), [mockSeed]);
    const studentProgress = progressProp ?? mock.studentProgress;
    const moduleProgress = moduleProp ?? mock.moduleProgress;
    const errorPatterns = errorProp ?? mock.errorPatterns;
    const behaviouralMetrics = behaviouralProp ?? mock.behaviouralMetrics;
    const gamification = gamificationProp ?? mock.gamification;

    const stage = percentToStage(gamification.examReadinessPct);
    const stageLabel = { grund: 'Grund', god: 'God', stabil: 'Stabil', redo: 'Redo' }[stage];
    const unlockedAchievements = gamification.achievements.filter((a) => a.unlocked).length;
    const weakestTopics = [...studentProgress]
        .sort((a, b) => {
            const deficitA = Math.max(0, a.targetMastery - a.masteryLevel);
            const deficitB = Math.max(0, b.targetMastery - b.masteryLevel);
            return deficitB - deficitA || a.accuracy - b.accuracy;
        })
        .slice(0, 3);
    const topModule = [...moduleProgress].sort((a, b) => a.progress - b.progress)[0];
    const topPattern = [...errorPatterns].sort((a, b) => {
        const severity = { high: 3, medium: 2, low: 1 };
        return severity[b.severity] * b.share - severity[a.severity] * a.share;
    })[0];
    const focusPct = Math.round(behaviouralMetrics.summary.focusedShare * 100);
    const rapidGuessPct = Math.round(behaviouralMetrics.summary.rapidGuessShare * 100);
    const firstName = studentName ? `, ${studentName}` : '';

    return (
        <div className="w-full space-y-4 text-zinc-950 dark:text-white">
            <motion.section
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className={glass('p-5 sm:p-6')}
            >
                <div className="grid gap-6 lg:grid-cols-[1fr_280px] lg:items-center">
                    <div>
                        <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 dark:border-blue-200/20 dark:bg-blue-300/10 dark:text-blue-100">
                            <Sparkles className="h-3.5 w-3.5" />
                            Läranalys
                        </div>
                        <h1 className="text-3xl font-bold tracking-normal sm:text-4xl">
                            Nästa tydliga steg{firstName}
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-white/60">
                            Här visas bara det som hjälper dig plugga bättre nu: beredskap, fokus och en prioriterad åtgärd.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm dark:border-blue-300/20 dark:bg-blue-400/10">
                        <div className="mb-3 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-300/15 dark:text-blue-100">
                                <Trophy className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-blue-700 dark:text-blue-200">Tentaklarhet</p>
                                <p className="text-2xl font-bold">{gamification.examReadinessPct}%</p>
                            </div>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-blue-200/70 dark:bg-white/10">
                            <div
                                className="h-full origin-left rounded-full bg-blue-600 transition-transform duration-500 ease-out dark:bg-blue-300"
                                style={{ transform: `scaleX(${gamification.examReadinessPct / 100})` }}
                            />
                        </div>
                        <p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-white/75">{stageLabel}</p>
                    </div>
                </div>
            </motion.section>

            <section className={glass('p-4 sm:p-5')}>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-300/25 dark:bg-blue-400/15 dark:text-blue-100">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase text-blue-700 dark:text-blue-200">Gör detta först</p>
                            <h2 className="mt-1 text-xl font-bold">{topPattern ? actionTitle(topPattern) : 'Fortsätt med adaptiv träning'}</h2>
                            <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-white/60">
                                {topPattern?.actionableMessage ?? 'Systemet har inget tydligt felmönster just nu. Fortsätt med nästa träningspass.'}
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/study"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                    >
                        Starta träning
                        <Play className="h-4 w-4 fill-current" />
                    </Link>
                </div>
            </section>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MiniMetric icon={Flame} label="Streak" value={`${gamification.streakDays} dagar`} />
                <MiniMetric icon={Zap} label="Veckans XP" value={`+${gamification.weeklyXp}`} />
                <MiniMetric icon={Brain} label="Fokus" value={`${focusPct}%`} />
                <MiniMetric icon={ShieldCheck} label="Badges" value={`${unlockedAchievements}/${gamification.achievements.length}`} />
            </div>

            <PsychInsightsPanel
                input={{
                    topics: studentProgress,
                    metrics: behaviouralMetrics,
                    errorPatterns,
                }}
            />

            <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
                <section className={glass('p-4')}>
                    <div className="mb-3 flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-600 dark:text-blue-200" />
                        <h2 className="text-base font-bold">Ämnen att lyfta</h2>
                    </div>
                    <div className="space-y-2">
                        {weakestTopics.map((topic) => (
                            <TopicFocusRow key={topic.topicId} topic={topic} />
                        ))}
                    </div>
                </section>

                <section className={glass('p-4')}>
                    <div className="mb-3 flex items-center gap-2">
                        <Gauge className="h-5 w-5 text-blue-600 dark:text-blue-200" />
                        <h2 className="text-base font-bold">Sessionens signal</h2>
                    </div>
                    <div className="space-y-3">
                        <InsightLine
                            icon={Clock}
                            label="Snabba gissningar"
                            value={`${rapidGuessPct}%`}
                            tone={rapidGuessPct > 20 ? 'amber' : 'emerald'}
                        />
                        {topModule && (
                            <InsightLine
                                icon={AlertTriangle}
                                label="Lägst modulprogress"
                                value={`${topModule.progress}%`}
                                tone="blue"
                            />
                        )}
                        <p className="rounded-xl border border-black/10 bg-zinc-50 p-3 text-sm leading-6 text-zinc-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
                            Håll fokus på ett område i taget. När nästa pass är klart kan analysen visa fler detaljer.
                        </p>
                    </div>
                </section>
            </div>

            {!progressProp && (
                <p className="text-center text-[11px] text-zinc-500 dark:text-white/35">
                    Visar exempeldata · Koppla till riktiga API:er för att visa dina studiedata
                </p>
            )}
        </div>
    );
}
