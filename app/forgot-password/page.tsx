'use client';

import Link from 'next/link';
import { ArrowLeft, Mail, CheckCircle2, Loader2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import { forgotPassword } from '@/app/actions/auth';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const formData = new FormData();
        formData.append('email', email);

        startTransition(async () => {
            const result = await forgotPassword(null, formData);
            if (result?.error) {
                setError(result.error);
            } else {
                setSubmitted(true);
            }
        });
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 text-center"
                >
                    <div className="inline-flex p-4 bg-green-100 dark:bg-green-500/10 rounded-full mb-6">
                        <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h1 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-white">Kolla din e-post</h1>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                        Vi har skickat instruktioner för återställning av lösenord till <strong>{email}</strong>
                    </p>
                    <p className="text-sm text-zinc-500 mb-8">
                        Fick du inte mailet? Kolla din skräppost eller försök igen.
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={() => setSubmitted(false)}
                            className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl font-medium transition-all text-zinc-900 dark:text-white"
                        >
                            Försök igen
                        </button>
                        <Link
                            href="/login"
                            className="block w-full py-3 text-blue-600 hover:underline font-medium"
                        >
                            Tillbaka till inloggning
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full"
            >
                {/* Back link */}
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Tillbaka till inloggning
                </Link>

                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex p-4 bg-blue-100 dark:bg-blue-500/10 rounded-full mb-4">
                            <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Glömt lösenord?</h1>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Inga problem, vi skickar instruktioner för återställning.
                        </p>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-xl">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                E-postadress
                            </label>
                            <input
                                type="email"
                                required
                                placeholder="namn@universitet.se"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Skickar...
                                </>
                            ) : (
                                'Återställ lösenord'
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-zinc-500 text-sm mt-6">
                    Kommer du ihåg ditt lösenord?{' '}
                    <Link href="/login" className="text-blue-600 hover:underline font-medium">
                        Logga in
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
