'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import {
    Search,
    Shield,
    ShieldOff,
    Trash2,
    User,
    Calendar
} from 'lucide-react';

interface UserData {
    id: string;
    email: string;
    name: string | null;
    role: string;
    createdAt: Date;
    lastLogin?: Date;
}

export default function AdminUsersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login?callbackUrl=/admin/users');
        } else if (session?.user?.role !== 'admin') {
            router.push('/');
        } else {
            setLoading(false);
        }
    }, [session, status, router]);

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

    // Mock data for now
    const mockUsers: UserData[] = [
        { id: '1', email: 'admin@qmath.se', name: 'Admin User', role: 'admin', createdAt: new Date('2024-01-01') },
        { id: '2', email: 'test@qmath.se', name: 'Test User', role: 'student', createdAt: new Date('2024-01-15') },
        { id: '3', email: 'john@example.com', name: 'John Doe', role: 'student', createdAt: new Date('2024-02-01') },
    ];

    const filteredUsers = mockUsers.filter(user =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                        User Management
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Manage users, roles, and permissions
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                        <div className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
                            {mockUsers.length}
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">Total Users</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                        <div className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
                            {mockUsers.filter(u => u.role === 'admin').length}
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">Administrators</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                        <div className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
                            {mockUsers.filter(u => u.role === 'student').length}
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">Students</div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search users by email or name..."
                            className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-zinc-900 dark:text-white"
                        />
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                                <tr>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                        User
                                    </th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                        Role
                                    </th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                        Joined
                                    </th>
                                    <th className="text-right px-6 py-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                                                    <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-zinc-900 dark:text-white">
                                                        {user.name || 'Unnamed User'}
                                                    </div>
                                                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${user.role === 'admin'
                                                    ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                                                    : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                                                }`}>
                                                {user.role === 'admin' ? <Shield className="w-3 h-3" /> : null}
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
                                                {user.role === 'student' ? (
                                                    <button
                                                        className="p-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                                                        title="Promote to Admin"
                                                    >
                                                        <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                        title="Demote to Student"
                                                    >
                                                        <ShieldOff className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                    </button>
                                                )}
                                                <button
                                                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Delete User"
                                                    disabled={user.id === session.user.id}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredUsers.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-zinc-600 dark:text-zinc-400">No users found</p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
