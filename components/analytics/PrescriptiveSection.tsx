'use client';

/**
 * Module 2 – Prescriptive Analytics (Handlingsinriktad feedback)
 *
 * Design principles (Chunking + minimal red):
 *  - The todo-list algorithm surfaces AT MOST 2 items, ranked by
 *    (severity × mastery deficit).
 *  - The top todo is rendered as a "Gör detta först" hero card.
 *  - Glassmorphic chrome matches the rest of /analytics.
 *  - Severity styling uses amber for high/medium — never red — per design_principer.md.
 */

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, CheckSquare, Clock, ArrowRight, AlertCircle,
    Brain, Calculator, BookOpen, Sparkles, HelpCircle,
} from 'lucide-react';
import Link from 'next/link';
import type { ErrorPattern, PrescriptiveTodo, StudentProgress } from '@/types/analytics';

const GLASS_CARD =
    'bg-white/55 dark:bg-zinc-950/55 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-3xl shadow-elevation-3';

const SOFT_GLASS =
    'bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface PrescriptiveSectionProps {
    topics: StudentProgress[];
    errorPatterns: ErrorPattern[];
}

// ─────────────────────────────────────────────────────────────────────────────
// ALGORITHM
// ─────────────────────────────────────────────────────────────────────────────

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
    computational:  'amber',
    interpretation: 'amber',
    notation:       'amber',
    incomplete:     'amber',
    time_pressure:  'indigo',
};

const BG: Record<string, string> = {
    blue:   'bg-blue-50/60 dark:bg-blue-900/20 border-blue-200/60 dark:border-blue-700/40',
    purple: 'bg-purple-50/60 dark:bg-purple-900/20 border-purple-200/60 dark:border-purple-700/40',
    amber:  'bg-amber-50/60 dark:bg-amber-900/20 border-amber-200/60 dark:border-amber-700/40',
    indigo: 'bg-indigo-50/60 dark:bg-indigo-900/20 border-indigo-200/60 dark:border-indigo-700/40',
    emerald:'bg-emerald-50/60 dark:bg-emerald-900/20 border-emerald-200/60 dark:border-emerald-700/40',
};

const TEXT: Record<string, string> = {
    blue:   'text-blue-700 dark:text-blue-300',
    purple: 'text-purple-700 dark:text-purple-300',
    amber:  'text-amber-700 dark:text-amber-300',
    indigo: 'text-indigo-700 dark:text-indigo-300',
    emerald:'text-emerald-700 dark:text-emerald-300',
};

const ICON_BG: Record<string, string> = {
    blue:   'bg-blue-100 dark:bg-blue-800/60 text-blue-600 dark:text-blue-200',
    purple: 'bg-purple-100 dark:bg-purple-800/60 text-purple-600 dark:text-purple-200',
    amber:  'bg-amber-100 dark:bg-amber-800/60 text-amber-600 dark:text-amber-200',
    indigo: 'bg-indigo-100 dark:bg-indigo-800/60 text-indigo-600 dark:text-indigo-200',
    emerald:'bg-emerald-100 dark:bg-emerald-800/60 text-emerald-600 dark:text-emerald-200',
};

function buildTodos(
    topics: StudentProgress[],
    errorPatterns: ErrorPattern[],
): Array<PrescriptiveTodo & { pattern: ErrorPattern; affectedTopic?: StudentProgress }> {
    if (errorPatterns.length === 0) return [];

    type Candidate = { pattern: ErrorPattern; score: number; affectedTopic?: StudentProgress };
    const candidates: Candidate[] = errorPatterns.map(p => {
        const w = SEVERITY_WEIGHT[p.severity];
        const affectedTopic = topics
            .filter(t => p.affectedTopics.includes(t.topicId))
            .sort((a, b) => (b.targetMastery - b.masteryLevel) - (a.targetMastery - a.masteryLevel))[0];

        const masteryDeficit = affectedTopic
            ? Math.max(0, affectedTopic.targetMastery - affectedTopic.masteryLevel)
            : 0;

        return { pattern: p, score: w * (masteryDeficit + 1), affectedTopic };
    });

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
            pattern,
            affectedTopic,
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

    const heroTodo = todos[0];
    const secondaryTodo = todos[1];

    return (
        <section className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-elevation-2">
                    <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                        Dina nästa steg
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Två prioriteringar — det enda du behöver fokusera på just nu
                    </p>
                </div>
            </div>

            {/* Hero todo */}
            {heroTodo && <HeroTodoCard todo={heroTodo} />}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Left: secondary todo + chunking note */}
                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                        Andra prioritet
                    </h4>
                    {secondaryTodo ? (
                        <TodoCard todo={secondaryTodo} delay={0.12} />
                    ) : (
                        <div className={`${SOFT_GLASS} p-5 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 text-sm`}>
                            <CheckSquare className="w-8 h-8 mb-2 text-emerald-400" />
                            En sak räcker just nu — fokusera på första prioriteringen.
                        </div>
                    )}
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 italic pt-1 px-1">
                        Vi begränsar till max två uppgifter för att hålla fokus.
                    </p>
                </div>

                {/* Right: identified patterns */}
                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                        Mönster vi har sett
                    </h4>
                    {errorPatterns.slice(0, 4).map((pattern, i) => (
                        <ErrorPatternCard key={pattern.type} pattern={pattern} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO TODO CARD — "Gör detta först"
// ─────────────────────────────────────────────────────────────────────────────

function HeroTodoCard({
    todo,
}: {
    todo: PrescriptiveTodo & { pattern: ErrorPattern; affectedTopic?: StudentProgress };
}) {
    const color = ERROR_COLORS[todo.drivenBy] ?? 'amber';
    const Icon = ERROR_ICONS[todo.drivenBy] ?? CheckSquare;
    const [whyOpen, setWhyOpen] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className={`${GLASS_CARD} relative overflow-hidden`}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-accent-500/10 pointer-events-none" />
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-gradient-to-br from-primary-400/20 to-accent-400/10 blur-2xl pointer-events-none" />

            <div className="relative p-6 md:p-7">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={14} className="text-amber-500" />
                    <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-primary-700 dark:text-primary-300">
                        Gör detta först
                    </span>
                </div>

                <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${ICON_BG[color]}`}>
                        <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white leading-tight">
                            {todo.title}
                        </h4>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mt-2">
                            {todo.description}
                        </p>

                        <div className="flex items-center gap-3 mt-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> ~{todo.estMinutes} min
                            </span>
                            <span>·</span>
                            <span>Lagom svårighet</span>
                            {todo.affectedTopic && (
                                <>
                                    <span>·</span>
                                    <span className="truncate">{todo.affectedTopic.topicName}</span>
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-3 mt-5 flex-wrap">
                            <Link
                                href={todo.href}
                                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-sm font-semibold bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-elevation-3 hover:shadow-glow transition-shadow animate-glow-pulse"
                            >
                                Starta nu <ArrowRight className="w-4 h-4" />
                            </Link>
                            <button
                                type="button"
                                onClick={() => setWhyOpen(o => !o)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-900/60 transition-colors"
                            >
                                <HelpCircle className="w-3.5 h-3.5" />
                                {whyOpen ? 'Dölj' : 'Varför?'}
                            </button>
                        </div>

                        <AnimatePresence initial={false}>
                            {whyOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                    className="overflow-hidden"
                                >
                                    <div className={`mt-4 p-3 rounded-2xl text-xs leading-relaxed ${BG[color]} ${TEXT[color]}`}>
                                        Vi har sett {todo.pattern.frequency} fel av typen{' '}
                                        <strong>{labelForType(todo.pattern.type).toLowerCase()}</strong>
                                        {todo.pattern.share > 0 && (
                                            <> — {Math.round(todo.pattern.share * 100)}% av alla fel i perioden</>
                                        )}
                                        {todo.pattern.affectedTopics.length > 0 && (
                                            <>. Berör främst: {todo.pattern.affectedTopics.slice(0, 3).join(', ')}</>
                                        )}.
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECONDARY TODO CARD
// ─────────────────────────────────────────────────────────────────────────────

function TodoCard({
    todo,
    delay = 0,
}: {
    todo: PrescriptiveTodo & { pattern: ErrorPattern; affectedTopic?: StudentProgress };
    delay?: number;
}) {
    const color = ERROR_COLORS[todo.drivenBy] ?? 'amber';
    const Icon = ERROR_ICONS[todo.drivenBy] ?? CheckSquare;
    const [whyOpen, setWhyOpen] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className={`${SOFT_GLASS} overflow-hidden`}
        >
            <div className="flex items-center gap-3 p-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ICON_BG[color]}`}>
                    <span className="text-sm font-bold">{todo.rank}</span>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <Icon className={`w-3.5 h-3.5 ${TEXT[color]}`} />
                        <span className="text-[13px] font-bold text-zinc-900 dark:text-white truncate">
                            {todo.title}
                        </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                        {todo.description}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> ~{todo.estMinutes} min
                        </span>
                        <span>·</span>
                        <button
                            type="button"
                            onClick={() => setWhyOpen(o => !o)}
                            className="inline-flex items-center gap-1 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        >
                            <HelpCircle className="w-3 h-3" />
                            {whyOpen ? 'Dölj' : 'Varför?'}
                        </button>
                    </div>
                </div>

                <Link
                    href={todo.href}
                    className={`shrink-0 ml-1 flex items-center gap-1 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all ${ICON_BG[color]} hover:scale-[1.03]`}
                >
                    Starta <ArrowRight className="w-3 h-3" />
                </Link>
            </div>

            <AnimatePresence initial={false}>
                {whyOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                    >
                        <div className={`mx-4 mb-4 p-3 rounded-xl text-[11px] leading-relaxed ${BG[color]} ${TEXT[color]}`}>
                            {todo.pattern.frequency} fel observerade
                            {todo.pattern.share > 0 && (
                                <> — {Math.round(todo.pattern.share * 100)}% av alla fel</>
                            )}
                            {todo.pattern.affectedTopics.length > 0 && (
                                <>. Berör: {todo.pattern.affectedTopics.slice(0, 3).join(', ')}</>
                            )}.
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ERROR PATTERN CARD
// ─────────────────────────────────────────────────────────────────────────────

function ErrorPatternCard({ pattern, index }: { pattern: ErrorPattern; index: number }) {
    const color = ERROR_COLORS[pattern.type] ?? 'amber';
    const Icon = ERROR_ICONS[pattern.type] ?? AlertCircle;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={`p-4 rounded-2xl border backdrop-blur-xl ${BG[color]}`}
        >
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl ${ICON_BG[color]} shrink-0`}>
                    <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className={`text-[11px] font-bold uppercase tracking-wide ${TEXT[color]}`}>
                            {labelForType(pattern.type)}
                        </span>
                        <SeverityBadge severity={pattern.severity} />
                    </div>
                    <p className={`text-[12px] leading-relaxed ${TEXT[color]}`}>
                        {pattern.actionableMessage}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-500 dark:text-zinc-400">
                        <span>{pattern.frequency} fel i perioden</span>
                        <span>·</span>
                        <span>{Math.round(pattern.share * 100)}% av alla fel</span>
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
        high:   'bg-amber-200/70 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200',
        medium: 'bg-amber-100/70 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
        low:    'bg-emerald-100/70 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    };
    const labels = { high: 'Hög', medium: 'Medel', low: 'Låg' };
    return (
        <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase ${styles[severity]}`}>
            {labels[severity]}
        </span>
    );
}
