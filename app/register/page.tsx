'use client';

import Link from 'next/link';
import { ArrowLeft, Mail, User, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import dynamic from 'next/dynamic';
import 'katex/dist/katex.min.css';
import { useState, useTransition } from 'react';
import { register } from '@/app/actions/auth';

const BlockMath = dynamic(() => import('react-katex').then((mod) => mod.BlockMath), { ssr: false });

export default function RegisterPage() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        const data = new FormData();
        data.append('name', formData.name);
        data.append('email', formData.email);
        data.append('password', formData.password);

        startTransition(async () => {
            const result = await register(null, data);
            if (result?.message) {
                setError(result.message);
            } else if (result?.errors) {
                const first = Object.values(result.errors).flat()[0];
                setError(typeof first === 'string' ? first : 'Something went wrong.');
            }
        });
    };

    return (
        <div className="min-h-screen w-full flex bg-white dark:bg-black transition-colors">
            {/* Left: Branding */}
            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 relative overflow-hidden flex-col justify-between p-12 text-white">
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/[0.07] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                </div>

                <div className="absolute opacity-[0.12] top-1/4 right-16 rotate-6 scale-125 pointer-events-none select-none">
                    <BlockMath math="\nabla \times \vec{E} = -\frac{\partial \vec{B}}{\partial t}" />
                </div>
                <div className="absolute opacity-[0.12] bottom-1/3 left-12 -rotate-3 scale-125 pointer-events-none select-none">
                    <BlockMath math="\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}" />
                </div>

                <div className="relative z-10">
                    <Link href="/" className="inline-flex items-center gap-2 text-white/65 hover:text-white transition-colors mb-10 text-sm font-medium">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Qmath
                    </Link>
                    <h1 className="text-4xl font-bold tracking-tight mb-3 leading-tight">
                        Master engineering<br />math — for real.
                    </h1>
                    <p className="text-white/65 text-base leading-relaxed max-w-sm">
                        Adaptive practice, past exams, and instant feedback — built for Swedish engineering students.
                    </p>
                </div>

                <div className="relative z-10 space-y-5">
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { value: '50K+', label: 'Questions' },
                            { value: '95%', label: 'Pass rate' },
                            { value: '4.9★', label: 'Rating' },
                        ].map(({ value, label }) => (
                            <div key={label} className="p-4 bg-white/[0.08] backdrop-blur rounded-xl border border-white/10 text-center">
                                <div className="text-2xl font-bold tabular-nums">{value}</div>
                                <div className="text-[11px] text-white/50 mt-1 uppercase tracking-wider">{label}</div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-white/30 uppercase tracking-widest">© 2026 Qmath EdTech AB</p>
                </div>
            </div>

            {/* Right: Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-950">
                <div className="max-w-[380px] w-full">
                    {/* Mobile back link */}
                    <Link href="/" className="lg:hidden inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-8 font-medium">
                        <ArrowLeft className="w-4 h-4" />
                        Qmath
                    </Link>

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Create your account</h2>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 text-sm">Takes 30 seconds. No credit card needed.</p>
                    </div>

                    {error && (
                        <div className="mb-5 px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                                Full name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Johan Andersson"
                                    required
                                    autoComplete="name"
                                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                                <input
                                    type="email"
                                    placeholder="you@university.se"
                                    required
                                    autoComplete="email"
                                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Min. 6 characters"
                                    required
                                    minLength={6}
                                    autoComplete="new-password"
                                    className="w-full pl-10 pr-10 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                                Confirm password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    placeholder="Repeat your password"
                                    required
                                    autoComplete="new-password"
                                    className="w-full pl-10 pr-10 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                                >
                                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed pt-1">
                            By creating an account you agree to our{' '}
                            <Link href="/terms" className="text-indigo-600 dark:text-indigo-400 hover:underline">Terms</Link>
                            {' '}and{' '}
                            <Link href="/privacy" className="text-indigo-600 dark:text-indigo-400 hover:underline">Privacy Policy</Link>.
                        </p>

                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-semibold rounded-xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating account…
                                </>
                            ) : (
                                <>
                                    Create account
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-7">
                        Already have an account?{' '}
                        <Link href="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
