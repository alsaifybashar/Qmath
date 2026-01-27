'use client';

import {
    Target, TrendingUp, Clock, Zap, Brain, AlertTriangle, CheckCircle,
    Calendar as CalendarIcon, ChevronRight, Award, BookOpen, Flame,
    BarChart3, Settings, Bell, Play, Timer, Lightbulb, Home, Layers,
    Search, Command, X, FileText, HelpCircle, User, CreditCard,
    Menu, ChevronLeft, LogOut, MessageSquare, Download
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

// =============================================================================
// MOCK DATA
// =============================================================================
const STUDENT_DATA = {
    name: "Alex Andersson",
    role: "Engineering Student",
    exam_readiness: 68,
    status_insights: {
        coverage: "68% of expected exam content",
        risk: "2 high-weight topics below target",
        time_pressure: "Current pace is sufficient"
    },
    streak: {
        current: 7,
        avg_session: "32 min",
        weekly_load: "+6h vs last week",
    },
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
    study_rhythm: {
        insight: "Your performance is highest on days with 25–40 min sessions.",
        history: [
            { day: "S", minutes: 15, optimal: false },
            { day: "M", minutes: 40, optimal: true },
            { day: "T", minutes: 35, optimal: true },
            { day: "W", minutes: 0, optimal: false },
            { day: "T", minutes: 90, optimal: false },
            { day: "F", minutes: 30, optimal: true },
            { day: "S", minutes: 0, optimal: false },
        ]
    },
    mistakes: {
        insight: "Most mistakes are conceptual — focus on understanding before speed.",
        breakdown: [
            { type: "Conceptual", count: 12, percentage: 45, color: "bg-purple-500" },
            { type: "Procedural", count: 8, percentage: 30, color: "bg-blue-500" },
            { type: "Algebraic", count: 6, percentage: 25, color: "bg-orange-500" },
        ]
    },
    next_actions: [
        { topic: "Eigenvalues", reason: "High exam weight + conceptual gaps", time: "20 min", impact: "High" },
        { topic: "Diagonalization", reason: "Recent errors in homework", time: "30 min", impact: "Medium" }
    ],
    upcoming_events: [
        { title: "Midterm Exam", date: "Jan 20", days_left: 12, type: "Exam" },
        { title: "Problem Set 3", date: "Jan 10", days_left: 2, type: "Assignment" }
    ]
};

// Progress Analytics Data
const weeklyStudyData = [
    { day: 'Mon', hours: 2.5, questions: 45 },
    { day: 'Tue', hours: 1.8, questions: 32 },
    { day: 'Wed', hours: 3.2, questions: 58 },
    { day: 'Thu', hours: 2.1, questions: 38 },
    { day: 'Fri', hours: 1.5, questions: 28 },
    { day: 'Sat', hours: 4.0, questions: 72 },
    { day: 'Sun', hours: 2.8, questions: 51 }
];

const masteryTrendData = [
    { week: 'W1', mastery: 28 },
    { week: 'W2', mastery: 35 },
    { week: 'W3', mastery: 42 },
    { week: 'W4', mastery: 48 },
    { week: 'W5', mastery: 52 },
    { week: 'W6', mastery: 58 },
    { week: 'W7', mastery: 62 },
    { week: 'W8', mastery: 68 }
];

const subjectMasteryData = [
    { subject: 'Calculus I', value: 72 },
    { subject: 'Linear Algebra', value: 58 },
    { subject: 'Mechanics', value: 45 },
    { subject: 'Diff. Eq.', value: 32 },
    { subject: 'Statistics', value: 68 }
];

const achievements = [
    { id: 1, name: 'First Steps', description: 'Complete your first question', icon: '🎯', unlocked: true },
    { id: 2, name: 'Week Warrior', description: '7-day streak', icon: '🔥', unlocked: true },
    { id: 3, name: 'Century Club', description: 'Answer 100 questions', icon: '💯', unlocked: true },
    { id: 4, name: 'Speed Demon', description: 'Answer 10 questions in under 5 minutes', icon: '⚡', unlocked: false },
    { id: 5, name: 'Perfect Score', description: 'Get 10 correct in a row', icon: '⭐', unlocked: false }
];

// Sidebar navigation items - grouped
const NAV_SECTIONS = [
    {
        label: 'GENERAL',
        items: [
            { href: '/dashboard', icon: Home, label: 'Dashboard', active: true },
            { href: '/courses', icon: BookOpen, label: 'Courses' },
            { href: '/flashcards', icon: Layers, label: 'Flashcards' },
        ]
    },
    {
        label: 'TOOLS',
        items: [
            { href: '/study', icon: Brain, label: 'Study' },
            { href: '/exams', icon: FileText, label: 'Exams' },
        ]
    },
    {
        label: 'SUPPORT',
        items: [
            { href: '/settings', icon: Settings, label: 'Settings' },
            { href: '/profile', icon: User, label: 'Profile' },
            { href: '/help', icon: HelpCircle, label: 'Help' },
        ]
    }
];

// Search results categories
const SEARCH_ITEMS = [
    {
        category: 'Pages', items: [
            { name: 'Dashboard', href: '/dashboard', icon: Home },
            { name: 'Courses', href: '/courses', icon: BookOpen },
            { name: 'Flashcards', href: '/flashcards', icon: Layers },
            { name: 'Exams', href: '/exams', icon: FileText },
            { name: 'Progress', href: '/progress', icon: BarChart3 },
            { name: 'Study', href: '/study', icon: Brain },
            { name: 'Settings', href: '/settings', icon: Settings },
            { name: 'Profile', href: '/profile', icon: User },
            { name: 'Help', href: '/help', icon: HelpCircle },
        ]
    },
    {
        category: 'Quick Actions', items: [
            { name: 'Start Study Session', href: '/study', icon: Play },
            { name: 'Review Flashcards', href: '/flashcards/review', icon: Layers },
            { name: 'Take Exam', href: '/exam', icon: FileText },
        ]
    },
];

// =============================================================================
// SIDEBAR COMPONENT
// =============================================================================
function Sidebar({ isOpen, onToggle }: { isOpen: boolean, onToggle: () => void }) {
    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={onToggle}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: isOpen ? 256 : 72 }}
                className={`fixed left-0 top-0 h-screen bg-white dark:bg-zinc-950 border-r border-zinc-100 dark:border-zinc-800 z-50 flex flex-col transition-all duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    }`}
            >
                {/* Header */}
                <div className={`p-4 flex items-center ${isOpen ? 'justify-between' : 'justify-center'}`}>
                    {isOpen && (
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">Q</div>
                            <span className="font-bold text-lg text-zinc-900 dark:text-white">Qmath</span>
                        </Link>
                    )}
                    <button
                        onClick={onToggle}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500"
                    >
                        {isOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-2 overflow-y-auto">
                    {NAV_SECTIONS.map((section, sectionIdx) => (
                        <div key={section.label} className={sectionIdx > 0 ? 'mt-6' : ''}>
                            {/* Section Label */}
                            {isOpen && (
                                <div className="px-3 mb-2 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 tracking-wider">
                                    {section.label}
                                </div>
                            )}

                            {/* Section Items */}
                            <div className="space-y-1">
                                {section.items.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all group ${item.active
                                            ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                                            }`}
                                    >
                                        <item.icon className={`w-5 h-5 flex-shrink-0 ${item.active
                                            ? 'text-violet-600 dark:text-violet-400'
                                            : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
                                            }`} />
                                        {isOpen && (
                                            <span className={`flex-1 text-sm ${item.active
                                                ? 'font-medium'
                                                : 'group-hover:text-zinc-900 dark:group-hover:text-white'
                                                }`}>
                                                {item.label}
                                            </span>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Bottom Section */}
                <div className="p-3 border-t border-zinc-100 dark:border-zinc-800">
                    {/* User Card */}
                    {isOpen && (
                        <div className="p-3 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/10 dark:to-purple-900/10 rounded-xl border border-violet-100 dark:border-violet-800/30 mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                    <Brain className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm text-zinc-700 dark:text-zinc-200 truncate">{STUDENT_DATA.name}</div>
                                    <div className="text-xs text-zinc-500 truncate">{STUDENT_DATA.role}</div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-zinc-400" />
                            </div>
                        </div>
                    )}

                    {/* Upgrade Button */}
                    {isOpen && (
                        <Link
                            href="/pricing"
                            className="block w-full py-2.5 text-center text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Upgrade Plan
                        </Link>
                    )}

                    {/* Footer */}
                    {isOpen && (
                        <div className="mt-4 text-center text-[11px] text-zinc-400 dark:text-zinc-600">
                            © 2026 Qmath, Inc.
                        </div>
                    )}
                </div>
            </motion.aside>
        </>
    );
}

// =============================================================================
// SEARCH COMMAND PALETTE
// =============================================================================
function SearchCommandPalette({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const filteredResults = SEARCH_ITEMS.map(category => ({
        ...category,
        items: category.items.filter(item =>
            item.name.toLowerCase().includes(query.toLowerCase())
        )
    })).filter(category => category.items.length > 0);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl z-[60] px-4"
                    >
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                            <div className="flex items-center gap-3 p-4 border-b border-zinc-200 dark:border-zinc-800">
                                <Search className="w-5 h-5 text-zinc-400" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Search pages, actions..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="flex-1 bg-transparent outline-none text-lg placeholder:text-zinc-400"
                                />
                                <button onClick={onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
                                    <X className="w-5 h-5 text-zinc-400" />
                                </button>
                            </div>

                            <div className="max-h-[400px] overflow-y-auto p-2">
                                {filteredResults.length === 0 ? (
                                    <div className="p-8 text-center text-zinc-500">
                                        <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p>No results found</p>
                                    </div>
                                ) : (
                                    filteredResults.map((category) => (
                                        <div key={category.category} className="mb-4">
                                            <div className="px-3 py-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                                {category.category}
                                            </div>
                                            {category.items.map((item) => (
                                                <Link
                                                    key={item.name}
                                                    href={item.href}
                                                    onClick={onClose}
                                                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
                                                >
                                                    <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                                                        <item.icon className="w-4 h-4 text-zinc-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                                                    </div>
                                                    <span className="font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                        {item.name}
                                                    </span>
                                                    <ChevronRight className="w-4 h-4 text-zinc-300 ml-auto" />
                                                </Link>
                                            ))}
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-[10px] font-mono">Esc</kbd>
                                    Close
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// =============================================================================
// MAIN DASHBOARD
// =============================================================================
export default function DashboardPage() {
    const [searchOpen, setSearchOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Keyboard shortcut: Ctrl+K to open search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(true);
            }
            if (e.key === 'Escape') {
                setSearchOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white transition-colors">
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

            {/* Search Command Palette */}
            <SearchCommandPalette isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

            {/* Main Content */}
            <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-[72px]'}`}>
                {/* Top Nav */}
                <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-30">
                    <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center gap-4">
                        {/* Mobile menu button */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        {/* Search Bar */}
                        <button
                            onClick={() => setSearchOpen(true)}
                            className="flex-1 max-w-md flex items-center gap-3 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all group"
                        >
                            <Search className="w-4 h-4" />
                            <span className="flex-1 text-left text-sm">Search anything...</span>
                            <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">
                                <Command className="w-3 h-3" />K
                            </kbd>
                        </button>

                        <div className="flex items-center gap-2 sm:gap-4">
                            <button className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors relative">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>
                            <Link href="/profile" className="w-9 h-9 rounded-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-700 lg:hidden">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="Profile" className="w-full h-full object-cover" />
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                    >
                        <div>
                            <h1 className="text-3xl font-bold">
                                Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">{STUDENT_DATA.name}!</span>
                            </h1>
                            <p className="text-zinc-500 mt-1">What would you like to do today?</p>
                        </div>
                        <div className="flex gap-3">
                            <Link href="/study" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition font-medium flex items-center gap-2">
                                <Play className="w-4 h-4" />
                                Start Studying
                            </Link>
                        </div>
                    </motion.div>

                    {/* Academic Status */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="w-1 h-5 bg-purple-600 rounded-full"></span>
                            Academic Status
                        </h2>
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Exam Readiness Ring */}
                            <div className="lg:col-span-1 flex flex-col items-center justify-center lg:border-r border-zinc-100 dark:border-zinc-800">
                                <div className="relative w-40 h-40 mb-4">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" className="stroke-zinc-100 dark:stroke-zinc-800" />
                                        <motion.circle
                                            initial={{ strokeDasharray: "0 264" }}
                                            animate={{ strokeDasharray: `${STUDENT_DATA.exam_readiness * 2.64} 264` }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            cx="50" cy="50" r="42" fill="none" strokeWidth="8"
                                            strokeLinecap="round"
                                            className="stroke-purple-600"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-4xl font-extrabold">{STUDENT_DATA.exam_readiness}%</span>
                                        <span className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded-full mt-2">On Track</span>
                                    </div>
                                </div>
                                <p className="text-sm text-zinc-500 text-center">Exam Readiness</p>
                            </div>

                            {/* Status Insights */}
                            <div className="lg:col-span-1 flex flex-col justify-center gap-5">
                                <StatusItem label="Coverage" value={STUDENT_DATA.status_insights.coverage} icon={<BookOpen size={18} />} color="text-blue-500" />
                                <StatusItem label="Risk Factor" value={STUDENT_DATA.status_insights.risk} icon={<AlertTriangle size={18} />} color="text-orange-500" />
                                <StatusItem label="Time Pressure" value={STUDENT_DATA.status_insights.time_pressure} icon={<Clock size={18} />} color="text-green-500" />
                            </div>

                            {/* Momentum */}
                            <div className="lg:col-span-1 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-5">
                                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Momentum</div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-zinc-600 dark:text-zinc-300">Daily Streak</span>
                                        <div className="flex items-center gap-2">
                                            <Flame size={16} className="text-orange-500" />
                                            <span className="text-lg font-bold">{STUDENT_DATA.streak.current} Days</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-zinc-600 dark:text-zinc-300">Avg. Session</span>
                                        <span className="text-lg font-bold">{STUDENT_DATA.streak.avg_session}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-zinc-600 dark:text-zinc-300">Weekly Load</span>
                                        <div className="flex items-center gap-1 text-green-600 font-bold bg-green-100 dark:bg-green-900/20 px-2 py-0.5 rounded text-sm">
                                            <TrendingUp size={14} />
                                            {STUDENT_DATA.streak.weekly_load}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    {/* Two Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Course Health & Progress */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Course Health */}
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <span className="text-zinc-400">02</span>
                                    Course Health
                                </h2>
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
                                    {STUDENT_DATA.course_health.map((course, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="font-bold text-lg">{course.subject}</h3>
                                                <Link href="/courses" className="text-xs font-bold text-purple-600 bg-purple-100 dark:bg-purple-900/20 px-3 py-1.5 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/30 transition-colors">
                                                    Deep Dive
                                                </Link>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-8">
                                                <div>
                                                    <div className="flex items-center gap-2 text-sm font-bold text-green-600 mb-3 uppercase tracking-wider">
                                                        <CheckCircle size={16} /> Strong
                                                    </div>
                                                    <div className="space-y-3">
                                                        {course.strong.map((t, j) => (
                                                            <div key={j} className="group cursor-pointer">
                                                                <div className="flex justify-between items-center text-sm mb-1">
                                                                    <span className="font-medium group-hover:text-purple-600 transition-colors">{t.topic}</span>
                                                                    <span className="text-xs text-zinc-400">{t.last_practiced}</span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${t.mastery}%` }}></div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-2 text-sm font-bold text-orange-500 mb-3 uppercase tracking-wider">
                                                        <AlertTriangle size={16} /> Needs Focus
                                                    </div>
                                                    <div className="space-y-3">
                                                        {course.weak.map((t, j) => (
                                                            <div key={j} className="group cursor-pointer">
                                                                <div className="flex justify-between items-center text-sm mb-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-medium group-hover:text-purple-600 transition-colors">{t.topic}</span>
                                                                        {t.weight === 'High' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                                                                    </div>
                                                                    <span className="text-xs text-zinc-400">{t.last_practiced}</span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-orange-400 rounded-full" style={{ width: `${t.mastery}%` }}></div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.section>

                            {/* Study Rhythm */}
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <span className="text-zinc-400">03</span>
                                    Study Rhythm
                                </h2>
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
                                    <p className="text-sm text-zinc-500 mb-4">{STUDENT_DATA.study_rhythm.insight}</p>
                                    <div className="h-32 flex items-end justify-between gap-2 px-2 relative">
                                        <div className="absolute left-0 right-0 bottom-[30%] h-[25%] bg-blue-50 dark:bg-blue-900/10 border-y border-blue-100 dark:border-blue-900/20 z-0"></div>
                                        {STUDENT_DATA.study_rhythm.history.map((d, i) => (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-2 z-10 relative">
                                                <div className={`w-full rounded-t transition-all ${d.optimal ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-700'}`} style={{ height: `${d.minutes}px`, maxHeight: '100%' }}></div>
                                                <span className="text-[10px] font-bold text-zinc-400">{d.day}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.section>

                            {/* Diagnostics */}
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <span className="text-zinc-400">04</span>
                                    Diagnostics
                                </h2>
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
                                    <div className="flex flex-col md:flex-row gap-8 items-center">
                                        <div className="flex-1">
                                            <h3 className="font-bold mb-2">Why you lose points</h3>
                                            <p className="text-sm text-zinc-500 mb-4">{STUDENT_DATA.mistakes.insight}</p>

                                            <div className="w-full h-6 flex rounded-full overflow-hidden mb-4">
                                                {STUDENT_DATA.mistakes.breakdown.map((m, i) => (
                                                    <div key={i} className={`${m.color} h-full relative group`} style={{ width: `${m.percentage}%` }}>
                                                        <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap transition-opacity">
                                                            {m.percentage}%
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex gap-4 flex-wrap">
                                                {STUDENT_DATA.mistakes.breakdown.map((m, i) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        <div className={`w-3 h-3 rounded-full ${m.color}`}></div>
                                                        <span className="text-sm font-medium">{m.type}</span>
                                                        <span className="text-xs text-zinc-400">({m.count})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="w-full md:w-1/3 bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-200 dark:border-purple-900/30">
                                            <div className="flex items-start gap-3">
                                                <Lightbulb className="text-purple-600 flex-shrink-0" size={20} />
                                                <div>
                                                    <h4 className="text-sm font-bold text-purple-900 dark:text-purple-100 mb-1">Recommended Fix</h4>
                                                    <p className="text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
                                                        Try "Deep Concept Review" for 15 minutes before practice.
                                                    </p>
                                                    <Link href="/ai/chat" className="text-xs font-bold text-purple-600 underline mt-2 inline-block">Start Review</Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.section>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-8">
                            {/* Next Session Focus */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-gradient-to-b from-blue-600 to-indigo-700 rounded-2xl p-6 text-white relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
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
                                <Link href="/study" className="w-full mt-6 bg-white text-blue-600 font-bold py-3 rounded-xl shadow-md hover:shadow-lg hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                                    <Play size={18} /> Start Session
                                </Link>
                            </motion.div>

                            {/* Upcoming Events */}
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <h2 className="text-lg font-bold mb-4">Upcoming Events</h2>
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                                    {STUDENT_DATA.upcoming_events.map((event, i) => (
                                        <div key={i} className={`p-5 flex gap-4 ${i !== 0 ? 'border-t border-zinc-100 dark:border-zinc-800' : ''}`}>
                                            <div className="flex flex-col items-center">
                                                <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600 mb-1"></div>
                                                <div className="w-0.5 flex-1 bg-zinc-100 dark:bg-zinc-800"></div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold">{event.title}</span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${event.days_left <= 3 ? 'bg-red-100 dark:bg-red-900/20 text-red-600' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                                                        {event.days_left}d left
                                                    </span>
                                                </div>
                                                <div className="text-xs text-zinc-500">{event.date} • {event.type}</div>
                                            </div>
                                        </div>
                                    ))}
                                    <Link href="/exams" className="block w-full py-3 bg-zinc-50 dark:bg-zinc-800/50 text-xs font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-center border-t border-zinc-100 dark:border-zinc-800 transition-colors">
                                        View Calendar
                                    </Link>
                                </div>
                            </motion.section>

                            {/* Help Box */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="p-6 bg-zinc-100 dark:bg-zinc-800/50 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl text-center"
                            >
                                <h4 className="font-bold text-sm mb-2">Need a study plan?</h4>
                                <p className="text-xs text-zinc-500 mb-4">Our AI can generate a custom schedule.</p>
                                <Link href="/ai/chat" className="text-xs font-bold text-purple-600 border border-purple-200 dark:border-purple-800 bg-white dark:bg-zinc-900 px-4 py-2 rounded-lg hover:shadow-sm transition-all inline-block">
                                    Generate Plan
                                </Link>
                            </motion.div>
                        </div>
                    </div>

                    {/* ================================================================= */}
                    {/* PROGRESS & ANALYTICS SECTION */}
                    {/* ================================================================= */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mt-12"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <BarChart3 className="w-6 h-6 text-green-500" />
                                Progress & Analytics
                            </h2>
                            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
                                <Download className="w-4 h-4" />
                                Export
                            </button>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
                                <TrendingUp className="w-6 h-6 text-green-500 mb-3" />
                                <div className="text-3xl font-bold">+18%</div>
                                <div className="text-sm text-zinc-500">Weekly Growth</div>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
                                <Target className="w-6 h-6 text-blue-500 mb-3" />
                                <div className="text-3xl font-bold">58%</div>
                                <div className="text-sm text-zinc-500">Avg Mastery</div>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
                                <Clock className="w-6 h-6 text-purple-500 mb-3" />
                                <div className="text-3xl font-bold">17.9h</div>
                                <div className="text-sm text-zinc-500">This Week</div>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
                                <Zap className="w-6 h-6 text-orange-500 mb-3" />
                                <div className="text-3xl font-bold">324</div>
                                <div className="text-sm text-zinc-500">Questions Solved</div>
                            </div>
                        </div>

                        {/* Charts Row */}
                        <div className="grid lg:grid-cols-2 gap-6 mb-8">
                            {/* Study Hours Chart */}
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-purple-500" />
                                        <h3 className="font-bold">Study Hours This Week</h3>
                                    </div>
                                    <span className="text-sm text-green-500 font-medium">+2.5h vs last week</span>
                                </div>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={weeklyStudyData}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
                                            <XAxis dataKey="day" className="text-zinc-500" stroke="#888" />
                                            <YAxis className="text-zinc-500" stroke="#888" />
                                            <Tooltip contentStyle={{ backgroundColor: 'var(--tooltip-bg, #fff)', border: '1px solid var(--tooltip-border, #e5e7eb)', borderRadius: '8px' }} />
                                            <Area type="monotone" dataKey="hours" stroke="#a855f7" fill="#a855f7" fillOpacity={0.2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Mastery Trend */}
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-green-500" />
                                        <h3 className="font-bold">Mastery Trend</h3>
                                    </div>
                                    <span className="text-sm text-zinc-500">Last 8 weeks</span>
                                </div>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={masteryTrendData}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
                                            <XAxis dataKey="week" stroke="#888" />
                                            <YAxis stroke="#888" domain={[0, 100]} />
                                            <Tooltip contentStyle={{ backgroundColor: 'var(--tooltip-bg, #fff)', border: '1px solid var(--tooltip-border, #e5e7eb)', borderRadius: '8px' }} />
                                            <Line type="monotone" dataKey="mastery" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981' }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Subject Mastery & Achievements */}
                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Subject Radar */}
                            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                                <div className="flex items-center gap-2 mb-6">
                                    <Brain className="w-5 h-5 text-blue-500" />
                                    <h3 className="font-bold">Subject Mastery</h3>
                                </div>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart data={subjectMasteryData}>
                                            <PolarGrid className="stroke-zinc-200 dark:stroke-zinc-700" />
                                            <PolarAngleAxis dataKey="subject" className="text-zinc-500" stroke="#888" />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#888" />
                                            <Radar name="Mastery" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Achievements */}
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <Award className="w-5 h-5 text-yellow-500" />
                                        <h3 className="font-bold">Achievements</h3>
                                    </div>
                                    <span className="text-xs text-zinc-500">3/5 unlocked</span>
                                </div>
                                <div className="space-y-3">
                                    {achievements.map((achievement) => (
                                        <div
                                            key={achievement.id}
                                            className={`p-3 rounded-xl border transition-all ${achievement.unlocked
                                                ? 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700'
                                                : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 opacity-50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{achievement.icon}</span>
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm">{achievement.name}</div>
                                                    <div className="text-xs text-zinc-500">{achievement.description}</div>
                                                </div>
                                                {achievement.unlocked && (
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.section>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================
function StatusItem({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className={`mt-0.5 ${color}`}>{icon}</div>
            <div>
                <div className="text-sm font-bold">{value}</div>
                <div className="text-xs text-zinc-500">{label}</div>
            </div>
        </div>
    )
}
