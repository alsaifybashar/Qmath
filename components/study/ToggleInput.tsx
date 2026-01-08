'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { ToggleQuestion } from '@/types/study';
import { MathRenderer } from './MathRenderer';

interface ToggleProps {
    question: ToggleQuestion;
    onAnswer: (states: Record<string, boolean>, isCorrect: boolean) => void;
}

export function ToggleInput({ question, onAnswer }: ToggleProps) {
    // Initialize state map
    const [states, setStates] = useState<Record<string, boolean>>(() => {
        const init: Record<string, boolean> = {};
        question.items.forEach(item => {
            init[item.id] = item.initialState || false;
        });
        return init;
    });

    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleToggle = (id: string) => {
        if (isSubmitted) return;
        setStates(prev => ({ ...prev, [id]: !prev[id] }));

        // Haptic
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(5);
    };

    const handleSubmit = () => {
        setIsSubmitted(true);
        const isCorrect = question.items.every(item => states[item.id] === item.correctState);
        onAnswer(states, isCorrect);
    };

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col h-full items-center justify-center">
            <h2 className="text-xl md:text-2xl font-medium text-zinc-900 dark:text-zinc-100 mb-8 text-center leading-relaxed">
                {question.question.text}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {question.items.map((item) => {
                    const isActive = states[item.id];
                    const isCorrect = isSubmitted && states[item.id] === item.correctState;
                    // Note: "isCorrect" here means "Did the user set it correctly?"
                    // But usually we want to show if it SHOULD be active.
                    // If user set Active (True), and Correct is True -> Green Check.
                    // If user set Active (True), and Correct is False -> Red X.
                    // If user set Inactive (False), and Correct is True -> "Missed" (maybe outline red).

                    let borderColor = "border-zinc-200 dark:border-zinc-800";
                    let bgColor = "bg-white dark:bg-zinc-900";
                    let textColor = "text-zinc-700 dark:text-zinc-300";

                    if (!isSubmitted) {
                        if (isActive) {
                            borderColor = "border-blue-500 ring-1 ring-blue-500";
                            bgColor = "bg-blue-50 dark:bg-blue-900/20";
                            textColor = "text-blue-700 dark:text-blue-300";
                        }
                    } else {
                        if (states[item.id] === item.correctState) {
                            // Correctly set (Active or Inactive)
                            borderColor = "border-green-500/50";
                            if (isActive) bgColor = "bg-green-50 dark:bg-green-900/20";
                        } else {
                            // Incorrectly set
                            borderColor = "border-red-500";
                            if (isActive) bgColor = "bg-red-50 dark:bg-red-900/20";
                        }
                    }

                    return (
                        <motion.button
                            key={item.id}
                            onClick={() => handleToggle(item.id)}
                            disabled={isSubmitted}
                            whileHover={!isSubmitted ? { scale: 1.02 } : {}}
                            whileTap={!isSubmitted ? { scale: 0.98 } : {}}
                            className={`
                                relative p-6 rounded-2xl border-2 text-left transition-all flex items-center justify-between
                                ${borderColor} ${bgColor} ${textColor}
                            `}
                        >
                            <span className="font-medium text-lg">
                                <MathRenderer text={item.label} />
                            </span>

                            <div className={`
                                w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                                ${isActive
                                    ? (isSubmitted
                                        ? (states[item.id] === item.correctState ? 'bg-green-500 border-green-500' : 'bg-red-500 border-red-500')
                                        : 'bg-blue-500 border-blue-500')
                                    : 'border-zinc-300 dark:border-zinc-600'}
                            `}>
                                {isActive && <Check className="w-4 h-4 text-white" />}
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            <button
                onClick={handleSubmit}
                disabled={isSubmitted}
                className={`mt-12 px-8 py-3 rounded-full font-bold transition-all shadow-lg
                    ${isSubmitted
                        ? 'bg-zinc-200 text-zinc-500 cursor-default hidden'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25 active:scale-95'
                    }
                `}
            >
                Submit Choices
            </button>

            {isSubmitted && (
                <div className="mt-8 font-bold text-lg">
                    {question.items.every(item => states[item.id] === item.correctState)
                        ? <span className="text-green-500">Perfect!</span>
                        : <span className="text-red-500">Not quite.</span>}
                </div>
            )}
        </div>
    );
}
