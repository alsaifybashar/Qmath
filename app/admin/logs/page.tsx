'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import {
    Activity,
    Users,
    FileText,
    Download,
    UserPlus,
    Trash2,
    Shield,
    AlertCircle,
    CheckCircle
} from 'lucide-react';

interface ActivityLog {
    id: string;
    type: 'user_register' | 'user_login' | 'exam_upload' | 'exam_download' | 'exam_delete' | 'role_change' | 'error';
    userId?: string;
    userEmail?: string;
    description: string;
    metadata?: Record<string, any>;
    timestamp: Date;
    ipAddress?: string;
}

export default function AdminLogsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login?callbackUrl=/admin/logs');
        } else if (session?.user?.role !== 'admin') {
            router.push('/');
        } else {
            setLoading(false);
        }
    }, [session, status, router]);

    const fetchLogs = async () => {
        try {
            
        } catch (error) {
            console.error('Failed to fetch logs:', error);
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

    // Mock data
    const mockLogs: ActivityLog[] = [
        {
            id: '1',
            type: 'user_register',
            userId: 'user1',
            userEmail: 'john@example.com',
            description: 'New user registered',
            timestamp: new Date(Date.now() - 1000 * 60 * 15),
            ipAddress: '192.168.1.100',
        },
        {
            id: '2',
            type: 'exam_upload',
            userId: 'admin1',
            userEmail: 'admin@qmath.se',
            description: 'Uploaded exam: SF1672 Final 2024-01-15',
            metadata: { courseCode: 'SF1672', examType: 'Final' },
            timestamp: new Date(Date.now() - 1000 * 60 * 45),
            ipAddress: '192.168.1.101',
        },
        {
            id: '3',
            type: 'exam_download',
            userId: 'user2',
            userEmail: 'student@example.com',
            description: 'Downloaded exam: TATA24 Final',
            metadata: { courseCode: 'TATA24' },
            timestamp: new Date(Date.now() - 1000 * 60 * 120),
            ipAddress: '192.168.1.102',
        },
        {
            id: '4',
            type: 'role_change',
            userId: 'admin1',
            userEmail: 'admin@qmath.se',
            description: 'Promoted user john@example.com to admin',
            timestamp: new Date(Date.now() - 1000 * 60 * 180),
            ipAddress: '192.168.1.101',
        },
        {
            id: '5',
            type: 'error',
            description: 'Failed login attempt for unknown@example.com',
            timestamp: new Date(Date.now() - 1000 * 60 * 240),
            ipAddress: '192.168.1.200',
        },
    ];

    const displayLogs = logs.length > 0 ? logs : mockLogs;
    const filteredLogs = filter === 'all'
        ? displayLogs
        : displayLogs.filter(log => log.type === filter);

    const getLogIcon = (type: string) => {
        switch (type) {
            case 'user_register':
            case 'user_login':
                return <UserPlus className="w-5 h-5" />;
            case 'exam_upload':
                return <FileText className="w-5 h-5" />;
            case 'exam_download':
                return <Download className="w-5 h-5" />;
            case 'role_change':
                return <Shield className="w-5 h-5" />;
            case 'exam_delete':
                return <Trash2 className="w-5 h-5" />;
            case 'error':
                return <AlertCircle className="w-5 h-5" />;
            default:
                return <Activity className="w-5 h-5" />;
        }
    };

    const getLogColor = (type: string) => {
        switch (type) {
            case 'user_register':
            case 'user_login':
                return 'blue';
            case 'exam_upload':
                return 'green';
            case 'exam_download':
                return 'purple';
            case 'role_change':
                return 'orange';
            case 'exam_delete':
                return 'red';
            case 'error':
                return 'red';
            default:
                return 'zinc';
        }
    };

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
                        Activity Logs
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Monitor system activity and user actions
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                        <div className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
                            {displayLogs.length}
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">Total Events</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                        <div className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
                            {displayLogs.filter(l => l.type.startsWith('user_')).length}
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">User Events</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                        <div className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
                            {displayLogs.filter(l => l.type.startsWith('exam_')).length}
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">Exam Events</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                        <div className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
                            {displayLogs.filter(l => l.type === 'error').length}
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">Errors</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mb-6">
                    <div className="flex flex-wrap gap-2">
                        {['all', 'user_register', 'exam_upload', 'exam_download', 'role_change', 'error'].map((filterType) => (
                            <button
                                key={filterType}
                                onClick={() => setFilter(filterType)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === filterType
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                    }`}
                            >
                                {filterType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Logs List */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                    <div className="space-y-4">
                        {filteredLogs.map((log) => {
                            const color = getLogColor(log.type);
                            return (
                                <div
                                    key={log.id}
                                    className="flex items-start gap-4 p-4 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                                >
                                    <div className={`p-3 rounded-lg bg-${color}-50 dark:bg-${color}-900/20 flex-shrink-0`}>
                                        {getLogIcon(log.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <p className="font-medium text-zinc-900 dark:text-white">
                                                {log.description}
                                            </p>
                                            <span className="text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                                                {formatTimeAgo(log.timestamp)}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                                            {log.userEmail && (
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-3 h-3" />
                                                    {log.userEmail}
                                                </span>
                                            )}
                                            {log.ipAddress && (
                                                <span>IP: {log.ipAddress}</span>
                                            )}
                                            <span className="text-xs">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {filteredLogs.length === 0 && (
                        <div className="text-center py-12">
                            <Activity className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
                            <p className="text-zinc-600 dark:text-zinc-400">No activity logs found</p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
