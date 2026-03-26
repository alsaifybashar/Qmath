'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft, Download, Eye, EyeOff, FileText, ExternalLink,
} from 'lucide-react';
import PdfViewer from './PdfViewer';

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

    const examUrlRaw = `/api/exams/file/${exam.id}?type=exam`;
    const solutionUrlRaw = `/api/exams/file/${exam.id}?type=solution`;

    const examDateFormatted = new Date(exam.examDate).toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="h-screen bg-zinc-950 flex flex-col overflow-hidden relative">
            {/* ── Floating Global Actions ── */}
            {/* Top Left: Back Button */}
            <div className="absolute top-5 left-5 z-50">
                <Link
                    href={`/courses/${exam.courseCode}`}
                    className="flex items-center justify-center w-10 h-10 bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all shadow-xl"
                    title="Tillbaka till kurs"
                >
                    <ArrowLeft size={18} />
                </Link>
            </div>

            {/* Top Right: Actions Pill */}
            <div className="absolute top-5 right-5 z-50 flex items-center gap-2">
                {exam.hasSolution && (
                    <button
                        onClick={() => setSolutionRevealed(!solutionRevealed)}
                        className={`flex items-center justify-center h-10 px-4 rounded-full text-sm font-medium transition-all shadow-xl backdrop-blur-md border ${
                            solutionRevealed
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                                : 'bg-zinc-900/60 text-zinc-300 border-white/10 hover:bg-zinc-800 hover:text-white'
                        }`}
                        title={solutionRevealed ? 'Dölj lösning' : 'Visa lösning permanent'}
                    >
                        {solutionRevealed ? <EyeOff size={16} className="mr-2" /> : <Eye size={16} className="mr-2" />}
                        <span className="hidden sm:inline">
                            {solutionRevealed ? 'Dölj lösning' : 'Visa lösning'}
                        </span>
                    </button>
                )}
                
                <a
                    href={examUrlRaw}
                    download={exam.fileName}
                    className="flex items-center justify-center w-10 h-10 bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all shadow-xl"
                    title="Ladda ner tenta"
                >
                    <Download size={16} />
                </a>

                {/* Solution Download */}
                {exam.hasSolution && (
                    <a
                        href={solutionUrlRaw}
                        download={exam.solutionFileName || `solution-${exam.fileName}`}
                        className="flex items-center justify-center w-10 h-10 bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-full text-emerald-500 hover:text-emerald-400 hover:bg-zinc-800 transition-all shadow-xl"
                        title="Ladda ner lösning"
                    >
                        <Download size={16} />
                    </a>
                )}
            </div>

            {/* ── Content Area ── */}
            <div className="flex-1 flex overflow-hidden">
                {/* Exam panel */}
                <div className={`flex flex-col overflow-hidden ${exam.hasSolution ? 'flex-1 border-r border-zinc-800' : 'w-full'}`}>
                    <div className="flex-1 overflow-hidden">
                        <PdfViewer url={examUrlRaw} accent="blue" />
                    </div>
                </div>

                {/* Solution panel */}
                {exam.hasSolution && (
                    <div className="flex-1 flex flex-col overflow-hidden relative">

                        {/* PDF with blur overlay */}
                        <div className="flex-1 overflow-hidden relative group">
                            <PdfViewer url={solutionUrlRaw} accent="emerald" />

                            {/* Blur overlay */}
                            <div
                                className={`absolute inset-0 backdrop-blur-md bg-zinc-950/60 flex items-center justify-center transition-all duration-500 cursor-pointer ${
                                    solutionRevealed 
                                        ? 'opacity-0 pointer-events-none' 
                                        : 'opacity-100 group-hover:opacity-0 group-hover:pointer-events-none'
                                }`}
                                onClick={() => setSolutionRevealed(true)}
                            >
                                <div className="bg-zinc-900/80 px-8 py-6 rounded-2xl border border-white/10 shadow-2xl text-center max-w-xs transition-all duration-500 scale-100 group-hover:scale-95 group-hover:opacity-0">
                                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 border border-white/10">
                                        <EyeOff size={22} className="text-zinc-400" />
                                    </div>
                                    <h3 className="text-base font-semibold text-white mb-1">Lösningar dolda</h3>
                                    <p className="text-xs text-zinc-400">
                                        Håll muspekaren över för att läsa, eller klicka på &quot;Visa lösning&quot; ovan
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
