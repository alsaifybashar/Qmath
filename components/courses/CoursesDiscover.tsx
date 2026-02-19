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
                <Search size={16} style={{ color: '#A0A5C0' }} />
                <h2 className="text-base font-semibold" style={{ color: '#1A1D2E' }}>
                    Upptäck kurser
                </h2>
            </div>
            <p className="text-sm mb-4" style={{ color: '#A0A5C0' }}>
                Sök efter kurskod. Om vi har gamla tentor för kursen kan du lägga till den i din lista.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <div
                    className="flex-1 flex items-center gap-2 rounded-xl px-4 py-2.5"
                    style={{
                        background: '#F7F8FC',
                        border: '1.5px solid #EFF1F8',
                    }}
                >
                    <Search size={15} style={{ color: '#A0A5C0', flexShrink: 0 }} />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value.toUpperCase())}
                        placeholder="t.ex. TSRT19"
                        className="flex-1 bg-transparent border-0 outline-none text-sm font-mono"
                        style={{ color: '#1A1D2E' }}
                        autoComplete="off"
                        spellCheck={false}
                    />
                </div>
                <button
                    type="submit"
                    disabled={isSearching || query.trim().length < 2}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
                    style={{ background: '#4361EE' }}
                >
                    {isSearching ? <Loader2 size={15} className="animate-spin" /> : 'Sök'}
                </button>
            </form>

            {/* Error */}
            {error && (
                <p className="text-sm mb-3" style={{ color: '#EF4444' }}>{error}</p>
            )}

            {/* Results */}
            {hasSearched && !isSearching && results.length === 0 && (
                <div
                    className="rounded-xl p-5 text-center"
                    style={{ background: '#F7F8FC', border: '1px dashed #EFF1F8' }}
                >
                    <p className="text-sm" style={{ color: '#A0A5C0' }}>
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
                            <div
                                key={course.code}
                                className="flex items-center justify-between rounded-xl px-4 py-3"
                                style={{
                                    background: 'white',
                                    border: '1px solid #EFF1F8',
                                    boxShadow: '0 1px 4px rgba(26,29,46,0.05)',
                                }}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div
                                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{ background: '#EEF1FF' }}
                                    >
                                        <BookOpen size={16} style={{ color: '#4361EE' }} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="text-xs font-mono font-bold px-1.5 py-0.5 rounded"
                                                style={{ background: '#EEF1FF', color: '#4361EE' }}
                                            >
                                                {course.code}
                                            </span>
                                            <span
                                                className="flex items-center gap-1 text-xs"
                                                style={{ color: '#A0A5C0' }}
                                            >
                                                <Archive size={11} />
                                                {course.examCount} gamla tentor
                                            </span>
                                        </div>
                                        <p
                                            className="text-sm font-medium mt-0.5 truncate"
                                            style={{ color: '#1A1D2E' }}
                                        >
                                            {course.name}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                    {/* Always show link to archive */}
                                    <Link
                                        href={`/archive/${course.code}`}
                                        className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all"
                                        style={{ color: '#6B7194', background: '#F7F8FC', border: '1px solid #EFF1F8' }}
                                    >
                                        Se tentor <ChevronRight size={12} />
                                    </Link>

                                    {course.canEnroll && (
                                        enrolled ? (
                                            <span
                                                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
                                                style={{ background: '#ECFDF5', color: '#059669' }}
                                            >
                                                <Check size={13} /> Tillagd
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => course.id && handleAdd(course.id)}
                                                disabled={isAdding}
                                                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-all disabled:opacity-50"
                                                style={{ background: '#4361EE' }}
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
                                        <span
                                            className="text-xs px-2.5 py-1.5 rounded-lg"
                                            style={{ color: '#A0A5C0', background: '#F7F8FC', border: '1px solid #EFF1F8' }}
                                        >
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
