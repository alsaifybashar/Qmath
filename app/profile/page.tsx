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
    ChevronRight,
    Award,
    BookOpen,
    Flame,
    BarChart3,
    Info,
    LayoutDashboard,
    Palette,
    Users,
    MessageSquare,
    Package,
    FileText,
    PieChart,
    Settings,
    Shield,
    HelpCircle,
    Search,
    Bell,
    Plus,
    Gift,
    Menu,
    ChevronDown,
    LogOut,
    Play,
    Timer,
    Lightbulb,
    XCircle,
    CheckCircle
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

// =============================================================================
// MOCK DATA (ENHANCED FOR NEW LAYOUT)
// =============================================================================
const STUDENT_DATA = {
    name: "Alex Andersson",
    role: "Engineering Student",
    level: 3,
    xp_current: 440,
    xp_next: 800,

    // 1. Academic Status Breakdown
    exam_readiness: 68,
    status_insights: {
        coverage: "68% of expected exam content",
        risk: "2 high-weight topics below target",
        time_pressure: "Current pace is sufficient"
    },

    // 2. Momentum Stats
    streak: {
        current: 2,
        avg_session: "32 min",
        weekly_load: "+6h vs last week",
    },

    // 3. Course Health (Strengths & Weaknesses)
    course_health: [
        {
            subject: "Linear Algebra",
            strong: [
                { topic: "Vector Spaces", mastery: 92, last_practiced: "2d ago" },
                { topic: "Matrix Operations", mastery: 88, last_practiced: "5d ago" }
            ],
            weak: [
                { topic: "Eigenvalues", mastery: 45, weight: "High", last_practiced: "Never" },
                { topic: "Diagonalization", mastery: 52, weight: "Medium", last_practiced: "1w ago" }
            ]
        }
    ],

    // 4. Study Rhythm (Chart & Insight)
    study_rhythm: {
        insight: "Your performance is highest on days with 25–40 min sessions.",
        optimal_range: [25, 45], // minutes
        history: [
            { day: "S", minutes: 15, optimal: false },
            { day: "M", minutes: 40, optimal: true },
            { day: "T", minutes: 35, optimal: true },
            { day: "W", minutes: 0, optimal: false },
            { day: "T", minutes: 90, optimal: false }, // Burnout risk?
            { day: "F", minutes: 30, optimal: true },
            { day: "S", minutes: 0, optimal: false },
        ]
    },

    // 5. Learning Momentum (Chart & Annotations)
    learning_momentum: {
        insight: "Mastery improving steadily (last 7 days)",
        trend: [45, 48, 52, 55, 62, 58, 72],
        annotations: [
            { index: 4, text: "Eigenvalues improved" },
            { index: 6, text: "New topic introduced" }
        ]
    },

    // 6. Diagnostics (Mistake Breakdown)
    mistakes: {
        insight: "Most mistakes are conceptual — focus on understanding before speed.",
        breakdown: [
            { type: "Conceptual", count: 12, percentage: 45, color: "bg-purple-500" },
            { type: "Procedural", count: 8, percentage: 30, color: "bg-blue-500" },
            { type: "Algebraic", count: 6, percentage: 25, color: "bg-orange-500" },
        ]
    },

    // 7. Next Best Actions
    next_actions: [
        { topic: "Eigenvalues", reason: "High exam weight + conceptual gaps", time: "20 min", impact: "High" },
        { topic: "Diagonalization", reason: "Recent errors in homework", time: "30 min", impact: "Medium" }
    ],

    // 8. Planning
    upcoming_events: [
        { title: "Midterm Exam", date: "Nov 12", days_left: 14, type: "Exam" },
        { title: "Problem Set 3", date: "Oct 28", days_left: 2, type: "Assignment" }
    ]
};

// =============================================================================
// MAIN PAGE LAYOUT
// =============================================================================
export default function InsightDashboard() {
    const [activeTab, setActiveTab] = useState('Dashboard');

    return (
        <div className="flex min-h-screen bg-[#F8F9FC] dark:bg-black text-[#1F2937] dark:text-zinc-100 font-sans">

            {/* SIDEBAR */}
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* MAIN CONTENT WRAPPER */}
            <div className="flex-1 flex flex-col lg:ml-64 transition-all duration-300">
                <Header />

                <main className="p-6 md:p-10 max-w-6xl mx-auto w-full space-y-8">

                    {/* 1. GLOBAL STATUS (Academic Status Panel) */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="w-1 h-5 bg-purple-600 rounded-full"></span>
                            Academic Status
                        </h2>
                        <div className="bg-white dark:bg-zinc-900 rounded-[24px] p-6 shadow-sm border border-gray-100 dark:border-zinc-800 grid grid-cols-1 lg:grid-cols-3 gap-8">

                            {/* Left: Exam Readiness Ring */}
                            <div className="lg:col-span-1 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-zinc-800 pb-6 lg:pb-0 lg:pr-6 relative">
                                <InfoTooltip title="Exam Readiness" explanation="Estimated probability of passing." calculation="Weighted mastery of all exam topics." />
                                <div className="relative w-48 h-48 mb-4">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" className="stroke-gray-100 dark:stroke-zinc-800" />
                                        <motion.circle
                                            initial={{ strokeDasharray: "0 264" }}
                                            animate={{ strokeDasharray: `${STUDENT_DATA.exam_readiness * 2.64} 264` }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            cx="50" cy="50" r="42" fill="none" strokeWidth="8"
                                            strokeLinecap="round"
                                            className="stroke-purple-600 drop-shadow-lg"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-5xl font-extrabold text-gray-900 dark:text-white tracking-tighter">{STUDENT_DATA.exam_readiness}%</span>
                                        <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full mt-2">On Track</span>
                                    </div>
                                </div>
                                <p className="text-sm font-medium text-gray-500 text-center">You are on track for this exam</p>
                            </div>

                            {/* Middle: Secondary Insights */}
                            <div className="lg:col-span-1 flex flex-col justify-center gap-6">
                                <StatusItem label="Coverage" value={STUDENT_DATA.status_insights.coverage} icon={<BookOpen size={18} />} color="text-blue-600" />
                                <StatusItem label="Risk Factor" value={STUDENT_DATA.status_insights.risk} icon={<AlertTriangle size={18} />} color="text-orange-500" />
                                <StatusItem label="Time Pressure" value={STUDENT_DATA.status_insights.time_pressure} icon={<Clock size={18} />} color="text-green-600" />
                            </div>

                            {/* Right: Momentum stats (Soft contrast) */}
                            <div className="lg:col-span-1 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl p-6 flex flex-col justify-between">
                                <div>
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Momentum</div>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-300">Daily Streak</span>
                                            <div className="flex items-center gap-2">
                                                <Flame size={16} className="text-orange-500 fill-orange-500" />
                                                <span className="text-lg font-bold text-gray-900 dark:text-white">{STUDENT_DATA.streak.current} Days</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-300">Avg. Session</span>
                                            <span className="text-lg font-bold text-gray-900 dark:text-white">{STUDENT_DATA.streak.avg_session}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-300">Weekly Load</span>
                                            <div className="flex items-center gap-1 text-green-600 font-bold bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded text-sm">
                                                <TrendingUp size={14} />
                                                {STUDENT_DATA.streak.weekly_load}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-700">
                                    <div className="text-xs text-gray-500">Your consistency score is in the top 15% of peers.</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 2-COLUMN SPLIT: Narrative vs Sidebar */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* LEFT COLUMN (2/3) - The Learning Narrative */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* SECTION: COURSE HEALTH */}
                            <section>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="text-gray-400">02</span>
                                    Course Health
                                </h2>
                                <Card className="space-y-6">
                                    {STUDENT_DATA.course_health.map((course, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="font-bold text-lg">{course.subject}</h3>
                                                <button className="text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors">
                                                    Deep Dive
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                {/* Strong Topics */}
                                                <div>
                                                    <div className="flex items-center gap-2 text-sm font-bold text-green-600 mb-3 uppercase tracking-wider">
                                                        <CheckCircle size={16} /> Strong
                                                    </div>
                                                    <div className="space-y-3">
                                                        {course.strong.map((t, j) => (
                                                            <div key={j} className="group cursor-pointer">
                                                                <div className="flex justify-between items-center text-sm mb-1">
                                                                    <span className="font-medium text-gray-700 dark:text-gray-200 group-hover:text-purple-600 transition-colors">{t.topic}</span>
                                                                    <span className="text-xs text-gray-400">{t.last_practiced}</span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${t.mastery}%` }}></div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Weak Topics */}
                                                <div>
                                                    <div className="flex items-center gap-2 text-sm font-bold text-orange-500 mb-3 uppercase tracking-wider">
                                                        <AlertTriangle size={16} /> Needs Focus
                                                    </div>
                                                    <div className="space-y-3">
                                                        {course.weak.map((t, j) => (
                                                            <div key={j} className="group cursor-pointer">
                                                                <div className="flex justify-between items-center text-sm mb-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-medium text-gray-700 dark:text-gray-200 group-hover:text-purple-600 transition-colors">{t.topic}</span>
                                                                        {t.weight === 'High' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="High Exam Weight"></span>}
                                                                    </div>
                                                                    <span className="text-xs text-gray-400">{t.last_practiced}</span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-orange-400 rounded-full" style={{ width: `${t.mastery}%` }}></div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </Card>
                            </section>

                            {/* SECTION: PROGRESS & BEHAVIOR */}
                            <section>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="text-gray-400">03</span>
                                    Progress & Behavior
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Study Rhythm Chart */}
                                    <Card>
                                        <div className="mb-4">
                                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Study Rhythm</h3>
                                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                                {STUDENT_DATA.study_rhythm.insight}
                                            </p>
                                        </div>
                                        <div className="h-40 flex items-end justify-between gap-2 px-2 relative">
                                            {/* Optimal Band */}
                                            <div className="absolute left-0 right-0 bottom-[30%] h-[25%] bg-blue-50 dark:bg-blue-900/10 border-y border-blue-100 dark:border-blue-900/20 z-0"></div>

                                            {STUDENT_DATA.study_rhythm.history.map((d, i) => (
                                                <div key={i} className="flex-1 flex flex-col items-center gap-2 z-10 relative">
                                                    <div className={`w-full rounded-t-sm transition-all ${d.optimal ? 'bg-blue-500' : 'bg-gray-300 dark:bg-zinc-700'}`} style={{ height: `${d.minutes}px`, maxHeight: '100%' }}></div>
                                                    <span className="text-[10px] font-bold text-gray-400">{d.day}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>

                                    {/* Learning Momentum Chart */}
                                    <Card>
                                        <div className="mb-4">
                                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Learning Momentum</h3>
                                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                                {STUDENT_DATA.learning_momentum.insight}
                                            </p>
                                        </div>
                                        <div className="h-40 relative flex items-end">
                                            <svg className="w-full h-full overflow-visible">
                                                {/* Trend Line */}
                                                <motion.path
                                                    initial={{ pathLength: 0 }}
                                                    animate={{ pathLength: 1 }}
                                                    transition={{ duration: 2 }}
                                                    d={`M0,${100 - STUDENT_DATA.learning_momentum.trend[0]} L${100 / 6 * 1},${100 - STUDENT_DATA.learning_momentum.trend[1]} L${100 / 6 * 2},${100 - STUDENT_DATA.learning_momentum.trend[2]} L${100 / 6 * 3},${100 - STUDENT_DATA.learning_momentum.trend[3]} L${100 / 6 * 4},${100 - STUDENT_DATA.learning_momentum.trend[4]} L${100 / 6 * 5},${100 - STUDENT_DATA.learning_momentum.trend[5]} L100,${100 - STUDENT_DATA.learning_momentum.trend[6]}`}
                                                    fill="none" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                                                />
                                                {/* Annotations */}
                                                {STUDENT_DATA.learning_momentum.annotations.map((note, i) => (
                                                    <g key={i}>
                                                        <circle cx={`${100 / 6 * note.index}`} cy={`${100 - STUDENT_DATA.learning_momentum.trend[note.index]}`} r="4" className="fill-white stroke-purple-600 stroke-2" />
                                                        <foreignObject x={`${100 / 6 * note.index - 20}`} y={`${100 - STUDENT_DATA.learning_momentum.trend[note.index] - 30}`} width="100" height="40">
                                                            <div className="bg-purple-600 text-white text-[8px] px-1.5 py-0.5 rounded shadow-sm w-fit whitespace-nowrap">
                                                                {note.text}
                                                            </div>
                                                        </foreignObject>
                                                    </g>
                                                ))}
                                            </svg>
                                        </div>
                                    </Card>
                                </div>
                            </section>

                            {/* SECTION: DIAGNOSTICS (Mistake Breakdown) */}
                            <section>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="text-gray-400">04</span>
                                    Diagnostics
                                </h2>
                                <Card>
                                    <div className="flex flex-col md:flex-row gap-8 items-center">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Why you lose points</h3>
                                            <p className="text-sm text-gray-500 mb-6">{STUDENT_DATA.mistakes.insight}</p>

                                            {/* Stacked Bar */}
                                            <div className="w-full h-8 flex rounded-full overflow-hidden mb-4">
                                                {STUDENT_DATA.mistakes.breakdown.map((m, i) => (
                                                    <div key={i} className={`${m.color} h-full tooltip-trigger relative group`} style={{ width: `${m.percentage}%` }}>
                                                        <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap transition-opacity">
                                                            {m.percentage}%
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Legend */}
                                            <div className="flex gap-4 flex-wrap">
                                                {STUDENT_DATA.mistakes.breakdown.map((m, i) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        <div className={`w-3 h-3 rounded-full ${m.color}`}></div>
                                                        <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">{m.type}</span>
                                                        <span className="text-xs text-gray-400">({m.count} err)</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Actionable Advice */}
                                        <div className="w-full md:w-1/3 bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-900/20">
                                            <div className="flex items-start gap-3">
                                                <Lightbulb className="text-purple-600 flex-shrink-0" size={20} />
                                                <div>
                                                    <h4 className="text-sm font-bold text-purple-900 dark:text-purple-100 mb-1">Recommended Fix</h4>
                                                    <p className="text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
                                                        Try the "Deep Concept Review" mode for 15 minutes before starting practice problems.
                                                    </p>
                                                    <button className="text-xs font-bold text-purple-600 underline mt-2 hover:text-purple-800">Start Concept Review</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </section>

                        </div>

                        {/* RIGHT COLUMN (1/3) - Planning & Actions */}
                        <div className="space-y-8">

                            {/* SECTION: NEXT BEST ACTIONS */}
                            <div className="bg-gradient-to-b from-blue-600 to-indigo-700 rounded-[24px] p-6 text-white shadow-lg relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl group-hover:bg-white/20 transition-all"></div>
                                <h3 className="font-bold text-lg mb-1 relative z-10">Next Session Focus</h3>
                                <p className="text-blue-100 text-sm mb-6 relative z-10">Maximize your impact in 30 mins</p>

                                <div className="space-y-3 relative z-10">
                                    {STUDENT_DATA.next_actions.map((action, i) => (
                                        <div key={i} className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10 hover:bg-white/20 transition-colors cursor-pointer">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="font-bold">{action.topic}</div>
                                                <div className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded text-blue-50">
                                                    {action.impact} Impact
                                                </div>
                                            </div>
                                            <div className="text-xs text-blue-100 mb-3">{action.reason}</div>
                                            <div className="flex items-center gap-2 text-xs font-bold text-blue-200">
                                                <Timer size={14} /> {action.time}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full mt-6 bg-white text-blue-600 font-bold py-3 rounded-xl shadow-md hover:shadow-lg hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                                    <Play size={18} fill="currentColor" /> Start Session
                                </button>
                            </div>

                            {/* SECTION: PLANNING */}
                            <section>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Upcoming Events</h2>
                                <Card className="p-0 overflow-hidden">
                                    {STUDENT_DATA.upcoming_events.map((event, i) => (
                                        <div key={i} className={`p-5 flex gap-4 ${i !== 0 ? 'border-t border-gray-100 dark:border-zinc-800' : ''}`}>
                                            <div className="flex flex-col items-center">
                                                <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-zinc-600 mb-1"></div>
                                                <div className="w-0.5 flex-1 bg-gray-100 dark:bg-zinc-800"></div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-gray-900 dark:text-gray-100">{event.title}</span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${event.days_left <= 3 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                                                        {event.days_left} days left
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500">{event.date} • {event.type}</div>
                                            </div>
                                        </div>
                                    ))}
                                    <button className="w-full py-3 bg-gray-50 dark:bg-zinc-800/50 text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors border-t border-gray-100 dark:border-zinc-800">
                                        View Full Calendar
                                    </button>
                                </Card>
                            </section>

                            {/* Help Box */}
                            <div className="p-6 bg-[#F3F6F8] dark:bg-zinc-800 border border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl text-center">
                                <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-2">Need a study plan?</h4>
                                <p className="text-xs text-gray-500 mb-4">Our AI can generate a custom schedule based on your weak areas.</p>
                                <button className="text-xs font-bold text-purple-600 border border-purple-200 bg-white px-4 py-2 rounded-lg hover:shadow-sm transition-all">
                                    Generate Plan
                                </button>
                            </div>

                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

// =============================================================================
// SUB-COMPONENTS & HELPERS
// =============================================================================

function StatusItem({ label, value, icon, color }: any) {
    return (
        <div className="flex items-start gap-3">
            <div className={`mt-0.5 ${color}`}>
                {icon}
            </div>
            <div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
            </div>
        </div>
    )
}

function Sidebar({ activeTab, setActiveTab }: any) {
    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-zinc-900 border-r border-[#EFEFEF] dark:border-zinc-800 hidden lg:flex flex-col p-6 z-50">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-10 px-2">
                <div className="w-8 h-8 bg-[#5347CE] rounded-lg flex items-center justify-center text-white font-bold text-xl skew-x-[-10deg]">
                    N
                </div>
                <span className="text-xl font-bold tracking-tight text-[#1A1A1A] dark:text-white">Nexus</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-8">
                {/* General Section */}
                <div>
                    <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 px-3">General</div>
                    <nav className="space-y-0.5">
                        <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} />
                        <NavItem icon={<Palette size={18} />} label="Courses" />
                        <NavItem icon={<Users size={18} />} label="Peers" />
                        <NavItem icon={<MessageSquare size={18} />} label="Messages" badge="8" />
                    </nav>
                </div>
                <div>
                    <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 px-3">Tools</div>
                    <nav className="space-y-0.5">
                        <NavItem icon={<BookOpen size={18} />} label="Library" />
                        <NavItem icon={<FileText size={18} />} label="Assignments" />
                        <NavItem icon={<BarChart3 size={18} />} label="Analytics" />
                    </nav>
                </div>
                <div>
                    <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 px-3">Support</div>
                    <nav className="space-y-0.5">
                        <NavItem icon={<Settings size={18} />} label="Settings" />
                        <NavItem icon={<HelpCircle size={18} />} label="Help" />
                    </nav>
                </div>
            </div>

            {/* Upgrade Plan Card */}
            <div className="mt-6 p-4 bg-[#F8F9FA] dark:bg-zinc-800 rounded-2xl border border-[#EFEFEF] dark:border-zinc-700">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-400 flex items-center justify-center text-white">
                        <Zap size={16} fill="currentColor" />
                    </div>
                    <div>
                        <div className="text-xs font-bold">Team</div>
                        <div className="text-xs font-medium text-zinc-500">Marketing</div>
                    </div>
                    <ChevronDown size={14} className="ml-auto text-zinc-400" />
                </div>
                <button className="w-full py-1.5 bg-white dark:bg-zinc-900 border border-[#EFEFEF] dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-300 shadow-sm">
                    Upgrade Plan
                </button>
            </div>

            <div className="mt-4 text-[10px] text-zinc-400 text-center">
                @ 2026 Nexus.io, Inc.
            </div>
        </aside>
    )
}

function Header() {
    return (
        <header className="h-20 bg-white dark:bg-zinc-900 border-b border-[#EFEFEF] dark:border-zinc-800 flex items-center justify-between px-6 md:px-10 sticky top-0 z-40">
            {/* Search */}
            <div className="flex-1 max-w-xl relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                <input
                    type="text"
                    placeholder="Search"
                    className="w-full h-10 pl-10 pr-4 bg-transparent border-none outline-none text-sm text-zinc-600 dark:text-zinc-300 placeholder:text-zinc-400 font-medium"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400 bg-[#F3F4F6] dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-[#EFEFEF] dark:border-zinc-700">
                    ⌘ F
                </div>
            </div>

            {/* Mobile Menu Toggle */}
            <button className="md:hidden text-zinc-500">
                <Menu size={24} />
            </button>

            {/* Right Actions */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-4 text-zinc-400">
                    <button className="hover:text-zinc-600 dark:hover:text-zinc-200"><Gift size={20} /></button>
                    <button className="hover:text-zinc-600 dark:hover:text-zinc-200 relative">
                        <Bell size={20} />
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900"></span>
                    </button>
                    <button className="hover:text-zinc-600 dark:hover:text-zinc-200"><Plus size={20} /></button>
                </div>

                <div className="w-px h-8 bg-[#EFEFEF] dark:bg-zinc-800 hidden md:block"></div>

                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="Profile" className="w-full h-full object-cover" />
                    </div>
                    <div className="hidden md:block leading-tight">
                        <div className="text-xs font-bold text-[#1A1A1A] dark:text-white">Young Alaska</div>
                        <div className="text-[10px] text-zinc-500">Business</div>
                    </div>
                    <ChevronDown size={14} className="text-zinc-400 hidden md:block" />
                </div>
            </div>
        </header>
    )
}

function NavItem({ icon, label, active = false, badge, badgeColor = "bg-red-500 text-white", onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active
                    ? 'bg-[#F3F4F6] text-[#1A1A1A] dark:bg-zinc-800 dark:text-white'
                    : 'text-zinc-500 hover:text-zinc-700 hover:bg-gray-50 dark:hover:text-zinc-300 dark:hover:bg-zinc-800/50'
                }`}
        >
            <div className="flex items-center gap-3">
                {icon}
                <span>{label}</span>
            </div>
            {badge && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${badgeColor}`}>
                    {badge}
                </span>
            )}
        </button>
    )
}

function Card({ children, className = "" }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={`bg-white dark:bg-zinc-900 rounded-[24px] p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-zinc-800 ${className}`}>
            {children}
        </div>
    );
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
