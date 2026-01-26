'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    HelpCircle, Book, MessageCircle, Lightbulb, Search,
    ChevronRight, ExternalLink, Mail, FileText, ArrowLeft
} from 'lucide-react';

const helpCategories = [
    {
        id: 'getting-started',
        name: 'Getting Started',
        description: 'Learn the basics of Qmath',
        icon: '🚀',
        articles: 12
    },
    {
        id: 'learning',
        name: 'Learning & Practice',
        description: 'How to use adaptive learning features',
        icon: '📚',
        articles: 18
    },
    {
        id: 'exams',
        name: 'Exams & Simulations',
        description: 'Prepare for exams effectively',
        icon: '📝',
        articles: 8
    },
    {
        id: 'flashcards',
        name: 'Flashcards & SRS',
        description: 'Master spaced repetition',
        icon: '🃏',
        articles: 6
    },
    {
        id: 'account',
        name: 'Account & Billing',
        description: 'Manage your subscription',
        icon: '💳',
        articles: 10
    },
    {
        id: 'troubleshooting',
        name: 'Troubleshooting',
        description: 'Fix common issues',
        icon: '🔧',
        articles: 15
    }
];

const popularArticles = [
    { id: 1, title: 'How adaptive learning works', category: 'Learning' },
    { id: 2, title: 'Setting up your study schedule', category: 'Getting Started' },
    { id: 3, title: 'Understanding your mastery score', category: 'Progress' },
    { id: 4, title: 'Creating effective flashcards', category: 'Flashcards' },
    { id: 5, title: 'Preparing for exam simulations', category: 'Exams' }
];

export default function HelpPage() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white transition-colors">
            <div className="fixed inset-0 bg-gradient-to-br from-blue-100/50 via-transparent to-purple-100/50 dark:from-blue-900/10 dark:via-black dark:to-purple-900/10"></div>
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
                {/* Top Nav */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <Link href="/" className="font-bold text-xl">Qmath</Link>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/settings" className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                            Settings
                        </Link>
                        <Link href="/contact" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all">
                            Contact
                        </Link>
                    </div>
                </div>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl font-bold mb-4">How can we help?</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-8">Search our knowledge base or browse categories</p>

                    {/* Search */}
                    <div className="max-w-xl mx-auto relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Search for answers..."
                            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                        />
                    </div>
                </motion.div>

                {/* Quick Links */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
                >
                    <Link
                        href="/contact"
                        className="flex flex-col items-center p-6 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group"
                    >
                        <HelpCircle className="w-8 h-8 text-blue-500 mb-3" />
                        <span className="font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">FAQ</span>
                    </Link>
                    <Link
                        href="/demo"
                        className="flex flex-col items-center p-6 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group"
                    >
                        <Book className="w-8 h-8 text-green-500 mb-3" />
                        <span className="font-medium group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Tutorials</span>
                    </Link>
                    <Link
                        href="/contact"
                        className="flex flex-col items-center p-6 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group"
                    >
                        <MessageCircle className="w-8 h-8 text-purple-500 mb-3" />
                        <span className="font-medium group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Contact</span>
                    </Link>
                    <Link
                        href="/contact"
                        className="flex flex-col items-center p-6 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group"
                    >
                        <Lightbulb className="w-8 h-8 text-yellow-500 mb-3" />
                        <span className="font-medium group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">Feedback</span>
                    </Link>
                </motion.div>

                {/* Categories */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-12"
                >
                    <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {helpCategories.map((category) => (
                            <Link
                                key={category.id}
                                href={`/contact`}
                                className="flex items-center gap-4 p-5 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group"
                            >
                                <span className="text-3xl">{category.icon}</span>
                                <div className="flex-1">
                                    <div className="font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {category.name}
                                    </div>
                                    <div className="text-sm text-zinc-500">{category.articles} articles</div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                            </Link>
                        ))}
                    </div>
                </motion.div>

                {/* Popular Articles */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-12"
                >
                    <h2 className="text-2xl font-bold mb-6">Popular Articles</h2>
                    <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                        {popularArticles.map((article, i) => (
                            <Link
                                key={article.id}
                                href={`/contact`}
                                className={`flex items-center justify-between p-4 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all ${i !== popularArticles.length - 1 ? 'border-b border-zinc-200 dark:border-zinc-800' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-zinc-400" />
                                    <span>{article.title}</span>
                                </div>
                                <span className="text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                                    {article.category}
                                </span>
                            </Link>
                        ))}
                    </div>
                </motion.div>

                {/* Contact CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-center p-8 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-500/10 dark:to-purple-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl"
                >
                    <Mail className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Can't find what you're looking for?</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-6">Our support team is happy to help you</p>
                    <Link
                        href="/contact"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all"
                    >
                        Contact Support
                        <ExternalLink className="w-4 h-4" />
                    </Link>
                </motion.div>

                {/* Bottom Navigation */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
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
