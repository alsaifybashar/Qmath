'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExpressionBuilderQuestion } from '@/types/study';
import { MathRenderer } from './MathRenderer';
import { Delete, Eraser, CheckCircle2, ChevronRight } from 'lucide-react';

interface ExpressionBuilderProps {
    question: ExpressionBuilderQuestion;
    onAnswer: (expression: string, isCorrect: boolean) => void;
}

export function ExpressionBuilderInput({ question, onAnswer }: ExpressionBuilderProps) {
    const [tokens, setTokens] = useState<string[]>([]);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleAddToken = (val: string) => {
        if (isSubmitted) return;
        setTokens(prev => [...prev, val]);
        // Haptic
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(5);
    };

    const handleBackspace = () => {
        if (isSubmitted) return;
        setTokens(prev => prev.slice(0, -1));
    };

    const handleClear = () => {
        if (isSubmitted) return;
        setTokens([]);
    };

    const currentExpression = tokens.join(' ');
    // Joining with space prevents some latex merging issues, but simple concat might be better for things like '2' 'x' -> '2x'.
    // Let's try simple concat for now, but sometimes spacing is needed for commands like \sin x. 
    // Actually, blocks usually bring their own spacing or structure.

    // Improved join logic: if block starts with char and prev ends with char, maybe no space? 
    // For latex, space usually doesn't hurt except inside keywords.
    // We'll stick to a simple join('') for now as blocks usually have full latex tokens.

    const displayExpression = tokens.join('');

    const handleSubmit = () => {
        setIsSubmitted(true);
        // Normalize for comparison: remove spaces?
        const normalize = (s: string) => s.replace(/\s+/g, '');
        const isCorrect = normalize(displayExpression) === normalize(question.correctExpression);
        onAnswer(displayExpression, isCorrect);
    };

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col h-full items-center">
            <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-100 mb-6 text-center">
                {question.question.text}
            </h2>

            {/* Expression Display Area */}
            <div className={`
                w-full min-h-[120px] bg-zinc-100 dark:bg-zinc-900 border-2 rounded-2xl flex items-center justify-center p-6 mb-8 relative transition-colors
                ${isSubmitted
                    ? (displayExpression.replace(/\s+/g, '') === question.correctExpression.replace(/\s+/g, '')
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                        : 'border-red-500 bg-red-50 dark:bg-red-900/10')
                    : 'border-zinc-200 dark:border-zinc-800 focus-within:border-blue-500'}
            `}>
                {!displayExpression && <span className="text-zinc-400 italic">Build your expression...</span>}
                <div className="text-2xl md:text-3xl font-medium">
                    <MathRenderer text={displayExpression || "\\text{ }"} block />
                </div>

                {!isSubmitted && tokens.length > 0 && (
                    <button
                        onClick={handleClear}
                        className="absolute top-2 right-2 p-2 text-zinc-400 hover:text-red-500 transition-colors"
                        title="Clear All"
                    >
                        <Eraser className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Blocks Bank */}
            <div className="w-full">
                <div className="flex flex-wrap justify-center gap-3 mb-8">
                    {question.availableBlocks.map((block) => (
                        <motion.button
                            key={block.id}
                            onClick={() => handleAddToken(block.value)}
                            disabled={isSubmitted}
                            whileHover={!isSubmitted ? { scale: 1.05, y: -2 } : {}}
                            whileTap={!isSubmitted ? { scale: 0.95 } : {}}
                            className={`
                                h-12 min-w-[60px] px-4 rounded-xl shadow-sm border-b-2 font-medium text-lg flex items-center justify-center
                                transition-all select-none
                                ${block.type === 'number'
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100'
                                    : ''}
                                ${block.type === 'operator'
                                    ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800 hover:bg-orange-100'
                                    : ''}
                                ${block.type === 'variable'
                                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100'
                                    : ''}
                                ${block.type === 'function'
                                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200'
                                    : ''}
                                ${isSubmitted ? 'opacity-50 cursor-not-allowed transform-none' : ''}
                            `}
                        >
                            <MathRenderer text={block.text} />
                        </motion.button>
                    ))}
                    <button
                        onClick={handleBackspace}
                        disabled={isSubmitted || tokens.length === 0}
                        className="h-12 w-12 rounded-xl bg-zinc-200 dark:bg-zinc-800 border-b-4 border-zinc-300 dark:border-zinc-950 flex items-center justify-center text-zinc-600 dark:text-zinc-400 active:border-b-0 active:translate-y-[4px] transition-all disabled:opacity-50 disabled:active:border-b-4 disabled:active:translate-y-0"
                    >
                        <Delete className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <button
                onClick={handleSubmit}
                disabled={isSubmitted || tokens.length === 0}
                className={`w-full max-w-sm px-8 py-3 rounded-full font-bold transition-all shadow-lg flex items-center justify-center gap-2
                    ${isSubmitted
                        ? 'bg-zinc-200 text-zinc-500 cursor-default hidden'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25 active:scale-95'
                    }
                `}
            >
                Submit Expression <ChevronRight className="w-5 h-5" />
            </button>

            {isSubmitted && (
                <div className="mt-4 animate-in fade-in slide-in-from-bottom-4">
                    {displayExpression.replace(/\s+/g, '') === question.correctExpression.replace(/\s+/g, '') ? (
                        <div className="flex items-center gap-2 text-green-500 font-bold bg-green-500/10 px-6 py-2 rounded-full">
                            <CheckCircle2 className="w-5 h-5" /> Perfect Match!
                        </div>
                    ) : (
                        <div className="text-center bg-red-500/10 p-4 rounded-xl">
                            <div className="text-red-500 font-bold mb-2">Incorrect Expression</div>
                            {/* <div className="text-sm text-zinc-500">Expected: <MathRenderer text={question.correctExpression} /></div> */}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
