'use client';

import { useState } from 'react';
import { Upload, CheckCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import LoginPromptModal from '@/components/LoginPromptModal';

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

export default function ArchivePage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<ExamResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!searchQuery.trim()) return;

        setIsLoading(true);
        setHasSearched(true);

        try {
            const response = await fetch(`/api/exams/search?q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();

            if (response.ok) {
                setResults(data.results || []);
            } else {
                console.error('Search failed:', data.error);
                setResults([]);
            }
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadClick = async (examId: string) => {
        try {
            const response = await fetch(`/api/exams/download/${examId}`);

            if (response.status === 401) {
                setShowLoginModal(true);
                return;
            }

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `exam-${examId}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Download error:', error);
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // Get course info from first result
    const courseInfo = results.length > 0 ? {
        code: results[0].courseCode,
        name: results[0].courseName
    } : null;

    // Get stats
    const stats = {
        total: results.length,
        withSolution: results.filter(r => r.hasSolution).length
    };

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950">
            {/* Main Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Homepage State - Before Search */}
                {!hasSearched && (
                    <div className="flex flex-col items-center justify-center min-h-[80vh]">
                        {/* Logo */}
                        <div className="text-center mb-12">
                            <Link href="/" className="inline-block">
                                <h1 className="text-5xl font-serif font-bold text-zinc-900 dark:text-white mb-2">
                                    Qmath <span className="text-blue-600">Exams</span>
                                </h1>
                            </Link>
                            <p className="text-zinc-600 dark:text-zinc-400 mt-2">
                                Search for old exams from your university
                            </p>
                        </div>

                        {/* Centered Search */}
                        <div className="w-full max-w-2xl">
                            <form onSubmit={handleSearch}>
                                <div className="relative flex items-center gap-3 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-full px-6 py-4 hover:border-blue-600 dark:hover:border-blue-600 focus-within:border-blue-600 dark:focus-within:border-blue-600 transition-colors shadow-sm">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search course code (e.g., SF1672)"
                                        className="flex-1 bg-transparent border-0 outline-none text-lg text-zinc-900 dark:text-white placeholder:text-zinc-400"
                                        autoFocus
                                    />
                                    <button
                                        type="submit"
                                        disabled={isLoading || !searchQuery.trim()}
                                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Searching...' : 'Search'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Upload Link */}
                        <Link
                            href="/admin/upload-exam"
                            className="mt-8 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                            <Upload className="w-4 h-4" />
                            Upload exam or solution
                        </Link>
                    </div>
                )}

                {/* Results State - After Search */}
                {hasSearched && (
                    <div className="py-8">
                        {/* Breadcrumb */}
                        <div className="mb-4">
                            <button
                                onClick={() => {
                                    setHasSearched(false);
                                    setResults([]);
                                    setSearchQuery('');
                                }}
                                className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400"
                            >
                                ← Back to search
                            </button>
                        </div>

                        {results.length > 0 ? (
                            <>
                                {/* Course Header */}
                                <div className="mb-6">
                                    <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                                        {courseInfo?.code} / Exams
                                    </div>
                                    <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4">
                                        {courseInfo?.name}
                                    </h1>

                                    {/* Stats Bar */}
                                    <div className="flex items-center gap-6 text-sm text-zinc-600 dark:text-zinc-400">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            <span>{stats.withSolution} with solution</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span>{stats.total} exams</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                                                <tr>
                                                    <th className="text-left px-6 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                                        Exam
                                                    </th>
                                                    <th className="text-left px-6 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                                        Written
                                                    </th>
                                                    <th className="text-center px-6 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                                        Has Solution
                                                    </th>
                                                    <th className="text-center px-6 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                                        Actions
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
                                                            <div className="font-medium text-zinc-900 dark:text-white">
                                                                {exam.examType.toUpperCase()} {new Date(exam.examDate).toLocaleDateString('sv-SE')}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                                                            {formatDate(exam.examDate)}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            {exam.hasSolution ? (
                                                                <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                                                            ) : (
                                                                <span className="text-zinc-400">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                    onClick={() => handleDownloadClick(exam.id)}
                                                                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                                                    title="Download PDF"
                                                                >
                                                                    <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                                                    title="Open in new tab"
                                                                >
                                                                    <ExternalLink className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-20">
                                <p className="text-xl text-zinc-600 dark:text-zinc-400">
                                    No exams found for &quot;{searchQuery.toUpperCase()}&quot;
                                </p>
                                <p className="text-sm text-zinc-500 mt-2">
                                    Try a different course code
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Login Modal */}
            {showLoginModal && (
                <LoginPromptModal onClose={() => setShowLoginModal(false)} />
            )}
        </div>
    );
}
