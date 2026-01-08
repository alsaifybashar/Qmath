'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    BookOpen, Clock, BarChart3, ChevronRight, Play, FileText,
    Calendar, Target, AlertTriangle, ArrowLeft
} from 'lucide-react';

// Mock exam data
const upcomingExams = [
    {
        id: 'calc1-final',
        name: 'Calculus I Final',
        course: 'SF1625',
        date: 'Jan 15, 2026',
        daysLeft: 8,
        readiness: 72
    },
    {
        id: 'linalg-mid',
        name: 'Linear Algebra Midterm',
        course: 'SF1624',
        date: 'Jan 22, 2026',
        daysLeft: 15,
        readiness: 58
    }
];

const pastExams = [
    {
        id: 'physics-mid',
        name: 'Mechanics Midterm',
        course: 'SG1113',
        date: 'Dec 10, 2025',
        score: 78,
        maxScore: 100
    },
    {
        id: 'calc1-mid',
        name: 'Calculus I Midterm',
        course: 'SF1625',
        date: 'Nov 15, 2025',
        score: 85,
        maxScore: 100
    }
];

const availableExams = [
    { id: 'calc1', name: 'Calculus I', questions: 45, duration: '3 hours' },
    { id: 'linalg', name: 'Linear Algebra', questions: 40, duration: '2.5 hours' },
    { id: 'physics1', name: 'Mechanics', questions: 35, duration: '3 hours' },
    { id: 'diffeq', name: 'Differential Equations', questions: 38, duration: '3 hours' }
];

export default function ExamsPage() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white transition-colors">
            <div className="fixed inset-0 bg-gradient-to-br from-orange-100/50 via-transparent to-red-100/50 dark:from-orange-900/10 dark:via-black dark:to-red-900/10"></div>
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
                        <Link href="/exam" className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-medium transition-all">
                            Start Exam
                        </Link>
                    </div>
                </div>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-bold mb-2">Exam Preparation</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Practice with realistic exam simulations</p>
                </motion.div>

                {/* Upcoming Exams */}
                {upcomingExams.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-12"
                    >
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-orange-400" />
                            Upcoming Exams
                        </h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            {upcomingExams.map((exam) => (
                                <Link
                                    key={exam.id}
                                    href={`/exams/${exam.id}`}
                                    className="block bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:border-orange-300 dark:hover:border-orange-500/30 transition-all group"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="text-xs text-zinc-500 mb-1">{exam.course}</div>
                                            <h3 className="text-lg font-bold group-hover:text-orange-400 transition-colors">
                                                {exam.name}
                                            </h3>
                                            <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{exam.date}</div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${exam.daysLeft <= 7
                                            ? 'bg-red-500/10 text-red-400'
                                            : 'bg-orange-500/10 text-orange-400'
                                            }`}>
                                            {exam.daysLeft} days left
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <div className="flex items-center justify-between text-sm mb-2">
                                            <span className="text-zinc-500">Exam Readiness</span>
                                            <span className={`font-medium ${exam.readiness >= 70 ? 'text-green-400' : exam.readiness >= 50 ? 'text-yellow-400' : 'text-red-400'
                                                }`}>{exam.readiness}%</span>
                                        </div>
                                        <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${exam.readiness >= 70 ? 'bg-green-500' : exam.readiness >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`}
                                                style={{ width: `${exam.readiness}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center text-sm text-orange-400 font-medium">
                                        <Play className="w-4 h-4 mr-2" />
                                        Start Preparation
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Available Exam Simulations */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-12"
                >
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-400" />
                        Exam Simulations
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {availableExams.map((exam) => (
                            <Link
                                key={exam.id}
                                href={`/exams/${exam.id}/simulate`}
                                className="flex items-center justify-between p-5 bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-blue-300 dark:hover:border-blue-500/30 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
                                        <BookOpen className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold group-hover:text-blue-400 transition-colors">
                                            {exam.name}
                                        </h3>
                                        <div className="text-sm text-zinc-500">
                                            {exam.questions} questions • {exam.duration}
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                            </Link>
                        ))}
                    </div>
                </motion.div>

                {/* Past Exams */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-green-400" />
                            Past Results
                        </h2>
                        <Link href="/exams/history" className="text-sm text-blue-400 hover:underline">
                            View all history
                        </Link>
                    </div>
                    <div className="bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                        {pastExams.map((exam, i) => (
                            <Link
                                key={exam.id}
                                href={`/exams/history/${exam.id}`}
                                className={`flex items-center justify-between p-5 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all ${i !== pastExams.length - 1 ? 'border-b border-zinc-200 dark:border-zinc-800' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${exam.score >= 80
                                        ? 'bg-green-500/10'
                                        : exam.score >= 60
                                            ? 'bg-yellow-500/10'
                                            : 'bg-red-500/10'
                                        }`}>
                                        <span className={`text-lg font-bold ${exam.score >= 80
                                            ? 'text-green-400'
                                            : exam.score >= 60
                                                ? 'text-yellow-400'
                                                : 'text-red-400'
                                            }`}>
                                            {exam.score}%
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{exam.name}</h3>
                                        <div className="text-sm text-zinc-500">{exam.course} • {exam.date}</div>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-zinc-600" />
                            </Link>
                        ))}
                    </div>
                </motion.div>

                {/* Tips */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-12 p-6 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 border border-orange-200 dark:border-orange-500/20 rounded-2xl"
                >
                    <div className="flex items-start gap-4">
                        <AlertTriangle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="font-bold mb-2">Exam Tips</h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                For best results, simulate exam conditions: no distractions, timed sessions, and no external resources.
                                Review your mistakes after each simulation to identify weak areas.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
