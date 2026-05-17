'use client';

import { useState } from 'react';
import type { ElementType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart3, BookOpen, Target, ArrowLeft,
    ChevronRight, ScrollText, Sparkles, Trophy
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

type CourseTabId = 'overview' | 'analysis' | 'study' | 'exams';

export default function CourseHub({ course, analysisData, overviewData, courseExams }: CourseHubProps) {
    const [activeTab, setActiveTab] = useState<CourseTabId>('overview');

    const tabs: Array<{ id: CourseTabId; label: string; icon: ElementType }> = [
        { id: 'overview', label: 'Overview', icon: BookOpen },
        { id: 'analysis', label: 'Exam Analysis', icon: BarChart3 },
        { id: 'study', label: 'Study Plan', icon: Target },
        { id: 'exams', label: 'Gamla tentor', icon: ScrollText },
    ];

    return (
        <div className="liquid-theme relative min-h-screen overflow-hidden bg-slate-50 pb-20 text-zinc-950 dark:bg-[#08091f] dark:text-white">
            <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(59,130,246,0.18),transparent_28%),radial-gradient(circle_at_88%_10%,rgba(147,51,234,0.14),transparent_30%),radial-gradient(circle_at_52%_90%,rgba(16,185,129,0.13),transparent_34%),linear-gradient(135deg,#f8fbff_0%,#edf4ff_48%,#f7f3ff_100%)] dark:bg-[radial-gradient(circle_at_12%_14%,rgba(59,130,246,0.45),transparent_28%),radial-gradient(circle_at_88%_10%,rgba(147,51,234,0.38),transparent_30%),radial-gradient(circle_at_52%_90%,rgba(16,185,129,0.24),transparent_34%),linear-gradient(135deg,#050816_0%,#11164e_48%,#24104f_100%)]"></div>
            <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.55),transparent_24%,rgba(255,255,255,0.24)_52%,transparent_76%)] dark:bg-[linear-gradient(115deg,rgba(255,255,255,0.10),transparent_24%,rgba(255,255,255,0.04)_52%,transparent_76%)]"></div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
                {/* Navigation */}
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/dashboard" className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-white/55 backdrop-blur-md transition hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="h-6 w-px bg-white/10"></div>
                    <span className="text-sm font-medium text-white/45">My Courses</span>
                    <ChevronRight className="w-4 h-4 text-white/25" />
                    <span className="text-sm font-bold text-white/80">{course.code}</span>
                </div>

                {/* Course Header */}
                <div className="mb-6 overflow-hidden rounded-lg border border-white/15 bg-white/[0.07] p-5 shadow-2xl shadow-black/25 backdrop-blur-md ring-1 ring-white/5">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-200/20 bg-blue-300/10 px-2.5 py-1 text-xs font-bold text-blue-100">
                                    <Trophy className="h-3.5 w-3.5" />
                                    Course journey
                                </span>
                                <span className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-mono font-bold text-white/75">
                                    {course.code}
                                </span>
                                {course.university && (
                                    <span className="text-xs font-medium text-white/45">{course.university.name}</span>
                                )}
                            </div>
                            <h1 className="max-w-4xl text-3xl font-bold tracking-normal text-white sm:text-4xl">
                                {course.name}
                            </h1>
                            {course.description && (
                                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">{course.description}</p>
                            )}
                        </div>
                        <div className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-4 shadow-xl shadow-emerald-500/10">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-300/15 text-emerald-100">
                                    <Sparkles className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase text-emerald-200">Din bana</p>
                                    <p className="text-sm font-bold text-white">Översikt och träning</p>
                                </div>
                            </div>
                        </div>
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
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-bold transition-all whitespace-nowrap ${isActive
                                    ? 'border-white/20 text-white shadow-lg shadow-blue-500/20'
                                    : 'border-transparent text-white/55 hover:border-white/10 hover:bg-white/[0.06] hover:text-white'
                                    }`}
                                style={{
                                    background: isActive ? 'rgba(255,255,255,0.12)' : undefined,
                                    backdropFilter: isActive ? 'blur(16px)' : undefined,
                                }}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabGlow"
                                        className="absolute inset-0 rounded-lg bg-white/15"
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
