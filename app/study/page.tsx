'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Trophy, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { ThemeToggle } from '@/components/ThemeToggle';

// New Components
import { MultipleChoiceInput } from '@/components/study/MultipleChoiceInput';
import { NumericInput } from '@/components/study/NumericInput';
import { GuidedStepSession } from '@/components/study/GuidedStepSession';
import { FillBlankInput } from '@/components/study/FillBlankInput';
import { DragDropInput } from '@/components/study/DragDropInput';
import { ToggleInput } from '@/components/study/ToggleInput';
import { ExpressionBuilderInput } from '@/components/study/ExpressionBuilderInput';

// Types
import {
    QuestionType,
    MultipleChoiceQuestion,
    NumericInputQuestion,
    GuidedStepQuestion,
    FillBlankQuestion,
    DragDropQuestion,
    ToggleQuestion,
    ExpressionBuilderQuestion
} from '@/types/study';

// ============================================================================
// MOCK DATA (Brilliant Style Showcase)
// ============================================================================

type StudyQuestion =
    | MultipleChoiceQuestion
    | NumericInputQuestion
    | GuidedStepQuestion
    | FillBlankQuestion
    | DragDropQuestion
    | ToggleQuestion
    | ExpressionBuilderQuestion;

const SESSION_QUESTIONS: StudyQuestion[] = [
    {
        id: 'q1_guided',
        type: 'guided_steps',
        topicId: 'derivatives',
        difficulty: 5,
        problem: {
            title: "Product Rule Exploration",
            statement: "Let's break down the derivative of a product of functions.",
            math: "f(x) = x^3 \\cdot \\ln(x)"
        },
        steps: [
            {
                id: 's1',
                stepNumber: 1,
                instruction: "Identify the Rule",
                question: "Which differentiation rule applies here?",
                inputType: 'multiple_choice',
                multipleChoiceConfig: {
                    question: { text: "Choose the rule" },
                    correctOptionId: 'product',
                    options: [
                        { id: 'power', label: 'Power Rule', isCorrect: false },
                        { id: 'product', label: 'Product Rule', isCorrect: true, description: "(uv)' = u'v + uv'" },
                        { id: 'chain', label: 'Chain Rule', isCorrect: false }
                    ]
                },
                feedback: { correct: "Correct! We have a product.", incorrect: "It's a multiplication of two functions." }
            },
            {
                id: 's2',
                stepNumber: 2,
                instruction: "Differentiate u",
                question: "If u = x³, find u'.",
                context: "u = x^3, v = \\ln(x)",
                inputType: 'multiple_choice',
                multipleChoiceConfig: {
                    question: { text: "Select u'" },
                    correctOptionId: '3x2',
                    options: [
                        { id: '3x2', label: '3x²', isCorrect: true, formula: "3x^2" },
                        { id: 'x2', label: 'x²', isCorrect: false, formula: "x^2" }
                    ]
                },
                feedback: { correct: "Power rule applied.", incorrect: "Bring down the exponent." }
            },
            {
                id: 's3',
                stepNumber: 3,
                instruction: "Final Assembly",
                question: "Combine the parts to find f'(x).",
                context: "u'=3x^2, v=\\ln(x), u=x^3, v'=1/x",
                inputType: 'multiple_choice',
                multipleChoiceConfig: {
                    question: { text: "Select the final Answer" },
                    correctOptionId: 'ans',
                    options: [
                        { id: 'ans', label: 'Correct', isCorrect: true, formula: "3x^2\\ln(x) + x^2" },
                        { id: 'wrong', label: 'Incorrect', isCorrect: false, formula: "3x^2\\ln(x) + x" }
                    ]
                },
                feedback: { correct: "Excellent work.", incorrect: "Check the algebra." }
            }
        ],
        summary: { title: "Guided Problem Solved!", finalAnswer: "f'(x) = 3x^2\\ln(x) + x^2" }
    },
    {
        id: 'q_fill',
        type: 'fill_blank',
        topicId: 'trig',
        difficulty: 3,
        question: {
            text: "The derivative of {{0}} is {{1}}, and the derivative of {{2}} is {{3}}.",
            math: "\\frac{d}{dx}(\\sin x) = \\cos x, \\quad \\frac{d}{dx}(\\cos x) = -\\sin x"
        },
        blanks: [
            { id: 'b1', correctValues: ['sin(x)', 'sine', 'sin x'], placeholder: 'func' },
            { id: 'b2', correctValues: ['cos(x)', 'cosine', 'cos x'], placeholder: 'deriv' },
            { id: 'b3', correctValues: ['cos(x)', 'cosine', 'cos x'], placeholder: 'func' },
            { id: 'b4', correctValues: ['-sin(x)', '-sine', '-sin x'], placeholder: 'deriv' }
        ]
    },
    {
        id: 'q_drag',
        type: 'drag_drop',
        topicId: 'calculus',
        difficulty: 4,
        question: {
            text: "Order these functions by their growth rate as x → ∞ (Slowest to Fastest)."
        },
        items: [
            { id: 'ln', content: "\\ln(x)" }, // Slowest
            { id: 'x', content: "x" },
            { id: 'x2', content: "x^2" },
            { id: 'exp', content: "e^x" },
            { id: 'fact', content: "x!" } // Fastest
        ],
        correctOrder: ['ln', 'x', 'x2', 'exp', 'fact']
    },
    {
        id: 'q_toggle',
        type: 'toggle',
        topicId: 'number_theory',
        difficulty: 2,
        question: { text: "Select all the Prime Numbers below." },
        items: [
            { id: '2', label: '2', correctState: true },
            { id: '4', label: '4', correctState: false },
            { id: '9', label: '9', correctState: false },
            { id: '11', label: '11', correctState: true },
            { id: '15', label: '15', correctState: false },
            { id: '17', label: '17', correctState: true },
            { id: '21', label: '21', correctState: false },
            { id: '23', label: '23', correctState: true }
        ]
    },
    {
        id: 'q_express',
        type: 'expression_builder',
        topicId: 'algebra',
        difficulty: 4,
        question: { text: "Construct the Pythagorean Identity." },
        availableBlocks: [
            { id: 'sin', text: 'sin', value: '\\sin', type: 'function' },
            { id: 'cos', text: 'cos', value: '\\cos', type: 'function' },
            { id: 'x', text: 'x', value: 'x', type: 'variable' },
            { id: 'plus', text: '+', value: '+', type: 'operator' },
            { id: 'eq', text: '=', value: '=', type: 'operator' },
            { id: '1', text: '1', value: '1', type: 'number' },
            { id: 'sq', text: '² (sq)', value: '^2', type: 'operator' },
            { id: 'tan', text: 'tan', value: '\\tan', type: 'function' }
        ],
        correctExpression: "\\sin^2x+\\cos^2x=1", // Note: Normalization logic in component should handle basic spacing if implemented well.
        validationType: 'exact_match'
    },
    {
        id: 'q_numeric',
        type: 'numeric_input',
        topicId: 'arithmetic',
        difficulty: 1,
        question: {
            text: "Solve simple math to finish:",
            math: "12 - 5"
        },
        answer: { exact: 7, tolerance: 0 },
        inputConfig: { allowNegative: true, maxDigits: 2 }
    }
];

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function BrilliantStudySession() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isSessionComplete, setIsSessionComplete] = useState(false);
    const [xp, setXp] = useState(0);
    const [streak, setStreak] = useState(0);
    const [isNavigating, setIsNavigating] = useState(false);

    const activeQuestion = SESSION_QUESTIONS[currentIndex] || SESSION_QUESTIONS[SESSION_QUESTIONS.length - 1];

    const progress = ((currentIndex) / SESSION_QUESTIONS.length) * 100;

    const handleQuestionComplete = (isCorrect: boolean) => {
        if (isNavigating) return;
        setIsNavigating(true);

        if (isCorrect) {
            setXp(prev => prev + 10 + (activeQuestion.difficulty * 2));
            setStreak(prev => prev + 1);
        } else {
            setStreak(0);
        }

        setTimeout(() => {
            if (currentIndex < SESSION_QUESTIONS.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setIsNavigating(false);
            } else {
                setIsSessionComplete(true);
            }
        }, 1200);
    };

    if (isSessionComplete) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full text-center"
                >
                    <Trophy className="w-32 h-32 text-yellow-400 mx-auto mb-6" />
                    <h1 className="text-4xl font-bold mb-4">Mastery Achieved!</h1>
                    <p className="text-zinc-400 text-lg mb-8">You've explored all interaction types.</p>

                    <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 mb-8 grid grid-cols-2 gap-4">
                        <div className="p-4 bg-zinc-950 rounded-2xl">
                            <div className="text-3xl font-bold text-purple-400 mb-1">{xp}</div>
                            <div className="text-sm text-zinc-500 uppercase font-bold">XP Earned</div>
                        </div>
                        <div className="p-4 bg-zinc-950 rounded-2xl">
                            <div className="text-3xl font-bold text-orange-400 mb-1">{streak}</div>
                            <div className="text-sm text-zinc-500 uppercase font-bold">Streak</div>
                        </div>
                    </div>

                    <Link href="/dashboard" className="block w-full py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-zinc-200 transition-colors">
                        Return to Dashboard
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white transition-colors duration-300">
            {/* Top Bar */}
            <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
                <div className="flex items-center gap-3 sm:gap-4">
                    <Link
                        href="/dashboard"
                        className="p-2 -ml-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900"
                        aria-label="Exit to dashboard"
                    >
                        <X className="w-5 h-5" />
                    </Link>

                    {/* Progress with Label */}
                    <div className="flex flex-col gap-1.5">
                        <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400">
                            Question {currentIndex + 1} of {SESSION_QUESTIONS.length}
                        </div>
                        <div className="h-1.5 w-32 sm:w-40 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-emerald-500 to-blue-500"
                                initial={{ width: `${progress}%` }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                        </div>
                    </div>
                </div>

                {/* Topic Badge */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                        {activeQuestion.topicId.replace('_', ' ')}
                    </span>
                </div>

                {/* XP Counter */}
                <div className="flex items-center gap-2">
                    {streak > 0 && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="hidden sm:flex items-center gap-1 px-2 py-1 bg-orange-500/10 rounded-full border border-orange-500/20"
                        >
                            <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                                🔥 {streak}
                            </span>
                        </motion.div>
                    )}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 rounded-full border border-amber-500/20">
                        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400">{xp}</span>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="pt-24 pb-12 px-4 min-h-screen flex flex-col items-center justify-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeQuestion.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full max-w-5xl"
                    >
                        {/* RENDER LOGIC */}
                        {activeQuestion.type === 'guided_steps' && (
                            <GuidedStepSession
                                question={activeQuestion}
                                onComplete={() => handleQuestionComplete(true)}
                                onExit={() => { }}
                            />
                        )}

                        {activeQuestion.type === 'multiple_choice' && (
                            <div className="max-w-2xl mx-auto min-h-[60vh] flex flex-col justify-center">
                                <MultipleChoiceInput
                                    question={activeQuestion}
                                    onAnswer={(id, isCorrect) => handleQuestionComplete(isCorrect)}
                                />
                            </div>
                        )}

                        {activeQuestion.type === 'numeric_input' && (
                            <div className="max-w-xl mx-auto min-h-[60vh] flex flex-col justify-center">
                                <NumericInput
                                    question={activeQuestion}
                                    onAnswer={(val, isCorrect) => handleQuestionComplete(isCorrect)}
                                />
                            </div>
                        )}

                        {activeQuestion.type === 'fill_blank' && (
                            <div className="max-w-3xl mx-auto min-h-[60vh] flex flex-col justify-center">
                                <FillBlankInput
                                    question={activeQuestion}
                                    onAnswer={(vals, isCorrect) => handleQuestionComplete(isCorrect)}
                                />
                            </div>
                        )}

                        {activeQuestion.type === 'drag_drop' && (
                            <div className="max-w-2xl mx-auto min-h-[60vh] flex flex-col justify-center">
                                <DragDropInput
                                    question={activeQuestion}
                                    onAnswer={(ord, isCorrect) => handleQuestionComplete(isCorrect)}
                                />
                            </div>
                        )}

                        {activeQuestion.type === 'toggle' && (
                            <div className="max-w-2xl mx-auto min-h-[60vh] flex flex-col justify-center">
                                <ToggleInput
                                    question={activeQuestion}
                                    onAnswer={(s, isCorrect) => handleQuestionComplete(isCorrect)}
                                />
                            </div>
                        )}

                        {activeQuestion.type === 'expression_builder' && (
                            <div className="max-w-3xl mx-auto min-h-[60vh] flex flex-col justify-center">
                                <ExpressionBuilderInput
                                    question={activeQuestion}
                                    onAnswer={(expr, isCorrect) => handleQuestionComplete(isCorrect)}
                                />
                            </div>
                        )}

                    </motion.div>
                </AnimatePresence>
            </main>

            <ThemeToggle />
        </div>
    );
}
