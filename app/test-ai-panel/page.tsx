"use client";

import React, { useState } from 'react';
import { AIPanel } from '@/components/ai/AIPanel';
import { Sparkles, Brain, Code, Activity, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TestAIPanelPage() {
    const [isOpen, setIsOpen] = useState(true);
    const [activePrompt, setActivePrompt] = useState('');

    const suggestionPrompts = [
        { title: "Grid Multiplication", instruction: "Type 'visualize grid' in the chat to see the Matrix Widget." },
        { title: "Calculus Derivative", instruction: "Type 'calculus' to launch the Tangent Visualizer." },
        { title: "Linear Algebra", instruction: "Type 'algebra vectors' to see Interactive Vector Space." },
        { title: "Voice Mode", instruction: "Click the Mic icon and wait for the simulation to run." }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans overflow-hidden h-screen">
            {/* Header */}
            <header className="flex-none h-16 border-b border-white/10 bg-slate-900/50 flex items-center px-6 justify-between backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="bg-violet-500/20 p-2 rounded-lg">
                        <Brain className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                        <h1 className="font-semibold text-white">Qmath Generative UI Preview</h1>
                        <p className="text-xs text-slate-400">Testing AI-driven contextual widget rendering</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400" /> Engine Active</div>
                </div>
            </header>

            {/* Main Workspace (Full Screen Chat) */}
            <main className="flex-1 w-full bg-slate-950 relative">
                <AIPanel
                    isOpen={isOpen}
                    onToggle={() => setIsOpen(!isOpen)}
                    position="fullscreen"
                    context={{
                        currentPage: 'study',
                        student: { masteryLevel: 0.5, recentPerformance: 'learning' },
                        question: {
                            id: '1',
                            content: 'Mathematical Generative UI',
                            topic: 'Calculus & Algebra',
                            difficulty: 2
                        },
                        recentConcepts: ['Derivative of e^x', 'Chain Rule', 'Matrix Transformations']
                    }}
                />
            </main>
        </div>
    );
}

// Ensure icons used exist
import { LayoutGrid } from 'lucide-react';
