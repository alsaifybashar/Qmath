'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, BookOpen, Brain, Layers,
    Settings, HelpCircle, ChevronLeft, ChevronRight,
    GraduationCap, User, Home, FlaskConical, Archive, FileText
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '@/lib/hooks/use-sidebar';

const studyItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'blue' },
    { href: '/courses', label: 'Kurser', icon: BookOpen, color: 'emerald' },
    { href: '/articles', label: 'Artiklar', icon: FileText, color: 'indigo' },
    { href: '/flashcards', label: 'Flashcards', icon: Layers, color: 'pink' },
];

const examPrepItems = [
    { href: '/exams', label: 'Gamla tentor', icon: Archive, color: 'cyan' },
    { href: '/exam-sim', label: 'Tentasimulator', icon: FlaskConical, color: 'purple' },
];

const secondaryNavItems = [
    { href: '/settings', label: 'Inställningar', icon: Settings },
    { href: '/help', label: 'Hjälp', icon: HelpCircle },
];

// Color mapping for active states
const colorMap: Record<string, { bg: string; text: string; glow: string }> = {
    blue: { bg: 'bg-blue-500/15', text: 'text-blue-400', glow: 'shadow-blue-500/20' },
    emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
    orange: { bg: 'bg-orange-500/15', text: 'text-orange-400', glow: 'shadow-orange-500/20' },
    purple: { bg: 'bg-purple-500/15', text: 'text-purple-400', glow: 'shadow-purple-500/20' },
    pink: { bg: 'bg-pink-500/15', text: 'text-pink-400', glow: 'shadow-pink-500/20' },
    cyan: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', glow: 'shadow-cyan-500/20' },
    yellow: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', glow: 'shadow-yellow-500/20' },
    indigo: { bg: 'bg-indigo-500/15', text: 'text-indigo-400', glow: 'shadow-indigo-500/20' },
};

export function Sidebar() {
    const pathname = usePathname();
    const { isSidebarExpanded, toggleSidebar } = useSidebar();
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === href;
        return pathname.startsWith(href);
    };

    const collapsed = !isSidebarExpanded;

    return (
        <motion.aside
            initial={false}
            animate={{ width: collapsed ? 80 : 260 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-0 top-0 bottom-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-r border-zinc-800/50 flex flex-col"
        >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800/50">
                <AnimatePresence mode="wait">
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Link href="/" className="flex items-center gap-2 group">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow">
                                    <Home className="w-4 h-4 text-white" />
                                </div>
                                <span className="font-bold text-xl text-white">Qmath</span>
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleSidebar}
                    className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-all duration-200"
                >
                    <motion.div
                        animate={{ rotate: collapsed ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </motion.div>
                </motion.button>
            </div>

            {/* Main Nav */}
            <nav className="flex-1 py-4 px-3 overflow-y-auto scrollbar-thin space-y-4">
                {/* Study group */}
                <div>
                    <AnimatePresence mode="wait">
                        {!collapsed && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 px-3 mb-1"
                            >
                                Studera
                            </motion.p>
                        )}
                    </AnimatePresence>
                    <div className="space-y-0.5">
                        {studyItems.map((item, index) => {
                            const active = isActive(item.href);
                            const colors = colorMap[item.color] || colorMap.blue;
                            const isHovered = hoveredItem === item.href;
                            return (
                                <div key={item.href} className="relative">
                                    <Link
                                        href={item.href}
                                        onMouseEnter={() => setHoveredItem(item.href)}
                                        onMouseLeave={() => setHoveredItem(null)}
                                        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${active
                                            ? `${colors.bg} ${colors.text} shadow-lg ${colors.glow}`
                                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                                            }`}
                                    >
                                        {active && (
                                            <motion.div
                                                layoutId="activeIndicator"
                                                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full"
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            />
                                        )}
                                        <motion.div
                                            whileHover={{ scale: 1.15, rotate: 5 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                        >
                                            <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${active ? colors.text : 'group-hover:text-white'}`} />
                                        </motion.div>
                                        <AnimatePresence mode="wait">
                                            {!collapsed && (
                                                <motion.span
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -10 }}
                                                    transition={{ duration: 0.2, delay: index * 0.02 }}
                                                    className="font-medium whitespace-nowrap overflow-hidden"
                                                >
                                                    {item.label}
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </Link>
                                    <AnimatePresence>
                                        {collapsed && isHovered && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -5, scale: 0.95 }}
                                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                                exit={{ opacity: 0, x: -5, scale: 0.95 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-zinc-800 text-white text-sm font-medium rounded-lg shadow-xl whitespace-nowrap z-50 border border-zinc-700"
                                            >
                                                {item.label}
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-zinc-800 rotate-45 border-l border-b border-zinc-700" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Exam Prep group */}
                <div>
                    <AnimatePresence mode="wait">
                        {!collapsed && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 px-3 mb-1"
                            >
                                Tentaförberedelse
                            </motion.p>
                        )}
                    </AnimatePresence>
                    <div className="space-y-0.5">
                        {examPrepItems.map((item, index) => {
                            const active = isActive(item.href);
                            const colors = colorMap[item.color] || colorMap.blue;
                            const isHovered = hoveredItem === item.href;
                            return (
                                <div key={item.href} className="relative">
                                    <Link
                                        href={item.href}
                                        onMouseEnter={() => setHoveredItem(item.href)}
                                        onMouseLeave={() => setHoveredItem(null)}
                                        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${active
                                            ? `${colors.bg} ${colors.text} shadow-lg ${colors.glow}`
                                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                                            }`}
                                    >
                                        {active && (
                                            <motion.div
                                                layoutId="activeIndicator"
                                                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full"
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            />
                                        )}
                                        <motion.div
                                            whileHover={{ scale: 1.15, rotate: 5 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                        >
                                            <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${active ? colors.text : 'group-hover:text-white'}`} />
                                        </motion.div>
                                        <AnimatePresence mode="wait">
                                            {!collapsed && (
                                                <motion.span
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -10 }}
                                                    transition={{ duration: 0.2, delay: index * 0.02 }}
                                                    className="font-medium whitespace-nowrap overflow-hidden"
                                                >
                                                    {item.label}
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </Link>
                                    <AnimatePresence>
                                        {collapsed && isHovered && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -5, scale: 0.95 }}
                                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                                exit={{ opacity: 0, x: -5, scale: 0.95 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-zinc-800 text-white text-sm font-medium rounded-lg shadow-xl whitespace-nowrap z-50 border border-zinc-700"
                                            >
                                                {item.label}
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-zinc-800 rotate-45 border-l border-b border-zinc-700" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </nav>

            {/* Secondary Nav */}
            <div className="py-4 px-3 space-y-1 border-t border-zinc-800/50">
                {secondaryNavItems.map((item) => {
                    const active = isActive(item.href);
                    const isHovered = hoveredItem === item.href;

                    return (
                        <div key={item.href} className="relative">
                            <Link
                                href={item.href}
                                onMouseEnter={() => setHoveredItem(item.href)}
                                onMouseLeave={() => setHoveredItem(null)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${active
                                    ? 'bg-zinc-800 text-white'
                                    : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'
                                    }`}
                            >
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                >
                                    <item.icon className="w-5 h-5 flex-shrink-0" />
                                </motion.div>
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

                            {/* Tooltip for collapsed state */}
                            <AnimatePresence>
                                {collapsed && isHovered && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -5, scale: 0.95 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        exit={{ opacity: 0, x: -5, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-zinc-800 text-white text-sm font-medium rounded-lg shadow-xl whitespace-nowrap z-50 border border-zinc-700"
                                    >
                                        {item.label}
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-zinc-800 rotate-45 border-l border-b border-zinc-700" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            {/* User Profile */}
            <div className="p-3 border-t border-zinc-800/50">
                <Link
                    href="/profile"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all duration-200 group"
                >
                    {/* Avatar with online indicator */}
                    <div className="relative flex-shrink-0">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-shadow"
                        >
                            <User className="w-4 h-4 text-white" />
                        </motion.div>
                        {/* Pulsing online indicator */}
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-zinc-950"></span>
                        </span>
                    </div>

                    <AnimatePresence mode="wait">
                        {!collapsed && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="flex-1 overflow-hidden"
                            >
                                <div className="font-medium text-white truncate group-hover:text-blue-400 transition-colors">Student</div>
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
    const { isSidebarExpanded } = useSidebar();
    return (
        <div className="min-h-screen bg-zinc-950">
            <Sidebar />
            <motion.div
                initial={false}
                animate={{ paddingLeft: isSidebarExpanded ? 260 : 80 }}
                className="transition-all duration-300"
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
                {children}
            </motion.div>
        </div>
    );
}
