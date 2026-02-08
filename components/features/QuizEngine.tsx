'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import {
    Clock, CheckCircle2, XCircle, AlertTriangle, ChevronRight,
    Play, Pause, RotateCcw, Flag, Sparkles, Trophy, Zap, Target
} from 'lucide-react';
import dynamic from 'next/dynamic';
import 'katex/dist/katex.min.css';

const BlockMath = dynamic(() => import('react-katex').then((mod) => mod.BlockMath), { ssr: false });

// Types
export interface QuizQuestion {
    id: string;
    content: string;
    mathContent?: string;
    options: {
        id: string;
        content: string;
        mathContent?: string;
    }[];
    correctOptionId: string;
    explanation?: string;
    difficulty: 1 | 2 | 3 | 4 | 5;
    topicId: string;
    topicTitle: string;
}

export interface QuizConfig {
    title: string;
    description?: string;
    questions: QuizQuestion[];
    timeLimit?: number; // seconds
    showTimer: boolean;
    showProgress: boolean;
    allowSkip: boolean;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
}

export interface QuizResult {
    questionId: string;
    selectedOptionId: string | null;
    isCorrect: boolean;
    timeSpent: number;
}

interface QuizEngineProps {
    config: QuizConfig;
    onComplete: (results: QuizResult[], totalTime: number) => void;
}

export default function QuizEngine({ config, onComplete }: QuizEngineProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [results, setResults] = useState<QuizResult[]>([]);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [questionStartTime, setQuestionStartTime] = useState(Date.now());
    const [isPaused, setIsPaused] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());

    const currentQuestion = config.questions[currentIndex];
    const progress = ((currentIndex + 1) / config.questions.length) * 100;
    const timeRemaining = config.timeLimit ? config.timeLimit - timeElapsed : null;

    // Timer
    useEffect(() => {
        if (isPaused || isComplete) return;

        const interval = setInterval(() => {
            setTimeElapsed(prev => {
                if (config.timeLimit && prev >= config.timeLimit) {
                    handleComplete();
                    return prev;
                }
                return prev + 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isPaused, isComplete, config.timeLimit]);

    const handleSelectOption = (optionId: string) => {
        if (showFeedback) return;
        setSelectedOption(optionId);
    };

    const handleSubmitAnswer = () => {
        if (!selectedOption) return;

        const isCorrect = selectedOption === currentQuestion.correctOptionId;
        const timeSpent = (Date.now() - questionStartTime) / 1000;

        setResults(prev => [...prev, {
            questionId: currentQuestion.id,
            selectedOptionId: selectedOption,
            isCorrect,
            timeSpent
        }]);

        setShowFeedback(true);
    };

    const handleNext = () => {
        if (currentIndex < config.questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setShowFeedback(false);
            setQuestionStartTime(Date.now());
        } else {
            handleComplete();
        }
    };

    const handleSkip = () => {
        if (!config.allowSkip) return;

        setResults(prev => [...prev, {
            questionId: currentQuestion.id,
            selectedOptionId: null,
            isCorrect: false,
            timeSpent: (Date.now() - questionStartTime) / 1000
        }]);

        handleNext();
    };

    const handleComplete = useCallback(() => {
        setIsComplete(true);
        onComplete(results, timeElapsed);
    }, [results, timeElapsed, onComplete]);

    const toggleFlag = () => {
        setFlaggedQuestions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(currentQuestion.id)) {
                newSet.delete(currentQuestion.id);
            } else {
                newSet.add(currentQuestion.id);
            }
            return newSet;
        });
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isComplete) {
        return <QuizResults results={results} questions={config.questions} totalTime={timeElapsed} />;
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header with timer and progress */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{config.title}</h2>

                    {/* Timer */}
                    {config.showTimer && (
                        <motion.div
                            animate={timeRemaining && timeRemaining < 60 ? { scale: [1, 1.05, 1] } : {}}
                            transition={{ duration: 0.5, repeat: timeRemaining && timeRemaining < 60 ? Infinity : 0 }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono text-lg ${timeRemaining && timeRemaining < 60
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                                }`}
                        >
                            <Clock className="w-5 h-5" />
                            {timeRemaining !== null ? formatTime(timeRemaining) : formatTime(timeElapsed)}
                        </motion.div>
                    )}
                </div>

                {/* Progress bar */}
                {config.showProgress && (
                    <div className="relative">
                        <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                        <div className="flex justify-between mt-2 text-sm text-zinc-500">
                            <span>Question {currentIndex + 1} of {config.questions.length}</span>
                            <span>{Math.round(progress)}% complete</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Question card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentQuestion.id}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-xl overflow-hidden"
                >
                    {/* Question header */}
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-700">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full font-medium">
                                        {currentQuestion.topicTitle}
                                    </span>
                                    <span className="text-xs text-zinc-400">
                                        {'⭐'.repeat(currentQuestion.difficulty)}
                                    </span>
                                    {flaggedQuestions.has(currentQuestion.id) && (
                                        <Flag className="w-4 h-4 text-orange-500 fill-orange-500" />
                                    )}
                                </div>

                                {currentQuestion.mathContent ? (
                                    <div className="text-lg">
                                        <BlockMath math={currentQuestion.mathContent} />
                                    </div>
                                ) : (
                                    <p className="text-lg text-zinc-900 dark:text-white">
                                        {currentQuestion.content}
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={toggleFlag}
                                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                            >
                                <Flag className={`w-5 h-5 ${flaggedQuestions.has(currentQuestion.id)
                                        ? 'text-orange-500 fill-orange-500'
                                        : 'text-zinc-400'
                                    }`} />
                            </button>
                        </div>
                    </div>

                    {/* Options */}
                    <div className="p-6 space-y-3">
                        {currentQuestion.options.map((option, index) => {
                            const isSelected = selectedOption === option.id;
                            const isCorrect = option.id === currentQuestion.correctOptionId;
                            const showCorrect = showFeedback && isCorrect;
                            const showIncorrect = showFeedback && isSelected && !isCorrect;

                            return (
                                <motion.button
                                    key={option.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => handleSelectOption(option.id)}
                                    disabled={showFeedback}
                                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${showCorrect
                                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                            : showIncorrect
                                                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                                : isSelected
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                    : 'border-zinc-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-zinc-50 dark:hover:bg-zinc-700/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Letter indicator */}
                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${showCorrect
                                                ? 'bg-green-500 text-white'
                                                : showIncorrect
                                                    ? 'bg-red-500 text-white'
                                                    : isSelected
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                                            }`}>
                                            {String.fromCharCode(65 + index)}
                                        </span>

                                        {/* Option content */}
                                        <span className="flex-1 text-zinc-900 dark:text-white">
                                            {option.mathContent ? (
                                                <BlockMath math={option.mathContent} />
                                            ) : (
                                                option.content
                                            )}
                                        </span>

                                        {/* Feedback icon */}
                                        {showCorrect && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: "spring", stiffness: 500 }}
                                            >
                                                <CheckCircle2 className="w-6 h-6 text-green-500" />
                                            </motion.div>
                                        )}
                                        {showIncorrect && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: "spring", stiffness: 500 }}
                                            >
                                                <XCircle className="w-6 h-6 text-red-500" />
                                            </motion.div>
                                        )}
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Explanation (shown after answer) */}
                    <AnimatePresence>
                        {showFeedback && currentQuestion.explanation && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="px-6 pb-6">
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                        <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                                            <Sparkles className="w-4 h-4" /> Explanation
                                        </h4>
                                        <p className="text-sm text-blue-700 dark:text-blue-400">
                                            {currentQuestion.explanation}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Actions */}
                    <div className="p-6 pt-0 flex items-center justify-between">
                        {config.allowSkip && !showFeedback && (
                            <button
                                onClick={handleSkip}
                                className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                            >
                                Skip this question
                            </button>
                        )}
                        {showFeedback && <div />}

                        {showFeedback ? (
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleNext}
                                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl flex items-center gap-2"
                            >
                                {currentIndex < config.questions.length - 1 ? 'Next Question' : 'View Results'}
                                <ChevronRight className="w-5 h-5" />
                            </motion.button>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSubmitAnswer}
                                disabled={!selectedOption}
                                className={`px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${selectedOption
                                        ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                        : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 cursor-not-allowed'
                                    }`}
                            >
                                Submit Answer
                            </motion.button>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// Quiz Results Component
function QuizResults({
    results,
    questions,
    totalTime
}: {
    results: QuizResult[];
    questions: QuizQuestion[];
    totalTime: number;
}) {
    const correctCount = results.filter(r => r.isCorrect).length;
    const scorePercent = Math.round((correctCount / questions.length) * 100);
    const avgTime = totalTime / questions.length;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto text-center"
        >
            {/* Score reveal */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="mb-8"
            >
                <div className="relative inline-block">
                    <svg className="w-48 h-48 transform -rotate-90">
                        <circle
                            cx="96"
                            cy="96"
                            r="80"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="12"
                            className="text-zinc-200 dark:text-zinc-700"
                        />
                        <motion.circle
                            cx="96"
                            cy="96"
                            r="80"
                            fill="none"
                            stroke="url(#scoreGradient)"
                            strokeWidth="12"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: scorePercent / 100 }}
                            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                        />
                        <defs>
                            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor={scorePercent >= 70 ? "#10B981" : scorePercent >= 50 ? "#F59E0B" : "#EF4444"} />
                                <stop offset="100%" stopColor={scorePercent >= 70 ? "#06B6D4" : scorePercent >= 50 ? "#F97316" : "#DC2626"} />
                            </linearGradient>
                        </defs>
                    </svg>
                    <motion.div
                        className="absolute inset-0 flex flex-col items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                    >
                        <span className="text-5xl font-bold text-zinc-900 dark:text-white">{scorePercent}%</span>
                        <span className="text-sm text-zinc-500">Score</span>
                    </motion.div>
                </div>
            </motion.div>

            {/* Celebration or encouragement */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="mb-8"
            >
                {scorePercent >= 80 ? (
                    <>
                        <Trophy className="w-12 h-12 mx-auto text-yellow-500 mb-3" />
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Excellent work!</h2>
                        <p className="text-zinc-500">You're mastering this material!</p>
                    </>
                ) : scorePercent >= 60 ? (
                    <>
                        <Target className="w-12 h-12 mx-auto text-blue-500 mb-3" />
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Good job!</h2>
                        <p className="text-zinc-500">Keep practicing to improve your score!</p>
                    </>
                ) : (
                    <>
                        <Zap className="w-12 h-12 mx-auto text-orange-500 mb-3" />
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Keep learning!</h2>
                        <p className="text-zinc-500">Review the material and try again.</p>
                    </>
                )}
            </motion.div>

            {/* Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 }}
                className="grid grid-cols-3 gap-4 mb-8"
            >
                <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
                    <div className="text-2xl font-bold text-green-600">{correctCount}</div>
                    <div className="text-sm text-zinc-500">Correct</div>
                </div>
                <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
                    <div className="text-2xl font-bold text-red-600">{questions.length - correctCount}</div>
                    <div className="text-sm text-zinc-500">Incorrect</div>
                </div>
                <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
                    <div className="text-2xl font-bold text-blue-600">{formatTime(avgTime)}</div>
                    <div className="text-sm text-zinc-500">Avg Time</div>
                </div>
            </motion.div>

            {/* Actions */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6 }}
                className="flex justify-center gap-4"
            >
                <button className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" /> Try Again
                </button>
                <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all">
                    Review Answers
                </button>
            </motion.div>
        </motion.div>
    );
}
