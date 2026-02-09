import { db } from '@/db/drizzle';
import { exams } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle, Calendar, Download } from 'lucide-react';
import { formatFileSize } from '@/lib/exam-storage';

interface PageProps {
    params: Promise<{ courseCode: string }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { courseCode } = await params;
    const code = courseCode.toUpperCase();

    return {
        title: `${code} Exams | Qmath Archive`,
        description: `Browse and download old exams for ${code}`,
    };
}

export default async function CourseArchivePage({ params }: PageProps) {
    const { courseCode } = await params;
    const code = courseCode.toUpperCase();

    // Fetch all exams for this course
    const courseExams = await db
        .select()
        .from(exams)
        .where(eq(exams.courseCode, code))
        .orderBy(desc(exams.examDate));

    // If no exams found, show not found
    if (courseExams.length === 0) {
        notFound();
    }

    // Get course info from first result
    const courseName = courseExams[0].courseName;
    const stats = {
        total: courseExams.length,
        withSolution: courseExams.filter(e => e.hasSolution).length,
    };

    // Group exams by year
    const examsByYear = courseExams.reduce((acc, exam) => {
        const year = new Date(exam.examDate).getFullYear();
        if (!acc[year]) acc[year] = [];
        acc[year].push(exam);
        return acc;
    }, {} as Record<number, typeof courseExams>);

    const years = Object.keys(examsByYear).map(Number).sort((a, b) => b - a);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-zinc-950 dark:to-zinc-900">
            {/* Header */}
            <header className="border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/archive"
                            className="flex items-center gap-2 text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                            <ArrowLeft size={18} />
                            <span className="text-sm font-medium">Back to Search</span>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-10">
                {/* Course Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-mono font-bold rounded-lg text-sm">
                            {code}
                        </span>
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
                        {courseName}
                    </h1>

                    {/* Stats */}
                    <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400">
                            <FileText size={16} />
                            <span><strong className="text-slate-900 dark:text-white">{stats.total}</strong> exams</span>
                        </div>
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <CheckCircle size={16} />
                            <span><strong>{stats.withSolution}</strong> with solutions</span>
                        </div>
                    </div>
                </div>

                {/* Exams List by Year */}
                <div className="space-y-8">
                    {years.map(year => (
                        <section key={year}>
                            <h2 className="text-lg font-semibold text-slate-700 dark:text-zinc-300 mb-4 flex items-center gap-2">
                                <Calendar size={18} />
                                {year}
                            </h2>

                            <div className="grid gap-3">
                                {examsByYear[year].map(exam => (
                                    <Link
                                        key={exam.id}
                                        href={`/archive/${code}/${exam.id}`}
                                        className="group flex items-center justify-between p-5 bg-white dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-200"
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* File icon */}
                                            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                                                <FileText className="text-red-500" size={24} />
                                            </div>

                                            <div>
                                                <div className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                    {exam.examType} - {new Date(exam.examDate).toLocaleDateString('sv-SE')}
                                                </div>
                                                <div className="text-sm text-slate-500 dark:text-zinc-500 mt-0.5">
                                                    {exam.fileSize ? formatFileSize(exam.fileSize) : 'PDF'}
                                                    {exam.hasSolution && (
                                                        <span className="ml-3 inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                                                            <CheckCircle size={12} />
                                                            Solution available
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                                View exam →
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </main>
        </div>
    );
}
