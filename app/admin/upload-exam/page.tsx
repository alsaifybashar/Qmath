'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, Calendar, Tag, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

export default function AdminUploadExamPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [formData, setFormData] = useState({
        courseCode: '',
        courseName: '',
        examYear: new Date().getFullYear().toString(),
        examMonth: (new Date().getMonth() + 1).toString(),
        examDay: new Date().getDate().toString(),
        examType: 'TEN1',
    });
    const [examFile, setExamFile] = useState<File | null>(null);
    const [solutionFile, setSolutionFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Redirect if not authenticated
    if (status === 'loading') {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </AdminLayout>
        );
    }

    if (status === 'unauthenticated') {
        router.push('/login?callbackUrl=/admin/upload-exam');
        return null;
    }

    const handleExamFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setExamFile(selectedFile);
            setMessage(null);
        } else if (selectedFile) {
            setMessage({ type: 'error', text: 'Please select a PDF file for the exam' });
        }
    };

    const handleSolutionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setSolutionFile(selectedFile);
            setMessage(null);
        } else if (selectedFile) {
            setMessage({ type: 'error', text: 'Please select a PDF file for the solution' });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!examFile) {
            setMessage({ type: 'error', text: 'Please select an exam PDF file' });
            return;
        }

        setIsUploading(true);
        setMessage(null);

        try {
            const formPayload = new FormData();
            formPayload.append('courseCode', formData.courseCode.toUpperCase());
            formPayload.append('courseName', formData.courseName);

            // Format date as YYYY-MM-DD
            const formattedDate = `${formData.examYear}-${formData.examMonth.padStart(2, '0')}-${formData.examDay.padStart(2, '0')}`;
            formPayload.append('examDate', formattedDate);

            formPayload.append('examType', formData.examType);
            formPayload.append('examFile', examFile);

            if (solutionFile) {
                formPayload.append('solutionFile', solutionFile);
            }

            const response = await fetch('/api/admin/upload-exam', {
                method: 'POST',
                body: formPayload,
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'Exam uploaded successfully!' });
                // Reset form
                setFormData({
                    courseCode: '',
                    courseName: '',
                    examYear: new Date().getFullYear().toString(),
                    examMonth: (new Date().getMonth() + 1).toString(),
                    examDay: new Date().getDate().toString(),
                    examType: 'TEN1',
                });
                setExamFile(null);
                setSolutionFile(null);
                // Reset file inputs
                const examInput = document.getElementById('exam-file') as HTMLInputElement;
                const solutionInput = document.getElementById('solution-file') as HTMLInputElement;
                if (examInput) examInput.value = '';
                if (solutionInput) solutionInput.value = '';
            } else {
                setMessage({ type: 'error', text: data.error || 'Upload failed' });
            }
        } catch (error) {
            console.error('Upload error:', error);
            setMessage({ type: 'error', text: 'An error occurred during upload' });
        } finally {
            setIsUploading(false);
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

    return (
        <AdminLayout>
            <div className="p-8 max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                        Upload Exam
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Add a new exam and optional solution to the archive
                    </p>
                </div>

                {/* Upload Form */}
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
                                    placeholder="e.g., TATA24"
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
                                    placeholder="e.g., Linjär Algebra"
                                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-zinc-900 dark:text-white"
                                />
                            </div>

                            {/* Exam Date */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    <Calendar size={14} />
                                    Exam Date (Year / Month / Day) *
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <input
                                        type="number"
                                        placeholder="YYYY"
                                        required
                                        min="1990"
                                        max="2100"
                                        value={formData.examYear}
                                        onChange={(e) => setFormData({ ...formData, examYear: e.target.value })}
                                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-zinc-900 dark:text-white"
                                    />
                                    <select
                                        required
                                        value={formData.examMonth}
                                        onChange={(e) => setFormData({ ...formData, examMonth: e.target.value })}
                                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-zinc-900 dark:text-white"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                            <option key={m} value={m}>
                                                {new Date(0, m - 1).toLocaleString('default', { month: 'short' })}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        placeholder="DD"
                                        required
                                        min="1"
                                        max="31"
                                        value={formData.examDay}
                                        onChange={(e) => setFormData({ ...formData, examDay: e.target.value })}
                                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-zinc-900 dark:text-white"
                                    />
                                </div>
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

                    {/* File Uploads Card */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                            <Upload size={18} className="text-blue-600" />
                            Files
                        </h2>

                        <div className="grid grid-cols-2 gap-6">
                            {/* Exam PDF */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    <FileText size={14} className="text-red-500" />
                                    Exam PDF *
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="exam-file"
                                        accept="application/pdf"
                                        onChange={handleExamFileChange}
                                        required
                                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-zinc-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-500 file:cursor-pointer"
                                    />
                                </div>
                                {examFile && (
                                    <p className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                                        <CheckCircle size={14} />
                                        {examFile.name} ({(examFile.size / 1024 / 1024).toFixed(2)} MB)
                                    </p>
                                )}
                            </div>

                            {/* Solution PDF */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    <FileText size={14} className="text-green-500" />
                                    Solution PDF (Optional)
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="solution-file"
                                        accept="application/pdf"
                                        onChange={handleSolutionFileChange}
                                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-zinc-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-500 file:cursor-pointer"
                                    />
                                </div>
                                {solutionFile && (
                                    <p className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                                        <CheckCircle size={14} />
                                        {solutionFile.name} ({(solutionFile.size / 1024 / 1024).toFixed(2)} MB)
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
                        disabled={isUploading || !examFile}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload size={20} />
                                Upload Exam
                            </>
                        )}
                    </button>
                </form>
            </div>
        </AdminLayout>
    );
}
