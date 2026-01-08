'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Brain, Target, AlertTriangle, Zap, ArrowRight, Clock, BookOpen,
    TrendingUp, BarChart3, Sparkles, ArrowLeft, Home
} from 'lucide-react';

const practiceOptions = [
    {
        id: 'adaptive',
        title: 'Adaptive Practice',
        description: 'AI selects questions based on your knowledge state',
        icon: Brain,
        color: 'from-purple-500 to-pink-500',
        bgColor: 'bg-purple-100 dark:bg-purple-500/10',
        borderColor: 'border-purple-200 dark:border-purple-500/30',
        textColor: 'text-purple-600 dark:text-purple-400',
        href: '/study',
        badge: 'Recommended',
        stats: { questions: 'Dynamic', difficulty: 'Auto-adjusted' }
    },
    {
        id: 'weak-areas',
        title: 'Weak Areas',
        description: 'Focus on topics where you need the most improvement',
        icon: AlertTriangle,
        color: 'from-red-500 to-orange-500',
        bgColor: 'bg-red-100 dark:bg-red-500/10',
        borderColor: 'border-red-200 dark:border-red-500/30',
        textColor: 'text-red-600 dark:text-red-400',
        href: '/study',
        badge: '5 topics need attention',
        stats: { questions: '45', difficulty: 'Targeted' }
    },
    {
        id: 'quick',
        title: 'Quick Practice',
        description: 'A short 10-question session for daily practice',
        icon: Zap,
        color: 'from-yellow-500 to-orange-500',
        bgColor: 'bg-yellow-100 dark:bg-yellow-500/10',
        borderColor: 'border-yellow-200 dark:border-yellow-500/30',
        textColor: 'text-yellow-600 dark:text-yellow-400',
        href: '/study',
        badge: '~10 min',
        stats: { questions: '10', difficulty: 'Mixed' }
    }
];

const recentTopics = [
    { id: 'integration', name: 'Integration by Parts', course: 'Calculus I', mastery: 45, color: 'text-blue-500' },
    { id: 'eigenvalues', name: 'Eigenvalues & Eigenvectors', course: 'Linear Algebra', mastery: 62, color: 'text-purple-500' },
    { id: 'limits', name: 'Limits & Continuity', course: 'Calculus I', mastery: 88, color: 'text-green-500' }
];

export default function PracticePage() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white transition-colors">
            <div className="fixed inset-0 bg-gradient-to-br from-purple-100/50 via-transparent to-blue-100/50 dark:from-purple-900/20 dark:via-black dark:to-blue-900/20"></div>
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
                        <Link href="/courses" className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                            Courses
                        </Link>
                        <Link href="/ai/chat" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2">
                            <Brain className="w-4 h-4" />
                            AI Tutor
                        </Link>
                    </div>
                </div>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-bold mb-2">Practice</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Choose your practice mode and start learning</p>
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
                                        <span className="block">{option.stats.questions} questions</span>
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
                            <h2 className="text-xl font-bold">Practice by Topic</h2>
                        </div>
                        <Link href="/courses" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                            View all topics
                        </Link>
                    </div>

                    <div className="grid gap-3">
                        {recentTopics.map((topic) => (
                            <Link
                                key={topic.id}
                                href={`/study`}
                                className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
                                        <BookOpen className={`w-5 h-5 ${topic.color}`} />
                                    </div>
                                    <div>
                                        <div className="font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{topic.name}</div>
                                        <div className="text-sm text-zinc-500">{topic.course}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-sm font-medium">{topic.mastery}%</div>
                                        <div className="text-xs text-zinc-500">Mastery</div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                </div>
                            </Link>
                        ))}
                    </div>
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
                        <div className="text-xs text-zinc-500">Weekly Growth</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center">
                        <BarChart3 className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                        <div className="text-xl font-bold">156</div>
                        <div className="text-xs text-zinc-500">Questions This Week</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center">
                        <Clock className="w-5 h-5 text-purple-500 mx-auto mb-2" />
                        <div className="text-xl font-bold">4.5h</div>
                        <div className="text-xs text-zinc-500">Study Time</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center">
                        <Sparkles className="w-5 h-5 text-yellow-500 mx-auto mb-2" />
                        <div className="text-xl font-bold">7</div>
                        <div className="text-xs text-zinc-500">Day Streak</div>
                    </div>
                </motion.div>

                {/* Bottom Actions */}
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
                        href="/flashcards"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium transition-all"
                    >
                        Review Flashcards
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
