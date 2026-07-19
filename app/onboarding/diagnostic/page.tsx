'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    Brain, ArrowRight, Clock, CheckCircle2, XCircle,
    ChevronRight, Loader2, BarChart3, AlertTriangle,
    Sparkles, Shield
} from 'lucide-react';
import {
    getScreeningQuestions,
    submitDiagnosticScreening,
    saveAnxietyScreening,
    completeDiagnosticOnboarding,
    type DiagnosticQuestion,
    type DiagnosticResponse,
    type DiagnosticGap,
} from '@/app/actions/diagnostic';

// ============================================================================
// PHASE TYPE — Controls what the user sees
// ============================================================================

type Phase = 'intro' | 'screening' | 'results' | 'anxiety' | 'complete';

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function DiagnosticPage() {
    const router = useRouter();
    const [phase, setPhase] = useState<Phase>('intro');
    const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [responses, setResponses] = useState<DiagnosticResponse[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<string>('');
    const [confidence, setConfidence] = useState(3);
    const [questionStartTime, setQuestionStartTime] = useState(Date.now());
    const [loading, setLoading] = useState(false);

    // Results state
    const [score, setScore] = useState(0);
    const [totalCorrect, setTotalCorrect] = useState(0);
    const [gaps, setGaps] = useState<DiagnosticGap[]>([]);
    const [needsRemediation, setNeedsRemediation] = useState(false);

    // Anxiety screening state
    const [anxietyLevel, setAnxietyLevel] = useState(1);
    const [selfEfficacy, setSelfEfficacy] = useState(3);

    const numericInputRef = useRef<HTMLInputElement>(null);

    // Load questions on mount
    useEffect(() => {
        getScreeningQuestions().then(res => {
            if (res.data) setQuestions(res.data);
        });
    }, []);

    // Reset timer when question changes
    useEffect(() => {
        setQuestionStartTime(Date.now());
        setSelectedAnswer('');
        setConfidence(3);
        if (numericInputRef.current) numericInputRef.current.value = '';
    }, [currentIndex]);

    const currentQuestion = questions[currentIndex];

    // ── Submit answer for current question ──
    const handleSubmitAnswer = useCallback(() => {
        if (!currentQuestion || !selectedAnswer) return;

        const timeTaken = Date.now() - questionStartTime;
        const isCorrect = selectedAnswer.trim() === currentQuestion.correctAnswer.trim();

        const response: DiagnosticResponse = {
            questionId: currentQuestion.id,
            curriculumStandardCode: currentQuestion.curriculumStandardCode,
            studentAnswer: selectedAnswer,
            isCorrect,
            timeTakenMs: timeTaken,
            confidence,
        };

        const newResponses = [...responses, response];
        setResponses(newResponses);

        // Move to next question or submit
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            // All questions answered — submit
            submitResults(newResponses);
        }
    }, [currentQuestion, selectedAnswer, confidence, questionStartTime, responses, currentIndex, questions.length]);

    // ── Submit all results to server ──
    const submitResults = async (allResponses: DiagnosticResponse[]) => {
        setLoading(true);
        const result = await submitDiagnosticScreening(allResponses);
        setLoading(false);

        if (result.data) {
            setScore(result.data.score);
            setTotalCorrect(result.data.totalCorrect);
            setGaps(result.data.gaps);
            setNeedsRemediation(result.data.needsRemediation);
            setPhase('results');
        }
    };

    // ── Save anxiety screening and move on ──
    const handleSaveAnxiety = async () => {
        setLoading(true);
        await saveAnxietyScreening(anxietyLevel, selfEfficacy);
        setLoading(false);
        setPhase('complete');
    };

    // ── Complete onboarding ──
    const handleComplete = async () => {
        setLoading(true);
        await completeDiagnosticOnboarding();
    };

    // ── Skip diagnostic ──
    const handleSkip = async () => {
        setLoading(true);
        await completeDiagnosticOnboarding();
    };

    // ========================================================================
    // RENDER PHASES
    // ========================================================================

    // ── INTRO ──
    if (phase === 'intro') {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
                <div className="fixed inset-0 bg-gradient-to-br from-amber-900/20 via-black to-blue-900/20"></div>
                <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="fixed top-20 right-20 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl animate-float-slow"></div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 max-w-2xl w-full"
                >
                    <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-12 text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3, type: 'spring' }}
                            className="inline-flex p-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full mb-8"
                        >
                            <Brain className="w-12 h-12 text-white" />
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-4xl font-bold mb-4"
                        >
                            Snabb kunskapskoll
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="text-lg text-zinc-400 mb-8 max-w-lg mx-auto"
                        >
                            10 korta frågor för att kartlägga dina förkunskaper.
                            Vi anpassar din studieupplevelse baserat på resultatet.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="grid grid-cols-3 gap-4 mb-10"
                        >
                            <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                                <Clock className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                                <div className="text-sm font-medium">5 min</div>
                                <div className="text-xs text-zinc-500">Uppskattad tid</div>
                            </div>
                            <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                                <BarChart3 className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                                <div className="text-sm font-medium">10 frågor</div>
                                <div className="text-xs text-zinc-500">Förkunskaper</div>
                            </div>
                            <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                                <Shield className="w-5 h-5 text-green-400 mx-auto mb-2" />
                                <div className="text-sm font-medium">Personligt</div>
                                <div className="text-xs text-zinc-500">Ingen betygsättning</div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="space-y-3"
                        >
                            <button
                                onClick={() => setPhase('screening')}
                                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                            >
                                Starta kunskapskollen
                                <ArrowRight className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleSkip}
                                disabled={loading}
                                className="w-full py-3 text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Hoppa över och gå till dashboard'}
                            </button>
                        </motion.div>
                    </div>

                    {/* Progress dots */}
                    <div className="flex justify-center gap-2 mt-8">
                        <div className="w-8 h-1 rounded-full bg-green-500"></div>
                        <div className="w-8 h-1 rounded-full bg-green-500"></div>
                        <div className="w-8 h-1 rounded-full bg-green-500"></div>
                        <div className="w-8 h-1 rounded-full bg-green-500"></div>
                        <div className="w-8 h-1 rounded-full bg-amber-500 animate-pulse"></div>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ── SCREENING ──
    if (phase === 'screening' && currentQuestion) {
        const progress = ((currentIndex) / questions.length) * 100;

        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center p-4">
                <div className="fixed inset-0 bg-gradient-to-br from-amber-900/10 via-black to-blue-900/10"></div>

                <div className="relative z-10 max-w-2xl w-full mt-12">
                    {/* Progress bar */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-zinc-400">
                                Fråga {currentIndex + 1} av {questions.length}
                            </span>
                            <span className="text-sm text-zinc-500">{currentQuestion.topicArea}</span>
                        </div>
                        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                            />
                        </div>
                    </div>

                    {/* Question card */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.3 }}
                            className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8"
                        >
                            {/* Question text */}
                            <div className="mb-8">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full text-xs font-medium mb-4">
                                    <span>{currentQuestion.prerequisiteLevel.replace('gy_', 'Matematik ')}</span>
                                </div>
                                <h2 className="text-2xl font-bold leading-relaxed">
                                    <span className="whitespace-pre-wrap">
                                        {currentQuestion.question
                                            .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
                                            .replace(/\\sin/g, 'sin')
                                            .replace(/\\ln/g, 'ln')
                                            .replace(/\\pi/g, 'π')
                                            .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
                                            .replace(/\^(\{[^}]+\}|[0-9])/g, (_, exp) => `^${exp.replace(/[{}]/g, '')}`)}
                                    </span>
                                </h2>
                            </div>

                            {/* Answer area */}
                            {currentQuestion.questionType === 'multiple_choice' && currentQuestion.options ? (
                                <div className="space-y-3 mb-8">
                                    {currentQuestion.options.map((option, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedAnswer(option)}
                                            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                                                selectedAnswer === option
                                                    ? 'border-amber-500 bg-amber-500/10 text-white'
                                                    : 'border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600'
                                            }`}
                                        >
                                            <span className="font-mono">
                                                {option
                                                    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')
                                                    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
                                                    .replace(/\^(\{[^}]+\}|[0-9])/g, (_, exp) => `^${exp.replace(/[{}]/g, '')}`)
                                                }
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="mb-8">
                                    <input
                                        ref={numericInputRef}
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="Skriv ditt svar..."
                                        onChange={(e) => setSelectedAnswer(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && selectedAnswer) handleSubmitAnswer(); }}
                                        className="w-full p-4 rounded-xl border-2 border-zinc-700 bg-zinc-800/50 text-white text-lg font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
                                    />
                                </div>
                            )}

                            {/* Confidence slider */}
                            <div className="mb-8 p-4 bg-zinc-800/30 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-zinc-400">Hur säker är du?</span>
                                    <span className="text-sm font-medium text-amber-400">
                                        {confidence === 1 ? 'Gissar' : confidence === 2 ? 'Osäker' : confidence === 3 ? 'Ganska säker' : confidence === 4 ? 'Säker' : 'Helt säker'}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(level => (
                                        <button
                                            key={level}
                                            onClick={() => setConfidence(level)}
                                            className={`flex-1 h-2 rounded-full transition-colors ${
                                                level <= confidence ? 'bg-amber-500' : 'bg-zinc-700'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Submit button */}
                            <button
                                onClick={handleSubmitAnswer}
                                disabled={!selectedAnswer}
                                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                                    selectedAnswer
                                        ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20'
                                        : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                                }`}
                            >
                                {currentIndex < questions.length - 1 ? (
                                    <>Nästa fråga <ChevronRight className="w-5 h-5" /></>
                                ) : (
                                    <>Visa resultat <BarChart3 className="w-5 h-5" /></>
                                )}
                            </button>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        );
    }

    // ── LOADING ──
    if (loading || (phase === 'screening' && !currentQuestion)) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
                    <p className="text-zinc-400">Analyserar dina svar...</p>
                </div>
            </div>
        );
    }

    // ── RESULTS ──
    if (phase === 'results') {
        const percentage = Math.round(score * 100);

        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
                <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-black to-purple-900/20"></div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="relative z-10 max-w-2xl w-full"
                >
                    <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-10">
                        {/* Score header */}
                        <div className="text-center mb-8">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring' }}
                                className={`inline-flex p-6 rounded-full mb-4 ${
                                    percentage >= 70
                                        ? 'bg-green-500/20'
                                        : percentage >= 40
                                        ? 'bg-amber-500/20'
                                        : 'bg-red-500/20'
                                }`}
                            >
                                <span className={`text-4xl font-bold ${
                                    percentage >= 70 ? 'text-green-400' : percentage >= 40 ? 'text-amber-400' : 'text-red-400'
                                }`}>
                                    {percentage}%
                                </span>
                            </motion.div>
                            <h2 className="text-2xl font-bold mb-2">Ditt resultat</h2>
                            <p className="text-zinc-400">
                                {totalCorrect} av {responses.length} rätt
                            </p>
                        </div>

                        {/* Gap analysis */}
                        <div className="space-y-3 mb-8">
                            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                                Kunskapsområden
                            </h3>
                            {gaps.map((gap) => (
                                <div
                                    key={gap.standardCode}
                                    className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl"
                                >
                                    {gap.status === 'strong' ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                                    ) : gap.status === 'moderate' ? (
                                        <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                                    ) : (
                                        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                                    )}
                                    <div className="flex-1">
                                        <div className="font-medium text-sm">{gap.standardTitle}</div>
                                        <div className="text-xs text-zinc-500">{gap.level.replace('gy_', 'Matematik ')}</div>
                                    </div>
                                    <div className={`text-xs font-bold px-2 py-1 rounded-md ${
                                        gap.status === 'strong' ? 'bg-green-500/10 text-green-400'
                                        : gap.status === 'moderate' ? 'bg-amber-500/10 text-amber-400'
                                        : gap.status === 'weak' ? 'bg-orange-500/10 text-orange-400'
                                        : 'bg-red-500/10 text-red-400'
                                    }`}>
                                        {gap.status === 'strong' ? 'Stark' : gap.status === 'moderate' ? 'Ok' : gap.status === 'weak' ? 'Svag' : 'Kritisk'}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Remediation message */}
                        {needsRemediation && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="mb-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl"
                            >
                                <div className="flex items-start gap-3">
                                    <Sparkles className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-amber-300">Vi anpassar din studieväg</p>
                                        <p className="text-xs text-zinc-400 mt-1">
                                            Vi har identifierat några kunskapsluckor som vi automatiskt kommer att fylla i
                                            under dina studiepass. Inga extra steg behövs!
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Continue */}
                        <button
                            onClick={() => setPhase('anxiety')}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                        >
                            Fortsätt
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ── ANXIETY SCREENING ──
    if (phase === 'anxiety') {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
                <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative z-10 max-w-2xl w-full"
                >
                    <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-10">
                        <div className="text-center mb-8">
                            <div className="inline-flex p-4 bg-purple-500/10 rounded-full mb-4">
                                <Shield className="w-8 h-8 text-purple-400" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Hur känner du inför matte?</h2>
                            <p className="text-zinc-400 text-sm">
                                Dina svar hjälper oss att anpassa upplevelsen. Det finns inga rätt eller fel svar.
                            </p>
                        </div>

                        {/* Anxiety question */}
                        <div className="mb-8 p-6 bg-zinc-800/30 rounded-xl">
                            <label className="block text-sm font-medium mb-4">
                                Hur ofta känner du stress eller oro inför matematikuppgifter?
                            </label>
                            <div className="grid grid-cols-5 gap-2">
                                {[
                                    { level: 1, label: 'Aldrig' },
                                    { level: 2, label: 'Sällan' },
                                    { level: 3, label: 'Ibland' },
                                    { level: 4, label: 'Ofta' },
                                    { level: 5, label: 'Alltid' },
                                ].map(({ level, label }) => (
                                    <button
                                        key={level}
                                        onClick={() => setAnxietyLevel(level)}
                                        className={`p-3 rounded-xl text-center transition-all text-sm ${
                                            anxietyLevel === level
                                                ? 'bg-purple-500/20 border-2 border-purple-500 text-purple-300'
                                                : 'bg-zinc-800 border-2 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Self-efficacy question */}
                        <div className="mb-8 p-6 bg-zinc-800/30 rounded-xl">
                            <label className="block text-sm font-medium mb-4">
                                Hur säker är du på att du kan klara dina mattekurser?
                            </label>
                            <div className="grid grid-cols-5 gap-2">
                                {[
                                    { level: 1, label: 'Inte alls' },
                                    { level: 2, label: 'Lite' },
                                    { level: 3, label: 'Ganska' },
                                    { level: 4, label: 'Mycket' },
                                    { level: 5, label: 'Helt' },
                                ].map(({ level, label }) => (
                                    <button
                                        key={level}
                                        onClick={() => setSelfEfficacy(level)}
                                        className={`p-3 rounded-xl text-center transition-all text-sm ${
                                            selfEfficacy === level
                                                ? 'bg-blue-500/20 border-2 border-blue-500 text-blue-300'
                                                : 'bg-zinc-800 border-2 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleSaveAnxiety}
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Fortsätt
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ── COMPLETE — redirect to onboarding/complete ──
    if (phase === 'complete') {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold mb-4">Diagnostiken är klar!</h2>
                    <p className="text-zinc-400 mb-8">Din studieväg har skapats.</p>
                    <button
                        onClick={handleComplete}
                        disabled={loading}
                        className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 mx-auto shadow-lg shadow-green-500/20"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                Gå vidare
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </motion.div>
            </div>
        );
    }

    return null;
}
