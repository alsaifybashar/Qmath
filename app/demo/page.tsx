'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/Header';
import dynamic from 'next/dynamic';
import 'katex/dist/katex.min.css';
import {
    Play, ArrowRight, CheckCircle2, Brain, Sparkles,
    ChevronRight, RefreshCw, Target, Zap
} from 'lucide-react';

const BlockMath = dynamic(() => import('react-katex').then((mod) => mod.BlockMath), { ssr: false });

const demoQuestions = [
    {
        id: 1,
        question: 'What is the derivative of $f(x) = x^3$?',
        math: 'f(x) = x^3',
        options: ['$3x^2$', '$x^2$', '$3x^3$', '$2x^3$'],
        correct: 0,
        explanation: 'Using the power rule: $\\frac{d}{dx}x^n = nx^{n-1}$, we get $\\frac{d}{dx}x^3 = 3x^2$'
    },
    {
        id: 2,
        question: 'Evaluate the integral:',
        math: '\\int 2x \\, dx',
        options: ['$x^2 + C$', '$2x^2 + C$', '$x + C$', '$\\frac{x^2}{2} + C$'],
        correct: 0,
        explanation: 'Using the power rule for integration: $\\int x^n dx = \\frac{x^{n+1}}{n+1} + C$'
    },
    {
        id: 3,
        question: 'Find the eigenvalues of the matrix:',
        math: 'A = \\begin{pmatrix} 2 & 0 \\\\ 0 & 3 \\end{pmatrix}',
        options: ['$\\lambda = 2, 3$', '$\\lambda = 0, 5$', '$\\lambda = 2, 2$', '$\\lambda = 3, 3$'],
        correct: 0,
        explanation: 'For a diagonal matrix, the eigenvalues are the diagonal elements: $\\lambda_1 = 2, \\lambda_2 = 3$'
    }
];

export default function DemoPage() {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);
    const [started, setStarted] = useState(false);

    const question = demoQuestions[currentQuestion];

    const handleAnswer = (index: number) => {
        if (showResult) return;
        setSelectedAnswer(index);
        setShowResult(true);
        if (index === question.correct) {
            setScore(s => s + 1);
        }
    };

    const nextQuestion = () => {
        if (currentQuestion < demoQuestions.length - 1) {
            setCurrentQuestion(c => c + 1);
            setSelectedAnswer(null);
            setShowResult(false);
        }
    };

    const restartDemo = () => {
        setCurrentQuestion(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setScore(0);
    };

    const isComplete = currentQuestion === demoQuestions.length - 1 && showResult;

    if (!started) {
        return (
            <main className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white">
                <Header />

                <section className="relative min-h-screen flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10"></div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative z-10 max-w-2xl text-center"
                    >
                        <div className="inline-flex p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-8">
                            <Play className="w-8 h-8 text-white" />
                        </div>

                        <h1 className="text-5xl font-bold mb-6">Try Qmath Now</h1>
                        <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-8">
                            Experience adaptive learning in action. Answer a few questions and see how our AI adapts to your level.
                        </p>

                        <div className="grid grid-cols-3 gap-4 mb-12 max-w-md mx-auto">
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                <Brain className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                                <div className="text-xs text-zinc-500">Adaptive</div>
                            </div>
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                <Target className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                                <div className="text-xs text-zinc-500">Personalized</div>
                            </div>
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                <Zap className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                                <div className="text-xs text-zinc-500">Instant Feedback</div>
                            </div>
                        </div>

                        <button
                            onClick={() => setStarted(true)}
                            className="px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-lg transition-all flex items-center gap-3 mx-auto shadow-xl shadow-blue-500/20"
                        >
                            Start Demo
                            <ArrowRight className="w-5 h-5" />
                        </button>

                        <p className="text-sm text-zinc-500 mt-6">
                            No signup required • 3 sample questions
                        </p>
                    </motion.div>
                </section>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white">
            <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>

            <div className="relative z-10 max-w-3xl mx-auto px-4 py-12">
                {/* Progress */}
                <div className="flex items-center justify-between mb-8">
                    <div className="text-sm text-zinc-500">
                        Question {currentQuestion + 1} of {demoQuestions.length}
                    </div>
                    <div className="flex gap-2">
                        {demoQuestions.map((_, i) => (
                            <div
                                key={i}
                                className={`w-8 h-1 rounded-full ${i <= currentQuestion ? 'bg-blue-500' : 'bg-zinc-700'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Question Card */}
                <AnimatePresence mode="wait">
                    {!isComplete ? (
                        <motion.div
                            key={currentQuestion}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8"
                        >
                            <div className="flex items-center gap-2 mb-6">
                                <Sparkles className="w-5 h-5 text-purple-400" />
                                <span className="text-sm text-purple-400">Demo Question</span>
                            </div>

                            <h2 className="text-xl mb-6">{question.question}</h2>

                            <div className="flex justify-center mb-8 p-6 bg-zinc-800/50 rounded-xl">
                                <BlockMath math={question.math} />
                            </div>

                            <div className="space-y-3 mb-6">
                                {question.options.map((option, i) => {
                                    const isSelected = selectedAnswer === i;
                                    const isCorrect = i === question.correct;
                                    let className = 'border-zinc-700 hover:border-blue-500/50';

                                    if (showResult) {
                                        if (isCorrect) {
                                            className = 'border-green-500 bg-green-500/10';
                                        } else if (isSelected && !isCorrect) {
                                            className = 'border-red-500 bg-red-500/10';
                                        }
                                    }

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => handleAnswer(i)}
                                            disabled={showResult}
                                            className={`w-full p-4 text-left rounded-xl border transition-all flex items-center gap-4 ${className}`}
                                        >
                                            <span className="w-8 h-8 flex items-center justify-center rounded-full border border-zinc-600 text-sm">
                                                {String.fromCharCode(65 + i)}
                                            </span>
                                            <BlockMath math={option.replace(/\$/g, '')} />
                                            {showResult && isCorrect && (
                                                <CheckCircle2 className="w-5 h-5 text-green-400 ml-auto" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {showResult && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-6"
                                >
                                    <div className="font-medium text-blue-400 mb-2">Explanation:</div>
                                    <BlockMath math={question.explanation.replace(/\$/g, '')} />
                                </motion.div>
                            )}

                            {showResult && currentQuestion < demoQuestions.length - 1 && (
                                <button
                                    onClick={nextQuestion}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    Next Question
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-3xl p-12 text-center"
                        >
                            <div className="text-6xl mb-6">🎉</div>
                            <h2 className="text-3xl font-bold mb-4">Demo Complete!</h2>
                            <p className="text-xl text-zinc-400 mb-8">
                                You scored {score}/{demoQuestions.length}
                            </p>

                            <div className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20 mb-8">
                                <p className="text-zinc-300">
                                    This was just a taste! The full Qmath experience includes adaptive difficulty, personalized learning paths, and AI-powered explanations.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href="/register"
                                    className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    Sign Up Free
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                                <button
                                    onClick={restartDemo}
                                    className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                    Try Again
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Back to Home */}
                <div className="text-center mt-8">
                    <Link href="/" className="text-zinc-500 hover:text-white transition-colors text-sm">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </main>
    );
}
