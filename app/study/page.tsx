'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import 'katex/dist/katex.min.css';
import {
    AlertCircle,
    ArrowDownRight,
    CheckCircle2,
    Clock,
    Target,
    TrendingUp,
    Zap,
    Brain,
    BarChart3,
    ChevronRight,
    Lightbulb,
    Trophy,
    Timer,
    Sparkles
} from 'lucide-react';
import { QuestionItem } from '@/lib/adaptive-engine/engine';
import { IRTParameters } from '@/lib/adaptive-engine/parameters';

// Dynamic import for KaTeX
const BlockMath = dynamic(() => import('react-katex').then((mod) => mod.BlockMath), { ssr: false });
const InlineMath = dynamic(() => import('react-katex').then((mod) => mod.InlineMath), { ssr: false });

// ============================================================================
// MOCK QUESTION BANK
// ============================================================================

const QUESTION_BANK: QuestionItem[] = [
    {
        id: 'q1',
        topicId: 'integration_by_parts',
        content: "Evaluate $$\\int x^2 e^x dx$$ using Integration by Parts.",
        type: 'multiple_choice',
        options: ["x²eˣ - 2xeˣ + 2eˣ + C", "xeˣ - eˣ + C", "eˣ(x² - 2x) + C", "x²eˣ + C"],
        correctAnswer: "x²eˣ - 2xeˣ + 2eˣ + C",
        difficulty: 7,
        characterCount: 52,
        stepsRequired: 4,
        prerequisites: ['integration_basics', 'derivatives'],
        irtParams: {
            difficulty: 0.8,
            discrimination: 1.2,
            guessing: 0.25
        },
        scaffoldQuestions: [
            {
                id: 'q1_s1',
                topicId: 'integration_by_parts',
                content: "Let's break it down. First, identify $u$ and $dv$. If we choose $u = x^2$, what is $du$?",
                type: 'multiple_choice',
                options: ["2x dx", "x dx", "2 dx", "x² dx"],
                correctAnswer: "2x dx",
                difficulty: 4,
                characterCount: 80,
                stepsRequired: 1,
                prerequisites: ['derivatives'],
                irtParams: {
                    difficulty: -0.5,
                    discrimination: 1.0,
                    guessing: 0.25
                }
            }
        ]
    },
    {
        id: 'q2',
        topicId: 'eigenvalues',
        content: "Find the eigenvalues of the matrix $$A = \\begin{pmatrix} 3 & 1 \\\\ 0 & 2 \\end{pmatrix}$$",
        type: 'multiple_choice',
        options: ["λ = 3, λ = 2", "λ = 1, λ = 2", "λ = 3, λ = 1", "λ = 5, λ = 0"],
        correctAnswer: "λ = 3, λ = 2",
        difficulty: 6,
        characterCount: 64,
        stepsRequired: 3,
        prerequisites: ['matrix_basics', 'determinants'],
        irtParams: {
            difficulty: 0.4,
            discrimination: 1.4,
            guessing: 0.25
        },
        scaffoldQuestions: [
            {
                id: 'q2_s1',
                topicId: 'eigenvalues',
                content: "For a triangular matrix, the eigenvalues are the diagonal elements. What are the diagonal elements of A?",
                type: 'multiple_choice',
                options: ["3 and 2", "1 and 0", "3 and 0", "1 and 2"],
                correctAnswer: "3 and 2",
                difficulty: 3,
                characterCount: 95,
                stepsRequired: 1,
                prerequisites: ['matrix_basics'],
                irtParams: {
                    difficulty: -1.0,
                    discrimination: 0.8,
                    guessing: 0.25
                }
            }
        ]
    },
    {
        id: 'q3',
        topicId: 'integration_basics',
        content: "Evaluate $$\\int 3x^2 dx$$",
        type: 'multiple_choice',
        options: ["x³ + C", "6x + C", "3x³ + C", "x³/3 + C"],
        correctAnswer: "x³ + C",
        difficulty: 2,
        characterCount: 24,
        stepsRequired: 1,
        prerequisites: [],
        irtParams: {
            difficulty: -1.5,
            discrimination: 1.0,
            guessing: 0.25
        }
    },
    {
        id: 'q4',
        topicId: 'vector_spaces',
        content: "Which of the following is NOT a vector space over ℝ?",
        type: 'multiple_choice',
        options: [
            "The set of all 2×2 matrices",
            "The set of polynomials of degree exactly 2",
            "The set of continuous functions on [0,1]",
            "ℝ³"
        ],
        correctAnswer: "The set of polynomials of degree exactly 2",
        difficulty: 8,
        characterCount: 52,
        stepsRequired: 2,
        prerequisites: ['linear_algebra_basics'],
        irtParams: {
            difficulty: 1.2,
            discrimination: 1.5,
            guessing: 0.25
        }
    }
];

// ============================================================================
// TYPES
// ============================================================================

type SessionStatus = 'IDLE' | 'ACTIVE' | 'CORRECT' | 'WRONG' | 'SCAFFOLDING' | 'COMPLETE';

interface SessionStats {
    questionsAnswered: number;
    correctAnswers: number;
    currentStreak: number;
    startTime: number;
    xpEarned: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AdaptiveStudySession() {
    // Session state
    const [status, setStatus] = useState<SessionStatus>('IDLE');
    const [currentQuestion, setCurrentQuestion] = useState<QuestionItem | null>(null);
    const [scaffoldQuestion, setScaffoldQuestion] = useState<QuestionItem | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

    // Performance tracking
    const [startTime, setStartTime] = useState<number>(0);
    const [hintsUsed, setHintsUsed] = useState(0);
    const [masteryLevel, setMasteryLevel] = useState(50); // Percentage
    const [abilityLevel, setAbilityLevel] = useState(0); // IRT theta

    // Session stats
    const [stats, setStats] = useState<SessionStats>({
        questionsAnswered: 0,
        correctAnswers: 0,
        currentStreak: 0,
        startTime: Date.now(),
        xpEarned: 0
    });

    // Timer
    const [elapsedTime, setElapsedTime] = useState(0);

    // Initialize session
    useEffect(() => {
        if (status === 'IDLE') {
            // Select first question based on difficulty
            const sortedQuestions = [...QUESTION_BANK].sort((a, b) => a.difficulty - b.difficulty);
            setCurrentQuestion(sortedQuestions[1]); // Start with medium difficulty
            setStatus('ACTIVE');
            setStartTime(Date.now());
            setStats(s => ({ ...s, startTime: Date.now() }));
        }
    }, [status]);

    // Timer effect
    useEffect(() => {
        if (status === 'ACTIVE' || status === 'SCAFFOLDING') {
            const interval = setInterval(() => {
                setElapsedTime(Date.now() - startTime);
            }, 100);
            return () => clearInterval(interval);
        }
    }, [status, startTime]);

    // Select next question adaptively
    const selectNextQuestion = useCallback(() => {
        // Simple adaptive selection based on ability
        const availableQuestions = QUESTION_BANK.filter(q => q.id !== currentQuestion?.id);

        // Find question closest to optimal difficulty (ability + 0.3)
        const optimalDifficulty = abilityLevel + 0.3;

        const scored = availableQuestions.map(q => ({
            question: q,
            score: -Math.abs(q.irtParams.difficulty - optimalDifficulty)
        })).sort((a, b) => b.score - a.score);

        return scored[0]?.question ?? availableQuestions[0];
    }, [currentQuestion, abilityLevel]);

    // Handle answer submission
    const handleAnswer = useCallback((answer: string) => {
        if (!currentQuestion) return;

        setSelectedAnswer(answer);
        const timeTaken = elapsedTime;
        const isCorrect = answer === currentQuestion.correctAnswer;

        // Update mastery (simplified BKT)
        const pSlip = 0.1;
        const pGuess = 0.25;
        const pL = masteryLevel / 100;

        let newMastery: number;
        if (isCorrect) {
            newMastery = (pL * (1 - pSlip)) / (pL * (1 - pSlip) + (1 - pL) * pGuess);
        } else {
            newMastery = (pL * pSlip) / (pL * pSlip + (1 - pL) * (1 - pGuess));
        }

        // Apply learning boost
        const pLearn = 0.2;
        newMastery = newMastery + (1 - newMastery) * pLearn;

        setMasteryLevel(Math.round(Math.max(1, Math.min(99, newMastery * 100))));

        // Update ability (simplified IRT MLE)
        if (isCorrect) {
            setAbilityLevel(a => Math.min(3, a + 0.15));
        } else {
            setAbilityLevel(a => Math.max(-3, a - 0.1));
        }

        // Update stats
        setStats(s => ({
            ...s,
            questionsAnswered: s.questionsAnswered + 1,
            correctAnswers: s.correctAnswers + (isCorrect ? 1 : 0),
            currentStreak: isCorrect ? s.currentStreak + 1 : 0,
            xpEarned: s.xpEarned + (isCorrect ? calculateXP(currentQuestion.difficulty, timeTaken) : 5)
        }));

        if (isCorrect) {
            setStatus('CORRECT');

            // Move to next question after delay
            setTimeout(() => {
                if (stats.questionsAnswered + 1 >= 5) {
                    setStatus('COMPLETE');
                } else {
                    const nextQ = selectNextQuestion();
                    setCurrentQuestion(nextQ);
                    setSelectedAnswer(null);
                    setStatus('ACTIVE');
                    setStartTime(Date.now());
                    setHintsUsed(0);
                }
            }, 1500);
        } else {
            setStatus('WRONG');

            // Check if scaffolding should be triggered
            const shouldScaffold = currentQuestion.scaffoldQuestions &&
                currentQuestion.scaffoldQuestions.length > 0 &&
                masteryLevel < 50;

            setTimeout(() => {
                if (shouldScaffold) {
                    setStatus('SCAFFOLDING');
                    setScaffoldQuestion(currentQuestion.scaffoldQuestions![0]);
                    setStartTime(Date.now());
                    setSelectedAnswer(null);
                } else {
                    // Move to next question
                    const nextQ = selectNextQuestion();
                    setCurrentQuestion(nextQ);
                    setSelectedAnswer(null);
                    setStatus('ACTIVE');
                    setStartTime(Date.now());
                    setHintsUsed(0);
                }
            }, 2000);
        }
    }, [currentQuestion, elapsedTime, masteryLevel, stats.questionsAnswered, selectNextQuestion]);

    // Handle scaffold answer
    const handleScaffoldAnswer = useCallback((answer: string) => {
        if (!scaffoldQuestion) return;

        setSelectedAnswer(answer);
        const isCorrect = answer === scaffoldQuestion.correctAnswer;

        if (isCorrect) {
            setMasteryLevel(m => Math.min(99, m + 5));
            setStatus('CORRECT');

            setTimeout(() => {
                // Return to original question or move on
                setScaffoldQuestion(null);
                setSelectedAnswer(null);

                // Try original question again or move on
                if (currentQuestion) {
                    setStatus('ACTIVE');
                    setStartTime(Date.now());
                } else {
                    const nextQ = selectNextQuestion();
                    setCurrentQuestion(nextQ);
                    setStatus('ACTIVE');
                    setStartTime(Date.now());
                }
            }, 1500);
        } else {
            // Wrong scaffold answer
            setStatus('WRONG');
            setTimeout(() => {
                setSelectedAnswer(null);
                setStatus('SCAFFOLDING');
            }, 1500);
        }
    }, [scaffoldQuestion, currentQuestion, selectNextQuestion]);

    // Calculate XP based on difficulty and speed
    const calculateXP = (difficulty: number, timeTaken: number): number => {
        const baseXP = difficulty * 10;
        const speedBonus = timeTaken < 30000 ? 20 : timeTaken < 60000 ? 10 : 0;
        return baseXP + speedBonus;
    };

    // Get hint (placeholder)
    const handleHint = () => {
        setHintsUsed(h => h + 1);
        alert('Hint: Think about the underlying concept first!');
    };

    // Format time
    const formatTime = (ms: number): string => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Get difficulty color
    const getDifficultyColor = (difficulty: number): string => {
        if (difficulty <= 3) return 'text-green-400';
        if (difficulty <= 6) return 'text-yellow-400';
        return 'text-red-400';
    };

    // Active question to display
    const displayQuestion = status === 'SCAFFOLDING' ? scaffoldQuestion : currentQuestion;

    // Render complete screen
    if (status === 'COMPLETE') {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center max-w-md"
                >
                    <div className="mb-8">
                        <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-4" />
                        <h1 className="text-3xl font-bold mb-2">Session Complete!</h1>
                        <p className="text-zinc-400">Great work on your practice session</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                            <div className="text-3xl font-bold text-green-400">{stats.correctAnswers}/{stats.questionsAnswered}</div>
                            <div className="text-xs text-zinc-500 uppercase tracking-wider">Correct</div>
                        </div>
                        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                            <div className="text-3xl font-bold text-purple-400">+{stats.xpEarned}</div>
                            <div className="text-xs text-zinc-500 uppercase tracking-wider">XP Earned</div>
                        </div>
                        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                            <div className="text-3xl font-bold text-blue-400">{masteryLevel}%</div>
                            <div className="text-xs text-zinc-500 uppercase tracking-wider">Mastery</div>
                        </div>
                        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                            <div className="text-3xl font-bold text-orange-400">{stats.currentStreak}</div>
                            <div className="text-xs text-zinc-500 uppercase tracking-wider">Best Streak</div>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            setStatus('IDLE');
                            setStats({
                                questionsAnswered: 0,
                                correctAnswers: 0,
                                currentStreak: 0,
                                startTime: Date.now(),
                                xpEarned: 0
                            });
                        }}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all"
                    >
                        Start New Session
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Gradient Background */}
            <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 pointer-events-none" />

            <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">

                {/* Header Stats Bar */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-zinc-900/80 backdrop-blur-xl rounded-2xl p-4 border border-zinc-800"
                >
                    {/* Topic & Progress */}
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-zinc-500 text-xs font-mono uppercase tracking-wider">
                                {currentQuestion?.topicId.replace('_', ' ')}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="h-1.5 w-32 bg-zinc-800 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${masteryLevel}%` }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>
                                <span className="text-xs text-zinc-400 font-medium">{masteryLevel}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex items-center gap-3">
                        {/* XP */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 rounded-lg border border-purple-500/20">
                            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-xs font-bold text-purple-300">{stats.xpEarned} XP</span>
                        </div>

                        {/* Streak */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 rounded-lg border border-orange-500/20">
                            <Zap className="w-3.5 h-3.5 text-orange-400" />
                            <span className="text-xs font-bold text-orange-300">{stats.currentStreak}</span>
                        </div>

                        {/* Timer */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 rounded-lg">
                            <Timer className="w-3.5 h-3.5 text-zinc-400" />
                            <span className="text-xs font-mono text-zinc-300">{formatTime(elapsedTime)}</span>
                        </div>

                        {/* Scaffolding Indicator */}
                        {status === 'SCAFFOLDING' && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20 animate-pulse"
                            >
                                <ArrowDownRight className="w-3.5 h-3.5 text-amber-400" />
                                <span className="text-xs font-bold text-amber-300">SCAFFOLDING</span>
                            </motion.div>
                        )}

                        {/* Adaptive Badge */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 rounded-lg border border-green-500/20">
                            <Brain className="w-3.5 h-3.5 text-green-400" />
                            <span className="text-xs font-bold text-green-300">ADAPTIVE</span>
                        </div>
                    </div>
                </motion.div>

                {/* Feedback Banners */}
                <AnimatePresence>
                    {status === 'WRONG' && (
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            className="mb-4 bg-red-900/30 border border-red-500/40 text-red-200 p-4 rounded-xl flex items-center gap-3"
                        >
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <div>
                                <div className="font-semibold">Incorrect</div>
                                <div className="text-sm text-red-300/80">
                                    {currentQuestion?.scaffoldQuestions?.length
                                        ? "Let's break this down into simpler steps..."
                                        : `The correct answer was: ${currentQuestion?.correctAnswer}`
                                    }
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {status === 'CORRECT' && (
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            className="mb-4 bg-green-900/30 border border-green-500/40 text-green-200 p-4 rounded-xl flex items-center gap-3"
                        >
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                            <div>
                                <div className="font-semibold">Correct!</div>
                                <div className="text-sm text-green-300/80">
                                    Mastery updated +{Math.round((1 - masteryLevel / 100) * 10)}%
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Question Card */}
                {displayQuestion && (
                    <motion.div
                        key={displayQuestion.id}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl"
                    >
                        {/* Question Header */}
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                                    Question {stats.questionsAnswered + 1}
                                </span>
                                {status === 'SCAFFOLDING' && (
                                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                                        Scaffold
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-mono ${getDifficultyColor(displayQuestion.difficulty)}`}>
                                    Difficulty: {displayQuestion.difficulty}/10
                                </span>
                            </div>
                        </div>

                        {/* Question Content */}
                        <div className="mb-8">
                            <div className="text-lg leading-relaxed text-zinc-200 mb-4">
                                {displayQuestion.content.split('$$').map((part, i) =>
                                    i % 2 === 0 ? (
                                        <span key={i}>{part}</span>
                                    ) : (
                                        <span key={i} className="block my-4 text-center">
                                            <BlockMath math={part} />
                                        </span>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Answer Options */}
                        <div className="space-y-3 mb-6">
                            {displayQuestion.options?.map((opt, idx) => {
                                const isSelected = selectedAnswer === opt;
                                const isCorrect = opt === displayQuestion.correctAnswer;
                                const showResult = status === 'CORRECT' || status === 'WRONG';

                                let optionClass = "border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-800/50";
                                if (showResult && isSelected) {
                                    optionClass = isCorrect
                                        ? "border-green-500 bg-green-500/10"
                                        : "border-red-500 bg-red-500/10";
                                } else if (showResult && isCorrect) {
                                    optionClass = "border-green-500/50 bg-green-500/5";
                                }

                                return (
                                    <motion.button
                                        key={idx}
                                        whileHover={{ scale: showResult ? 1 : 1.01 }}
                                        whileTap={{ scale: showResult ? 1 : 0.99 }}
                                        onClick={() => {
                                            if (!showResult && status !== 'IDLE') {
                                                if (status === 'SCAFFOLDING') {
                                                    handleScaffoldAnswer(opt);
                                                } else {
                                                    handleAnswer(opt);
                                                }
                                            }
                                        }}
                                        disabled={showResult}
                                        className={`w-full p-4 text-left rounded-xl border transition-all flex items-center group ${optionClass}`}
                                    >
                                        <span className={`w-8 h-8 flex items-center justify-center rounded-full border mr-4 text-sm font-medium ${showResult && isSelected
                                                ? isCorrect
                                                    ? 'border-green-500 bg-green-500/20 text-green-400'
                                                    : 'border-red-500 bg-red-500/20 text-red-400'
                                                : 'border-zinc-700 bg-zinc-900 text-zinc-500 group-hover:border-blue-500/50 group-hover:text-blue-400'
                                            }`}>
                                            {String.fromCharCode(65 + idx)}
                                        </span>
                                        <span className={`flex-1 ${showResult && isSelected
                                                ? isCorrect ? 'text-green-300' : 'text-red-300'
                                                : 'text-zinc-300 group-hover:text-white'
                                            }`}>
                                            {opt}
                                        </span>
                                        {showResult && isCorrect && (
                                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Bottom Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                            <button
                                onClick={handleHint}
                                className="flex items-center gap-2 text-sm text-zinc-500 hover:text-yellow-400 transition-colors"
                            >
                                <Lightbulb className="w-4 h-4" />
                                Hint ({hintsUsed} used)
                            </button>

                            <div className="flex items-center gap-2 text-xs text-zinc-600">
                                <Target className="w-3.5 h-3.5" />
                                IRT θ: {abilityLevel.toFixed(2)}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Adaptive Engine Info Card */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-8 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-4 h-4 text-blue-400" />
                        <h3 className="text-sm font-bold text-zinc-300">Adaptive Learning Active</h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <div className="text-xl font-bold text-blue-400">{masteryLevel}%</div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">BKT Mastery</div>
                        </div>
                        <div>
                            <div className="text-xl font-bold text-purple-400">{abilityLevel.toFixed(1)}</div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">IRT Ability (θ)</div>
                        </div>
                        <div>
                            <div className="text-xl font-bold text-green-400">{stats.correctAnswers}/{stats.questionsAnswered}</div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Accuracy</div>
                        </div>
                        <div>
                            <div className="text-xl font-bold text-orange-400">{formatTime(Date.now() - stats.startTime)}</div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Session Time</div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-zinc-800/50">
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                Bayesian Knowledge Tracing
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                Item Response Theory
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                Spaced Repetition
                            </span>
                        </div>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}
