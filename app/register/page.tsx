'use client';

import Link from 'next/link';
import { ArrowLeft, Building2, GraduationCap, Mail, User, Lock, ArrowRight } from 'lucide-react';
import dynamic from 'next/dynamic';
import 'katex/dist/katex.min.css';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const BlockMath = dynamic(() => import('react-katex').then((mod) => mod.BlockMath), { ssr: false });

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        university: '',
        agreeTerms: false
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (step < 2) {
            setStep(step + 1);
        } else {
            // Registration complete, redirect to onboarding
            router.push('/onboarding/welcome');
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-white dark:bg-black transition-colors duration-300">
            {/* LEFT SIDE: Branding */}
            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 relative overflow-hidden flex-col justify-between p-12 text-white">
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                </div>

                <div className="absolute top-1/4 right-20 opacity-20 rotate-12 scale-125 pointer-events-none">
                    <BlockMath math="\nabla \times \vec{E} = -\frac{\partial \vec{B}}{\partial t}" />
                </div>
                <div className="absolute bottom-1/3 left-20 opacity-20 -rotate-6 scale-125 pointer-events-none">
                    <BlockMath math="\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}" />
                </div>

                <div className="relative z-10">
                    <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-8">
                        <ArrowLeft className="w-4 h-4" /> Back to Qmath
                    </Link>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Join 10,000+ Students</h1>
                    <p className="text-white/80 text-lg">Start mastering engineering mathematics today.</p>
                </div>

                <div className="relative z-10 space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-center">
                            <div className="text-3xl font-bold">50K+</div>
                            <div className="text-xs text-white/60 uppercase tracking-wider mt-1">Questions</div>
                        </div>
                        <div className="p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-center">
                            <div className="text-3xl font-bold">95%</div>
                            <div className="text-xs text-white/60 uppercase tracking-wider mt-1">Pass Rate</div>
                        </div>
                        <div className="p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-center">
                            <div className="text-3xl font-bold">4.9★</div>
                            <div className="text-xs text-white/60 uppercase tracking-wider mt-1">Rating</div>
                        </div>
                    </div>
                    <p className="text-xs text-white/40 uppercase tracking-widest pl-1">© 2026 Qmath EdTech AB</p>
                </div>
            </div>

            {/* RIGHT SIDE: Registration Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-zinc-50 dark:bg-black">
                <div className="max-w-md w-full space-y-8">
                    {/* Progress Steps */}
                    <div className="flex items-center justify-center gap-4 mb-8">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
                            1
                        </div>
                        <div className={`w-16 h-1 rounded-full transition-all ${step >= 2 ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-800'}`}></div>
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
                            2
                        </div>
                    </div>

                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">
                            {step === 1 ? 'Create your account' : 'Complete your profile'}
                        </h2>
                        <p className="text-zinc-500 mt-2">
                            {step === 1 ? 'Start your learning journey' : 'Tell us about yourself'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {step === 1 ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                                        <input
                                            type="email"
                                            placeholder="name@university.edu"
                                            required
                                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                                        <input
                                            type="password"
                                            placeholder="At least 8 characters"
                                            required
                                            minLength={8}
                                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Confirm Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                                        <input
                                            type="password"
                                            placeholder="Confirm your password"
                                            required
                                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">First Name</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                                            <input
                                                type="text"
                                                placeholder="John"
                                                required
                                                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                value={formData.firstName}
                                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Last Name</label>
                                        <input
                                            type="text"
                                            placeholder="Doe"
                                            required
                                            className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">University</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                                        <select
                                            required
                                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                                            value={formData.university}
                                            onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                                        >
                                            <option value="">Select your university</option>
                                            <option value="kth">KTH Royal Institute of Technology</option>
                                            <option value="chalmers">Chalmers University of Technology</option>
                                            <option value="lund">Lund University</option>
                                            <option value="stockholm">Stockholm University</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <label className="flex items-start gap-3 p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
                                    <input
                                        type="checkbox"
                                        required
                                        className="mt-0.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                                        checked={formData.agreeTerms}
                                        onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                                    />
                                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                        I agree to the <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link> and{' '}
                                        <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
                                    </span>
                                </label>
                            </>
                        )}

                        <button
                            type="submit"
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            {step === 1 ? 'Continue' : 'Create Account'}
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </form>

                    <div className="text-center pt-4">
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Already have an account?{' '}
                            <Link href="/login" className="text-blue-600 font-bold hover:underline">
                                Log in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
