'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Layers, Plus, Play, BarChart3, Clock, Zap, BookOpen,
    ArrowRight, TrendingUp, Calendar, ChevronRight
} from 'lucide-react';

const decks = [
    {
        id: 'calculus',
        name: 'Envariabelanalys 1',
        cardsDue: 24,
        totalCards: 156,
        mastery: 68,
        streak: 5,
        color: 'from-blue-500 to-cyan-500',
        lastReviewed: 'för 2 timmar sedan'
    },
    {
        id: 'linear-algebra',
        name: 'Linjär algebra',
        cardsDue: 12,
        totalCards: 98,
        mastery: 72,
        streak: 3,
        color: 'from-purple-500 to-pink-500',
        lastReviewed: 'för 1 dag sedan'
    },
    {
        id: 'physics',
        name: 'Mekanik',
        cardsDue: 8,
        totalCards: 124,
        mastery: 54,
        streak: 0,
        color: 'from-orange-500 to-red-500',
        lastReviewed: 'för 3 dagar sedan'
    }
];

const stats = {
    totalCards: 378,
    cardsReviewedToday: 45,
    currentStreak: 7,
    averageAccuracy: 82
};

export default function FlashcardsPage() {

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center md:justify-between mb-8"
            >
                <div>
                    <h1 className="text-4xl font-bold mb-2">Flashcards</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Upprepad repetition för långsiktigt minne</p>
                </div>
                <div className="flex gap-3 mt-4 md:mt-0">
                    <Link
                        href="/flashcards"
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-xl transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Skapa kort
                    </Link>
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
                    <div className="text-sm text-zinc-500">Totalt antal kort</div>
                </div>
                <div className="bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
                    <Calendar className="w-6 h-6 text-green-500 mb-3" />
                    <div className="text-2xl font-bold">{stats.cardsReviewedToday}</div>
                    <div className="text-sm text-zinc-500">Repeterade idag</div>
                </div>
                <div className="bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
                    <Zap className="w-6 h-6 text-orange-500 mb-3" />
                    <div className="text-2xl font-bold">{stats.currentStreak}</div>
                    <div className="text-sm text-zinc-500">Dagar i rad</div>
                </div>
                <div className="bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
                    <TrendingUp className="w-6 h-6 text-purple-500 mb-3" />
                    <div className="text-2xl font-bold">{stats.averageAccuracy}%</div>
                    <div className="text-sm text-zinc-500">Noggrannhet</div>
                </div>
            </motion.div>


            {/* Decks */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Mina kortlekar</h2>
                    <Link href="/flashcards" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                        Skapa kortlek
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
                                        <p className="text-xs text-zinc-500">{deck.totalCards} kort</p>
                                    </div>
                                    {deck.cardsDue > 0 && (
                                        <div className="px-2 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded text-xs font-medium">
                                            {deck.cardsDue} att göra
                                        </div>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="text-zinc-500">Bemästring</span>
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
                                    <span>Senast repeterad {deck.lastReviewed}</span>
                                    {deck.streak > 0 && (
                                        <span className="flex items-center gap-1 text-orange-500">
                                            <Zap className="w-3 h-3" /> {deck.streak} dagar i rad
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
                    href="/flashcards"
                    className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <Layers className="w-5 h-5 text-blue-500" />
                        <span>Bläddra bland alla kort</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </Link>
                <Link
                    href="/flashcards"
                    className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <BarChart3 className="w-5 h-5 text-purple-500" />
                        <span>Se statistik</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                </Link>
            </motion.div>

        </div>
    );
}
