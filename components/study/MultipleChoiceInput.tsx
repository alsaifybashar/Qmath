'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { MultipleChoiceQuestion, MultipleChoiceOption } from '@/types/study';
import { MathRenderer } from './MathRenderer';

interface MCQProps {
    question: MultipleChoiceQuestion | any; // Allow flexible question format
    onAnswer: (optionId: string, isCorrect: boolean) => void;
    disabled?: boolean;
    showFeedback?: boolean;
}

export function MultipleChoiceInput({ question, onAnswer, disabled, showFeedback = true }: MCQProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [shake, setShake] = useState(false);

    // Handle both data structures: question.question or question.content.question
    const questionData = question?.question || question?.content?.question;
    const options = question?.options || question?.content?.options || [];
    const correctOptionId = question?.correctOptionId || question?.content?.correctOptionId;

    // Reset state when question changes
    useEffect(() => {
        setSelectedId(null);
        setIsSubmitted(false);
        setShake(false);
    }, [question?.id]);

    const handleSelect = (optionId: string) => {
        if (disabled || isSubmitted) return;

        setSelectedId(optionId);
        setIsSubmitted(true);

        const isCorrect = optionId === correctOptionId;

        // Haptic feedback (if supported on mobile)
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(isCorrect ? 10 : [10, 50, 10]);
        }

        if (!isCorrect) {
            setShake(true);
            setTimeout(() => setShake(false), 500);
        }

        // Delay callback slightly to allow animation to start
        setTimeout(() => {
            onAnswer(optionId, isCorrect);
        }, 300); // 300ms delay for visual feedback before any transition
    };

    // Safety check - if no question data, show loading state
    if (!questionData) {
        return (
            <div className="w-full max-w-2xl mx-auto p-4 text-center text-zinc-500">
                Loading question...
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col h-full">
            {/* Question Area - Top */}
            <div className="flex-1 mb-6">
                <div className="text-lg md:text-xl font-medium text-zinc-800 dark:text-zinc-100 leading-relaxed">
                    {questionData.text}
                </div>
                {questionData.math && (
                    <div className="my-6 flex justify-center p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                        <MathRenderer text={questionData.math} block />
                    </div>
                )}
                {questionData.image && (
                    <div className="my-6 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                        <img src={questionData.image} alt="Question Diagram" className="w-full h-auto object-cover" />
                    </div>
                )}
            </div>

            {/* Options Area - Bottom (Thumb Zone) */}
            <div className="space-y-3 pb-4">
                {options.map((option: MultipleChoiceOption) => {
                    const isSelected = selectedId === option.id;
                    const isCorrectOption = option.id === correctOptionId;

                    // Determine visual state
                    let stateClass = "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10";
                    let icon = <div className="w-5 h-5 rounded-full border-2 border-zinc-300 dark:border-zinc-600" />;

                    if (isSubmitted && showFeedback) {
                        if (isSelected) {
                            if (isCorrectOption) {
                                stateClass = "border-green-500 bg-green-50 dark:bg-green-900/20 ring-1 ring-green-500";
                                icon = <CheckCircle2 className="w-6 h-6 text-green-500" />;
                            } else {
                                stateClass = "border-red-500 bg-red-50 dark:bg-red-900/20";
                                icon = <XCircle className="w-6 h-6 text-red-500" />;
                            }
                        } else if (isCorrectOption && isSubmitted) {
                            // Reveal correct answer if user got it wrong
                            if (selectedId !== option.id) {
                                stateClass = "border-green-500/50 bg-green-50/50 dark:bg-green-900/10 border-dashed";
                                icon = <CheckCircle2 className="w-6 h-6 text-green-500/50" />;
                            }
                        } else {
                            stateClass = "border-zinc-200 dark:border-zinc-800 opacity-50";
                        }
                    } else if (isSelected) {
                        stateClass = "border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500";
                        icon = <div className="w-5 h-5 rounded-full border-[5px] border-blue-500" />;
                    }

                    return (
                        <motion.button
                            key={option.id}
                            onClick={() => handleSelect(option.id)}
                            disabled={isSubmitted || disabled}
                            className={`w-full relative p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-4 ${stateClass}`}
                            whileHover={!isSubmitted ? { scale: 1.01 } : {}}
                            whileTap={!isSubmitted ? { scale: 0.98 } : {}}
                            animate={isSelected && !isCorrectOption && shake ? { x: [-5, 5, -5, 5, 0] } : {}}
                            transition={{
                                default: { type: "spring", stiffness: 400, damping: 17 },
                                x: { type: "keyframes" }
                            }}
                        >
                            {/* Selection Indicator */}
                            <div className="flex-shrink-0">
                                {icon}
                            </div>

                            {/* Option Content */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2 font-medium text-lg text-zinc-900 dark:text-zinc-100">
                                    {option.label}
                                    {option.formula && (
                                        <span className="ml-2">
                                            <MathRenderer text={option.formula} />
                                        </span>
                                    )}
                                </div>
                                {option.description && (
                                    <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                        {option.description}
                                    </div>
                                )}
                            </div>

                            {/* Feedback Text (if wrong) */}
                            {isSubmitted && isSelected && !isCorrectOption && option.feedback && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="absolute -bottom-full left-0 right-0 z-10 p-3 mt-2 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 text-sm rounded-lg shadow-lg border border-red-200 dark:border-red-800"
                                >
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        <span>{option.feedback}</span>
                                    </div>
                                </motion.div>
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
