'use client';

import { Download, CheckCircle } from 'lucide-react';

interface ExamResult {
    id: string;
    courseCode: string;
    courseName: string;
    examDate: Date;
    examType: string;
    fileName: string;
    fileSize: number;
    hasSolution: boolean;
}

interface ExamResultsTableProps {
    results: ExamResult[];
    onDownloadClick: (examId: string) => void;
}

export default function ExamResultsTable({ results, onDownloadClick }: ExamResultsTableProps) {
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                        <tr>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-900 dark:text-white">
                                Exam
                            </th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-900 dark:text-white">
                                Date
                            </th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-900 dark:text-white">
                                Type
                            </th>
                            <th className="text-center px-6 py-4 text-sm font-semibold text-zinc-900 dark:text-white">
                                Solution
                            </th>
                            <th className="text-center px-6 py-4 text-sm font-semibold text-zinc-900 dark:text-white">
                                Download
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {results.map((exam) => (
                            <tr
                                key={exam.id}
                                className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                            >
                                <td className="px-6 py-4">
                                    <div>
                                        <div className="font-semibold text-zinc-900 dark:text-white">
                                            {exam.courseCode}
                                        </div>
                                        <div className="text-sm text-zinc-600 dark:text-zinc-400">
                                            {exam.courseName}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                                    {formatDate(exam.examDate)}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                        {exam.examType}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {exam.hasSolution ? (
                                        <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                                    ) : (
                                        <span className="text-zinc-400">—</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button
                                        onClick={() => onDownloadClick(exam.id)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-zinc-200 dark:divide-zinc-800">
                {results.map((exam) => (
                    <div key={exam.id} className="p-5">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <div className="font-semibold text-lg text-zinc-900 dark:text-white">
                                    {exam.courseCode}
                                </div>
                                <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                                    {exam.courseName}
                                </div>
                            </div>
                            {exam.hasSolution && (
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                            )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                            <span>{formatDate(exam.examDate)}</span>
                            <span>•</span>
                            <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium">
                                {exam.examType}
                            </span>
                        </div>

                        <button
                            onClick={() => onDownloadClick(exam.id)}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Download PDF
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
