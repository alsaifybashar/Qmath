'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronDown, BookOpen, Map as MapIcon,
    Sparkles, Lightbulb, BarChart3, Info,
    AlertTriangle, ArrowRight, Target, Flame
} from 'lucide-react';
import type {
    ExamAnalysisData, ExamTopicNode,
    ExamSection, CourseProfile, AIAnalysisSummary
} from '@/app/actions/exam-analysis';

// ============================================================================
// DESIGN TOKENS
// ============================================================================

const PRIORITY_STYLE = {
    critical: { badge: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300', hex: '#EF4444' },
    high:     { badge: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300', hex: '#F59E0B' },
    medium:   { badge: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300', hex: '#3B82F6' },
    low:      { badge: 'bg-zinc-100 dark:bg-zinc-700/50 text-zinc-600 dark:text-zinc-400', hex: '#9CA3AF' },
} as const;

const DIFFICULTY_STYLE = {
    easy:   { label: 'Grundläggande', bg: '#D1FAE5', text: '#065F46' },
    medium: { label: 'Medel',         bg: '#FEF3C7', text: '#92400E' },
    hard:   { label: 'Avancerad',     bg: '#EDE9FE', text: '#5B21B6' },
} as const;

const PHASE_CONFIG = {
    foundation: {
        label: 'Grund',
        color: '#10B981',
        bgClass: 'bg-emerald-50 dark:bg-emerald-500/8',
        borderClass: 'border-emerald-200 dark:border-emerald-800/40',
        textClass: 'text-emerald-700 dark:text-emerald-400',
        badgeBg: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
        ringColor: 'ring-emerald-400/30',
    },
    core: {
        label: 'Kärna',
        color: '#3B82F6',
        bgClass: 'bg-blue-50 dark:bg-blue-500/8',
        borderClass: 'border-blue-200 dark:border-blue-800/40',
        textClass: 'text-blue-700 dark:text-blue-400',
        badgeBg: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300',
        ringColor: 'ring-blue-400/30',
    },
    advanced: {
        label: 'Fördjupning',
        color: '#8B5CF6',
        bgClass: 'bg-violet-50 dark:bg-violet-500/8',
        borderClass: 'border-violet-200 dark:border-violet-800/40',
        textClass: 'text-violet-700 dark:text-violet-400',
        badgeBg: 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300',
        ringColor: 'ring-violet-400/30',
    },
} as const;

const AI_FOCUS_CONFIG = {
    High:   { bg: '#FEF2F2', text: '#B91C1C', label: 'Hög prioritet' },
    Medium: { bg: '#FFFBEB', text: '#B45309', label: 'Medel prioritet' },
    Low:    { bg: '#F0FDF4', text: '#166534', label: 'Låg prioritet' },
} as const;

// ============================================================================
// HELPER: Section header
// ============================================================================

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
    return (
        <div className="flex items-start gap-3 mb-6">
            <div className="mt-0.5">{icon}</div>
            <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-white leading-tight">{title}</h2>
                {subtitle && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
}

// ============================================================================
// IMPORTANCE BAR (1–10)
// ============================================================================

function ImportanceBar({ value, color }: { value: number; color: string }) {
    return (
        <div className="flex items-center gap-1" title={`AI-viktighet: ${value}/10`}>
            <div className="flex gap-0.5">
                {Array.from({ length: 10 }).map((_, j) => (
                    <div
                        key={j}
                        className="w-1 rounded-full"
                        style={{
                            height: j < 5 ? '6px' : '10px',
                            background: j < value ? color : '#E5E7EB',
                            opacity: j < value ? 1 : 0.4,
                        }}
                    />
                ))}
            </div>
            <span className="text-[9px] font-bold ml-0.5" style={{ color }}>{value}/10</span>
        </div>
    );
}

// ============================================================================
// SECTION 1: AI HERO BANNER
// ============================================================================

function AIHeroBanner({ data }: { data: ExamAnalysisData }) {
    const { aiAnalysis, courseCode, courseName } = data;

    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-3xl overflow-hidden mb-8 shadow-xl"
        >
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-blue-600 to-indigo-700" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_60%)]" />

            <div className="relative px-7 py-8">
                {/* Top bar */}
                <div className="flex items-center gap-3 mb-5">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-sm">
                        <Sparkles className="w-4 h-4 text-white" />
                        <span className="text-xs font-bold text-white">AI-tentamensanalys</span>
                    </div>
                    {aiAnalysis.cached && (
                        <span className="text-[10px] px-2 py-1 rounded-lg bg-white/10 text-white/70 font-semibold">CACHAD</span>
                    )}
                </div>

                {/* Course title */}
                <div className="mb-5">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-white/70 text-sm font-bold tracking-widest uppercase">{courseCode}</span>
                    </div>
                    <h1 className="text-2xl font-extrabold text-white leading-tight">{courseName}</h1>
                </div>

                {/* Strategy text */}
                <div className="mb-6 max-w-2xl">
                    <p className="text-sm text-white/85 leading-relaxed">{aiAnalysis.strategy}</p>
                </div>




            </div>
        </motion.div>
    );
}

// ============================================================================
// SECTION 2: EXAM STRUCTURE PANEL
// ============================================================================

function ExamStructurePanel({ aiAnalysis, profile }: { aiAnalysis: AIAnalysisSummary; profile: CourseProfile }) {
    const { sections } = aiAnalysis.examStructure;
    if (sections.length === 0 && profile.examSections.length === 0) return null;

    // Prefer AI sections for display; fall back to profile sections
    const displaySections: ExamSection[] = profile.examSections;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 mb-8"
        >
            <SectionHeader
                icon={<BookOpen className="w-5 h-5 text-emerald-500" />}
                title="Tentamensstruktur"
                subtitle={`AI-identifierade ${sections.length > 0 ? sections.length : displaySections.length} delar i tentamen — ${aiAnalysis.examStructure.totalPoints > 0 ? aiAnalysis.examStructure.totalPoints + 'p totalt' : 'se nedan'}`}
            />



            {/* Section cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displaySections.map((sec, idx) => {
                    const diff = DIFFICULTY_STYLE[sec.difficultyProfile === 'mixed' ? 'medium' : sec.difficultyProfile] ?? DIFFICULTY_STYLE.medium;
                    return (
                        <motion.div
                            key={sec.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * idx }}
                            className="rounded-xl border overflow-hidden"
                            style={{ borderColor: `${sec.color}40` }}
                        >
                            {/* Section header strip */}
                            <div className="px-4 py-3 flex items-center gap-2" style={{ background: `${sec.color}15` }}>
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-extrabold shadow-sm"
                                    style={{ background: `linear-gradient(135deg,${sec.color},${sec.color}BB)` }}>
                                    {sec.id}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate">{sec.shortLabel}</p>
                                </div>
                                <span
                                    className="text-[9px] font-bold px-1.5 py-px rounded-full flex-shrink-0"
                                    style={{ background: diff.bg, color: diff.text }}
                                >
                                    {diff.label}
                                </span>
                            </div>

                            {/* Section body */}
                            <div className="px-4 py-3 bg-white dark:bg-zinc-900">
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug mb-3">{sec.description}</p>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="text-center">
                                        <p className="text-lg font-extrabold" style={{ color: sec.color }}>{sec.maxPoints}p</p>
                                        <p className="text-[9px] text-zinc-400">Max</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-extrabold" style={{ color: sec.color }}>{sec.taskCount}</p>
                                        <p className="text-[9px] text-zinc-400">Uppgifter</p>
                                    </div>
                                    {sec.passPoints > 0 ? (
                                        <div className="text-center">
                                            <p className="text-lg font-extrabold" style={{ color: sec.color }}>{sec.passPoints}p</p>
                                            <p className="text-[9px] text-zinc-400">Godkänt</p>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <p className="text-lg font-extrabold text-zinc-400">—</p>
                                            <p className="text-[9px] text-zinc-400">Krav</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}

// ============================================================================
// SECTION 3: TENTAMENSKARTA
// ============================================================================

// ── Single topic node card ────────────────────────────────────────────────────
function TopicNodeCard({
    node,
    isOpen,
    onToggle,
    profile,
    orderNum,
}: {
    node: ExamTopicNode;
    isOpen: boolean;
    onToggle: () => void;
    profile: CourseProfile;
    orderNum: number;
}) {
    const phase = PHASE_CONFIG[node.phase];
    const importanceColor = node.aiImportance >= 8 ? '#EF4444' :
                            node.aiImportance >= 6 ? '#F59E0B' :
                            node.aiImportance >= 4 ? '#3B82F6' : '#9CA3AF';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border overflow-hidden transition-shadow ${isOpen ? 'shadow-md ring-1 ' + phase.ringColor : 'hover:shadow-sm'} ${phase.borderClass}`}
        >
            {/* ── Card header (always visible) ── */}
            <button onClick={onToggle} className="w-full text-left" aria-expanded={isOpen}>
                <div className={`flex items-center gap-3 px-4 py-3 transition-colors ${isOpen ? phase.bgClass : 'bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'}`}>

                    {/* Order number circle */}
                    <div className="relative flex-shrink-0 w-9 h-9">
                        <div className="absolute inset-0 rounded-full border-2 flex items-center justify-center"
                            style={{ borderColor: `${phase.color}50`, background: `${phase.color}10` }}>
                            <span className="text-[11px] font-bold" style={{ color: phase.color }}>{orderNum}</span>
                        </div>
                    </div>

                    {/* Topic name + section pills */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                                {node.topicName}
                            </span>
                            {/* Phase badge */}
                            <span className={`text-[8px] font-bold px-1.5 py-px rounded-full ${phase.badgeBg}`}>
                                {phase.label}
                            </span>
                            {/* Exam section pills */}
                            {node.examSections.slice(0, 2).map(id => {
                                const sec = profile.examSections.find(s => s.id === id);
                                return sec ? (
                                    <span
                                        key={id}
                                        className="text-[9px] font-bold px-1.5 py-px rounded"
                                        style={{ background: `${sec.color}18`, color: sec.color }}
                                    >
                                        {sec.shortLabel}
                                    </span>
                                ) : (
                                    <span key={id} className="text-[9px] font-bold px-1.5 py-px rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-500">
                                        Del {id}
                                    </span>
                                );
                            })}
                        </div>

                        {/* Frequency label from AI */}
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">{node.frequencyLabel}</p>
                    </div>

                    {/* Right: AI importance bar + chevron */}
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <ImportanceBar value={node.aiImportance} color={importanceColor} />
                        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                </div>
            </button>

            {/* ── Expanded detail panel ── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                                {/* Col 1 — AI reasoning */}
                                <div>
                                    <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                                        <Info className="w-3 h-3" /> Varför detta ämne
                                    </p>
                                    <div className="px-2.5 py-2 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/30">
                                        <p className="text-[9px] font-bold text-violet-500 uppercase mb-1 flex items-center gap-1">
                                            <Sparkles className="w-2.5 h-2.5" /> AI-analys
                                        </p>
                                        <p className="text-[11px] text-violet-700 dark:text-violet-300 leading-snug">
                                            {node.aiReasoning || node.description}
                                        </p>
                                    </div>
                                    {/* Focus badge */}
                                    <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                                        style={{
                                            background: AI_FOCUS_CONFIG[node.aiFocus].bg,
                                            color: AI_FOCUS_CONFIG[node.aiFocus].text,
                                        }}
                                    >
                                        <Flame className="w-3 h-3" />
                                        {AI_FOCUS_CONFIG[node.aiFocus].label}
                                    </div>
                                </div>

                                {/* Col 2 — Common mistakes */}
                                <div>
                                    <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> Vanliga misstag
                                    </p>
                                    {node.commonMistakes.length > 0 ? (
                                        <div className="space-y-2">
                                            {node.commonMistakes.map((m, mi) => (
                                                <div key={mi} className="flex items-start gap-1.5">
                                                    <span className="w-4 h-4 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 text-[8px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        {mi + 1}
                                                    </span>
                                                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">{m}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-zinc-400">Inga misstag registrerade.</p>
                                    )}
                                </div>

                                {/* Col 3 — Study tips */}
                                <div>
                                    <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                                        <Lightbulb className="w-3 h-3" /> Studietips
                                    </p>
                                    {node.studyTips.length > 0 ? (
                                        <div className="space-y-2 mb-4">
                                            {node.studyTips.map((tip, ti) => (
                                                <div key={ti} className="flex items-start gap-1.5">
                                                    <div
                                                        className="w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[8px] font-bold mt-0.5"
                                                        style={{ background: phase.color }}
                                                    >
                                                        {ti + 1}
                                                    </div>
                                                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">{tip}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-zinc-400 mb-4">Inga studietips registrerade.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ── Main Tentamenskarta ───────────────────────────────────────────────────────
function Tentamenskarta({
    nodes,
    profile,
    aiAnalysis,
}: {
    nodes: ExamTopicNode[];
    profile: CourseProfile;
    aiAnalysis: AIAnalysisSummary;
}) {
    const [openId, setOpenId] = useState<string | null>(null);
    const [activePhase, setActivePhase] = useState<'all' | 'foundation' | 'core' | 'advanced'>('all');

    const phases: ('foundation' | 'core' | 'advanced')[] = ['foundation', 'core', 'advanced'];

    const filtered = useMemo(() =>
        activePhase === 'all' ? nodes : nodes.filter(n => n.phase === activePhase),
        [nodes, activePhase]
    );

    const toggle = useCallback((id: string) => {
        setOpenId(prev => prev === id ? null : id);
    }, []);

    const handlePhaseFilter = useCallback((p: typeof activePhase) => {
        setActivePhase(p);
        setOpenId(null);
    }, []);

    if (nodes.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 mb-8"
            >
                <SectionHeader
                    icon={<MapIcon className="w-5 h-5 text-violet-500" />}
                    title="Tentamenskarta"
                    subtitle="AI-extraherade ämnen från examinationer"
                />
                <p className="text-sm text-zinc-400 text-center py-8">
                    Inga ämnen identifierades av AI ännu — kontrollera att examfiler finns uppladdade.
                </p>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 mb-8"
        >
            <SectionHeader
                icon={<MapIcon className="w-5 h-5 text-violet-500" />}
                title="Tentamenskarta"
                subtitle={`AI-analyserade ${aiAnalysis.examsAnalyzed} tentamen och identifierade ${nodes.length} ämnesområden. Sorterade: Grund → Kärna → Fördjupning, efter viktighet.`}
            />

            {/* Phase filter tabs */}
            <div className="flex gap-1.5 mb-5 flex-wrap">
                <button
                    onClick={() => handlePhaseFilter('all')}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all border ${
                        activePhase === 'all'
                            ? 'bg-zinc-800 dark:bg-white text-white dark:text-zinc-900 border-zinc-800 dark:border-white'
                            : 'bg-transparent text-zinc-500 border-zinc-300 dark:border-zinc-600 hover:border-zinc-500'
                    }`}
                >
                    Alla ({nodes.length})
                </button>
                {phases.map(p => {
                    const cfg = PHASE_CONFIG[p];
                    const count = nodes.filter(n => n.phase === p).length;
                    if (count === 0) return null;
                    return (
                        <button
                            key={p}
                            onClick={() => handlePhaseFilter(p)}
                            className="px-3 py-1 rounded-full text-[11px] font-bold transition-all border"
                            style={activePhase === p
                                ? { background: cfg.color, color: '#fff', borderColor: cfg.color }
                                : { background: 'transparent', color: cfg.color, borderColor: `${cfg.color}50` }
                            }
                        >
                            {cfg.label} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Phase groups */}
            <div className="space-y-6">
                {(activePhase === 'all' ? phases : [activePhase]).map(phase => {
                    const phaseNodes = filtered.filter(n => n.phase === phase);
                    if (phaseNodes.length === 0) return null;
                    const cfg = PHASE_CONFIG[phase];

                    return (
                        <div key={phase}>
                            {/* Phase header line */}
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-px flex-1" style={{ background: `linear-gradient(to right, ${cfg.color}60, transparent)` }} />
                                <span
                                    className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full flex-shrink-0"
                                    style={{ background: `${cfg.color}15`, color: cfg.color }}
                                >
                                    {cfg.label} — {phaseNodes.length} ämnen
                                </span>
                                <div className="h-px flex-1" style={{ background: `linear-gradient(to left, ${cfg.color}60, transparent)` }} />
                            </div>

                            <div className="space-y-2">
                                {phaseNodes.map(node => (
                                    <TopicNodeCard
                                        key={node.topicId}
                                        node={node}
                                        isOpen={openId === node.topicId}
                                        onToggle={() => toggle(node.topicId)}
                                        profile={profile}
                                        orderNum={node.learningOrder}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-5 flex-wrap text-[10px] text-zinc-400">
                {phases.map(p => (
                    <div key={p} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: PHASE_CONFIG[p].color }} />
                        {PHASE_CONFIG[p].label}
                    </div>
                ))}
                <span className="ml-auto flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-violet-400" />
                    Data från AI-analys av tentaman
                </span>
            </div>
        </motion.div>
    );
}

// ============================================================================
// SECTION 4: TOPIC RANKED LIST
// ============================================================================

function TopicRankedList({ nodes, profile }: { nodes: ExamTopicNode[]; profile: CourseProfile }) {
    // Sort by AI importance descending (ignoring phase grouping — pure rank)
    const ranked = useMemo(() =>
        [...nodes].sort((a, b) => b.aiImportance - a.aiImportance),
        [nodes]
    );

    if (ranked.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 mb-8"
        >
            <SectionHeader
                icon={<BarChart3 className="w-5 h-5 text-blue-500" />}
                title="Viktigaste ämnen"
                subtitle="Alla ämnen rankade efter AI-beräknad viktighet — det AI anser störst sannolikhet att dyka upp på tentamen"
            />

            <div className="space-y-2">
                {ranked.map((node, i) => {
                    const importanceColor = node.aiImportance >= 8 ? '#EF4444' :
                                           node.aiImportance >= 6 ? '#F59E0B' :
                                           node.aiImportance >= 4 ? '#3B82F6' : '#9CA3AF';
                    const pStyle = PRIORITY_STYLE[node.priority];
                    const diff = DIFFICULTY_STYLE[node.aiDifficulty];
                    const phase = PHASE_CONFIG[node.phase];

                    return (
                        <motion.div
                            key={node.topicId}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.02 }}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
                        >
                            {/* Rank number */}
                            <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 w-5 flex-shrink-0 text-right">
                                {i + 1}
                            </span>

                            {/* Importance bar */}
                            <div className="flex-shrink-0 w-24">
                                <ImportanceBar value={node.aiImportance} color={importanceColor} />
                            </div>

                            {/* Topic name */}
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">{node.topicName}</p>
                                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">{node.frequencyLabel}</p>
                            </div>

                            {/* Badges row */}
                            <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                                {/* Difficulty */}
                                <span
                                    className="text-[9px] font-bold px-1.5 py-px rounded-full hidden sm:inline"
                                    style={{ background: diff.bg, color: diff.text }}
                                >
                                    {diff.label}
                                </span>
                                {/* Phase */}
                                <span
                                    className="text-[9px] font-bold px-1.5 py-px rounded-full hidden md:inline"
                                    style={{ background: `${phase.color}15`, color: phase.color }}
                                >
                                    {phase.label}
                                </span>
                                {/* Exam section pills */}
                                {node.examSections.slice(0, 1).map(id => {
                                    const sec = profile.examSections.find(s => s.id === id);
                                    return sec ? (
                                        <span
                                            key={id}
                                            className="text-[9px] font-bold px-1.5 py-px rounded"
                                            style={{ background: `${sec.color}18`, color: sec.color }}
                                        >
                                            {sec.shortLabel}
                                        </span>
                                    ) : null;
                                })}
                                {/* Priority */}
                                <span className={`text-[9px] font-bold px-1.5 py-px rounded-full ${pStyle.badge}`}>
                                    {node.priority === 'critical' ? 'KRITISK' :
                                     node.priority === 'high'     ? 'HÖG' :
                                     node.priority === 'medium'   ? 'MEDEL' : 'LÅG'}
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Footer note */}
            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2 text-[10px] text-zinc-400">
                <Sparkles className="w-3 h-3 text-violet-400 flex-shrink-0" />
                Rankning baseras på AI-analys av {nodes.length > 0 ? nodes[0].frequencyLabel ? 'tentafrekvens och svårighetsgrad' : 'uppladdade tentafiler' : 'tentafiler'}
            </div>
        </motion.div>
    );
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export default function CourseAnalysisView({ data, embedded = false }: { data: ExamAnalysisData; embedded?: boolean }) {
    const profile = data.courseProfile;

    return (
        <div className={embedded ? 'w-full' : 'min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4 py-8'}>
            <div className={embedded ? '' : 'max-w-5xl mx-auto'}>

                {/* 1. AI Hero Banner — course name, strategy, stats */}
                <AIHeroBanner data={data} />

                {/* 2. Exam Structure Panel — AI-detected sections */}
                <ExamStructurePanel aiAnalysis={data.aiAnalysis} profile={profile} />

                {/* 3. Tentamenskarta — phase-grouped topic cards from AI */}
                <Tentamenskarta
                    nodes={data.examTopicMap}
                    profile={profile}
                    aiAnalysis={data.aiAnalysis}
                />

                {/* 4. Topic Ranked List — all topics sorted by AI importance */}
                <TopicRankedList nodes={data.examTopicMap} profile={profile} />

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-center py-10"
                >
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                        AI analyserade {data.totalExamsAnalyzed} tentamen och identifierade {data.totalTopics} ämnesområden
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-5">
                        Genererat {new Date(data.aiAnalysis.generatedAt).toLocaleDateString('sv-SE')}
                        {data.aiAnalysis.cached && ' · Cachad'}
                    </p>
                    <a
                        href="/study"
                        className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 transition-all shadow-xl hover:shadow-2xl hover:scale-[1.02]"
                    >
                        <ArrowRight className="w-4 h-4" /> Börja studera
                    </a>
                </motion.div>
            </div>
        </div>
    );
}
