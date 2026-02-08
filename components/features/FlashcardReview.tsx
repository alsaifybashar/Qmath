'use client';

import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useState, useEffect } from 'react';
import { RotateCcw, ThumbsUp, ThumbsDown, Clock, Zap, Brain, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import dynamic from 'next/dynamic';
import 'katex/dist/katex.min.css';

const BlockMath = dynamic(() => import('react-katex').then((mod) => mod.BlockMath), { ssr: false });
const InlineMath = dynamic(() => import('react-katex').then((mod) => mod.InlineMath), { ssr: false });

// Types
export interface Flashcard {
    id: string;
    front: string;
    back: string;
    frontMath?: string;
    backMath?: string;
    difficulty: 1 | 2 | 3 | 4 | 5;
    dueDate: Date;
    interval: number; // days
    easeFactor: number;
    repetitions: number;
    topicId: string;
    topicTitle: string;
}

export interface FlashcardDeck {
    id: string;
    title: string;
    description: string;
    cards: Flashcard[];
    dueToday: number;
    totalCards: number;
    masteryLevel: number;
}

interface FlashcardReviewProps {
    deck: FlashcardDeck;
    onReview: (cardId: string, quality: number) => void;
    onComplete: () => void;
}

export default function FlashcardReview({ deck, onReview, onComplete }: FlashcardReviewProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [reviewedCards, setReviewedCards] = useState<Set<string>>(new Set());
    const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0, total: 0 });

    const dueCards = deck.cards.filter(c => new Date(c.dueDate) <= new Date());
    const currentCard = dueCards[currentIndex];

    const handleResponse = (quality: number) => {
        if (!currentCard) return;

        onReview(currentCard.id, quality);
        setReviewedCards(prev => new Set([...prev, currentCard.id]));

        setSessionStats(prev => ({
            correct: quality >= 3 ? prev.correct + 1 : prev.correct,
            incorrect: quality < 3 ? prev.incorrect + 1 : prev.incorrect,
            total: prev.total + 1
        }));

        // Move to next card
        if (currentIndex < dueCards.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setIsFlipped(false);
        } else {
            onComplete();
        }
    };

    if (dueCards.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center p-12 text-center"
            >
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-20 h-20 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center mb-6"
                >
                    <Sparkles className="w-10 h-10 text-white" />
                </motion.div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">All caught up!</h3>
                <p className="text-zinc-500 dark:text-zinc-400">No cards due for review. Check back later.</p>
            </motion.div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            {/* Header with progress */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{deck.title}</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {currentIndex + 1} of {dueCards.length} cards
                    </p>
                </div>

                {/* Progress ring */}
                <div className="relative w-16 h-16">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            className="text-zinc-200 dark:text-zinc-700"
                        />
                        <motion.circle
                            cx="32"
                            cy="32"
                            r="28"
                            fill="none"
                            stroke="url(#progressGradient)"
                            strokeWidth="4"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: (currentIndex + 1) / dueCards.length }}
                            transition={{ duration: 0.5 }}
                            style={{ pathLength: (currentIndex + 1) / dueCards.length }}
                        />
                        <defs>
                            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#8B5CF6" />
                                <stop offset="100%" stopColor="#EC4899" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-zinc-900 dark:text-white">
                        {Math.round(((currentIndex + 1) / dueCards.length) * 100)}%
                    </span>
                </div>
            </div>

            {/* Flashcard */}
            <div className="perspective-1000 mb-8">
                <motion.div
                    className="relative w-full h-80 cursor-pointer preserve-3d"
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    {/* Front */}
                    <motion.div
                        className="absolute inset-0 backface-hidden"
                        style={{ backfaceVisibility: 'hidden' }}
                    >
                        <div className="w-full h-full bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-700 shadow-xl flex flex-col items-center justify-center p-8">
                            <div className="text-xs uppercase tracking-wider text-zinc-400 mb-4">Question</div>
                            {currentCard?.frontMath ? (
                                <div className="text-2xl">
                                    <BlockMath math={currentCard.frontMath} />
                                </div>
                            ) : (
                                <p className="text-xl text-center text-zinc-900 dark:text-white font-medium">
                                    {currentCard?.front}
                                </p>
                            )}
                            <motion.div
                                animate={{ y: [0, 5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="mt-8 text-sm text-zinc-400"
                            >
                                Tap to reveal answer
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Back */}
                    <motion.div
                        className="absolute inset-0 backface-hidden"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                        <div className="w-full h-full bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-3xl border border-purple-200 dark:border-purple-800 shadow-xl flex flex-col items-center justify-center p-8">
                            <div className="text-xs uppercase tracking-wider text-purple-400 mb-4">Answer</div>
                            {currentCard?.backMath ? (
                                <div className="text-2xl">
                                    <BlockMath math={currentCard.backMath} />
                                </div>
                            ) : (
                                <p className="text-xl text-center text-zinc-900 dark:text-white font-medium">
                                    {currentCard?.back}
                                </p>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Response buttons - only show when flipped */}
            <AnimatePresence>
                {isFlipped && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="grid grid-cols-4 gap-3"
                    >
                        <ResponseButton
                            label="Again"
                            sublabel="< 1 min"
                            color="red"
                            onClick={() => handleResponse(0)}
                        />
                        <ResponseButton
                            label="Hard"
                            sublabel="< 10 min"
                            color="orange"
                            onClick={() => handleResponse(2)}
                        />
                        <ResponseButton
                            label="Good"
                            sublabel={`${currentCard?.interval || 1}d`}
                            color="blue"
                            onClick={() => handleResponse(3)}
                        />
                        <ResponseButton
                            label="Easy"
                            sublabel={`${Math.round((currentCard?.interval || 1) * 1.5)}d`}
                            color="green"
                            onClick={() => handleResponse(5)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Session stats */}
            {sessionStats.total > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-6 flex justify-center gap-6"
                >
                    <div className="flex items-center gap-2 text-sm">
                        <ThumbsUp className="w-4 h-4 text-green-500" />
                        <span className="text-green-600 dark:text-green-400 font-medium">{sessionStats.correct}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <ThumbsDown className="w-4 h-4 text-red-500" />
                        <span className="text-red-600 dark:text-red-400 font-medium">{sessionStats.incorrect}</span>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

// Response Button Component
function ResponseButton({
    label,
    sublabel,
    color,
    onClick
}: {
    label: string;
    sublabel: string;
    color: 'red' | 'orange' | 'blue' | 'green';
    onClick: () => void;
}) {
    const colorMap = {
        red: 'bg-red-500 hover:bg-red-600 shadow-red-500/30',
        orange: 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30',
        blue: 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/30',
        green: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30'
    };

    return (
        <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`${colorMap[color]} text-white rounded-xl py-3 px-4 shadow-lg transition-colors`}
        >
            <div className="font-semibold">{label}</div>
            <div className="text-xs opacity-80">{sublabel}</div>
        </motion.button>
    );
}

// Progress Ring Component for deck overview
export function DeckProgressRing({ deck }: { deck: FlashcardDeck }) {
    const circumference = 2 * Math.PI * 40;
    const progress = deck.masteryLevel / 100;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            className="relative w-28 h-28 cursor-pointer"
        >
            <svg className="w-full h-full transform -rotate-90">
                <circle
                    cx="56"
                    cy="56"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    className="text-zinc-200 dark:text-zinc-700"
                />
                <motion.circle
                    cx="56"
                    cy="56"
                    r="40"
                    fill="none"
                    stroke="url(#deckGradient)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference * (1 - progress) }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                />
                <defs>
                    <linearGradient id="deckGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366F1" />
                        <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-zinc-900 dark:text-white">{deck.masteryLevel}%</span>
                <span className="text-xs text-zinc-500">mastery</span>
            </div>
        </motion.div>
    );
}
