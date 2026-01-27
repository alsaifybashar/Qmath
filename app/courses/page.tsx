'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    BookOpen, Target, Clock, TrendingUp, ChevronRight,
    BarChart3, Play, Lock, ArrowLeft, Home
} from 'lucide-react';

const courses = [
    {
        id: 'calc1',
        name: 'Calculus I',
        code: 'SF1625',
        description: 'Limits, derivatives, and applications',
        progress: 68,
        topics: 24,
        completedTopics: 16,
        mastery: 72,
        nextTopic: 'Integration by Parts',
        color: 'from-blue-500 to-cyan-500',
        status: 'active'
    },
    {
        id: 'linalg',
        name: 'Linear Algebra',
        code: 'SF1624',
        description: 'Vectors, matrices, and linear transformations',
        progress: 45,
        topics: 18,
        completedTopics: 8,
        mastery: 58,
        nextTopic: 'Eigenvalues',
        color: 'from-purple-500 to-pink-500',
        status: 'active'
    },
    {
        id: 'physics1',
        name: 'Mechanics',
        code: 'SG1113',
        description: 'Classical mechanics and dynamics',
        progress: 32,
        topics: 26,
        completedTopics: 8,
        mastery: 45,
        nextTopic: 'Rotational Dynamics',
        color: 'from-orange-500 to-red-500',
        status: 'active'
    },
    {
        id: 'calc2',
        name: 'Calculus II',
        code: 'SF1626',
        description: 'Integration, series, and multivariable',
        progress: 0,
        topics: 28,
        completedTopics: 0,
        mastery: 0,
        nextTopic: 'Start Course',
        color: 'from-green-500 to-emerald-500',
        status: 'locked'
    }
];

export default function CoursesPage() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white transition-colors">
            {/* Background */}
            <div className="fixed inset-0 bg-gradient-to-br from-blue-100/50 via-transparent to-purple-100/50 dark:from-blue-900/10 dark:via-black dark:to-purple-900/10"></div>
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
                {/* Top Nav */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <Link href="/" className="font-bold text-xl">Qmath</Link>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/study" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all">
                            Start Studying
                        </Link>
                    </div>
                </div>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-bold mb-2">My Courses</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Track your progress and continue learning</p>
                </motion.div>

                {/* Quick Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                >
                    <div className="bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
                        <BookOpen className="w-6 h-6 text-blue-500 mb-3" />
                        <div className="text-2xl font-bold">3</div>
                        <div className="text-sm text-zinc-500">Active Courses</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
                        <Target className="w-6 h-6 text-green-500 mb-3" />
                        <div className="text-2xl font-bold">32</div>
                        <div className="text-sm text-zinc-500">Topics Completed</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
                        <BarChart3 className="w-6 h-6 text-purple-500 mb-3" />
                        <div className="text-2xl font-bold">58%</div>
                        <div className="text-sm text-zinc-500">Avg Mastery</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
                        <Clock className="w-6 h-6 text-orange-500 mb-3" />
                        <div className="text-2xl font-bold">12.5h</div>
                        <div className="text-sm text-zinc-500">This Week</div>
                    </div>
                </motion.div>

                {/* Courses Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                    {courses.map((course, i) => (
                        <motion.div
                            key={course.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * i }}
                        >
                            <Link
                                href={course.status === 'locked' ? '#' : `/study`}
                                className={`block bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group ${course.status === 'locked' ? 'opacity-60 cursor-not-allowed' : ''
                                    }`}
                            >
                                {/* Course Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${course.color}`}></div>
                                            <span className="text-xs text-zinc-500 font-mono">{course.code}</span>
                                        </div>
                                        <h3 className="text-xl font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {course.name}
                                        </h3>
                                        <p className="text-sm text-zinc-500 mt-1">{course.description}</p>
                                    </div>
                                    {course.status === 'locked' ? (
                                        <Lock className="w-5 h-5 text-zinc-400" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                    )}
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between text-sm mb-2">
                                        <span className="text-zinc-500">Progress</span>
                                        <span className="font-medium">{course.progress}%</span>
                                    </div>
                                    <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${course.progress}%` }}
                                            transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
                                            className={`h-full bg-gradient-to-r ${course.color}`}
                                        />
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                                        <div className="text-lg font-bold">{course.completedTopics}/{course.topics}</div>
                                        <div className="text-xs text-zinc-500">Topics</div>
                                    </div>
                                    <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                                        <div className="text-lg font-bold">{course.mastery}%</div>
                                        <div className="text-xs text-zinc-500">Mastery</div>
                                    </div>
                                    <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                                        <div className="text-lg font-bold text-green-500">A</div>
                                        <div className="text-xs text-zinc-500">Predicted</div>
                                    </div>
                                </div>

                                {/* Next Topic */}
                                {course.status !== 'locked' && (
                                    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/20">
                                        <Play className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        <span className="text-sm text-blue-700 dark:text-blue-300">
                                            Next: <span className="font-medium">{course.nextTopic}</span>
                                        </span>
                                    </div>
                                )}
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
                >
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl font-medium transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                    <Link
                        href="/study"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all"
                    >
                        Start Studying
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
