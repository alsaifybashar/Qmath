'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Sparkles, BookOpen } from 'lucide-react';
import dynamic from 'next/dynamic';

const InlineMath = dynamic(
    () => import('react-katex').then((mod) => mod.InlineMath),
    { ssr: false }
);

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

const levelConfig = {
    1: {
        icon: Lightbulb,
        label: 'Ledtråd',
        gradient: 'from-amber-500/10 to-orange-500/10',
        border: 'border-amber-200/60 dark:border-amber-500/20',
        iconColor: 'text-amber-500',
        textColor: 'text-amber-900 dark:text-amber-200',
        dots: 1,
    },
    2: {
        icon: BookOpen,
        label: 'Formel',
        gradient: 'from-blue-500/10 to-indigo-500/10',
        border: 'border-blue-200/60 dark:border-blue-500/20',
        iconColor: 'text-blue-500',
        textColor: 'text-blue-900 dark:text-blue-200',
        dots: 2,
    },
    3: {
        icon: Sparkles,
        label: 'Första steget',
        gradient: 'from-violet-500/10 to-purple-500/10',
        border: 'border-violet-200/60 dark:border-violet-500/20',
        iconColor: 'text-violet-500',
        textColor: 'text-violet-900 dark:text-violet-200',
        dots: 3,
    },
};

export function HintBubble({ hint, hintLevel, mathExpression, isVisible, onDismiss }: HintBubbleProps) {
    const config = levelConfig[hintLevel];
    const Icon = config.icon;

    return (
        <AnimatePresence>
            {isVisible && hint && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
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
                        <motion.div
                            initial={{ rotate: -10, scale: 0 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ type: 'spring', damping: 12, delay: 0.1 }}
                            className={`flex-shrink-0 mt-0.5 ${config.iconColor}`}
                        >
                            <Icon className="w-5 h-5" />
                        </motion.div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.15 }}
                                className={`text-sm leading-relaxed ${config.textColor}`}
                            >
                                {hint}
                            </motion.p>

                            {/* Math expression */}
                            {mathExpression && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="mt-3 p-3 bg-white/60 dark:bg-zinc-900/60 rounded-xl"
                                >
                                    <BlockMath math={mathExpression} />
                                </motion.div>
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
