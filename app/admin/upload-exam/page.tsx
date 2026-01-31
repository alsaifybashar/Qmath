'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, Calendar, Tag, CheckSquare } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

export default function AdminUploadExamPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [formData, setFormData] = useState({
        courseCode: '',
        courseName: '',
        examDate: '',
        examType: 'Final',
        hasSolution: false,
    });
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Redirect if not authenticated or not admin
    if (status === 'loading') {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-full">
                    <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
                </div>
            </AdminLayout>
        );
    }

    if (status === 'unauthenticated') {
        router.push('/login?callbackUrl=/admin/upload-exam');
        return null;
    }

    if (session?.user?.role !== 'admin') {
        router.push('/');
        return null;
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setMessage(null);
        } else {
            setMessage({ type: 'error', text: 'Please select a PDF file' });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            setMessage({ type: 'error', text: 'Please select a file to upload' });
            return;
        }

        setIsUploading(true);
        setMessage(null);

        try {
            const formPayload = new FormData();
            formPayload.append('courseCode', formData.courseCode);
            formPayload.append('courseName', formData.courseName);
            formPayload.append('examDate', formData.examDate);
            formPayload.append('examType', formData.examType);
            formPayload.append('hasSolution', String(formData.hasSolution));
            formPayload.append('file', file);

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
                    examDate: '',
                    examType: 'Final',
                    hasSolution: false,
                });
                setFile(null);
                // Reset file input
                const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
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

    return (
        <AdminLayout>
            <div className="p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                        Upload Exam
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Add a new exam to the archive
                    </p>
                </div>

                {/* Upload Form */}
                <div className="max-w-2xl">
                    <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8">
                        <div className="space-y-6">
                            {/* Course Code */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    <Tag className="w-4 h-4" />
                                    Course Code
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.courseCode}
                                    onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                                    placeholder="e.g., SF1672, TATA24"
                                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-zinc-900 dark:text-white transition-all"
                                />
                            </div>

                            {/* Course Name */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    <FileText className="w-4 h-4" />
                                    Course Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.courseName}
                                    onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                                    placeholder="e.g., Linear Algebra"
                                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-zinc-900 dark:text-white transition-all"
                                />
                            </div>

                            {/* Exam Date */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    <Calendar className="w-4 h-4" />
                                    Exam Date
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.examDate}
                                    onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-zinc-900 dark:text-white transition-all"
                                />
                            </div>

                            {/* Exam Type */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    Exam Type
                                </label>
                                <select
                                    value={formData.examType}
                                    onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-zinc-900 dark:text-white transition-all"
                                >
                                    <option value="Final">Final Exam</option>
                                    <option value="Midterm">Midterm Exam</option>
                                    <option value="Retake">Retake Exam</option>
                                </select>
                            </div>

                            {/* Has Solution Checkbox */}
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="hasSolution"
                                    checked={formData.hasSolution}
                                    onChange={(e) => setFormData({ ...formData, hasSolution: e.target.checked })}
                                    className="w-5 h-5 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-2 focus:ring-blue-600"
                                />
                                <label htmlFor="hasSolution" className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                                    <CheckSquare className="w-4 h-4" />
                                    Includes solution
                                </label>
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    <Upload className="w-4 h-4" />
                                    PDF File
                                </label>
                                <input
                                    type="file"
                                    id="file-upload"
                                    accept="application/pdf"
                                    onChange={handleFileChange}
                                    required
                                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-zinc-900 dark:text-white transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 file:cursor-pointer"
                                />
                                {file && (
                                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                                        Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                    </p>
                                )}
                            </div>

                            {/* Message */}
                            {message && (
                                <div className={`p-4 rounded-lg ${message.type === 'success'
                                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                                    }`}>
                                    {message.text}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isUploading}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUploading ? 'Uploading...' : 'Upload Exam'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}

