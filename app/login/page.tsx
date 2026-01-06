'use client';

import Link from 'next/link';
import { ArrowLeft, Building2, Github, Globe, Mail } from 'lucide-react';
import dynamic from 'next/dynamic';
import 'katex/dist/katex.min.css';

// Dynamically import KaTeX components with no SSR
const BlockMath = dynamic(() => import('react-katex').then((mod) => mod.BlockMath), { ssr: false });

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (email === 'admin' && password === 'admin') {
            router.push('/profile');
        } else {
            console.log('Invalid credentials');
        }
    };

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
                        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">Sign in or create account</h2>
                        <p className="text-zinc-500 mt-2">Enter your details to access your dashboard.</p>
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

                        {/* Email Form */}
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email address</label>
                                <input
                                    type="text"
                                    placeholder="name@university.edu"
                                    className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                    <input type="checkbox" className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500" />
                                    Remember me
                                </label>
                                <Link href="#" className="text-blue-600 hover:underline font-medium">Forgot password?</Link>
                            </div>

                            <button type="submit" className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold rounded-xl shadow-lg hover:opacity-90 transition-all">
                                Log in
                            </button>
                        </form>

                        {/* Registration CTA */}
                        <div className="pt-4 text-center">
                            <p className="text-zinc-600 dark:text-zinc-400">
                                Don't have an account?{' '}
                                <button className="text-blue-600 font-bold hover:underline">
                                    Create an account
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
