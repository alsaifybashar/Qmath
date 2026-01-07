'use client';

import { LogIn } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export function Header() {
    return (
        <motion.header
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="fixed top-0 left-0 right-0 z-40 flex justify-center items-center p-6 pointer-events-none"
        >
            {/* Navigation Links - Centered Glass Pill */}
            <nav className="pointer-events-auto flex items-center gap-1 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-2 py-2 rounded-full border border-black/5 dark:border-white/10 shadow-sm">
                <Link href="/why-qmath" className="px-5 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all">
                    Varför Qmath
                </Link>
                <Link href="/#courses" className="px-5 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all">
                    Kurser
                </Link>
                <Link href="/exams" className="px-5 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all">
                    Tentor
                </Link>
                <Link href="/#pricing" className="px-5 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all">
                    Priser
                </Link>
            </nav>

            {/* Login Button - Subtle & Scaled Down */}
            <div className="absolute right-6 pointer-events-auto">
                <Link href="/login">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all">
                        <span>Log in</span>
                        <LogIn className="w-4 h-4" />
                    </button>
                </Link>
            </div>
        </motion.header>
    );
}
