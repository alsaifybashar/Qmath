'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Brain, Target, AlertTriangle, Zap, ArrowRight, Clock, BookOpen,
    TrendingUp, BarChart3, Sparkles
} from 'lucide-react';

const practiceOptions = [
    {
        id: 'adaptive',
        title: 'Adaptive Practice',
        description: 'AI selects questions based on your knowledge state',
        icon: Brain,
        color: 'from-purple-500 to-pink-500',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30',
        href: '/practice/adaptive',
        badge: 'Recommended',
        stats: { questions: 'Dynamic', difficulty: 'Auto-adjusted' }
    },
    {
        id: 'weak-areas',
        title: 'Weak Areas',
        description: 'Focus on topics where you need the most improvement',
        icon: AlertTriangle,
        color: 'from-red-500 to-orange-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        href: '/practice/weak-areas',
        badge: '5 topics need attention',
        stats: { questions: '45', difficulty: 'Targeted' }
    },
    {
        id: 'quick',
        title: 'Quick Practice',
        description: 'A short 10-question session for daily practice',
        icon: Zap,
        color: 'from-yellow-500 to-orange-500',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        href: '/study',
        badge: '~10 min',
        stats: { questions: '10', difficulty: 'Mixed' }
    }
];

const recentTopics = [
    { id: 'integration', name: 'Integration by Parts', course: 'Calculus I', mastery: 45, color: 'text-blue-400' },
    { id: 'eigenvalues', name: 'Eigenvalues & Eigenvectors', course: 'Linear Algebra', mastery: 62, color: 'text-purple-400' },
    { id: 'limits', name: 'Limits & Continuity', course: 'Calculus I', mastery: 88, color: 'text-green-400' }
];

export default function PracticePage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <h1 className="text-4xl font-bold mb-2">Practice</h1>
                    <p className="text-zinc-400">Choose your practice mode and start learning</p>
                </motion.div>

                {/* Practice Options */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    {practiceOptions.map((option, i) => (
                        <motion.div
                            key={option.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * i }}
                        >
                            <Link
                                href={option.href}
                                className={`block h-full bg-zinc-900/80 backdrop-blur-xl border ${option.borderColor} rounded-2xl p-6 hover:scale-[1.02] transition-all group`}
                            >
                                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${option.color} mb-4`}>
                                    <option.icon className="w-6 h-6 text-white" />
                                </div>

                                {option.badge && (
                                    <div className={`inline-block px-2 py-1 ${option.bgColor} rounded text-xs font-medium mb-3`}>
                                        {option.badge}
                                    </div>
                                )}

                                <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">
                                    {option.title}
                                </h3>
                                <p className="text-zinc-400 text-sm mb-4">{option.description}</p>

                                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                                    <div className="text-xs text-zinc-500">
                                        <span className="block">{option.stats.questions} questions</span>
                                        <span className="block">{option.stats.difficulty}</span>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
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
                    className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 mb-8"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Target className="w-5 h-5 text-blue-400" />
                            <h2 className="text-xl font-bold">Practice by Topic</h2>
                        </div>
                        <Link href="/courses" className="text-sm text-blue-400 hover:underline">
                            View all topics
                        </Link>
                    </div>

                    <div className="grid gap-3">
                        {recentTopics.map((topic) => (
                            <Link
                                key={topic.id}
                                href={`/practice/topic/${topic.id}`}
                                className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-zinc-700 flex items-center justify-center">
                                        <BookOpen className={`w-5 h-5 ${topic.color}`} />
                                    </div>
                                    <div>
                                        <div className="font-semibold group-hover:text-blue-400 transition-colors">{topic.name}</div>
                                        <div className="text-sm text-zinc-500">{topic.course}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-sm font-medium">{topic.mastery}%</div>
                                        <div className="text-xs text-zinc-500">Mastery</div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
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
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                    <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-xl p-4 text-center">
                        <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-2" />
                        <div className="text-xl font-bold">+12%</div>
                        <div className="text-xs text-zinc-500">Weekly Growth</div>
                    </div>
                    <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-xl p-4 text-center">
                        <BarChart3 className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                        <div className="text-xl font-bold">156</div>
                        <div className="text-xs text-zinc-500">Questions This Week</div>
                    </div>
                    <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-xl p-4 text-center">
                        <Clock className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                        <div className="text-xl font-bold">4.5h</div>
                        <div className="text-xs text-zinc-500">Study Time</div>
                    </div>
                    <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-xl p-4 text-center">
                        <Sparkles className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
                        <div className="text-xl font-bold">7</div>
                        <div className="text-xs text-zinc-500">Day Streak</div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
