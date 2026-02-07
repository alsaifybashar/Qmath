'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    LayoutGrid,
    BookOpen,
    Settings,
    User,
    GraduationCap,
    HelpCircle,
    ChevronLeft,
    ChevronRight,
    Menu,
    Gamepad2
} from 'lucide-react';

const NAV_ITEMS = [
    { href: '/exams', label: 'Exams', icon: GraduationCap, color: 'text-blue-500' },
    { href: '/flashcards', label: 'Flashcards', icon: BookOpen, color: 'text-emerald-500' },
    { href: '/courses', label: 'My Courses', icon: LayoutGrid, color: 'text-purple-500' },
    { href: '/practice', label: 'Practice Arena', icon: Gamepad2, color: 'text-pink-500' },
    { href: '/profile', label: 'Profile', icon: User, color: 'text-orange-500' },
    { href: '/settings', label: 'Settings', icon: Settings, color: 'text-zinc-500' },
    { href: '/help', label: 'Help & Support', icon: HelpCircle, color: 'text-cyan-500' },
];

export default function QuickNav() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Backdrop for mobile mainly, but good for focus */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Drawer */}
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: isOpen ? 0 : '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 bottom-0 w-72 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-l border-zinc-200 dark:border-zinc-800 shadow-2xl z-50 p-6 flex flex-col"
            >
                {/* Toggle Button attached to the drawer */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="absolute -left-12 top-1/2 -translate-y-1/2 bg-white dark:bg-zinc-800 p-3 rounded-l-2xl shadow-[-4px_0_12px_rgba(0,0,0,0.1)] border-y border-l border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                    {isOpen ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
                </button>

                <div className="mb-8">
                    <h3 className="font-bold text-xl flex items-center gap-2 mb-1">
                        <span className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                            <Menu size={18} />
                        </span>
                        Quick Access
                    </h3>
                    <p className="text-xs text-zinc-500 pl-10">Jump to other sections</p>
                </div>

                <div className="flex flex-col gap-2 overflow-y-auto flex-1">
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-4 p-3.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all group border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700/50"
                        >
                            <div className={`p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 group-hover:bg-white dark:group-hover:bg-zinc-700 transition-colors shadow-sm ${item.color}`}>
                                <item.icon size={20} />
                            </div>
                            <span className="font-semibold text-zinc-700 dark:text-zinc-200 group-hover:translate-x-1 transition-transform">{item.label}</span>
                        </Link>
                    ))}
                </div>

                {/* Footer Info */}
                <div className="mt-auto pt-6 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="text-xs text-center text-zinc-400">
                        Qmath Student Portal v1.0
                    </div>
                </div>
            </motion.div>
        </>
    );
}
