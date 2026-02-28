"use client";

import React, { useState } from 'react';
import { AIPanel } from '@/components/ai/AIPanel';
import { Brain, Activity } from 'lucide-react';

export default function TestAIPanelPage() {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans overflow-hidden h-screen">
            {/* Header */}
            <header className="flex-none h-16 border-b border-white/10 bg-slate-900/50 flex items-center px-6 justify-between backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="bg-violet-500/20 p-2 rounded-lg">
                        <Brain className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                        <h1 className="font-semibold text-white">Qmath AI Tutor</h1>
                        <p className="text-xs text-slate-400">Explore mathematics — ask anything</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        Engine Active
                    </div>
                </div>
            </header>

            {/* Main Workspace */}
            <main className="flex-1 w-full bg-slate-950 relative">
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
            </main>
        </div>
    );
}
