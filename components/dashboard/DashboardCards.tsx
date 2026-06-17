'use client';

import {
    ArrowRight, Play, Brain, FileText, Sparkles,
    BookOpen, GraduationCap, User, Settings, HelpCircle,
    Layers, CreditCard, School, Info, MessageSquare, Zap, BarChart,
    History, FlaskConical
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

const C = {
    surface: '#FFFFFF',
    surfaceAlt: '#F7F8FC',
    text: '#1A1D2E',
    textSec: '#6B7194',
    textMuted: '#A0A5C0',
    blue: '#4361EE',
    purple: '#7C5CFC',
    orange: '#FF8C42',
    green: '#22C55E',
    red: '#EF4444',
    border: '#E4E7F1',
    borderLight: '#EFF1F8',
    cardShadow: '0 2px 12px rgba(26,29,46,0.06)',
};

// ========== Stats Card ==========
interface StatCardProps {
    label: string;
    value: string | number;
    subtext?: string;
    color?: string;
}

export function StatCard({ label, value, subtext, color = C.blue }: StatCardProps) {
    return (
        <div
            className="rounded-2xl p-5"
            style={{
                background: C.surface,
                border: `1px solid ${C.borderLight}`,
                boxShadow: C.cardShadow,
            }}
        >
            <div className="text-sm mb-1" style={{ color: C.textMuted }}>
                {label}
            </div>
            <div className="text-3xl font-bold" style={{ color }}>
                {value}
            </div>
            {subtext && (
                <div className="text-xs mt-1" style={{ color: C.textSec }}>
                    {subtext}
                </div>
            )}
        </div>
    );
}

// ========== Weekly Activity Chart ==========
interface WeeklyActivityProps {
    data: Array<{ day: string; minutes: number }>;
    totalQuestions: number;
    accuracy: number;
}

export function WeeklyActivityChart({ data, totalQuestions, accuracy }: WeeklyActivityProps) {
    const maxV = Math.max(...data.map((d) => d.minutes), 1);

    return (
        <div className="dashboard-card p-6">
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-bold">
                    Dina framsteg
                </h3>
                <div className="flex gap-4 text-sm">
                    <span className="font-semibold">
                        Antal svar: <span className="text-teal-600 dark:text-teal-200">{totalQuestions}</span>
                    </span>
                    <span className="font-semibold">
                        Noggrannhet: <span className="text-emerald-600 dark:text-emerald-200">{accuracy}%</span>
                    </span>
                </div>
            </div>

            <div className="flex items-end gap-3 h-32 px-2">
                {data.map((w, i) => {
                    const h = maxV > 0 ? (w.minutes / maxV) * 110 : 0;
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                            <span
                                className={`text-xs font-semibold ${w.minutes > 0 ? 'text-teal-600 dark:text-teal-200' : 'dashboard-subtle'}`}
                            >
                                {w.minutes > 0 ? `${w.minutes}m` : ''}
                            </span>
                            <div
                                className="w-full max-w-11 rounded-lg transition-all duration-700"
                                style={{
                                    height: Math.max(h, 6),
                                    background:
                                        w.minutes > 0
                                            ? 'linear-gradient(180deg, #14B8A6, #FF684A)'
                                            : 'rgba(20,184,166,0.12)',
                                    transitionDelay: `${i * 60}ms`,
                                    boxShadow: w.minutes > 0 ? '0 4px 16px rgba(20,184,166,0.22)' : 'none',
                                }}
                            />
                            <span className="dashboard-subtle text-xs font-medium">
                                {w.day}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ========== Streak Card ==========
interface StreakCardProps {
    currentStreak: number;
    weekStreak: boolean[];
    level: number;
}

export function StreakCard({ currentStreak, weekStreak, level }: StreakCardProps) {
    return (
        <div
            className="rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between"
            style={{
                background: 'linear-gradient(135deg, #5B2C1E 0%, #8B3A1F 40%, #C2562D 100%)',
                minHeight: 180,
            }}
        >
            {/* Glow effect */}
            <div
                className="absolute -top-8 -right-8 w-28 h-28 rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(255,160,60,0.3), transparent 70%)',
                }}
            />

            <div>
                <div className="flex items-center gap-1.5 mb-3">
                    <span className="text-2xl">🔥</span>
                    <span className="text-sm font-bold text-white/70 uppercase tracking-wider">
                        Veckosvit
                    </span>
                </div>

                <div className="flex gap-1.5 mb-4">
                    {weekStreak.map((active, i) => (
                        <div
                            key={i}
                            className="text-2xl transition-all duration-300"
                            style={{
                                filter: active ? 'none' : 'grayscale(1) opacity(0.3)',
                                transitionDelay: `${i * 80}ms`,
                            }}
                        >
                            🔥
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-5 items-end relative z-10">
                <div>
                    <div className="text-5xl font-extrabold text-white leading-none">
                        {currentStreak}
                    </div>
                    <div className="text-sm text-white/60 mt-0.5">dagars svit</div>
                </div>
                <div
                    className="px-4 py-2.5 rounded-xl flex items-center gap-2.5"
                    style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}
                >
                    <span className="text-2xl">⭐</span>
                    <div>
                        <div className="font-bold text-sm text-white">Nivå {level}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ========== Course Card ==========
interface CourseCardProps {
    code: string;
    name: string;
    progress: number;
    topicsMastered: number;
    topicsTotal: number;
    gradient: string;
}

export function CourseCard({
    code,
    name,
    progress,
    topicsMastered,
    topicsTotal,
    gradient,
}: CourseCardProps) {
    const progressColor = progress >= 60 ? '#fff' : progress >= 35 ? 'rgba(255,255,255,0.9)' : 'rgba(255,200,200,1)';

    return (
        <Link
            href={`/courses/${code.toLowerCase()}`}
            className="block rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
        >
            <div
                className="p-6 relative min-h-[180px] flex flex-col justify-between"
                style={{ background: gradient }}
            >
                <div className="relative z-10">
                    <div className="text-xl font-extrabold text-white tracking-tight">{code}</div>
                    <div className="text-sm text-white/75 mt-0.5">{name}</div>
                </div>

                <div className="relative z-10 flex justify-between items-end">
                    <div>
                        <div className="text-xs text-white/60 mb-0.5">Framsteg</div>
                        <div className="text-3xl font-extrabold" style={{ color: progressColor }}>
                            {progress}%
                        </div>
                    </div>
                </div>
            </div>

            <div
                className="dashboard-card-soft p-4 flex justify-between items-center"
            >
                <div className="dashboard-muted text-sm">
                    <strong className="text-zinc-950 dark:text-white">{topicsMastered}</strong>/{topicsTotal} områden klara
                </div>
                <div
                    className="flex items-center gap-1.5 text-sm font-semibold text-teal-700 dark:text-teal-200"
                >
                    Fortsätt <ArrowRight size={14} />
                </div>
            </div>
        </Link>
    );
}

// ========== Mastery Topic Card ==========
interface MasteryTopicProps {
    name: string;
    course: string;
    mastery: number;
}

export function MasteryTopicCard({ name, course, mastery }: MasteryTopicProps) {
    const getStyle = (m: number) => {
        if (m >= 0.9) return { bg: '#ECFDF5', border: '#10B981', text: '#059669' };
        if (m >= 0.6) return { bg: '#EFF6FF', border: '#3B82F6', text: '#2563EB' };
        if (m >= 0.3) return { bg: '#FFFBEB', border: '#F59E0B', text: '#B45309' };
        return { bg: '#FEF2F2', border: '#EF4444', text: '#DC2626' };
    };

    const s = getStyle(mastery);

    return (
        <div
            className="p-3.5 rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            style={{
                background: s.bg,
                border: `1.5px solid ${s.border}25`,
            }}
        >
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-extrabold opacity-70" style={{ color: s.text }}>
                    {course}
                </span>
                <span className="text-sm font-bold" style={{ color: s.text }}>
                    {Math.round(mastery * 100)}%
                </span>
            </div>
            <div className="text-sm font-semibold mb-2.5 text-zinc-950 dark:text-zinc-950" style={{ lineHeight: 1.3 }}>
                {name}
            </div>
            <div className="h-1 rounded-full" style={{ background: s.border + '20' }}>
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${mastery * 100}%`, background: s.border }}
                />
            </div>
        </div>
    );
}

// ========== Quick Actions ==========

export function QuickActions() {
    const actions: Array<{
        icon: ReactNode;
        label: string;
        desc: string;
        color: string;
        href: string;
        primary?: boolean;
        badge?: number;
    }> = [
        {
            icon: <Brain size={20} />,
            label: 'Adaptiv övning',
            desc: 'AI väljer optimal nivå',
            color: C.blue,
            primary: true,
            href: '/practice',
        },
        {
            icon: <FileText size={20} />,
            label: 'Tentamenssimulering',
            desc: 'Öva under tentamensvillkor',
            color: C.purple,
            href: '/exam-sim',
        },
        {
            icon: <BarChart size={20} />,
            label: 'Din Analys',
            desc: 'Se din utveckling',
            color: C.blue,
            href: '/analytics',
        },
        {
            icon: <FlaskConical size={20} />,
            label: 'Test AI Panel',
            desc: 'Sandbox för AI-utveckling',
            color: '#10B981',
            href: '/test-ai-panel',
        },
    ];

    return (
        <div
            className="rounded-2xl p-6"
            style={{
                background: C.surface,
                border: `1px solid ${C.borderLight}`,
                boxShadow: C.cardShadow,
            }}
        >
            <h3 className="text-xl font-bold mb-4" style={{ color: C.text }}>
                Börja studera
            </h3>
            <div className="flex flex-col gap-2.5">
                {actions.map((a, i) => (
                    <Link
                        key={i}
                        href={a.href}
                        className="flex items-center gap-3.5 p-3.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                        style={{
                            background: a.primary ? a.color : C.surfaceAlt,
                            border: a.primary ? 'none' : `1px solid ${C.borderLight}`,
                        }}
                    >
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center relative flex-shrink-0"
                            style={{
                                background: a.primary ? 'rgba(255,255,255,0.2)' : a.color + '12',
                                color: a.primary ? '#fff' : a.color,
                            }}
                        >
                            {a.icon}
                            {a.badge && a.badge > 0 && (
                                <div
                                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                                    style={{
                                        background: C.red,
                                        border: `2px solid ${C.surfaceAlt}`,
                                    }}
                                >
                                    {a.badge}
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <div
                                className="text-sm font-semibold"
                                style={{ color: a.primary ? '#fff' : C.text }}
                            >
                                {a.label}
                            </div>
                            <div
                                className="text-xs"
                                style={{ color: a.primary ? 'rgba(255,255,255,0.7)' : C.textMuted }}
                            >
                                {a.desc}
                            </div>
                        </div>
                        <ArrowRight size={16} style={{ color: a.primary ? 'rgba(255,255,255,0.5)' : C.textMuted }} />
                    </Link>
                ))}
            </div>
        </div>
    );
}

// ========== AI Recommendation Card ==========
interface AIRecommendationProps {
    topicName: string;
    mastery: number;
    courseName: string;
    daysUntilExam?: number;
}

export function AIRecommendationCard({ topicName, mastery, courseName, daysUntilExam }: AIRecommendationProps) {
    return (
        <div
            className="rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between"
            style={{
                background: 'linear-gradient(135deg, #1A1D2E 0%, #2A2F4A 100%)',
                minHeight: 200,
            }}
        >
            {/* Subtle constellation overlay */}
            <div
                className="absolute inset-0 opacity-5"
                style={{
                    backgroundImage: `radial-gradient(circle at 30% 20%, rgba(255,255,255,0.8) 1px, transparent 1px),
                                      radial-gradient(circle at 70% 60%, rgba(255,255,255,0.8) 1px, transparent 1px),
                                      radial-gradient(circle at 50% 80%, rgba(255,255,255,0.8) 1px, transparent 1px)`,
                    backgroundSize: '80px 80px, 60px 60px, 90px 90px',
                }}
            />

            <div className="relative z-10">
                <div
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg mb-4"
                    style={{ background: `${C.blue}25` }}
                >
                    <Sparkles size={14} color="#A5B4FC" />
                    <span className="text-xs font-semibold text-[#A5B4FC]">AI-rekommendation</span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2.5 leading-snug">
                    Fokusera på {topicName}
                </h3>

                <p className="text-sm text-[#8890B5] leading-relaxed">
                    Din mästerskapsnivå är <strong style={{ color: C.orange }}>{Math.round(mastery * 100)}%</strong>.
                    {daysUntilExam && (
                        <>
                            {' '}
                            Detta område är viktigt för din tenta i <strong className="text-white">{courseName}</strong> om{' '}
                            <strong className="text-white">{daysUntilExam} dagar</strong>.
                        </>
                    )}
                </p>
            </div>

            <Link
                href="/practice"
                className="relative z-10 inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 self-start mt-5"
                style={{
                    background: C.blue,
                    boxShadow: `0 4px 16px ${C.blue}40`,
                }}
            >
                <Play size={16} /> Starta session
            </Link>
        </div>
    );
}

// ========== Quick Navigation - All Subpages ==========
const navigationItems = [
    // Learning section
    {
        category: 'Lärande',
        items: [
            { icon: <BookOpen size={18} />, label: 'Kurser', href: '/courses', color: '#667EEA' },
            { icon: <Brain size={18} />, label: 'Övning', href: '/practice', color: '#4361EE' },
            { icon: <Zap size={18} />, label: 'Flashcards', href: '/flashcards', color: '#7C5CFC' },
            { icon: <History size={18} />, label: 'Tenta-arkiv', href: '/archive', color: '#11998E' },
            { icon: <FlaskConical size={18} />, label: 'Tentamen-sim', href: '/exam-sim', color: '#8B5CF6' },
        ],
    },
    // Resources section
    {
        category: 'Resurser',
        items: [
            { icon: <School size={18} />, label: 'Universitet', href: '/universities', color: '#F59E0B' },
            { icon: <Layers size={18} />, label: 'Studieverktyg', href: '/study', color: '#10B981' },
            { icon: <FileText size={18} />, label: 'Demo', href: '/demo', color: '#8B5CF6' },
        ],
    },
    // Account section
    {
        category: 'Konto',
        items: [
            { icon: <User size={18} />, label: 'Profil', href: '/profile', color: '#3B82F6' },
            { icon: <Settings size={18} />, label: 'Inställningar', href: '/settings', color: '#6B7280' },
            { icon: <CreditCard size={18} />, label: 'Priser', href: '/pricing', color: '#EC4899' },
        ],
    },
    // Info section
    {
        category: 'Information',
        items: [
            { icon: <Info size={18} />, label: 'Om oss', href: '/about', color: '#0EA5E9' },
            { icon: <GraduationCap size={18} />, label: 'Funktioner', href: '/features', color: '#14B8A6' },
            { icon: <HelpCircle size={18} />, label: 'Hjälp', href: '/help', color: '#F97316' },
            { icon: <MessageSquare size={18} />, label: 'Kontakt', href: '/contact', color: '#8B5CF6' },
        ],
    },
];

export function QuickNavigation() {
    return (
        <div className="dashboard-card p-6">
            <h3 className="text-xl font-bold mb-5">
                Snabbnavigering
            </h3>

            <div className="space-y-5">
                {navigationItems.map((section) => (
                    <div key={section.category}>
                        <h4
                            className="dashboard-subtle text-xs font-semibold uppercase tracking-wider mb-3"
                        >
                            {section.category}
                        </h4>
                        <div className="grid grid-cols-4 gap-2">
                            {section.items.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="dashboard-card-soft flex flex-col items-center gap-2 p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-md group"
                                >
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                                        style={{
                                            background: `${item.color}15`,
                                            color: item.color,
                                        }}
                                    >
                                        {item.icon}
                                    </div>
                                    <span
                                        className="text-xs font-medium text-center"
                                    >
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
