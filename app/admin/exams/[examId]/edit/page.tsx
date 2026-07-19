'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Upload, FileText, Calendar, Tag, CheckCircle, AlertCircle, Loader2, Save, X, Trash2, ExternalLink } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';
import { upload } from '@vercel/blob/client';

const MAX_PDF_BYTES = 50 * 1024 * 1024;

export default function EditExamPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { examId } = useParams();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        courseCode: '',
        courseName: '',
        examDate: '',
        examType: 'TEN1',
        hasSolution: false,
    });
    const [examFile, setExamFile] = useState<File | null>(null);
    const [solutionFile, setSolutionFile] = useState<File | null>(null);
    const [removeSolution, setRemoveSolution] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Authentication check
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login?callbackUrl=/admin/exams');
        } else if (status === 'authenticated') {
            fetchExamData();
        }
    }, [status, router, examId]);

    const fetchExamData = async () => {
        try {
            const response = await fetch(`/api/admin/exams/${examId}`);
            if (response.ok) {
                const data = await response.json();
                const exam = data.exam;
                setFormData({
                    courseCode: exam.courseCode,
                    courseName: exam.courseName,
                    examDate: new Date(exam.examDate).toISOString().split('T')[0],
                    examType: exam.examType,
                    hasSolution: exam.hasSolution,
                });
            } else {
                setMessage({ type: 'error', text: 'Failed to load exam details' });
            }
        } catch (error) {
            console.error('Error fetching exam:', error);
            setMessage({ type: 'error', text: 'An error occurred fetching exam details' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to permanently delete this exam? This action cannot be undone.')) return;

        try {
            const response = await fetch(`/api/admin/exams/${examId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                router.push('/admin/exams');
            } else {
                setMessage({ type: 'error', text: 'Failed to delete exam' });
            }
        } catch (error) {
            console.error('Delete error:', error);
            setMessage({ type: 'error', text: 'An error occurred during deletion' });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);

        try {
            const id = Array.isArray(examId) ? examId[0] : examId;
            if (!id) throw new Error('Invalid exam identifier');
            const uploadPdf = async (file: File, kind: 'exam' | 'solution') => {
                if (file.type !== 'application/pdf') throw new Error('Only PDF files can be uploaded');
                if (file.size <= 0 || file.size > MAX_PDF_BYTES) throw new Error('PDF files must be 50MB or smaller');
                const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100);
                return upload(`exams/${id}/${kind}-${safeName}`, file, {
                    access: 'private',
                    contentType: 'application/pdf',
                    handleUploadUrl: '/api/admin/exams/blob-upload',
                    clientPayload: JSON.stringify({ examId: id, kind }),
                    multipart: file.size >= 5 * 1024 * 1024,
                });
            };

            const [uploadedExam, uploadedSolution] = await Promise.all([
                examFile ? uploadPdf(examFile, 'exam') : null,
                solutionFile && !removeSolution ? uploadPdf(solutionFile, 'solution') : null,
            ]);

            const response = await fetch(`/api/admin/exams/${examId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseCode: formData.courseCode.toUpperCase(),
                    courseName: formData.courseName,
                    examDate: formData.examDate,
                    examType: formData.examType,
                    removeSolution,
                    ...(uploadedExam ? { examBlobUrl: uploadedExam.url } : {}),
                    ...(uploadedSolution ? { solutionBlobUrl: uploadedSolution.url } : {}),
                }),
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Exam updated successfully!' });
                // Refresh data to reflect changes (e.g. cleared files)
                fetchExamData();
                setExamFile(null);
                setSolutionFile(null);
                setRemoveSolution(false);
            } else {
                const data = await response.json();
                setMessage({ type: 'error', text: data.detail || data.error || 'Update failed' });
            }
        } catch (error) {
            console.error('Update error:', error);
            setMessage({ type: 'error', text: error instanceof Error ? error.message : 'An error occurred during update' });
        } finally {
            setSubmitting(false);
        }
    };

    const examTypes = [
        { value: 'TEN1', label: 'TEN1 - Written Exam' },
        { value: 'TEN2', label: 'TEN2 - Written Exam 2' },
        { value: 'KON', label: 'KON - Construction Exam' },
        { value: 'LAB', label: 'LAB - Laboratory Exam' },
        { value: 'MUN', label: 'MUN - Oral Exam' },
        { value: 'UPG', label: 'UPG - Assignment' },
        { value: 'OMTENTA', label: 'OMTENTA - Retake' },
    ];

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="p-8 max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                            Edit Exam
                        </h1>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Update exam details or manage files
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <a
                            href={`/archive/${formData.courseCode}/${examId}`}
                            target="_blank"
                            className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
                        >
                            <ExternalLink size={18} />
                            View Exam
                        </a>
                        <Link
                            href="/admin/exams"
                            className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
                        >
                            <X size={18} />
                            Cancel
                        </Link>
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                        >
                            <Trash2 size={18} />
                            Delete Exam
                        </button>
                    </div>
                </div>

                {/* Edit Form */}
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Course Information Card */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                            <Tag size={18} className="text-blue-600" />
                            Course Information
                        </h2>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Course Code */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    Course Code *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.courseCode}
                                    onChange={(e) => setFormData({ ...formData, courseCode: e.target.value.toUpperCase() })}
                                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-zinc-900 dark:text-white font-mono uppercase"
                                />
                            </div>

                            {/* Course Name */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    Course Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.courseName}
                                    onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-zinc-900 dark:text-white"
                                />
                            </div>

                            {/* Exam Date */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    <Calendar size={14} />
                                    Exam Date *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.examDate}
                                    onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-zinc-900 dark:text-white"
                                />
                            </div>

                            {/* Exam Type */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    Exam Type *
                                </label>
                                <select
                                    value={formData.examType}
                                    onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-zinc-900 dark:text-white"
                                >
                                    {examTypes.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* File Management Card */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                            <Upload size={18} className="text-blue-600" />
                            File Management
                        </h2>

                        <div className="grid grid-cols-2 gap-6">
                            {/* Exam PDF Replacement */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    <FileText size={14} className="text-red-500" />
                                    Replace Exam PDF
                                </label>
                                <div className="text-xs text-zinc-500 mb-2">Current file exists. Upload new to replace.</div>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={(e) => setExamFile(e.target.files?.[0] || null)}
                                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-zinc-200 dark:file:bg-zinc-700 file:text-zinc-700 dark:file:text-zinc-300 hover:file:bg-zinc-300 dark:hover:file:bg-zinc-600 file:cursor-pointer"
                                    />
                                </div>
                                {examFile && (
                                    <p className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                                        <CheckCircle size={14} />
                                        Selected: {examFile.name}
                                    </p>
                                )}
                            </div>

                            {/* Solution PDF Management */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                        <FileText size={14} className="text-green-500" />
                                        Solution PDF
                                    </label>
                                    {formData.hasSolution && (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="removeSolution"
                                                checked={removeSolution}
                                                onChange={(e) => setRemoveSolution(e.target.checked)}
                                                className="w-4 h-4 rounded border-zinc-300 text-red-600 focus:ring-red-500"
                                            />
                                            <label htmlFor="removeSolution" className="text-xs text-red-600 cursor-pointer font-medium">
                                                Remove Solution
                                            </label>
                                        </div>
                                    )}
                                </div>

                                <div className={`relative transition-opacity ${removeSolution ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <div className="text-xs text-zinc-500 mb-2">
                                        {formData.hasSolution ? 'Current solution exists. Upload new to replace.' : 'No solution currently. Upload to add.'}
                                    </div>
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={(e) => setSolutionFile(e.target.files?.[0] || null)}
                                        disabled={removeSolution}
                                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-zinc-200 dark:file:bg-zinc-700 file:text-zinc-700 dark:file:text-zinc-300 hover:file:bg-zinc-300 dark:hover:file:bg-zinc-600 file:cursor-pointer disabled:cursor-not-allowed"
                                    />
                                </div>
                                {solutionFile && !removeSolution && (
                                    <p className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                                        <CheckCircle size={14} />
                                        Selected: {solutionFile.name}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Message */}
                    {message && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success'
                            ? 'bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400'
                            : 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400'
                            }`}>
                            {message.type === 'success' ? (
                                <CheckCircle size={20} />
                            ) : (
                                <AlertCircle size={20} />
                            )}
                            {message.text}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Saving Changes...
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                Save Changes
                            </>
                        )}
                    </button>
                </form>
            </div>
        </AdminLayout>
    );
}
