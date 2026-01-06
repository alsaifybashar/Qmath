'use client';

import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from 'recharts';
import { Activity, BookOpen, Target, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const velocityData = [
    { day: 'Mon', score: 40 },
    { day: 'Tue', score: 45 },
    { day: 'Wed', score: 38 },
    { day: 'Thu', score: 55 },
    { day: 'Fri', score: 52 },
    { day: 'Sat', score: 68 },
    { day: 'Sun', score: 74 },
];

const topicData = [
    { subject: 'Algebra', A: 80, fullMark: 100 },
    { subject: 'Calculus', A: 45, fullMark: 100 },
    { subject: 'Stats', A: 90, fullMark: 100 },
    { subject: 'Geometry', A: 60, fullMark: 100 },
    { subject: 'Logic', A: 70, fullMark: 100 },
    { subject: 'Physics', A: 30, fullMark: 100 },
];

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-black text-white p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-12 max-w-7xl mx-auto">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                        Student Analytics
                    </h1>
                    <p className="text-zinc-500 mt-2">Track your learning velocity and mastery gaps.</p>
                </div>
                <div className="flex gap-4">
                    <Link href="/study" className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500 transition font-medium">
                        Resume Study
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <StatCard icon={<TrendingUp />} label="Velocity" value="+12%" sub="vs last week" color="text-green-400" />
                <StatCard icon={<Target />} label="Mastery" value="64%" sub="Calculus I" color="text-blue-400" />
                <StatCard icon={<BookOpen />} label="Topics" value="12/40" sub="Completed" color="text-purple-400" />
                <StatCard icon={<Activity />} label="Streak" value="5 Days" sub="Keep it up!" color="text-orange-400" />
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Learning Velocity Chart */}
                <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-400" /> Learning Velocity
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={velocityData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="day" stroke="#666" />
                                <YAxis stroke="#666" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#60a5fa"
                                    strokeWidth={3}
                                    dot={{ fill: '#60a5fa' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Topic Radar */}
                <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Target className="w-5 h-5 text-purple-400" /> Topic Mastery
                    </h3>
                    <div className="h-[300px] w-full flex justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={topicData}>
                                <PolarGrid stroke="#333" />
                                <PolarAngleAxis dataKey="subject" stroke="#888" />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#444" />
                                <Radar
                                    name="Student"
                                    dataKey="A"
                                    stroke="#a78bfa"
                                    fill="#8b5cf6"
                                    fillOpacity={0.3}
                                />
                                <Legend />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}

function StatCard({ icon, label, value, sub, color }: { icon: any, label: string, value: string, sub: string, color: string }) {
    return (
        <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 hover:border-zinc-700 transition">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg bg-zinc-950 border border-zinc-800 ${color}`}>
                    {icon}
                </div>
                <span className="text-xs text-zinc-500 font-mono">LIVE</span>
            </div>
            <div className="text-3xl font-bold mb-1">{value}</div>
            <div className="text-sm text-zinc-400">{label} <span className="text-zinc-600 text-xs ml-2">({sub})</span></div>
        </div>
    )
}
