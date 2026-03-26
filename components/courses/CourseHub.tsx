'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart3, BookOpen, Clock, Target, ArrowLeft, Play,
    ChevronRight, Layers, FileText, ScrollText
} from 'lucide-react';
import Link from 'next/link';
import CourseAnalysisView from './CourseAnalysisView';
import CourseOverview from './CourseOverview';
import CourseExamsTab from './CourseExamsTab';
import type { ExamAnalysisData } from '@/app/actions/exam-analysis';
import type { CourseOverviewData } from '@/app/actions/course-overview';
import type { CourseExam } from '@/app/actions/course-exams';

interface CourseHubProps {
    course: {
        id: string;
        name: string;
        code: string;
        university?: { name: string } | null;
        description?: string;
    };
    analysisData: ExamAnalysisData | { error: string };
    overviewData: CourseOverviewData | { error: string };
    courseExams: CourseExam[];
}

export default function CourseHub({ course, analysisData, overviewData, courseExams }: CourseHubProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'study' | 'exams'>('overview');

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BookOpen },
        { id: 'analysis', label: 'Exam Analysis', icon: BarChart3 },
        { id: 'study', label: 'Study Plan', icon: Target },
        { id: 'exams', label: 'Gamla tentor', icon: ScrollText },
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
                            >
                                {'error' in overviewData ? (
                                    <div className="p-10 text-center bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/40 mb-4">
                                            <BookOpen className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <h3 className="text-lg font-bold text-amber-800 dark:text-amber-300 mb-2">Översikt ej tillgänglig</h3>
                                        <p className="text-amber-600 dark:text-amber-400 max-w-md mx-auto">{overviewData.error}</p>
                                    </div>
                                ) : (
                                    <CourseOverview data={overviewData} />
                                )}
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

                        {activeTab === 'exams' && (
                            <motion.div
                                key="exams"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <CourseExamsTab
                                    exams={courseExams}
                                    courseCode={course.code}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
