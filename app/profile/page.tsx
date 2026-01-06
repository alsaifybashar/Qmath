'use client';

import { Activity, Book, Calendar, ChevronRight, Clock, Info, LayoutDashboard, Settings, Target, TrendingUp, Zap, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';

// --- MOCK DATA ---
const STUDENT_DATA = {
    user_id: "uuid-123",
    name: "Alex Andersson",
    program: "Engineering Physics – Year 2",
    university: "KTH Royal Institute of Technology",
    active_courses: ["Linear Algebra", "Calculus II", "Mechanics"],
    exam_dates: [
        { course: "Linear Algebra", date: "2026-01-20", daysLeft: 14 },
        { course: "Calculus II", date: "2026-02-10", daysLeft: 35 }
    ],
    stats: {
        readiness_score: 68,
        study_streak: 12,
        avg_session: 42,
        productive_time: "18:00 - 20:00"
    },
    risk: {
        level: "Medium",
        reason: "Exam proximity (Linear Algebra) and unresolved core topics in Eigenvalues."
    },
    topics: {
        "Linear Algebra": [
            { name: "Vector spaces", mastery: 82, status: "good" },
            { name: "Eigenvalues", mastery: 48, status: "warning" },
            { name: "Diagonalization", mastery: 31, status: "danger" }
        ]
    },
    recommendations: [
        { type: "Concept", title: "Eigenvalues – conceptual understanding", time: "15 min", impact: "High" },
        { type: "Problem", title: "Diagonalization – exam-level problems", time: "30 min", impact: "High" },
        { type: "Review", title: "Flashcard review (12 cards due)", time: "5 min", impact: "Medium" }
    ]
};

export default function ProfilePage() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white transition-colors duration-300 pb-20">
            <Header />

            <main className="max-w-6xl mx-auto px-4 pt-24 space-y-8">

                {/* 1. PROFILE HEADER */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-blue-500/30">
                            AA
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{STUDENT_DATA.name}</h1>
                            <p className="text-zinc-500 dark:text-zinc-400 font-medium">{STUDENT_DATA.program}</p>
                            <div className="flex items-center gap-2 text-sm text-zinc-400 mt-1">
                                <Building2 className="w-4 h-4" /> {STUDENT_DATA.university}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 w-full md:w-auto">
                        <div className="bg-blue-50 dark:bg-blue-900/20 px-5 py-3 rounded-xl border border-blue-100 dark:border-blue-800">
                            <div className="text-xs text-blue-600 dark:text-blue-400 uppercase font-bold tracking-wider mb-1">Next Exam</div>
                            <div className="flex items-center justify-between gap-8">
                                <span className="font-semibold text-zinc-900 dark:text-white">{STUDENT_DATA.exam_dates[0].course}</span>
                                <span className="text-blue-600 font-bold">{STUDENT_DATA.exam_dates[0].daysLeft} days left</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. LEARNING SNAPSHOT & HABITS & RISK */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Learning Snapshot */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <div className="flex items-center gap-2 mb-6 text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-widest text-xs">
                            <Target className="w-4 h-4" /> Learning Snapshot
                        </div>

                        <div className="flex items-center gap-6 mb-6">
                            <div className="relative h-24 w-24 flex items-center justify-center">
                                <svg className="absolute inset-0 w-full h-full -rotate-90">
                                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-100 dark:text-zinc-800" />
                                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - STUDENT_DATA.stats.readiness_score / 100)} className="text-blue-500 transition-all duration-1000 ease-out" strokeLinecap="round" />
                                </svg>
                                <span className="text-2xl font-bold">{STUDENT_DATA.stats.readiness_score}%</span>
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-medium text-zinc-900 dark:text-white mb-1">Exam Readiness</div>
                                <p className="text-xs text-zinc-500 leading-relaxed">
                                    You are strong in computation but <span className="text-orange-500 font-semibold">weak in conceptual understanding</span> of eigenvalues.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {STUDENT_DATA.active_courses.map(course => (
                                <div key={course} className="space-y-1">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span>{course}</span>
                                        <span className={course === 'Linear Algebra' ? 'text-orange-500' : 'text-green-500'}>{course === 'Linear Algebra' ? 'Needs Work' : 'On Track'}</span>
                                    </div>
                                    <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${course === 'Linear Algebra' ? 'bg-orange-500 w-[60%]' : 'bg-green-500 w-[85%]'}`}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Study Habits */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <div className="flex items-center gap-2 mb-6 text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-widest text-xs">
                            <Clock className="w-4 h-4" /> Study Habits
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl">
                                <div className="text-2xl font-bold text-zinc-900 dark:text-white">{STUDENT_DATA.stats.avg_session}m</div>
                                <div className="text-xs text-zinc-500">Avg Session</div>
                            </div>
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl">
                                <div className="text-2xl font-bold text-zinc-900 dark:text-white">{STUDENT_DATA.stats.study_streak}</div>
                                <div className="text-xs text-zinc-500">Day Streak 🔥</div>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/20">
                            <div className="flex items-start gap-3">
                                <Zap className="w-5 h-5 text-blue-500 mt-0.5" />
                                <div>
                                    <div className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-1">Peak Performance</div>
                                    <p className="text-xs text-blue-600/80 dark:text-blue-400/70 leading-relaxed">
                                        You perform best in 25–40 minute sessions between <span className="font-semibold">{STUDENT_DATA.stats.productive_time}</span>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Risk Indicator */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
                        <div className="flex items-center gap-2 mb-6 text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-widest text-xs">
                            <AlertTriangle className="w-4 h-4" /> Risk Meter
                        </div>

                        <div className="flex-1 flex flex-col justify-center items-center text-center">
                            <div className="inline-block px-4 py-1.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 font-bold text-sm mb-4">
                                {STUDENT_DATA.risk.level} Risk
                            </div>
                            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-[200px]">
                                {STUDENT_DATA.risk.reason}
                            </p>
                        </div>

                        <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-xs text-center text-zinc-400">
                            Silent indicator based on engagement & failure rates.
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 3. TOPIC MAP (Strengths & Weaknesses) */}
                    <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Topic Mastery: Linear Algebra</h2>
                            <select className="bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-sm outline-none">
                                <option>Linear Algebra</option>
                                <option>Calculus II</option>
                            </select>
                        </div>

                        <div className="space-y-4">
                            {STUDENT_DATA.topics["Linear Algebra"].map((topic, i) => (
                                <div key={i} className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800 cursor-pointer">
                                    <div className={`w-2 h-2 rounded-full ${topic.status === 'good' ? 'bg-green-500' : topic.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                                        }`} />

                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-semibold text-zinc-900 dark:text-white">{topic.name}</span>
                                            <span className="text-zinc-500 font-mono text-sm">{topic.mastery}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${topic.status === 'good' ? 'bg-green-500' : topic.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                style={{ width: `${topic.mastery}%` }}
                                            />
                                        </div>
                                    </div>

                                    <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-blue-500 transition-colors" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 4. RECOMMENDATIONS (Focus Next) */}
                    <div className="bg-zinc-900 text-white rounded-3xl p-8 shadow-sm flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                        <h2 className="text-xl font-bold mb-6 relative z-10 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                            Recommended Focus
                        </h2>

                        <div className="space-y-4 relative z-10">
                            {STUDENT_DATA.recommendations.map((rec, i) => (
                                <div key={i} className="p-4 bg-white/10 hover:bg-white/15 backdrop-blur-sm rounded-2xl border border-white/10 transition-all cursor-pointer group">
                                    <div className="flex justify-between mb-2">
                                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${rec.type === 'Concept' ? 'bg-purple-500/30 text-purple-200' :
                                                rec.type === 'Problem' ? 'bg-blue-500/30 text-blue-200' :
                                                    'bg-green-500/30 text-green-200'
                                            }`}>
                                            {rec.type}
                                        </span>
                                        <span className="text-xs text-zinc-400">{rec.time}</span>
                                    </div>
                                    <div className="font-medium text-sm mb-2 group-hover:text-blue-300 transition-colors">{rec.title}</div>
                                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                                        <TrendingUp className="w-3 h-3" /> Impact: <span className="text-white">{rec.impact}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="mt-auto w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/30 relative z-10">
                            Start Adaptive Session
                        </button>
                    </div>
                </div>

                {/* 5. SETTINGS PREVIEW */}
                <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Preferences</h3>
                        <button className="text-sm font-medium text-blue-600 hover:underline">Manage all settings</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                        <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                            <span className="text-sm font-medium">Daily Goal</span>
                            <span className="text-sm font-bold">45 min</span>
                        </div>
                        <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                            <span className="text-sm font-medium">Difficulty</span>
                            <span className="text-sm font-bold">Adaptive</span>
                        </div>
                        <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                            <span className="text-sm font-medium">AI Coach</span>
                            <span className="text-sm font-bold">Proactive</span>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}

// Simple Icon Component for reuse
function Building2({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12h12" /><path d="M6 7h12" /><path d="M6 17h12" /><path d="M2 22h20" />
        </svg>
    )
}
