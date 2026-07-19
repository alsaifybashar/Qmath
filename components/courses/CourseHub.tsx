'use client';

import { useState } from 'react';
import type { ElementType } from 'react';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion';
import {
    ArrowLeft,
    BarChart3,
    BookOpen,
    GraduationCap,
    ScrollText,
    Target,
} from 'lucide-react';
import Link from 'next/link';
import CourseAnalysisView from './CourseAnalysisView';
import CourseOverview from './CourseOverview';
import CourseExamsTab from './CourseExamsTab';
import CourseLearningPlan from './CourseLearningPlan';
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

const tabs: Array<{ id: CourseTabId; label: string; helper: string; icon: ElementType }> = [
    { id: 'overview', label: 'Översikt', helper: 'Nästa steg', icon: BookOpen },
    { id: 'analysis', label: 'Analys', helper: 'Tentamönster', icon: BarChart3 },
    { id: 'study', label: 'Studieplan', helper: 'Planera pass', icon: Target },
    { id: 'exams', label: 'Gamla tentor', helper: 'Arkiv', icon: ScrollText },
];

function isOverviewData(data: CourseOverviewData | { error: string }): data is CourseOverviewData {
    return !('error' in data);
}

function isAnalysisData(data: ExamAnalysisData | { error: string }): data is ExamAnalysisData {
    return !('error' in data);
}

function Surface({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={`rounded-2xl bg-white/76 shadow-[0_0_0_1px_rgba(15,23,42,0.07),0_8px_32px_rgba(15,23,42,0.08)] backdrop-blur-[22px] dark:bg-white/[0.07] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_18px_48px_rgba(0,0,0,0.26)] ${className}`}
        >
            {children}
        </div>
    );
}

function ErrorState({ title, message, icon: Icon }: { title: string; message: string; icon: ElementType }) {
    return (
        <Surface className="p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-200">
                <Icon className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-zinc-950 dark:text-white">{title}</h3>
            <p className="mx-auto mt-2 max-w-md text-pretty text-sm leading-6 text-zinc-500 dark:text-white/55">{message}</p>
        </Surface>
    );
}

export default function CourseHub({ course, analysisData, overviewData, courseExams }: CourseHubProps) {
    const [activeTab, setActiveTab] = useState<CourseTabId>('overview');
    const reduceMotion = useReducedMotion();
    const overview = isOverviewData(overviewData) ? overviewData : null;
    const analysis = isAnalysisData(analysisData) ? analysisData : null;
    const overviewError = 'error' in overviewData ? overviewData.error : 'Översikten kunde inte laddas.';
    const analysisError = 'error' in analysisData ? analysisData.error : 'Analysen kunde inte laddas.';

    const transition = { type: 'spring' as const, duration: 0.22, bounce: 0 };

    return (
        <MotionConfig reducedMotion={reduceMotion ? 'always' : 'never'}>
            <div className="relative min-h-screen overflow-hidden pb-20 text-zinc-950 dark:text-white">
                <div
                    aria-hidden
                    className="pointer-events-none absolute -top-40 right-0 h-[520px] w-[520px] rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(40, 175, 176,0.13) 0%, transparent 70%)',
                        filter: 'blur(64px)',
                    }}
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute top-72 -left-32 h-96 w-96 rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)',
                        filter: 'blur(58px)',
                    }}
                />

                <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    <nav className="mb-5 flex items-center gap-3 text-sm">
                        <Link
                            href="/courses"
                            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white/70 px-3 py-2 font-bold text-zinc-600 shadow-[0_0_0_1px_rgba(15,23,42,0.07)] transition-[background-color,color,scale] duration-150 ease-out hover:bg-white hover:text-zinc-950 active:scale-[0.96] dark:bg-white/[0.07] dark:text-white/60 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.10)] dark:hover:bg-white/[0.10] dark:hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Kurser
                        </Link>
                        <span className="hidden text-zinc-400 dark:text-white/30 sm:inline">/</span>
                        <span className="hidden font-mono text-xs font-bold text-zinc-500 dark:text-white/45 sm:inline">{course.code}</span>
                    </nav>

                    <Surface className="mb-5 overflow-hidden">
                        <div className="p-5 lg:p-6">
                            <div className="mb-4 flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500/10 px-3 py-1.5 text-xs font-bold text-indigo-700 ring-1 ring-indigo-500/15 dark:text-indigo-200">
                                    <GraduationCap className="h-3.5 w-3.5" />
                                    Kursarbetsyta
                                </span>
                                <span className="rounded-xl bg-zinc-950 px-3 py-1.5 font-mono text-xs font-bold text-white dark:bg-white dark:text-zinc-950">
                                    {course.code}
                                </span>
                                {course.university && (
                                    <span className="rounded-xl bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-600 dark:bg-white/10 dark:text-white/55">
                                        {course.university.name}
                                    </span>
                                )}
                            </div>

                            <h1
                                className="text-balance font-bold tracking-tight text-zinc-950 dark:text-white"
                                style={{ fontSize: 'clamp(1.25rem, 3vw, 2rem)' }}
                            >
                                {course.name}
                            </h1>
                            <p className="mt-3 max-w-3xl text-pretty text-sm leading-6 text-zinc-500 dark:text-white/55">
                                {course.description || 'Samlad översikt för kursens tentamönster, studieplan och gamla tentor.'}
                            </p>
                        </div>
                    </Surface>

                    <Surface className="sticky top-4 z-20 mb-6 p-2">
                        <div className="flex gap-2 overflow-x-auto">
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.id;
                                const Icon = tab.icon;

                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`relative min-h-12 flex-1 whitespace-nowrap rounded-xl px-3 py-2 text-left transition-[background-color,color,scale] duration-150 ease-out active:scale-[0.96] sm:min-w-[150px] ${
                                            isActive
                                                ? 'text-zinc-950 dark:text-white'
                                                : 'text-zinc-500 hover:bg-zinc-950/[0.04] hover:text-zinc-800 dark:text-white/45 dark:hover:bg-white/[0.06] dark:hover:text-white'
                                        }`}
                                    >
                                        {isActive && (
                                            <motion.span
                                                layoutId="course-active-tab"
                                                className="absolute inset-0 rounded-xl bg-zinc-950/[0.06] shadow-[0_0_0_1px_rgba(15,23,42,0.06)] dark:bg-white/[0.08] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                                                transition={transition}
                                            />
                                        )}
                                        <span className="relative z-10 flex items-center gap-2">
                                            <Icon className="h-4 w-4" />
                                            <span>
                                                <span className="block text-sm font-bold">{tab.label}</span>
                                                <span className="hidden text-xs text-zinc-500 dark:text-white/45 sm:block">{tab.helper}</span>
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </Surface>

                    <section className="min-h-[500px]">
                        <AnimatePresence mode="wait" initial={false}>
                            {activeTab === 'overview' && (
                                <motion.div
                                    key="overview"
                                    initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                                    transition={transition}
                                >
                                    {overview ? (
                                        <CourseOverview data={overview} />
                                    ) : (
                                        <ErrorState icon={BookOpen} title="Översikt ej tillgänglig" message={overviewError} />
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'analysis' && (
                                <motion.div
                                    key="analysis"
                                    initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                                    transition={transition}
                                >
                                    {analysis ? (
                                        <CourseAnalysisView data={analysis} embedded={true} />
                                    ) : (
                                        <ErrorState icon={BarChart3} title="Analys ej tillgänglig" message={analysisError} />
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'study' && (
                                <motion.div
                                    key="study"
                                    initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                                    transition={transition}
                                >
                                    {overview ? (
                                        <CourseLearningPlan data={overview} />
                                    ) : (
                                        <ErrorState icon={Target} title="Studieplan ej tillgänglig" message={overviewError} />
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'exams' && (
                                <motion.div
                                    key="exams"
                                    initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                                    transition={transition}
                                >
                                    <CourseExamsTab exams={courseExams} courseCode={course.code} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </section>
                </div>
            </div>
        </MotionConfig>
    );
}
