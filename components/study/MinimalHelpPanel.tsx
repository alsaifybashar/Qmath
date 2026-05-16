'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, BookOpen, Star, ChevronRight, CheckCircle } from 'lucide-react';
import dynamic from 'next/dynamic';

const BlockMath = dynamic(
    () => import('react-katex').then((mod) => mod.BlockMath),
    { ssr: false }
);

interface Formula {
    name: string;
    latex: string;
    explanation?: string;
}

interface MinimalHelpPanelProps {
    nudgeHint?: string;
    guidedHint?: string;
    relatedFormulas?: Formula[];
    onRequestAI?: () => void;
    onHintUsed?: (level: number) => void;
}

export function MinimalHelpPanel({
    nudgeHint,
    guidedHint,
    relatedFormulas = [],
    onRequestAI,
    onHintUsed
}: MinimalHelpPanelProps) {
    const [revealedSections, setRevealedSections] = useState<string[]>([]);

    const revealSection = (section: string, hintLevel?: number) => {
        if (!revealedSections.includes(section)) {
            setRevealedSections([...revealedSections, section]);
            if (hintLevel && onHintUsed) {
                onHintUsed(hintLevel);
            }
        }
    };

    const isRevealed = (section: string) => revealedSections.includes(section);

    return (
        <div className="space-y-4">
            {/* Quick Hint */}
            {nudgeHint && (
                <div className="space-y-2">
                    {!isRevealed('hint') ? (
                        <button
                            onClick={() => revealSection('hint', 1)}
                            className="w-full p-4 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 text-left hover:border-amber-300 dark:hover:border-amber-600 transition-colors group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
                                        <Lightbulb className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-zinc-900 dark:text-white">Få en ledtråd</div>
                                        <div className="text-xs text-zinc-500">En liten knuff i rätt riktning</div>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-amber-500 transition-colors" />
                            </div>
                        </button>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/30"
                        >
                            <div className="flex items-start gap-3">
                                <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5" />
                                <div>
                                    <div className="text-xs font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wide mb-1">
                                        Ledtråd
                                    </div>
                                    <p className="text-sm text-amber-800 dark:text-amber-200">
                                        {nudgeHint}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Guided Hint (deeper explanation) */}
            {guidedHint && isRevealed('hint') && (
                <div className="space-y-2">
                    {!isRevealed('guided') ? (
                        <button
                            onClick={() => revealSection('guided', 2)}
                            className="w-full p-4 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 text-left hover:border-orange-300 dark:hover:border-orange-600 transition-colors group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-50 dark:bg-orange-500/10 rounded-lg">
                                        <Lightbulb className="w-4 h-4 text-orange-500" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-zinc-900 dark:text-white">Mer Hjälp</div>
                                        <div className="text-xs text-zinc-500">Detaljerad vägledning</div>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-orange-500 transition-colors" />
                            </div>
                        </button>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-orange-50 dark:bg-orange-500/10 rounded-xl border border-orange-200 dark:border-orange-500/30"
                        >
                            <div className="flex items-start gap-3">
                                <Lightbulb className="w-4 h-4 text-orange-500 mt-0.5" />
                                <div>
                                    <div className="text-xs font-medium text-orange-700 dark:text-orange-300 uppercase tracking-wide mb-1">
                                        Detaljerad vägledning
                                    </div>
                                    <p className="text-sm text-orange-800 dark:text-orange-200">
                                        {guidedHint}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Related Formulas */}
            {relatedFormulas.length > 0 && (
                <div className="space-y-2">
                    {!isRevealed('formulas') ? (
                        <button
                            onClick={() => revealSection('formulas')}
                            className="w-full p-4 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 text-left hover:border-blue-300 dark:hover:border-blue-600 transition-colors group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                                        <BookOpen className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-zinc-900 dark:text-white">Relaterade formler</div>
                                        <div className="text-xs text-zinc-500">{relatedFormulas.length} formel{relatedFormulas.length > 1 ? 'r' : ''} tillgängliga</div>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-blue-500 transition-colors" />
                            </div>
                        </button>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/30 space-y-3"
                        >
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-blue-500" />
                                <div className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                                    Relaterade formler
                                </div>
                            </div>
                            {relatedFormulas.map((formula, idx) => (
                                <div key={idx} className="p-3 bg-white dark:bg-zinc-800 rounded-lg">
                                    <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                                        {formula.name}
                                    </div>
                                    <div className="overflow-x-auto">
                                        <BlockMath math={formula.latex} />
                                    </div>
                                    {formula.explanation && (
                                        <div className="text-xs text-zinc-500 mt-2">
                                            {formula.explanation}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </motion.div>
                    )}
                </div>
            )}

            {/* AI Tutor */}
            {onRequestAI && (
                <button
                    onClick={onRequestAI}
                    className="w-full p-4 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 rounded-xl text-white transition-all group"
                >
                    <div className="flex items-center justify-center gap-2">
                        <div className="relative">
                            <Star className="w-5 h-5 fill-current" />
                            <Star className="absolute -top-1 -right-1 w-2.5 h-2.5 fill-white/80 transition-all duration-700 group-hover:scale-125 group-hover:rotate-[-15deg]" />
                        </div>
                        <span className="font-medium">Fråga AI-handledare</span>
                    </div>
                </button>
            )}

            {/* Empty state */}
            {!nudgeHint && !guidedHint && relatedFormulas.length === 0 && !onRequestAI && (
                <div className="text-center py-8 text-zinc-400">
                    <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Ingen hjälp tillgänglig för denna fråga</p>
                </div>
            )}
        </div>
    );
}
