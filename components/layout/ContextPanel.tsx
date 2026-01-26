'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Brain, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import dynamic from 'next/dynamic';

const BlockMath = dynamic(
    () => import('react-katex').then((mod) => mod.BlockMath),
    { ssr: false }
);

interface TopicInfo {
    name: string;
    mastery: number;
    questionsCompleted: number;
    totalQuestions: number;
}

interface SessionStats {
    correct: number;
    incorrect: number;
    timeSpent: number;
}

interface Formula {
    name: string;
    latex: string;
    explanation?: string;
}

interface ContextPanelProps {
    topic?: TopicInfo;
    relatedFormulas?: Formula[];
    sessionStats?: SessionStats;
    dueForReview?: number;
    weakAreas?: string[];
    aiComponent?: ReactNode;
}

export function ContextPanel({
    topic,
    relatedFormulas = [],
    sessionStats,
    dueForReview,
    weakAreas = [],
    aiComponent
}: ContextPanelProps) {
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="space-y-4">
            {/* Topic Progress */}
            {topic && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="w-4 h-4 text-violet-500" />
                        <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">
                            {topic.name}
                        </h3>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-500">Mastery</span>
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                {Math.round(topic.mastery * 100)}%
                            </span>
                        </div>
                        <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-violet-500 to-purple-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${topic.mastery * 100}%` }}
                            />
                        </div>
                        <p className="text-xs text-zinc-500">
                            {topic.questionsCompleted} / {topic.totalQuestions} questions
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Session Stats */}
            {sessionStats && (
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">
                            Session Stats
                        </h3>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 bg-green-50 dark:bg-green-500/10 rounded-lg">
                            <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                {sessionStats.correct}
                            </div>
                            <div className="text-xs text-green-600/70 dark:text-green-400/70">Correct</div>
                        </div>
                        <div className="p-2 bg-red-50 dark:bg-red-500/10 rounded-lg">
                            <div className="text-lg font-bold text-red-600 dark:text-red-400">
                                {sessionStats.incorrect}
                            </div>
                            <div className="text-xs text-red-600/70 dark:text-red-400/70">Wrong</div>
                        </div>
                        <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                {formatTime(sessionStats.timeSpent)}
                            </div>
                            <div className="text-xs text-blue-600/70 dark:text-blue-400/70">Time</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Related Formulas */}
            {relatedFormulas.length > 0 && (
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 mb-3">
                        <Brain className="w-4 h-4 text-amber-500" />
                        <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">
                            Related Formulas
                        </h3>
                    </div>

                    <div className="space-y-2">
                        {relatedFormulas.map((formula, idx) => (
                            <div key={idx} className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                                <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                                    {formula.name}
                                </div>
                                <div className="text-sm overflow-x-auto">
                                    <BlockMath math={formula.latex} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Weak Areas */}
            {weakAreas.length > 0 && (
                <div className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/30">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <h3 className="font-semibold text-sm text-amber-800 dark:text-amber-200">
                            Areas to Review
                        </h3>
                    </div>

                    <div className="flex flex-wrap gap-1">
                        {weakAreas.map((area, idx) => (
                            <span
                                key={idx}
                                className="px-2 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs rounded-full"
                            >
                                {area}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* AI Component Slot */}
            {aiComponent}
        </div>
    );
}
