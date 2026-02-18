'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart3, BookOpen, Clock, Target, ArrowLeft, Play,
    ChevronRight, Layers, FileText
} from 'lucide-react';
import Link from 'next/link';
import CourseAnalysisView from './CourseAnalysisView';
import type { ExamAnalysisData } from '@/app/actions/exam-analysis';

interface CourseHubProps {
    course: {
        id: string;
        name: string;
        code: string;
        university?: { name: string } | null;
        description?: string;
    };
    analysisData: ExamAnalysisData | { error: string };
}

export default function CourseHub({ course, analysisData }: CourseHubProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'study'>('analysis');

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BookOpen },
        { id: 'analysis', label: 'Exam Analysis', icon: BarChart3 },
        { id: 'study', label: 'Study Plan', icon: Target },
    ];

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white transition-colors pb-20">
            {/* Background noise/gradient similar to dashboard */}
            <div className="fixed inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 dark:from-blue-900/10 dark:via-black dark:to-purple-900/10 pointer-events-none"></div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
                {/* Navigation */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/dashboard" className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800"></div>
                    <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">My Courses</span>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm font-bold text-zinc-900 dark:text-white">{course.code}</span>
                </div>

                {/* Course Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400">
                        {course.name}
                    </h1>
                    <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
                        <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                            {course.code}
                        </span>
                        {course.university && <span>{course.university.name}</span>}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${isActive
                                        ? 'text-white shadow-lg shadow-blue-500/25'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                    }`}
                                style={{
                                    background: isActive ? 'linear-gradient(135deg, #3B82F6, #2563EB)' : undefined
                                }}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabGlow"
                                        className="absolute inset-0 rounded-full bg-white/20"
                                        initial={false}
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div className="min-h-[500px]">
                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' && (
                            <motion.div
                                key="overview"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="grid grid-cols-1 md:grid-cols-3 gap-6"
                            >
                                {/* Quick Stats */}
                                <div className="md:col-span-2 space-y-6">
                                    <div className="bg-white dark:bg-zinc-900/50 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
                                        <h2 className="text-lg font-bold mb-4">Course Progress</h2>
                                        {/* Placeholder progress */}
                                        <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-2">
                                            <div className="h-full w-[0%] bg-blue-500 rounded-full"></div>
                                        </div>
                                        <p className="text-sm text-zinc-500">0% completed</p>
                                    </div>

                                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden">
                                        <div className="relative z-10">
                                            <h2 className="text-2xl font-bold mb-2">Start Learning</h2>
                                            <p className="text-blue-100 mb-6 max-w-md">
                                                Continue where you left off or start a new topic.
                                            </p>
                                            <Link href="/study" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition shadow-lg">
                                                <Play className="w-5 h-5 fill-current" /> Continue
                                            </Link>
                                        </div>
                                        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
                                            <Layers className="w-64 h-64" />
                                        </div>
                                    </div>
                                </div>

                                {/* Analysis Teaser */}
                                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col items-center text-center justify-center">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center mb-4 text-white shadow-lg">
                                        <BarChart3 className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Exam Analysis</h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                                        Unlock insights from past exams. See what topics matter most.
                                    </p>
                                    <button
                                        onClick={() => setActiveTab('analysis')}
                                        className="w-full py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 font-medium hover:bg-white dark:hover:bg-zinc-800 transition"
                                    >
                                        View Analysis
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'analysis' && (
                            <motion.div
                                key="analysis"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                {'error' in analysisData ? (
                                    <div className="p-10 text-center bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
                                        <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Analysis Unavailable</h3>
                                        <p className="text-red-500 dark:text-red-300">{analysisData.error}</p>
                                    </div>
                                ) : (
                                    <CourseAnalysisView data={analysisData} embedded={true} />
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'study' && (
                            <motion.div
                                key="study"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-10 text-center"
                            >
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
                                    <Target className="w-8 h-8 text-zinc-400" />
                                </div>
                                <h3 className="text-lg font-bold mb-2">Custom Study Plan</h3>
                                <p className="text-zinc-500 max-w-md mx-auto mb-6">
                                    Create a personalized study schedule based on your exam date and goals.
                                </p>
                                <button className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium">
                                    Generate Plan
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
