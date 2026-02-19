'use client';

import { motion } from 'framer-motion';
import { Target, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';

interface CalibrationResultsProps {
    predictedScore: number;
    actualScore: number;
    totalQuestions: number;
    onContinue: () => void;
}

/**
 * Calibration Results — Post-session comparison
 *
 * Shows predicted vs. actual score to build metacognitive awareness.
 * Research shows this reduces overconfidence and improves future predictions.
 */
export function CalibrationResults({
    predictedScore,
    actualScore,
    totalQuestions,
    onContinue,
}: CalibrationResultsProps) {
    const difference = actualScore - predictedScore;
    const isOverconfident = difference < -1;
    const isUnderconfident = difference > 1;
    const isCalibrated = Math.abs(difference) <= 1;

    const predictedPercent = Math.round((predictedScore / totalQuestions) * 100);
    const actualPercent = Math.round((actualScore / totalQuestions) * 100);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md mx-auto"
        >
            <div className="text-center mb-6">
                <div className={`inline-flex p-3 rounded-full mb-3 ${
                    isCalibrated
                        ? 'bg-green-50 dark:bg-green-500/10'
                        : 'bg-amber-50 dark:bg-amber-500/10'
                }`}>
                    <Target className={`w-6 h-6 ${
                        isCalibrated ? 'text-green-500' : 'text-amber-500'
                    }`} />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
                    Kalibrering
                </h3>
            </div>

            {/* Comparison bars */}
            <div className="space-y-4 mb-6">
                {/* Predicted */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-zinc-500">Din gissning</span>
                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                            {predictedScore} / {totalQuestions}
                        </span>
                    </div>
                    <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${predictedPercent}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full bg-purple-400 dark:bg-purple-500 rounded-full"
                        />
                    </div>
                </div>

                {/* Actual */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-zinc-500">Faktiskt resultat</span>
                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                            {actualScore} / {totalQuestions}
                        </span>
                    </div>
                    <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${actualPercent}%` }}
                            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                            className={`h-full rounded-full ${
                                actualScore >= predictedScore
                                    ? 'bg-green-400 dark:bg-green-500'
                                    : 'bg-amber-400 dark:bg-amber-500'
                            }`}
                        />
                    </div>
                </div>
            </div>

            {/* Insight message */}
            <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className={`p-4 rounded-xl mb-6 ${
                    isCalibrated
                        ? 'bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/15'
                        : isOverconfident
                        ? 'bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/15'
                        : 'bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/15'
                }`}
            >
                <div className="flex items-start gap-3">
                    {isCalibrated ? (
                        <Minus className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                    ) : isOverconfident ? (
                        <TrendingDown className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                    ) : (
                        <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                    )}
                    <div>
                        <p className={`text-sm font-medium ${
                            isCalibrated ? 'text-green-800 dark:text-green-300'
                            : isOverconfident ? 'text-amber-800 dark:text-amber-300'
                            : 'text-blue-800 dark:text-blue-300'
                        }`}>
                            {isCalibrated
                                ? 'Bra kalibrering!'
                                : isOverconfident
                                ? 'Du överskattade lite'
                                : 'Du underskattade dig själv!'
                            }
                        </p>
                        <p className={`text-xs mt-1 ${
                            isCalibrated ? 'text-green-700 dark:text-green-400'
                            : isOverconfident ? 'text-amber-700 dark:text-amber-400'
                            : 'text-blue-700 dark:text-blue-400'
                        }`}>
                            {isCalibrated
                                ? 'Din självbedömning var nära. Det tyder på bra metakognition!'
                                : isOverconfident
                                ? 'Många studenter överskattar sina kunskaper. Medvetenhet om detta förbättrar studierna.'
                                : 'Du kan mer än du tror! Mer självförtroende kan hjälpa dig prestera ännu bättre.'
                            }
                        </p>
                    </div>
                </div>
            </motion.div>

            <button
                onClick={onContinue}
                className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2"
            >
                Fortsätt
                <ArrowRight className="w-4 h-4" />
            </button>
        </motion.div>
    );
}
