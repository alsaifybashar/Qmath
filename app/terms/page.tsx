'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { FileText, Shield, Cookie, ArrowRight } from 'lucide-react';

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white">
            <Header />

            <section className="pt-32 pb-24 px-4">
                <div className="max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12"
                    >
                        <div className="inline-flex p-3 bg-purple-100 dark:bg-purple-500/10 rounded-xl mb-6">
                            <FileText className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Last updated: January 1, 2026
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="prose prose-zinc dark:prose-invert max-w-none"
                    >
                        <h2>1. Acceptance of Terms</h2>
                        <p>
                            By accessing and using Qmath ("the Platform"), you agree to be bound by these
                            Terms of Service. If you do not agree to these terms, please do not use the Platform.
                        </p>

                        <h2>2. Description of Service</h2>
                        <p>
                            Qmath provides an adaptive learning platform for engineering mathematics.
                            The service includes practice questions, exam simulations, progress tracking,
                            and AI-powered tutoring features.
                        </p>

                        <h2>3. User Accounts</h2>
                        <ul>
                            <li>You must provide accurate information when creating an account</li>
                            <li>You are responsible for maintaining the security of your account</li>
                            <li>You must be at least 16 years old to use the service</li>
                            <li>One person may not maintain more than one account</li>
                        </ul>

                        <h2>4. Subscription and Payments</h2>
                        <ul>
                            <li>Subscriptions are billed monthly or yearly as selected</li>
                            <li>Refunds are available within 30 days of purchase</li>
                            <li>Prices may change with 30 days notice</li>
                            <li>Free trial periods may be offered at our discretion</li>
                        </ul>

                        <h2>5. Acceptable Use</h2>
                        <p>You agree not to:</p>
                        <ul>
                            <li>Share your account credentials with others</li>
                            <li>Attempt to reverse engineer or copy our content</li>
                            <li>Use the platform for any illegal purpose</li>
                            <li>Distribute solutions or answers outside the platform</li>
                            <li>Use automated systems to access the platform</li>
                        </ul>

                        <h2>6. Intellectual Property</h2>
                        <p>
                            All content on Qmath, including questions, explanations, and software,
                            is owned by Qmath EdTech AB and protected by copyright laws. You may not
                            reproduce or distribute this content without permission.
                        </p>

                        <h2>7. Limitation of Liability</h2>
                        <p>
                            Qmath is provided "as is" without warranties. We are not liable for any
                            indirect, incidental, or consequential damages arising from your use of
                            the platform.
                        </p>

                        <h2>8. Changes to Terms</h2>
                        <p>
                            We may update these terms at any time. Continued use of the platform
                            after changes constitutes acceptance of the new terms.
                        </p>

                        <h2>9. Governing Law</h2>
                        <p>
                            These terms are governed by Swedish law. Any disputes shall be resolved
                            in the courts of Stockholm, Sweden.
                        </p>

                        <h2>10. Contact</h2>
                        <p>
                            For questions about these terms, contact us at{' '}
                            <a href="mailto:legal@qmath.com" className="text-blue-600">legal@qmath.com</a>
                        </p>
                    </motion.div>

                    {/* Related Links */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-12 grid md:grid-cols-2 gap-4"
                    >
                        <Link
                            href="/privacy"
                            className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-zinc-500" />
                                <span>Privacy Policy</span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            href="/cookies"
                            className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <Cookie className="w-5 h-5 text-zinc-500" />
                                <span>Cookie Policy</span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>
                </div>
            </section>

            <footer className="py-12 border-t border-zinc-200 dark:border-zinc-900 text-center text-zinc-500 text-sm">
                <p>© 2026 Qmath EdTech AB. All rights reserved.</p>
            </footer>
        </main>
    );
}
