'use client';

import { useState } from 'react';
import { LogIn, ChevronDown, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <>
            <motion.header
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="fixed top-0 left-0 right-0 z-40 flex justify-between items-center px-6 py-4 pointer-events-none"
            >
                {/* Logo */}
                <Link href="/" className="pointer-events-auto font-bold text-xl text-zinc-900 dark:text-white">
                    Qmath
                </Link>

                {/* Navigation Links - Centered Glass Pill */}
                <nav className="pointer-events-auto hidden md:flex items-center gap-1 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-2 py-2 rounded-full border border-black/5 dark:border-white/10 shadow-sm">
                    <Link href="/features" className="px-5 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all">
                        Features
                    </Link>
                    <Link href="/pricing" className="px-5 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all">
                        Pricing
                    </Link>
                    <Link href="/demo" className="px-5 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all">
                        Demo
                    </Link>
                    <Link href="/universities" className="px-5 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all">
                        For Universities
                    </Link>
                    <Link href="/about" className="px-5 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all">
                        About
                    </Link>
                </nav>

                {/* Right side buttons */}
                <div className="pointer-events-auto flex items-center gap-3">
                    <Link href="/login" className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all">
                        <span>Log in</span>
                        <LogIn className="w-4 h-4" />
                    </Link>
                    <Link href="/register" className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-all">
                        Get Started
                    </Link>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 text-zinc-600 dark:text-zinc-400"
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </motion.header>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-30 bg-white dark:bg-black pt-20 px-6"
                    >
                        <nav className="flex flex-col gap-4">
                            <Link href="/features" onClick={() => setMobileMenuOpen(false)} className="py-3 text-lg font-medium border-b border-zinc-200 dark:border-zinc-800">Features</Link>
                            <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="py-3 text-lg font-medium border-b border-zinc-200 dark:border-zinc-800">Pricing</Link>
                            <Link href="/demo" onClick={() => setMobileMenuOpen(false)} className="py-3 text-lg font-medium border-b border-zinc-200 dark:border-zinc-800">Demo</Link>
                            <Link href="/universities" onClick={() => setMobileMenuOpen(false)} className="py-3 text-lg font-medium border-b border-zinc-200 dark:border-zinc-800">For Universities</Link>
                            <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="py-3 text-lg font-medium border-b border-zinc-200 dark:border-zinc-800">About</Link>
                            <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="py-3 text-lg font-medium border-b border-zinc-200 dark:border-zinc-800">Contact</Link>
                            <div className="flex flex-col gap-3 pt-4">
                                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="w-full py-3 text-center rounded-xl border border-zinc-200 dark:border-zinc-800 font-medium">Log in</Link>
                                <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="w-full py-3 text-center bg-blue-600 text-white rounded-xl font-medium">Get Started</Link>
                            </div>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
