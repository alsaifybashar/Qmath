"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from './InteractiveWidgetWrapper';
import { CheckCircle2 } from 'lucide-react';

interface ColumnAdditionProps {
    numbers: number[]; // e.g. [998795, 712966, 718383]
    onSolve?: (solved: boolean) => void;
    readOnly?: boolean;
}

const COLORS = [
    'text-cyan-600 dark:text-cyan-400',
    'text-purple-600 dark:text-purple-400',
    'text-pink-600 dark:text-pink-400',
    'text-amber-500 dark:text-amber-400',
    'text-emerald-600 dark:text-emerald-400',
    'text-blue-600 dark:text-blue-400',
];

export function ColumnAddition({
    numbers,
    onSolve,
    readOnly = false
}: ColumnAdditionProps) {
    // Find max length
    const maxDigits = Math.max(...numbers.map(n => n.toString().length)) + 1; // +1 for carries
    const totalSum = numbers.reduce((acc, curr) => acc + curr, 0);
    const targetAnswerString = totalSum.toString().padStart(maxDigits, ' ');

    const [inputs, setInputs] = useState<string[]>(Array(maxDigits).fill(''));
    const [carries, setCarries] = useState<string[]>(Array(maxDigits).fill(''));
    const [isSolved, setIsSolved] = useState(false);

    useEffect(() => {
        const currentAnswer = inputs.join('');
        const target = totalSum.toString();
        if (currentAnswer.trim() === target && !isSolved) {
            setIsSolved(true);
            if (onSolve) onSolve(true);
        } else if (currentAnswer.trim() !== target && isSolved) {
            setIsSolved(false);
            if (onSolve) onSolve(false);
        }
    }, [inputs, isSolved, onSolve, totalSum]);

    const handleInputChange = (colIndex: number, val: string) => {
        if (readOnly || isSolved) return;
        const newInputs = [...inputs];
        // Keep only the last typed digit
        newInputs[colIndex] = val.slice(-1).replace(/[^0-9]/g, '');
        setInputs(newInputs);

        // Auto focus next input (to the left)
        if (val && colIndex > 0) {
            const prevInput = document.getElementById(`ans-${colIndex - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    const handleCarryChange = (colIndex: number, val: string) => {
        if (readOnly || isSolved) return;
        const newCarries = [...carries];
        newCarries[colIndex] = val.slice(-1).replace(/[^0-9]/g, '');
        setCarries(newCarries);
    };

    return (
        <div className="flex flex-col items-end font-mono text-4xl font-light select-none bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl w-full max-w-2xl overflow-x-auto">

            {/* Carry Row */}
            <div className="flex w-full justify-end mb-4 border-b border-transparent">
                <div className="w-12 text-center text-slate-400"></div> {/* + sign column */}
                {Array.from({ length: maxDigits }).map((_, colIdx) => (
                    <div key={`carry-${colIdx}`} className="w-12 h-12 flex justify-center items-center mx-1 bg-green-50/50 dark:bg-green-950/20 rounded-md">
                        <input
                            className={cn(
                                "w-full h-full text-center bg-transparent outline-none text-2xl font-semibold text-green-600 dark:text-green-400",
                            )}
                            value={carries[colIdx]}
                            onChange={e => handleCarryChange(colIdx, e.target.value)}
                            disabled={readOnly || isSolved}
                            maxLength={1}
                        />
                    </div>
                ))}
            </div>

            {/* Number Rows */}
            {numbers.map((num, rowIdx) => {
                const numStr = num.toString().padStart(maxDigits, ' ');
                const isLast = rowIdx === numbers.length - 1;
                return (
                    <div key={`row-${rowIdx}`} className={cn(
                        "flex w-full justify-end",
                        isLast ? "border-b-4 border-slate-800 dark:border-white pb-4 mb-4" : "mb-2"
                    )}>
                        <div className="w-12 text-center flex items-center justify-center font-bold">
                            {isLast ? '+' : ''}
                        </div>
                        {Array.from({ length: maxDigits }).map((_, colIdx) => {
                            const digit = numStr[colIdx];
                            // Map colors based on column index (from right)
                            const colorIdx = (maxDigits - colIdx - 1) % COLORS.length;
                            return (
                                <div key={`digit-${rowIdx}-${colIdx}`} className="w-12 h-12 flex justify-center items-center mx-1">
                                    <span className={cn(
                                        "inline-block",
                                        digit !== ' ' ? COLORS[colorIdx] : "text-transparent"
                                    )}>
                                        {digit}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                );
            })}

            {/* Answer Row */}
            <div className="flex w-full justify-end">
                <div className="w-12"></div> {/* + column padding */}
                {Array.from({ length: maxDigits }).map((_, colIdx) => {
                    const colorIdx = (maxDigits - colIdx - 1) % COLORS.length;
                    return (
                        <motion.div
                            key={`ans-${colIdx}`}
                            animate={{
                                scale: isSolved ? [1, 1.1, 1] : 1,
                                borderColor: isSolved ? '#22c55e' : 'transparent'
                            }}
                            className={cn(
                                "w-12 h-14 mx-1 rounded bg-slate-100 dark:bg-slate-800 border-2 overflow-hidden",
                                inputs[colIdx] ? "border-slate-300 dark:border-slate-600" : "border-slate-200 dark:border-slate-700"
                            )}
                        >
                            <input
                                id={`ans-${colIdx}`}
                                className={cn(
                                    "w-full h-full text-center bg-transparent outline-none font-semibold",
                                    COLORS[colorIdx]
                                )}
                                value={inputs[colIdx]}
                                onChange={e => handleInputChange(colIdx, e.target.value)}
                                disabled={readOnly || isSolved}
                                maxLength={1}
                                inputMode="numeric"
                                autoComplete="off"
                            />
                        </motion.div>
                    );
                })}
            </div>

            {isSolved && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-6 flex w-full justify-center text-green-500 font-sans text-xl font-bold gap-2 items-center"
                >
                    <CheckCircle2 className="w-8 h-8" /> Perfect!
                </motion.div>
            )}

        </div>
    );
}
