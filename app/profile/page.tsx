'use client';

import {
    Target,
    TrendingUp,
    TrendingDown,
    Clock,
    Zap,
    Brain,
    AlertTriangle,
    CheckCircle2,
    Calendar as CalendarIcon,
    MoreHorizontal,
    ChevronRight,
    Award,
    BookOpen,
    Activity,
    Flame,
    BarChart3,
    Info // Added import
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

// =============================================================================
// MOCK DATA
// =============================================================================
const STUDENT_DATA = {
    name: "Alex Andersson",
    level: 3,
    xp_current: 440,
    xp_next: 800,

    // Streak Data
    streak: {
        current: 2,
        best: 12,
        daily_goal_minutes: 60,
        week_activity: [
            { day: "S", active: false },
            { day: "M", active: true }, // Current streak start
            { day: "T", active: true },
            { day: "W", active: false },
            { day: "T", active: false },
            { day: "F", active: false },
            { day: "S", active: false },
        ]
    },

    // Study Hours (Bar Chart)
    study_hours: {
        total: 28.5,
        trend: "+6 hrs",
        history: [
            { day: "16 Jun", hours: 2.5 },
            { day: "17 Jun", hours: 4.0 },
            { day: "18 Jun", hours: 1.5 },
            { day: "19 Jun", hours: 5.0 },
            { day: "20 Jun", hours: 3.5 },
            { day: "21 Jun", hours: 6.0 }, // Peak
            { day: "22 Jun", hours: 4.0 },
        ]
    },

    // Mastery & Progress (Line Chart approximation)
    mastery_trend: [45, 48, 42, 55, 62, 58, 72],

    // Exam Readiness (Gauge)
    exam_readiness: 68,

    // Stats Grid
    stats: {
        questions: 289,
        correct: 220,
        incorrect: 69,
        accuracy: 79,
        speed: "9 Sec/Q"
    },

    // Focus Recommendations
    focus_next: [
        { topic: "Eigenvalues", type: "Concept", time: "20 min", impact: "High", color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
        { topic: "Diagonalization", type: "Practice", time: "30 min", impact: "High", color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" },
        { topic: "Vector Spaces", type: "Review", time: "15 min", impact: "Medium", color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
    ]
};

// =============================================================================
// MAIN DASHBOARD
// =============================================================================
export default function InsightDashboard() {
    return (
        <div className="min-h-screen bg-[#F3F6F8] dark:bg-black text-[#1F2937] dark:text-zinc-100 font-sans p-4 md:p-8">

            {/* Header */}
            <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[#111827] dark:text-white">Student Dashboard</h1>
                    <p className="text-zinc-500 mt-1">Welcome back, Alex! You're on a 2-day streak.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-sm font-bold text-[#111827] dark:text-white">{STUDENT_DATA.name}</span>
                        <span className="text-xs text-zinc-500">Engineering Physics</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-600/20">
                        AA
                    </div>
                </div>
            </header>

            {/* BENTO GRID */}
            <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                {/* 1. STUDY STREAK CARD */}
                <Card className="col-span-1 lg:col-span-1 flex flex-col justify-between relative group/card">
                    <InfoTooltip
                        title="Study Streak"
                        explanation="Tracks consecutive days with at least 1 completed learning session."
                        calculation="Streak = Current contiguous days with >0 activity."
                    />
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-orange-500">
                                    <Flame size={20} fill="currentColor" />
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-gray-100">Study Streak</h3>
                            </div>
                            <button className="text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">Calendar</button>
                        </div>

                        <div className="flex justify-between items-center gap-2 mb-6">
                            {STUDENT_DATA.streak.week_activity.map((day, i) => (
                                <div key={i} className="flex flex-col items-center gap-2">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${day.active
                                        ? 'bg-green-500 text-white shadow-md shadow-green-500/30'
                                        : 'bg-gray-100 text-gray-400 dark:bg-zinc-800'
                                        }`}>
                                        {day.active && <CheckCircle2 size={14} />}
                                    </div>
                                    <span className="text-[10px] font-medium text-gray-400">{day.day}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-zinc-800">
                        <div>
                            <div className="text-xs text-gray-500 mb-0.5">Current Streak</div>
                            <div className="text-xl font-bold text-gray-900 dark:text-white">{STUDENT_DATA.streak.current} <span className="text-sm font-medium text-gray-400">Days</span></div>
                        </div>
                        <div className="h-8 w-px bg-gray-200 dark:bg-zinc-700"></div>
                        <div>
                            <div className="text-xs text-gray-500 mb-0.5">Longest Streak</div>
                            <div className="text-xl font-bold text-gray-900 dark:text-white">{STUDENT_DATA.streak.best} <span className="text-sm font-medium text-gray-400">Days</span></div>
                        </div>
                    </div>
                </Card>

                {/* 2. EXAM READINESS GAUGE (Hero Card) */}
                <Card className="col-span-1 lg:col-span-1 flex flex-col items-center justify-center relative overflow-hidden group/card">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                    <InfoTooltip
                        title="Exam Readiness"
                        explanation="Estimated probability of passing the upcoming exam if taken today."
                        calculation="Weighted sum of topic mastery scores × topic exam weights."
                    />
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 mt-2">Exam Readiness</h3>

                    <div className="relative w-40 h-40 mb-2">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="42" fill="none" strokeWidth="10" className="stroke-gray-100 dark:stroke-zinc-800" />
                            <motion.circle
                                initial={{ strokeDasharray: "0 264" }}
                                animate={{ strokeDasharray: `${STUDENT_DATA.exam_readiness * 2.64} 264` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                cx="50" cy="50" r="42" fill="none" strokeWidth="10"
                                strokeLinecap="round"
                                className="stroke-blue-600 drop-shadow-lg"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{STUDENT_DATA.exam_readiness}%</span>
                            <span className="text-xs font-bold text-green-500 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded mt-1">On Track</span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 text-center px-4">You are ready for 68% of the expected exam content.</p>
                </Card>

                {/* 3. TOTAL STUDY HOURS (Bar Chart) */}
                <Card className="col-span-1 lg:col-span-2 relative group/card">
                    <InfoTooltip
                        title="Total Study Hours"
                        explanation="Total duration of active learning engagement."
                        calculation="Sum of all active session times. Idle time is excluded."
                    />
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-500">
                                <Clock size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-gray-100">Total Study Hours</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{STUDENT_DATA.study_hours.total}</span>
                                    <span className="text-xs font-bold text-green-500 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">{STUDENT_DATA.study_hours.trend}</span>
                                    <span className="text-xs text-gray-400">in last 7 days</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-700">Daily</button>
                            <button className="px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">Weekly</button>
                        </div>
                    </div>

                    <div className="h-40 flex items-end justify-between gap-4 px-2">
                        {STUDENT_DATA.study_hours.history.map((item, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                                <div className="relative w-full bg-gray-100 dark:bg-zinc-800 rounded-t-xl rounded-b-md overflow-hidden h-32 flex items-end">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${(item.hours / 8) * 100}%` }}
                                        className={`w-full ${item.hours >= 6 ? 'bg-blue-600' : 'bg-blue-400'} rounded-t-xl transition-all group-hover:bg-blue-500`}
                                    />
                                </div>
                                <span className="text-[10px] font-bold text-gray-400">{item.day.split(' ')[0]}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* 4. QUESTIONS & ACCURACY (Stats Grid) */}
                <Card className="col-span-1 lg:col-span-2 relative group/card">
                    <InfoTooltip
                        title="Performance Stats"
                        explanation="Key metrics derived from your problem-solving history."
                        calculation="Accuracy = Correct / Total. Speed = Avg time per question."
                    />
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-500">
                                <CheckCircle2 size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-gray-100">Total Questions Attempted</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{STUDENT_DATA.stats.questions}</span>
                                    <span className="text-xs font-bold text-green-500 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">+22</span>
                                    <span className="text-xs text-gray-400">in last 7 days</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatBox label="Correct" value={STUDENT_DATA.stats.correct} color="text-green-500" icon={<CheckCircle2 size={14} />} />
                        <StatBox label="Incorrect" value={STUDENT_DATA.stats.incorrect} color="text-red-500" icon={<AlertTriangle size={14} />} />
                        <StatBox label="Accuracy" value={`${STUDENT_DATA.stats.accuracy}%`} color="text-blue-500" icon={<Target size={14} />} />
                        <StatBox label="Speed" value={STUDENT_DATA.stats.speed} color="text-orange-500" icon={<Zap size={14} />} />
                    </div>
                </Card>

                {/* 5. STRENGTHS & WEAKNESSES (Line Chart Styled) */}
                <Card className="col-span-1 lg:col-span-1 flex flex-col relative group/card">
                    <InfoTooltip
                        title="Mastery Trend"
                        explanation="Your knowledge growth curve over the last week."
                        calculation="Daily average of Bayesian Knowledge Tracing (BKT) scores."
                    />
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-900 dark:text-white">Mastery Trend</h3>
                        <span className="text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-lg">Last 7 Days</span>
                    </div>

                    <div className="flex-1 relative min-h-[120px] flex items-end">
                        <div className="absolute inset-0 flex items-center justify-between">
                            {/* Grid lines */}
                            <div className="w-full h-px bg-gray-100 dark:bg-zinc-800 absolute top-0"></div>
                            <div className="w-full h-px bg-gray-100 dark:bg-zinc-800 absolute top-1/2"></div>
                            <div className="w-full h-px bg-gray-100 dark:bg-zinc-800 absolute bottom-0"></div>
                        </div>

                        {/* Simple SVG Line Chart */}
                        <svg className="w-full h-full overflow-visible">
                            <motion.path
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 2 }}
                                d={`M0,${100 - STUDENT_DATA.mastery_trend[0]} 
                                   L${100 / 6 * 1},${100 - STUDENT_DATA.mastery_trend[1]} 
                                   L${100 / 6 * 2},${100 - STUDENT_DATA.mastery_trend[2]}
                                   L${100 / 6 * 3},${100 - STUDENT_DATA.mastery_trend[3]}
                                   L${100 / 6 * 4},${100 - STUDENT_DATA.mastery_trend[4]}
                                   L${100 / 6 * 5},${100 - STUDENT_DATA.mastery_trend[5]}
                                   L100,${100 - STUDENT_DATA.mastery_trend[6]}`}
                                fill="none"
                                stroke="#8B5CF6"
                                strokeWidth="3"
                                vectorEffect="non-scaling-stroke"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            {/* Area under curve */}
                            <path
                                d={`M0,${100 - STUDENT_DATA.mastery_trend[0]} 
                                   L${100 / 6 * 1},${100 - STUDENT_DATA.mastery_trend[1]} 
                                   L${100 / 6 * 2},${100 - STUDENT_DATA.mastery_trend[2]}
                                   L${100 / 6 * 3},${100 - STUDENT_DATA.mastery_trend[3]}
                                   L${100 / 6 * 4},${100 - STUDENT_DATA.mastery_trend[4]}
                                   L${100 / 6 * 5},${100 - STUDENT_DATA.mastery_trend[5]}
                                   L100,${100 - STUDENT_DATA.mastery_trend[6]}
                                   L100,120 L0,120 Z`}
                                fill="url(#gradient)"
                                opacity="0.2"
                            />
                            <defs>
                                <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="#8B5CF6" />
                                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                        </svg>

                        {/* Current Value Pill */}
                        <div className="absolute top-[10%] right-0 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-lg shadow-purple-600/30">
                            {STUDENT_DATA.mastery_trend[6]}% Mastery
                        </div>
                    </div>
                </Card>

                {/* 6. LEVEL / GAMIFICATION CARD */}
                <Card className="col-span-1 lg:col-span-1 flex items-center justify-between bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
                    <div>
                        <div className="text-xs font-medium text-indigo-100 mb-1">Current Level</div>
                        <div className="text-4xl font-bold">{STUDENT_DATA.level}</div>
                        <div className="text-xs text-indigo-200 mt-2">{STUDENT_DATA.xp_next - STUDENT_DATA.xp_current} XP to Level {STUDENT_DATA.level + 1}</div>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                        <Award size={32} className="text-yellow-300" />
                    </div>
                </Card>

                {/* 7. FOCUS NEXT LIST (Action) */}
                <Card className="col-span-1 lg:col-span-2 xl:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Target size={18} className="text-red-500" />
                            Recommended Focus
                        </h3>
                        <button className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400">Start Session</button>
                    </div>
                    <div className="space-y-3">
                        {STUDENT_DATA.focus_next.map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl hover:bg-white dark:hover:bg-zinc-700 border border-transparent hover:border-gray-200 dark:hover:border-zinc-600 transition-all cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${item.color}`}>
                                        {i + 1}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-gray-900 dark:text-white">{item.topic}</div>
                                        <div className="text-xs text-gray-500">{item.type} • {item.time}</div>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                            </div>
                        ))}
                    </div>
                </Card>

            </main>
        </div>
    );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function Card({ children, className = "" }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={`bg-white dark:bg-zinc-900 rounded-[24px] p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-zinc-800 ${className}`}>
            {children}
        </div>
    );
}

function StatBox({ label, value, color, icon }: { label: string, value: string | number, color: string, icon: React.ReactNode }) {
    return (
        <div className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-2xl flex flex-col gap-3">
            <div className={`flex items-center gap-2 text-xs font-bold ${color}`}>
                {icon} {label}
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{value}</div>
        </div>
    )
}

function InfoTooltip({ title, explanation, calculation }: { title: string, explanation: string, calculation: string }) {
    return (
        <div className="absolute right-4 top-4 z-20 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
            <div className="relative group">
                <div className="p-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full text-gray-400 hover:text-blue-500 cursor-help">
                    <Info size={14} />
                </div>

                {/* Tooltip Content */}
                <div className="absolute right-0 top-full mt-2 w-64 p-4 bg-gray-900/95 dark:bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-800 dark:border-zinc-200 text-white dark:text-gray-900 text-xs pointer-events-none opacity-0 group-hover:opacity-100 transition-all transform origin-top-right z-30">
                    <div className="font-bold mb-1 text-sm">{title}</div>
                    <div className="mb-2 opacity-90">{explanation}</div>
                    <div className="pt-2 border-t border-gray-700 dark:border-gray-200 opacity-70">
                        <span className="font-semibold">Calc:</span> {calculation}
                    </div>
                </div>
            </div>
        </div>
    )
}
