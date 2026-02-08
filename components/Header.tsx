'use client';

import { useState, useEffect } from 'react';
import { LogIn, Menu, X, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

import { useSession, signOut } from 'next-auth/react';
import { User, LogOut } from 'lucide-react';

// Navigation items for reuse
const navItems = [
    { href: '/features', label: 'Features' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/archive', label: 'Old Exams' },
    { href: '/demo', label: 'Demo' },
    { href: '/universities', label: 'For Universities' },
    { href: '/about', label: 'About' },
];

// Animation variants
const headerVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
};

const mobileMenuVariants = {
    hidden: { opacity: 0, y: -20, scale: 0.98 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
    },
    exit: {
        opacity: 0,
        y: -10,
        scale: 0.98,
        transition: { duration: 0.2 }
    }
};

const navItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
        opacity: 1,
        x: 0,
        transition: { delay: i * 0.1, duration: 0.3, ease: [0.16, 1, 0.3, 1] }
    })
};

export function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { data: session } = useSession();

    // Handle scroll for background effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <motion.header
                variants={headerVariants}
                initial="hidden"
                animate="visible"
                className={`fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 md:px-6 py-3 transition-all duration-300 ${scrolled
                        ? 'bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-black/20'
                        : 'bg-transparent'
                    }`}
            >
                {/* Logo with subtle animation */}
                <Link
                    href="/"
                    className="relative font-bold text-xl text-zinc-900 dark:text-white group flex items-center gap-2"
                >
                    <motion.span
                        whileHover={{ scale: 1.05 }}
                        className="relative"
                    >
                        <span className="relative z-10">Qmath</span>
                        <motion.span
                            className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        />
                    </motion.span>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        <Sparkles className="w-3 h-3" />
                        Beta
                    </span>
                </Link>

                {/* Navigation Links - Premium Glass Pill */}
                <nav className="absolute left-1/2 -translate-x-1/2 hidden lg:flex items-center gap-0.5 glass px-2 py-1.5 rounded-full">
                    {navItems.map((item) => (
                        <NavLink key={item.href} href={item.href}>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Right side buttons */}
                <div className="flex items-center gap-2">
                    <AuthenticatedButtons session={session} />

                    {/* Mobile menu button with animation */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="lg:hidden p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
                    >
                        <AnimatePresence mode="wait">
                            {mobileMenuOpen ? (
                                <motion.div
                                    key="close"
                                    initial={{ rotate: -90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: 90, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <X className="w-6 h-6" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="menu"
                                    initial={{ rotate: 90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: -90, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Menu className="w-6 h-6" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                </div>
            </motion.header>

            {/* Mobile Menu - Full screen overlay with glass effect */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        variants={mobileMenuVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="fixed inset-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl pt-20 px-6 overflow-y-auto"
                    >
                        <nav className="flex flex-col gap-2 max-w-md mx-auto">
                            {navItems.map((item, i) => (
                                <motion.div
                                    key={item.href}
                                    custom={i}
                                    variants={navItemVariants}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    <Link
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block py-4 text-lg font-medium text-zinc-700 dark:text-zinc-200 border-b border-zinc-100 dark:border-zinc-800 hover:text-blue-600 dark:hover:text-blue-400 hover:pl-2 transition-all"
                                    >
                                        {item.label}
                                    </Link>
                                </motion.div>
                            ))}

                            <motion.div
                                className="flex flex-col gap-3 pt-6"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                {session ? (
                                    <>
                                        <div className="flex items-center gap-4 py-4 px-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                            <div className="h-12 w-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                                                {session.user?.image ? (
                                                    <img src={session.user.image} alt={session.user.name || "User"} className="h-full w-full object-cover" />
                                                ) : (
                                                    <User className="w-6 h-6 text-white" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-lg text-zinc-900 dark:text-white">{session.user?.name}</div>
                                                <div className="text-sm text-zinc-500">{session.user?.email}</div>
                                            </div>
                                        </div>
                                        <Link
                                            href="/dashboard"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="w-full py-4 text-center bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-2xl font-semibold shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98]"
                                        >
                                            Go to Dashboard
                                        </Link>
                                        <button
                                            onClick={() => signOut()}
                                            className="w-full py-4 text-center border border-zinc-200 dark:border-zinc-700 rounded-2xl font-medium text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900 transition-all"
                                        >
                                            Sign Out
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            href="/login"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="w-full py-4 text-center rounded-2xl border border-zinc-200 dark:border-zinc-700 font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
                                        >
                                            Log in
                                        </Link>
                                        <Link
                                            href="/register"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="w-full py-4 text-center bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-2xl font-semibold shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98]"
                                        >
                                            Get Started Free
                                        </Link>
                                    </>
                                )}
                            </motion.div>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

// Reusable nav link with underline animation
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="relative px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded-full transition-colors group"
        >
            {children}
            <span className="absolute inset-x-2 -bottom-px h-px bg-gradient-to-r from-blue-500/0 via-blue-500/70 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
    );
}

function AuthenticatedButtons({ session }: { session: any }) {
    if (session) {
        return (
            <Link
                href="/dashboard"
                className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-full bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200/50 dark:border-zinc-700/50 transition-all group"
            >
                <div className="relative">
                    <div className="h-7 w-7 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-sm">
                        {session.user?.image ? (
                            <img src={session.user.image} alt={session.user.name || "User"} className="h-full w-full object-cover" />
                        ) : (
                            <User className="w-3.5 h-3.5 text-white" />
                        )}
                    </div>
                    {/* Online indicator */}
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white dark:border-zinc-800" />
                </div>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                    {session.user?.name?.split(' ')[0] || "Dashboard"}
                </span>
            </Link>
        );
    }

    return (
        <>
            <Link
                href="/login"
                className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all"
            >
                Log in
            </Link>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                    href="/register"
                    className="hidden lg:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-full text-sm font-semibold shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30"
                >
                    Get Started
                </Link>
            </motion.div>
        </>
    );
}
