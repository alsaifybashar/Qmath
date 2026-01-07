'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, BookOpen, Brain, Target, Layers, BarChart3,
    Settings, HelpCircle, LogOut, ChevronLeft, ChevronRight,
    GraduationCap, Sparkles, User, Calendar
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const mainNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/courses', label: 'Courses', icon: BookOpen },
    { href: '/practice', label: 'Practice', icon: Target },
    { href: '/study', label: 'Study Session', icon: Brain },
    { href: '/flashcards', label: 'Flashcards', icon: Layers },
    { href: '/exams', label: 'Exams', icon: GraduationCap },
    { href: '/ai', label: 'AI Tools', icon: Sparkles },
    { href: '/progress', label: 'Progress', icon: BarChart3 },
];

const secondaryNavItems = [
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/help', label: 'Help', icon: HelpCircle },
];

export function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === href;
        return pathname.startsWith(href);
    };

    return (
        <motion.aside
            initial={false}
            animate={{ width: collapsed ? 80 : 260 }}
            className="fixed left-0 top-0 bottom-0 z-40 bg-zinc-950 border-r border-zinc-800 flex flex-col"
        >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800">
                <AnimatePresence mode="wait">
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <Link href="/" className="font-bold text-xl text-white">
                                Qmath
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                >
                    {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
            </div>

            {/* Main Nav */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                {mainNavItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${isActive(item.href)
                            ? 'bg-blue-500/10 text-blue-400'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                            }`}
                    >
                        <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive(item.href) ? 'text-blue-400' : ''
                            }`} />
                        <AnimatePresence mode="wait">
                            {!collapsed && (
                                <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    className="font-medium whitespace-nowrap overflow-hidden"
                                >
                                    {item.label}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </Link>
                ))}
            </nav>

            {/* Secondary Nav */}
            <div className="py-4 px-3 space-y-1 border-t border-zinc-800">
                {secondaryNavItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive(item.href)
                            ? 'bg-blue-500/10 text-blue-400'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                            }`}
                    >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <AnimatePresence mode="wait">
                            {!collapsed && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="font-medium whitespace-nowrap"
                                >
                                    {item.label}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </Link>
                ))}
            </div>

            {/* User */}
            <div className="p-3 border-t border-zinc-800">
                <Link
                    href="/profile"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                    </div>
                    <AnimatePresence mode="wait">
                        {!collapsed && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex-1 overflow-hidden"
                            >
                                <div className="font-medium text-white truncate">Student</div>
                                <div className="text-xs text-zinc-500 truncate">student@kth.se</div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Link>
            </div>
        </motion.aside>
    );
}

export function SidebarLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-black">
            <Sidebar />
            <div className="pl-[260px] transition-all">
                {children}
            </div>
        </div>
    );
}
