'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Layers, Plus, Play, BarChart3, Clock, Zap, BookOpen,
    ArrowRight, TrendingUp, Calendar, ChevronRight, ArrowLeft
} from 'lucide-react';

const decks = [
    {
        id: 'calculus',
        name: 'Calculus I',
        cardsDue: 24,
        totalCards: 156,
        mastery: 68,
        streak: 5,
        color: 'from-blue-500 to-cyan-500',
        lastReviewed: '2 hours ago'
    },
    {
        id: 'linear-algebra',
        name: 'Linear Algebra',
        cardsDue: 12,
        totalCards: 98,
        mastery: 72,
        streak: 3,
        color: 'from-purple-500 to-pink-500',
        lastReviewed: '1 day ago'
    },
    {
        id: 'physics',
        name: 'Mechanics',
        cardsDue: 8,
        totalCards: 124,
        mastery: 54,
        streak: 0,
        color: 'from-orange-500 to-red-500',
        lastReviewed: '3 days ago'
    }
];

const stats = {
    totalCards: 378,
    cardsReviewedToday: 45,
    currentStreak: 7,
    averageAccuracy: 82
};

export default function FlashcardsPage() {
    const totalDue = decks.reduce((sum, deck) => sum + deck.cardsDue, 0);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white transition-colors">
            <div className="fixed inset-0 bg-gradient-to-br from-indigo-100/50 via-transparent to-purple-100/50 dark:from-indigo-900/20 dark:via-black dark:to-purple-900/20"></div>
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
                {/* Top Nav */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <Link href="/" className="font-bold text-xl">Qmath</Link>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/practice" className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                            Practice
                        </Link>
                        <Link href="/ai/chat" className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                            AI Tutor
                        </Link>
                    </div>
                </div>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center md:justify-between mb-8"
                >
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Flashcards</h1>
                        <p className="text-zinc-500 dark:text-zinc-400">Spaced repetition for long-term retention</p>
                    </div>
                    <div className="flex gap-3 mt-4 md:mt-0">
                        <Link
                            href="/flashcards/review"
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-xl transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Create Card
                        </Link>
                        {totalDue > 0 && (
                            <Link
                                href="/flashcards/review"
                                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/20"
                            >
                                <Play className="w-4 h-4" />
                                Review ({totalDue} due)
                            </Link>
                        )}
                    </div>
                </motion.div>

                {/* Stats Overview */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                >
                    <div className="bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
                        <Layers className="w-6 h-6 text-blue-500 mb-3" />
                        <div className="text-2xl font-bold">{stats.totalCards}</div>
                        <div className="text-sm text-zinc-500">Total Cards</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
                        <Calendar className="w-6 h-6 text-green-500 mb-3" />
                        <div className="text-2xl font-bold">{stats.cardsReviewedToday}</div>
                        <div className="text-sm text-zinc-500">Reviewed Today</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
                        <Zap className="w-6 h-6 text-orange-500 mb-3" />
                        <div className="text-2xl font-bold">{stats.currentStreak}</div>
                        <div className="text-sm text-zinc-500">Day Streak</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
                        <TrendingUp className="w-6 h-6 text-purple-500 mb-3" />
                        <div className="text-2xl font-bold">{stats.averageAccuracy}%</div>
                        <div className="text-sm text-zinc-500">Accuracy</div>
                    </div>
                </motion.div>

                {/* Review CTA */}
                {totalDue > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="mb-8"
                    >
                        <Link
                            href="/flashcards/review"
                            className="block bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-500/20 dark:to-pink-500/20 border border-purple-200 dark:border-purple-500/30 rounded-2xl p-6 hover:border-purple-300 dark:hover:border-purple-500/50 transition-all group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-purple-200 dark:bg-purple-500/20 rounded-xl">
                                        <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">Cards Due for Review</h3>
                                        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                                            {totalDue} cards are ready to review across {decks.filter(d => d.cardsDue > 0).length} decks
                                        </p>
                                    </div>
                                </div>
                                <ArrowRight className="w-6 h-6 text-purple-600 dark:text-purple-400 group-hover:translate-x-2 transition-transform" />
                            </div>
                        </Link>
                    </motion.div>
                )}

                {/* Decks */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold">My Decks</h2>
                        <Link href="/flashcards/review" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                            Create Deck
                        </Link>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {decks.map((deck, i) => (
                            <motion.div
                                key={deck.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 + i * 0.05 }}
                            >
                                <Link
                                    href={`/flashcards/review`}
                                    className="block bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${deck.color} flex items-center justify-center`}>
                                            <BookOpen className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{deck.name}</h3>
                                            <p className="text-xs text-zinc-500">{deck.totalCards} cards</p>
                                        </div>
                                        {deck.cardsDue > 0 && (
                                            <div className="px-2 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded text-xs font-medium">
                                                {deck.cardsDue} due
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="text-zinc-500">Mastery</span>
                                            <span className="text-zinc-600 dark:text-zinc-400">{deck.mastery}%</span>
                                        </div>
                                        <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full bg-gradient-to-r ${deck.color}`}
                                                style={{ width: `${deck.mastery}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-zinc-500">
                                        <span>Last reviewed {deck.lastReviewed}</span>
                                        {deck.streak > 0 && (
                                            <span className="flex items-center gap-1 text-orange-500">
                                                <Zap className="w-3 h-3" /> {deck.streak} day streak
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="grid md:grid-cols-2 gap-4 mb-8"
                >
                    <Link
                        href="/progress"
                        className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <Layers className="w-5 h-5 text-blue-500" />
                            <span>Browse All Cards</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                    </Link>
                    <Link
                        href="/progress"
                        className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <BarChart3 className="w-5 h-5 text-purple-500" />
                            <span>View Statistics</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                    </Link>
                </motion.div>

                {/* Bottom Navigation */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl font-medium transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                    <Link
                        href="/exams"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium transition-all"
                    >
                        Exam Prep
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
