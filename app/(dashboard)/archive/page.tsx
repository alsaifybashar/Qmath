'use client';

import { useState, useEffect, useMemo } from 'react';
import { Upload, Search, Loader2, BookOpen, FileText, CheckCircle, Archive, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface CourseResult {
    courseCode: string;
    courseName: string;
    examCount: number;
    withSolutions: number;
    latestExamDate?: number | string;
}

export default function ArchivePage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<CourseResult[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    // All available courses (loaded on mount)
    const [allCourses, setAllCourses] = useState<CourseResult[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(true);

    const router = useRouter();

    // Load the full course list on mount
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/courses');
                if (res.ok) {
                    const data = await res.json();
                    setAllCourses(data.courses ?? []);
                }
            } catch {
                // silently ignore — the browse section just won't show
            } finally {
                setLoadingCourses(false);
            }
        })();
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();

        const query = searchQuery.trim().toUpperCase();
        if (!query) return;

        setIsLoading(true);
        setHasSearched(true);

        try {
            const response = await fetch(`/api/exams/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();

            if (response.ok && data.results?.length > 0) {
                // Group results by course
                const courseMap = new Map<string, CourseResult>();

                for (const exam of data.results) {
                    const existing = courseMap.get(exam.courseCode);
                    if (existing) {
                        existing.examCount++;
                        if (exam.hasSolution) existing.withSolutions++;
                        if (new Date(exam.examDate) > new Date(existing.latestExamDate ?? 0)) {
                            existing.latestExamDate = exam.examDate;
                        }
                    } else {
                        courseMap.set(exam.courseCode, {
                            courseCode: exam.courseCode,
                            courseName: exam.courseName,
                            examCount: 1,
                            withSolutions: exam.hasSolution ? 1 : 0,
                            latestExamDate: exam.examDate,
                        });
                    }
                }

                const courses = Array.from(courseMap.values());

                // If only one course found, redirect directly to it
                if (courses.length === 1) {
                    router.push(`/archive/${courses[0].courseCode}`);
                    return;
                }

                setResults(courses);
            } else {
                setResults([]);
            }
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Show the full course browse when: not yet searched, OR search returned zero results
    const showBrowse = loadingCourses || ((!hasSearched || (hasSearched && results.length === 0)) && allCourses.length > 0);
    const visibleCourses = useMemo(() => {
        const query = searchQuery.trim().toUpperCase();
        if (!query) return allCourses;

        return allCourses.filter(course =>
            course.courseCode.toUpperCase().includes(query)
            || course.courseName.toUpperCase().includes(query)
        );
    }, [allCourses, searchQuery]);
    const browseCourses = searchQuery.trim() ? visibleCourses : allCourses;
    const totalExams = allCourses.reduce((sum, course) => sum + course.examCount, 0);
    const totalSolutions = allCourses.reduce((sum, course) => sum + course.withSolutions, 0);

    return (
        <div className="liquid-theme relative min-h-screen overflow-hidden bg-slate-50 pb-20 text-zinc-950 dark:bg-[#08091f] dark:text-white">
            <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(249,115,22,0.22),transparent_28%),radial-gradient(circle_at_88%_18%,rgba(239,68,68,0.18),transparent_30%),radial-gradient(circle_at_52%_92%,rgba(251,146,60,0.14),transparent_34%),linear-gradient(135deg,#fff8f1_0%,#fff3eb_48%,#f8fbff_100%)] dark:bg-[radial-gradient(circle_at_12%_12%,rgba(249,115,22,0.40),transparent_28%),radial-gradient(circle_at_88%_18%,rgba(239,68,68,0.32),transparent_30%),radial-gradient(circle_at_52%_92%,rgba(251,146,60,0.18),transparent_34%),linear-gradient(135deg,#120806_0%,#32110d_48%,#08091f_100%)]" />
            <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.52),transparent_24%,rgba(255,255,255,0.20)_52%,transparent_76%)] dark:bg-[linear-gradient(115deg,rgba(255,255,255,0.09),transparent_24%,rgba(255,255,255,0.035)_52%,transparent_76%)]" />

            <div className="relative z-10 mx-auto grid max-w-[1160px] gap-5 px-4 py-8 lg:grid-cols-[1fr_290px]">
                <main className="min-w-0">
                    <section className="liquid-card p-5 text-center sm:p-6">
                        <div className="mx-auto max-w-3xl">
                            <div className="min-w-0">
                                <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-orange-300/25 bg-orange-400/10 px-2.5 py-1 text-[11px] font-bold text-orange-700 dark:text-orange-100">
                                    <Archive className="h-3.5 w-3.5" />
                                    Tentaarkiv
                                </div>
                                <h1 className="text-xl font-bold tracking-normal sm:text-2xl">
                                    Hitta rätt tenta snabbare
                                </h1>
                                <p className="liquid-muted mx-auto mt-2 max-w-xl text-xs leading-5 sm:text-sm">
                                    Sök på kurskod eller kursnamn. Listan filtreras direkt och exakta kurskoder kan öppnas utan extra steg.
                                </p>
                            </div>

                            <form onSubmit={handleSearch} className="archive-search-shell mx-auto mt-6 w-full max-w-2xl">
                                <div className="archive-search-field relative z-10 flex items-center gap-3 rounded-lg border border-white/40 bg-white/75 px-5 py-4 shadow-2xl shadow-orange-500/10 backdrop-blur-xl transition dark:border-white/10 dark:bg-white/[0.075] dark:shadow-black/20">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-white shadow-lg shadow-orange-500/25">
                                        <Search className="h-5 w-5" />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                                        placeholder="TATA24 eller Analys..."
                                        className="min-w-0 flex-1 border-0 bg-transparent font-mono text-lg font-bold text-zinc-950 outline-none placeholder:font-medium placeholder:text-zinc-500 focus:outline-none focus-visible:outline-none dark:text-white dark:placeholder:text-white/35"
                                        autoFocus
                                    />
                                    <button
                                        type="submit"
                                        disabled={isLoading || !searchQuery.trim()}
                                        className="inline-flex h-11 items-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-bold text-white outline-none transition hover:bg-orange-600 focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45 dark:bg-white dark:text-zinc-950 dark:hover:bg-orange-100"
                                    >
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                                        <span className="hidden sm:inline">{isLoading ? 'Söker' : 'Öppna'}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </section>

                    {hasSearched && results.length > 1 && (
                        <section className="mt-5">
                            <ListHeader
                                label="Sökresultat"
                                count={`${results.length} kurser`}
                                description="Flera kurser matchade sökningen."
                            />
                            <div className="grid gap-3">
                                {results.map(course => (
                                    <CourseCard key={course.courseCode} course={course} />
                                ))}
                            </div>
                        </section>
                    )}

                    {hasSearched && !isLoading && results.length === 0 && (
                        <section className="liquid-card mt-5 p-8 text-center">
                            <div className="liquid-card-soft mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg">
                                <Search className="h-7 w-7 liquid-subtle" />
                            </div>
                            <p className="font-bold">
                                Inga tentor hittades för &quot;{searchQuery}&quot;
                            </p>
                            <p className="liquid-muted mt-2 text-sm">
                                Kontrollera kurskoden eller använd listan nedan för att bläddra visuellt.
                            </p>
                        </section>
                    )}

                    {showBrowse && (
                        <section className="mt-5">
                            <ListHeader
                                label={searchQuery.trim() ? 'Matchande kurser' : 'Tillgängliga kurser'}
                                count={`${browseCourses.length} av ${allCourses.length}`}
                                description={searchQuery.trim() ? 'Filtrerat medan du skriver.' : 'Skannbar översikt över arkivet.'}
                            />

                            {loadingCourses ? (
                                <div className="liquid-card flex justify-center py-12">
                                    <Loader2 className="h-6 w-6 animate-spin text-orange-600 dark:text-orange-300" />
                                </div>
                            ) : browseCourses.length > 0 ? (
                                <div className="grid gap-3">
                                    {browseCourses.map(course => (
                                        <CourseCard key={course.courseCode} course={course} />
                                    ))}
                                </div>
                            ) : (
                                <div className="liquid-card p-8 text-center">
                                    <p className="font-bold">Ingen kurs matchar filtret</p>
                                    <p className="liquid-muted mt-2 text-sm">Rensa sökfältet för att se hela arkivet.</p>
                                </div>
                            )}
                        </section>
                    )}
                </main>

                <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
                    <div className="liquid-card p-5">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-orange-300/25 bg-orange-400/10 text-orange-700 dark:text-orange-100">
                                <Sparkles className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold">Arkivstatus</p>
                                <p className="liquid-muted text-xs">Snabb överblick</p>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <ArchiveStat label="Kurser" value={allCourses.length} />
                            <ArchiveStat label="Tentor" value={totalExams} />
                            <ArchiveStat label="Lösningar" value={totalSolutions} />
                        </div>
                    </div>

                    <Link
                        href="/admin/upload-exam"
                        className="liquid-card group block p-5 transition hover:-translate-y-0.5"
                    >
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="font-bold">Saknas något?</p>
                                <p className="liquid-muted mt-1 text-sm leading-5">Ladda upp tenta eller lösning till arkivet.</p>
                            </div>
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-white shadow-lg shadow-orange-500/20">
                                <Upload className="h-4 w-4" />
                            </div>
                        </div>
                    </Link>
                </aside>
            </div>
        </div>
    );
}

// ── Shared course card ────────────────────────────────────────────────────────

function ListHeader({
    label,
    count,
    description,
}: {
    label: string;
    count: string;
    description: string;
}) {
    return (
        <div className="mb-3 flex items-end justify-between gap-4">
            <div>
                <p className="text-sm font-bold">{label}</p>
                <p className="liquid-muted mt-1 text-xs">{description}</p>
            </div>
            <span className="rounded-lg border border-orange-300/25 bg-orange-400/10 px-2.5 py-1 text-xs font-bold text-orange-700 dark:text-orange-100">
                {count}
            </span>
        </div>
    );
}

function ArchiveStat({ label, value }: { label: string; value: number }) {
    return (
        <div className="liquid-card-soft flex items-center justify-between px-3 py-2.5">
            <span className="liquid-muted text-sm">{label}</span>
            <span className="font-mono text-sm font-bold">{value}</span>
        </div>
    );
}

function CourseCard({ course }: { course: CourseResult }) {
    const latestExam = course.latestExamDate
        ? new Date(course.latestExamDate).getFullYear()
        : null;

    return (
        <Link
            href={`/archive/${course.courseCode}`}
            className="liquid-card group flex items-center justify-between gap-4 p-4 transition-all hover:-translate-y-0.5"
        >
            <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-orange-300/20 bg-orange-400/10">
                    <BookOpen className="text-orange-700 dark:text-orange-200" size={22} />
                </div>
                <div className="min-w-0">
                    <div className="font-mono font-bold tracking-normal">
                        {course.courseCode}
                    </div>
                    <div className="liquid-muted truncate text-sm">
                        {course.courseName}
                    </div>
                </div>
            </div>
            <div className="flex shrink-0 items-center gap-5 text-right">
                {latestExam && (
                    <div className="liquid-subtle hidden text-xs md:block">
                        Senast {latestExam}
                    </div>
                )}
                <div className="liquid-muted hidden sm:flex items-center gap-1.5 text-sm">
                    <FileText className="w-4 h-4" />
                    <span>{course.examCount} tentor</span>
                </div>
                {course.withSolutions > 0 && (
                    <div className="hidden sm:flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-300">
                        <CheckCircle className="w-4 h-4" />
                        <span>{course.withSolutions} med lösningar</span>
                    </div>
                )}
                <div className="sm:hidden text-right text-sm">
                    <div className="font-medium">
                        {course.examCount} tentor
                    </div>
                    <div className="liquid-subtle">
                        {course.withSolutions} med lösningar
                    </div>
                </div>
                <ArrowRight className="hidden h-4 w-4 text-orange-700 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100 dark:text-orange-200 sm:block" />
            </div>
        </Link>
    );
}
