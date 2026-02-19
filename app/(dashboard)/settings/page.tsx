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
        name: 'Konto',
        description: 'E-post, lösenord och kontosäkerhet',
        icon: User,
        href: '/profile',
        color: 'text-blue-500'
    },
    {
        id: 'profile',
        name: 'Profil',
        description: 'Personlig information och avatar',
        icon: User,
        href: '/profile',
        color: 'text-green-500'
    },
    {
        id: 'notifications',
        name: 'Notiser',
        description: 'E-post- och pushnotisinställningar',
        icon: Bell,
        href: '/profile',
        color: 'text-yellow-500'
    },
    {
        id: 'privacy',
        name: 'Integritet',
        description: 'Datadelning och inställningar för synlighet',
        icon: Lock,
        href: '/privacy',
        color: 'text-red-500'
    },
    {
        id: 'preferences',
        name: 'Studiepreferenser',
        description: 'Inlärningsstil och studieinställningar',
        icon: BookOpen,
        href: '/profile',
        color: 'text-purple-500'
    },
    {
        id: 'subscription',
        name: 'Prenumeration',
        description: 'Hantera din plan och fakturering',
        icon: CreditCard,
        href: '/pricing',
        color: 'text-cyan-500'
    },
    {
        id: 'connections',
        name: 'Kopplade konton',
        description: 'Kopplade tjänster och integrationer',
        icon: Link2,
        href: '/profile',
        color: 'text-orange-500'
    }
];

export default function SettingsPage() {
    return (
        <div className="max-w-3xl mx-auto px-4 py-8">

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-center gap-3 mb-2">
                    <Settings2 className="w-8 h-8 text-zinc-500" />
                    <h1 className="text-4xl font-bold">Inställningar</h1>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400">Hantera ditt konto och preferenser</p>
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
                <h3 className="font-bold mb-6">Snabbinställningar</h3>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Globe className="w-5 h-5 text-zinc-500" />
                            <span>Språk</span>
                        </div>
                        <select className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm">
                            <option>English</option>
                            <option>Svenska</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Palette className="w-5 h-5 text-zinc-500" />
                            <span>Tema</span>
                        </div>
                        <select className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm">
                            <option>Mörkt</option>
                            <option>Ljust</option>
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
                <h3 className="font-bold text-red-600 dark:text-red-400 mb-4">Riskzon</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-medium">Radera konto</div>
                        <div className="text-sm text-zinc-500">Radera ditt konto och all data permanent</div>
                    </div>
                    <button className="px-4 py-2 bg-red-100 dark:bg-red-500/10 hover:bg-red-200 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 rounded-lg transition-all text-sm">
                        Radera konto
                    </button>
                </div>
            </motion.div>

        </div>
    );
}
