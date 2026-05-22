'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutGrid,
    BookOpen,
    Settings,
    User,
    GraduationCap,
    HelpCircle,
    ChevronLeft,
    ChevronRight,
    Menu
} from 'lucide-react';

const NAV_ITEMS = [
    { href: '/exams', label: 'Tentor', icon: GraduationCap, accent: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
    { href: '/flashcards', label: 'Flashcards', icon: BookOpen, accent: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
    { href: '/courses', label: 'Mina Kurser', icon: LayoutGrid, accent: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' },
    { href: '/profile', label: 'Profil', icon: User, accent: '#F97316', bg: 'rgba(249, 115, 22, 0.12)' },
    { href: '/settings', label: 'Inställningar', icon: Settings, accent: '#64748B', bg: 'rgba(100, 116, 139, 0.12)' },
    { href: '/help', label: 'Hjälp & Support', icon: HelpCircle, accent: '#06B6D4', bg: 'rgba(6, 182, 212, 0.12)' },
];

export default function QuickNav() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const currentItem = NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
    const currentAccent = currentItem?.accent ?? '#14B8A6';

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
                        className="fixed inset-0 bg-black/15 backdrop-blur-sm z-40"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Drawer */}
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: isOpen ? 0 : '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 bottom-0 w-72 backdrop-blur-xl z-50 p-6 flex flex-col"
                style={{
                    background: 'linear-gradient(180deg, var(--sidebar-bg), var(--sidebar-bg-soft))',
                    borderLeft: '1px solid var(--sidebar-border)',
                    boxShadow: '-24px 0 44px rgba(17, 32, 42, 0.10)',
                }}
            >
                {/* Toggle Button attached to the drawer */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="absolute -left-12 top-1/2 -translate-y-1/2 p-3 rounded-l-2xl shadow-[-4px_0_18px_rgba(17,32,42,0.10)] border-y border-l transition-colors"
                    style={{
                        background: 'var(--sidebar-bg)',
                        borderColor: 'var(--sidebar-border)',
                        color: currentAccent,
                    }}
                >
                    {isOpen ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
                </button>

                <div className="mb-8">
                    <h3 className="font-bold text-xl flex items-center gap-2 mb-1" style={{ color: 'var(--sidebar-text)' }}>
                        <span
                            className="p-1.5 rounded-lg text-white"
                            style={{ background: 'var(--sidebar-active)' }}
                        >
                            <Menu size={18} />
                        </span>
                        Snabbåtkomst
                    </h3>
                    <p className="text-xs pl-10" style={{ color: 'var(--sidebar-muted)' }}>
                        Hoppa till andra sektioner
                    </p>
                </div>

                <div className="flex flex-col gap-2 overflow-y-auto flex-1">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className="relative flex items-center gap-4 p-3.5 rounded-xl transition-all group border"
                                style={{
                                    background: isActive ? item.bg : 'transparent',
                                    borderColor: isActive ? item.accent : 'transparent',
                                    color: isActive ? item.accent : 'var(--sidebar-text)',
                                }}
                            >
                                {isActive && (
                                    <span
                                        className="absolute right-2 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full"
                                        style={{ background: item.accent }}
                                    />
                                )}
                                <div
                                    className="p-2.5 rounded-xl transition-colors shadow-sm"
                                    style={{
                                        background: isActive ? item.accent : 'var(--sidebar-hover)',
                                        color: isActive ? '#fff' : item.accent,
                                    }}
                                >
                                    <item.icon size={20} />
                                </div>
                                <span className="font-semibold transition-transform group-hover:translate-x-1">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>

                {/* Footer Info */}
                <div className="mt-auto pt-6 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
                    <div className="text-xs text-center" style={{ color: 'var(--sidebar-subtle)' }}>
                        Qmath Studentportal v1.0
                    </div>
                </div>
            </motion.div>
        </>
    );
}
