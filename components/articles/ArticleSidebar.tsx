'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    ChevronRight, ChevronDown, BookOpen, FileText, ArrowLeft,
    Search, GraduationCap, Layers,
} from 'lucide-react';
import type { ArticleNavigation, NavCourse, NavTopic, NavArticle } from '@/app/actions/articles';

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
    text:       '#1A1D2E',
    textSec:    '#6B7194',
    textMuted:  '#A0A5C0',
    blue:       '#4361EE',
    purple:     '#7C5CFC',
    blueLight:  '#EEF1FF',
    blueBorder: '#D6DAFB',
    border:     '#EFF1F8',
    surface:    '#FFFFFF',
    surfaceAlt: '#F7F8FC',
    surfaceHov: '#F0F2FA',
};

// ── Article link ─────────────────────────────────────────────────────────────
function ArticleLink({ article, isActive }: { article: NavArticle; isActive: boolean }) {
    return (
        <Link
            href={`/articles/${article.slug}`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-[13px] leading-snug"
            style={{
                color: isActive ? '#fff' : C.textSec,
                background: isActive ? C.blue : 'transparent',
                fontWeight: isActive ? 600 : 400,
            }}
            title={article.title}
        >
            <FileText className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
            <span className="truncate">{article.title}</span>
        </Link>
    );
}

// ── Topic section ────────────────────────────────────────────────────────────
function TopicSection({
    topic,
    currentSlug,
    defaultOpen,
}: {
    topic: NavTopic;
    currentSlug: string;
    defaultOpen: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const hasActive = topic.articles.some(a => a.slug === currentSlug);

    return (
        <div>
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold uppercase tracking-wider transition-colors hover:bg-[#F0F2FA]"
                style={{ color: hasActive ? C.blue : C.textMuted }}
            >
                {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                <Layers className="w-3 h-3" />
                <span className="truncate">{topic.title}</span>
                <span
                    className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                    style={{ background: C.surfaceAlt, color: C.textMuted }}
                >
                    {topic.articles.length}
                </span>
            </button>
            {open && (
                <div className="ml-3 mt-0.5 space-y-0.5 border-l-2 pl-2" style={{ borderColor: C.border }}>
                    {topic.articles.map(article => (
                        <ArticleLink
                            key={article.slug}
                            article={article}
                            isActive={article.slug === currentSlug}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Course section ───────────────────────────────────────────────────────────
function CourseSection({
    course,
    currentSlug,
    defaultOpen,
}: {
    course: NavCourse;
    currentSlug: string;
    defaultOpen: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const totalArticles = course.topics.reduce((sum, t) => sum + t.articles.length, 0) + course.uncategorized.length;
    const hasActive = course.topics.some(t => t.articles.some(a => a.slug === currentSlug))
        || course.uncategorized.some(a => a.slug === currentSlug);

    return (
        <div className="mb-1">
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-[#F0F2FA]"
                style={{
                    background: hasActive ? C.blueLight : 'transparent',
                }}
            >
                <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                        background: hasActive
                            ? `linear-gradient(135deg, ${C.blue}, ${C.purple})`
                            : C.surfaceAlt,
                        border: hasActive ? 'none' : `1px solid ${C.border}`,
                    }}
                >
                    <GraduationCap
                        className="w-3.5 h-3.5"
                        style={{ color: hasActive ? '#fff' : C.textMuted }}
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <p
                        className="text-[13px] font-semibold truncate"
                        style={{ color: hasActive ? C.blue : C.text }}
                    >
                        {course.code}
                    </p>
                    <p className="text-[11px] truncate" style={{ color: C.textMuted }}>
                        {course.name} ({totalArticles})
                    </p>
                </div>
                {open
                    ? <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: C.textMuted }} />
                    : <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: C.textMuted }} />
                }
            </button>
            {open && (
                <div className="mt-1 ml-2 space-y-1">
                    {/* Topics with articles */}
                    {course.topics.map(topic => (
                        <TopicSection
                            key={topic.id}
                            topic={topic}
                            currentSlug={currentSlug}
                            defaultOpen={topic.articles.some(a => a.slug === currentSlug)}
                        />
                    ))}
                    {/* Uncategorized articles (no topic) */}
                    {course.uncategorized.length > 0 && (
                        <div className="space-y-0.5">
                            {course.topics.length > 0 && (
                                <p
                                    className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider"
                                    style={{ color: C.textMuted }}
                                >
                                    Övrigt
                                </p>
                            )}
                            {course.uncategorized.map(article => (
                                <ArticleLink
                                    key={article.slug}
                                    article={article}
                                    isActive={article.slug === currentSlug}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Main Sidebar ─────────────────────────────────────────────────────────────
interface ArticleSidebarProps {
    navigation: ArticleNavigation;
    userName: string;
    userLevel: number;
}

export default function ArticleSidebar({ navigation, userName, userLevel }: ArticleSidebarProps) {
    const pathname = usePathname();
    const [search, setSearch] = useState('');

    // Extract current article slug from path
    const currentSlug = pathname.startsWith('/articles/')
        ? pathname.replace('/articles/', '')
        : '';

    // Filter navigation when searching
    const filtered = useMemo(() => {
        if (!search.trim()) return navigation;
        const q = search.toLowerCase();

        const courses: NavCourse[] = navigation.courses
            .map(course => {
                const topics: NavTopic[] = course.topics
                    .map(topic => ({
                        ...topic,
                        articles: topic.articles.filter(a => a.title.toLowerCase().includes(q)),
                    }))
                    .filter(t => t.articles.length > 0);

                const uncategorized = course.uncategorized.filter(a =>
                    a.title.toLowerCase().includes(q)
                );

                return { ...course, topics, uncategorized };
            })
            .filter(c => c.topics.length > 0 || c.uncategorized.length > 0);

        const general = navigation.general.filter(a =>
            a.title.toLowerCase().includes(q)
        );

        return { courses, general };
    }, [navigation, search]);

    return (
        <aside
            className="overflow-y-auto"
            style={{
                width: 280,
                flexShrink: 0,
                height: '100vh',
                position: 'sticky',
                top: 0,
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(255,255,255,0.90)',
                backdropFilter: 'blur(20px)',
                borderRight: `1px solid ${C.border}`,
                zIndex: 10,
            }}
        >
            {/* ── Logo & Back ──────────────────────────────────────────────── */}
            <div className="px-4 pt-5 pb-3">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2.5 no-underline mb-4"
                >
                    <div
                        className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={{
                            background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`,
                            boxShadow: `0 4px 14px ${C.blue}30`,
                        }}
                    >
                        <span className="text-white font-extrabold text-base">Q</span>
                    </div>
                    <span
                        className="font-bold text-xl"
                        style={{ color: C.text, letterSpacing: '-0.03em' }}
                    >
                        Qmath
                    </span>
                </Link>
                <Link
                    href="/dashboard"
                    className="flex items-center gap-1.5 text-[12px] font-medium transition-colors hover:text-[#4361EE]"
                    style={{ color: C.textMuted }}
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> Tillbaka till dashboard
                </Link>
            </div>

            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className="px-4 py-3" style={{ borderTop: `1px solid ${C.border}` }}>
                <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4" style={{ color: C.blue }} />
                    <h2
                        className="text-sm font-bold"
                        style={{ color: C.text }}
                    >
                        Studieartiklar
                    </h2>
                </div>
                {/* Search */}
                <div className="relative">
                    <Search
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                        style={{ color: C.textMuted }}
                    />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Sök artiklar..."
                        className="w-full pl-8 pr-3 py-2 rounded-lg text-[12px] outline-none transition-all focus:ring-2 focus:ring-[#4361EE]/20"
                        style={{
                            background: C.surfaceAlt,
                            color: C.text,
                            border: `1px solid ${C.border}`,
                        }}
                    />
                </div>
            </div>

            {/* ── Navigation tree ──────────────────────────────────────────── */}
            <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                {/* Browse all link */}
                <Link
                    href="/articles"
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors"
                    style={{
                        color: pathname === '/articles' ? '#fff' : C.textSec,
                        background: pathname === '/articles' ? C.blue : 'transparent',
                    }}
                >
                    <BookOpen className="w-4 h-4" />
                    Alla artiklar
                </Link>

                {/* Courses */}
                {filtered.courses.map(course => (
                    <CourseSection
                        key={course.id}
                        course={course}
                        currentSlug={currentSlug}
                        defaultOpen={
                            course.topics.some(t => t.articles.some(a => a.slug === currentSlug))
                            || course.uncategorized.some(a => a.slug === currentSlug)
                            || !!search.trim()
                        }
                    />
                ))}

                {/* General articles (no course) */}
                {filtered.general.length > 0 && (
                    <div className="mt-3">
                        <p
                            className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
                            style={{ color: C.textMuted }}
                        >
                            Allmänt
                        </p>
                        <div className="space-y-0.5">
                            {filtered.general.map(article => (
                                <ArticleLink
                                    key={article.slug}
                                    article={article}
                                    isActive={article.slug === currentSlug}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {filtered.courses.length === 0 && filtered.general.length === 0 && (
                    <div className="py-8 text-center">
                        <FileText className="w-6 h-6 mx-auto mb-2 opacity-30" style={{ color: C.textMuted }} />
                        <p className="text-[12px]" style={{ color: C.textMuted }}>
                            {search ? 'Inga artiklar hittades' : 'Inga publicerade artiklar'}
                        </p>
                    </div>
                )}
            </nav>

            {/* ── User card ────────────────────────────────────────────────── */}
            <Link
                href="/profile"
                className="mx-3 mb-4 p-3 rounded-xl flex items-center gap-2.5 no-underline transition-all hover:ring-2 hover:ring-blue-200"
                style={{ background: C.surfaceAlt }}
            >
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.purple})` }}
                >
                    {userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[12px] truncate" style={{ color: C.text }}>
                        {userName}
                    </div>
                    <div className="text-[10px]" style={{ color: C.textMuted }}>
                        Nivå {userLevel}
                    </div>
                </div>
            </Link>
        </aside>
    );
}
