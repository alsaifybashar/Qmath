'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import {
    Users,
    FileText,
    Download,
    Search,
    TrendingUp,
    HardDrive,
    Activity,
    AlertCircle
} from 'lucide-react';

interface DashboardStats {
    totalUsers: number;
    totalExams: number;
    totalDownloads: number;
    totalSearches: number;
    storageUsed: string;
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
    usersThisWeek: number;
    examsThisWeek: number;
}

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login?callbackUrl=/admin');
        } else if (session?.user?.role !== 'admin') {
            router.push('/');
        } else {
            fetchStats();
        }
    }, [session, status, router]);

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/admin/stats');
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-full">
                    <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
                </div>
            </AdminLayout>
        );
    }

    if (!session || session.user.role !== 'admin') {
        return null;
    }

    // Mock data for now (will be replaced by API)
    const mockStats: DashboardStats = {
        totalUsers: 156,
        totalExams: 42,
        totalDownloads: 1247,
        totalSearches: 3891,
        storageUsed: '2.4 GB',
        usersThisWeek: 12,
        examsThisWeek: 3,
        recentActivity: [
            { id: '1', type: 'user', description: 'New user registered: john@example.com', timestamp: new Date(Date.now() - 1000 * 60 * 15) },
            { id: '2', type: 'exam', description: 'New exam uploaded: SF1625 Final 2024', timestamp: new Date(Date.now() - 1000 * 60 * 45) },
            { id: '3', type: 'download', description: 'TATA24 exam downloaded by user@email.com', timestamp: new Date(Date.now() - 1000 * 60 * 120) },
        ],
        topCourses: [
            { courseCode: 'SF1672', courseName: 'Linear Algebra', downloads: 234 },
            { courseCode: 'TATA24', courseName: 'Linjär algebra', downloads: 189 },
            { courseCode: 'SF1625', courseName: 'Calculus I', downloads: 156 },
        ],
    };

    const displayStats = stats || mockStats;

    const statCards = [
        {
            label: 'Total Users',
            value: mockStats.totalUsers.toLocaleString(),
            icon: Users,
            change: `+${mockStats.usersThisWeek} this week`,
            color: 'blue'
        },
        {
            label: 'Total Exams',
            value: mockStats.totalExams.toLocaleString(),
            icon: FileText,
            change: `+${mockStats.examsThisWeek} this week`,
            color: 'green'
        },
        {
            label: 'Total Downloads',
            value: mockStats.totalDownloads.toLocaleString(),
            icon: Download,
            change: '+47 today',
            color: 'purple'
        },
        {
            label: 'Total Searches',
            value: mockStats.totalSearches.toLocaleString(),
            icon: Search,
            change: '+124 today',
            color: 'orange'
        },
    ];

    const formatTimeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);

        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    return (
        <AdminLayout>
            <div className="p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                        Dashboard Overview
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Welcome back! Here's what's happening with Qmath.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {statCards.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <div
                                key={stat.label}
                                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-lg bg-${stat.color}-50 dark:bg-${stat.color}-900/20`}>
                                        <Icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                                    </div>
                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                </div>
                                <div className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                                    {stat.label}
                                </div>
                                <div className="text-xs text-green-600 dark:text-green-400">
                                    {stat.change}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Storage Info */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <HardDrive className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                            <h3 className="font-semibold text-zinc-900 dark:text-white">Storage</h3>
                        </div>
                        <div className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                            {mockStats.storageUsed}
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                            of unlimited used
                        </div>
                        <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '24%' }}></div>
                        </div>
                    </div>

                    {/* System Status */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Activity className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                            <h3 className="font-semibold text-zinc-900 dark:text-white">System Status</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-600 dark:text-zinc-400">Database</span>
                                <span className="text-sm font-medium text-green-600 dark:text-green-400">Healthy</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-600 dark:text-zinc-400">API</span>
                                <span className="text-sm font-medium text-green-600 dark:text-green-400">Online</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-600 dark:text-zinc-400">Auth</span>
                                <span className="text-sm font-medium text-green-600 dark:text-green-400">Active</span>
                            </div>
                        </div>
                    </div>

                    {/* Alerts */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertCircle className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                            <h3 className="font-semibold text-zinc-900 dark:text-white">Alerts</h3>
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">
                            No critical alerts
                        </div>
                        <div className="mt-3 text-xs text-green-600 dark:text-green-400">
                            All systems operational
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Activity */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                        <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">Recent Activity</h3>
                        <div className="space-y-4">
                            {mockStats.recentActivity.map((activity) => (
                                <div key={activity.id} className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg ${activity.type === 'user' ? 'bg-blue-50 dark:bg-blue-900/20' :
                                        activity.type === 'exam' ? 'bg-green-50 dark:bg-green-900/20' :
                                            'bg-purple-50 dark:bg-purple-900/20'
                                        }`}>
                                        {activity.type === 'user' && <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                                        {activity.type === 'exam' && <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />}
                                        {activity.type === 'download' && <Download className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
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
                    </div>

                    {/* Top Courses */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                        <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">Most Downloaded Courses</h3>
                        <div className="space-y-4">
                            {mockStats.topCourses.map((course, index) => (
                                <div key={course.courseCode} className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                            #{index + 1}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-zinc-900 dark:text-white">
                                            {course.courseCode}
                                        </div>
                                        <div className="text-sm text-zinc-600 dark:text-zinc-400">
                                            {course.courseName}
                                        </div>
                                    </div>
                                    <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                                        {course.downloads}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
