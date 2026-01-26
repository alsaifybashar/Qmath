'use client';

import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
    ChevronDown, Settings, User, BarChart3, BookOpen,
    PanelRightClose, PanelRightOpen, Zap, Menu, X
} from 'lucide-react';

interface StudyLayoutProps {
    children: ReactNode;
    contextPanel?: ReactNode;
    currentCourse?: string;
    progress?: number;
    xp?: number;
    streak?: number;
}

export function StudyLayout({
    children,
    contextPanel,
    currentCourse = "Calculus I",
    progress = 0,
    xp = 0,
    streak = 0
}: StudyLayoutProps) {
    const [isPanelOpen, setIsPanelOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white transition-colors">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800">
                <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
                    {/* Left: Logo & Course Selector */}
                    <div className="flex items-center gap-4">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="lg:hidden p-2 -ml-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>

                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                Q
                            </div>
                            <span className="hidden sm:block font-bold text-lg text-zinc-900 dark:text-white">
                                Qmath
                            </span>
                        </Link>

                        {/* Course Selector */}
                        <button className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                            <BookOpen className="w-4 h-4 text-violet-500" />
                            <span>{currentCourse}</span>
                            <ChevronDown className="w-4 h-4 text-zinc-400" />
                        </button>
                    </div>

                    {/* Center: Navigation */}
                    <nav className="hidden lg:flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-full p-1">
                        <NavLink href="/study" active>Study</NavLink>
                        <NavLink href="/progress">Progress</NavLink>
                        <NavLink href="/courses">Courses</NavLink>
                    </nav>

                    {/* Right: Stats & Actions */}
                    <div className="flex items-center gap-3">
                        {/* Progress Bar (Desktop) */}
                        <div className="hidden md:flex items-center gap-2">
                            <span className="text-xs font-medium text-zinc-500">Progress</span>
                            <div className="w-24 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{progress}%</span>
                        </div>

                        {/* XP Counter */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-500/10 rounded-full border border-amber-200 dark:border-amber-500/20">
                            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{xp}</span>
                        </div>

                        {/* Streak */}
                        {streak > 0 && (
                            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-orange-50 dark:bg-orange-500/10 rounded-full border border-orange-200 dark:border-orange-500/20">
                                <span className="text-sm">🔥</span>
                                <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{streak}</span>
                            </div>
                        )}

                        {/* Context Panel Toggle (Desktop) */}
                        <button
                            onClick={() => setIsPanelOpen(!isPanelOpen)}
                            className="hidden lg:flex p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            aria-label={isPanelOpen ? "Close panel" : "Open panel"}
                        >
                            {isPanelOpen ? (
                                <PanelRightClose className="w-5 h-5" />
                            ) : (
                                <PanelRightOpen className="w-5 h-5" />
                            )}
                        </button>

                        {/* Settings & Profile */}
                        <Link
                            href="/settings"
                            className="hidden sm:flex p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <Settings className="w-5 h-5" />
                        </Link>
                        <Link
                            href="/profile"
                            className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <User className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* Mobile Navigation Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="fixed inset-x-0 top-16 z-40 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 lg:hidden"
                    >
                        <nav className="p-4 space-y-2">
                            <MobileNavLink href="/study" onClick={() => setIsMobileMenuOpen(false)}>
                                <BookOpen className="w-5 h-5" />
                                Study
                            </MobileNavLink>
                            <MobileNavLink href="/progress" onClick={() => setIsMobileMenuOpen(false)}>
                                <BarChart3 className="w-5 h-5" />
                                Progress
                            </MobileNavLink>
                            <MobileNavLink href="/courses" onClick={() => setIsMobileMenuOpen(false)}>
                                <BookOpen className="w-5 h-5" />
                                Courses
                            </MobileNavLink>
                            <MobileNavLink href="/settings" onClick={() => setIsMobileMenuOpen(false)}>
                                <Settings className="w-5 h-5" />
                                Settings
                            </MobileNavLink>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <div className="pt-16 min-h-screen flex">
                {/* Main Content */}
                <main className={`flex-1 transition-all duration-300 ${
                    isPanelOpen && contextPanel ? 'lg:mr-80' : ''
                }`}>
                    <div className="max-w-4xl mx-auto px-4 py-6 lg:py-8">
                        {children}
                    </div>
                </main>

                {/* Context Panel (Desktop) */}
                <AnimatePresence>
                    {isPanelOpen && contextPanel && (
                        <motion.aside
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 320, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="hidden lg:block fixed right-0 top-16 bottom-0 w-80 bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 overflow-y-auto"
                        >
                            <div className="p-4">
                                {contextPanel}
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* Mobile Context Panel (Bottom Sheet) */}
                <AnimatePresence>
                    {isMobilePanelOpen && contextPanel && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                                onClick={() => setIsMobilePanelOpen(false)}
                            />
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-zinc-950 rounded-t-3xl max-h-[80vh] overflow-y-auto lg:hidden"
                            >
                                <div className="sticky top-0 bg-white dark:bg-zinc-950 p-4 border-b border-zinc-200 dark:border-zinc-800">
                                    <div className="w-12 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-3" />
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold">Context & Help</h3>
                                        <button
                                            onClick={() => setIsMobilePanelOpen(false)}
                                            className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    {contextPanel}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Mobile Context Panel Toggle Button */}
                {contextPanel && (
                    <button
                        onClick={() => setIsMobilePanelOpen(true)}
                        className="lg:hidden fixed bottom-4 right-4 z-30 p-4 bg-violet-600 hover:bg-violet-500 text-white rounded-full shadow-lg shadow-violet-500/25 transition-colors"
                    >
                        <PanelRightOpen className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
}

function NavLink({ href, children, active = false }: { href: string; children: ReactNode; active?: boolean }) {
    return (
        <Link
            href={href}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                active
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
        >
            {children}
        </Link>
    );
}

function MobileNavLink({ href, children, onClick }: { href: string; children: ReactNode; onClick?: () => void }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
            {children}
        </Link>
    );
}
