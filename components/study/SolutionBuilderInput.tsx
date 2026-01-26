'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Lightbulb } from 'lucide-react';
import { MathRenderer } from './MathRenderer';

interface SolutionStep {
    id: string;
    operation: string;
    operationLabel: string;
    value?: string;
    resultEquation: string;
    hint?: string;
}

interface SolutionBuilderQuestion {
    id: string;
    type: 'solution_builder';
    topicId: string;
    difficulty: number;
    content: {
        question: {
            text: string;
            math?: string;
        };
        initialEquation: string;
        steps: SolutionStep[];
        availableOperations: Array<{
            id: string;
            label: string;
            requiresValue: boolean;
            valuePlaceholder?: string;
        }>;
    };
    correctAnswer?: string;
    helps?: any;
    aiContext?: any;
}

interface SolutionBuilderInputProps {
    question: SolutionBuilderQuestion;
    onAnswer: (isCorrect: boolean) => void;
}

export function SolutionBuilderInput({ question, onAnswer }: SolutionBuilderInputProps) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [currentEquation, setCurrentEquation] = useState(question.content.initialEquation);
    const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
    const [operationValue, setOperationValue] = useState('');
    const [stepFeedback, setStepFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
    const [completedSteps, setCompletedSteps] = useState<Array<{ operation: string; result: string; correct: boolean }>>([]);
    const [showHint, setShowHint] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    const steps = question.content.steps;
    const currentStep = steps[currentStepIndex];
    const operations = question.content.availableOperations;

    const handleSubmitStep = () => {
        if (!selectedOperation) return;

        const expectedStep = currentStep;
        const selectedOp = operations.find(op => op.id === selectedOperation);

        // Check if operation matches
        const operationMatches = selectedOperation === expectedStep.operation;

        // Check if value matches (if required)
        let valueMatches = true;
        if (selectedOp?.requiresValue && expectedStep.value) {
            valueMatches = operationValue.trim().toLowerCase() === expectedStep.value.toLowerCase();
        }

        const isCorrect = operationMatches && valueMatches;

        if (isCorrect) {
            setStepFeedback({ isCorrect: true, message: 'Correct step!' });
            setCompletedSteps(prev => [...prev, {
                operation: selectedOp?.label || selectedOperation,
                result: expectedStep.resultEquation,
                correct: true
            }]);
            setCurrentEquation(expectedStep.resultEquation);

            // Move to next step after delay
            setTimeout(() => {
                setStepFeedback(null);
                setSelectedOperation(null);
                setOperationValue('');
                setShowHint(false);

                if (currentStepIndex < steps.length - 1) {
                    setCurrentStepIndex(prev => prev + 1);
                } else {
                    setIsComplete(true);
                    onAnswer(true);
                }
            }, 1000);
        } else {
            setStepFeedback({
                isCorrect: false,
                message: !operationMatches
                    ? 'That\'s not the right operation for this step. Try again!'
                    : 'The value isn\'t quite right. Check your calculation.'
            });
            setCompletedSteps(prev => [...prev, {
                operation: selectedOp?.label || selectedOperation,
                result: '?',
                correct: false
            }]);
        }
    };

    const handleReset = () => {
        setCurrentStepIndex(0);
        setCurrentEquation(question.content.initialEquation);
        setSelectedOperation(null);
        setOperationValue('');
        setStepFeedback(null);
        setCompletedSteps([]);
        setShowHint(false);
        setIsComplete(false);
    };

    if (isComplete) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center p-8 bg-green-50 dark:bg-green-500/10 rounded-2xl border border-green-200 dark:border-green-500/30"
            >
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-700 dark:text-green-300 mb-2">
                    Solution Complete!
                </h3>
                <p className="text-green-600 dark:text-green-400 mb-4">
                    You successfully solved the equation step by step.
                </p>
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl mb-4">
                    <MathRenderer text={currentEquation} block />
                </div>
            </motion.div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Question */}
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                    {question.content.question.text}
                </h2>
                {question.content.question.math && (
                    <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl inline-block">
                        <MathRenderer text={question.content.question.math} block />
                    </div>
                )}
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2 mb-6">
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Step {currentStepIndex + 1} of {steps.length}
                </span>
                <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentStepIndex) / steps.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Current Equation State */}
            <div className="p-6 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-500/10 dark:to-purple-500/10 rounded-2xl border border-violet-200 dark:border-violet-500/30 mb-6">
                <div className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-2">
                    Current State
                </div>
                <div className="text-2xl text-center">
                    <MathRenderer text={currentEquation} block />
                </div>
            </div>

            {/* Completed Steps History */}
            {completedSteps.length > 0 && (
                <div className="mb-6 space-y-2">
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                        Your Steps
                    </div>
                    {completedSteps.map((step, idx) => (
                        <div
                            key={idx}
                            className={`flex items-center gap-3 p-3 rounded-xl text-sm ${step.correct
                                ? 'bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30'
                                : 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30'
                                }`}
                        >
                            {step.correct ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                            ) : (
                                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            )}
                            <span className={step.correct ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                                {step.operation}
                            </span>
                            {step.correct && (
                                <>
                                    <ArrowRight className="w-4 h-4 text-zinc-400" />
                                    <span className="font-mono text-zinc-600 dark:text-zinc-400">{step.result}</span>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Operation Selection */}
            <div className="mb-4">
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
                    Choose Your Next Operation
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {operations.map((op) => (
                        <motion.button
                            key={op.id}
                            onClick={() => {
                                setSelectedOperation(op.id);
                                setStepFeedback(null);
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`p-3 rounded-xl text-left transition-all border-2 ${selectedOperation === op.id
                                ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300'
                                : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-600'
                                }`}
                        >
                            <span className="font-medium">{op.label}</span>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Value Input (if required) */}
            <AnimatePresence>
                {selectedOperation && operations.find(op => op.id === selectedOperation)?.requiresValue && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4"
                    >
                        <input
                            type="text"
                            value={operationValue}
                            onChange={(e) => setOperationValue(e.target.value)}
                            placeholder={operations.find(op => op.id === selectedOperation)?.valuePlaceholder || 'Enter value...'}
                            className="w-full px-4 py-3 text-lg font-mono rounded-xl border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Feedback */}
            <AnimatePresence>
                {stepFeedback && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`mb-4 p-4 rounded-xl flex items-start gap-3 ${stepFeedback.isCorrect
                            ? 'bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30'
                            : 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30'
                            }`}
                    >
                        {stepFeedback.isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={stepFeedback.isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                            {stepFeedback.message}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hint */}
            {currentStep.hint && (
                <div className="mb-4">
                    {!showHint ? (
                        <button
                            onClick={() => setShowHint(true)}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                        >
                            <Lightbulb className="w-4 h-4" />
                            Need a hint?
                        </button>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl text-sm text-blue-700 dark:text-blue-300"
                        >
                            💡 {currentStep.hint}
                        </motion.div>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
                <button
                    onClick={handleReset}
                    className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-2 transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                </button>
                <button
                    onClick={handleSubmitStep}
                    disabled={!selectedOperation}
                    className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white font-semibold rounded-xl transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    Apply Step
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
