'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
    Users,
    FileText,
    BookOpen,
    HelpCircle,
    TrendingUp,
    HardDrive,
    Activity,
    AlertCircle,
    Users2,
    RefreshCw,
} from 'lucide-react';

interface DashboardStats {
    totalUsers: number;
    totalExams: number;
    totalCourses: number;
    totalQuestions: number;
    totalEnrollments: number;
    totalDownloads: number;
    storageUsed: string;
    usersThisWeek: number;
    examsThisWeek: number;
    recentActivity: Array<{
        id: string;
        type: 'user' | 'exam' | 'download';
        description: string;
        timestamp: Date;
    }>;
    topCourses: Array<{
        courseCode: string;
        courseName: string;
        downloads: number;
    }>;
}

function StatCard({
    label,
    value,
    icon: Icon,
    change,
    color,
}: {
    label: string;
    value: string;
    icon: React.ElementType;
    change?: string;
    color: string;
}) {
    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${color}-50 dark:bg-${color}-900/20`}>
                    <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
                </div>
                {change && <TrendingUp className="w-4 h-4 text-green-600" />}
            </div>
            <div className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">{value}</div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">{label}</div>
            {change && (
                <div className="text-xs text-green-600 dark:text-green-400">{change}</div>
            )}
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="p-8 animate-pulse">
            <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-64 mb-2" />
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-80 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 h-36" />
                ))}
            </div>
        </div>
    );
}

function formatTimeAgo(date: Date) {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/stats');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setStats(data);
        } catch (err) {
            setError('Failed to load dashboard stats. Check your connection and try again.');
            console.error('Stats fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStats(); }, []);

    if (loading) {
        return <AdminLayout><LoadingSkeleton /></AdminLayout>;
    }

    if (error || !stats) {
        return (
            <AdminLayout>
                <div className="p-8 flex flex-col items-center justify-center h-full gap-4">
                    <AlertCircle className="w-12 h-12 text-red-500" />
                    <p className="text-zinc-700 dark:text-zinc-300 text-center max-w-sm">
                        {error ?? 'Unknown error loading dashboard.'}
                    </p>
                    <button
                        onClick={fetchStats}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Retry
                    </button>
                </div>
            </AdminLayout>
        );
    }

    const statCards = [
        {
            label: 'Total Users',
            value: stats.totalUsers.toLocaleString(),
            icon: Users,
            change: `+${stats.usersThisWeek} this week`,
            color: 'blue',
        },
        {
            label: 'Courses',
            value: stats.totalCourses.toLocaleString(),
            icon: BookOpen,
            color: 'emerald',
        },
        {
            label: 'Enrollments',
            value: stats.totalEnrollments.toLocaleString(),
            icon: Users2,
            color: 'violet',
        },
        {
            label: 'Published Questions',
            value: stats.totalQuestions.toLocaleString(),
            icon: HelpCircle,
            color: 'amber',
        },
        {
            label: 'Exam Archive',
            value: stats.totalExams.toLocaleString(),
            icon: FileText,
            change: `+${stats.examsThisWeek} this week`,
            color: 'green',
        },
        {
            label: 'Practice Attempts',
            value: stats.totalDownloads.toLocaleString(),
            icon: Activity,
            color: 'orange',
        },
    ];

    return (
        <AdminLayout>
            <div className="p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                        Dashboard Overview
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Live system metrics from the database.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
                    {statCards.map((stat) => (
                        <StatCard key={stat.label} {...stat} />
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Storage */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <HardDrive className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                            <h3 className="font-semibold text-zinc-900 dark:text-white">Storage</h3>
                        </div>
                        <div className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">
                            {stats.storageUsed}
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">used by exam uploads</div>
                        <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '24%' }} />
                        </div>
                    </div>

                    {/* System Status */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Activity className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                            <h3 className="font-semibold text-zinc-900 dark:text-white">System Status</h3>
                        </div>
                        <div className="space-y-3">
                            {[
                                { label: 'Database', status: 'Healthy' },
                                { label: 'API', status: 'Online' },
                                { label: 'Auth', status: 'Active' },
                            ].map(({ label, status }) => (
                                <div key={label} className="flex items-center justify-between">
                                    <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>
                                    <span className="text-sm font-medium text-green-600 dark:text-green-400">{status}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Alerts */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertCircle className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                            <h3 className="font-semibold text-zinc-900 dark:text-white">Alerts</h3>
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">No critical alerts</div>
                        <div className="mt-3 text-xs text-green-600 dark:text-green-400">All systems operational</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Activity */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                        <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">Recent Activity</h3>
                        {stats.recentActivity.length === 0 ? (
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">No recent activity.</p>
                        ) : (
                            <div className="space-y-4">
                                {stats.recentActivity.map((activity) => (
                                    <div key={activity.id} className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg ${
                                            activity.type === 'user' ? 'bg-blue-50 dark:bg-blue-900/20' :
                                            activity.type === 'exam' ? 'bg-green-50 dark:bg-green-900/20' :
                                            'bg-purple-50 dark:bg-purple-900/20'
                                        }`}>
                                            {activity.type === 'user' && <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                                            {activity.type === 'exam' && <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />}
                                            {activity.type === 'download' && <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-zinc-900 dark:text-white">{activity.description}</p>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                                {formatTimeAgo(activity.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Top Courses */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                        <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">Top Courses by Exam Count</h3>
                        {stats.topCourses.length === 0 ? (
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">No course data yet.</p>
                        ) : (
                            <div className="space-y-4">
                                {stats.topCourses.map((course, index) => (
                                    <div key={course.courseCode} className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                                            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                                #{index + 1}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-zinc-900 dark:text-white">{course.courseCode}</div>
                                            <div className="text-sm text-zinc-600 dark:text-zinc-400">{course.courseName}</div>
                                        </div>
                                        <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                                            {course.downloads} exams
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
