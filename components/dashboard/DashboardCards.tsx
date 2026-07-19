'use client';

import {
    ArrowRight, Play, Brain, FileText, Target,
    BookOpen, GraduationCap, User, Settings, HelpCircle,
    CreditCard, Info, MessageSquare, Zap, BarChart,
    History, FlaskConical,
    Calculator, Sigma, GitBranch, BarChart2 as BarChartIcon,
    Atom, FlaskRound, Waves, Network,
    type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { CubeArt, RipplesArt } from '@/components/ui/LineArt';

// ─── Color tokens ────────────────────────────────────────────────────────────
// ElevenLabs-inspired: near-monochrome canvas + exactly one signature accent.
// Reserved for the primary CTA, active states, and section eyebrows — never
// used to color-code courses, mastery levels, or decorative chips.
const ACCENT_BASE = { base: '#3f6c51', light: '#5f8a70', muted: 'rgba(63,108,81,0.09)', border: 'rgba(63,108,81,0.24)', glow: 'rgba(63,108,81,0.16)' };
const ACCENT = { indigo: ACCENT_BASE }; // key kept as `indigo` to avoid a rename ripple; value is moss

// ─── DashboardHeader ─────────────────────────────────────────────────────────

interface DashboardHeaderProps {
    name: string;
    streak: number;
    accuracy: number;
    totalQuestions: number;
    level: number;
}

export function DashboardHeader({ name, streak, accuracy, totalQuestions, level }: DashboardHeaderProps) {
    const stats: Array<{ value: string; label: string }> = [
        { value: `${streak}`, label: streak === 1 ? 'dag i svit' : 'dagar i svit' },
        { value: `${accuracy}%`, label: 'noggrannhet' },
        { value: `${totalQuestions}`, label: 'frågor besvarade' },
        { value: `${level}`, label: 'nivå' },
    ];

    return (
        <div className="dashboard-card dashboard-panel dashboard-panel-hero dashboard-card-animate mb-8 overflow-hidden p-5 sm:p-6" style={{ animationDelay: '0ms' }}>
            <div className="grid gap-6 lg:grid-cols-1 lg:items-stretch">
                <div className="flex min-w-0 flex-col justify-between gap-8">
                    <div>
                        <p className="dashboard-panel-eyebrow mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase">
                            <Target size={13} />
                            Översikt
                        </p>
                        <h1 className="max-w-2xl text-balance text-3xl font-semibold leading-tight sm:text-4xl" style={{ letterSpacing: 0, color: 'var(--foreground)' }}>
                            Välkommen tillbaka, {name}
                        </h1>
                        <p className="mt-2 max-w-xl text-pretty text-sm leading-6 dashboard-muted">
                            En fokuserad vy för dagens övning, kursläge och de områden som är viktigast att följa upp.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4">
                        {stats.map((stat, i) => (
                            <div
                                key={i}
                                className="dashboard-card-animate"
                                style={{ animationDelay: `${80 + i * 60}ms` }}
                            >
                                <div className="text-2xl font-semibold tabular-nums" style={{ color: 'var(--foreground)', letterSpacing: 0 }}>
                                    {stat.value}
                                </div>
                                <div className="mt-0.5 text-xs dashboard-subtle">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── WeeklyActivityChart ─────────────────────────────────────────────────────

interface WeeklyActivityProps {
    data: Array<{ day: string; minutes: number }>;
    totalQuestions: number;
    accuracy: number;
}

export function WeeklyActivityChart({ data }: WeeklyActivityProps) {
    const maxV = Math.max(...data.map((d) => d.minutes), 1);

    return (
        <div className="dashboard-card dashboard-panel dashboard-panel-activity p-6 dashboard-card-animate" style={{ animationDelay: '200ms' }}>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xs font-semibold uppercase tracking-widest dashboard-subtle" style={{ letterSpacing: '0.08em' }}>
                        Aktivitet
                    </h3>
                    <p className="text-base font-semibold mt-0.5" style={{ color: 'var(--foreground)', letterSpacing: 0 }}>
                        Denna vecka
                    </p>
                </div>
            </div>

            <div className="flex items-end gap-2.5 h-28">
                {data.map((w, i) => {
                    const pct = maxV > 0 ? w.minutes / maxV : 0;
                    const h = Math.max(pct * 100, 4);
                    const active = w.minutes > 0;
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                            <span
                                className="text-[11px] font-medium tabular-nums transition-opacity duration-200 dashboard-muted"
                                style={{ opacity: active ? 1 : 0 }}
                            >
                                {w.minutes > 0 ? `${w.minutes}m` : ''}
                            </span>
                            <div
                                className="dashboard-activity-bar w-full max-w-9 rounded-md"
                                style={{
                                    height: h,
                                    opacity: active ? 0.85 : 0.06,
                                    transition: 'height 800ms cubic-bezier(0.16,1,0.3,1)',
                                    transitionDelay: `${i * 60}ms`,
                                }}
                            />
                            <span className="text-[11px] font-medium dashboard-subtle">
                                {w.day}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── StreakCard ───────────────────────────────────────────────────────────────

interface StreakCardProps {
    currentStreak: number;
    weekStreak: boolean[];
    level: number;
}

export function StreakCard({ currentStreak, weekStreak, level }: StreakCardProps) {
    return (
        <div
            className="dashboard-card dashboard-panel dashboard-panel-streak relative flex flex-col justify-between overflow-hidden p-6 dashboard-card-animate"
            style={{ minHeight: 180, animationDelay: '260ms' }}
        >
            <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3 dashboard-subtle" style={{ letterSpacing: '0.08em' }}>
                    Veckosvit
                </p>
                {/* Streak dots — filled ink for active days, open for the rest */}
                <div className="flex gap-1.5 mb-4">
                    {weekStreak.map((active, i) => (
                        <div
                            key={i}
                            className={`h-2.5 w-2.5 rounded-full ${active ? 'dashboard-streak-dot-active' : 'dashboard-streak-dot-inactive'}`}
                            style={{
                                animation: 'dash-streak-dot var(--motion-slow) var(--ease-out) both',
                                animationDelay: `${300 + i * 50}ms`,
                            }}
                        />
                    ))}
                </div>
            </div>

            <div className="flex gap-5 items-end relative z-10">
                <div>
                    <div
                        className="text-5xl font-semibold leading-none tabular-nums dashboard-card-animate"
                        style={{
                            color: 'var(--foreground)',
                            letterSpacing: 0,
                            animationDelay: '320ms',
                        }}
                    >
                        {currentStreak}
                    </div>
                    <div className="dashboard-muted text-xs mt-1">dagars svit</div>
                </div>

                <div className="dashboard-panel-chip px-3 py-2 rounded-full flex items-center gap-2">
                    <GraduationCap size={14} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                        Nivå {level}
                    </span>
                </div>
            </div>
        </div>
    );
}


// ─── Course icon lookup ───────────────────────────────────────────────────────
// Maps common Swedish engineering maths course code prefixes → Lucide icons.
// Falls back to BookOpen when no match is found.

interface CourseCardProps {
    code: string;
    name: string;
    progress: number;
    topicsMastered: number;
    topicsTotal: number;
    gradient?: string; // kept for API compat
    index?: number;
}

type CourseIconKey = 'calc' | 'linalg' | 'prob' | 'opt' | 'diff' | 'discrete' | 'signal' | 'physics' | 'chem' | 'default';

const COURSE_ICON_MAP: Record<CourseIconKey, LucideIcon> = {
    calc:     Calculator,
    linalg:   Sigma,
    prob:     BarChartIcon,
    opt:      GitBranch,
    diff:     Waves,
    discrete: Network,
    signal:   Waves,
    physics:  Atom,
    chem:     FlaskRound,
    default:  BookOpen,
};

const COURSE_PALETTES = [
    {
        a: 'rgba(29, 115, 117, 0.22)',
        b: 'rgba(76, 192, 193, 0.16)',
        c: 'rgba(194, 221, 232, 0.20)',
        ink: '#1d7375',
        shadow: 'rgba(29, 115, 117, 0.28)',
    },
    {
        a: 'rgba(194, 105, 48, 0.20)',
        b: 'rgba(235, 157, 72, 0.16)',
        c: 'rgba(246, 213, 157, 0.20)',
        ink: '#b85f2d',
        shadow: 'rgba(194, 105, 48, 0.28)',
    },
    {
        a: 'rgba(102, 123, 69, 0.22)',
        b: 'rgba(121, 143, 82, 0.16)',
        c: 'rgba(192, 210, 164, 0.20)',
        ink: '#667b45',
        shadow: 'rgba(102, 123, 69, 0.28)',
    },
] as const;

function getCourseIconKey(code: string): CourseIconKey {
    const c = code.toUpperCase();
    // Analysis / calculus
    if (/TATA\d+/.test(c) || /MAT\d/.test(c) || /MA\d/.test(c) || c.includes('ANAL') || c.includes('CALC')) return 'calc';
    // Linear algebra
    if (c.includes('LINA') || c.includes('LINAALG') || c.includes('ALGEBRA') || /TATM\d+/.test(c)) return 'linalg';
    // Probability / statistics
    if (c.includes('PROB') || c.includes('STAT') || c.includes('SANNO') || /TAMS\d+/.test(c)) return 'prob';
    // Optimisation
    if (c.includes('OPT') || c.includes('TATA80') || c.includes('TATA76')) return 'opt';
    // Differential equations
    if (c.includes('ODE') || c.includes('PDE') || c.includes('DIFF')) return 'diff';
    // Discrete / combinatorics
    if (c.includes('DISC') || c.includes('KOMBI') || c.includes('GRAPH')) return 'discrete';
    // Signals / transforms
    if (c.includes('SIGNAL') || c.includes('FOURIER') || c.includes('TRANS')) return 'signal';
    // Physics
    if (c.includes('FYS') || c.includes('PHYS') || /TFFY\d+/.test(c)) return 'physics';
    // Chemistry
    if (c.includes('KEM') || c.includes('CHEM')) return 'chem';
    return 'default';
}

export function CourseCard({ code, name, progress, topicsMastered, topicsTotal, index = 0 }: CourseCardProps) {
    const iconKey = getCourseIconKey(code);
    const Icon = COURSE_ICON_MAP[iconKey];
    const palette = COURSE_PALETTES[index % COURSE_PALETTES.length];

    return (
        <Link
            href={`/courses/${code.toLowerCase()}`}
            className="dashboard-course-card group relative isolate block overflow-hidden dashboard-card dashboard-card-interactive dashboard-card-animate active:scale-[0.96]"
            style={{
                animationDelay: `${120 + index * 60}ms`,
                textDecoration: 'none',
                '--course-accent-a': palette.a,
                '--course-accent-b': palette.b,
                '--course-accent-c': palette.c,
                '--course-accent-ink': palette.ink,
                '--course-accent-shadow': palette.shadow,
            } as React.CSSProperties}
        >
            <div className="relative z-10 p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex items-start gap-3">
                        {/* Course icon */}
                        <div
                            className="dashboard-course-icon flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-[transform,background-color,color] duration-200 group-hover:-translate-y-0.5 group-hover:bg-[var(--course-accent-display)] group-hover:text-white"
                        >
                            <Icon size={18} />
                        </div>
                        <div>
                            <div
                                className="dashboard-course-code inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold mb-1 transition-colors duration-200 group-hover:bg-[var(--course-accent-display)] group-hover:text-white"
                            >
                                {code}
                            </div>
                            <div
                                className="text-sm font-medium leading-snug"
                                style={{ color: 'var(--foreground)', lineHeight: 1.35 }}
                            >
                                {name}
                            </div>
                        </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <div
                            className="text-2xl font-extrabold tabular-nums text-[var(--course-accent-display)] transition-colors duration-200"
                            style={{ letterSpacing: 0 }}
                        >
                            {progress}%
                        </div>
                        <div className="text-[10px] dashboard-subtle">framsteg</div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 rounded-full overflow-hidden mb-3 bg-black/5 dark:bg-white/10">
                    <div
                        className="h-full rounded-full origin-left bg-[var(--course-accent-display)] transition-[filter] duration-200 group-hover:brightness-90 dark:group-hover:brightness-110"
                        style={{
                            width: `${progress}%`,
                            animation: 'dash-bar-fill var(--motion-slow) var(--ease-out) both',
                            animationDelay: `${200 + index * 80}ms`,
                        } as React.CSSProperties}
                    />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                    <span className="text-xs dashboard-muted">
                        <strong className="font-bold" style={{ color: 'var(--foreground)' }}>{topicsMastered}</strong>/{topicsTotal} områden klara
                    </span>
                    <span className="text-xs font-semibold flex items-center gap-1 text-[var(--course-accent-display)] transition-colors duration-150">
                        Fortsätt <ArrowRight size={11} className="transition-transform duration-200 group-hover:translate-x-1" />
                    </span>
                </div>
            </div>
        </Link>
    );
}

// ─── MasteryTopicCard ─────────────────────────────────────────────────────────

interface MasteryTopicProps {
    name: string;
    course: string;
    mastery: number;
    topicId?: string;
    topicName?: string;
}

function masteryLabel(m: number) {
    if (m >= 0.85) return 'Bemästrad';
    if (m >= 0.55) return 'Lärande';
    if (m >= 0.3)  return 'Utvecklas';
    return 'Fokusera';
}

function masteryColor(m: number) {
    if (m >= 0.85) return '#1d7375';
    if (m >= 0.55) return '#3585a3';
    if (m >= 0.3) return '#c27838';
    return '#c65d4b';
}

export function MasteryTopicCard({ name, course, mastery }: MasteryTopicProps) {
    const accent = masteryColor(mastery);
    const href = undefined;

    const inner = (
        <>
            <div className="flex justify-between items-center mb-2">
                <span className="text-[var(--mastery-display)] text-[10px] font-bold uppercase tracking-wider" style={{ letterSpacing: 0 }}>
                    {course}
                </span>
                <span
                    className="mastery-topic-badge text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                >
                    {masteryLabel(mastery)}
                </span>
            </div>
            <div
                className="text-sm font-semibold mb-3 leading-snug"
                style={{ color: 'var(--foreground)', lineHeight: 1.3 }}
            >
                {name}
            </div>
            <div className="h-1 rounded-full overflow-hidden bg-black/[0.06] dark:bg-white/10">
                <div
                    className="h-full rounded-full origin-left bg-[var(--mastery-display)]"
                    style={{
                        width: `${Math.round(mastery * 100)}%`,
                        animation: 'dash-bar-fill var(--motion-slow) var(--ease-out) both',
                        animationDelay: '300ms',
                    } as React.CSSProperties}
                />
            </div>
            <div className="flex justify-between items-center mt-2">
                <span className="text-[var(--mastery-display)] text-[11px] font-semibold tabular-nums">{Math.round(mastery * 100)}%</span>
            </div>
        </>
    );

    const baseCls = 'mastery-topic-card p-3.5 rounded-xl block dashboard-card-soft';
    // Hover affordance (lift + accent tint) only applies when the card is actually clickable.
    const interactiveCls = 'group dashboard-card-soft-interactive transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.96]';

    if (href) {
        return <Link href={href} className={`${baseCls} ${interactiveCls}`} style={{ '--mastery-accent': accent } as React.CSSProperties}>{inner}</Link>;
    }
    return <div className={baseCls} style={{ '--mastery-accent': accent } as React.CSSProperties}>{inner}</div>;
}

// ─── FeatureTiles ──────────────────────────────────────────────────────────────
// Reference-style section: filled tiles with a thin line-art illustration on
// top and title + muted copy below. No icons, no color coding — the artwork
// carries the identity.

const featureTiles = [
    {
        art: <CubeArt size={150} />,
        title: 'Tentamenssimulering',
        desc: 'Skriv en tenta under riktiga villkor och se din förväntade poäng — innan det räknas.',
        href: '/exam-sim',
    },
    {
        art: <RipplesArt size={150} />,
        title: 'Din analys',
        desc: 'Följ din utveckling över tid och se exakt vilka moment som lyfter ditt resultat mest.',
        href: '/analytics',
    },
];

export function FeatureTiles() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {featureTiles.map((tile, i) => (
                <Link
                    key={tile.href}
                    href={tile.href}
                    className="feature-tile feature-tile-interactive group block p-6 dashboard-card-animate"
                    style={{ textDecoration: 'none', animationDelay: `${160 + i * 70}ms` }}
                >
                    <div className="feature-tile-art py-6">{tile.art}</div>
                    <div className="text-[15px] font-semibold" style={{ color: 'var(--foreground)', letterSpacing: 0 }}>
                        {tile.title}
                    </div>
                    <p className="text-[13px] leading-relaxed mt-1.5 dashboard-muted">
                        {tile.desc}
                    </p>
                </Link>
            ))}
        </div>
    );
}

// ─── Quick Actions ─────────────────────────────────────────────────────────────

export function QuickActions() {
    const actions: Array<{
        icon: ReactNode;
        label: string;
        desc: string;
        href: string;
        primary?: boolean;
    }> = [
        { icon: <Brain size={18} />,        label: 'Adaptiv övning',     desc: 'AI väljer optimal nivå',     primary: true, href: '/practice'      },
        { icon: <FileText size={18} />,     label: 'Tentamenssimulering', desc: 'Öva under tentamensvillkor', href: '/exam-sim'      },
        { icon: <BarChart size={18} />,     label: 'Din Analys',          desc: 'Se din utveckling',          href: '/analytics'     },
        { icon: <FlaskConical size={18} />, label: 'Test AI Panel',       desc: 'Sandbox för AI-utveckling',  href: '/test-ai-panel' },
    ];

    return (
        <div className="dashboard-card p-6 dashboard-card-animate" style={{ animationDelay: '140ms' }}>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-5 dashboard-subtle" style={{ letterSpacing: '0.08em' }}>
                Börja studera
            </h3>
            <div className="flex flex-col gap-2">
                {actions.map((a, i) => (
                    <Link
                        key={i}
                        href={a.href}
                        className={
                            a.primary
                                ? 'group flex items-center gap-3 p-3.5 rounded-xl transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.96]'
                                : 'group flex items-center gap-3 p-3.5 rounded-xl border transition-[transform,border-color,background-color,box-shadow] duration-200 hover:-translate-y-0.5 active:scale-[0.96] bg-black/[0.04] dark:bg-white/[0.06] border-black/[0.09] dark:border-white/10 hover:border-[var(--accent-border)] hover:bg-[var(--accent-muted)] hover:shadow-[0_4px_14px_var(--accent-glow)]'
                        }
                        style={
                            a.primary
                                ? {
                                    background: `linear-gradient(135deg, ${ACCENT.indigo.base}, ${ACCENT.indigo.light})`,
                                    boxShadow: `0 4px 14px ${ACCENT.indigo.glow}`,
                                }
                                : undefined
                        }
                    >
                        <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
                                a.primary
                                    ? 'bg-white/[0.18] text-white'
                                    : 'bg-black/5 dark:bg-white/10 text-[var(--foreground)] group-hover:bg-[var(--accent-500)] group-hover:text-white'
                            }`}
                        >
                            {a.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold" style={{ color: a.primary ? '#fff' : 'var(--foreground)' }}>
                                {a.label}
                            </div>
                            <div className="text-xs mt-0.5" style={{ color: a.primary ? 'rgba(255,255,255,0.68)' : 'var(--foreground-muted)' }}>
                                {a.desc}
                            </div>
                        </div>
                        <ArrowRight size={14} style={{ color: a.primary ? 'rgba(255,255,255,0.5)' : 'var(--foreground-subtle)', flexShrink: 0 }} />
                    </Link>
                ))}
            </div>
        </div>
    );
}

// ─── Quick Navigation ──────────────────────────────────────────────────────────

const navigationItems = [
    {
        category: 'Lärande',
        items: [
            { icon: <BookOpen size={16} />,    label: 'Kurser',       href: '/courses' },
            { icon: <Brain size={16} />,       label: 'Övning',       href: '/practice' },
            { icon: <Zap size={16} />,         label: 'Flashcards',   href: '/flashcards' },
            { icon: <History size={16} />,     label: 'Tenta-arkiv',  href: '/archive' },
            { icon: <FlaskConical size={16} />,label: 'Tentamen',     href: '/exam-sim' },
        ],
    },
    {
        category: 'Konto',
        items: [
            { icon: <User size={16} />,       label: 'Profil',        href: '/profile' },
            { icon: <Settings size={16} />,   label: 'Inställningar', href: '/settings' },
            { icon: <CreditCard size={16} />, label: 'Priser',        href: '/pricing' },
        ],
    },
    {
        category: 'Information',
        items: [
            { icon: <Info size={16} />,          label: 'Om oss',    href: '/about' },
            { icon: <GraduationCap size={16} />, label: 'Funktioner',href: '/features' },
            { icon: <HelpCircle size={16} />,    label: 'Hjälp',     href: '/help' },
            { icon: <MessageSquare size={16} />, label: 'Kontakt',   href: '/contact' },
        ],
    },
];

export function QuickNavigation() {
    return (
        <div className="dashboard-card p-6 dashboard-card-animate" style={{ animationDelay: '180ms' }}>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-5 dashboard-subtle" style={{ letterSpacing: '0.08em' }}>
                Snabbnavigering
            </h3>
            <div className="space-y-5">
                {navigationItems.map((section) => (
                    <div key={section.category}>
                        <h4 className="dashboard-subtle text-[10px] font-bold uppercase tracking-widest mb-2.5">
                            {section.category}
                        </h4>
                        <div className="grid grid-cols-4 gap-1.5">
                            {section.items.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="group flex flex-col items-center gap-1.5 p-2.5 rounded-xl border bg-black/[0.04] dark:bg-white/[0.06] border-black/[0.09] dark:border-white/10 transition-[transform,border-color,background-color,box-shadow] duration-200 hover:-translate-y-0.5 active:scale-[0.96] hover:border-[var(--accent-border)] hover:bg-[var(--accent-muted)] hover:shadow-[0_4px_14px_var(--accent-glow)]"
                                >
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/5 text-[var(--foreground)] transition-[transform,color,background-color] duration-200 group-hover:scale-110 group-hover:bg-[var(--accent-500)] group-hover:text-white dark:bg-white/10">
                                        {item.icon}
                                    </div>
                                    <span className="text-[10px] font-medium text-center leading-tight dashboard-muted transition-colors duration-200 group-hover:text-[var(--accent-500)]">
                                        {item.label}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── StatCard (kept for compatibility) ───────────────────────────────────────

interface StatCardProps {
    label: string;
    value: string | number;
    subtext?: string;
    color?: string;
}

export function StatCard({ label, value, subtext, color = ACCENT.indigo.base }: StatCardProps) {
    return (
        <div className="dashboard-card p-5 dashboard-card-animate">
            <div className="text-xs font-semibold uppercase tracking-wider mb-1 dashboard-subtle">{label}</div>
            <div className="text-3xl font-bold tabular-nums" style={{ color, letterSpacing: 0 }}>{value}</div>
            {subtext && <div className="text-xs mt-1 dashboard-muted">{subtext}</div>}
        </div>
    );
}

// ─── AIRecommendationCard (kept for compatibility) ────────────────────────────

interface AIRecommendationProps {
    topicName: string;
    mastery: number;
    courseName: string;
    daysUntilExam?: number;
}

export function AIRecommendationCard({ topicName, mastery, courseName, daysUntilExam }: AIRecommendationProps) {
    return (
        <div
            className="grain-tile p-6 flex flex-col justify-between dashboard-card-animate"
            style={{
                // Grainy moss-to-sky gradient — the reference "artwork tile" treatment
                ['--grain-gradient' as string]:
                    'radial-gradient(130% 120% at 50% 0%, #c9d8d0 0%, #7fa389 36%, #3f6c51 64%, #1c2f22 100%)',
                minHeight: 200,
                animationDelay: '300ms',
            }}
        >
            <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.75)', letterSpacing: '0.08em' }}>
                    AI-rekommendation
                </span>

                <h3 className="text-xl font-semibold text-white mt-3 mb-2 leading-snug" style={{ letterSpacing: 0 }}>
                    Fokusera på {topicName}
                </h3>

                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.78)' }}>
                    Din mästerskapsnivå är <strong className="text-white">{Math.round(mastery * 100)}%</strong>.
                    {daysUntilExam && (
                        <> Viktigt för <strong className="text-white">{courseName}</strong> om{' '}
                            <strong className="text-white">{daysUntilExam} dagar</strong>.</>
                    )}
                </p>
            </div>

            <Link
                href="/practice"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold self-start mt-5 active:scale-[0.96]"
                style={{
                    background: 'rgba(255,255,255,0.92)',
                    color: '#1c2f22',
                    transitionProperty: 'transform, background-color',
                    transitionDuration: '150ms',
                    transitionTimingFunction: 'ease',
                }}
            >
                <Play size={14} /> Starta session
            </Link>
        </div>
    );
}
