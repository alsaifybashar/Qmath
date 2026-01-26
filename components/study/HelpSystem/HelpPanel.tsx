'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Lightbulb, BookOpen, ListOrdered, FileText, Bot,
    ChevronRight, CheckCircle, XCircle, RefreshCw
} from 'lucide-react';

interface HelpPanelProps {
    nudgeHint?: string;
    guidedHint?: string;
    stepBreakdown?: {
        intro: string;
        steps: Array<{
            prompt: string;
            correctAnswer: string;
            hint?: string;
        }>;
        conclusion: string;
    };
    workedExample?: {
        similarQuestion: string;
        solution: Array<{
            step: number;
            action: string;
            result: string;
            explanation?: string;
        }>;
    };
    relatedFormulas?: Array<{
        name: string;
        latex: string;
    }>;
    currentAttempts: number;
    onRequestAI: () => void;
    onHintRevealed?: (level: number) => void;
}

export function HelpPanel({
    nudgeHint,
    guidedHint,
    stepBreakdown,
    workedExample,
    relatedFormulas = [],
    currentAttempts,
    onRequestAI,
    onHintRevealed
}: HelpPanelProps) {
    const [revealedHints, setRevealedHints] = useState<number[]>([]);
    const [showSteps, setShowSteps] = useState(false);
    const [showExample, setShowExample] = useState(false);

    const revealHint = (level: number) => {
        if (!revealedHints.includes(level)) {
            setRevealedHints([...revealedHints, level]);
            onHintRevealed?.(level);
        }
    };

    const hasAttempted = currentAttempts > 0;

    return (
        <div className="space-y-3">
            {/* Help Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    Need Help?
                </h3>
                {currentAttempts > 0 && (
                    <span className="text-xs text-zinc-500">
                        Attempt {currentAttempts}
                    </span>
                )}
            </div>

            {/* Help Options Grid */}
            <div className="grid grid-cols-2 gap-2">
                {/* Hint Button */}
                <HelpButton
                    icon={<Lightbulb className="w-4 h-4" />}
                    label="Get Hint"
                    description={revealedHints.includes(1) ? "Hint revealed" : "Quick nudge"}
                    onClick={() => revealHint(1)}
                    active={revealedHints.includes(1)}
                    disabled={!nudgeHint}
                />

                {/* Formula Button */}
                <HelpButton
                    icon={<BookOpen className="w-4 h-4" />}
                    label="Formulas"
                    description={`${relatedFormulas.length} available`}
                    onClick={() => revealHint(2)}
                    active={revealedHints.includes(2)}
                    disabled={relatedFormulas.length === 0}
                />

                {/* Step Breakdown */}
                <HelpButton
                    icon={<ListOrdered className="w-4 h-4" />}
                    label="Break it Down"
                    description="Step-by-step"
                    onClick={() => {
                        setShowSteps(true);
                        onHintRevealed?.(3);
                    }}
                    disabled={!stepBreakdown || !hasAttempted}
                    locked={!hasAttempted && !!stepBreakdown}
                />

                {/* Worked Example */}
                <HelpButton
                    icon={<FileText className="w-4 h-4" />}
                    label="See Example"
                    description="Similar problem"
                    onClick={() => {
                        setShowExample(true);
                        onHintRevealed?.(4);
                    }}
                    disabled={!workedExample}
                />
            </div>

            {/* AI Tutor Button (Full Width) */}
            <button
                onClick={onRequestAI}
                className="w-full p-3 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30"
            >
                <Bot className="w-5 h-5" />
                <span className="font-semibold">Ask AI Tutor</span>
            </button>

            {/* Revealed Hints */}
            <AnimatePresence>
                {revealedHints.includes(1) && nudgeHint && (
                    <HintCard
                        key="hint-1"
                        level={1}
                        title="Hint"
                        content={nudgeHint}
                        icon={<Lightbulb className="w-4 h-4 text-yellow-500" />}
                    />
                )}

                {revealedHints.includes(2) && guidedHint && (
                    <HintCard
                        key="hint-2"
                        level={2}
                        title="Guided Hint"
                        content={guidedHint}
                        icon={<Lightbulb className="w-4 h-4 text-orange-500" />}
                    />
                )}
            </AnimatePresence>

            {/* Step Breakdown Modal */}
            <AnimatePresence>
                {showSteps && stepBreakdown && (
                    <StepBreakdownPanel
                        breakdown={stepBreakdown}
                        onClose={() => setShowSteps(false)}
                    />
                )}
            </AnimatePresence>

            {/* Worked Example Modal */}
            <AnimatePresence>
                {showExample && workedExample && (
                    <WorkedExamplePanel
                        example={workedExample}
                        onClose={() => setShowExample(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

interface HelpButtonProps {
    icon: React.ReactNode;
    label: string;
    description: string;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    locked?: boolean;
}

function HelpButton({ icon, label, description, onClick, active, disabled, locked }: HelpButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`p-3 rounded-xl text-left transition-all ${active
                ? 'bg-violet-100 dark:bg-violet-500/20 border-2 border-violet-300 dark:border-violet-500/50'
                : disabled
                    ? 'bg-zinc-100 dark:bg-zinc-800/50 opacity-50 cursor-not-allowed'
                    : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border-2 border-transparent'
                }`}
        >
            <div className="flex items-center gap-2 mb-1">
                <span className={active ? 'text-violet-600 dark:text-violet-400' : 'text-zinc-600 dark:text-zinc-400'}>
                    {icon}
                </span>
                <span className={`text-sm font-semibold ${active ? 'text-violet-700 dark:text-violet-300' : 'text-zinc-700 dark:text-zinc-300'
                    }`}>
                    {label}
                </span>
            </div>
            <p className="text-xs text-zinc-500">
                {locked ? '🔒 Try first' : description}
            </p>
        </button>
    );
}

interface HintCardProps {
    level: number;
    title: string;
    content: string;
    icon: React.ReactNode;
}

function HintCard({ level, title, content, icon }: HintCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/20"
        >
            <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-lg">
                    {icon}
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-100 mb-1">
                        {title}
                    </h4>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                        {content}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

interface StepBreakdownPanelProps {
    breakdown: {
        intro: string;
        steps: Array<{
            prompt: string;
            correctAnswer: string;
            hint?: string;
        }>;
        conclusion: string;
    };
    onClose: () => void;
}

function StepBreakdownPanel({ breakdown, onClose }: StepBreakdownPanelProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [stepAnswers, setStepAnswers] = useState<Record<number, string>>({});
    const [stepResults, setStepResults] = useState<Record<number, boolean>>({});

    const handleStepAnswer = (stepIndex: number, answer: string) => {
        setStepAnswers({ ...stepAnswers, [stepIndex]: answer });
    };

    const checkStep = (stepIndex: number) => {
        const step = breakdown.steps[stepIndex];
        const userAnswer = stepAnswers[stepIndex]?.toLowerCase().trim();
        const isCorrect = step.correctAnswer.toLowerCase().trim() === userAnswer;
        setStepResults({ ...stepResults, [stepIndex]: isCorrect });

        if (isCorrect && stepIndex < breakdown.steps.length - 1) {
            setTimeout(() => setCurrentStep(stepIndex + 1), 500);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        >
            <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <ListOrdered className="w-5 h-5 text-violet-500" />
                            Step-by-Step
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                        {breakdown.intro}
                    </p>
                </div>

                <div className="p-6 space-y-4">
                    {breakdown.steps.map((step, index) => (
                        <div
                            key={index}
                            className={`p-4 rounded-xl border-2 transition-all ${currentStep === index
                                ? 'border-violet-300 dark:border-violet-500 bg-violet-50 dark:bg-violet-500/10'
                                : stepResults[index] === true
                                    ? 'border-green-300 dark:border-green-500/50 bg-green-50 dark:bg-green-500/10'
                                    : 'border-zinc-200 dark:border-zinc-800 opacity-50'
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-6 h-6 rounded-full bg-violet-500 text-white text-xs font-bold flex items-center justify-center">
                                    {index + 1}
                                </span>
                                <span className="font-medium">{step.prompt}</span>
                                {stepResults[index] === true && (
                                    <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                                )}
                            </div>

                            {currentStep >= index && (
                                <div className="flex gap-2 mt-3">
                                    <input
                                        type="text"
                                        value={stepAnswers[index] || ''}
                                        onChange={(e) => handleStepAnswer(index, e.target.value)}
                                        placeholder="Your answer..."
                                        disabled={stepResults[index] === true}
                                        className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    />
                                    <button
                                        onClick={() => checkStep(index)}
                                        disabled={stepResults[index] === true}
                                        className="px-4 py-2 bg-violet-500 hover:bg-violet-600 disabled:bg-zinc-300 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Check
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    {Object.keys(stepResults).length === breakdown.steps.length && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-green-50 dark:bg-green-500/10 rounded-xl border border-green-200 dark:border-green-500/20"
                        >
                            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-semibold">{breakdown.conclusion}</span>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

interface WorkedExamplePanelProps {
    example: {
        similarQuestion: string;
        solution: Array<{
            step: number;
            action: string;
            result: string;
            explanation?: string;
        }>;
    };
    onClose: () => void;
}

function WorkedExamplePanel({ example, onClose }: WorkedExamplePanelProps) {
    const [currentStep, setCurrentStep] = useState(0);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        >
            <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-500" />
                            Worked Example
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                        Similar problem: <span className="font-medium">{example.similarQuestion}</span>
                    </p>
                </div>

                <div className="p-6 space-y-4">
                    {example.solution.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{
                                opacity: index <= currentStep ? 1 : 0.3,
                                x: 0
                            }}
                            transition={{ delay: index * 0.2 }}
                            className={`p-4 rounded-xl border ${index <= currentStep
                                ? 'border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10'
                                : 'border-zinc-200 dark:border-zinc-800'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                                    {step.step}
                                </span>
                                <div className="flex-1">
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                        {step.action}
                                    </p>
                                    <p className="font-mono text-lg mt-1 text-zinc-900 dark:text-white">
                                        {step.result}
                                    </p>
                                    {step.explanation && index <= currentStep && (
                                        <p className="text-xs text-zinc-500 mt-2 italic">
                                            💡 {step.explanation}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-between">
                    <button
                        onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                        disabled={currentStep === 0}
                        className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ← Previous
                    </button>
                    {currentStep < example.solution.length - 1 ? (
                        <button
                            onClick={() => setCurrentStep(currentStep + 1)}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            Next Step →
                        </button>
                    ) : (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            Got it! ✓
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
