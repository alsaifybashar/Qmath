'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { AnimatePresence, motion } from 'framer-motion';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';
import { deleteAdminCourse } from '@/app/actions/admin-questions';
import {
    BookOpen,
    FileText,
    CheckCircle,
    Upload,
    HelpCircle,
    ExternalLink,
    Layers,
    Loader2,
    Search,
    Trash2,
} from 'lucide-react';

interface AdminCourse {
    id?: string;
    courseCode: string;
    courseName: string;
    examCount: number;
    withSolutions: number;
    latestExamDate?: number;
}

const UI_TRANSITION = 'transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]';
const PRESSABLE = `${UI_TRANSITION} active:scale-[0.96]`;
const ICON_BUTTON = `inline-flex h-10 w-10 items-center justify-center rounded-xl ${PRESSABLE}`;
const SMOOTH_TRANSITION = { type: 'spring', duration: 0.3, bounce: 0 } as const;

export default function AdminCoursesPage() {
    const { data: session } = useSession();
    const [courses, setCourses] = useState<AdminCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/admin/courses');
                if (res.ok) {
                    const data = await res.json();
                    setCourses(data.courses ?? []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'p') {
                event.preventDefault();
                searchInputRef.current?.focus();
                searchInputRef.current?.select();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleDeleteCourse = async (course: AdminCourse) => {
        if (!course.id) {
            alert('This course cannot be removed because it has no course record.');
            return;
        }

        const confirmed = window.confirm(
            `Remove ${course.courseCode} - ${course.courseName}? This deletes the course, its exams, topics, questions, enrollments, and generated study content.`
        );
        if (!confirmed) return;

        setDeletingCourseId(course.id);
        const result = await deleteAdminCourse(course.id);
        if (result.success) {
            setCourses(prev => prev.filter(c => c.id !== course.id));
        } else {
            alert(result.error);
        }
        setDeletingCourseId(null);
    };

    if (!session) return null;

    const totalExams = courses.reduce((sum, course) => sum + course.examCount, 0);
    const totalSolutions = courses.reduce((sum, course) => sum + course.withSolutions, 0);
    const latestExamDate = courses
        .map(course => course.latestExamDate)
        .filter((date): date is number => typeof date === 'number')
        .sort((a, b) => b - a)[0];
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filteredCourses = normalizedSearch
        ? courses.filter(course =>
            course.courseCode.toLowerCase().includes(normalizedSearch) ||
            course.courseName.toLowerCase().includes(normalizedSearch)
        )
        : courses;

    return (
        <AdminLayout>
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(53, 133, 163,0.12),transparent_30%),linear-gradient(180deg,#f8fbff_0%,#f5f7fb_48%,#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(53, 133, 163,0.16),transparent_28%),linear-gradient(180deg,#09090b_0%,#0f172a_100%)]" />

                <div className="relative mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
                    {/* Search workspace */}
                    <motion.section
                        initial={{ opacity: 0, y: 8, scale: 0.99 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={SMOOTH_TRANSITION}
                        className="overflow-hidden rounded-[28px] border border-white/70 bg-white/90 shadow-[0_24px_80px_-32px_rgba(36, 113, 142,0.28)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90"
                    >
                        <div className="relative px-6 py-6 sm:px-8">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-violet-500 opacity-[0.08]" />
                            <div className="absolute -left-16 top-0 h-40 w-40 rounded-full bg-blue-400/20 blur-3xl" />
                            <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-violet-400/20 blur-3xl" />

                            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                                <div className="max-w-3xl space-y-3">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                                        <BookOpen className="h-3.5 w-3.5" />
                                        Course library
                                    </div>
                                    <div>
                                        <h1 className="text-balance text-3xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
                                            Course management
                                        </h1>
                                        <p className="mt-3 max-w-2xl text-pretty text-sm leading-6 text-zinc-600 dark:text-zinc-400 sm:text-base">
                                            Search, audit, and jump into the course structure with the same focused workflow as the questions workspace.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-[minmax(280px,420px)_auto] sm:items-center">
                                    <div className="relative min-w-0">
                                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                        <input
                                            ref={searchInputRef}
                                            value={searchTerm}
                                            onChange={event => setSearchTerm(event.target.value)}
                                            placeholder="Search course code or name..."
                                            className={`h-12 w-full rounded-2xl border border-white/80 bg-white/95 pl-11 pr-20 text-sm text-zinc-900 shadow-[0_14px_34px_-26px_rgba(15,23,42,0.35)] outline-none placeholder:text-zinc-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-950/90 dark:text-white ${UI_TRANSITION}`}
                                        />
                                        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-semibold text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
                                            Ctrl P
                                        </kbd>
                                    </div>
                                    <Link
                                        href="/admin/upload-exam"
                                        className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-[0_14px_34px_-22px_rgba(36, 113, 142,0.85)] hover:bg-blue-700 ${PRESSABLE}`}
                                    >
                                        <Upload className="h-4 w-4" />
                                        Upload Exam
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="relative grid gap-3 border-t border-blue-100/80 px-6 py-5 text-sm text-zinc-600 sm:grid-cols-3 sm:px-8 dark:border-zinc-800 dark:text-zinc-400">
                            <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/60">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Visible</p>
                                <p className="mt-1 font-medium tabular-nums text-zinc-900 dark:text-white">{filteredCourses.length} of {courses.length}</p>
                                <p className="mt-1 text-xs leading-5">Filtered by code or course name.</p>
                            </div>
                            <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/60">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Shortcut</p>
                                <p className="mt-1 font-medium text-zinc-900 dark:text-white">Ctrl P</p>
                                <p className="mt-1 text-xs leading-5">Focuses the search input instantly.</p>
                            </div>
                            <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/60">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Next action</p>
                                <p className="mt-1 font-medium text-zinc-900 dark:text-white">Open structure</p>
                                <p className="mt-1 text-xs leading-5">Jump to topics, questions, exams, or archive.</p>
                            </div>
                        </div>
                    </motion.section>

                    {/* Summary rail */}
                    <motion.section layout className="grid gap-3 md:grid-cols-4" transition={SMOOTH_TRANSITION}>
                        <motion.div layout className="rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90" transition={SMOOTH_TRANSITION}>
                            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Courses</p>
                            <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-white">{courses.length}</p>
                        </motion.div>
                        <motion.div layout className="rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90" transition={SMOOTH_TRANSITION}>
                            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Exams</p>
                            <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-white">{totalExams}</p>
                        </motion.div>
                        <motion.div layout className="rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90" transition={SMOOTH_TRANSITION}>
                            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Solutions</p>
                            <p className="mt-2 text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{totalSolutions}</p>
                        </motion.div>
                        <motion.div layout className="rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90" transition={SMOOTH_TRANSITION}>
                            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Latest</p>
                            <p className="mt-2 text-lg font-semibold tabular-nums text-zinc-900 dark:text-white">
                                {latestExamDate
                                    ? new Date(latestExamDate).toLocaleDateString('en-SE', { year: 'numeric', month: 'short' })
                                    : 'None'}
                            </p>
                        </motion.div>
                    </motion.section>

                    {/* How courses work info box */}
                    <section className="flex gap-4 rounded-[24px] border border-blue-200 bg-blue-50/80 p-5 shadow-[0_18px_60px_-44px_rgba(36, 113, 142,0.4)] dark:border-blue-800 dark:bg-blue-950/20">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm dark:bg-blue-950 dark:text-blue-300">
                            <BookOpen className="h-5 w-5" />
                        </div>
                        <div className="space-y-1 text-sm text-blue-950 dark:text-blue-200">
                            <p className="font-semibold">How courses work</p>
                            <p className="text-pretty leading-6">
                                A course is created automatically the first time you upload an exam for it. Students can browse courses that appear in this list; courses without exams stay hidden from the student interface.
                            </p>
                            <p>
                                To add questions for a course, go to{' '}
                                <Link href="/admin/questions" className={`font-medium underline underline-offset-4 ${UI_TRANSITION} hover:text-blue-700 dark:hover:text-blue-100`}>Manage Questions</Link>.
                            </p>
                        </div>
                    </section>

                    {/* Course grid */}
                    {loading ? (
                        <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={SMOOTH_TRANSITION}
                            className="rounded-[24px] border border-white/70 bg-white/80 py-16 text-center text-sm text-zinc-500 shadow-[0_18px_60px_-44px_rgba(15,23,42,0.3)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80"
                        >
                            <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin text-blue-600" />
                            Loading courses...
                        </motion.div>
                    ) : courses.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={SMOOTH_TRANSITION}
                            className="rounded-[24px] border border-dashed border-zinc-300 bg-white/90 py-20 text-center shadow-[0_18px_60px_-44px_rgba(15,23,42,0.3)] dark:border-zinc-800 dark:bg-zinc-900/90"
                        >
                            <BookOpen className="mx-auto mb-4 h-12 w-12 text-zinc-300 dark:text-zinc-700" />
                            <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
                            No courses yet
                        </h3>
                        <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
                            Upload an old exam to create your first course.
                        </p>
                        <Link
                            href="/admin/upload-exam"
                            className={`inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 ${PRESSABLE}`}
                        >
                            <Upload className="h-4 w-4" />
                            Upload First Exam
                        </Link>
                    </motion.div>
                ) : filteredCourses.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={SMOOTH_TRANSITION}
                        className="rounded-[24px] border border-dashed border-zinc-300 bg-white/90 py-16 text-center shadow-[0_18px_60px_-44px_rgba(15,23,42,0.3)] dark:border-zinc-800 dark:bg-zinc-900/90"
                    >
                        <Search className="mx-auto mb-4 h-10 w-10 text-zinc-300 dark:text-zinc-700" />
                        <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
                            No matching courses
                        </h3>
                        <p className="mx-auto mb-6 max-w-sm text-pretty text-sm text-zinc-500 dark:text-zinc-400">
                            No course code or name matches “{searchTerm}”.
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setSearchTerm('');
                                searchInputRef.current?.focus();
                            }}
                            className={`inline-flex h-11 items-center rounded-2xl border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 ${PRESSABLE}`}
                        >
                            Clear search
                        </button>
                    </motion.div>
                ) : (
                    <motion.div layout className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" transition={SMOOTH_TRANSITION}>
                        <AnimatePresence initial={false}>
                        {filteredCourses.map(course => (
                            <motion.div
                                key={course.courseCode}
                                layout
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                transition={SMOOTH_TRANSITION}
                                className={`rounded-[24px] border border-white/70 bg-white/92 p-5 shadow-[0_20px_70px_-46px_rgba(15,23,42,0.35)] backdrop-blur hover:border-blue-300 hover:shadow-[0_24px_80px_-48px_rgba(36, 113, 142,0.45)] dark:border-zinc-800 dark:bg-zinc-900/92 dark:hover:border-blue-700 ${UI_TRANSITION}`}
                            >
                                {/* Course title */}
                                <div className="mb-5 flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="font-mono text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                                            {course.courseCode}
                                        </div>
                                        <div className="mt-1 line-clamp-2 text-pretty text-sm leading-5 text-zinc-600 dark:text-zinc-400">
                                            {course.courseName}
                                        </div>
                                    </div>
                                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                        <BookOpen className="h-5 w-5" />
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="mb-4 grid grid-cols-2 gap-3">
                                    <div className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
                                        <div className="mb-1 flex items-center gap-1.5">
                                            <FileText className="h-3.5 w-3.5 text-zinc-500" />
                                            <span className="text-xs text-zinc-500 uppercase tracking-wide">Exams</span>
                                        </div>
                                        <div className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-white">
                                            {course.examCount}
                                        </div>
                                    </div>
                                    <div className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
                                        <div className="mb-1 flex items-center gap-1.5">
                                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                            <span className="text-xs text-zinc-500 uppercase tracking-wide">Solutions</span>
                                        </div>
                                        <div className="text-2xl font-bold tabular-nums text-green-600 dark:text-green-400">
                                            {course.withSolutions}
                                        </div>
                                    </div>
                                </div>

                                {/* Latest exam date */}
                                {course.latestExamDate && (
                                    <div className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
                                        Latest exam:{' '}
                                        <span className="font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
                                            {new Date(course.latestExamDate).toLocaleDateString('en-SE', {
                                                year: 'numeric',
                                                month: 'short',
                                            })}
                                        </span>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                                    <Link
                                        href={`/admin/courses/${course.id ?? ''}/topics`}
                                        className={`flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-3 text-xs font-medium text-white hover:bg-purple-700 ${PRESSABLE}`}
                                        title="Manage topics for this course"
                                    >
                                        <Layers className="h-3.5 w-3.5" />
                                        Topics
                                    </Link>
                                    <Link
                                        href={`/admin/questions?course=${course.id ?? ''}`}
                                        className={`flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-700 ${PRESSABLE}`}
                                    >
                                        <HelpCircle className="h-3.5 w-3.5" />
                                        Questions
                                    </Link>
                                    <Link
                                        href={`/archive/${course.courseCode}`}
                                        target="_blank"
                                        className={`${ICON_BUTTON} border border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800`}
                                        title="View student archive page"
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </Link>
                                    <Link
                                        href={`/admin/exams?course=${course.courseCode}`}
                                        className={`${ICON_BUTTON} border border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800`}
                                        title="View exams for this course"
                                    >
                                        <FileText className="h-3.5 w-3.5" />
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteCourse(course)}
                                        disabled={!course.id || deletingCourseId === course.id}
                                        className={`${ICON_BUTTON} border border-red-200 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50`}
                                        title="Remove course"
                                    >
                                        {deletingCourseId === course.id ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* Footer count */}
                {!loading && courses.length > 0 && (
                    <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                        <span className="tabular-nums">{filteredCourses.length}</span> course{filteredCourses.length !== 1 ? 's' : ''} shown
                    </p>
                )}
                </div>
            </div>
        </AdminLayout>
    );
}
