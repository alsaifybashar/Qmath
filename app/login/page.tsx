'use client';

import Link from 'next/link';
import { ArrowLeft, Mail, Globe } from 'lucide-react';
import dynamic from 'next/dynamic';
import 'katex/dist/katex.min.css';

// Dynamically import KaTeX components with no SSR
const BlockMath = dynamic(() => import('react-katex').then((mod) => mod.BlockMath), { ssr: false });

import { useActionState } from 'react';
import { useState } from 'react';
import { authenticate } from '@/app/actions/auth';

export default function LoginPage() {
    const [errorMessage, formAction, isPending] = useActionState(
        authenticate,
        undefined,
    );

    return (
        <div className="min-h-screen w-full flex bg-white dark:bg-black transition-colors duration-300">

            {/* LEFT SIDE: Branding & Theme */}
            <div className="hidden lg:flex w-1/2 bg-blue-600 relative overflow-hidden flex-col justify-between p-12 text-white">
                {/* Background Decor */}
                <div className="absolute inset-0 bg-blue-600">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                </div>

                {/* Floating Math (Purely decorative here) */}
                <div className="absolute top-1/4 right-20 opacity-20 rotate-12 scale-125 pointer-events-none">
                    <BlockMath math="\oint_C \vec{F} \cdot d\vec{r} = 0" />
                </div>
                <div className="absolute bottom-1/3 left-20 opacity-20 -rotate-6 scale-125 pointer-events-none">
                    <BlockMath math="i\hbar \dot{\Psi} = \hat{H}\Psi" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                    <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-8">
                        <ArrowLeft className="w-4 h-4" /> Back to Qmath
                    </Link>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Master Engineering Math.</h1>
                    <p className="text-blue-100 text-lg">Join thousands of students from top technical universities.</p>
                </div>

                <div className="relative z-10 space-y-6">
                    <div className="p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg">
                        <div className="flex gap-4 mb-4">
                            <div className="h-3 w-3 rounded-full bg-red-400"></div>
                            <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                            <div className="h-3 w-3 rounded-full bg-green-400"></div>
                        </div>
                        <div className="space-y-3 font-mono text-sm text-blue-50/80">
                            <p>&gt; initializing_adaptive_engine...</p>
                            <p>&gt; load_user_profile(student_id)</p>
                            <p className="text-green-300">&gt; ready. learning_velocity: 1.25x</p>
                        </div>
                    </div>
                    <p className="text-xs text-blue-200/60 uppercase tracking-widest pl-1">© 2026 Qmath EdTech AB</p>
                </div>
            </div>

            {/* RIGHT SIDE: Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-zinc-50 dark:bg-black">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">Sign in to your account</h2>
                        <p className="text-zinc-500 mt-2">Enter your credentials to access your dashboard.</p>
                    </div>

                    <div className="space-y-4">
                        {/* SSO Buttons */}
                        <div className="grid grid-cols-2 gap-4">
                            <button className="flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all font-medium text-zinc-700 dark:text-zinc-200">
                                <Mail className="w-5 h-5 text-red-500" /> Google
                            </button>
                            <button className="flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all font-medium text-zinc-700 dark:text-zinc-200">
                                <Globe className="w-5 h-5 text-blue-500" /> SSO
                            </button>
                        </div>

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-200 dark:border-zinc-800" /></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-zinc-50 dark:bg-black px-2 text-zinc-500">Or continue with email</span></div>
                        </div>

                        {/* Email Form - Now using NextAuth */}
                        <form action={formAction} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email address</label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="name@university.edu"
                                    className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                    <input type="checkbox" className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500" />
                                    Remember me
                                </label>
                                <Link href="/forgot-password" className="text-blue-600 hover:underline font-medium">Forgot password?</Link>
                            </div>

                            {/* Error Message */}
                            {errorMessage && (
                                <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-xl">
                                    <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold rounded-xl shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
                            >
                                {isPending ? 'Signing in...' : 'Log in'}
                            </button>
                        </form>

                        {/* Registration CTA */}
                        <div className="pt-4 text-center">
                            <p className="text-zinc-600 dark:text-zinc-400">
                                Don't have an account?{' '}
                                <Link href="/register" className="text-blue-600 font-bold hover:underline">
                                    Create an account
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
