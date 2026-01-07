'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Rocket, Target, Brain, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OnboardingWelcome() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            {/* Background */}
            <div className="fixed inset-0 bg-gradient-to-br from-purple-900/30 via-black to-blue-900/30"></div>
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            {/* Floating orbs */}
            <div className="fixed top-20 right-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-float-slow"></div>
            <div className="fixed bottom-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 max-w-2xl w-full"
            >
                {/* Welcome Card */}
                <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-12 text-center">
                    {/* Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: 'spring' }}
                        className="inline-flex p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-8"
                    >
                        <Rocket className="w-12 h-12 text-white" />
                    </motion.div>

                    {/* Title */}
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-4xl md:text-5xl font-bold mb-4"
                    >
                        Welcome to{' '}
                        <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Qmath
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-xl text-zinc-400 mb-12"
                    >
                        Let's personalize your learning experience in just a few steps.
                    </motion.p>

                    {/* What you'll do */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="grid gap-4 mb-12 text-left"
                    >
                        {[
                            { icon: Target, text: 'Select your university and program' },
                            { icon: Brain, text: 'Choose your courses' },
                            { icon: Sparkles, text: 'Take a quick diagnostic test' }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl border border-zinc-800">
                                <div className="p-2 bg-zinc-700 rounded-lg">
                                    <item.icon className="w-5 h-5 text-blue-400" />
                                </div>
                                <span className="text-zinc-300">{item.text}</span>
                            </div>
                        ))}
                    </motion.div>

                    {/* Estimated time */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="text-sm text-zinc-500 mb-8"
                    >
                        ⏱️ This takes about 3-5 minutes
                    </motion.p>

                    {/* CTA */}
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        onClick={() => router.push('/onboarding/university')}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                        Get Started
                        <ArrowRight className="w-5 h-5" />
                    </motion.button>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        className="text-sm text-zinc-500 mt-6"
                    >
                        Already personalized?{' '}
                        <Link href="/dashboard" className="text-blue-400 hover:underline">
                            Go to Dashboard
                        </Link>
                    </motion.p>
                </div>

                {/* Progress indicator */}
                <div className="flex justify-center gap-2 mt-8">
                    <div className="w-8 h-1 rounded-full bg-blue-500"></div>
                    <div className="w-8 h-1 rounded-full bg-zinc-700"></div>
                    <div className="w-8 h-1 rounded-full bg-zinc-700"></div>
                    <div className="w-8 h-1 rounded-full bg-zinc-700"></div>
                    <div className="w-8 h-1 rounded-full bg-zinc-700"></div>
                </div>
            </motion.div>
        </div>
    );
}
