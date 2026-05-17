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
            {/* Section header */}
            <div className="flex items-center gap-2 mb-4">
                <Search size={16} className="liquid-subtle" />
                <h2 className="text-base font-bold">
                    Upptäck kurser
                </h2>
            </div>
            <p className="liquid-muted text-sm mb-4">
                Sök efter kurskod. Om vi har gamla tentor för kursen kan du lägga till den i din lista.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <div className="liquid-card-soft flex-1 flex items-center gap-2 px-4 py-2.5">
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
                    className="px-4 py-2.5 rounded-lg text-sm font-bold text-white transition-all disabled:opacity-40 bg-blue-600 hover:bg-blue-500"
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
                <div className="liquid-card-soft p-5 text-center border-dashed">
                    <p className="liquid-muted text-sm">
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
                            <div key={course.code} className="liquid-card-soft flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-400/10 text-blue-700 dark:text-blue-100">
                                        <BookOpen size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-blue-400/10 text-blue-700 dark:text-blue-100">
                                                {course.code}
                                            </span>
                                            <span className="liquid-subtle flex items-center gap-1 text-xs">
                                                <Archive size={11} />
                                                {course.examCount} gamla tentor
                                            </span>
                                        </div>
                                        <p className="text-sm font-semibold mt-0.5 truncate">
                                            {course.name}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                    {/* Always show link to archive */}
                                    <Link
                                        href={`/archive/${course.code}`}
                                        className="liquid-card-soft flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 transition-all"
                                    >
                                        Se tentor <ChevronRight size={12} />
                                    </Link>

                                    {course.canEnroll && (
                                        enrolled ? (
                                            <span className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-400/10 text-emerald-700 dark:text-emerald-100">
                                                <Check size={13} /> Tillagd
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => course.id && handleAdd(course.id)}
                                                disabled={isAdding}
                                                className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all disabled:opacity-50 bg-blue-600 hover:bg-blue-500"
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
                                        <span className="liquid-card-soft text-xs px-2.5 py-1.5 liquid-muted">
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
