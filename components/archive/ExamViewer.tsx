'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Eye, EyeOff, FileText, ExternalLink, Maximize2 } from 'lucide-react';

interface ExamViewerProps {
    exam: {
        id: string;
        courseCode: string;
        courseName: string;
        examDate: Date;
        examType: string;
        fileName: string;
        hasSolution: boolean;
        solutionFileName?: string | null;
    };
}

export default function ExamViewer({ exam }: ExamViewerProps) {
    const [solutionRevealed, setSolutionRevealed] = useState(false);
    const [isHovering, setIsHovering] = useState(false);

    // Add PDF parameters to hide default browser toolbar
    const pdfParams = '#toolbar=0&navpanes=0&scrollbar=0&view=FitH';
    const examUrlRaw = `/api/exams/file/${exam.id}?type=exam`;
    const solutionUrlRaw = `/api/exams/file/${exam.id}?type=solution`;

    const examUrl = `${examUrlRaw}${pdfParams}`;
    const solutionUrl = `${solutionUrlRaw}${pdfParams}`;

    const examDateFormatted = new Date(exam.examDate).toLocaleDateString('sv-SE');
    const examTitle = `${exam.examType} ${examDateFormatted}`;

    return (
        <div className="h-screen bg-zinc-950 flex flex-col overflow-hidden">
            {/* Header */}
            <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between shrink-0 select-none z-10">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/archive/${exam.courseCode}`}
                        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
                    >
                        <div className="p-1.5 rounded-md group-hover:bg-zinc-800 transition-colors">
                            <ArrowLeft size={18} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-zinc-200">
                                {exam.examType} {examDateFormatted}
                            </span>
                            <span className="text-xs text-zinc-500">
                                {exam.courseCode} • {exam.courseName}
                            </span>
                        </div>
                    </Link>
                </div>

                <div className="flex items-center gap-3">
                    {/* Toggle solution visibility */}
                    {exam.hasSolution && (
                        <button
                            onClick={() => setSolutionRevealed(!solutionRevealed)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all border ${solutionRevealed
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 hover:text-white'
                                }`}
                        >
                            {solutionRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                            <span className="hidden sm:inline">{solutionRevealed ? 'Hide Solution' : 'Show Solution'}</span>
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content - Split View */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Exam PDF - Left Side */}
                <div className={`flex-1 flex flex-col bg-zinc-900 ${exam.hasSolution ? 'border-r border-zinc-800' : ''}`}>
                    {/* Exam Toolbar */}
                    <div className="bg-zinc-900 px-4 py-2 border-b border-zinc-800 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="p-1 rounded bg-red-500/10">
                                <FileText size={14} className="text-red-400" />
                            </div>
                            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Exam Questions</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <a
                                href={examUrlRaw}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
                                title="Open in new tab"
                            >
                                <ExternalLink size={14} />
                            </a>
                            <a
                                href={examUrlRaw}
                                download={exam.fileName}
                                className="p-1.5 text-zinc-500 hover:text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
                                title="Download Exam"
                            >
                                <Download size={14} />
                            </a>
                        </div>
                    </div>

                    {/* Exam Iframe */}
                    <div className="flex-1 relative w-full h-full bg-zinc-950">
                        <iframe
                            src={examUrl}
                            className="absolute inset-0 w-full h-full border-0"
                            title={`Exam - ${examTitle}`}
                        />
                    </div>
                </div>

                {/* Solution PDF - Right Side (if available) */}
                {exam.hasSolution && (
                    <div
                        className="flex-1 flex flex-col bg-zinc-900"
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}
                    >
                        {/* Solution Toolbar */}
                        <div className="bg-zinc-900 px-4 py-2 border-b border-zinc-800 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="p-1 rounded bg-emerald-500/10">
                                    <FileText size={14} className="text-emerald-400" />
                                </div>
                                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Solution</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {!solutionRevealed && (
                                    <span className="text-xs text-zinc-500 flex items-center gap-1.5 mr-2">
                                        <Eye size={12} />
                                        Hover to peek
                                    </span>
                                )}
                                <div className="h-4 w-px bg-zinc-800 mx-1"></div>
                                <a
                                    href={solutionUrlRaw}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
                                    title="Open solution in new tab"
                                >
                                    <ExternalLink size={14} />
                                </a>
                                <a
                                    href={solutionUrlRaw}
                                    download={exam.solutionFileName || `solution-${exam.fileName}`}
                                    className="p-1.5 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-400/10 rounded transition-colors"
                                    title="Download Solution"
                                >
                                    <Download size={14} />
                                </a>
                            </div>
                        </div>

                        {/* Solution Iframe */}
                        <div className="flex-1 relative bg-zinc-950 overflow-hidden">
                            <div
                                className="absolute inset-0 transition-all duration-500 ease-in-out"
                                style={{
                                    filter: solutionRevealed || isHovering ? 'none' : 'blur(12px) grayscale(50%)',
                                    transform: solutionRevealed || isHovering ? 'scale(1)' : 'scale(0.98)',
                                    opacity: solutionRevealed || isHovering ? 1 : 0.6,
                                }}
                            >
                                <iframe
                                    src={solutionUrl}
                                    className="w-full h-full border-0"
                                    title={`Solution - ${examTitle}`}
                                />
                            </div>

                            {/* Blur overlay with premium styled hint */}
                            <div
                                className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${solutionRevealed || isHovering ? 'opacity-0' : 'opacity-100'
                                    }`}
                            >
                                <div className="bg-zinc-900/40 backdrop-blur-md px-8 py-6 rounded-2xl border border-white/10 shadow-2xl text-center transform translate-y-0 text-zinc-200">
                                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                                        <EyeOff size={24} className="text-zinc-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-white mb-1">Solutions Hidden</h3>
                                    <p className="text-sm text-zinc-400">
                                        Hover to peek or click &quot;Show Solution&quot;
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
