'use client';

import { useState, useEffect } from 'react';
import { QuestionCard } from '@/components/QuestionCard';
import { Timer, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const mockExamQuestions = [
    {
        id: 1,
        content: "Find the limit: $$\\lim_{{x \\to 0}} \\frac{\\sin(x)}{x}$$",
        type: "multiple_choice" as const,
        options: ["0", "1", "Infinity", "Undefined"]
    },
    {
        id: 2,
        content: "Calculate the integral: $$\\int_{0}^{1} x^2 dx$$",
        type: "multiple_choice" as const,
        options: ["1/3", "1/2", "1", "3"]
    },
    {
        id: 3,
        content: "If $f(x) = e^{2x}$, find $f'(x)$.",
        type: "multiple_choice" as const,
        options: ["e^{2x}", "2e^{2x}", "2x e^{2x-1}", "e^x"]
    }
];

export default function ExamPage() {
    const [timeLeft, setTimeLeft] = useState(3600); // 1 hour
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [answers, setAnswers] = useState<Record<number, string>>({});

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 && !isSubmitted ? prev - 1 : prev));
        }, 1000);
        return () => clearInterval(timer);
    }, [isSubmitted]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleAnswer = (qId: number, ans: string) => {
        if (!isSubmitted) {
            setAnswers(prev => ({ ...prev, [qId]: ans }));
        }
    };

    const submitExam = () => {
        if (confirm("Are you sure you want to finish the exam?")) {
            setIsSubmitted(true);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 relative">
            {/* Sticky Timer Header */}
            <div className="sticky top-4 z-50 mx-auto max-w-4xl bg-zinc-900/90 backdrop-blur border border-zinc-700 p-4 rounded-xl flex justify-between items-center shadow-lg mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/10 rounded-lg text-red-500 animate-pulse">
                        <Timer className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Time Remaining</div>
                        <div className="text-xl font-mono font-bold text-white">{formatTime(timeLeft)}</div>
                    </div>
                </div>
                {!isSubmitted ? (
                    <button
                        onClick={submitExam}
                        className="bg-zinc-100 text-black px-6 py-2 rounded-lg font-bold hover:bg-zinc-200 transition"
                    >
                        Submit Exam
                    </button>
                ) : (
                    <div className="text-green-400 font-bold px-4">Exam Submitted</div>
                )}
            </div>

            <div className="max-w-3xl mx-auto space-y-12">
                <div className="flex items-center gap-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-200 text-sm">
                    <AlertTriangle className="w-5 h-5" />
                    <p>Exam Mode active. No hints. No immediate feedback. Questions are fixed.</p>
                </div>

                {mockExamQuestions.map((q, idx) => (
                    <div key={q.id} className="relative">
                        <div className="absolute -left-12 top-0 text-zinc-600 font-mono text-xl">{idx + 1}.</div>
                        <div className={cn(
                            "transition-opacity duration-500",
                            isSubmitted ? "opacity-50 pointer-events-none" : "opacity-100"
                        )}>
                            <QuestionCard
                                content={q.content}
                                type={q.type}
                                options={q.options}
                                onAnswer={(a) => handleAnswer(q.id, a)}
                            />
                        </div>
                        {answers[q.id] && !isSubmitted && (
                            <div className="mt-2 text-right text-sm text-blue-400 font-mono">
                                Selected: {answers[q.id]}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
