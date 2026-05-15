'use client';

import { useState, ReactNode } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bot, Calculator, ChevronLeft, FileText,
    Flame, HelpCircle, Lightbulb, PenLine,
    Sigma, Sparkles, X, Zap,
} from 'lucide-react';

// ── GlassPanel ────────────────────────────────────────────────────────────────

function GlassPanel({
    className = '',
    children,
}: {
    className?: string;
    children: ReactNode;
}) {
    return (
        <div
            className={[
                'rounded-3xl border border-white/15 bg-white/[0.06]',
                'shadow-2xl shadow-black/30 backdrop-blur-md',
                'ring-1 ring-white/5',
                className,
            ].join(' ')}
        >
            {children}
        </div>
    );
}

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS = [
    {
        id: 'calculator' as const,
        label: 'Calculator',
        description: 'Evaluate numeric expressions without leaving the problem.',
        icon: Calculator,
    },
    {
        id: 'formulas' as const,
        label: 'Formula Sheet',
        description: 'Quick reference for identities and key theorems.',
        icon: FileText,
    },
    {
        id: 'scratchpad' as const,
        label: 'Scratchpad',
        description: 'Keep rough work separate from your final answer.',
        icon: PenLine,
    },
];

type ToolId = 'calculator' | 'formulas' | 'scratchpad';

// ── Calculator panel ──────────────────────────────────────────────────────────

function CalculatorPanel() {
    const [expr, setExpr] = useState('');
    const [result, setResult] = useState<string | null>(null);

    function evaluate() {
        if (!expr.trim()) return;
        try {
            // eslint-disable-next-line no-new-func
            const val = Function('"use strict"; return (' + expr + ')')();
            setResult(typeof val === 'number' ? String(Number(val.toFixed(10))) : String(val));
        } catch {
            setResult('Syntax error');
        }
    }

    return (
        <div className="mt-4 space-y-2.5">
            <input
                type="text"
                value={expr}
                onChange={(e) => { setExpr(e.target.value); setResult(null); }}
                onKeyDown={(e) => e.key === 'Enter' && evaluate()}
                placeholder="e.g. (3+4)*2 or Math.sqrt(9)"
                className="w-full rounded-2xl border border-white/14 bg-white/[0.07] px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30 focus:bg-white/10 transition"
            />
            <button
                onClick={evaluate}
                className="w-full rounded-xl bg-white/10 py-2 text-sm font-semibold text-white transition hover:bg-white/16"
            >
                Calculate
            </button>
            <AnimatePresence>
                {result !== null && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="rounded-xl border border-white/12 bg-white/[0.05] px-3 py-2 text-sm font-mono text-blue-100"
                    >
                        = {result}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Formula sheet panel ───────────────────────────────────────────────────────

const FORMULAS = [
    { label: 'Power rule', body: "d/dx [xⁿ] = n·xⁿ⁻¹" },
    { label: 'Chain rule', body: "(f∘g)′ = f′(g(x))·g′(x)" },
    { label: 'Product rule', body: "(uv)′ = u′v + uv′" },
    { label: 'Quotient rule', body: "(u/v)′ = (u′v − uv′) / v²" },
    { label: "L'Hôpital", body: "lim f/g = lim f′/g′ (0/0 or ∞/∞)" },
    { label: 'Integration by parts', body: "∫u dv = uv − ∫v du" },
    { label: 'Geometric series', body: "∑ arⁿ = a/(1−r), |r|<1" },
    { label: 'Taylor (deg 2)', body: "f(x) ≈ f(a)+f′(a)(x−a)+f″(a)(x−a)²/2" },
];

function FormulaPanel() {
    return (
        <div className="mt-4 space-y-1.5">
            {FORMULAS.map((f) => (
                <div
                    key={f.label}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2"
                >
                    <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/40">
                        {f.label}
                    </p>
                    <p className="text-xs font-mono text-blue-100/90 leading-5">{f.body}</p>
                </div>
            ))}
        </div>
    );
}

// ── Scratchpad panel ──────────────────────────────────────────────────────────

function ScratchpadPanel() {
    const [text, setText] = useState('');
    return (
        <div className="mt-4">
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={9}
                placeholder="Rough work here…"
                className="w-full resize-none rounded-2xl border border-white/14 bg-white/[0.07] px-3 py-2 text-sm leading-6 text-white outline-none placeholder:text-white/35 focus:border-white/30 focus:bg-white/10 transition"
            />
        </div>
    );
}

// ── Default right-panel content (before AI chat is opened) ────────────────────

const DEFAULT_STEPS = [
    {
        title: 'Read carefully',
        body: 'Identify exactly what the question asks before committing to a method.',
    },
    {
        title: 'Pick a strategy',
        body: 'Match the structure of the problem to a known theorem, identity, or technique.',
    },
    {
        title: 'Verify your result',
        body: 'Check domains, limiting cases, and whether the answer is dimensionally sound.',
    },
];

function DefaultHelpContent({ onOpenAI }: { onOpenAI: () => void }) {
    return (
        <div className="space-y-3">
            {DEFAULT_STEPS.map((step, i) => (
                <article
                    key={step.title}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                >
                    <div className="mb-1.5 flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-white/10 text-xs font-bold text-white">
                            {i + 1}
                        </span>
                        <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                    </div>
                    <p className="text-xs leading-5 text-white/60">{step.body}</p>
                </article>
            ))}

            <button
                onClick={onOpenAI}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/14 bg-white/10 px-4 py-3 text-sm font-semibold text-white/82 transition hover:border-white/30 hover:bg-white/16 hover:text-white"
            >
                <Sparkles className="h-4 w-4" />
                Ask AI for guidance
            </button>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

interface LiquidGlassQuestionViewProps {
    /** e.g. "TATA41" — shown in header */
    courseLabel?: string;
    /** Topic title — shown in header alongside courseLabel */
    topicName?: string;
    questionNumber?: number;
    totalQuestions?: number;
    xpEarned?: number;
    streak?: number;
    /** Full AI chat panel rendered in the right column when isHelpOpen = true */
    rightPanel?: ReactNode;
    isHelpOpen?: boolean;
    onHelpToggle?: (open: boolean) => void;
    /** href for the back / exit button */
    exitHref?: string;
    /** Center-column content: QuestionCard, feedback banners, hint bubbles, etc. */
    children: ReactNode;
}

export function LiquidGlassQuestionView({
    courseLabel = 'TATA41',
    topicName,
    questionNumber = 1,
    totalQuestions = 10,
    xpEarned = 0,
    streak = 0,
    rightPanel,
    isHelpOpen = false,
    onHelpToggle,
    exitHref = '/practice',
    children,
}: LiquidGlassQuestionViewProps) {
    const [activeTool, setActiveTool] = useState<ToolId>('calculator');
    const [isMobileHelpOpen, setIsMobileHelpOpen] = useState(false);

    const progressPct =
        totalQuestions > 0 ? Math.round((questionNumber / totalQuestions) * 100) : 0;

    const headerLabel = [courseLabel, topicName].filter(Boolean).join(' · ');

    return (
        <div className="relative min-h-screen font-sans text-white">

            {/* ── Fixed ambient background ──────────────────────────────────── */}
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[#08091f]" />
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_12%_14%,rgba(59,130,246,0.52),transparent_28%),radial-gradient(circle_at_88%_10%,rgba(147,51,234,0.48),transparent_30%),radial-gradient(circle_at_52%_90%,rgba(79,70,229,0.42),transparent_34%),linear-gradient(135deg,#050816_0%,#11164e_48%,#3b1169_100%)]" />
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(115deg,rgba(255,255,255,0.10),transparent_24%,rgba(255,255,255,0.05)_52%,transparent_76%)]" />

            {/* ── Fixed header ──────────────────────────────────────────────── */}
            <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-white/[0.04] backdrop-blur-xl">
                <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-4 px-4 sm:px-6 lg:px-8">

                    {/* Back */}
                    <Link
                        href={exitHref}
                        className="flex flex-shrink-0 items-center gap-1.5 text-white/50 transition hover:text-white"
                    >
                        <ChevronLeft className="h-5 w-5" />
                        <span className="hidden text-sm font-medium sm:block">Avsluta</span>
                    </Link>

                    {/* Center: course / topic / counter */}
                    <div className="flex min-w-0 flex-1 flex-col items-center justify-center">
                        {headerLabel && (
                            <span className="mb-0.5 max-w-full truncate text-[11px] font-medium leading-none text-white/45">
                                {headerLabel}
                            </span>
                        )}
                        <span className="text-sm font-semibold leading-none text-white/80">
                            {questionNumber} / {totalQuestions}
                        </span>
                    </div>

                    {/* Right: XP · streak · help toggle */}
                    <div className="flex flex-shrink-0 items-center gap-2">
                        {xpEarned > 0 && (
                            <motion.div
                                key={xpEarned}
                                initial={{ scale: 1.3, opacity: 0.7 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex items-center gap-1 rounded-lg border border-violet-400/20 bg-violet-400/10 px-2 py-1"
                            >
                                <Zap className="h-3 w-3 text-violet-300" />
                                <span className="text-xs font-bold text-violet-200">{xpEarned}</span>
                            </motion.div>
                        )}

                        {streak >= 2 && (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex items-center gap-1 rounded-lg border border-orange-400/20 bg-orange-400/10 px-2 py-1"
                            >
                                <Flame className="h-3 w-3 text-orange-300" />
                                <span className="text-xs font-bold text-orange-200">{streak}</span>
                            </motion.div>
                        )}

                        {/* Help toggle — desktop */}
                        <button
                            onClick={() => onHelpToggle?.(!isHelpOpen)}
                            className={[
                                'hidden lg:flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-medium transition',
                                isHelpOpen
                                    ? 'border-violet-400/30 bg-violet-400/15 text-violet-200'
                                    : 'border-white/12 bg-white/[0.06] text-white/55 hover:border-white/25 hover:text-white',
                            ].join(' ')}
                        >
                            <Lightbulb className="h-4 w-4" />
                            {isHelpOpen ? 'Dölj AI' : 'Hjälp'}
                        </button>

                        {/* Help — mobile */}
                        <button
                            onClick={() => setIsMobileHelpOpen(true)}
                            className="rounded-xl border border-white/12 bg-white/[0.06] p-2 text-white/55 transition hover:text-white lg:hidden"
                        >
                            <HelpCircle className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="h-0.5 bg-white/8">
                    <motion.div
                        className="h-full bg-gradient-to-r from-blue-400 to-violet-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                </div>
            </header>

            {/* ── 3-column body ─────────────────────────────────────────────── */}
            <div className="pt-[58px]">
                <div className="mx-auto grid max-w-[1600px] gap-4 px-3 py-4 sm:px-5 lg:grid-cols-[minmax(210px,20%)_minmax(0,1fr)_minmax(250px,20%)] lg:gap-5 lg:p-6 lg:pt-5">

                    {/* ── Left: Math Tools ─────────────────────────────────── */}
                    <GlassPanel className="order-2 p-4 lg:order-1 lg:sticky lg:top-[74px] lg:h-[calc(100vh-82px)] lg:overflow-y-auto">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-white/10 text-blue-100">
                                <Sigma className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">Math Tools</p>
                                <p className="text-xs text-white/50">Available without leaving the problem</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {TOOLS.map((tool) => {
                                const Icon = tool.icon;
                                const active = activeTool === tool.id;
                                return (
                                    <button
                                        key={tool.id}
                                        onClick={() => setActiveTool(tool.id)}
                                        className={[
                                            'w-full rounded-2xl border p-3 text-left transition',
                                            active
                                                ? 'border-white/30 bg-white/14 text-white'
                                                : 'border-white/10 bg-white/[0.04] text-white/68 hover:border-white/20 hover:bg-white/[0.08] hover:text-white',
                                        ].join(' ')}
                                    >
                                        <div className="mb-1 flex items-center gap-2">
                                            <Icon className="h-4 w-4" />
                                            <span className="text-sm font-semibold">{tool.label}</span>
                                        </div>
                                        <p className="text-xs leading-5 text-white/48">{tool.description}</p>
                                    </button>
                                );
                            })}
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTool}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.16 }}
                            >
                                {activeTool === 'calculator' && <CalculatorPanel />}
                                {activeTool === 'formulas' && <FormulaPanel />}
                                {activeTool === 'scratchpad' && <ScratchpadPanel />}
                            </motion.div>
                        </AnimatePresence>
                    </GlassPanel>

                    {/* ── Center: Question content ──────────────────────────── */}
                    <GlassPanel className="order-1 min-h-[60vh] p-5 lg:order-2 lg:sticky lg:top-[74px] lg:h-[calc(100vh-82px)] lg:overflow-y-auto lg:p-6">
                        {children}
                    </GlassPanel>

                    {/* ── Right: AI & Help ──────────────────────────────────── */}
                    <GlassPanel className="order-3 flex flex-col p-4 lg:sticky lg:top-[74px] lg:h-[calc(100vh-82px)]">
                        {/* Panel header */}
                        <div className="mb-4 flex flex-shrink-0 items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-white/10 text-violet-100">
                                    <Bot className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">AI & Help</p>
                                    <p className="text-xs text-white/50">Guidance without revealing too much</p>
                                </div>
                            </div>
                            {isHelpOpen && (
                                <button
                                    onClick={() => onHelpToggle?.(false)}
                                    className="rounded-xl border border-white/12 bg-white/[0.06] p-1.5 text-white/50 transition hover:text-white"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* Panel content — fills remaining height */}
                        <div className="min-h-0 flex-1 overflow-y-auto">
                            {isHelpOpen && rightPanel ? (
                                rightPanel
                            ) : (
                                <DefaultHelpContent onOpenAI={() => onHelpToggle?.(true)} />
                            )}
                        </div>
                    </GlassPanel>
                </div>
            </div>

            {/* ── Mobile bottom sheet ───────────────────────────────────────── */}
            <AnimatePresence>
                {isMobileHelpOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
                            onClick={() => setIsMobileHelpOpen(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed inset-x-0 bottom-0 z-50 flex h-[85vh] flex-col overflow-hidden rounded-t-3xl border-t border-white/15 bg-[#0d1033]/95 backdrop-blur-xl lg:hidden"
                        >
                            <div className="flex flex-none flex-col items-center border-b border-white/10 pb-3 pt-3 px-4">
                                <div className="mb-3 h-1 w-10 rounded-full bg-white/20" />
                                <div className="flex w-full items-center justify-between">
                                    <span className="flex items-center gap-2 text-sm font-semibold text-white">
                                        <Lightbulb className="h-4 w-4 text-violet-400" />
                                        AI-handledare
                                    </span>
                                    <button
                                        onClick={() => setIsMobileHelpOpen(false)}
                                        className="rounded-xl p-2 text-white/50 transition hover:text-white"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="min-h-0 flex-1 overflow-hidden">
                                {rightPanel ?? (
                                    <div className="p-4">
                                        <DefaultHelpContent
                                            onOpenAI={() => {
                                                onHelpToggle?.(true);
                                                setIsMobileHelpOpen(false);
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

export default LiquidGlassQuestionView;
