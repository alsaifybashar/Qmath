import { db } from '@/db/drizzle';
import { exams } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle, Calendar } from 'lucide-react';
import { formatFileSize } from '@/lib/exam-storage';

interface PageProps {
    params: Promise<{ courseCode: string }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { courseCode } = await params;
    const code = courseCode.toUpperCase();

    return {
        title: `${code} Tentor | Qmath Arkiv`,
        description: `Bläddra och ladda ner gamla tentor för ${code}`,
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
        <div className="liquid-page">
            <div className="liquid-bg" />
            <div className="liquid-sheen" />
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-black/10 bg-white/55 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04]">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/archive"
                            className="liquid-muted flex items-center gap-2 hover:text-blue-700 dark:hover:text-blue-200 transition-colors"
                        >
                            <ArrowLeft size={18} />
                            <span className="text-sm font-medium">Tillbaka till sök</span>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-6xl mx-auto px-6 py-10">
                {/* Course Header */}
                <div className="liquid-card mb-8 p-5 sm:p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 bg-blue-400/10 text-blue-700 dark:text-blue-100 font-mono font-bold rounded-lg text-sm border border-blue-300/20">
                            {code}
                        </span>
                    </div>
                    <h1 className="text-4xl font-bold mb-4">
                        {courseName}
                    </h1>

                    {/* Stats */}
                    <div className="flex items-center gap-6 text-sm">
                        <div className="liquid-muted flex items-center gap-2">
                            <FileText size={16} />
                            <span><strong>{stats.total}</strong> tentor</span>
                        </div>
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <CheckCircle size={16} />
                            <span><strong>{stats.withSolution}</strong> med lösningar</span>
                        </div>
                    </div>
                </div>

                {/* Exams List by Year */}
                <div className="space-y-8">
                    {years.map(year => (
                        <section key={year}>
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Calendar size={18} />
                                {year}
                            </h2>

                            <div className="grid gap-3">
                                {examsByYear[year].map(exam => (
                                    <Link
                                        key={exam.id}
                                        href={`/archive/${code}/${exam.id}`}
                                        className="liquid-card group flex items-center justify-between p-5 transition-all duration-200 hover:-translate-y-0.5"
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* File icon */}
                                            <div className="w-12 h-12 bg-rose-400/10 rounded-lg flex items-center justify-center">
                                                <FileText className="text-red-500" size={24} />
                                            </div>

                                            <div>
                                                <div className="font-semibold group-hover:text-blue-700 dark:group-hover:text-blue-200 transition-colors">
                                                    {exam.examType} - {new Date(exam.examDate).toLocaleDateString('sv-SE')}
                                                </div>
                                                <div className="liquid-muted text-sm mt-0.5">
                                                    {exam.fileSize ? formatFileSize(exam.fileSize) : 'PDF'}
                                                    {exam.hasSolution && (
                                                        <span className="ml-3 inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                                                            <CheckCircle size={12} />
                                                            Lösning tillgänglig
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                                Se tenta →
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
