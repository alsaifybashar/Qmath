'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FillBlankQuestion } from '@/types/study';
import { MathRenderer } from './MathRenderer';
import { Check, X } from 'lucide-react';

interface FillBlankProps {
    question: FillBlankQuestion;
    onAnswer: (values: string[], isCorrect: boolean) => void;
}

export function FillBlankInput({ question, onAnswer }: FillBlankProps) {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleChange = (id: string, val: string) => {
        if (isSubmitted) return;
        setAnswers(prev => ({ ...prev, [id]: val }));
    };

    const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '');

    const checkCorrectness = () => {
        let allCorrect = true;
        question.blanks.forEach(blank => {
            const userVal = normalize(answers[blank.id] || '');
            const correctOpts = blank.correctValues.map(normalize);
            if (!correctOpts.includes(userVal)) allCorrect = false;
        });
        return allCorrect;
    };

    const handleSubmit = () => {
        setIsSubmitted(true);
        const correct = checkCorrectness();
        // Convert record to array based on blank index
        const valuesArr = question.blanks.map(b => answers[b.id] || '');
        onAnswer(valuesArr, correct);
    };

    // Regex to split text by {{number}}
    const parts = question.question.text.split(/(\{\{\d+\}\})/g);

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col h-full items-center justify-center">
            {question.question.math && (
                <div className="mb-8 w-full">
                    <MathRenderer text={question.question.math} block />
                </div>
            )}

            <div className="text-xl md:text-2xl leading-loose font-medium text-zinc-800 dark:text-zinc-100 text-center">
                {parts.map((part, i) => {
                    const match = part.match(/\{\{(\d+)\}\}/);
                    if (match) {
                        const index = parseInt(match[1]);
                        const blankConfig = question.blanks[index];
                        if (!blankConfig) return null;

                        const isCorrect = isSubmitted &&
                            blankConfig.correctValues.some(v => normalize(v) === normalize(answers[blankConfig.id] || ''));
                        const isWrong = isSubmitted && !isCorrect;

                        return (
                            <span key={i} className="inline-block mx-1 relative">
                                <input
                                    type="text"
                                    value={answers[blankConfig.id] || ''}
                                    onChange={(e) => handleChange(blankConfig.id, e.target.value)}
                                    disabled={isSubmitted}
                                    className={`
                                        min-w-[80px] w-[120px] bg-transparent border-b-2 text-center focus:outline-none transition-colors font-bold
                                        ${isCorrect ? 'border-green-500 text-green-600' : ''}
                                        ${isWrong ? 'border-red-500 text-red-600' : ''}
                                        ${!isSubmitted ? 'border-zinc-300 dark:border-zinc-700 focus:border-blue-500' : ''}
                                    `}
                                    placeholder={blankConfig.placeholder || "..."}
                                />
                                {isCorrect && <Check className="absolute -right-6 top-1 w-5 h-5 text-green-500" />}
                                {isWrong && <X className="absolute -right-6 top-1 w-5 h-5 text-red-500" />}
                            </span>
                        );
                    }
                    return <span key={i}>{part}</span>;
                })}
            </div>

            <button
                onClick={handleSubmit}
                disabled={isSubmitted || Object.keys(answers).length < question.blanks.length}
                className={`mt-12 px-8 py-3 rounded-full font-bold transition-all shadow-lg
                    ${isSubmitted
                        ? 'bg-zinc-200 text-zinc-500 cursor-default'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25 active:scale-95'
                    }
                `}
            >
                Check Answer
            </button>
        </div>
    );
}
