'use client';

/**
 * AnalyticsDashboard – root container for the three-module learning analytics.
 *
 * Module 1 – Descriptive  (DescriptiveSection)
 * Module 2 – Prescriptive (PrescriptiveSection)
 * Module 3 – Behavioural  (BehavioralSection)
 *
 * Also exports `generateMockData()` so the demo page can pass in realistic data
 * without a database round-trip.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DescriptiveSection from './DescriptiveSection';
import PrescriptiveSection from './PrescriptiveSection';
import BehavioralSection from './BehavioralSection';
import {
    StudentProgress,
    ModuleProgress,
    ErrorPattern,
    BehaviouralMetrics,
    BehaviouralDataPoint,
    FocusState,
    RAPID_GUESS_THRESHOLD_MS,
} from '@/types/analytics';

// ─────────────────────────────────────────────────────────────────────────────
// Tab definitions
// ─────────────────────────────────────────────────────────────────────────────

type TabId = 'descriptive' | 'prescriptive' | 'behavioural';

const TABS: { id: TabId; label: string; icon: string; description: string }[] = [
    {
        id: 'descriptive',
        label: 'Kunskapsläge',
        icon: '📊',
        description: 'Ämnesöversikt, radar och framsteg',
    },
    {
        id: 'prescriptive',
        label: 'Åtgärder',
        icon: '🎯',
        description: 'Felanalys och prioriterade uppgifter',
    },
    {
        id: 'behavioural',
        label: 'Beteende',
        icon: '🧠',
        description: 'Fokus, stress och sessionsmönster',
    },
];

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
            targetMastery: 3 + (i % 3 === 0 ? 1 : 0), // 3 or 4
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

    const errorPatterns: ErrorPattern[] = errorDefs.map((e, i) => {
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
    const SESSION_DURATION = 1200; // 20 minutes

    const focusStates: FocusState[] = ['focused', 'distracted', 'stressed'];

    // Build realistic data points with stress arc: calm → build → peak → taper
    const dataPoints: BehaviouralDataPoint[] = Array.from({ length: TOTAL_QUESTIONS }, (_, i) => {
        const t = i / TOTAL_QUESTIONS;
        // stress peaks around 60-70% through session
        const stressBase = t < 0.65
            ? t * 0.9            // rising
            : (1 - t) * 1.3;    // tapering
        const stressLevel = Math.min(1, Math.max(0, stressBase + (rng() - 0.5) * 0.25));

        const focusState: FocusState = stressLevel > 0.65
            ? 'stressed'
            : stressLevel > 0.35
                ? (rng() > 0.6 ? 'distracted' : 'focused')
                : 'focused';

        // Response time: stressed → faster (panic), distracted → slower
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

    return { studentProgress, moduleProgress, errorPatterns, behaviouralMetrics };
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface AnalyticsDashboardProps {
    /** If not provided the component will use mock data */
    studentProgress?: StudentProgress[];
    moduleProgress?: ModuleProgress[];
    errorPatterns?: ErrorPattern[];
    behaviouralMetrics?: BehaviouralMetrics;
    /** Override default seed used for mock data */
    mockSeed?: number;
    /** Initial tab to show */
    defaultTab?: TabId;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function AnalyticsDashboard({
    studentProgress: progressProp,
    moduleProgress: moduleProp,
    errorPatterns: errorProp,
    behaviouralMetrics: behaviouralProp,
    mockSeed = 42,
    defaultTab = 'descriptive',
}: AnalyticsDashboardProps) {
    const [activeTab, setActiveTab] = useState<TabId>(defaultTab);

    // Resolve data — real props take precedence over generated mock data
    const mock = generateMockData(mockSeed);
    const studentProgress = progressProp ?? mock.studentProgress;
    const moduleProgress = moduleProp ?? mock.moduleProgress;
    const errorPatterns = errorProp ?? mock.errorPatterns;
    const behaviouralMetrics = behaviouralProp ?? mock.behaviouralMetrics;

    return (
        <div className="w-full space-y-4">
            {/* ── Tab bar ─────────────────────────────────────────────────── */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 overflow-x-auto">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={[
                            'flex-1 min-w-[120px] flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                            activeTab === tab.id
                                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
                        ].join(' ')}
                    >
                        <span className="text-base leading-none">{tab.icon}</span>
                        <span className="leading-tight">{tab.label}</span>
                        <span className="text-[10px] font-normal text-gray-400 dark:text-gray-500 hidden sm:block leading-tight">
                            {tab.description}
                        </span>
                    </button>
                ))}
            </div>

            {/* ── Tab panels ──────────────────────────────────────────────── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}
                >
                    {activeTab === 'descriptive' && (
                        <DescriptiveSection
                            topics={studentProgress}
                            modules={moduleProgress}
                        />
                    )}
                    {activeTab === 'prescriptive' && (
                        <PrescriptiveSection
                            topics={studentProgress}
                            errorPatterns={errorPatterns}
                        />
                    )}
                    {activeTab === 'behavioural' && (
                        <BehavioralSection metrics={behaviouralMetrics} />
                    )}
                </motion.div>
            </AnimatePresence>

            {/* ── Footer note (demo only) ──────────────────────────────────── */}
            {!progressProp && (
                <p className="text-center text-[11px] text-gray-400 dark:text-gray-600">
                    Visar exempeldata · Koppla till riktiga API:er för att visa dina studiedata
                </p>
            )}
        </div>
    );
}
