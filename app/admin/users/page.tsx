'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
    Search,
    Shield,
    ShieldOff,
    Trash2,
    User,
    Calendar,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    CheckCircle,
    Loader2,
} from 'lucide-react';

interface UserData {
    id: string;
    email: string;
    name: string | null;
    role: string;
    createdAt: string;
}

interface UsersResponse {
    users: UserData[];
    total: number;
    page: number;
    totalPages: number;
}

interface Toast {
    id: number;
    type: 'success' | 'error';
    message: string;
}

const LIMIT = 20;

export default function AdminUsersPage() {
    const [data, setData] = useState<UsersResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const toastCounter = useRef(0);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = (type: 'success' | 'error', message: string) => {
        const id = ++toastCounter.current;
        setToasts((prev) => [...prev, { id, type, message }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
    };

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(LIMIT),
                ...(debouncedSearch && { search: debouncedSearch }),
                ...(roleFilter && { role: roleFilter }),
            });
            const res = await fetch(`/api/admin/users?${params}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setData(await res.json());
        } catch {
            showToast('error', 'Failed to load users.');
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch, roleFilter]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // Debounce search input
    useEffect(() => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            setPage(1);
            setDebouncedSearch(search);
        }, 300);
        return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
    }, [search]);

    const handleRoleChange = async (userId: string, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'student' : 'admin';
        setActionInProgress(userId);
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            });
            if (!res.ok) {
                const { error } = await res.json();
                throw new Error(error ?? 'Failed to update role');
            }
            showToast('success', `User ${newRole === 'admin' ? 'promoted to admin' : 'demoted to student'}.`);
            fetchUsers();
        } catch (err: unknown) {
            showToast('error', err instanceof Error ? err.message : 'Failed to update role.');
        } finally {
            setActionInProgress(null);
        }
    };

    const handleDelete = async (userId: string, email: string) => {
        if (!confirm(`Delete user "${email}"? This cannot be undone.`)) return;
        setActionInProgress(userId);
        try {
            const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
            if (!res.ok) {
                const { error } = await res.json();
                throw new Error(error ?? 'Failed to delete user');
            }
            showToast('success', `User "${email}" deleted.`);
            fetchUsers();
        } catch (err: unknown) {
            showToast('error', err instanceof Error ? err.message : 'Failed to delete user.');
        } finally {
            setActionInProgress(null);
        }
    };

    const users = data?.users ?? [];
    const total = data?.total ?? 0;
    const totalPages = data?.totalPages ?? 1;
    const adminCount = users.filter((u) => u.role === 'admin').length;
    const studentCount = users.filter((u) => u.role === 'student').length;

    return (
        <AdminLayout>
            {/* Toast notifications */}
            <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white text-sm pointer-events-auto ${
                            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
                        }`}
                    >
                        {toast.type === 'success'
                            ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                            : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                        {toast.message}
                    </div>
                ))}
            </div>

            <div className="p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">User Management</h1>
                    <p className="text-zinc-600 dark:text-zinc-400">Manage users, roles, and permissions.</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[
                        { label: 'Total Users', value: total },
                        { label: 'Administrators', value: adminCount },
                        { label: 'Students', value: studentCount },
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

                {/* Filters */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by email or name..."
                            className="w-full pl-11 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-zinc-900 dark:text-white text-sm"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => { setPage(1); setRoleFilter(e.target.value); }}
                        className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none"
                    >
                        <option value="">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="student">Student</option>
                    </select>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-16 gap-3 text-zinc-500 dark:text-zinc-400">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Loading users...
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-16 text-zinc-600 dark:text-zinc-400">
                            No users found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">User</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Role</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Joined</th>
                                        <th className="text-right px-6 py-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                    {users.map((user) => {
                                        const busy = actionInProgress === user.id;
                                        return (
                                            <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                                                            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-zinc-900 dark:text-white">
                                                                {user.name || 'Unnamed User'}
                                                            </div>
                                                            <div className="text-sm text-zinc-600 dark:text-zinc-400">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                                                        user.role === 'admin'
                                                            ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                                                            : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                                                    }`}>
                                                        {user.role === 'admin' && <Shield className="w-3 h-3" />}
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4" />
                                                        {new Date(user.createdAt).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {busy ? (
                                                            <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => handleRoleChange(user.id, user.role)}
                                                                    className={`p-2 rounded-lg transition-colors ${
                                                                        user.role === 'student'
                                                                            ? 'hover:bg-purple-50 dark:hover:bg-purple-900/20'
                                                                            : 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                                                    }`}
                                                                    title={user.role === 'student' ? 'Promote to Admin' : 'Demote to Student'}
                                                                >
                                                                    {user.role === 'student'
                                                                        ? <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                                        : <ShieldOff className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(user.id, user.email)}
                                                                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                                    title="Delete User"
                                                                >
                                                                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800">
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                Page {page} of {totalPages} ({total} users)
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
