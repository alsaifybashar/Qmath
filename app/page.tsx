'use client';

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
    ArrowRight, BarChart3, BookOpen, BrainCircuit,
    Check, CheckCircle2, ChevronRight, Clock, FileText,
    Play, Sparkles, Target, TrendingUp, Trophy, X, Zap,
} from "lucide-react";
import dynamic from 'next/dynamic';
import 'katex/dist/katex.min.css';
import { Header } from "@/components/Header";
import { CubeArt, CurveArt, RipplesArt } from '@/components/ui/LineArt';

const InlineMath = dynamic(() => import('react-katex').then(m => m.InlineMath), { ssr: false });
const BlockMath = dynamic(() => import('react-katex').then(m => m.BlockMath), { ssr: false });

const SPRING = { type: 'spring' as const, duration: 0.55, bounce: 0 };
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

// ── Count-up animation ─────────────────────────────────────────────────────
function useCounter(to: number, duration = 1800, active = true): number {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!active) return;
        let cancelled = false;
        let start: number | null = null;
        const raf = (ts: number) => {
            if (cancelled) return;
            if (!start) start = ts;
            const p = Math.min((ts - start) / duration, 1);
            setCount(Math.floor(p * to));
            if (p < 1) requestAnimationFrame(raf);
            else setCount(to);
        };
        requestAnimationFrame(raf);
        return () => { cancelled = true; };
    }, [to, duration, active]);
    return count;
}

// ── Interactive demo ───────────────────────────────────────────────────────
interface DemoQ {
    topic: string;
    questionText: string;
    math: string;
    options: { text?: string; math?: string }[];
    correctIndex: number;
    explanation: string;
}

const DEMO_QUESTIONS: DemoQ[] = [
    {
        topic: 'Derivata',
        questionText: 'Vad är derivatan av',
        math: 'f(x) = x^3 + 2x',
        options: [{ math: '3x^2 + 2' }, { math: '3x^2' }, { math: 'x^2 + 2' }, { math: '3x + 2' }],
        correctIndex: 0,
        explanation: 'Derivera term för term: (x³)′ = 3x² och (2x)′ = 2, alltså f′(x) = 3x² + 2.',
    },
    {
        topic: 'Gränsvärde',
        questionText: 'Beräkna gränsvärdet',
        math: '\\lim_{x \\to 0} \\dfrac{\\sin x}{x}',
        options: [{ text: '1' }, { text: '0' }, { text: '∞' }, { text: 'Existerar inte' }],
        correctIndex: 0,
        explanation: 'Klassiskt gränsvärde: sin x ≈ x när x → 0, så kvoten → 1. Bekräftas av L\'Hôpitals regel.',
    },
    {
        topic: 'Integration',
        questionText: 'Beräkna integralen',
        math: '\\int_0^1 x^2\\,dx',
        options: [{ math: '\\tfrac{1}{3}' }, { math: '\\tfrac{1}{2}' }, { text: '1' }, { math: '\\tfrac{2}{3}' }],
        correctIndex: 0,
        explanation: '∫x²dx = x³/3 + C. Utvärderat [0,1] ger 1/3 − 0 = 1/3.',
    },
];

function LiveDemo() {
    const [qi, setQi] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [answered, setAnswered] = useState(false);
    const q = DEMO_QUESTIONS[qi];

    function pick(idx: number) {
        if (answered) return;
        setSelected(idx);
        setAnswered(true);
    }

    function next() {
        setSelected(null);
        setAnswered(false);
        setQi((qi + 1) % DEMO_QUESTIONS.length);
    }

    return (
        <div className="rounded-2xl overflow-hidden bg-[#0d1117] border border-white/10 shadow-2xl shadow-black/60">
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.08] bg-white/[0.04]">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/70" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                    <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <span className="text-xs text-white/40 font-mono">qmath — live session</span>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">
                    Live Demo
                </span>
            </div>

            <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400">{q.topic}</span>
                    <div className="flex gap-1">
                        {DEMO_QUESTIONS.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1 w-6 rounded-full transition-colors duration-300 ${i === qi ? 'bg-blue-400' : i < qi ? 'bg-blue-400/40' : 'bg-white/10'}`}
                            />
                        ))}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={qi}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.28 }}
                    >
                        <p className="text-sm text-white/55 mb-3">{q.questionText}</p>
                        <div className="bg-white/[0.05] rounded-xl p-4 mb-5 text-center overflow-x-auto">
                            <BlockMath math={q.math} />
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-4">
                            {q.options.map((opt, i) => {
                                const isCorrect = i === q.correctIndex;
                                const isSelected = i === selected;
                                let cls = 'bg-white/[0.05] hover:bg-white/[0.10] border-white/10';
                                if (answered) {
                                    if (isCorrect) cls = 'bg-emerald-500/20 border-emerald-500/50';
                                    else if (isSelected) cls = 'bg-red-500/20 border-red-500/50';
                                    else cls = 'bg-white/[0.03] border-white/5 opacity-50';
                                }
                                return (
                                    <motion.button
                                        key={i}
                                        onClick={() => pick(i)}
                                        whileHover={answered ? {} : { scale: 1.02 }}
                                        whileTap={answered ? {} : { scale: 0.97 }}
                                        className={`relative flex items-center justify-center gap-1.5 p-3 rounded-xl border text-sm font-medium text-white transition-all duration-200 ${cls}`}
                                    >
                                        {answered && isCorrect && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                                        {answered && isSelected && !isCorrect && <X className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                                        {opt.math ? <InlineMath math={opt.math} /> : <span>{opt.text}</span>}
                                    </motion.button>
                                );
                            })}
                        </div>

                        <AnimatePresence>
                            {answered && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className={`p-4 rounded-xl text-sm mb-4 leading-relaxed ${selected === q.correctIndex ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border border-red-500/30 text-red-300'}`}>
                                        <span className="font-bold mr-1">{selected === q.correctIndex ? '🎉 Rätt!' : 'Inte riktigt.'}</span>
                                        {q.explanation}
                                    </div>
                                    <motion.button
                                        onClick={next}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
                                    >
                                        {qi < DEMO_QUESTIONS.length - 1 ? 'Nästa fråga' : 'Börja om'}
                                        <ArrowRight className="w-4 h-4" />
                                    </motion.button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

// ── Mastery grid ───────────────────────────────────────────────────────────
const TOPICS = [
    { name: 'Derivata', mastery: 92, course: 'MVE140' },
    { name: 'Gränsvärden', mastery: 88, course: 'MVE140' },
    { name: 'Taylorutveckling', mastery: 83, course: 'MVE140' },
    { name: 'Vektorfält', mastery: 55, course: 'MVE230' },
    { name: 'Integration', mastery: 74, course: 'MVE140' },
    { name: 'Linjär algebra', mastery: 61, course: 'MVE220' },
    { name: 'Seriekonvergens', mastery: 45, course: 'MVE140' },
    { name: 'Flervariabelanalys', mastery: 38, course: 'MVE230' },
    { name: 'Fourierserie', mastery: 29, course: 'MVE235' },
    { name: 'Differentialekvationer', mastery: 21, course: 'MVE162' },
    { name: 'Matrisfaktorisering', mastery: 17, course: 'MVE220' },
    { name: 'Komplex analys', mastery: 12, course: 'MVE280' },
];

function masteryColor(m: number) {
    if (m >= 80) return { bar: 'bg-emerald-500', text: 'text-emerald-400' };
    if (m >= 60) return { bar: 'bg-blue-500', text: 'text-blue-400' };
    if (m >= 35) return { bar: 'bg-amber-500', text: 'text-amber-400' };
    return { bar: 'bg-red-500', text: 'text-red-400' };
}

function MasteryGrid() {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, margin: '-60px' });
    const reducedMotion = Boolean(useReducedMotion());
    return (
        <div ref={ref} className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TOPICS.map((t, i) => {
                const c = masteryColor(t.mastery);
                return (
                    <motion.div
                        key={t.name}
                        initial={reducedMotion ? false : { opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
                        animate={inView ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : {}}
                        transition={{ ...SPRING, delay: i * 0.04 }}
                        className="p-3 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.07] transition-colors"
                    >
                        <div className="flex items-start justify-between gap-1 mb-2">
                            <p className="text-xs font-semibold text-white/80 leading-tight">{t.name}</p>
                            <span className={`text-xs font-bold tabular-nums shrink-0 ${c.text}`}>{t.mastery}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <motion.div
                                className={`h-full origin-left rounded-full ${c.bar}`}
                                style={{ width: `${t.mastery}%` }}
                                initial={reducedMotion ? false : { scaleX: 0 }}
                                animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
                                transition={{ ...SPRING, delay: 0.16 + i * 0.04 }}
                            />
                        </div>
                        <p className="text-[10px] text-white/25 mt-1.5 font-mono">{t.course}</p>
                    </motion.div>
                );
            })}
        </div>
    );
}

// ── AI tutor chat ──────────────────────────────────────────────────────────
type ChatMsg = { role: 'user' | 'ai'; text: string; math?: string };

const AI_MESSAGES: ChatMsg[] = [
    { role: 'user', text: 'Förstår inte varför ∫sin(x)dx = −cos(x)?' },
    { role: 'ai', text: 'Integration och derivering är varandras omvändningar. Derivera −cos x:', math: '\\tfrac{d}{dx}(-\\cos x) = \\sin x' },
    { role: 'ai', text: 'Alltså måste integralen av sin(x) vara −cos(x) + C. Klart?' },
    { role: 'user', text: 'Ja! Ge mig en övningsuppgift.' },
    { role: 'ai', text: 'Baserat på din nivå väljer jag exakt rätt svårighetsgrad:', math: '\\int \\cos(2x)\\,dx = ?' },
];

function AIChatDemo() {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const reducedMotion = Boolean(useReducedMotion());
    const [visible, setVisible] = useState(0);
    const [typing, setTyping] = useState(false);

    useEffect(() => {
        if (!inView) return;
        let cancelled = false;
        async function run() {
            for (let i = 0; i < AI_MESSAGES.length; i++) {
                if (cancelled) return;
                if (AI_MESSAGES[i].role === 'ai') {
                    setTyping(true);
                    await new Promise(r => setTimeout(r, 900));
                    if (cancelled) return;
                    setTyping(false);
                }
                setVisible(v => v + 1);
                await new Promise(r => setTimeout(r, 700));
            }
        }
        run();
        return () => { cancelled = true; };
    }, [inView]);

    return (
        <div ref={ref} className="space-y-3 max-h-72 overflow-y-auto">
            <AnimatePresence>
                {AI_MESSAGES.slice(0, visible).map((msg, i) => (
                    <motion.div
                        key={i}
                        initial={reducedMotion ? false : { opacity: 0, y: 8, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={SPRING}
                        className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${msg.role === 'ai' ? 'bg-blue-600 text-white' : 'bg-white/15 text-white/70'}`}>
                            {msg.role === 'ai' ? 'Q' : 'S'}
                        </div>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'ai' ? 'bg-white/[0.08] text-white/90 rounded-tl-sm' : 'bg-blue-600 text-white rounded-tr-sm'}`}>
                            <p>{msg.text}</p>
                            {msg.math && (
                                <div className="mt-2 bg-white/[0.07] rounded-lg p-2 text-center overflow-x-auto">
                                    <InlineMath math={msg.math} />
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
            <AnimatePresence>
                {typing && (
                    <motion.div
                        initial={reducedMotion ? false : { opacity: 0, y: 8, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={SPRING}
                        className="flex gap-2.5"
                    >
                        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">Q</div>
                        <div className="bg-white/[0.08] rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
                            {[0, 1, 2].map(i => (
                                <motion.div
                                    key={i}
                                    className="w-1.5 h-1.5 rounded-full bg-white/50"
                                    animate={reducedMotion ? {} : { y: [0, -4, 0] }}
                                    transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity, ease: EASE_OUT }}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Stat counter ───────────────────────────────────────────────────────────
function StatCounter({ value, suffix = '', label }: { value: number; suffix?: string; label: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true });
    const count = useCounter(value, 1800, inView);
    return (
        <div ref={ref} className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-white tabular-nums">
                {count.toLocaleString('sv')}{suffix}
            </div>
            <div className="mt-1.5 text-sm text-white/45">{label}</div>
        </div>
    );
}

// ── Feature cards ──────────────────────────────────────────────────────────
const FEATURES = [
    { icon: BrainCircuit, label: 'Adaptiva uppgifter', desc: 'Systemet anpassar svårighetsgraden i realtid baserat på hur du svarar.', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { icon: BarChart3, label: 'Framstegsspårning', desc: 'Visualisera din inlärningskurva per ämne, session för session.', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { icon: Trophy, label: 'Steg-för-steg', desc: 'Fick du fel? Fullständig genomgång med LaTeX-renderade formler.', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { icon: Clock, label: 'Tentamensläge', desc: 'Träna under press med tidsinställda simuleringar av riktiga tentor.', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { icon: BookOpen, label: 'Studiesvit', desc: 'Flashcards, sammanfattningar och formelblad — allt på ett ställe.', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { icon: Zap, label: 'XP & nivåer', desc: 'Bygg studiestreaks och samla erfarenhetspoäng för varje session.', color: 'text-rose-400', bg: 'bg-rose-500/10' },
];

const ENGINE_STEPS = [
    {
        icon: FileText,
        label: 'Läser kursen',
        title: 'Tidigare tentor blir en karta',
        desc: 'Qmath hittar återkommande moment, svårighetsgrad och typiska fallgropar i kursmaterialet.',
        color: 'text-cyan-300',
    },
    {
        icon: Target,
        label: 'Diagnostiserar',
        title: 'Startar på rätt nivå',
        desc: 'Du slipper börja från noll. Motorn ser snabbt vilka delar som redan sitter.',
        color: 'text-blue-300',
    },
    {
        icon: BrainCircuit,
        label: 'Anpassar',
        title: 'Nästa uppgift väljs live',
        desc: 'Varje svar påverkar nästa fråga, hint och repetition så att träningen förblir precis lagom svår.',
        color: 'text-violet-300',
    },
    {
        icon: TrendingUp,
        label: 'Planerar',
        title: 'Visar vägen till tentan',
        desc: 'Dashboarden översätter progress till fokuspass, repetition och tydliga mål inför provdagen.',
        color: 'text-emerald-300',
    },
];

function HeroProductPreview({ reducedMotion }: { reducedMotion: boolean }) {
    const cardMotion = reducedMotion
        ? {}
        : {
            initial: { opacity: 0, y: 18, filter: 'blur(6px)' },
            animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
        };

    return (
        <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 24, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ ...SPRING, delay: 0.45 }}
            className="relative mx-auto w-full max-w-[520px] lg:max-w-none"
        >
            <div className="absolute -inset-6 rounded-[2rem] bg-blue-500/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0c1022]/90 shadow-2xl shadow-black/50 backdrop-blur-xl">
                <div className="flex items-center gap-3 border-b border-white/[0.08] bg-white/[0.04] px-5 py-4">
                    <div className="flex gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                    </div>
                    <span className="text-xs font-medium text-white/35">Qmath cockpit</span>
                    <span className="ml-auto rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                        Nästa pass klart
                    </span>
                </div>

                <div className="grid gap-4 p-4 sm:p-5">
                    <motion.div
                        {...cardMotion}
                        transition={{ ...SPRING, delay: 0.58 }}
                        className="rounded-2xl border border-white/[0.08] bg-white/[0.05] p-4"
                    >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="relative grid h-28 w-28 shrink-0 place-items-center rounded-full bg-[conic-gradient(from_210deg,#34d399_0_62%,rgba(255,255,255,0.10)_62%_100%)]">
                                <div className="grid h-20 w-20 place-items-center rounded-full bg-[#0c1022]">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold tabular-nums text-white">62%</div>
                                        <div className="text-[10px] uppercase tracking-wide text-white/35">redo</div>
                                    </div>
                                </div>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">TATA24</p>
                                <h3 className="mt-1 text-xl font-bold text-white">Analys i flera variabler</h3>
                                <p className="mt-2 text-sm leading-relaxed text-white/45">
                                    Svagaste länken: vektorfält. Störst snabb vinst: partiella derivator.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        {[
                            { label: 'Nästa uppgift', value: 'Gröns sats', tone: 'text-cyan-300' },
                            { label: 'Repetition', value: '14 kort', tone: 'text-violet-300' },
                            { label: 'Tenta-fokus', value: '3 pass', tone: 'text-emerald-300' },
                        ].map((item, i) => (
                            <motion.div
                                key={item.label}
                                {...cardMotion}
                                transition={{ ...SPRING, delay: 0.68 + i * 0.08 }}
                                className="rounded-2xl border border-white/[0.08] bg-white/[0.045] p-4"
                            >
                                <p className="text-[11px] text-white/35">{item.label}</p>
                                <p className={`mt-1 text-sm font-bold ${item.tone}`}>{item.value}</p>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        {...cardMotion}
                        transition={{ ...SPRING, delay: 0.95 }}
                        className="rounded-2xl border border-blue-300/20 bg-blue-500/[0.08] p-4"
                    >
                        <div className="mb-3 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-blue-300" />
                            <span className="text-sm font-semibold text-white">AI-plan för dagens session</span>
                        </div>
                        <div className="space-y-2">
                            {[
                                ['8 min', 'Diagnos: flödesintegraler'],
                                ['18 min', 'Adaptiva uppgifter med hints'],
                                ['6 min', 'Snabb repetition av tidigare fel'],
                            ].map(([time, text]) => (
                                <div key={text} className="flex items-center gap-3 rounded-xl bg-white/[0.05] px-3 py-2 text-sm text-white/65">
                                    <span className="w-11 text-xs font-bold tabular-nums text-blue-300">{time}</span>
                                    <span>{text}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            <motion.div
                initial={reducedMotion ? false : { opacity: 0, x: -12, filter: 'blur(6px)' }}
                animate={reducedMotion ? { opacity: 1 } : { opacity: 1, x: 0, y: [0, -6, 0], filter: 'blur(0px)' }}
                transition={reducedMotion ? { duration: 0 } : { opacity: { delay: 1.05, duration: 0.35 }, x: { ...SPRING, delay: 1.05 }, y: { duration: 4.2, repeat: Infinity, ease: 'linear' } }}
                className="absolute -left-3 bottom-10 hidden rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 shadow-xl shadow-black/25 backdrop-blur sm:block"
            >
                <p className="text-xs font-semibold text-emerald-200">+18% mastery på 32 minuter</p>
                <p className="mt-1 text-[11px] text-white/40">Baserat på dina senaste svar</p>
            </motion.div>
        </motion.div>
    );
}

function StudyEngineShowcase() {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const reducedMotion = Boolean(useReducedMotion());

    return (
        <section className="px-4 py-28">
            <div ref={ref} className="mx-auto max-w-6xl">
                <motion.div
                    initial={reducedMotion ? false : { opacity: 0, y: 18, filter: 'blur(6px)' }}
                    animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
                    transition={SPRING}
                    className="mb-12 max-w-3xl"
                >
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Det här är potentialen</span>
                    <h2 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
                        Från gamla tentor till en personlig träningsmotor.
                    </h2>
                    <p className="mt-5 text-lg leading-relaxed text-white/50">
                        Hemsidan ska inte bara visa matte. Den ska visa studenten exakt vad som händer
                        när data, AI och adaptiv träning jobbar tillsammans.
                    </p>
                </motion.div>

                <div className="grid gap-4 lg:grid-cols-4">
                    {ENGINE_STEPS.map(({ icon: Icon, label, title, desc, color }, i) => (
                        <motion.div
                            key={label}
                            initial={reducedMotion ? false : { opacity: 0, y: 18, filter: 'blur(6px)' }}
                            animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
                            transition={{ ...SPRING, delay: i * 0.08 }}
                            className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.045] p-5"
                        >
                            <div className="mb-5 flex items-center justify-between">
                                <div className={`grid h-11 w-11 place-items-center rounded-xl bg-white/[0.06] ${color}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <span className="text-xs font-bold tabular-nums text-white/20">0{i + 1}</span>
                            </div>
                            <p className={`text-xs font-bold uppercase tracking-wider ${color}`}>{label}</p>
                            <h3 className="mt-2 text-lg font-bold text-white">{title}</h3>
                            <p className="mt-3 text-sm leading-relaxed text-white/42">{desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ── Feature tiles (Tre sätt att bli tentaredo) ────────────────────────────

const FEATURE_TILES = [
    {
        art: <CurveArt goodLabel="Bra" greatLabel="Utmärkt" size={140} />,
        eyebrow: 'Adaptiv motor',
        title: 'Adaptiv övning',
        desc: 'AI:n väljer uppgifter på exakt rätt svårighetsnivå — varje minut du övar ger maximalt lärande.',
        href: '/study',
        accent: 'text-indigo-400',
        border: 'border-indigo-500/20',
        glow: 'rgba(40, 175, 176,0.08)',
    },
    {
        art: <CubeArt size={140} />,
        eyebrow: 'Tentaförberedelse',
        title: 'Tentamenssimulering',
        desc: 'Skriv en hel tenta under riktiga villkor och få en uppskattad poäng — innan det räknas på riktigt.',
        href: '/exam-sim',
        accent: 'text-teal-400',
        border: 'border-teal-500/20',
        glow: 'rgba(20,184,166,0.08)',
    },
    {
        art: <RipplesArt size={140} />,
        eyebrow: 'Framstegsspårning',
        title: 'Din analys',
        desc: 'Följ din kunskapsutveckling över tid och se exakt vilka ämnen som lyfter ditt resultat mest.',
        href: '/analytics',
        accent: 'text-amber-400',
        border: 'border-amber-500/20',
        glow: 'rgba(223, 168, 27,0.08)',
    },
];

function FeatureTilesSection() {
    return (
        <section className="py-28 px-4">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-14"
                >
                    <span className="text-xs font-bold uppercase tracking-wider text-white/35">
                        Hur det fungerar
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold mt-4 leading-tight">
                        Tre sätt att bli tentaredo
                    </h2>
                    <p className="text-white/40 text-lg mt-4 max-w-xl mx-auto leading-relaxed">
                        Kombinera alla tre för bästa resultat — eller börja med det som passar dig bäst just nu.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {FEATURE_TILES.map((tile, i) => (
                        <motion.div
                            key={tile.href}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-40px' }}
                            transition={{ duration: 0.55, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                            whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        >
                            <Link
                                href={tile.href}
                                className={`group flex flex-col h-full rounded-2xl border ${tile.border} bg-white/[0.04] hover:bg-white/[0.07] transition-colors overflow-hidden`}
                                style={{ boxShadow: `0 0 0 0 ${tile.glow}`, transition: 'box-shadow 300ms ease, background-color 200ms ease' }}
                            >
                                {/* Art area */}
                                <div className="flex items-center justify-center py-10 border-b border-white/[0.06]" style={{ background: `radial-gradient(ellipse 80% 70% at 50% 50%, ${tile.glow}, transparent)` }}>
                                    {tile.art}
                                </div>

                                {/* Text area */}
                                <div className="p-6 flex flex-col flex-1">
                                    <span className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${tile.accent}`}>
                                        {tile.eyebrow}
                                    </span>
                                    <h3 className="text-lg font-bold text-white mb-2 leading-snug" style={{ letterSpacing: '-0.02em' }}>
                                        {tile.title}
                                    </h3>
                                    <p className="text-sm text-white/42 leading-relaxed flex-1">
                                        {tile.desc}
                                    </p>
                                    <div className={`flex items-center gap-1.5 mt-5 text-sm font-semibold ${tile.accent} group-hover:gap-2.5 transition-all duration-200`}>
                                        Utforska <ArrowRight size={14} />
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function Home() {
    const heroRef = useRef<HTMLDivElement>(null);
    const demoRef = useRef<HTMLElement>(null);
    const reducedMotion = Boolean(useReducedMotion());
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

    function scrollToDemo() {
        demoRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    return (
        <main className="relative min-h-screen bg-[#08091F] text-white overflow-x-hidden selection:bg-blue-500/40">
            <Header />

            {/* ── HERO ────────────────────────────────────────────────────── */}
            <section ref={heroRef} className="relative flex min-h-screen items-center overflow-hidden px-4 pb-16 pt-28 lg:pt-24">
                {/* Background */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-5%,rgba(53, 133, 163,0.20),transparent)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_35%_at_85%_85%,rgba(25, 100, 126,0.14),transparent)]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px]" />

                {/* Floating math formulas */}
                {([
                    { math: 'e^{i\\pi} + 1 = 0', left: '7%', top: '22%', rotate: -6, delay: 0.4 },
                    { math: '\\nabla^2 f = \\frac{\\partial^2 f}{\\partial x^2} + \\frac{\\partial^2 f}{\\partial y^2}', left: '68%', top: '16%', rotate: 5, delay: 0.6 },
                    { math: '\\int_{-\\infty}^{\\infty} e^{-x^2}dx = \\sqrt{\\pi}', left: '4%', top: '66%', rotate: 3, delay: 0.8 },
                    { math: 'A\\vec{x} = \\lambda\\vec{x}', left: '74%', top: '70%', rotate: -5, delay: 1.0 },
                ] as const).map((f, i) => (
                    <div key={i} className="absolute hidden xl:block" style={{ left: f.left, top: f.top, transform: `rotate(${f.rotate}deg)` }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={reducedMotion ? { opacity: 0.45 } : { opacity: 0.55, y: [0, -10, 0] }}
                            transition={{
                                opacity: { delay: f.delay, duration: 1 },
                                y: { delay: f.delay, duration: 5 + i, repeat: Infinity, ease: EASE_OUT },
                            }}
                        >
                            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.07] rounded-2xl px-4 py-3">
                                <BlockMath math={f.math} />
                            </div>
                        </motion.div>
                    </div>
                ))}

                <motion.div
                    style={{ y: reducedMotion ? 0 : heroY, opacity: heroOpacity }}
                    className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[0.94fr_1.06fr]"
                >
                    <div className="text-center lg:text-left">
                        <motion.div
                            initial={reducedMotion ? false : { opacity: 0, y: 16, filter: 'blur(6px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            transition={{ ...SPRING, delay: 0.12 }}
                            className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/[0.08] px-4 py-1.5 text-sm font-medium text-blue-300"
                        >
                            <span className="relative flex h-2 w-2">
                                {!reducedMotion && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />}
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                            </span>
                            Adaptiv matematik för civilingenjörer
                        </motion.div>

                        <motion.h1
                            initial={reducedMotion ? false : { opacity: 0, y: 28, filter: 'blur(8px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            transition={{ ...SPRING, delay: 0.22 }}
                            className="mb-7 text-5xl font-bold leading-[1.04] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[5.25rem]"
                        >
                            <span className="block">Klara ingenjörsmatten.</span>
                            <span className="block bg-gradient-to-r from-blue-300 via-cyan-200 to-emerald-300 bg-clip-text text-transparent">
                                Med en motor som lär sig dig.
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={reducedMotion ? false : { opacity: 0, y: 16, filter: 'blur(6px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            transition={{ ...SPRING, delay: 0.34 }}
                            className="mx-auto mb-9 max-w-2xl text-lg leading-relaxed text-white/54 md:text-xl lg:mx-0"
                        >
                            Qmath analyserar kursen, hittar dina svaga punkter och bygger ett
                            personligt träningsflöde med uppgifter, hints, flashcards och tentaplan.
                            Det känns mindre som en statisk sida och mer som ett kontrollrum för din inlärning.
                        </motion.p>

                        <motion.div
                            initial={reducedMotion ? false : { opacity: 0, y: 16, filter: 'blur(6px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            transition={{ ...SPRING, delay: 0.44 }}
                            className="mb-10 flex flex-col items-center gap-4 sm:flex-row lg:items-start"
                        >
                            <Link
                                href="/register"
                                className="group inline-flex items-center gap-2 rounded-full bg-blue-500 px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-blue-500/25 transition-colors hover:bg-blue-400 hover:shadow-blue-500/35"
                            >
                                Skapa konto gratis
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                            <button
                                onClick={scrollToDemo}
                                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-7 py-3.5 text-base font-semibold text-white/75 transition-colors hover:bg-white/[0.10]"
                            >
                                <Play className="h-4 w-4 fill-current" />
                                Testa direkt
                            </button>
                        </motion.div>

                        <motion.div
                            initial={reducedMotion ? false : { opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.68 }}
                            className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/35 lg:justify-start"
                        >
                            <span>12 000+ uppgifter</span>
                            <span className="text-white/15">/</span>
                            <span>87% förbättrade betyg</span>
                            <span className="text-white/15">/</span>
                            <span>15+ kurser</span>
                            <span className="text-white/15">/</span>
                            <span>Inget kreditkort krävs</span>
                        </motion.div>
                    </div>

                    <HeroProductPreview reducedMotion={reducedMotion} />
                </motion.div>

                <motion.div
                    initial={reducedMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.8 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2"
                >
                    <motion.div
                        animate={reducedMotion ? {} : { y: [0, 8, 0] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: EASE_OUT }}
                        className="w-5 h-8 rounded-full border-2 border-white/20 flex items-start justify-center pt-1"
                    >
                        <div className="w-1 h-2 rounded-full bg-white/30" />
                    </motion.div>
                </motion.div>
            </section>

            {/* ── LIVE DEMO ───────────────────────────────────────────────── */}
            <section ref={demoRef} className="py-28 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -24 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-400 text-xs font-semibold mb-6">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                                Interaktiv demo — inget konto krävs
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                                Lös en riktig uppgift.<br />
                                <span className="text-white/40">Just nu.</span>
                            </h2>
                            <p className="text-white/50 text-lg leading-relaxed mb-8">
                                Prova vår adaptiva motor direkt här. Välj ett svar — och se hur
                                systemet förklarar precis det du behöver veta.
                            </p>
                            <div className="space-y-4">
                                {[
                                    { icon: Target, text: 'Uppgifter anpassade efter din nuvarande nivå' },
                                    { icon: Sparkles, text: 'Omedelbar förklaring vid fel svar' },
                                    { icon: TrendingUp, text: 'Din progress sparas och byggs upp automatiskt' },
                                ].map(({ icon: Icon, text }, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -12 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1, duration: 0.45 }}
                                        className="flex items-center gap-3 text-white/65 text-sm"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                                            <Icon className="w-4 h-4 text-blue-400" />
                                        </div>
                                        {text}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 24 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <LiveDemo />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── STATS ───────────────────────────────────────────────────── */}
            <section className="py-20 border-y border-white/[0.08] bg-white/[0.025]">
                <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-10">
                    <StatCounter value={12000} suffix="+" label="Uppgifter" />
                    <StatCounter value={87} suffix="%" label="Förbättrade betyg" />
                    <StatCounter value={15} suffix="+" label="Kurser" />
                    <StatCounter value={3} suffix="×" label="Snabbare inlärning" />
                </div>
            </section>

            <StudyEngineShowcase />

            {/* ── TRE SÄTT ATT BLI TENTAREDO ──────────────────────────── */}
            <FeatureTilesSection />

            {/* ── MASTERY MAP ─────────────────────────────────────────────── */}
            <section className="py-28 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                            className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h3 className="font-bold text-white text-sm">Din kunskapskarta</h3>
                                    <p className="text-white/35 text-xs mt-0.5">12 ämnen · Uppdateras i realtid</p>
                                </div>
                                <div className="hidden sm:flex gap-3 text-xs text-white/35">
                                    {[
                                        { color: 'bg-emerald-500', label: 'Bemästrad' },
                                        { color: 'bg-blue-500', label: 'Lärande' },
                                        { color: 'bg-amber-500', label: 'Utvecklas' },
                                        { color: 'bg-red-500', label: 'Fokus' },
                                    ].map(({ color, label }) => (
                                        <div key={label} className="flex items-center gap-1">
                                            <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
                                            {label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <MasteryGrid />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 24 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Framstegsspårning</span>
                            <h2 className="text-4xl md:text-5xl font-bold leading-tight mt-4 mb-6">
                                Se exakt vad du kan —<br />
                                <span className="text-white/35">och vad du behöver öva.</span>
                            </h2>
                            <p className="text-white/50 text-lg leading-relaxed mb-8">
                                Qmath bygger en detaljerad bild av din kunskapsnivå för varje ämne
                                i din kurs. Inga gissningar — bara datadriven feedback om vart du
                                ska fokusera härnäst.
                            </p>
                            <Link
                                href="/dashboard"
                                className="group inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                            >
                                Utforska dashboarden
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── AI TUTOR ────────────────────────────────────────────────── */}
            <section className="py-28 px-4 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent">
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -24 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <span className="text-xs font-bold uppercase tracking-wider text-violet-400">AI-handledare</span>
                            <h2 className="text-4xl md:text-5xl font-bold leading-tight mt-4 mb-6">
                                Steg-för-steg förklaring.<br />
                                <span className="text-white/35">Alltid tillgänglig.</span>
                            </h2>
                            <p className="text-white/50 text-lg leading-relaxed mb-8">
                                Fick du ett fel svar? Qmath bryter ner problemet med LaTeX-renderade
                                formler — precis som en personlig handledare, fast tillgänglig
                                dygnet runt.
                            </p>
                            <div className="space-y-3">
                                {[
                                    'Förklarar varför ditt svar var fel',
                                    'Visar det korrekta räknesättet steg för steg',
                                    'Väljer uppföljningsfrågor för att stärka förståelsen',
                                ].map((text, i) => (
                                    <div key={i} className="flex items-center gap-3 text-white/65 text-sm">
                                        <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0" />
                                        {text}
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 24 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                            className="rounded-2xl border border-white/10 bg-[#0d1117] p-5"
                        >
                            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/[0.08]">
                                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">Q</div>
                                <span className="text-sm font-semibold text-white">Qmath Handledare</span>
                                <span className="ml-auto text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                                    Online
                                </span>
                            </div>
                            <AIChatDemo />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── FEATURES GRID ───────────────────────────────────────────── */}
            <section className="py-28 px-4">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-14"
                    >
                        <span className="text-xs font-bold uppercase tracking-wider text-white/35">Allt du behöver</span>
                        <h2 className="text-4xl md:text-5xl font-bold mt-4">Komplett studiesvit</h2>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {FEATURES.map(({ icon: Icon, label, desc, color, bg }, i) => (
                            <motion.div
                                key={label}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-40px' }}
                                transition={{ duration: 0.5, delay: i * 0.07 }}
                                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                                className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.07] transition-colors group cursor-default"
                            >
                                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon className={`w-5 h-5 ${color}`} />
                                </div>
                                <h3 className="font-semibold text-white mb-1.5">{label}</h3>
                                <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FINAL CTA ───────────────────────────────────────────────── */}
            <section className="py-28 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/[0.08] text-amber-300 text-sm font-medium mb-8">
                            <Clock className="w-3.5 h-3.5" />
                            Tentan är på väg — börja nu
                        </div>
                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
                            Dina betyg förändras<br />
                            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                                en session i taget.
                            </span>
                        </h2>
                        <p className="text-white/45 text-lg mb-10 max-w-xl mx-auto">
                            Tusentals studenter använder Qmath för att gå från underkänd till
                            godkänd — och från godkänd till betyg A.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/register"
                                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-zinc-950 font-bold text-base hover:bg-white/90 transition-colors shadow-xl shadow-white/10"
                            >
                                Börja öva gratis
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                            <Link
                                href="/courses"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.10] text-white font-semibold text-base transition-colors"
                            >
                                <BookOpen className="w-4 h-4" />
                                Se kurser
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── FOOTER ──────────────────────────────────────────────────── */}
            <footer className="py-12 border-t border-white/[0.08]">
                <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-xl text-white">Qmath</span>
                        <span className="text-xs px-2 py-0.5 rounded-full border border-blue-500/30 text-blue-400 font-medium">Beta</span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-6 text-sm text-white/35">
                        <Link href="/features" className="hover:text-white/70 transition-colors">Funktioner</Link>
                        <Link href="/pricing" className="hover:text-white/70 transition-colors">Priser</Link>
                        <Link href="/about" className="hover:text-white/70 transition-colors">Om oss</Link>
                        <Link href="/privacy" className="hover:text-white/70 transition-colors">Integritet</Link>
                        <Link href="/terms" className="hover:text-white/70 transition-colors">Villkor</Link>
                    </div>
                    <p className="text-sm text-white/25">© 2026 Qmath EdTech AB</p>
                </div>
            </footer>
        </main>
    );
}
