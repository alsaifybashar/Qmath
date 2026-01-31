'use client';

import { X, LogIn, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface LoginPromptModalProps {
    onClose: () => void;
}

export default function LoginPromptModal({ onClose }: LoginPromptModalProps) {
    const pathname = usePathname();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-zinc-200 dark:border-zinc-800">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="text-center">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LogIn className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>

                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                        Login Required
                    </h2>

                    <p className="text-zinc-600 dark:text-zinc-400 mb-8">
                        You need to be logged in to download exam files. Please log in or create a free account to continue.
                    </p>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <Link
                            href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
                            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
                        >
                            <LogIn className="w-5 h-5" />
                            Log in to download
                        </Link>

                        <Link
                            href={`/register?callbackUrl=${encodeURIComponent(pathname)}`}
                            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-semibold rounded-xl transition-colors"
                        >
                            <UserPlus className="w-5 h-5" />
                            Create free account
                        </Link>
                    </div>

                    <button
                        onClick={onClose}
                        className="mt-6 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                    >
                        Maybe later
                    </button>
                </div>
            </div>
        </div>
    );
}
