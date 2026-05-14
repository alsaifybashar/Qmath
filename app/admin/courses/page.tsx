'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
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

export default function AdminCoursesPage() {
    const { data: session } = useSession();
    const [courses, setCourses] = useState<AdminCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);

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

    return (
        <AdminLayout>
            <div className="p-8 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                            Available Courses
                        </h1>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            These courses exist because old exams have been uploaded for them.
                            A course only appears here when it has at least one exam.
                        </p>
                    </div>
                    <Link
                        href="/admin/upload-exam"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                    >
                        <Upload className="w-4 h-4" />
                        Upload Exam
                    </Link>
                </div>

                {/* How courses work info box */}
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-5 mb-8 flex gap-4">
                    <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900 dark:text-blue-200 space-y-1">
                        <p className="font-semibold">How courses work</p>
                        <p>
                            A course is created automatically the first time you upload an exam for it.
                            Students can browse and select any course that appears in this list.
                            If a course has no exams it does not appear anywhere in the student interface.
                        </p>
                        <p>
                            To add questions for a course, go to{' '}
                            <Link href="/admin/questions" className="underline font-medium">Manage Questions</Link>.
                        </p>
                    </div>
                </div>

                {/* Course grid */}
                {loading ? (
                    <div className="text-center py-16 text-zinc-500">Loading courses…</div>
                ) : courses.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <BookOpen className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                            No courses yet
                        </h3>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">
                            Upload an old exam to create your first course.
                        </p>
                        <Link
                            href="/admin/upload-exam"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                        >
                            <Upload className="w-4 h-4" />
                            Upload First Exam
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {courses.map(course => (
                            <div
                                key={course.courseCode}
                                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                            >
                                {/* Course title */}
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="font-mono font-bold text-xl text-zinc-900 dark:text-white">
                                            {course.courseCode}
                                        </div>
                                        <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
                                            {course.courseName}
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <FileText className="w-3.5 h-3.5 text-zinc-500" />
                                            <span className="text-xs text-zinc-500 uppercase tracking-wide">Exams</span>
                                        </div>
                                        <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                                            {course.examCount}
                                        </div>
                                    </div>
                                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                            <span className="text-xs text-zinc-500 uppercase tracking-wide">Solutions</span>
                                        </div>
                                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                            {course.withSolutions}
                                        </div>
                                    </div>
                                </div>

                                {/* Latest exam date */}
                                {course.latestExamDate && (
                                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                                        Latest exam:{' '}
                                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                            {new Date(course.latestExamDate).toLocaleDateString('en-SE', {
                                                year: 'numeric',
                                                month: 'short',
                                            })}
                                        </span>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                    <Link
                                        href={`/admin/courses/${course.id ?? ''}/topics`}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition-colors"
                                        title="Manage topics for this course"
                                    >
                                        <Layers className="w-3.5 h-3.5" />
                                        Topics
                                    </Link>
                                    <Link
                                        href={`/admin/questions?course=${course.id ?? ''}`}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
                                    >
                                        <HelpCircle className="w-3.5 h-3.5" />
                                        Questions
                                    </Link>
                                    <Link
                                        href={`/archive/${course.courseCode}`}
                                        target="_blank"
                                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 text-xs font-medium transition-colors"
                                        title="View student archive page"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </Link>
                                    <Link
                                        href={`/admin/exams?course=${course.courseCode}`}
                                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 text-xs font-medium transition-colors"
                                        title="View exams for this course"
                                    >
                                        <FileText className="w-3.5 h-3.5" />
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteCourse(course)}
                                        disabled={!course.id || deletingCourseId === course.id}
                                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 text-xs font-medium transition-colors"
                                        title="Remove course"
                                    >
                                        {deletingCourseId === course.id ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-3.5 h-3.5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer count */}
                {!loading && courses.length > 0 && (
                    <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-6">
                        {courses.length} course{courses.length !== 1 ? 's' : ''} with old exams
                    </p>
                )}
            </div>
        </AdminLayout>
    );
}
