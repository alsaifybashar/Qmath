'use client';

import { useState, useEffect } from 'react';
import { Upload, Search, Loader2, BookOpen, FileText, CheckCircle } from 'lucide-react';
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
    const showBrowse = (!hasSearched || (hasSearched && results.length === 0)) && allCourses.length > 0;

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-zinc-950 dark:to-zinc-900">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Hero / Search header */}
                <div className={`flex flex-col items-center ${hasSearched ? 'pt-12' : showBrowse ? 'pt-16' : 'justify-center min-h-[60vh]'}`}>
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-block">
                            <h1 className="text-5xl font-serif font-bold text-slate-900 dark:text-white mb-2">
                                Qmath <span className="text-blue-600">Exams</span>
                            </h1>
                        </Link>
                        <p className="text-slate-600 dark:text-zinc-400 mt-2 text-lg">
                            Sök och bläddra bland gamla tentor från ditt universitet
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="w-full max-w-2xl">
                        <form onSubmit={handleSearch}>
                            <div className="relative flex items-center gap-3 bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 rounded-2xl px-5 py-4 hover:border-blue-500 dark:hover:border-blue-600 focus-within:border-blue-500 dark:focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all shadow-lg shadow-slate-200/50 dark:shadow-none">
                                <Search className="w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                                    placeholder="Sök på kurskod (t.ex. TATA24)"
                                    className="flex-1 bg-transparent border-0 outline-none text-lg text-slate-900 dark:text-white placeholder:text-slate-400 font-mono"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || !searchQuery.trim()}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Söker...
                                        </>
                                    ) : (
                                        'Sök'
                                    )}
                                </button>
                            </div>
                        </form>

                        <p className="text-center text-sm text-slate-500 dark:text-zinc-500 mt-3">
                            Tips: Ange den exakta kurskoden för att gå direkt till kurssidan
                        </p>
                    </div>

                    {/* Upload link */}
                    <Link
                        href="/admin/upload-exam"
                        className="mt-5 flex items-center gap-2 text-sm text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                        <Upload className="w-4 h-4" />
                        Ladda upp tenta eller lösning
                    </Link>
                </div>

                {/* ── Search Results ── */}
                {hasSearched && (
                    <div className="py-8">
                        {results.length > 1 && (
                            <>
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                                    Hittade {results.length} kurser
                                </h2>
                                <div className="grid gap-3">
                                    {results.map(course => (
                                        <CourseCard key={course.courseCode} course={course} />
                                    ))}
                                </div>
                            </>
                        )}

                        {!isLoading && results.length === 0 && (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-8 h-8 text-slate-400" />
                                </div>
                                <p className="text-xl text-slate-600 dark:text-zinc-400">
                                    Inga tentor hittades för &quot;{searchQuery}&quot;
                                </p>
                                <p className="text-sm text-slate-500 dark:text-zinc-500 mt-2">
                                    Prova en annan kurskod eller bläddra bland alla tillgängliga kurser nedan
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Browse all available courses ── */}
                {showBrowse && (
                    <div className="py-10">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                                Alla tillgängliga kurser
                            </h2>
                            <span className="text-sm text-slate-500 dark:text-zinc-400">
                                {allCourses.length} kurs{allCourses.length !== 1 ? 'er' : ''}
                            </span>
                        </div>

                        {loadingCourses ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {allCourses.map(course => (
                                    <CourseCard key={course.courseCode} course={course} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Shared course card ────────────────────────────────────────────────────────

function CourseCard({ course }: { course: CourseResult }) {
    return (
        <Link
            href={`/archive/${course.courseCode}`}
            className="group flex items-center justify-between p-5 bg-white dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all"
        >
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="text-blue-600 dark:text-blue-400" size={22} />
                </div>
                <div>
                    <div className="font-mono font-bold text-slate-900 dark:text-white">
                        {course.courseCode}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-zinc-400">
                        {course.courseName}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-6 text-right">
                <div className="hidden sm:flex items-center gap-1.5 text-sm text-slate-500 dark:text-zinc-400">
                    <FileText className="w-4 h-4" />
                    <span>{course.examCount} tentor</span>
                </div>
                {course.withSolutions > 0 && (
                    <div className="hidden sm:flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span>{course.withSolutions} med lösningar</span>
                    </div>
                )}
                <div className="sm:hidden text-right text-sm">
                    <div className="font-medium text-slate-900 dark:text-white">
                        {course.examCount} tentor
                    </div>
                    <div className="text-slate-500 dark:text-zinc-500">
                        {course.withSolutions} med lösningar
                    </div>
                </div>
            </div>
        </Link>
    );
}
