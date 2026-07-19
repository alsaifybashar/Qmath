'use client';

import { useMemo, useState, useTransition } from 'react';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Archive,
    ArrowRight,
    Check,
    GraduationCap,
    Loader2,
    Plus,
    Search,
    X,
} from 'lucide-react';
import { addCourseEnrollment, type CourseSearchCatalogItem } from '@/app/actions/courses';

const ACCENTS = [
    { from: '#28afb0', to: '#1f8e90' },
    { from: '#19647e', to: '#24718e' },
    { from: '#10b981', to: '#059669' },
    { from: '#dfa81b', to: '#c08414' },
    { from: '#06b6d4', to: '#0891b2' },
    { from: '#f43f5e', to: '#e11d48' },
] as const;

interface CoursesSearchWorkspaceProps {
    courses: CourseSearchCatalogItem[];
    enrolledIds: string[];
}

function normalize(value: string | null | undefined) {
    return (value ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function scoreCourse(course: CourseSearchCatalogItem, needle: string, enrolled: boolean) {
    const code = normalize(course.code);
    const name = normalize(course.name);
    const nameSv = normalize(course.nameSv);
    const university = normalize(course.universityName);

    if (!needle) return enrolled ? 100 : 0;
    if (code === needle) return 1000;
    if (code.startsWith(needle)) return 900;
    if (name.startsWith(needle) || nameSv.startsWith(needle)) return 800;
    if (code.includes(needle)) return 700;
    if (name.includes(needle) || nameSv.includes(needle)) return 600;
    if (university.includes(needle)) return 400;
    return 0;
}

export default function CoursesSearchWorkspace({ courses, enrolledIds }: CoursesSearchWorkspaceProps) {
    const router = useRouter();
    const reduceMotion = useReducedMotion();
    const [query, setQuery] = useState('');
    const [addedIds, setAddedIds] = useState<string[]>([]);
    const [addingId, setAddingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const enrolledSet = useMemo(() => new Set([...enrolledIds, ...addedIds]), [addedIds, enrolledIds]);
    const needle = normalize(query.trim());

    const visibleCourses = useMemo(() => {
        return courses
            .map((course, index) => {
                const enrolled = enrolledSet.has(course.id);
                return {
                    course,
                    index,
                    enrolled,
                    score: scoreCourse(course, needle, enrolled),
                };
            })
            .filter((item) => (needle ? item.score > 0 : item.enrolled))
            .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                if (Number(b.enrolled) !== Number(a.enrolled)) return Number(b.enrolled) - Number(a.enrolled);
                return a.course.code.localeCompare(b.course.code);
            });
    }, [courses, enrolledSet, needle]);

    const enrolledCount = courses.filter((course) => enrolledSet.has(course.id)).length;
    const isSearching = needle.length > 0;

    function clearSearch() {
        setQuery('');
        setError(null);
    }

    function handleAdd(courseId: string) {
        setAddingId(courseId);
        setError(null);

        startTransition(async () => {
            const res = await addCourseEnrollment(courseId);
            if (res?.error) {
                setError(res.error === 'Already enrolled in this course' ? 'Kursen finns redan i din lista.' : res.error);
            } else {
                setAddedIds((prev) => (prev.includes(courseId) ? prev : [...prev, courseId]));
                router.refresh();
            }
            setAddingId(null);
        });
    }

    return (
        <MotionConfig reducedMotion={reduceMotion ? 'always' : 'never'}>
            <div className="relative min-h-screen text-zinc-950 dark:text-white">
                <div
                    aria-hidden
                    className="pointer-events-none absolute -top-40 right-0 h-[480px] w-[480px] rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(40, 175, 176,0.13) 0%, transparent 70%)',
                        filter: 'blur(64px)',
                    }}
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute top-1/3 -left-24 h-80 w-80 rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)',
                        filter: 'blur(52px)',
                    }}
                />

                <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-20 pt-5 sm:px-6 lg:px-8">
                    <section className="mb-6">
                        <div
                            className="relative overflow-hidden rounded-2xl border border-black/[0.07] bg-white/75 p-4 shadow-[0_8px_32px_rgba(15,23,42,0.08)] backdrop-blur-[22px] dark:border-white/[0.10] dark:bg-white/[0.07] sm:p-5"
                        >
                            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h1 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">Mina kurser</h1>
                                    <p className="mt-1 text-pretty text-sm leading-6 text-zinc-500 dark:text-white/55">
                                        Sök på kurskod eller kursnamn. Resultatet uppdateras direkt medan du skriver.
                                    </p>
                                </div>
                                <span className="inline-flex w-fit items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-500/15 dark:text-emerald-300">
                                    <Check className="h-3.5 w-3.5" />
                                    {enrolledCount} aktiva
                                </span>
                            </div>

                            <div className="relative">
                                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="search"
                                    value={query}
                                    onChange={(event) => {
                                        setQuery(event.target.value);
                                        setError(null);
                                    }}
                                    placeholder="Sök kurskod eller namn, t.ex. TATA41 eller Envariabelanalys"
                                    className="h-14 w-full rounded-xl border border-black/10 bg-white pl-12 pr-12 text-sm font-semibold text-zinc-950 shadow-sm outline-none transition-[border-color,box-shadow] duration-150 ease-out placeholder:font-normal placeholder:text-zinc-400 focus:border-indigo-300 focus:shadow-[0_0_0_4px_rgba(40, 175, 176,0.12)] dark:border-white/10 dark:bg-zinc-950/80 dark:text-white dark:placeholder:text-white/35 dark:focus:border-indigo-300/60"
                                    autoComplete="off"
                                    spellCheck={false}
                                />
                                <AnimatePresence initial={false}>
                                    {query && (
                                        <motion.button
                                            type="button"
                                            aria-label="Rensa sökning"
                                            onClick={clearSearch}
                                            initial={{ opacity: 0, scale: 0.85, filter: 'blur(3px)' }}
                                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                            exit={{ opacity: 0, scale: 0.9, filter: 'blur(3px)' }}
                                            transition={{ type: 'spring', duration: 0.18, bounce: 0 }}
                                            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 transition-[background-color,color,scale] duration-150 ease-out hover:bg-zinc-100 hover:text-zinc-700 active:scale-[0.96] dark:hover:bg-white/10 dark:hover:text-white"
                                        >
                                            <X className="h-4 w-4" />
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-white/45">
                                <span className="tabular-nums">
                                    {isSearching ? `${visibleCourses.length} matchningar` : `${enrolledCount} aktiva kurser`}
                                </span>
                                {isSearching && (
                                    <span className="rounded-full bg-indigo-500/10 px-2 py-1 font-semibold text-indigo-700 dark:text-indigo-300">
                                        Live filtrering
                                    </span>
                                )}
                            </div>
                        </div>
                    </section>

                    {error && (
                        <div className="mb-4 rounded-xl bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-500/15 dark:text-rose-200">
                            {error}
                        </div>
                    )}

                    <AnimatePresence mode="popLayout" initial={false}>
                        {visibleCourses.length > 0 ? (
                            <motion.div
                                key="results"
                                layout
                                className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                            >
                                {visibleCourses.map(({ course, index, enrolled }) => (
                                    <CourseResultCard
                                        key={course.id}
                                        course={course}
                                        accent={ACCENTS[index % ACCENTS.length]}
                                        enrolled={enrolled}
                                        adding={addingId === course.id && isPending}
                                        onAdd={() => handleAdd(course.id)}
                                    />
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                                transition={{ type: 'spring', duration: 0.22, bounce: 0 }}
                                className="rounded-2xl border border-dashed border-black/10 bg-white/55 p-10 text-center backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]"
                            >
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-700 ring-1 ring-indigo-500/15 dark:text-indigo-300">
                                    <Search className="h-6 w-6" />
                                </div>
                                <h2 className="text-lg font-bold">Ingen kurs matchar sökningen</h2>
                                <p className="mx-auto mt-2 max-w-md text-pretty text-sm leading-6 text-zinc-500 dark:text-white/55">
                                    Prova kurskod, svensk kursbenämning eller ett kortare ord från kursnamnet.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </MotionConfig>
    );
}

function CourseResultCard({
    course,
    accent,
    enrolled,
    adding,
    onAdd,
}: {
    course: CourseSearchCatalogItem;
    accent: (typeof ACCENTS)[number];
    enrolled: boolean;
    adding: boolean;
    onAdd: () => void;
}) {
    return (
        <motion.article
            layout
            initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
            transition={{ type: 'spring', duration: 0.22, bounce: 0 }}
            className="group overflow-hidden rounded-2xl border border-black/[0.07] bg-white/70 shadow-[0_4px_20px_rgba(15,23,42,0.07)] backdrop-blur-[20px] dark:border-white/10 dark:bg-white/[0.07]"
        >
            <div
                className="relative h-24 overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${accent.from} 0%, ${accent.to} 100%)` }}
            >
                <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{ background: 'radial-gradient(ellipse at 20% 30%, rgba(255,255,255,0.26) 0%, transparent 58%)' }}
                />
                <div className="absolute inset-0 flex items-start justify-between p-4">
                    <span className="rounded-lg bg-white/20 px-2.5 py-1 font-mono text-sm font-extrabold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur-md">
                        {course.code}
                    </span>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur-md">
                        <GraduationCap className="h-4 w-4" />
                    </div>
                </div>
            </div>

            <div className="flex min-h-[164px] flex-col justify-between p-4">
                <div>
                    <h3 className="line-clamp-2 text-pretty text-base font-bold leading-snug text-zinc-950 dark:text-white">
                        {course.nameSv || course.name}
                    </h3>
                    {course.nameSv && course.nameSv !== course.name && (
                        <p className="mt-1 line-clamp-1 text-xs text-zinc-500 dark:text-white/45">{course.name}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2 py-1 font-semibold text-zinc-600 dark:bg-white/10 dark:text-white/60">
                            <Archive className="h-3 w-3" />
                            <span className="tabular-nums">{course.examCount}</span> tentor
                        </span>
                        {enrolled && (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-1 font-semibold text-emerald-700 dark:text-emerald-300">
                                <Check className="h-3 w-3" />
                                Tillagd
                            </span>
                        )}
                    </div>
                </div>

                <div className="mt-5 flex items-center gap-2">
                    {enrolled ? (
                        <Link
                            href={`/courses/${course.code}`}
                            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-3 py-2 text-sm font-bold text-white transition-[background-color,scale] duration-150 ease-out hover:bg-indigo-700 active:scale-[0.96] dark:bg-white dark:text-zinc-950 dark:hover:bg-indigo-100"
                        >
                            Öppna kurs
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    ) : (
                        <button
                            type="button"
                            onClick={onAdd}
                            disabled={adding}
                            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white transition-[background-color,opacity,scale] duration-150 ease-out hover:bg-indigo-500 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50"
                        >
                            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            Lägg till
                        </button>
                    )}
                    <Link
                        href={`/archive/${course.code}`}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl bg-zinc-100 px-3 py-2 text-sm font-bold text-zinc-600 transition-[background-color,color,scale] duration-150 ease-out hover:bg-zinc-200 hover:text-zinc-950 active:scale-[0.96] dark:bg-white/10 dark:text-white/65 dark:hover:bg-white/15 dark:hover:text-white"
                    >
                        Arkiv
                    </Link>
                </div>
            </div>
        </motion.article>
    );
}
