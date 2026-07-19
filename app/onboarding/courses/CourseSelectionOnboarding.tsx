'use client';

import { useMemo, useState, useTransition } from 'react';
import { motion, AnimatePresence, MotionConfig, useReducedMotion } from 'framer-motion';
import { saveUserCourses } from '@/app/actions/courses';
import type { CourseSearchCatalogItem } from '@/app/actions/courses';
import {
    Archive,
    ArrowRight,
    BookOpen,
    Check,
    Loader2,
    Search,
    X,
} from 'lucide-react';

const ACCENTS = [
    { from: '#28afb0', to: '#1f8e90' },
    { from: '#19647e', to: '#24718e' },
    { from: '#10b981', to: '#059669' },
    { from: '#dfa81b', to: '#c08414' },
    { from: '#06b6d4', to: '#0891b2' },
    { from: '#f43f5e', to: '#e11d48' },
] as const;

function normalize(value: string | null | undefined) {
    return (value ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');
}

function scoreCourse(course: CourseSearchCatalogItem, needle: string) {
    const code = normalize(course.code);
    const name = normalize(course.name);
    const nameSv = normalize(course.nameSv);
    const uni = normalize(course.universityName);

    if (!needle) return 0;
    if (code === needle) return 1000;
    if (code.startsWith(needle)) return 900;
    if (name.startsWith(needle) || nameSv.startsWith(needle)) return 800;
    if (code.includes(needle)) return 700;
    if (name.includes(needle) || nameSv.includes(needle)) return 600;
    if (uni.includes(needle)) return 400;
    return 0;
}

interface Props {
    courses: CourseSearchCatalogItem[];
}

export default function CourseSelectionOnboarding({ courses }: Props) {
    const reduceMotion = useReducedMotion();
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [saving, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const needle = normalize(query.trim());

    const visibleCourses = useMemo(() => {
        if (!needle) return courses;

        return courses
            .map((course) => ({ course, score: scoreCourse(course, needle) }))
            .filter((item) => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .map((item) => item.course);
    }, [courses, needle]);

    const toggle = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleSave = () => {
        if (selected.size === 0) {
            setError('Select at least one course to continue.');
            return;
        }
        setError(null);
        startTransition(async () => {
            const result = await saveUserCourses(Array.from(selected));
            if (result?.error) setError(result.error);
        });
    };

    return (
        <MotionConfig reducedMotion={reduceMotion ? 'always' : 'never'}>
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-32">
                {/* Fixed top bar */}
                <div className="sticky top-0 z-20 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                    <div className="max-w-3xl mx-auto px-4 py-4">
                        {/* Progress */}
                        <div className="flex gap-1.5 mb-4">
                            {[0, 1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className={`h-1 flex-1 rounded-full transition-colors ${i <= 2 ? 'bg-indigo-500' : 'bg-zinc-200 dark:bg-zinc-800'}`}
                                />
                            ))}
                        </div>

                        <div className="flex items-end justify-between mb-3">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
                                        <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Step 3 of 4</span>
                                </div>
                                <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Choose your courses</h1>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Search by code or name — add any that you're studying.</p>
                            </div>
                            {selected.size > 0 && (
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.85 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold ring-1 ring-indigo-200 dark:ring-indigo-900"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    {selected.size} selected
                                </motion.span>
                            )}
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => { setQuery(e.target.value); setError(null); }}
                                placeholder="e.g. TATA41, Envariabelanalys, Linear Algebra…"
                                autoComplete="off"
                                spellCheck={false}
                                className="h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 pl-10 pr-10 text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 placeholder:font-normal outline-none transition-[border-color,box-shadow] duration-150 focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(40, 175, 176,0.12)] dark:focus:border-indigo-500"
                            />
                            <AnimatePresence initial={false}>
                                {query && (
                                    <motion.button
                                        type="button"
                                        aria-label="Clear search"
                                        onClick={() => setQuery('')}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ duration: 0.12 }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-700 dark:hover:text-white transition-colors"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="mt-2 text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                            {needle ? `${visibleCourses.length} results` : `${courses.length} courses available`}
                        </div>
                    </div>
                </div>

                {/* Course grid */}
                <div className="max-w-3xl mx-auto px-4 pt-5">
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-4 overflow-hidden"
                            >
                                <div className="px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl text-sm text-red-600 dark:text-red-400">
                                    {error}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!needle && (
                        <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
                            All available courses
                        </p>
                    )}

                    <AnimatePresence mode="popLayout" initial={false}>
                        {visibleCourses.length > 0 ? (
                            <motion.div
                                key="grid"
                                layout
                                className="grid gap-3 sm:grid-cols-2"
                            >
                                {visibleCourses.map((course, index) => {
                                    const isSelected = selected.has(course.id);
                                    const accent = ACCENTS[index % ACCENTS.length];
                                    return (
                                        <CourseCard
                                            key={course.id}
                                            course={course}
                                            accent={accent}
                                            selected={isSelected}
                                            onToggle={() => toggle(course.id)}
                                        />
                                    );
                                })}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2 }}
                                className="py-16 text-center"
                            >
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                                    <Search className="h-6 w-6" />
                                </div>
                                <p className="text-base font-semibold text-zinc-700 dark:text-zinc-300">No courses match "{query}"</p>
                                <p className="mt-1 text-sm text-zinc-400">Try a course code like TATA41 or a shorter keyword.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Sticky footer */}
                <div className="fixed bottom-0 left-0 right-0 z-20 pointer-events-none">
                    <div className="pointer-events-auto bg-gradient-to-t from-zinc-50 dark:from-zinc-950 via-zinc-50/80 dark:via-zinc-950/80 to-transparent pt-8 pb-6 px-4">
                        <div className="max-w-3xl mx-auto">
                            <div className="flex items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
                                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                                    {selected.size === 0
                                        ? 'Select courses to continue'
                                        : <span><span className="font-bold text-zinc-900 dark:text-white tabular-nums">{selected.size}</span> {selected.size === 1 ? 'course' : 'courses'} selected</span>
                                    }
                                </div>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || selected.size === 0}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 ${selected.size > 0
                                        ? 'bg-indigo-600 hover:bg-indigo-500 active:scale-[0.97] text-white shadow-sm'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                                    }`}
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving…
                                        </>
                                    ) : (
                                        <>
                                            Start learning
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MotionConfig>
    );
}

function CourseCard({
    course,
    accent,
    selected,
    onToggle,
}: {
    course: CourseSearchCatalogItem;
    accent: (typeof ACCENTS)[number];
    selected: boolean;
    onToggle: () => void;
}) {
    return (
        <motion.button
            layout
            type="button"
            onClick={onToggle}
            initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
            transition={{ type: 'spring', duration: 0.22, bounce: 0 }}
            whileTap={{ scale: 0.98 }}
            className={`group relative text-left w-full overflow-hidden rounded-2xl border transition-all duration-150 ${selected
                ? 'border-indigo-400 dark:border-indigo-500 shadow-[0_0_0_3px_rgba(40, 175, 176,0.15)] bg-white dark:bg-zinc-900'
                : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
            }`}
        >
            {/* Color band */}
            <div
                className="h-1.5 w-full transition-opacity"
                style={{
                    background: `linear-gradient(90deg, ${accent.from} 0%, ${accent.to} 100%)`,
                    opacity: selected ? 1 : 0.4,
                }}
            />

            <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                    <span
                        className="font-mono text-xs font-bold px-2 py-1 rounded-lg"
                        style={{
                            background: `${accent.from}18`,
                            color: accent.from,
                        }}
                    >
                        {course.code}
                    </span>
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-all ${selected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700'
                    }`}>
                        {selected ? (
                            <Check className="w-3.5 h-3.5" />
                        ) : (
                            <span className="text-[10px] font-bold leading-none">+</span>
                        )}
                    </div>
                </div>

                <h3 className={`text-sm font-semibold leading-snug line-clamp-2 transition-colors ${selected ? 'text-indigo-700 dark:text-indigo-300' : 'text-zinc-900 dark:text-white'}`}>
                    {course.nameSv || course.name}
                </h3>
                {course.nameSv && course.nameSv !== course.name && (
                    <p className="mt-0.5 text-xs text-zinc-400 line-clamp-1">{course.name}</p>
                )}

                <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                    <Archive className="w-3.5 h-3.5 shrink-0" />
                    <span className="tabular-nums">{course.examCount}</span>
                    <span>exams available</span>
                    {course.universityName && (
                        <>
                            <span className="text-zinc-200 dark:text-zinc-700">·</span>
                            <span className="truncate">{course.universityName}</span>
                        </>
                    )}
                </div>
            </div>
        </motion.button>
    );
}
