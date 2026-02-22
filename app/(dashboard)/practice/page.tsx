'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Brain, Target, AlertTriangle, Zap, ArrowRight, Clock, BookOpen,
    TrendingUp, BarChart3, Sparkles, Loader2
} from 'lucide-react';
import { getPracticeTopics } from '@/app/actions/study-questions';
import type { PracticeTopic } from '@/app/actions/study-questions';

const practiceOptions = [
    {
        id: 'adaptive',
        title: 'Adaptiv övning',
        description: 'AI väljer frågor baserat på din kunskapsnivå',
        icon: Brain,
        color: 'from-purple-500 to-pink-500',
        bgColor: 'bg-purple-100 dark:bg-purple-500/10',
        borderColor: 'border-purple-200 dark:border-purple-500/30',
        textColor: 'text-purple-600 dark:text-purple-400',
        href: '/study',
        badge: 'Rekommenderad',
        stats: { questions: 'Dynamisk', difficulty: 'Auto-justerad' }
    },
    {
        id: 'weak-areas',
        title: 'Svaga områden',
        description: 'Fokusera på ämnen där du behöver mest förbättring',
        icon: AlertTriangle,
        color: 'from-red-500 to-orange-500',
        bgColor: 'bg-red-100 dark:bg-red-500/10',
        borderColor: 'border-red-200 dark:border-red-500/30',
        textColor: 'text-red-600 dark:text-red-400',
        href: '/study',
        badge: '5 ämnen behöver uppmärksamhet',
        stats: { questions: '45', difficulty: 'Riktad' }
    },
    {
        id: 'quick',
        title: 'Snabbövning',
        description: 'En kort session med 10 frågor för daglig övning',
        icon: Zap,
        color: 'from-yellow-500 to-orange-500',
        bgColor: 'bg-yellow-100 dark:bg-yellow-500/10',
        borderColor: 'border-yellow-200 dark:border-yellow-500/30',
        textColor: 'text-yellow-600 dark:text-yellow-400',
        href: '/study',
        badge: '~10 min',
        stats: { questions: '10', difficulty: 'Blandad' }
    }
];

const topicColors = [
    'text-blue-500',
    'text-purple-500',
    'text-green-500',
    'text-rose-500',
    'text-amber-500',
    'text-teal-500',
];

export default function PracticePage() {
    const [topics, setTopics] = useState<PracticeTopic[]>([]);
    const [loadingTopics, setLoadingTopics] = useState(true);

    useEffect(() => {
        getPracticeTopics()
            .then(setTopics)
            .finally(() => setLoadingTopics(false));
    }, []);

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-4xl font-bold mb-2">Övning</h1>
                <p className="text-zinc-500 dark:text-zinc-400">Välj ditt övningsläge och börja lära dig</p>
            </motion.div>

            {/* Practice Options */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
                {practiceOptions.map((option, i) => (
                    <motion.div
                        key={option.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i }}
                    >
                        <Link
                            href={option.href}
                            className={`block h-full bg-white dark:bg-zinc-900/80 backdrop-blur-xl border ${option.borderColor} rounded-2xl p-6 hover:scale-[1.02] transition-all group`}
                        >
                            <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${option.color} mb-4`}>
                                <option.icon className="w-6 h-6 text-white" />
                            </div>

                            {option.badge && (
                                <div className={`inline-block px-2 py-1 ${option.bgColor} rounded text-xs font-medium mb-3 ${option.textColor}`}>
                                    {option.badge}
                                </div>
                            )}

                            <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {option.title}
                            </h3>
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">{option.description}</p>

                            <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                <div className="text-xs text-zinc-500">
                                    <span className="block">{option.stats.questions} frågor</span>
                                    <span className="block">{option.stats.difficulty}</span>
                                </div>
                                <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>

            {/* Topic Practice */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 mb-8"
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-blue-500" />
                        <h2 className="text-xl font-bold">Öva efter ämne</h2>
                    </div>
                    <Link href="/courses" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                        Se alla ämnen
                    </Link>
                </div>

                {loadingTopics ? (
                    <div className="flex items-center justify-center py-8 text-zinc-400">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Laddar ämnen...
                    </div>
                ) : topics.length === 0 ? (
                    <div className="text-center py-8 text-zinc-400 text-sm">
                        Inga publicerade frågor ännu. Kontakta din administratör.
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {topics.map((topic, i) => (
                            <Link
                                key={topic.id}
                                href={`/study?topic=${topic.id}`}
                                className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
                                        <BookOpen className={`w-5 h-5 ${topicColors[i % topicColors.length]}`} />
                                    </div>
                                    <div>
                                        <div className="font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {topic.title}
                                        </div>
                                        <div className="text-sm text-zinc-500">{topic.courseName} · {topic.courseCode}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-sm font-medium">{topic.publishedCount}</div>
                                        <div className="text-xs text-zinc-500">frågor</div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Quick Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
                <div className="bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center">
                    <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-2" />
                    <div className="text-xl font-bold">+12%</div>
                    <div className="text-xs text-zinc-500">Veckotillväxt</div>
                </div>
                <div className="bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center">
                    <BarChart3 className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                    <div className="text-xl font-bold">156</div>
                    <div className="text-xs text-zinc-500">Frågor denna vecka</div>
                </div>
                <div className="bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center">
                    <Clock className="w-5 h-5 text-purple-500 mx-auto mb-2" />
                    <div className="text-xl font-bold">4.5h</div>
                    <div className="text-xs text-zinc-500">Studietid</div>
                </div>
                <div className="bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center">
                    <Sparkles className="w-5 h-5 text-yellow-500 mx-auto mb-2" />
                    <div className="text-xl font-bold">7</div>
                    <div className="text-xs text-zinc-500">Dagar i rad</div>
                </div>
            </motion.div>

        </div>
    );
}
