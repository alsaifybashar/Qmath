'use client';

import { useState, useTransition } from 'react';
import { Search, Loader2, Plus, Check, BookOpen, Archive, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { searchCoursesWithExams, addCourseEnrollment } from '@/app/actions/courses';

interface DiscoverResult {
    id: string | null;
    code: string;
    name: string;
    examCount: number;
    canEnroll: boolean;
}

interface Props {
    /** Course IDs the user is already enrolled in */
    enrolledIds: string[];
}

export default function CoursesDiscover({ enrolledIds }: Props) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<DiscoverResult[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [isSearching, startSearch] = useTransition();
    const [addingId, setAddingId] = useState<string | null>(null);
    const [addedIds, setAddedIds] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const q = query.trim();
        if (q.length < 2) return;

        setHasSearched(true);
        setError(null);
        startSearch(async () => {
            const res = await searchCoursesWithExams(q);
            setResults(res.data ?? []);
        });
    };

    const handleAdd = async (courseId: string) => {
        setAddingId(courseId);
        setError(null);
        const res = await addCourseEnrollment(courseId);
        if (res?.error) {
            setError(res.error === 'Already enrolled in this course' ? 'Redan i din lista' : res.error);
        } else {
            setAddedIds((prev) => [...prev, courseId]);
        }
        setAddingId(null);
    };

    const isEnrolled = (id: string | null) =>
        id !== null && (enrolledIds.includes(id) || addedIds.includes(id));

    return (
        <div>
            <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/15 dark:text-emerald-100">
                    <Search size={18} />
                </div>
                <div>
                    <h2 className="text-base font-bold">Lägg till kurs</h2>
                    <p className="liquid-muted mt-1 text-pretty text-sm leading-6">
                        Sök på kurskod. Kurser med gamla tentor kan läggas till direkt eller öppnas i arkivet.
                    </p>
                </div>
            </div>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="mb-4 flex flex-col gap-2 sm:flex-row xl:flex-col">
                <div className="liquid-card-soft flex min-h-11 flex-1 items-center gap-2 px-4 py-2.5">
                    <Search size={15} className="liquid-subtle flex-shrink-0" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value.toUpperCase())}
                        placeholder="t.ex. TSRT19"
                        className="flex-1 bg-transparent border-0 outline-none text-sm font-mono text-zinc-950 placeholder:text-zinc-500 dark:text-white dark:placeholder:text-white/35"
                        autoComplete="off"
                        spellCheck={false}
                    />
                </div>
                <button
                    type="submit"
                    disabled={isSearching || query.trim().length < 2}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-[background-color,opacity,scale] duration-150 ease-out hover:bg-blue-500 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40"
                >
                    {isSearching ? <Loader2 size={15} className="animate-spin" /> : 'Sök'}
                </button>
            </form>

            {/* Error */}
            {error && (
                <p className="text-sm mb-3 text-rose-600 dark:text-rose-300">{error}</p>
            )}

            {/* Results */}
            {hasSearched && !isSearching && results.length === 0 && (
                <div className="liquid-card-soft border-dashed p-5 text-center">
                    <p className="liquid-muted text-pretty text-sm">
                        Inga tentor hittades för &quot;{query}&quot;. Prova den exakta kurskoden.
                    </p>
                </div>
            )}

            {results.length > 0 && (
                <div className="flex flex-col gap-2">
                    {results.map((course) => {
                        const enrolled = isEnrolled(course.id);
                        const isAdding = addingId === course.id;

                        return (
                            <div key={course.code} className="liquid-card-soft flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between xl:flex-col xl:items-stretch">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-700 ring-1 ring-blue-500/15 dark:text-blue-100">
                                        <BookOpen size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="rounded bg-blue-500/10 px-1.5 py-0.5 font-mono text-xs font-bold text-blue-700 dark:text-blue-100">
                                                {course.code}
                                            </span>
                                            <span className="liquid-subtle flex items-center gap-1 text-xs tabular-nums">
                                                <Archive size={11} />
                                                {course.examCount} gamla tentor
                                            </span>
                                        </div>
                                        <p className="mt-0.5 truncate text-sm font-semibold">
                                            {course.name}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-shrink-0 items-center gap-2 sm:ml-3 xl:ml-0">
                                    {/* Always show link to archive */}
                                    <Link
                                        href={`/archive/${course.code}`}
                                        className="liquid-card-soft inline-flex min-h-10 flex-1 items-center justify-center gap-1 px-3 py-2 text-xs font-semibold transition-[background-color,scale] duration-150 ease-out hover:bg-white/75 active:scale-[0.96] dark:hover:bg-white/10"
                                    >
                                        Se tentor <ChevronRight size={12} />
                                    </Link>

                                    {course.canEnroll && (
                                        enrolled ? (
                                            <span className="flex min-h-10 items-center gap-1 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-700 ring-1 ring-emerald-500/15 dark:text-emerald-100">
                                                <Check size={13} /> Tillagd
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => course.id && handleAdd(course.id)}
                                                disabled={isAdding}
                                                className="flex min-h-10 items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition-[background-color,opacity,scale] duration-150 ease-out hover:bg-blue-500 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50"
                                            >
                                                {isAdding ? (
                                                    <Loader2 size={13} className="animate-spin" />
                                                ) : (
                                                    <><Plus size={13} /> Lägg till kurs</>
                                                )}
                                            </button>
                                        )
                                    )}

                                    {!course.canEnroll && (
                                        <span className="liquid-card-soft liquid-muted flex min-h-10 items-center px-3 py-2 text-xs">
                                            Endast arkiv
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
