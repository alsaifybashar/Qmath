'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Brain, MessageCircle, Lightbulb, Sparkles,
    ArrowRight, Wand2, BookOpen, Target, Zap, ArrowLeft
} from 'lucide-react';

const aiFeatures = [
    {
        id: 'chat',
        title: 'AI Tutor',
        description: 'Get instant help with any math problem. Ask questions, get step-by-step explanations.',
        icon: MessageCircle,
        href: '/ai/chat',
        color: 'from-purple-500 to-pink-500',
        bgColor: 'bg-purple-100 dark:bg-purple-500/10',
        textColor: 'text-purple-600 dark:text-purple-400',
        badge: 'Popular'
    },
    {
        id: 'explain',
        title: 'Explain This',
        description: 'Paste any problem and get a detailed breakdown with multiple solution methods.',
        icon: Lightbulb,
        href: '/ai/chat',
        color: 'from-yellow-500 to-orange-500',
        bgColor: 'bg-yellow-100 dark:bg-yellow-500/10',
        textColor: 'text-yellow-600 dark:text-yellow-400',
        badge: null
    },
    {
        id: 'generate',
        title: 'Problem Generator',
        description: 'Generate practice problems tailored to your weak areas and difficulty level.',
        icon: Wand2,
        href: '/ai/chat',
        color: 'from-blue-500 to-cyan-500',
        bgColor: 'bg-blue-100 dark:bg-blue-500/10',
        textColor: 'text-blue-600 dark:text-blue-400',
        badge: 'New'
    },
    {
        id: 'study-plan',
        title: 'Study Plan',
        description: 'Get an AI-generated study plan based on your goals and available time.',
        icon: Target,
        href: '/ai/chat',
        color: 'from-green-500 to-emerald-500',
        bgColor: 'bg-green-100 dark:bg-green-500/10',
        textColor: 'text-green-600 dark:text-green-400',
        badge: null
    }
];

const quickActions = [
    { label: 'Solve an equation', icon: '📝' },
    { label: 'Explain a concept', icon: '💡' },
    { label: 'Check my work', icon: '✅' },
    { label: 'Generate practice', icon: '🎯' }
];

export default function AIPage() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white transition-colors">
            <div className="fixed inset-0 bg-gradient-to-br from-purple-100/50 via-transparent to-blue-100/50 dark:from-purple-900/30 dark:via-black dark:to-blue-900/30"></div>
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
                        <Link href="/flashcards" className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                            Flashcards
                        </Link>
                    </div>
                </div>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-6">
                        <Brain className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        AI-Powered{' '}
                        <span className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                            Learning
                        </span>
                    </h1>
                    <p className="text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
                        Your personal AI tutor, available 24/7 to help you understand concepts and solve problems.
                    </p>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-12"
                >
                    <div className="flex flex-wrap justify-center gap-3">
                        {quickActions.map((action, i) => (
                            <Link
                                key={i}
                                href="/ai/chat"
                                className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-full transition-all"
                            >
                                <span>{action.icon}</span>
                                <span className="text-sm">{action.label}</span>
                            </Link>
                        ))}
                    </div>
                </motion.div>

                {/* AI Features Grid */}
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    {aiFeatures.map((feature, i) => (
                        <motion.div
                            key={feature.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 + i * 0.05 }}
                        >
                            <Link
                                href={feature.href}
                                className="block h-full bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:border-zinc-300 dark:hover:border-zinc-700 hover:scale-[1.02] transition-all group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color}`}>
                                        <feature.icon className="w-6 h-6 text-white" />
                                    </div>
                                    {feature.badge && (
                                        <span className={`px-2 py-1 ${feature.bgColor} ${feature.textColor} rounded text-xs font-medium`}>
                                            {feature.badge}
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                    {feature.title}
                                </h3>
                                <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">{feature.description}</p>

                                <div className="flex items-center text-purple-600 dark:text-purple-400 text-sm font-medium">
                                    <span>Try it now</span>
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-500/10 dark:to-pink-500/10 border border-purple-200 dark:border-purple-500/20 rounded-2xl p-8 mb-8"
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <Sparkles className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                            <div className="text-2xl font-bold">150+</div>
                            <div className="text-sm text-zinc-500">Questions answered</div>
                        </div>
                        <div>
                            <BookOpen className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                            <div className="text-2xl font-bold">45</div>
                            <div className="text-sm text-zinc-500">Concepts explained</div>
                        </div>
                        <div>
                            <Zap className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                            <div className="text-2xl font-bold">2.3s</div>
                            <div className="text-sm text-zinc-500">Avg response time</div>
                        </div>
                        <div>
                            <Target className="w-6 h-6 text-green-500 mx-auto mb-2" />
                            <div className="text-2xl font-bold">94%</div>
                            <div className="text-sm text-zinc-500">Helpful rating</div>
                        </div>
                    </div>
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
                        href="/ai/chat"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium transition-all"
                    >
                        Start Chatting
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </motion.div>

                {/* Disclaimer */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-center text-zinc-500 text-sm mt-8"
                >
                    AI responses are generated and may occasionally contain errors. Always verify important calculations.
                </motion.p>
            </div>
        </div>
    );
}
