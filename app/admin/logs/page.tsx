'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
    Activity,
    FileText,
    UserPlus,
    Trash2,
    Shield,
    AlertCircle,
    Key,
    ChevronLeft,
    ChevronRight,
    Loader2,
    RefreshCw,
} from 'lucide-react';

interface AuditLog {
    id: string;
    type: string;
    actorId: string | null;
    actorEmail: string | null;
    targetId: string | null;
    targetType: string | null;
    description: string;
    metadata: Record<string, unknown> | null;
    ipAddress: string | null;
    createdAt: string | null;
}

interface LogsResponse {
    logs: AuditLog[];
    total: number;
    page: number;
    totalPages: number;
}

const EVENT_TYPES = [
    { value: '', label: 'All Events' },
    { value: 'user_role_change', label: 'Role Change' },
    { value: 'user_delete', label: 'User Delete' },
    { value: 'exam_delete', label: 'Exam Delete' },
    { value: 'question_publish', label: 'Question Publish' },
    { value: 'key_generate', label: 'Key Generate' },
    { value: 'key_revoke', label: 'Key Revoke' },
    { value: 'admin_login', label: 'Admin Login' },
];

const LIMIT = 25;

function getLogIcon(type: string) {
    if (type.startsWith('user_role')) return <Shield className="w-4 h-4" />;
    if (type.startsWith('user_')) return <UserPlus className="w-4 h-4" />;
    if (type === 'exam_delete') return <Trash2 className="w-4 h-4" />;
    if (type === 'question_publish') return <FileText className="w-4 h-4" />;
    if (type.startsWith('key_')) return <Key className="w-4 h-4" />;
    if (type === 'error') return <AlertCircle className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
}

function getLogColorClass(type: string): string {
    if (type.startsWith('user_role')) return 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400';
    if (type.startsWith('user_delete')) return 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400';
    if (type.startsWith('user_')) return 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400';
    if (type === 'exam_delete') return 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400';
    if (type === 'question_publish') return 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400';
    if (type.startsWith('key_')) return 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400';
    if (type === 'error') return 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400';
    return 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400';
}

function formatTimeAgo(dateStr: string | null): string {
    if (!dateStr) return 'unknown';
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

export default function AdminLogsPage() {
    const [data, setData] = useState<LogsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [typeFilter, setTypeFilter] = useState('');
    const [page, setPage] = useState(1);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(LIMIT),
                ...(typeFilter && { type: typeFilter }),
            });
            const res = await fetch(`/api/admin/logs?${params}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setData(await res.json());
        } catch {
            setError('Failed to load audit logs.');
        } finally {
            setLoading(false);
        }
    }, [page, typeFilter]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const logs = data?.logs ?? [];
    const total = data?.total ?? 0;
    const totalPages = data?.totalPages ?? 1;

    return (
        <AdminLayout>
            <div className="p-8">
                <div className="mb-8 flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Audit Logs</h1>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Read-only record of admin actions and system events.
                        </p>
                    </div>
                    <button
                        onClick={fetchLogs}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    {[
                        { label: 'Total Events', value: total },
                        { label: 'Role Changes', value: logs.filter((l) => l.type === 'user_role_change').length },
                        { label: 'Deletions', value: logs.filter((l) => l.type.endsWith('_delete')).length },
                        { label: 'Key Operations', value: logs.filter((l) => l.type.startsWith('key_')).length },
                    ].map(({ label, value }) => (
                        <div
                            key={label}
                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6"
                        >
                            <div className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
                                {loading ? '—' : value}
                            </div>
                            <div className="text-sm text-zinc-600 dark:text-zinc-400">{label}</div>
                        </div>
                    ))}
                </div>

                {/* Type Filter */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 mb-6 flex flex-wrap gap-2">
                    {EVENT_TYPES.map(({ value, label }) => (
                        <button
                            key={value}
                            onClick={() => { setPage(1); setTypeFilter(value); }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                typeFilter === value
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Logs */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-16 gap-3 text-zinc-500 dark:text-zinc-400">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Loading logs...
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-500 dark:text-zinc-400">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                            <p>{error}</p>
                            <button
                                onClick={fetchLogs}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                Retry
                            </button>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <Activity className="w-12 h-12 text-zinc-400" />
                            <p className="text-zinc-600 dark:text-zinc-400">No audit events found.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {logs.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex items-start gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                                >
                                    <div className={`p-2.5 rounded-lg flex-shrink-0 ${getLogColorClass(log.type)}`}>
                                        {getLogIcon(log.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <p className="font-medium text-zinc-900 dark:text-white text-sm">
                                                {log.description}
                                            </p>
                                            <span className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap flex-shrink-0">
                                                {formatTimeAgo(log.createdAt)}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                                            {log.actorEmail && <span>By: {log.actorEmail}</span>}
                                            {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                                            <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                                {log.type}
                                            </span>
                                            {log.createdAt && (
                                                <span>{new Date(log.createdAt).toLocaleString()}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && !error && totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800">
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                Page {page} of {totalPages} ({total} events)
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                                </button>
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
