'use client';

/**
 * Free-Form Input Component
 * 
 * A math input component that checks symbolic equivalence.
 * Students enter mathematical expressions that are validated
 * against expected answers using algebraic equivalence.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check,
    X,
    Lightbulb,
    RefreshCw,
    ChevronRight,
    Eye,
    EyeOff,
    Sparkles
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';

// Types
export interface FreeFormProblem {
    id: string;
    problem: string;
    problemMath?: string;
    expectedAnswer: string;
    alternativeForms?: string[];
    hints?: string[];
    explanation?: string;
    difficulty?: number;
}

interface FreeFormInputProps {
    problem: FreeFormProblem;
    onComplete?: (result: { isCorrect: boolean; attempts: number; timeSpent: number }) => void;
    showConfidence?: boolean;
    className?: string;
}

type ConfidenceLevel = 'low' | 'medium' | 'high';
type ValidationStatus = 'idle' | 'validating' | 'correct' | 'incorrect';

export function FreeFormInput({
    problem,
    onComplete,
    showConfidence = true,
    className = ''
}: FreeFormInputProps) {
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<ValidationStatus>('idle');
    const [attempts, setAttempts] = useState(0);
    const [hintsUsed, setHintsUsed] = useState(0);
    const [showHint, setShowHint] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);
    const [confidence, setConfidence] = useState<ConfidenceLevel | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [startTime] = useState(Date.now());

    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Submit answer for validation
    const submitAnswer = useCallback(async () => {
        if (!answer.trim() || status === 'validating') return;

        setStatus('validating');
        setAttempts(prev => prev + 1);

        try {
            const response = await fetch('/api/content/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentAnswer: answer,
                    expectedAnswer: problem.expectedAnswer,
                    alternativeForms: problem.alternativeForms,
                }),
            });

            const result = await response.json();

            if (result.isEquivalent) {
                setStatus('correct');
                setFeedback('Correct! 🎉');
                onComplete?.({
                    isCorrect: true,
                    attempts,
                    timeSpent: (Date.now() - startTime) / 1000,
                });
            } else {
                setStatus('incorrect');
                setFeedback(result.hint || 'Not quite right. Try again!');

                // Reset to idle after showing feedback
                setTimeout(() => {
                    setStatus('idle');
                }, 2000);
            }
        } catch (error) {
            console.error('Validation error:', error);
            setStatus('idle');
            setFeedback('Validation error. Please try again.');
        }
    }, [answer, status, problem, attempts, startTime, onComplete]);

    // Handle Enter key
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (showConfidence && !confidence) {
                // Need to select confidence first
                setFeedback('Please select your confidence level first');
                return;
            }
            submitAnswer();
        }
    };

    // Show next hint
    const showNextHint = () => {
        if (problem.hints && hintsUsed < problem.hints.length) {
            setHintsUsed(prev => prev + 1);
            setShowHint(true);
        }
    };

    // Reset problem
    const reset = () => {
        setAnswer('');
        setStatus('idle');
        setAttempts(0);
        setHintsUsed(0);
        setShowHint(false);
        setShowExplanation(false);
        setConfidence(null);
        setFeedback(null);
        inputRef.current?.focus();
    };

    return (
        <div className={`max-w-2xl mx-auto ${className}`}>
            {/* Problem Statement */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6"
            >
                <div className="text-sm text-zinc-500 uppercase tracking-wider mb-3">
                    Problem
                </div>

                <div className="text-lg text-zinc-900 dark:text-white mb-4">
                    {problem.problemMath ? (
                        <BlockMath math={problem.problemMath} />
                    ) : (
                        <span className="whitespace-pre-wrap">{problem.problem}</span>
                    )}
                </div>

                {problem.difficulty !== undefined && (
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <span>Difficulty:</span>
                        <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-2 h-2 rounded-full ${i < Math.ceil((problem.difficulty ?? 0) * 5)
                                            ? 'bg-purple-500'
                                            : 'bg-zinc-200 dark:bg-zinc-700'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Answer Input */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative"
            >
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter your answer..."
                            disabled={status === 'correct'}
                            className={`
                                w-full px-5 py-4 text-lg
                                bg-white dark:bg-zinc-900
                                border-2 rounded-xl
                                outline-none transition-all duration-300
                                font-mono
                                ${status === 'correct'
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                    : status === 'incorrect'
                                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                        : 'border-zinc-200 dark:border-zinc-700 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10'
                                }
                                text-zinc-900 dark:text-white
                                placeholder:text-zinc-400
                            `}
                        />

                        {/* Live preview */}
                        <AnimatePresence>
                            {answer && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500"
                                >
                                    <InlineMath math={answer} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <motion.button
                        onClick={submitAnswer}
                        disabled={!answer.trim() || status === 'validating' || status === 'correct' || (showConfidence && !confidence)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                            px-6 py-4 rounded-xl font-medium
                            transition-all duration-300
                            flex items-center gap-2
                            ${status === 'correct'
                                ? 'bg-green-500 text-white'
                                : status === 'validating'
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-purple-500 hover:bg-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                            }
                        `}
                    >
                        {status === 'validating' ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : status === 'correct' ? (
                            <Check className="w-5 h-5" />
                        ) : (
                            <>
                                <span>Submit</span>
                                <ChevronRight className="w-4 h-4" />
                            </>
                        )}
                    </motion.button>
                </div>
            </motion.div>

            {/* Confidence Selection */}
            <AnimatePresence>
                {showConfidence && status === 'idle' && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4"
                    >
                        <div className="text-sm text-zinc-500 mb-2">How confident are you?</div>
                        <div className="flex gap-2">
                            {(['low', 'medium', 'high'] as ConfidenceLevel[]).map((level) => (
                                <button
                                    key={level}
                                    onClick={() => setConfidence(level)}
                                    className={`
                                        flex-1 py-2 px-4 rounded-lg text-sm font-medium
                                        transition-all duration-200
                                        ${confidence === level
                                            ? level === 'low'
                                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 ring-2 ring-red-500'
                                                : level === 'medium'
                                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 ring-2 ring-yellow-500'
                                                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 ring-2 ring-green-500'
                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                        }
                                    `}
                                >
                                    {level === 'low' && '😕'}
                                    {level === 'medium' && '🤔'}
                                    {level === 'high' && '😎'}
                                    {' '}
                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Feedback */}
            <AnimatePresence>
                {feedback && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`
                            mt-4 p-4 rounded-xl flex items-center gap-3
                            ${status === 'correct'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : status === 'incorrect'
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                            }
                        `}
                    >
                        {status === 'correct' ? (
                            <Check className="w-5 h-5 flex-shrink-0" />
                        ) : status === 'incorrect' ? (
                            <X className="w-5 h-5 flex-shrink-0" />
                        ) : (
                            <Lightbulb className="w-5 h-5 flex-shrink-0" />
                        )}
                        <span>{feedback}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hints */}
            <div className="mt-6 flex flex-wrap gap-3">
                {problem.hints && problem.hints.length > 0 && (
                    <motion.button
                        onClick={showNextHint}
                        disabled={hintsUsed >= problem.hints.length}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-4 py-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 
                                   flex items-center gap-2 text-sm font-medium
                                   disabled:opacity-50 disabled:cursor-not-allowed
                                   hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
                    >
                        <Lightbulb className="w-4 h-4" />
                        Hint ({hintsUsed}/{problem.hints.length})
                    </motion.button>
                )}

                {status === 'correct' && problem.explanation && (
                    <motion.button
                        onClick={() => setShowExplanation(!showExplanation)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-4 py-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300
                                   flex items-center gap-2 text-sm font-medium
                                   hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                    >
                        {showExplanation ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {showExplanation ? 'Hide' : 'Show'} Explanation
                    </motion.button>
                )}

                <motion.button
                    onClick={reset}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400
                               flex items-center gap-2 text-sm font-medium
                               hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Reset
                </motion.button>
            </div>

            {/* Hint Display */}
            <AnimatePresence>
                {showHint && hintsUsed > 0 && problem.hints && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4"
                    >
                        {problem.hints.slice(0, hintsUsed).map((hint, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-start gap-3 p-4 mb-2 rounded-xl
                                           bg-yellow-50 dark:bg-yellow-900/20 
                                           border border-yellow-200 dark:border-yellow-800"
                            >
                                <Lightbulb className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-xs text-yellow-600 dark:text-yellow-400 uppercase tracking-wider mb-1">
                                        Hint {index + 1}
                                    </div>
                                    <div className="text-yellow-800 dark:text-yellow-200">
                                        {hint}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Explanation Display */}
            <AnimatePresence>
                {showExplanation && problem.explanation && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 p-5 rounded-xl bg-purple-50 dark:bg-purple-900/20 
                                   border border-purple-200 dark:border-purple-800"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-5 h-5 text-purple-500" />
                            <span className="text-sm font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                                Solution Explanation
                            </span>
                        </div>
                        <div className="text-purple-800 dark:text-purple-200 leading-relaxed">
                            {problem.explanation}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats */}
            <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-sm text-zinc-500">
                <div>Attempts: {attempts}</div>
                <div>Hints used: {hintsUsed}</div>
            </div>
        </div>
    );
}

export default FreeFormInput;
