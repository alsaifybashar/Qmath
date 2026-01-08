'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Trophy, ArrowRight, Lightbulb } from 'lucide-react';
import { GuidedStepQuestion, GuidedStep } from '@/types/study';
import { MultipleChoiceInput } from './MultipleChoiceInput';
import { NumericInput } from './NumericInput';
import { MathRenderer } from './MathRenderer';

interface GuidedStepSessionProps {
    question: GuidedStepQuestion;
    onComplete: (isCorrect: boolean) => void;
    onExit: () => void;
}

export function GuidedStepSession({ question, onComplete, onExit }: GuidedStepSessionProps) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [stepResults, setStepResults] = useState<boolean[]>(new Array(question.steps.length).fill(false));
    const [showSummary, setShowSummary] = useState(false);

    // Scroll to top when step changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentStepIndex, showSummary]);

    // We treat the overall problem as "completed" when all steps are done.

    const currentStep = question.steps[currentStepIndex];
    const progress = ((currentStepIndex) / question.steps.length) * 100;

    const handleStepComplete = (isCorrect: boolean) => {
        // Update result for this step
        const newResults = [...stepResults];
        newResults[currentStepIndex] = isCorrect;
        setStepResults(newResults);

        if (isCorrect) {
            // Wait a moment then go to next step
            setTimeout(() => {
                if (currentStepIndex < question.steps.length - 1) {
                    setCurrentStepIndex(prev => prev + 1);
                } else {
                    setShowSummary(true);
                }
            }, 1000);
        }
    };

    if (showSummary) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-zinc-900 border border-zinc-800 rounded-3xl text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                >
                    <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6" />
                    <h2 className="text-3xl font-bold text-white mb-2">{question.summary?.title || "Problem Complete!"}</h2>
                    <div className="text-xl text-zinc-300 mb-8 max-w-lg">
                        <MathRenderer text={question.summary?.finalAnswer || "Great job!"} block />
                    </div>

                    <div className="space-y-3 mb-8 text-left w-full max-w-md mx-auto">
                        {question.steps.map((step, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                                <span className="text-zinc-400 text-sm">Step {idx + 1}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-zinc-200 text-sm truncate max-w-[150px]">{step.instruction}</span>
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => onComplete(true)}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 mx-auto"
                    >
                        Continue <ArrowRight className="w-5 h-5" />
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto">
            {/* Header / Nav */}
            <div className="flex items-center justify-between mb-6">
                <button onClick={onExit} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                </button>
                <div className="text-sm font-medium text-zinc-400">
                    Step {currentStepIndex + 1} of {question.steps.length}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-zinc-800 rounded-full mb-8 overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    initial={{ width: `${((currentStepIndex) / question.steps.length) * 100}%` }}
                    animate={{ width: `${((currentStepIndex + 1) / question.steps.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>

            <div className="grid md:grid-cols-2 gap-8 lg:gap-12 flex-1">
                {/* Left Column: Context & History */}
                <div className="space-y-6">
                    {/* Problem Statement (Always visible) */}
                    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Problem</h3>
                        <div className="text-lg text-zinc-100 mb-2">{question.problem.title}</div>
                        <div className="text-zinc-400 text-sm leading-relaxed mb-4">
                            {question.problem.statement}
                        </div>
                        {question.problem.math && (
                            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800/50">
                                <MathRenderer text={question.problem.math} block />
                            </div>
                        )}
                    </div>

                    {/* Previous Step Context (The "Accumulated Work") */}
                    <AnimatePresence mode="popLayout">
                        {currentStep.context && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-5 bg-blue-900/10 border border-blue-500/20 rounded-2xl relative"
                            >
                                <div className="absolute -left-3 top-6 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-4 border-black">
                                    <ArrowRight className="w-3 h-3 text-white" />
                                </div>
                                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 pl-2">Current Context</h3>
                                <div className="pl-2 text-zinc-200">
                                    <MathRenderer text={currentStep.context} />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Column: Active Step Interaction */}
                <div className="flex flex-col">
                    <motion.div
                        key={currentStep.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl flex-1 flex flex-col"
                    >
                        <div className="mb-6">
                            <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                                {currentStep.instruction}
                            </h2>
                            <p className="text-zinc-600 dark:text-zinc-400">
                                {currentStep.question}
                            </p>
                        </div>

                        <div className="flex-1">
                            {/* Render appropriate input based on step type */}
                            {currentStep.inputType === 'multiple_choice' && currentStep.multipleChoiceConfig && (
                                <MultipleChoiceInput
                                    question={{
                                        ...currentStep.multipleChoiceConfig,
                                        id: currentStep.id, // temp ID mapping
                                        type: 'multiple_choice',
                                        topicId: 'step',
                                        difficulty: 1,
                                    }}
                                    onAnswer={(id, isCorrect) => handleStepComplete(isCorrect)}
                                />
                            )}

                            {currentStep.inputType === 'numeric_input' && currentStep.numericInputConfig && (
                                <NumericInput
                                    question={{
                                        ...currentStep.numericInputConfig,
                                        id: currentStep.id,
                                        type: 'numeric_input',
                                        topicId: 'step',
                                        difficulty: 1
                                    }}
                                    onAnswer={(val, isCorrect) => handleStepComplete(isCorrect)}
                                />
                            )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                            {currentStep.feedback?.hint && !stepResults[currentStepIndex] && (
                                <button
                                    onClick={() => {
                                        // Simple hint reveal - in production this might track hint usage
                                        const hintEl = document.getElementById(`hint-${currentStep.id}`);
                                        if (hintEl) hintEl.classList.toggle('hidden');
                                    }}
                                    className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
                                >
                                    <Lightbulb className="w-3 h-3" /> Need a hint?
                                </button>
                            )}
                            <div id={`hint-${currentStep.id}`} className="hidden mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-900 dark:text-blue-100">
                                💡 {currentStep.feedback?.hint || "Think about the definition carefully."}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
