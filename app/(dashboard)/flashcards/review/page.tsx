'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import 'katex/dist/katex.min.css';
import {
    ArrowLeft, RotateCcw, ThumbsUp, ThumbsDown, Clock,
    CheckCircle2, XCircle, Zap, Brain, ArrowRight
} from 'lucide-react';

const BlockMath = dynamic(() => import('react-katex').then((mod) => mod.BlockMath), { ssr: false });

const sampleCards = [
    {
        id: 1,
        front: 'What is the derivative of $\\sin(x)$?',
        back: '$\\cos(x)$',
        deck: 'Calculus I'
    },
    {
        id: 2,
        front: 'State the Pythagorean Theorem',
        back: '$a^2 + b^2 = c^2$',
        deck: 'Geometry'
    },
    {
        id: 3,
        front: 'What is the integral of $\\frac{1}{x}$?',
        back: '$\\ln|x| + C$',
        deck: 'Calculus I'
    },
    {
        id: 4,
        front: 'What is the determinant of a 2x2 matrix $\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$?',
        back: '$ad - bc$',
        deck: 'Linear Algebra'
    }
];

export default function FlashcardReviewPage() {
    const [cards] = useState(sampleCards);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [stats, setStats] = useState({ easy: 0, hard: 0, again: 0 });
    const [startTime] = useState(Date.now());
    const [sessionTime, setSessionTime] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setSessionTime(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
        return () => clearInterval(timer);
    }, [startTime]);

    const currentCard = cards[currentIndex];

    const handleResponse = (difficulty: 'again' | 'hard' | 'easy') => {
        setStats(prev => ({ ...prev, [difficulty]: prev[difficulty] + 1 }));

        if (currentIndex < cards.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setFlipped(false);
        } else {
            setCompleted(true);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const renderMath = (content: string) => {
        const parts = content.split(/(\$.*?\$)/g);
        return parts.map((part, i) => {
            if (part.startsWith('$') && part.endsWith('$')) {
                const math = part.slice(1, -1);
                return <BlockMath key={i} math={math} />;
            }
            return <span key={i}>{part}</span>;
        });
    };

    if (completed) {
        const total = stats.easy + stats.hard + stats.again;
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center"
                >
                    <div className="text-5xl mb-6">🎉</div>
                    <h1 className="text-3xl font-bold mb-2">Session Complete!</h1>
                    <p className="text-zinc-400 mb-8">You reviewed {total} cards in {formatTime(sessionTime)}</p>

                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                            <CheckCircle2 className="w-6 h-6 text-green-400 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-green-400">{stats.easy}</div>
                            <div className="text-xs text-zinc-500">Easy</div>
                        </div>
                        <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                            <Brain className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-yellow-400">{stats.hard}</div>
                            <div className="text-xs text-zinc-500">Hard</div>
                        </div>
                        <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                            <RotateCcw className="w-6 h-6 text-red-400 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-red-400">{stats.again}</div>
                            <div className="text-xs text-zinc-500">Again</div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Link
                            href="/flashcards"
                            className="block w-full py-4 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold transition-all"
                        >
                            Back to Flashcards
                        </Link>
                        <button
                            onClick={() => {
                                setCurrentIndex(0);
                                setFlipped(false);
                                setCompleted(false);
                                setStats({ easy: 0, hard: 0, again: 0 });
                            }}
                            className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-medium transition-all"
                        >
                            Review Again
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>

            <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Link
                        href="/flashcards"
                        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Exit
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-zinc-500">
                            <Clock className="w-4 h-4" />
                            {formatTime(sessionTime)}
                        </div>
                        <div className="flex items-center gap-2 text-zinc-500">
                            <Zap className="w-4 h-4" />
                            {currentIndex + 1}/{cards.length}
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-zinc-800 rounded-full mb-8">
                    <div
                        className="h-full bg-purple-500 rounded-full transition-all"
                        style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
                    />
                </div>

                {/* Card */}
                <div className="perspective-1000 mb-8">
                    <motion.div
                        key={currentCard.id}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        onClick={() => setFlipped(!flipped)}
                        className="cursor-pointer"
                    >
                        <div
                            className={`relative w-full min-h-[300px] transition-transform duration-500 transform-style-preserve-3d ${flipped ? 'rotate-y-180' : ''
                                }`}
                            style={{ transformStyle: 'preserve-3d' }}
                        >
                            {/* Front */}
                            <div
                                className={`absolute inset-0 bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center justify-center backface-hidden ${flipped ? 'opacity-0' : 'opacity-100'
                                    }`}
                            >
                                <div className="text-xs text-purple-400 mb-4">{currentCard.deck}</div>
                                <div className="text-xl text-center">{renderMath(currentCard.front)}</div>
                                <div className="absolute bottom-6 text-sm text-zinc-500">Tap to flip</div>
                            </div>

                            {/* Back */}
                            <div
                                className={`absolute inset-0 bg-zinc-900 border border-purple-500/30 rounded-3xl p-8 flex flex-col items-center justify-center ${flipped ? 'opacity-100' : 'opacity-0'
                                    }`}
                            >
                                <div className="text-xs text-purple-400 mb-4">Answer</div>
                                <div className="text-2xl text-center font-bold">{renderMath(currentCard.back)}</div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Response buttons */}
                <AnimatePresence>
                    {flipped && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="grid grid-cols-3 gap-4"
                        >
                            <button
                                onClick={() => handleResponse('again')}
                                className="py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl transition-all"
                            >
                                <RotateCcw className="w-5 h-5 text-red-400 mx-auto mb-1" />
                                <span className="text-sm text-red-400">Again</span>
                                <div className="text-xs text-zinc-500 mt-1">&lt; 1 min</div>
                            </button>
                            <button
                                onClick={() => handleResponse('hard')}
                                className="py-4 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-xl transition-all"
                            >
                                <Brain className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                                <span className="text-sm text-yellow-400">Hard</span>
                                <div className="text-xs text-zinc-500 mt-1">10 min</div>
                            </button>
                            <button
                                onClick={() => handleResponse('easy')}
                                className="py-4 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-xl transition-all"
                            >
                                <CheckCircle2 className="w-5 h-5 text-green-400 mx-auto mb-1" />
                                <span className="text-sm text-green-400">Easy</span>
                                <div className="text-xs text-zinc-500 mt-1">4 days</div>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Keyboard shortcuts hint */}
                <div className="text-center text-zinc-600 text-sm mt-8">
                    Press <kbd className="px-2 py-1 bg-zinc-800 rounded">Space</kbd> to flip,{' '}
                    <kbd className="px-2 py-1 bg-zinc-800 rounded">1</kbd>{' '}
                    <kbd className="px-2 py-1 bg-zinc-800 rounded">2</kbd>{' '}
                    <kbd className="px-2 py-1 bg-zinc-800 rounded">3</kbd> to rate
                </div>
            </div>
        </div>
    );
}
