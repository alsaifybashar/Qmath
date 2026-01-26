'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete, Check, ArrowRight } from 'lucide-react';
import { NumericInputQuestion } from '@/types/study';
import { MathRenderer } from './MathRenderer';

interface NumericInputProps {
    question: NumericInputQuestion;
    onAnswer: (value: string, isCorrect: boolean) => void;
    disabled?: boolean;
}

export function NumericInput({ question, onAnswer, disabled }: NumericInputProps) {
    const [value, setValue] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Reset when question changes
    useEffect(() => {
        setValue('');
        setIsSubmitted(false);
    }, [question.id]);

    const handleKeyPress = (key: string) => {
        if (isSubmitted || disabled) return;

        // Haptic
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(5);

        if (key === 'BACKSPACE') {
            setValue(prev => prev.slice(0, -1));
        } else if (key === 'SUBMIT') {
            handleSubmit();
        } else {
            // Validate max length
            if (value.length >= (question.inputConfig?.maxDigits || 10)) return;

            // Prevent multiple decimals
            if (key === '.' && value.includes('.')) return;

            // Prevent multiple slashes if fraction allowed
            if (key === '/' && value.includes('/')) return;

            // Handle +/- Toggle
            if (key === '±') {
                if (value.startsWith('-')) setValue(prev => prev.substring(1));
                else setValue(prev => '-' + prev);
                return;
            }

            setValue(prev => prev + key);
        }
    };

    const validateAnswer = (input: string): boolean => {
        // Parse input
        let numVal: number | null = null;
        const normalized = input.trim();

        try {
            if (normalized.includes('/')) {
                const [n, d] = normalized.split('/').map(Number);
                if (!isNaN(n) && !isNaN(d) && d !== 0) numVal = n / d;
            } else {
                numVal = parseFloat(normalized);
            }
        } catch {
            return false;
        }

        if (numVal === null || isNaN(numVal)) return false;

        const { exact, range, tolerance, acceptedForms } = question.answer;

        // Check accepted forms string match
        if (acceptedForms?.includes(normalized)) return true;

        // Check exact match
        if (exact !== undefined) {
            if (tolerance !== undefined) {
                if (Math.abs(numVal - exact) <= tolerance) return true;
            } else {
                if (numVal === exact) return true;
            }
        }

        // Check range
        if (range) {
            if (numVal >= range[0] && numVal <= range[1]) return true;
        }

        return false;
    };

    const handleSubmit = () => {
        if (!value) return;
        setIsSubmitted(true);
        const isCorrect = validateAnswer(value);
        onAnswer(value, isCorrect);
    };

    const keys = [
        '7', '8', '9',
        '4', '5', '6',
        '1', '2', '3',
        question.inputConfig?.allowNegative ? '±' : '', '0', '.'
    ].filter(k => k !== '');

    // Add Fraction key if needed
    if (question.inputConfig?.allowFraction) {
        // Insert nicely
        if (!keys.includes('.')) keys.push('.'); // Ensure dot is there
        // Replace dot with slash or add slash? Usually standard keypad has both or toggles.
        // Let's add extra row or modify layout.
        // For simple calc styled keypad: 
        /*
          7 8 9
          4 5 6
          1 2 3
          . 0 <
        */
        // We can add a side column for operations if needed.
    }

    return (
        <div className="w-full max-w-md mx-auto flex flex-col h-full">
            {/* Question Area */}
            <div className="flex-1 mb-8 text-center flex flex-col items-center justify-center">
                <div className="text-xl font-medium text-zinc-800 dark:text-zinc-100 mb-4">
                    {question.question.text}
                </div>
                {question.question.math && (
                    <div className="mb-8">
                        <MathRenderer text={question.question.math} block className="text-2xl" />
                    </div>
                )}

                {/* Answer Display */}
                <div className={`
                    relative min-w-[200px] px-6 py-4 rounded-2xl text-3xl font-mono text-center transition-all
                    bg-zinc-100 dark:bg-zinc-900 border-2
                    ${isSubmitted
                        ? (validateAnswer(value)
                            ? 'border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10'
                            : 'border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10')
                        : 'border-blue-500/30 text-zinc-900 dark:text-white shadow-inner'
                    }
                `}>
                    {value || <span className="text-zinc-400/50">_</span>}
                    {!isSubmitted && (
                        <motion.span
                            animate={{ opacity: [1, 0] }}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                            className="inline-block w-0.5 h-8 bg-blue-500 ml-1 align-middle"
                        />
                    )}
                </div>
            </div>

            {/* Keypad */}
            <div className="bg-zinc-100 dark:bg-zinc-900/50 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 backdrop-blur-xl">
                <div className="grid grid-cols-3 gap-3 mb-3">
                    {keys.map((key) => (
                        <button
                            key={key}
                            onClick={() => handleKeyPress(key)}
                            disabled={isSubmitted || disabled}
                            className="h-14 rounded-xl bg-white dark:bg-zinc-800 shadow-sm border-b-2 border-zinc-200 dark:border-zinc-950 active:border-b-0 active:translate-y-[2px] transition-all text-xl font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                        >
                            {key}
                        </button>
                    ))}
                    <button
                        onClick={() => handleKeyPress('BACKSPACE')}
                        disabled={isSubmitted || disabled}
                        className="h-14 rounded-xl bg-zinc-200 dark:bg-zinc-800/50 shadow-sm border-b-2 border-zinc-300 dark:border-zinc-950 active:border-b-0 active:translate-y-[2px] transition-all flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700"
                    >
                        <Delete className="w-6 h-6" />
                    </button>
                </div>

                <button
                    onClick={() => handleKeyPress('SUBMIT')}
                    disabled={!value || isSubmitted || disabled}
                    className={`w-full h-14 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg
                        ${!value
                            ? 'bg-zinc-300 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25 active:scale-95'
                        }
                    `}
                >
                    <span>Submit Answer</span>
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
