'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface ConfidenceRatingProps {
    value: number;
    onChange: (value: number) => void;
    disabled?: boolean;
}

const labels = ['Guessing', 'Unsure', 'Somewhat', 'Confident', 'Certain'];

export function ConfidenceRating({ value, onChange, disabled }: ConfidenceRatingProps) {
    const [hovered, setHovered] = useState<number | null>(null);

    const displayValue = hovered !== null ? hovered : value;

    return (
        <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                How confident are you?
            </span>
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                    <motion.button
                        key={level}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(level)}
                        onMouseEnter={() => setHovered(level)}
                        onMouseLeave={() => setHovered(null)}
                        whileHover={!disabled ? { scale: 1.15 } : {}}
                        whileTap={!disabled ? { scale: 0.95 } : {}}
                        className={`
                            w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                            ${level <= displayValue
                                ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/30'
                                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600'
                            }
                            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                    >
                        {level}
                    </motion.button>
                ))}
            </div>
            <motion.span
                key={displayValue}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-sm font-medium ${
                    displayValue <= 2 ? 'text-amber-600 dark:text-amber-400' :
                    displayValue <= 3 ? 'text-blue-600 dark:text-blue-400' :
                    'text-green-600 dark:text-green-400'
                }`}
            >
                {labels[displayValue - 1] || 'Select'}
            </motion.span>
        </div>
    );
}
