import { getUserCoursesForAnalysis } from '@/app/actions/exam-analysis';
import Link from 'next/link';
import { BookOpen, ChevronRight, GraduationCap } from 'lucide-react';

export default async function CoursesPage() {
    const courses = await getUserCoursesForAnalysis();

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-10">
                <h1 className="text-4xl font-bold mb-2">My Courses</h1>
                <p className="text-zinc-500 dark:text-zinc-400">Manage your courses and view performance analysis</p>
            </div>

            {/* Courses Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                    <Link
                        key={course.id}
                        href={`/courses/${course.code}`}
                        className="group block bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg transition-all"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                                        {course.code}
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {course.name}
                                </h3>
                            </div>
                            <div className="p-2 rounded-full bg-zinc-50 dark:bg-zinc-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/50 transition-colors">
                                <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-blue-500" />
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                            <GraduationCap className="w-4 h-4" />
                            <span>Get Analysis & Plan</span>
                        </div>
                    </Link>
                ))}

                {courses.length === 0 && (
                    <div className="col-span-full border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center">
                        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-8 h-8 text-zinc-400" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">No active courses</h3>
                        <p className="text-zinc-500 mb-6">Enrolled courses will appear here.</p>
                        <Link href="/onboarding" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition">
                            Browse Courses
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
