'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import {
    Brain, BarChart3, Target, BookOpen, Zap, Clock, Users, Trophy,
    Sparkles, ArrowRight, CheckCircle2, Play, Shield, Globe
} from 'lucide-react';

const features = [
    {
        icon: Brain,
        title: 'Adaptive Learning Engine',
        description: 'Our BKT and IRT algorithms analyze your solving patterns to serve the perfect question at the perfect time, maximizing learning efficiency.',
        color: 'from-purple-500 to-pink-500',
        details: ['Bayesian Knowledge Tracing', 'Item Response Theory', 'Personalized difficulty curves']
    },
    {
        icon: BarChart3,
        title: 'Real-time Analytics',
        description: 'Track your learning velocity, identify weak spots, and visualize your progress with comprehensive analytics dashboards.',
        color: 'from-blue-500 to-cyan-500',
        details: ['Learning velocity tracking', 'Knowledge gap detection', 'Study time optimization']
    },
    {
        icon: Target,
        title: 'Exam Simulation',
        description: 'Practice under real exam conditions with timed simulations that mirror your university\'s exam format.',
        color: 'from-green-500 to-emerald-500',
        details: ['University-specific exams', 'Time pressure training', 'Performance analytics']
    },
    {
        icon: BookOpen,
        title: 'Dynamic Scaffolding',
        description: 'When you struggle, we automatically break problems into simpler steps to rebuild your understanding.',
        color: 'from-orange-500 to-amber-500',
        details: ['Step-by-step breakdowns', 'Prerequisite detection', 'Concept reinforcement']
    },
    {
        icon: Zap,
        title: 'Spaced Repetition',
        description: 'Our SM-2 based flashcard system ensures you review concepts at optimal intervals for long-term retention.',
        color: 'from-yellow-500 to-orange-500',
        details: ['SM-2/FSRS algorithm', 'Optimal review scheduling', 'Memory strength tracking']
    },
    {
        icon: Sparkles,
        title: 'AI Tutor',
        description: 'Get instant explanations and personalized help from our AI tutor that understands mathematical concepts.',
        color: 'from-indigo-500 to-purple-500',
        details: ['24/7 availability', 'Step-by-step explanations', 'Concept clarification']
    }
];

const stats = [
    { value: '50,000+', label: 'Practice Problems' },
    { value: '95%', label: 'Exam Pass Rate' },
    { value: '10,000+', label: 'Active Students' },
    { value: '25+', label: 'Universities' }
];

export default function FeaturesPage() {
    return (
        <main className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white">
            <Header />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-3xl rounded-full"></div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-medium mb-8"
                    >
                        <Sparkles className="w-4 h-4" />
                        Powered by Advanced AI
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
                    >
                        Features that{' '}
                        <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            transform
                        </span>
                        <br />how you learn
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-12"
                    >
                        Every feature is designed to accelerate your mastery of engineering mathematics through intelligent, adaptive learning.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                    >
                        <Link
                            href="/register"
                            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                        >
                            Start Free Trial
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            href="/demo"
                            className="px-8 py-4 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white rounded-full font-semibold transition-all flex items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-800"
                        >
                            <Play className="w-5 h-5" />
                            Watch Demo
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Stats Bar */}
            <section className="py-12 border-y border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="text-center"
                            >
                                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-zinc-500 mt-1">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Everything you need to excel</h2>
                        <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                            A complete toolkit designed by engineers, for engineers.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="group relative bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800 hover:border-transparent hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity`}></div>

                                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-6`}>
                                    <feature.icon className="w-6 h-6 text-white" />
                                </div>

                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-zinc-600 dark:text-zinc-400 mb-6">{feature.description}</p>

                                <ul className="space-y-2">
                                    {feature.details.map((detail, j) => (
                                        <li key={j} className="flex items-center gap-2 text-sm text-zinc-500">
                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                            {detail}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Additional Features */}
            <section className="py-24 px-4 bg-zinc-50 dark:bg-zinc-950">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="p-8 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800"
                        >
                            <Shield className="w-10 h-10 text-green-500 mb-4" />
                            <h3 className="text-lg font-bold mb-2">University Aligned</h3>
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                                Content aligned with curricula from top European technical universities.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="p-8 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800"
                        >
                            <Clock className="w-10 h-10 text-blue-500 mb-4" />
                            <h3 className="text-lg font-bold mb-2">Study Planner</h3>
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                                AI-powered scheduling that adapts to your goals and available time.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="p-8 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800"
                        >
                            <Globe className="w-10 h-10 text-purple-500 mb-4" />
                            <h3 className="text-lg font-bold mb-2">Multi-language</h3>
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                                Available in Swedish and English with more languages coming soon.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to transform your learning?</h2>
                    <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-8">
                        Join thousands of engineering students who've improved their grades with Qmath.
                    </p>
                    <Link
                        href="/register"
                        className="inline-flex items-center gap-2 px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-lg transition-all shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:scale-105"
                    >
                        Get Started Free
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-zinc-200 dark:border-zinc-900 text-center text-zinc-500 text-sm">
                <p>© 2026 Qmath EdTech AB. All rights reserved.</p>
            </footer>
        </main>
    );
}
