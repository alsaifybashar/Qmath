'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    BarChart3, TrendingUp, Target, Clock, Award, BookOpen,
    Brain, Zap, Calendar, ChevronRight, Download
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

const weeklyData = [
    { day: 'Mon', hours: 2.5, questions: 45 },
    { day: 'Tue', hours: 1.8, questions: 32 },
    { day: 'Wed', hours: 3.2, questions: 58 },
    { day: 'Thu', hours: 2.1, questions: 38 },
    { day: 'Fri', hours: 1.5, questions: 28 },
    { day: 'Sat', hours: 4.0, questions: 72 },
    { day: 'Sun', hours: 2.8, questions: 51 }
];

const masteryData = [
    { subject: 'Calculus I', value: 72 },
    { subject: 'Linear Algebra', value: 58 },
    { subject: 'Mechanics', value: 45 },
    { subject: 'Diff. Eq.', value: 32 },
    { subject: 'Statistics', value: 68 }
];

const trendData = [
    { week: 'W1', mastery: 28 },
    { week: 'W2', mastery: 35 },
    { week: 'W3', mastery: 42 },
    { week: 'W4', mastery: 48 },
    { week: 'W5', mastery: 52 },
    { week: 'W6', mastery: 58 },
    { week: 'W7', mastery: 62 },
    { week: 'W8', mastery: 68 }
];

const achievements = [
    { id: 1, name: 'First Steps', description: 'Complete your first question', icon: '🎯', unlocked: true },
    { id: 2, name: 'Week Warrior', description: '7-day streak', icon: '🔥', unlocked: true },
    { id: 3, name: 'Century Club', description: 'Answer 100 questions', icon: '💯', unlocked: true },
    { id: 4, name: 'Speed Demon', description: 'Answer 10 questions in under 5 minutes', icon: '⚡', unlocked: false },
    { id: 5, name: 'Perfect Score', description: 'Get 10 correct in a row', icon: '⭐', unlocked: false }
];

export default function ProgressPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <div className="fixed inset-0 bg-gradient-to-br from-green-900/10 via-black to-blue-900/10"></div>
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center md:justify-between mb-12"
                >
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Progress & Analytics</h1>
                        <p className="text-zinc-400">Track your learning journey</p>
                    </div>
                    <Link
                        href="/progress/export"
                        className="flex items-center gap-2 mt-4 md:mt-0 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl transition-all"
                    >
                        <Download className="w-4 h-4" />
                        Export Data
                    </Link>
                </motion.div>

                {/* Stats Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                >
                    <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6">
                        <TrendingUp className="w-6 h-6 text-green-400 mb-3" />
                        <div className="text-3xl font-bold">+18%</div>
                        <div className="text-sm text-zinc-500">Weekly Growth</div>
                    </div>
                    <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6">
                        <Target className="w-6 h-6 text-blue-400 mb-3" />
                        <div className="text-3xl font-bold">58%</div>
                        <div className="text-sm text-zinc-500">Avg Mastery</div>
                    </div>
                    <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6">
                        <Clock className="w-6 h-6 text-purple-400 mb-3" />
                        <div className="text-3xl font-bold">17.9h</div>
                        <div className="text-sm text-zinc-500">This Week</div>
                    </div>
                    <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6">
                        <Zap className="w-6 h-6 text-orange-400 mb-3" />
                        <div className="text-3xl font-bold">324</div>
                        <div className="text-sm text-zinc-500">Questions Solved</div>
                    </div>
                </motion.div>

                {/* Charts Row */}
                <div className="grid lg:grid-cols-2 gap-8 mb-8">
                    {/* Study Hours Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-purple-400" />
                                <h3 className="font-bold">Study Hours This Week</h3>
                            </div>
                            <span className="text-sm text-green-400">+2.5h vs last week</span>
                        </div>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={weeklyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis dataKey="day" stroke="#666" />
                                    <YAxis stroke="#666" />
                                    <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                                    <Area type="monotone" dataKey="hours" stroke="#a855f7" fill="#a855f7" fillOpacity={0.2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Mastery Trend */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-green-400" />
                                <h3 className="font-bold">Mastery Trend</h3>
                            </div>
                            <span className="text-sm text-zinc-500">Last 8 weeks</span>
                        </div>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis dataKey="week" stroke="#666" />
                                    <YAxis stroke="#666" domain={[0, 100]} />
                                    <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                                    <Line type="monotone" dataKey="mastery" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>

                {/* Subject Mastery & Quick Links */}
                <div className="grid lg:grid-cols-3 gap-8 mb-8">
                    {/* Subject Radar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="lg:col-span-2 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6"
                    >
                        <div className="flex items-center gap-2 mb-6">
                            <Brain className="w-5 h-5 text-blue-400" />
                            <h3 className="font-bold">Subject Mastery</h3>
                        </div>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={masteryData}>
                                    <PolarGrid stroke="#333" />
                                    <PolarAngleAxis dataKey="subject" stroke="#888" />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#444" />
                                    <Radar name="Mastery" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Quick Links */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="space-y-4"
                    >
                        <Link
                            href="/progress/knowledge-map"
                            className="flex items-center justify-between p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <Brain className="w-5 h-5 text-purple-400" />
                                <span>Knowledge Map</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                        </Link>
                        <Link
                            href="/progress/trends"
                            className="flex items-center justify-between p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <BarChart3 className="w-5 h-5 text-blue-400" />
                                <span>Performance Trends</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                        </Link>
                        <Link
                            href="/progress/time"
                            className="flex items-center justify-between p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-green-400" />
                                <span>Time Analytics</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
                        </Link>
                        <Link
                            href="/progress/achievements"
                            className="flex items-center justify-between p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <Award className="w-5 h-5 text-yellow-400" />
                                <span>Achievements</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-yellow-400 group-hover:translate-x-1 transition-all" />
                        </Link>
                    </motion.div>
                </div>

                {/* Achievements */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Award className="w-5 h-5 text-yellow-400" />
                            <h3 className="font-bold">Recent Achievements</h3>
                        </div>
                        <Link href="/progress/achievements" className="text-sm text-blue-400 hover:underline">
                            View all
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {achievements.map((achievement) => (
                            <div
                                key={achievement.id}
                                className={`p-4 rounded-xl border text-center transition-all ${achievement.unlocked
                                    ? 'bg-zinc-800/50 border-zinc-700'
                                    : 'bg-zinc-900/50 border-zinc-800 opacity-50'
                                    }`}
                            >
                                <div className="text-3xl mb-2">{achievement.icon}</div>
                                <div className="font-medium text-sm">{achievement.name}</div>
                                <div className="text-xs text-zinc-500 mt-1">{achievement.description}</div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
