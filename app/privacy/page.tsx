'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { Shield, FileText, Cookie, ArrowRight } from 'lucide-react';

export default function PrivacyPage() {
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
                        <div className="inline-flex p-3 bg-blue-100 dark:bg-blue-500/10 rounded-xl mb-6">
                            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
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
                        <h2>1. Introduction</h2>
                        <p>
                            Qmath EdTech AB ("we", "our", or "us") is committed to protecting your privacy.
                            This Privacy Policy explains how we collect, use, disclose, and safeguard your
                            information when you use our platform.
                        </p>

                        <h2>2. Information We Collect</h2>
                        <h3>2.1 Personal Information</h3>
                        <ul>
                            <li>Name and email address</li>
                            <li>University and program information</li>
                            <li>Account credentials</li>
                            <li>Payment information (processed by secure third-party providers)</li>
                        </ul>

                        <h3>2.2 Usage Data</h3>
                        <ul>
                            <li>Learning progress and performance data</li>
                            <li>Study patterns and session duration</li>
                            <li>Questions answered and difficulty levels</li>
                            <li>Device and browser information</li>
                        </ul>

                        <h2>3. How We Use Your Information</h2>
                        <p>We use the collected information to:</p>
                        <ul>
                            <li>Provide and maintain our adaptive learning platform</li>
                            <li>Personalize your learning experience</li>
                            <li>Analyze and improve our services</li>
                            <li>Communicate with you about updates and support</li>
                            <li>Comply with legal obligations</li>
                        </ul>

                        <h2>4. Data Sharing</h2>
                        <p>
                            We do not sell your personal information. We may share data with:
                        </p>
                        <ul>
                            <li>Your university (if you're part of an institutional subscription)</li>
                            <li>Service providers who help us operate our platform</li>
                            <li>Law enforcement when required by law</li>
                        </ul>

                        <h2>5. Data Security</h2>
                        <p>
                            We implement industry-standard security measures including encryption,
                            secure servers, and regular security audits to protect your data.
                        </p>

                        <h2>6. Your Rights</h2>
                        <p>Under GDPR, you have the right to:</p>
                        <ul>
                            <li>Access your personal data</li>
                            <li>Correct inaccurate data</li>
                            <li>Request deletion of your data</li>
                            <li>Export your data</li>
                            <li>Withdraw consent</li>
                        </ul>

                        <h2>7. Contact Us</h2>
                        <p>
                            For privacy-related inquiries, contact our Data Protection Officer at{' '}
                            <a href="mailto:privacy@qmath.com" className="text-blue-600">privacy@qmath.com</a>
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
                            href="/terms"
                            className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-zinc-500" />
                                <span>Terms of Service</span>
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
