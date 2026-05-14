'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    FileText,
    Activity,
    Settings,
    Upload,
    LogOut,
    BookOpen,
    HelpCircle,
    Brain,
    Key,
    Home,
} from 'lucide-react';
import { signOut } from 'next-auth/react';

interface NavItem {
    name: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
}

interface NavGroup {
    label: string;
    items: NavItem[];
}

const navGroups: NavGroup[] = [
    {
        label: 'Overview',
        items: [
            { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        ],
    },
    {
        label: 'Content',
        items: [
            { name: 'Courses', href: '/admin/courses', icon: BookOpen },
            { name: 'Questions', href: '/admin/questions', icon: HelpCircle },
            { name: 'Articles', href: '/admin/articles', icon: FileText },
            { name: 'Exams', href: '/admin/exams', icon: FileText },
            { name: 'Upload Exam', href: '/admin/upload-exam', icon: Upload },
        ],
    },
    {
        label: 'Users & Access',
        items: [
            { name: 'Users', href: '/admin/users', icon: Users },
            { name: 'API Keys', href: '/admin/api-keys', icon: Key },
        ],
    },
    {
        label: 'Monitoring',
        items: [
            { name: 'Activity Logs', href: '/admin/logs', icon: Activity },
            { name: 'AI Analytics', href: '/admin/ai-analytics', icon: Brain },
        ],
    },
    {
        label: 'System',
        items: [
            { name: 'Settings', href: '/admin/settings', icon: Settings },
        ],
    },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    const isActive = (href: string) =>
        href === '/admin' ? pathname === href : pathname.startsWith(href);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col flex-shrink-0">
                {/* Logo */}
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                    <Link href="/admin" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">Q</span>
                        </div>
                        <div>
                            <h1 className="font-bold text-zinc-900 dark:text-white">Qmath Admin</h1>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Control Panel</p>
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-5 overflow-y-auto">
                    {navGroups.map((group) => (
                        <div key={group.label}>
                            <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest uppercase text-zinc-400 dark:text-zinc-500">
                                {group.label}
                            </p>
                            <div className="space-y-0.5">
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const active = isActive(item.href);
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                                                active
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                                                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                            }`}
                                        >
                                            <Icon className="w-4 h-4 flex-shrink-0" />
                                            <span>{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
                    <Link
                        href="/"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                    >
                        <Home className="w-4 h-4" />
                        <span>Back to Site</span>
                    </Link>
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
