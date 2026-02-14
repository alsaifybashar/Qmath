'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, X, CheckCircle, ArrowLeft, AlertCircle, FileType } from 'lucide-react';
import Link from 'next/link';

export default function UploadExamPage() {
    // State for files
    const [examFile, setExamFile] = useState<File | null>(null);
    const [solutionFile, setSolutionFile] = useState<File | null>(null);

    // State for drag interactions
    const [isDraggingExam, setIsDraggingExam] = useState(false);
    const [isDraggingSolution, setIsDraggingSolution] = useState(false);
    const [isGlobalDrag, setIsGlobalDrag] = useState(false);

    // Refs for file inputs
    const examInputRef = useRef<HTMLInputElement>(null);
    const solutionInputRef = useRef<HTMLInputElement>(null);

    // Handle global drag events to show hints
    useEffect(() => {
        let dragCounter = 0;

        const handleWindowDragEnter = (e: DragEvent) => {
            e.preventDefault();
            // Check if dragging a file
            if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
                dragCounter++;
                setIsGlobalDrag(true);
            }
        };

        const handleWindowDragLeave = (e: DragEvent) => {
            e.preventDefault();
            dragCounter--;
            if (dragCounter <= 0) {
                setIsGlobalDrag(false);
                dragCounter = 0;
            }
        };

        const handleWindowDragOver = (e: DragEvent) => {
            e.preventDefault();
        };

        const handleWindowDrop = (e: DragEvent) => {
            e.preventDefault();
            setIsGlobalDrag(false);
            dragCounter = 0;
        };

        window.addEventListener('dragenter', handleWindowDragEnter);
        window.addEventListener('dragleave', handleWindowDragLeave);
        window.addEventListener('dragover', handleWindowDragOver);
        window.addEventListener('drop', handleWindowDrop);

        return () => {
            window.removeEventListener('dragenter', handleWindowDragEnter);
            window.removeEventListener('dragleave', handleWindowDragLeave);
            window.removeEventListener('dragover', handleWindowDragOver);
            window.removeEventListener('drop', handleWindowDrop);
        };
    }, []);

    // Handle file validation (PDF only)
    const validateFile = (file: File) => {
        return file.type === 'application/pdf';
    };

    // Generic drag handlers
    const handleDragOver = (e: React.DragEvent, type: 'exam' | 'solution') => {
        e.preventDefault();
        e.stopPropagation();
        if (type === 'exam') setIsDraggingExam(true);
        else setIsDraggingSolution(true);
    };

    const handleDragLeave = (e: React.DragEvent, type: 'exam' | 'solution') => {
        e.preventDefault();
        e.stopPropagation();
        if (type === 'exam') setIsDraggingExam(false);
        else setIsDraggingSolution(false);
    };

    const handleDrop = (e: React.DragEvent, type: 'exam' | 'solution') => {
        e.preventDefault();
        e.stopPropagation();

        if (type === 'exam') setIsDraggingExam(false);
        else setIsDraggingSolution(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            const file = files[0];
            if (validateFile(file)) {
                if (type === 'exam') setExamFile(file);
                else setSolutionFile(file);
            } else {
                alert('Please upload a PDF file.');
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'exam' | 'solution') => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (validateFile(file)) {
                if (type === 'exam') setExamFile(file);
                else setSolutionFile(file);
            } else {
                alert('Please upload a PDF file.');
            }
        }
    };

    const removeFile = (type: 'exam' | 'solution') => {
        if (type === 'exam') {
            setExamFile(null);
            if (examInputRef.current) examInputRef.current.value = '';
        } else {
            setSolutionFile(null);
            if (solutionInputRef.current) solutionInputRef.current.value = '';
        }
    };

    const handleSubmit = () => {
        console.log('Submitting:', { examFile, solutionFile });
        // Handle upload logic here
        alert('Upload functionality would be implemented here.');
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white transition-colors">
            {/* Background elements similar to other pages */}
            <div className="fixed inset-0 bg-gradient-to-br from-blue-100/50 via-transparent to-purple-100/50 dark:from-blue-900/10 dark:via-black dark:to-purple-900/10"></div>
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
                {/* Top Nav */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <Link href="/" className="font-bold text-xl">Qmath</Link>
                    </div>
                </div>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10 text-center"
                >
                    <h1 className="text-4xl font-bold mb-3">Upload Exam</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">
                        Upload your exam questions and solutions to generate interactive study material.
                    </p>
                </motion.div>

                {/* Main Upload Area */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Exam PDF Drop Zone */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className={`relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden ${isDraggingExam
                            ? 'border-blue-400 bg-[#0F172A] scale-[1.02] shadow-xl'
                            : isGlobalDrag
                                ? 'border-blue-400 bg-[#0F172A] scale-[1.02] shadow-xl'
                                : 'border-zinc-300 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500 bg-white/50 dark:bg-zinc-900/50'
                            }`}
                        onDragOver={(e) => handleDragOver(e, 'exam')}
                        onDragLeave={(e) => handleDragLeave(e, 'exam')}
                        onDrop={(e) => handleDrop(e, 'exam')}
                        onClick={() => !examFile && examInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={examInputRef}
                            className="hidden"
                            accept=".pdf"
                            onChange={(e) => handleFileSelect(e, 'exam')}
                        />

                        <div className="p-8 flex flex-col items-center justify-center min-h-[300px] text-center">
                            {examFile ? (
                                <div className="w-full">
                                    <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4 text-red-500 overflow-hidden relative">
                                        <FileText className="w-8 h-8" />
                                        <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>
                                    </div>
                                    <h3 className="font-bold text-lg mb-1 truncate px-4">{examFile.name}</h3>
                                    <p className="text-zinc-500 text-sm mb-6">{(examFile.size / 1024 / 1024).toFixed(2)} MB • PDF</p>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFile('exam');
                                        }}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                        Remove File
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${(isDraggingExam || isGlobalDrag) ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/10 group-hover:text-blue-500'
                                        }`}>
                                        <UploadCloud className="w-8 h-8" />
                                    </div>
                                    <h3 className={`font-bold text-lg mb-2 transition-colors ${(isDraggingExam || isGlobalDrag) ? 'text-blue-100' : 'text-zinc-700 dark:text-zinc-200 group-hover:text-blue-500'
                                        }`}>
                                        {isDraggingExam || isGlobalDrag ? 'Drop Exam PDF' : 'Upload Exam PDF'}
                                    </h3>
                                    <p className={`text-sm max-w-[200px] transition-colors ${(isDraggingExam || isGlobalDrag) ? 'text-blue-300' : 'text-zinc-500 dark:text-zinc-400'
                                        }`}>
                                        {(isDraggingExam || isGlobalDrag) ? 'Release to upload' : 'Drag and drop your exam questions file here, or click to browse'}
                                    </p>
                                </>
                            )}
                        </div>
                    </motion.div>

                    {/* Solution PDF Drop Zone */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className={`relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden ${isDraggingSolution
                            ? 'border-blue-400 bg-[#0F172A] scale-[1.02] shadow-xl'
                            : isGlobalDrag
                                ? 'border-blue-400 bg-[#0F172A] scale-[1.02] shadow-xl'
                                : 'border-zinc-300 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500 bg-white/50 dark:bg-zinc-900/50'
                            }`}
                        onDragOver={(e) => handleDragOver(e, 'solution')}
                        onDragLeave={(e) => handleDragLeave(e, 'solution')}
                        onDrop={(e) => handleDrop(e, 'solution')}
                        onClick={() => !solutionFile && solutionInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={solutionInputRef}
                            className="hidden"
                            accept=".pdf"
                            onChange={(e) => handleFileSelect(e, 'solution')}
                        />

                        <div className="p-8 flex flex-col items-center justify-center min-h-[300px] text-center">
                            {solutionFile ? (
                                <div className="w-full">
                                    <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4 text-green-500 overflow-hidden relative">
                                        <CheckCircle className="w-8 h-8" />
                                        <div className="absolute inset-0 bg-green-500/10 animate-pulse"></div>
                                    </div>
                                    <h3 className="font-bold text-lg mb-1 truncate px-4">{solutionFile.name}</h3>
                                    <p className="text-zinc-500 text-sm mb-6">{(solutionFile.size / 1024 / 1024).toFixed(2)} MB • PDF</p>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFile('solution');
                                        }}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                        Remove File
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${(isDraggingSolution || isGlobalDrag) ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/10 group-hover:text-blue-500'
                                        }`}>
                                        <FileType className="w-8 h-8" />
                                    </div>
                                    <h3 className={`font-bold text-lg mb-2 transition-colors ${(isDraggingSolution || isGlobalDrag) ? 'text-blue-100' : 'text-zinc-700 dark:text-zinc-200 group-hover:text-blue-500'
                                        }`}>
                                        {isDraggingSolution || isGlobalDrag ? 'Drop Solution PDF' : 'Upload Solution PDF'}
                                    </h3>
                                    <p className={`text-sm max-w-[200px] transition-colors ${(isDraggingSolution || isGlobalDrag) ? 'text-blue-300' : 'text-zinc-500 dark:text-zinc-400'
                                        }`}>
                                        {(isDraggingSolution || isGlobalDrag) ? 'Release to upload' : 'Drag and drop your answer key or solution file here (optional)'}
                                    </p>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Submit Action */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex justify-center"
                >
                    <button
                        onClick={handleSubmit}
                        disabled={!examFile}
                        className={`
                            px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 transition-all
                            ${examFile
                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-1'
                                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                            }
                        `}
                    >
                        <span>Process Exam</span>
                        <ArrowLeft className="w-5 h-5 rotate-180" />
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
