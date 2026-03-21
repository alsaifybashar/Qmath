"use client";

import React, { useState, useEffect } from 'react';
import { AIPanel } from '@/components/ai/AIPanel';
import { Brain, Activity, Sun, Moon } from 'lucide-react';

export default function TestAIPanelPage() {
    const [isOpen, setIsOpen] = useState(true);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    // Apply theme class to document
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col font-sans overflow-hidden h-screen transition-colors duration-500">
            {/* Ambient Background Effects */}
            <div className="ambient-bg">
                <div className="ambient-orb ambient-orb-1" />
                <div className="ambient-orb ambient-orb-2" />
                <div className="ambient-orb ambient-orb-3" />
            </div>

            {/* Header */}
            <header className="flex-none h-16 border-b border-[var(--glass-border)] glass-panel flex items-center px-6 justify-between z-10 relative">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-500 to-violet-500 p-2 rounded-xl shadow-lg shadow-violet-500/20 animate-soft-pulse">
                        <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-semibold text-[var(--foreground)] text-lg">
                            Qmath AI Tutor
                        </h1>
                        <p className="text-xs text-[var(--foreground-subtle)]">
                            Explore mathematics — ask anything
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-panel hover:bg-[var(--surface-hover)] transition-all duration-300 group"
                        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    >
                        {theme === 'dark' ? (
                            <>
                                <Sun className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                                <span className="text-sm text-[var(--foreground-muted)] hidden sm:inline">Light</span>
                            </>
                        ) : (
                            <>
                                <Moon className="w-4 h-4 text-violet-500 group-hover:scale-110 transition-transform" />
                                <span className="text-sm text-[var(--foreground-muted)] hidden sm:inline">Dark</span>
                            </>
                        )}
                    </button>

                    {/* Status Indicator */}
                    <div className="flex items-center gap-2 text-sm text-[var(--foreground-subtle)]">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span className="hidden sm:inline">Engine Active</span>
                    </div>
                </div>
            </header>

            {/* Main Workspace */}
            <main className="flex-1 w-full h-full relative overflow-hidden">
                {/* Subtle mesh gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] via-transparent to-purple-500/[0.03] pointer-events-none" />

                <div className="relative w-full h-full z-10">
                    <AIPanel
                        isOpen={isOpen}
                        onToggle={() => setIsOpen(!isOpen)}
                        position="fullscreen"
                        context={{
                            currentPage: 'study',
                            mode: 'explore',
                            student: { masteryLevel: 0.5, recentPerformance: 'learning' },
                            recentConcepts: ['Derivatives', 'Matrix Transformations', 'Eigenvalues', 'Taylor Series']
                        }}
                    />
                </div>
            </main>
        </div>
    );
}
