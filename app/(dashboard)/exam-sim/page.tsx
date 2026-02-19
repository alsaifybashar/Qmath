'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronLeft, ChevronRight, Flag, CheckCircle, AlertTriangle, Play, Timer, BookOpen, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { generateExamSimulation, generateExamBreakdown } from '@/app/actions/exam-sim';
import type { ExamSimulation, SimAnswer, ExamResult, SimQuestion, ExamSimConfig } from '@/app/actions/exam-sim';

// ============ CONFIG SCREEN ============

const difficultyLabels: Record<string, string> = {
    adaptive: 'adaptiv',
    easy: 'lätt',
    medium: 'medel',
    hard: 'svår'
};

function ConfigScreen({ onStart }: { onStart: (config: ExamSimConfig) => void }) {
    const [courseId, setCourseId] = useState('');
    const [duration, setDuration] = useState(90);
    const [questionCount, setQuestionCount] = useState(25);
    const [difficulty, setDifficulty] = useState<'adaptive' | 'easy' | 'medium' | 'hard'>('adaptive');
    const [focusWeak, setFocusWeak] = useState(true);

    const durations = [60, 90, 120, 180];
    const counts = [15, 25, 40];

    return (
        <div className="flex flex-col items-center justify-center p-6 min-h-[calc(100vh-4rem)]">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-lg w-full bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-xl border border-zinc-200 dark:border-zinc-800"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center mx-auto mb-4">
                        <Timer className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Tentamenssimulering</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm">
                        Öva under verkliga tentamensvillkor med tidsbegränsade, kursspecifika frågor.
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Course ID */}
                    <div>
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-2">
                            Kurskod
                        </label>
                        <input
                            type="text"
                            value={courseId}
                            onChange={e => setCourseId(e.target.value)}
                            placeholder="Ange din kurskod..."
                            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        />
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-2">
                            Tid
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {durations.map(d => (
                                <button
                                    key={d}
                                    onClick={() => setDuration(d)}
                                    className={`py-2.5 rounded-xl text-sm font-medium transition-all ${duration === d
                                        ? 'bg-blue-500 text-white shadow-md'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                        }`}
                                >
                                    {d} min
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Question Count */}
                    <div>
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-2">
                            Antal frågor
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {counts.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setQuestionCount(c)}
                                    className={`py-2.5 rounded-xl text-sm font-medium transition-all ${questionCount === c
                                        ? 'bg-blue-500 text-white shadow-md'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                        }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Difficulty */}
                    <div>
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-2">
                            Svårighetsgrad
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {(['adaptive', 'easy', 'medium', 'hard'] as const).map(d => (
                                <button
                                    key={d}
                                    onClick={() => setDifficulty(d)}
                                    className={`py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${difficulty === d
                                        ? 'bg-blue-500 text-white shadow-md'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                        }`}
                                >
                                    {difficultyLabels[d]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Focus weak topics */}
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={focusWeak}
                            onChange={e => setFocusWeak(e.target.checked)}
                            className="w-5 h-5 rounded-lg accent-blue-500"
                        />
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">
                            Fokusera på svaga områden (rekommenderas)
                        </span>
                    </label>

                    {/* Start button */}
                    <button
                        onClick={() => onStart({ courseId, duration, questionCount, difficulty, focusWeakTopics: focusWeak })}
                        disabled={!courseId}
                        className="w-full py-4 rounded-2xl font-semibold text-white bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                        <Play className="w-5 h-5" />
                        Starta simulering
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ============ EXAM SCREEN ============

function ExamScreen({
    simulation,
    onComplete,
}: {
    simulation: ExamSimulation;
    onComplete: (answers: SimAnswer[], totalTimeMs: number) => void;
}) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Map<string, SimAnswer>>(new Map());
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [startTime] = useState(Date.now());
    const [questionStartTime, setQuestionStartTime] = useState(Date.now());
    const [timeRemaining, setTimeRemaining] = useState(simulation.duration * 60);
    const [flagged, setFlagged] = useState<Set<string>>(new Set());

    const q = simulation.questions[currentIndex];

    // Timer
    useEffect(() => {
        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const remaining = Math.max(0, simulation.duration * 60 - elapsed);
            setTimeRemaining(remaining);
            if (remaining <= 0) {
                // Auto-submit
                handleSubmit();
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime, simulation.duration]);

    // Load existing answer when navigating
    useEffect(() => {
        const existing = answers.get(q.id);
        setCurrentAnswer(existing?.answer || '');
        setQuestionStartTime(Date.now());
    }, [currentIndex]);

    const saveCurrentAnswer = useCallback(() => {
        if (currentAnswer.trim()) {
            const timeTaken = Date.now() - questionStartTime;
            const existing = answers.get(q.id);
            setAnswers(prev => {
                const next = new Map(prev);
                next.set(q.id, {
                    questionId: q.id,
                    answer: currentAnswer.trim(),
                    timeTakenMs: (existing?.timeTakenMs || 0) + timeTaken,
                    flagged: flagged.has(q.id),
                });
                return next;
            });
        }
    }, [currentAnswer, questionStartTime, q.id, flagged]);

    const goTo = (idx: number) => {
        saveCurrentAnswer();
        setCurrentIndex(Math.max(0, Math.min(idx, simulation.questions.length - 1)));
    };

    const toggleFlag = () => {
        setFlagged(prev => {
            const next = new Set(prev);
            if (next.has(q.id)) next.delete(q.id);
            else next.add(q.id);
            return next;
        });
    };

    const handleSubmit = () => {
        saveCurrentAnswer();
        const totalTime = Date.now() - startTime;
        const finalAnswers = Array.from(answers.values());
        onComplete(finalAnswers, totalTime);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const answeredCount = answers.size;
    const isUrgent = timeRemaining < 300;

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {/* Top bar */}
            <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-3 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-blue-500">{simulation.courseCode}</span>
                    <span className="text-sm text-zinc-500">
                        Fråga {currentIndex + 1} av {simulation.questions.length}
                    </span>
                    <span className="text-xs text-zinc-400">
                        {answeredCount}/{simulation.questions.length} besvarade
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono font-bold ${isUrgent ? 'text-red-500 bg-red-50 dark:bg-red-500/10 animate-pulse' : 'text-zinc-600 dark:text-zinc-400'
                        }`}>
                        <Clock className="w-4 h-4" />
                        {formatTime(timeRemaining)}
                    </div>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-1.5 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition"
                    >
                        Lämna in tenta
                    </button>
                </div>
            </div>

            {/* Question navigator */}
            <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-2 flex gap-1.5 overflow-x-auto">
                {simulation.questions.map((sq, i) => (
                    <button
                        key={sq.id}
                        onClick={() => goTo(i)}
                        className={`w-8 h-8 rounded-lg text-xs font-medium flex-shrink-0 transition-all ${i === currentIndex
                            ? 'bg-blue-500 text-white shadow-md'
                            : answers.has(sq.id)
                                ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                            } ${flagged.has(sq.id) ? 'ring-2 ring-amber-400' : ''}`}
                    >
                        {i + 1}
                    </button>
                ))}
            </div>

            {/* Question content */}
            <div className="flex-1 flex items-start justify-center p-6">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="max-w-2xl w-full"
                >
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                                    {q.topicName}
                                </span>
                                <span className="text-xs text-zinc-400">
                                    {q.points} p • Svårighet {q.difficulty}/5
                                </span>
                            </div>
                            <button
                                onClick={toggleFlag}
                                className={`p-2 rounded-lg transition ${flagged.has(q.id)
                                    ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-amber-500'
                                    }`}
                            >
                                <Flag className="w-4 h-4" />
                            </button>
                        </div>

                        <h2 className="text-lg font-medium text-zinc-900 dark:text-white mb-6 leading-relaxed">
                            {q.questionText}
                        </h2>

                        <input
                            type="text"
                            value={currentAnswer}
                            onChange={e => setCurrentAnswer(e.target.value)}
                            placeholder="Ditt svar..."
                            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-mono"
                            autoFocus
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    saveCurrentAnswer();
                                    if (currentIndex < simulation.questions.length - 1) {
                                        goTo(currentIndex + 1);
                                    }
                                }
                            }}
                        />
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between mt-6">
                        <button
                            onClick={() => goTo(currentIndex - 1)}
                            disabled={currentIndex === 0}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 transition"
                        >
                            <ChevronLeft className="w-4 h-4" /> Föregående
                        </button>
                        <button
                            onClick={() => {
                                saveCurrentAnswer();
                                if (currentIndex < simulation.questions.length - 1) {
                                    goTo(currentIndex + 1);
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 transition"
                        >
                            {currentIndex < simulation.questions.length - 1 ? (
                                <>Nästa <ChevronRight className="w-4 h-4" /></>
                            ) : (
                                <>Granska & skicka in</>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

// ============ RESULTS SCREEN ============

function ResultsScreen({ result }: { result: ExamResult }) {
    const gradeColors: Record<string, string> = {
        'A': '#10B981', 'A-': '#10B981',
        'B+': '#3B82F6', 'B': '#3B82F6', 'B-': '#3B82F6',
        'C+': '#F59E0B', 'C': '#F59E0B', 'C-': '#F59E0B',
        'D': '#EF4444', 'F': '#EF4444',
    };
    const gradeColor = gradeColors[result.estimatedGrade] || '#6B7280';

    return (
        <div className="p-6">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                        Tentamensresultat
                    </h1>
                    <p className="text-zinc-500">{result.courseName} ({result.courseCode})</p>
                </motion.div>

                {/* Score card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-lg mb-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-zinc-500 mb-1">Ditt resultat</p>
                            <p className="text-5xl font-bold" style={{ color: gradeColor }}>
                                {result.percentage}%
                            </p>
                            <p className="text-sm text-zinc-400 mt-1">
                                {result.earnedPoints}/{result.totalPoints} poäng • {result.duration} min
                            </p>
                        </div>
                        <div
                            className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-bold text-white shadow-lg"
                            style={{ background: `linear-gradient(135deg, ${gradeColor}, ${gradeColor}CC)` }}
                        >
                            {result.estimatedGrade}
                        </div>
                    </div>
                </motion.div>

                {/* Insights */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 mb-6"
                >
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-blue-500" />
                        Viktiga insikter
                    </h3>
                    <div className="space-y-2">
                        {result.insights.map((insight, i) => (
                            <p key={i} className="text-sm text-zinc-600 dark:text-zinc-400 pl-4 border-l-2 border-blue-200 dark:border-blue-800">
                                {insight}
                            </p>
                        ))}
                    </div>
                </motion.div>

                {/* Topic Performance */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 mb-6"
                >
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-violet-500" />
                        Ämnesanalys
                    </h3>
                    <div className="space-y-3">
                        {result.topicPerformance.map(tp => (
                            <div key={tp.topicId} className="flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">
                                            {tp.topicName}
                                        </p>
                                        <span className="text-xs font-mono text-zinc-500">
                                            {tp.questionsCorrect}/{tp.questionsAttempted}
                                        </span>
                                    </div>
                                    <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${tp.accuracy * 100}%` }}
                                            transition={{ duration: 0.8, delay: 0.5 }}
                                            className="h-full rounded-full"
                                            style={{
                                                background: tp.accuracy >= 0.8 ? '#10B981'
                                                    : tp.accuracy >= 0.5 ? '#3B82F6'
                                                        : '#EF4444',
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Improvements */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 rounded-2xl p-6 border border-amber-200 dark:border-amber-800/30 mb-6"
                >
                    <h3 className="text-base font-semibold text-amber-900 dark:text-amber-300 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        Områden att förbättra
                    </h3>
                    <div className="space-y-2">
                        {result.improvements.map((imp, i) => (
                            <p key={i} className="text-sm text-amber-800 dark:text-amber-400">
                                • {imp}
                            </p>
                        ))}
                    </div>
                </motion.div>

                {/* Actions */}
                <div className="flex gap-4">
                    <Link
                        href="/exam-sim"
                        className="flex-1 py-3 rounded-xl text-center font-medium text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                    >
                        Försök igen
                    </Link>
                    <Link
                        href="/study"
                        className="flex-1 py-3 rounded-xl text-center font-medium text-white bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 transition shadow-lg flex items-center justify-center gap-2"
                    >
                        Öva svaga områden <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

// ============ MAIN PAGE ============

export default function ExamSimPage() {
    const [phase, setPhase] = useState<'config' | 'loading' | 'exam' | 'grading' | 'results'>('config');
    const [simulation, setSimulation] = useState<ExamSimulation | null>(null);
    const [result, setResult] = useState<ExamResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleStart = async (config: ExamSimConfig) => {
        setPhase('loading');
        setError(null);

        const sim = await generateExamSimulation(config);
        if ('error' in sim) {
            setError(sim.error);
            setPhase('config');
            return;
        }

        setSimulation(sim);
        setPhase('exam');
    };

    const handleComplete = async (answers: SimAnswer[], totalTimeMs: number) => {
        if (!simulation) return;
        setPhase('grading');

        const breakdown = await generateExamBreakdown(simulation, answers, totalTimeMs);
        setResult(breakdown);
        setPhase('results');
    };

    if (phase === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center"
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
                    />
                    <p className="text-zinc-600 dark:text-zinc-400">Genererar din tenta...</p>
                </motion.div>
            </div>
        );
    }

    if (phase === 'grading') {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center"
                >
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center mx-auto mb-4"
                    >
                        <CheckCircle className="w-8 h-8 text-white" />
                    </motion.div>
                    <p className="text-zinc-600 dark:text-zinc-400">Rättar din tenta...</p>
                </motion.div>
            </div>
        );
    }

    if (phase === 'exam' && simulation) {
        return <ExamScreen simulation={simulation} onComplete={handleComplete} />;
    }

    if (phase === 'results' && result) {
        return <ResultsScreen result={result} />;
    }

    return (
        <>
            {error && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg text-sm">
                    {error}
                </div>
            )}
            <ConfigScreen onStart={handleStart} />
        </>
    );
}
