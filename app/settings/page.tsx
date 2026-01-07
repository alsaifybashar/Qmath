'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    User, Bell, Lock, Palette, CreditCard, Link2,
    ChevronRight, Settings2, BookOpen, Globe
} from 'lucide-react';

const settingsCategories = [
    {
        id: 'account',
        name: 'Account',
        description: 'Email, password, and account security',
        icon: User,
        href: '/settings/account',
        color: 'text-blue-400'
    },
    {
        id: 'profile',
        name: 'Profile',
        description: 'Personal information and avatar',
        icon: User,
        href: '/settings/profile',
        color: 'text-green-400'
    },
    {
        id: 'notifications',
        name: 'Notifications',
        description: 'Email and push notification preferences',
        icon: Bell,
        href: '/settings/notifications',
        color: 'text-yellow-400'
    },
    {
        id: 'privacy',
        name: 'Privacy',
        description: 'Data sharing and visibility settings',
        icon: Lock,
        href: '/settings/privacy',
        color: 'text-red-400'
    },
    {
        id: 'preferences',
        name: 'Study Preferences',
        description: 'Learning style and study settings',
        icon: BookOpen,
        href: '/settings/preferences',
        color: 'text-purple-400'
    },
    {
        id: 'subscription',
        name: 'Subscription',
        description: 'Manage your plan and billing',
        icon: CreditCard,
        href: '/settings/subscription',
        color: 'text-cyan-400'
    },
    {
        id: 'connections',
        name: 'Connected Accounts',
        description: 'Linked services and integrations',
        icon: Link2,
        href: '/settings/connections',
        color: 'text-orange-400'
    }
];

export default function SettingsPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <div className="fixed inset-0 bg-gradient-to-br from-zinc-900/50 via-black to-zinc-900/50"></div>
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            <div className="relative z-10 max-w-3xl mx-auto px-4 py-12">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Settings2 className="w-8 h-8 text-zinc-400" />
                        <h1 className="text-4xl font-bold">Settings</h1>
                    </div>
                    <p className="text-zinc-400">Manage your account and preferences</p>
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
                                className="flex items-center justify-between p-5 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-zinc-800 rounded-xl">
                                        <category.icon className={`w-5 h-5 ${category.color}`} />
                                    </div>
                                    <div>
                                        <div className="font-semibold group-hover:text-blue-400 transition-colors">
                                            {category.name}
                                        </div>
                                        <div className="text-sm text-zinc-500">{category.description}</div>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Quick Settings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-12 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6"
                >
                    <h3 className="font-bold mb-6">Quick Settings</h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Globe className="w-5 h-5 text-zinc-400" />
                                <span>Language</span>
                            </div>
                            <select className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm">
                                <option>English</option>
                                <option>Svenska</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Palette className="w-5 h-5 text-zinc-400" />
                                <span>Theme</span>
                            </div>
                            <select className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm">
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
                    className="mt-8 p-6 bg-red-500/5 border border-red-500/20 rounded-2xl"
                >
                    <h3 className="font-bold text-red-400 mb-4">Danger Zone</h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium">Delete Account</div>
                            <div className="text-sm text-zinc-500">Permanently delete your account and all data</div>
                        </div>
                        <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-all text-sm">
                            Delete Account
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
