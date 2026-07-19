'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
    Brain,
    CheckCircle,
    Clock,
    Coins,
    AlertCircle,
    RefreshCw,
    Loader2,
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';

interface AIOverview {
    total: number;
    successRate: number;
    avgLatencyMs: number;
    totalTokens: number;
}

interface ModelStat {
    model: string;
    provider: string;
    requests: number;
    successRate: number;
    avgLatencyMs: number;
    totalTokens: number;
}

interface RequestTypeStat {
    requestType: string;
    requests: number;
    avgLatencyMs: number;
}

interface DailyPoint {
    date: string;
    requests: number;
    successful: number;
}

interface AIAnalyticsData {
    overview: AIOverview;
    byModel: ModelStat[];
    byRequestType: RequestTypeStat[];
    dailySeries: DailyPoint[];
}

const DAYS_OPTIONS = [7, 14, 30, 90];

function StatCard({
    label,
    value,
    sub,
    icon: Icon,
    color,
}: {
    label: string;
    value: string;
    sub?: string;
    icon: React.ElementType;
    color: string;
}) {
    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-lg bg-${color}-50 dark:bg-${color}-900/20`}>
                    <Icon className={`w-5 h-5 text-${color}-600 dark:text-${color}-400`} />
                </div>
            </div>
            <div className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">{value}</div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">{label}</div>
            {sub && <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">{sub}</div>}
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="p-8 animate-pulse space-y-6">
            <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-64" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl" />
                ))}
            </div>
            <div className="h-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl" />
        </div>
    );
}

function formatTokens(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

function formatLatency(ms: number): string {
    if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
    return `${ms}ms`;
}

export default function AIAnalyticsPage() {
    const [data, setData] = useState<AIAnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [days, setDays] = useState(30);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/ai-analytics?days=${days}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setData(await res.json());
        } catch {
            setError('Failed to load AI analytics.');
        } finally {
            setLoading(false);
        }
    }, [days]);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) return <AdminLayout><LoadingSkeleton /></AdminLayout>;

    if (error || !data) {
        return (
            <AdminLayout>
                <div className="p-8 flex flex-col items-center justify-center h-full gap-4">
                    <AlertCircle className="w-12 h-12 text-red-500" />
                    <p className="text-zinc-700 dark:text-zinc-300">{error ?? 'Unknown error'}</p>
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
                    >
                        <RefreshCw className="w-4 h-4" /> Retry
                    </button>
                </div>
            </AdminLayout>
        );
    }

    const { overview, byModel, byRequestType, dailySeries } = data;

    return (
        <AdminLayout>
            <div className="p-8">
                {/* Header */}
                <div className="mb-8 flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">AI Analytics</h1>
                        <p className="text-zinc-600 dark:text-zinc-400">Monitor AI request performance, token usage, and success rates.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 gap-1">
                            {DAYS_OPTIONS.map((d) => (
                                <button
                                    key={d}
                                    onClick={() => setDays(d)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                        days === d
                                            ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    {d}d
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={fetchData}
                            className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Overview stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        label="Total Requests"
                        value={overview.total.toLocaleString()}
                        sub={`Last ${days} days`}
                        icon={Brain}
                        color="blue"
                    />
                    <StatCard
                        label="Success Rate"
                        value={`${overview.successRate}%`}
                        icon={CheckCircle}
                        color={overview.successRate >= 95 ? 'green' : overview.successRate >= 80 ? 'amber' : 'red'}
                    />
                    <StatCard
                        label="Avg Latency"
                        value={formatLatency(overview.avgLatencyMs)}
                        icon={Clock}
                        color="violet"
                    />
                    <StatCard
                        label="Total Tokens"
                        value={formatTokens(overview.totalTokens)}
                        icon={Coins}
                        color="amber"
                    />
                </div>

                {/* Daily chart */}
                {dailySeries.length > 0 ? (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mb-8">
                        <h3 className="font-semibold text-zinc-900 dark:text-white mb-6">Requests Over Time</h3>
                        <ResponsiveContainer width="100%" height={240}>
                            <LineChart data={dailySeries} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(113,113,122,0.2)" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 11, fill: '#71717a' }}
                                    tickFormatter={(d) => d.slice(5)}
                                />
                                <YAxis tick={{ fontSize: 11, fill: '#71717a' }} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{
                                        background: 'rgba(24,24,27,0.95)',
                                        border: '1px solid rgba(63,63,70,1)',
                                        borderRadius: 8,
                                        color: '#fff',
                                        fontSize: 12,
                                    }}
                                />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Line
                                    type="monotone"
                                    dataKey="requests"
                                    stroke="#3585a3"
                                    strokeWidth={2}
                                    dot={false}
                                    name="Requests"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="successful"
                                    stroke="#22c55e"
                                    strokeWidth={2}
                                    dot={false}
                                    name="Successful"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 mb-8 flex flex-col items-center gap-3 text-zinc-500 dark:text-zinc-400">
                        <Brain className="w-10 h-10" />
                        <p className="text-sm">No AI requests logged in the last {days} days. AI calls will appear here once the system is used.</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Per-model breakdown */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                            <h3 className="font-semibold text-zinc-900 dark:text-white">By Model</h3>
                        </div>
                        {byModel.length === 0 ? (
                            <div className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">No data yet.</div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                                    <tr>
                                        {['Model', 'Requests', 'Success', 'Avg Latency', 'Tokens'].map((h) => (
                                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                    {byModel.map((r) => (
                                        <tr key={`${r.provider}/${r.model}`} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                                            <td className="px-4 py-3">
                                                <div className="text-sm font-medium text-zinc-900 dark:text-white truncate max-w-[140px]" title={r.model}>
                                                    {r.model}
                                                </div>
                                                <div className="text-xs text-zinc-500 dark:text-zinc-400">{r.provider}</div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">{r.requests}</td>
                                            <td className="px-4 py-3">
                                                <span className={`text-sm font-medium ${r.successRate >= 95 ? 'text-green-600 dark:text-green-400' : r.successRate >= 80 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                                                    {r.successRate}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">{formatLatency(r.avgLatencyMs)}</td>
                                            <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">{formatTokens(r.totalTokens)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Per-requestType breakdown */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                            <h3 className="font-semibold text-zinc-900 dark:text-white">By Request Type</h3>
                        </div>
                        {byRequestType.length === 0 ? (
                            <div className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">No data yet.</div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                                    <tr>
                                        {['Type', 'Requests', 'Avg Latency'].map((h) => (
                                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                    {byRequestType.map((r) => (
                                        <tr key={r.requestType} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                                            <td className="px-4 py-3">
                                                <span className="text-sm font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-800 dark:text-zinc-200">
                                                    {r.requestType}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">{r.requests}</td>
                                            <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">{formatLatency(r.avgLatencyMs)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
