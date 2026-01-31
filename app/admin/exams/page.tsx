'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import {
    Search,
    Download,
    Edit,
    Trash2,
    FileText,
    Calendar,
    CheckCircle,
    Upload,
    ExternalLink
} from 'lucide-react';

interface ExamData {
    id: string;
    courseCode: string;
    courseName: string;
    examDate: Date;
    examType: string;
    fileName: string;
    fileSize: number;
    hasSolution: boolean;
    downloads?: number;
    createdAt: Date;
}

export default function AdminExamsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [exams, setExams] = useState<ExamData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login?callbackUrl=/admin/exams');
        } else if (session?.user?.role !== 'admin') {
            router.push('/');
        } else {
            setLoading(false);
        }
    }, [session, status, router]);

    const fetchExams = async () => {
        try {
            
        } catch (error) {
            console.error('Failed to fetch exams:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteExam = async (examId: string) => {
        if (!confirm('Are you sure you want to delete this exam? This action cannot be undone.')) return;

        try {
            
                method: 'DELETE',
            });

        } catch (error) {
            console.error('Failed to delete exam:', error);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    if (status === 'loading' || loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-full">
                    <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
                </div>
            </AdminLayout>
        );
    }

    if (!session || session.user.role !== 'admin') {
        return null;
    }

    // Mock data for now
    const mockExams: ExamData[] = [
        {
            id: '1',
            courseCode: 'SF1672',
            courseName: 'Linear Algebra',
            examDate: new Date('2024-01-15'),
            examType: 'Final',
            fileName: '2024-01-15-final.pdf',
            fileSize: 245760,
            hasSolution: true,
            downloads: 234,
            createdAt: new Date('2024-01-16'),
        },
        {
            id: '2',
            courseCode: 'TATA24',
            courseName: 'Linjär algebra',
            examDate: new Date('2024-01-17'),
            examType: 'Final',
            fileName: '2024-01-17-final.pdf',
            fileSize: 312320,
            hasSolution: true,
            downloads: 189,
            createdAt: new Date('2024-01-18'),
        },
    ];

    const displayExams = exams.length > 0 ? exams : mockExams;
    const filteredExams = displayExams.filter(exam =>
        exam.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.courseName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalDownloads = displayExams.reduce((sum, exam) => sum + (exam.downloads || 0), 0);
    const withSolution = displayExams.filter(e => e.hasSolution).length;

    return (
        <AdminLayout>
            <div className="p-8">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                            Exam Management
                        </h1>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Manage exam archive, view statistics, and upload new exams
                        </p>
                    </div>
                    <Link
                        href="/admin/upload-exam"
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                    >
                        <Upload className="w-5 h-5" />
                        Upload Exam
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                        <div className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
                            {displayExams.length}
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">Total Exams</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                        <div className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
                            {withSolution}
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">With Solutions</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                        <div className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
                            {totalDownloads.toLocaleString()}
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">Total Downloads</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                        <div className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
                            {new Set(displayExams.map(e => e.courseCode)).size}
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">Unique Courses</div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search exams by course code or name..."
                            className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-zinc-900 dark:text-white"
                        />
                    </div>
                </div>

                {/* Exams Table */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                                <tr>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                        Course
                                    </th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                        Exam
                                    </th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                        Type
                                    </th>
                                    <th className="text-center px-6 py-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                        Solution
                                    </th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                        Size
                                    </th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                        Downloads
                                    </th>
                                    <th className="text-right px-6 py-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {filteredExams.map((exam) => (
                                    <tr key={exam.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-medium text-zinc-900 dark:text-white">
                                                    {exam.courseCode}
                                                </div>
                                                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                                                    {exam.courseName}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(exam.examDate).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                                                {exam.examType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {exam.hasSolution ? (
                                                <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                                            ) : (
                                                <span className="text-zinc-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                                            {formatFileSize(exam.fileSize)}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-white">
                                            {exam.downloads?.toLocaleString() || '0'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                </button>
                                                <button
                                                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                                    title="Edit Exam"
                                                >
                                                    <Edit className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteExam(exam.id)}
                                                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Delete Exam"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredExams.length === 0 && (
                        <div className="text-center py-12">
                            <FileText className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
                            <p className="text-zinc-600 dark:text-zinc-400">No exams found</p>
                            <Link
                                href="/admin/upload-exam"
                                className="inline-block mt-4 text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                Upload your first exam
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
