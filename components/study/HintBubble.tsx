'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Lightbulb, Sparkles, BookOpen } from 'lucide-react';
import dynamic from 'next/dynamic';
import { motionDuration } from '@/lib/motion';

const BlockMath = dynamic(
    () => import('react-katex').then((mod) => mod.BlockMath),
    { ssr: false }
);

interface HintBubbleProps {
    hint: string | null;
    hintLevel: 1 | 2 | 3;
    mathExpression?: string;
    isVisible: boolean;
    onDismiss?: () => void;
}

// Amber is reserved for the wrong-answer surface — hints stay informational.
// Level 1 → blue (a quiet question), Level 2 → indigo/violet bridge (a concept),
// Level 3 → violet (a worked first step). The gradient deepens with the rung.
const levelConfig = {
    1: {
        icon: Lightbulb,
        label: 'Ledtråd',
        gradient: 'from-blue-500/10 to-sky-500/10',
        border: 'border-blue-200/60 dark:border-blue-300/20',
        iconColor: 'text-blue-400',
        textColor: 'text-blue-900 dark:text-blue-100',
        dots: 1,
    },
    2: {
        icon: BookOpen,
        label: 'Formel',
        gradient: 'from-indigo-500/10 to-violet-500/10',
        border: 'border-indigo-200/60 dark:border-indigo-300/20',
        iconColor: 'text-indigo-400',
        textColor: 'text-indigo-900 dark:text-indigo-100',
        dots: 2,
    },
    3: {
        icon: Sparkles,
        label: 'Första steget',
        gradient: 'from-violet-500/10 to-purple-500/10',
        border: 'border-violet-200/60 dark:border-violet-300/20',
        iconColor: 'text-violet-400',
        textColor: 'text-violet-900 dark:text-violet-100',
        dots: 3,
    },
};

export function HintBubble({ hint, hintLevel, mathExpression, isVisible, onDismiss }: HintBubbleProps) {
    const config = levelConfig[hintLevel];
    const Icon = config.icon;
    const reduceMotion = useReducedMotion();

    return (
        <AnimatePresence>
            {isVisible && hint && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0 : motionDuration.correct }}
                    className={`relative w-full rounded-2xl border ${config.border} bg-gradient-to-br ${config.gradient} backdrop-blur-sm p-5 shadow-sm`}
                >
                    {/* Level indicator dots */}
                    <div className="absolute top-3 right-3 flex gap-1">
                        {[1, 2, 3].map((dot) => (
                            <div
                                key={dot}
                                className={`w-1.5 h-1.5 rounded-full transition-colors ${dot <= config.dots
                                    ? config.iconColor.replace('text-', 'bg-')
                                    : 'bg-zinc-300 dark:bg-zinc-600'
                                    }`}
                            />
                        ))}
                    </div>

                    <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`flex-shrink-0 mt-0.5 ${config.iconColor}`}>
                            <Icon className="w-5 h-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm leading-relaxed ${config.textColor}`}>
                                {hint}
                            </p>

                            {/* Math expression */}
                            {mathExpression && (
                                <div className="mt-3 p-3 bg-white/60 dark:bg-zinc-900/60 rounded-xl">
                                    <BlockMath math={mathExpression} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dismiss button - subtle */}
                    {onDismiss && (
                        <button
                            onClick={onDismiss}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 text-xs shadow-sm transition-colors"
                        >
                            ×
                        </button>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
