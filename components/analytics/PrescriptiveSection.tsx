'use client';

/**
 * Module 2 – Prescriptive Analytics (Handlingsinriktad feedback)
 *
 * Design principle (Chunking):
 *  - The todo-list algorithm surfaces AT MOST 2 items, ranked by
 *    (severity × mastery deficit). Showing more would overwhelm.
 *  - Contextual message cards appear NEXT TO the data they reference,
 *    not in a separate "feedback panel".
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, CheckSquare, Clock, ArrowRight, AlertCircle, Brain, Calculator, BookOpen } from 'lucide-react';
import Link from 'next/link';
import type { ErrorPattern, PrescriptiveTodo, StudentProgress } from '@/types/analytics';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface PrescriptiveSectionProps {
    topics: StudentProgress[];
    errorPatterns: ErrorPattern[];
}

// ─────────────────────────────────────────────────────────────────────────────
// ALGORITHM – surfaces ≤ 2 critical todos
// ─────────────────────────────────────────────────────────────────────────────
// Score = severityWeight × (targetMastery – masteryLevel)
// Only the top-2 candidates are ever returned.

const SEVERITY_WEIGHT = { high: 3, medium: 2, low: 1 } as const;

const ERROR_ICONS: Record<string, React.ElementType> = {
    conceptual:     Brain,
    procedural:     BookOpen,
    computational:  Calculator,
    interpretation: AlertCircle,
    notation:       AlertCircle,
    incomplete:     AlertCircle,
    time_pressure:  Clock,
};

const ERROR_COLORS: Record<string, string> = {
    conceptual:     'blue',
    procedural:     'purple',
    computational:  'red',
    interpretation: 'amber',
    notation:       'amber',
    incomplete:     'orange',
    time_pressure:  'indigo',
};

const BG: Record<string, string> = {
    blue:   'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700/50',
    red:    'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50',
    amber:  'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700/50',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700/50',
};

const TEXT: Record<string, string> = {
    blue:   'text-blue-700 dark:text-blue-300',
    purple: 'text-purple-700 dark:text-purple-300',
    red:    'text-red-700 dark:text-red-300',
    amber:  'text-amber-700 dark:text-amber-300',
    orange: 'text-orange-700 dark:text-orange-300',
    indigo: 'text-indigo-700 dark:text-indigo-300',
};

const ICON_BG: Record<string, string> = {
    blue:   'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-200',
    purple: 'bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-200',
    red:    'bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-200',
    amber:  'bg-amber-100 dark:bg-amber-800 text-amber-600 dark:text-amber-200',
    orange: 'bg-orange-100 dark:bg-orange-800 text-orange-600 dark:text-orange-200',
    indigo: 'bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-200',
};

function buildTodos(
    topics: StudentProgress[],
    errorPatterns: ErrorPattern[],
): PrescriptiveTodo[] {
    if (errorPatterns.length === 0) return [];

    // Score each error pattern
    type Candidate = { pattern: ErrorPattern; score: number; affectedTopic: StudentProgress | undefined };
    const candidates: Candidate[] = errorPatterns.map(p => {
        const w = SEVERITY_WEIGHT[p.severity];
        // Find worst-affected topic
        const affectedTopic = topics
            .filter(t => p.affectedTopics.includes(t.topicId))
            .sort((a, b) => (b.targetMastery - b.masteryLevel) - (a.targetMastery - a.masteryLevel))[0];

        const masteryDeficit = affectedTopic
            ? Math.max(0, affectedTopic.targetMastery - affectedTopic.masteryLevel)
            : 0;

        return { pattern: p, score: w * (masteryDeficit + 1), affectedTopic };
    });

    // Sort by score desc, take TOP 2 ONLY (Chunking principle)
    return candidates
        .sort((a, b) => b.score - a.score)
        .slice(0, 2)
        .map(({ pattern, affectedTopic }, i) => ({
            id: `todo-${i}`,
            rank: (i + 1) as 1 | 2,
            title: buildTitle(pattern, affectedTopic),
            description: pattern.actionableMessage,
            href: affectedTopic ? `/practice?topic=${affectedTopic.topicId}&focus=${pattern.type}` : '/practice',
            estMinutes: pattern.severity === 'high' ? 20 : pattern.severity === 'medium' ? 12 : 8,
            drivenBy: pattern.type,
            difficulty: pattern.severity === 'high' ? 'medium' : 'easy' as const,
        }));
}

function buildTitle(pattern: ErrorPattern, topic?: StudentProgress): string {
    const topicStr = topic ? ` i ${topic.topicName}` : '';
    const labels: Record<string, string> = {
        conceptual:     `Repetera grundbegreppen${topicStr}`,
        procedural:     `Öva metodval${topicStr}`,
        computational:  `Kontrollträning${topicStr}`,
        interpretation: `Läsförmåga – tolka uppgifter rätt`,
        notation:       `Rätta notationsfel${topicStr}`,
        incomplete:     `Fullständiga svar${topicStr}`,
        time_pressure:  `Tempokontroll – sakta ner`,
    };
    return labels[pattern.type] ?? `Förbättra${topicStr}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION CONTAINER
// ─────────────────────────────────────────────────────────────────────────────

export default function PrescriptiveSection({ topics, errorPatterns }: PrescriptiveSectionProps) {
    const todos = useMemo(() => buildTodos(topics, errorPatterns), [topics, errorPatterns]);

    if (errorPatterns.length === 0) return null;

    return (
        <section className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                        Handlingsinriktad Feedback
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Identifierade felmönster och dina {todos.length} viktigaste nästa steg
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Left: Error pattern cards — rendered next to their data */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                        Identifierade mönster
                    </h3>
                    {errorPatterns.slice(0, 4).map((pattern, i) => (
                        <ErrorPatternCard key={pattern.type} pattern={pattern} index={i} />
                    ))}
                </div>

                {/* Right: Auto-generated todo list — max 2 items (Chunking) */}
                <div>
                    <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3">
                        Dina {todos.length} prioriterade övningar
                    </h3>
                    {todos.length > 0 ? (
                        <div className="space-y-3">
                            {todos.map(todo => (
                                <TodoCard key={todo.id} todo={todo} />
                            ))}
                            {/* Note explaining the chunking */}
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center italic pt-1">
                                Listan begränsas till max 2 uppgifter för att undvika kognitiv överbelastning.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-zinc-400 dark:text-zinc-500 text-sm">
                            <CheckSquare className="w-8 h-8 mb-2 text-emerald-400" />
                            Inga kritiska prioriteringar just nu!
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ERROR PATTERN CARD
// Rendered contextually — directly adjacent to the affected data.
// ─────────────────────────────────────────────────────────────────────────────

function ErrorPatternCard({ pattern, index }: { pattern: ErrorPattern; index: number }) {
    const color = ERROR_COLORS[pattern.type] ?? 'amber';
    const Icon = ERROR_ICONS[pattern.type] ?? AlertCircle;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className={`p-4 rounded-xl border ${BG[color]}`}
        >
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${ICON_BG[color]} shrink-0`}>
                    <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className={`text-[11px] font-bold uppercase tracking-wide ${TEXT[color]}`}>
                            {labelForType(pattern.type)}
                        </span>
                        <SeverityBadge severity={pattern.severity} />
                    </div>
                    {/* Contextual message — rendered inline, next to its data */}
                    <p className={`text-[12px] leading-relaxed ${TEXT[color]}`}>
                        {pattern.actionableMessage}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-500 dark:text-zinc-400">
                        <span>{pattern.frequency} fel i perioden</span>
                        <span>·</span>
                        <span>{Math.round(pattern.share * 100)}% av alla fel</span>
                        {pattern.affectedTopics.length > 0 && (
                            <>
                                <span>·</span>
                                <span className="truncate">{pattern.affectedTopics[0]}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function labelForType(type: string): string {
    const labels: Record<string, string> = {
        conceptual:     'Konceptuellt fel',
        procedural:     'Fel metod/procedur',
        computational:  'Beräkningsfel',
        interpretation: 'Feltolkad fråga',
        notation:       'Notationsfel',
        incomplete:     'Ofullständig lösning',
        time_pressure:  'Tidsbrist',
    };
    return labels[type] ?? type;
}

function SeverityBadge({ severity }: { severity: 'low' | 'medium' | 'high' }) {
    const styles = {
        high:   'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
        medium: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
        low:    'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300',
    };
    const labels = { high: 'Hög', medium: 'Medel', low: 'Låg' };
    return (
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${styles[severity]}`}>
            {labels[severity]}
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TODO CARD  (max 2 rendered)
// ─────────────────────────────────────────────────────────────────────────────

function TodoCard({ todo }: { todo: PrescriptiveTodo }) {
    const color = ERROR_COLORS[todo.drivenBy] ?? 'amber';
    const Icon = ERROR_ICONS[todo.drivenBy] ?? CheckSquare;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: todo.rank * 0.1 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
        >
            <div className="flex items-center gap-0 p-4">
                {/* Rank indicator */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ICON_BG[color]}`}>
                    <span className="text-sm font-bold">{todo.rank}</span>
                </div>

                <div className="flex-1 min-w-0 ml-3">
                    <div className="flex items-center gap-2 mb-0.5">
                        <Icon className={`w-3.5 h-3.5 ${TEXT[color]}`} />
                        <span className="text-[13px] font-bold text-zinc-900 dark:text-white truncate">
                            {todo.title}
                        </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                        {todo.description}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-zinc-400">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            ~{todo.estMinutes} min
                        </span>
                        <span>·</span>
                        <span>{todo.difficulty === 'easy' ? 'Lagom' : todo.difficulty === 'medium' ? 'Måttlig' : 'Utmanande'} svårighet</span>
                    </div>
                </div>

                <Link
                    href={todo.href}
                    className={`shrink-0 ml-3 flex items-center gap-1 px-3 py-2 rounded-xl text-[11px] font-semibold transition-colors ${ICON_BG[color]} hover:opacity-90`}
                >
                    Starta <ArrowRight className="w-3 h-3" />
                </Link>
            </div>
        </motion.div>
    );
}
