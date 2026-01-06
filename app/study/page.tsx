'use client';

import { useState } from 'react';
import { QuestionCard } from '@/components/QuestionCard';
import { AlertCircle, ArrowDownRight, CheckCircle2 } from 'lucide-react';

// Scaffolding demonstration
// Question A (Hard) -> Wrong -> Breakdown into Q A.1 (Easier)
const HARD_QUESTION = {
    content: "Evaluate $$\\int x^2 e^x dx$$ using Integration by Parts.",
    answer: "x^2e^x - 2xe^x + 2e^x",
    options: ["x^2e^x - 2xe^x + 2e^x", "xe^x - e^x", "e^x(x^2 - 2x)", "Undefined"],
    correct: "x^2e^x - 2xe^x + 2e^x"
};

const SCAFFOLD_QUESTION = {
    content: "Let's break it down. First, identify $u$ and $dv$. If we choose $u = x^2$, what is $du$?",
    answer: "2x dx",
    options: ["2x dx", "x dx", "2 dx", "x^2 dx"],
    correct: "2x dx"
};

export default function StudySession() {
    const [status, setStatus] = useState<'IDLE' | 'CORRECT' | 'WRONG' | 'SCAFFOLDING'>('IDLE');
    const [currentQ, setCurrentQ] = useState(HARD_QUESTION);

    const handleAnswer = async (ans: string) => {
        if (ans === currentQ.correct) {
            setStatus('CORRECT');
            if (status === 'SCAFFOLDING') {
                // Scaffold done, return to flow (mock)
                setTimeout(() => {
                    alert("Great! Now you can try the main problem again.");
                    setCurrentQ(HARD_QUESTION);
                    setStatus('IDLE');
                }, 1000);
            }
        } else {
            setStatus('WRONG');
            // Trigger breakdown mechanism
            setTimeout(() => {
                setStatus('SCAFFOLDING');
                setCurrentQ(SCAFFOLD_QUESTION);
            }, 1500);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black p-4">
            {/* Header */}
            <div className="w-full max-w-2xl flex justify-between mb-8 items-center border-b border-zinc-800 pb-4">
                <div className="flex flex-col">
                    <span className="text-zinc-400 font-mono text-sm">Calculus II <span className="text-zinc-600">/</span> Integration</span>
                    <div className="flex gap-2 items-center mt-1">
                        <div className="h-1 w-24 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full w-2/3 bg-blue-500"></div>
                        </div>
                        <span className="text-xs text-zinc-500">Mastery: 67%</span>
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    {status === 'SCAFFOLDING' && (
                        <span className="px-2 py-1 rounded bg-orange-500/10 text-orange-400 text-xs font-mono border border-orange-500/20 animate-pulse flex items-center gap-1">
                            <ArrowDownRight className="w-3 h-3" /> SCAFFOLDING ACTIVE
                        </span>
                    )}
                    <span className="text-xs text-green-500 font-mono border border-green-900 bg-green-900/10 px-2 py-1 rounded">ADAPTIVE</span>
                </div>
            </div>

            <div className="relative w-full max-w-2xl">
                {status === 'WRONG' && (
                    <div className="absolute -top-16 left-0 right-0 bg-red-900/20 border border-red-500/50 text-red-200 p-3 rounded-lg flex items-center gap-2 justify-center animate-shake">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-semibold">Incorrect. Let's break this down into a simpler step...</span>
                    </div>
                )}
                {status === 'CORRECT' && (
                    <div className="absolute -top-16 left-0 right-0 bg-green-900/20 border border-green-500/50 text-green-200 p-3 rounded-lg flex items-center gap-2 justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm font-semibold">Correct! Mastery updated.</span>
                    </div>
                )}

                <QuestionCard
                    content={currentQ.content}
                    type="multiple_choice"
                    options={currentQ.options}
                    onAnswer={handleAnswer}
                />
            </div>

        </div>
    );
}
