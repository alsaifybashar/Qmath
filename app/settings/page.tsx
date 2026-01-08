'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    User, Bell, Lock, Palette, CreditCard, Link2,
    ChevronRight, Settings2, BookOpen, Globe, ArrowLeft
} from 'lucide-react';

const settingsCategories = [
    {
        id: 'account',
        name: 'Account',
        description: 'Email, password, and account security',
        icon: User,
        href: '/profile',
        color: 'text-blue-500'
    },
    {
        id: 'profile',
        name: 'Profile',
        description: 'Personal information and avatar',
        icon: User,
        href: '/profile',
        color: 'text-green-500'
    },
    {
        id: 'notifications',
        name: 'Notifications',
        description: 'Email and push notification preferences',
        icon: Bell,
        href: '/profile',
        color: 'text-yellow-500'
    },
    {
        id: 'privacy',
        name: 'Privacy',
        description: 'Data sharing and visibility settings',
        icon: Lock,
        href: '/privacy',
        color: 'text-red-500'
    },
    {
        id: 'preferences',
        name: 'Study Preferences',
        description: 'Learning style and study settings',
        icon: BookOpen,
        href: '/profile',
        color: 'text-purple-500'
    },
    {
        id: 'subscription',
        name: 'Subscription',
        description: 'Manage your plan and billing',
        icon: CreditCard,
        href: '/pricing',
        color: 'text-cyan-500'
    },
    {
        id: 'connections',
        name: 'Connected Accounts',
        description: 'Linked services and integrations',
        icon: Link2,
        href: '/profile',
        color: 'text-orange-500'
    }
];

export default function SettingsPage() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white transition-colors">
            <div className="fixed inset-0 bg-gradient-to-br from-zinc-100 via-transparent to-zinc-100 dark:from-zinc-900/50 dark:via-black dark:to-zinc-900/50"></div>
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
                {/* Top Nav */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <Link href="/" className="font-bold text-xl">Qmath</Link>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/help" className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                            Help
                        </Link>
                        <Link href="/profile" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all">
                            Profile
                        </Link>
                    </div>
                </div>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Settings2 className="w-8 h-8 text-zinc-500" />
                        <h1 className="text-4xl font-bold">Settings</h1>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400">Manage your account and preferences</p>
                </motion.div>

                {/* Settings Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-3"
                >
                    {settingsCategories.map((category, i) => (
                        <motion.div
                            key={category.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 + i * 0.05 }}
                        >
                            <Link
                                href={category.href}
                                className="flex items-center justify-between p-5 bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                                        <category.icon className={`w-5 h-5 ${category.color}`} />
                                    </div>
                                    <div>
                                        <div className="font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {category.name}
                                        </div>
                                        <div className="text-sm text-zinc-500">{category.description}</div>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Quick Settings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-8 bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6"
                >
                    <h3 className="font-bold mb-6">Quick Settings</h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Globe className="w-5 h-5 text-zinc-500" />
                                <span>Language</span>
                            </div>
                            <select className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm">
                                <option>English</option>
                                <option>Svenska</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Palette className="w-5 h-5 text-zinc-500" />
                                <span>Theme</span>
                            </div>
                            <select className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm">
                                <option>Dark</option>
                                <option>Light</option>
                                <option>System</option>
                            </select>
                        </div>
                    </div>
                </motion.div>

                {/* Danger Zone */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 p-6 bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded-2xl"
                >
                    <h3 className="font-bold text-red-600 dark:text-red-400 mb-4">Danger Zone</h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium">Delete Account</div>
                            <div className="text-sm text-zinc-500">Permanently delete your account and all data</div>
                        </div>
                        <button className="px-4 py-2 bg-red-100 dark:bg-red-500/10 hover:bg-red-200 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 rounded-lg transition-all text-sm">
                            Delete Account
                        </button>
                    </div>
                </motion.div>

                {/* Bottom Navigation */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-8 flex justify-center"
                >
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl font-medium transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
