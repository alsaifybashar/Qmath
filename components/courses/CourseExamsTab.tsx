'use client';

import Link from 'next/link';
import { FileText, CheckCircle, Calendar, ArrowRight, BookOpen } from 'lucide-react';
import type { CourseExam } from '@/app/actions/course-exams';

interface CourseExamsTabProps {
    exams: CourseExam[];
    courseCode: string;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export default function CourseExamsTab({ exams, courseCode }: CourseExamsTabProps) {
    // Empty state
    if (exams.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                    <BookOpen className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="text-base font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Inga gamla tentor hittades
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-500">
                    Tentor för {courseCode} har inte laddats upp ännu.
                </p>
            </div>
        );
    }

    // Stats
    const totalWithSolution = exams.filter((e) => e.hasSolution).length;

    // Group by year (already sorted descending by date)
    const examsByYear = exams.reduce<Record<number, CourseExam[]>>((acc, exam) => {
        const year = new Date(exam.examDate).getFullYear();
        if (!acc[year]) acc[year] = [];
        acc[year].push(exam);
        return acc;
    }, {});
    const years = Object.keys(examsByYear).map(Number).sort((a, b) => b - a);

    return (
        <div className="space-y-6">
            {/* Stats bar */}
            <div className="flex items-center gap-6 px-5 py-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span>
                        <span className="font-semibold text-zinc-900 dark:text-white">{exams.length}</span>{' '}
                        {exams.length === 1 ? 'tenta' : 'tentor'}
                    </span>
                </div>
                {totalWithSolution > 0 && (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span>
                            <span className="font-semibold">{totalWithSolution}</span> med lösning
                        </span>
                    </div>
                )}
                <div className="ml-auto text-xs text-zinc-400 dark:text-zinc-600">
                    Visar {years[0]}–{years[years.length - 1]}
                </div>
            </div>

            {/* Exam list grouped by year */}
            {years.map((year) => (
                <section key={year}>
                    {/* Year header */}
                    <div className="flex items-center gap-2 mb-3 px-1">
                        <Calendar className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                            {year}
                        </h2>
                        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800 ml-1" />
                    </div>

                    {/* Rows */}
                    <div className="flex flex-col gap-2">
                        {examsByYear[year].map((exam) => (
                            <Link
                                key={exam.id}
                                href={`/archive/${courseCode}/${exam.id}`}
                                className="group flex items-center justify-between px-5 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md hover:shadow-blue-500/5 transition-all duration-200"
                            >
                                {/* Left: icon + info */}
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="shrink-0 w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-red-500 dark:text-red-400" />
                                    </div>

                                    <div className="min-w-0">
                                        {/* Title row */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {exam.examType}
                                            </span>
                                            <span className="text-zinc-400 dark:text-zinc-600">·</span>
                                            <span className="text-sm text-zinc-500 dark:text-zinc-400">
                                                {formatDate(exam.examDate)}
                                            </span>
                                        </div>

                                        {/* Meta row */}
                                        <div className="flex items-center gap-3 mt-0.5">
                                            {exam.fileSize && (
                                                <span className="text-xs text-zinc-400 dark:text-zinc-600">
                                                    {formatFileSize(exam.fileSize)}
                                                </span>
                                            )}
                                            {exam.hasSolution && (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Lösning finns
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: CTA */}
                                <div className="shrink-0 flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span>Öppna</span>
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
