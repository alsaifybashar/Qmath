'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Target, ArrowRight, Brain } from 'lucide-react';
import { motionDuration } from '@/lib/motion';

interface CalibrationPromptProps {
    totalQuestions: number;
    topicTitle?: string;
    onSubmitPrediction: (predicted: number) => void;
    onSkip?: () => void;
}

/**
 * Calibration Prompt — Pre-session prediction
 *
 * Before each study session, asks students to predict their score.
 * After completion, shows predicted vs. actual.
 *
 * Research: metacognitive calibration reduces overconfidence and
 * improves learning outcomes. Students who predict-then-compare
 * develop better self-assessment skills.
 */
export function CalibrationPrompt({
    totalQuestions,
    topicTitle,
    onSubmitPrediction,
    onSkip,
}: CalibrationPromptProps) {
    const [predicted, setPredicted] = useState(Math.round(totalQuestions / 2));
    const reduceMotion = useReducedMotion();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduceMotion ? 0 : motionDuration.correct }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md mx-auto"
        >
            <div className="text-center mb-6">
                <div className="inline-flex p-3 bg-purple-50 dark:bg-purple-500/10 rounded-full mb-3">
                    <Target className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
                    Hur tror du att det går?
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {topicTitle
                        ? `Du ska öva ${totalQuestions} frågor om ${topicTitle}.`
                        : `Du ska öva ${totalQuestions} frågor.`
                    }
                    {' '}Hur många tror du att du klarar?
                </p>
            </div>

            {/* Prediction slider */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-zinc-400">0</span>
                    <div className="text-center">
                        <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                            {predicted}
                        </span>
                        <span className="text-sm text-zinc-400 ml-1">
                            av {totalQuestions}
                        </span>
                    </div>
                    <span className="text-xs text-zinc-400">{totalQuestions}</span>
                </div>
                <input
                    type="range"
                    min={0}
                    max={totalQuestions}
                    value={predicted}
                    onChange={(e) => setPredicted(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between mt-2 text-xs text-zinc-400">
                    <span>Osäker</span>
                    <span>Helt säker</span>
                </div>
            </div>

            {/* Buttons */}
            <div className="space-y-2">
                <button
                    onClick={() => onSubmitPrediction(predicted)}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                    Starta övningen
                    <ArrowRight className="w-4 h-4" />
                </button>
                {onSkip && (
                    <button
                        onClick={onSkip}
                        className="w-full py-2 text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
                    >
                        Nästa
                    </button>
                )}
            </div>

            <p className="text-xs text-zinc-500 text-center mt-4 flex items-center justify-center gap-1">
                <Brain className="w-3 h-3" />
                Detta förbättrar din självbedömning över tid
            </p>
        </motion.div>
    );
}
