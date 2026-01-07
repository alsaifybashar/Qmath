'use client';

import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Trophy, Sparkles, BookOpen, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function OnboardingComplete() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-gradient-to-br from-green-900/30 via-black to-blue-900/30"></div>
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            {/* Celebratory orbs */}
            <div className="fixed top-20 right-20 w-64 h-64 bg-green-500/20 rounded-full blur-3xl animate-float-slow"></div>
            <div className="fixed bottom-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 max-w-2xl w-full"
            >
                <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-12 text-center">
                    {/* Success Icon */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                        className="inline-flex p-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-8"
                    >
                        <CheckCircle2 className="w-12 h-12 text-white" />
                    </motion.div>

                    {/* Title */}
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-4xl md:text-5xl font-bold mb-4"
                    >
                        You're all set!
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-xl text-zinc-400 mb-12"
                    >
                        Your personalized learning path is ready. Let's start mastering math!
                    </motion.p>

                    {/* Quick Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="grid grid-cols-3 gap-4 mb-12"
                    >
                        <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
                            <BookOpen className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                            <div className="text-2xl font-bold">3</div>
                            <div className="text-xs text-zinc-500">Courses</div>
                        </div>
                        <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
                            <Sparkles className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                            <div className="text-2xl font-bold">82</div>
                            <div className="text-xs text-zinc-500">Topics</div>
                        </div>
                        <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
                            <Calendar className="w-6 h-6 text-green-400 mx-auto mb-2" />
                            <div className="text-2xl font-bold">12</div>
                            <div className="text-xs text-zinc-500">Week Plan</div>
                        </div>
                    </motion.div>

                    {/* What's Next */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="mb-8 p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20"
                    >
                        <div className="flex items-center gap-3 justify-center mb-3">
                            <Trophy className="w-5 h-5 text-yellow-400" />
                            <span className="font-semibold">First Goal</span>
                        </div>
                        <p className="text-sm text-zinc-400">
                            Complete 5 practice questions to calibrate your adaptive learning engine.
                        </p>
                    </motion.div>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="space-y-4"
                    >
                        <button
                            onClick={() => router.push('/study')}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                        >
                            Start Learning
                            <ArrowRight className="w-5 h-5" />
                        </button>

                        <Link
                            href="/dashboard"
                            className="block w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl transition-all"
                        >
                            Go to Dashboard
                        </Link>
                    </motion.div>
                </div>

                {/* Progress - complete */}
                <div className="flex justify-center gap-2 mt-8">
                    <div className="w-8 h-1 rounded-full bg-green-500"></div>
                    <div className="w-8 h-1 rounded-full bg-green-500"></div>
                    <div className="w-8 h-1 rounded-full bg-green-500"></div>
                    <div className="w-8 h-1 rounded-full bg-green-500"></div>
                    <div className="w-8 h-1 rounded-full bg-green-500"></div>
                </div>
            </motion.div>
        </div>
    );
}
