'use client';

import { useMemo, useState } from 'react';
import {
    PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle, Lightbulb, Brain, ChevronDown, ChevronRight,
    HelpCircle, BookOpen, TrendingDown,
} from 'lucide-react';
import ReflectionModal from './ReflectionModal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Attempt {
    id?: string;
    isCorrect: boolean;
    errorType?: string | null;
    timestamp: Date | string;
    topicId?: string;
    difficultyLevel?: number;
    concept?: string; // optional enriched field
}

interface ErrorAnalysisProps {
    attempts: Attempt[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ERROR_COLORS: Record<string, string> = {
    conceptual: '#EAB308',
    procedural: '#3585a3',
    computational: '#e87c2b',
    interpretation: '#19647e',
    notation: '#10B981',
    time_pressure: '#28afb0',
    incomplete: '#9CA3AF',
    unknown: '#D1D5DB',
};

const ERROR_LABELS: Record<string, string> = {
    conceptual: 'Konceptuellt fel',
    procedural: 'Fel metod',
    computational: 'Beräkningsfel',
    interpretation: 'Feltolkad fråga',
    notation: 'Notationsfel',
    time_pressure: 'Tidsbrist',
    incomplete: 'Ofullständig',
    unknown: 'Oklassificerad',
};

/** Micro-questions per error type — the student can reflect on these. */
const MICRO_QUESTIONS: Record<string, string[]> = {
    conceptual: [
        'Kan du förklara definitionen med egna ord?',
        'Vad är skillnaden mot ett liknande begrepp?',
        'Kan du rita/visualisera begreppet?',
    ],
    procedural: [
        'Vilka steg ingår i metoden?',
        'Varför ska just den här metoden användas?',
        'Vad händer om du missar ett steg?',
    ],
    computational: [
        'Är enheterna rimliga i svaret?',
        'Kan du uppskatta storleksordningen?',
        'Genomförde du alla aritmetiska steg i rätt ordning?',
    ],
    interpretation: [
        'Vad frågar uppgiften egentligen om?',
        'Markerade du nyckelorden i frågan?',
        'Vilken information är relevant?',
    ],
    notation: [
        'Stämmer index och variabler?',
        'Använde du konventionell notation?',
        'Kan missuppfattad notation ha lett till felet?',
    ],
    time_pressure: [
        'Hann du läsa frågan ordentligt?',
        'Hade du en strategi för tidsfördelning?',
        'Vilka uppgifter tog oproportionerligt lång tid?',
    ],
    incomplete: [
        'Vad saknas i ditt svar?',
        'Motiverade du alla slutsatser?',
        'Kontrollerade du att alla delar av frågan besvarades?',
    ],
    unknown: [
        'Minns du vad som gick fel?',
        'Vilket steg var det svåraste?',
        'Vad skulle du göra annorlunda?',
    ],
};

/** Concept tree: which sub-concepts relate to each error type */
const CONCEPT_TREE: Record<string, string[]> = {
    conceptual: ['Definitioner', 'Satser & bevis', 'Begreppsrelationer'],
    procedural: ['Algoritm-ordning', 'Metodval', 'Stegkontroll'],
    computational: ['Aritmetik', 'Avrundning', 'Enhetskontroll'],
    interpretation: ['Läsförståelse', 'Nyckelord', 'Kontextanalys'],
    notation: ['Index', 'Variabler', 'Symbolkonventioner'],
    time_pressure: ['Tidsplanering', 'Prioritering', 'Övning under stress'],
    incomplete: ['Svarsstruktur', 'Motivering', 'Kontroll'],
    unknown: ['Allmän repetition'],
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Expandable error type row showing frequency + micro-questions + concept tree */
function ErrorTypeRow({
    name,
    count,
    total,
    isTop,
}: {
    name: string;
    count: number;
    total: number;
    isTop: boolean;
}) {
    const [expanded, setExpanded] = useState(false);
    const color = ERROR_COLORS[name] || '#D1D5DB';
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    const qs = MICRO_QUESTIONS[name] || [];
    const concepts = CONCEPT_TREE[name] || [];

    return (
        <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: isTop ? `${color}40` : '#EFF1F8' }}
        >
            {/* Row header */}
            <button
                onClick={() => setExpanded(e => !e)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
                <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: color }}
                    aria-label={`Feltyp: ${ERROR_LABELS[name] || name}`}
                />
                <span className="flex-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {ERROR_LABELS[name] || name}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: `${color}15`, color }}>
                    {count}×
                </span>
                <div className="w-24 h-1.5 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-700">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                </div>
                <span className="text-xs w-8 text-right text-zinc-400">{pct}%</span>
                {expanded
                    ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                    : <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />}
            </button>

            {/* Expanded: micro-questions + concept tree */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 grid md:grid-cols-2 gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                            {/* Micro-questions */}
                            <div>
                                <div className="flex items-center gap-1.5 text-xs font-bold mb-2 text-zinc-500 uppercase tracking-wider">
                                    <HelpCircle className="w-3.5 h-3.5" />
                                    3 reflektionsfrågor
                                </div>
                                <ol className="space-y-1.5">
                                    {qs.map((q, i) => (
                                        <li key={i} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                                            <span className="font-bold flex-shrink-0" style={{ color }}>{i + 1}.</span>
                                            {q}
                                        </li>
                                    ))}
                                </ol>
                            </div>

                            {/* Concept tree */}
                            <div>
                                <div className="flex items-center gap-1.5 text-xs font-bold mb-2 text-zinc-500 uppercase tracking-wider">
                                    <BookOpen className="w-3.5 h-3.5" />
                                    Underkoncept
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {concepts.map((c, i) => (
                                        <span
                                            key={i}
                                            className="px-2 py-1 rounded-lg text-xs font-medium"
                                            style={{ background: `${color}12`, color, border: `1px solid ${color}30` }}
                                        >
                                            {c}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ErrorAnalysis({ attempts }: ErrorAnalysisProps) {
    const [reviewAttempt, setReviewAttempt] = useState<Attempt | null>(null);

    const errors = useMemo(() => attempts.filter(a => !a.isCorrect), [attempts]);

    const handleReviewClick = () => {
        const unclassified = errors.find(e => !e.errorType || e.errorType === 'unknown');
        if (unclassified && unclassified.id) setReviewAttempt(unclassified);
    };

    // Distribution data — sorted by frequency
    const distributionData = useMemo(() => {
        const counts: Record<string, number> = {};
        errors.forEach(err => {
            const type = err.errorType || 'unknown';
            counts[type] = (counts[type] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [errors]);

    // 7-day trend
    const trendData = useMemo(() => {
        const last7Days = Array(7).fill(0).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
        });
        return last7Days.map(date => {
            const count = errors.filter(e => {
                const eDate = new Date(e.timestamp).toISOString().split('T')[0];
                return eDate === date;
            }).length;
            return {
                date: new Date(date).toLocaleDateString('sv-SE', { weekday: 'short' }),
                count,
            };
        });
    }, [errors]);

    // AI-style insight
    const insight = useMemo(() => {
        if (errors.length === 0) return { title: 'Ser bra ut! 🎉', message: 'Inga fel upptäckta nyligen. Fortsätt det goda arbetet!' };
        const topError = distributionData[0];
        const pct = Math.round((topError.value / errors.length) * 100);
        if (topError.name === 'conceptual')
            return { title: 'Fördjupa förståelsen', message: `${pct}% av dina fel är konceptuella. Prova att repetera definitioner och bevis innan du övar uppgifter.` };
        if (topError.name === 'computational')
            return { title: 'Dubbelkolla arbetet', message: `Beräkningsfel på ${pct}% av misstagen. Sakta ner och verifiera varje steg och enhet.` };
        if (topError.name === 'interpretation')
            return { title: 'Läs noggrant', message: 'Du misstolkar frågor ofta. Prova att markera nyckelord i problembeskrivningen.' };
        return {
            title: 'Analysera mönster',
            message: `Ditt vanligaste fel är ${ERROR_LABELS[topError.name] || topError.name} (${pct}%). Klicka på raden nedan för att se reflektionsfrågor.`,
        };
    }, [distributionData, errors.length]);

    if (attempts.length === 0) return null;

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-amber-500" />
                        Felanalys
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Förstå och åtgärda dina felmönster</p>
                </div>
                {distributionData.find(d => d.name === 'unknown') && (
                    <button
                        onClick={handleReviewClick}
                        className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        Klassificera oklara fel
                    </button>
                )}
            </div>

            {/* Insight card */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 mb-5 rounded-xl"
                style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}
            >
                <div className="flex items-start gap-3">
                    <div className="bg-amber-100 p-2 rounded-lg text-amber-600 flex-shrink-0">
                        <Lightbulb size={18} />
                    </div>
                    <div>
                        <h4 className="font-bold text-amber-800 text-sm mb-1">{insight.title}</h4>
                        <p className="text-sm text-amber-700 leading-relaxed">{insight.message}</p>
                    </div>
                </div>
            </motion.div>

            {/* Charts row */}
            <div className="grid md:grid-cols-2 gap-6 mb-5">
                {/* Pie chart */}
                <div>
                    <h4 className="text-xs font-bold mb-2 text-zinc-500 uppercase tracking-wider">Fördelning</h4>
                    {errors.length > 0 ? (
                        <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={distributionData}
                                        cx="40%"
                                        cy="50%"
                                        innerRadius={52}
                                        outerRadius={72}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {distributionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={ERROR_COLORS[entry.name] || ERROR_COLORS.unknown} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(v: number | undefined) => [`${v ?? 0} fel`, 'Antal'] as [string, string]}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-52 flex flex-col items-center justify-center text-zinc-400">
                            <Brain size={40} className="mb-2 opacity-40" />
                            <p className="text-sm">Inga fel att analysera</p>
                        </div>
                    )}
                </div>

                {/* 7-day trend */}
                <div>
                    <h4 className="text-xs font-bold mb-2 text-zinc-500 uppercase tracking-wider">7-dagars trend</h4>
                    <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendData} barCategoryGap="30%">
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} width={20} />
                                <Tooltip
                                    cursor={{ fill: '#F4F4F5' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none' }}
                                />
                                <Bar dataKey="count" fill="#EAB308" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Error type list with expandable detail (concept tree + micro-questions) */}
            {distributionData.length > 0 && (
                <div>
                    <h4 className="text-xs font-bold mb-3 text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5" />
                        Klicka på ett feltyp för reflektionsfrågor
                    </h4>
                    <div className="space-y-2">
                        {distributionData.map((item, i) => (
                            <ErrorTypeRow
                                key={item.name}
                                name={item.name}
                                count={item.value}
                                total={errors.length}
                                isTop={i === 0}
                            />
                        ))}
                    </div>
                </div>
            )}

            {reviewAttempt && reviewAttempt.id && (
                <ReflectionModal
                    isOpen={!!reviewAttempt}
                    onClose={() => setReviewAttempt(null)}
                    attempt={{ id: reviewAttempt.id!, timestamp: reviewAttempt.timestamp }}
                />
            )}
        </div>
    );
}
