'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Loader2, Sparkles, Trophy, Zap } from 'lucide-react';
import { startStudySession, endStudySession } from '@/app/actions/study-session';
import { AIPanel } from '@/components/ai/AIPanel';
import { AssistancePanel, type AssistanceLevel } from '@/components/study/AssistancePanel';
import { FadingStepsSession } from '@/components/study/FadingStepsSession';
import { LiquidGlassQuestionView } from '@/components/study/LiquidGlassQuestionView';
import { MasteryIndicator } from '@/components/study/MasteryIndicator';
import { focusTransition, motionDuration } from '@/lib/motion';
import { XP_PER_ATTEMPT } from '@/lib/gamification/xp';
import type { QuestionWithHelp } from '@/lib/hooks/useStudySession';

interface StudySessionClientProps {
    topicId: string;
    topicName: string;
    courseLabel: string;
    exitHref: string;
    initialMastery: number;
    questions: QuestionWithHelp[];
}

export function StudySessionClient({
    topicId,
    topicName,
    courseLabel,
    exitHref,
    initialMastery,
    questions,
}: StudySessionClientProps) {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [sessionError, setSessionError] = useState<string | null>(null);
    const [queueIndex, setQueueIndex] = useState(0);
    const [correct, setCorrect] = useState(0);
    const [xpEarned, setXpEarned] = useState(0);
    const [mastery, setMastery] = useState(initialMastery);
    const [helpLevel, setHelpLevel] = useState<AssistanceLevel>(0);
    const [revealNonce, setRevealNonce] = useState(0);
    const [helpOpen, setHelpOpen] = useState(false);
    const [aiOpen, setAiOpen] = useState(false);
    const startedRef = useRef(false);
    const endedRef = useRef(false);
    const reduceMotion = useReducedMotion();

    const currentQuestion = questions[queueIndex];
    const isComplete = queueIndex >= questions.length;

    useEffect(() => {
        if (startedRef.current) return;
        startedRef.current = true;
        startStudySession(topicId)
            .then(({ sessionId: id }) => setSessionId(id))
            .catch(() => setSessionError('Kunde inte starta sessionen. Försök igen.'));
    }, [topicId]);

    useEffect(() => {
        if (!isComplete || !sessionId || endedRef.current) return;
        endedRef.current = true;
        endStudySession(sessionId, {
            questionsAnswered: correct,
            correct,
            incorrect: 0,
            skipped: 0,
            xpEarned,
        }).catch(() => { /* session close is idempotent and can be retried server-side */ });
    }, [correct, isComplete, sessionId, xpEarned]);

    function escalate(level: 1 | 2 | 3 | 4 | 5) {
        setHelpLevel((current) => Math.max(current, level) as AssistanceLevel);
        setHelpOpen(true);
        if (level === 3) setRevealNonce((nonce) => nonce + 1);
        if (level === 5) setAiOpen(true);
    }

    function completeQuestion() {
        setCorrect((value) => value + 1);
        setXpEarned((value) => value + XP_PER_ATTEMPT);
        window.setTimeout(() => {
            setQueueIndex((index) => index + 1);
            setHelpLevel(0);
            setRevealNonce(0);
            setAiOpen(false);
        }, reduceMotion ? 0 : motionDuration.base * 1000);
    }

    if (sessionError) {
        return (
            <main className="study-focus study-airlock flex min-h-screen items-center justify-center px-5 text-white">
                <section className="w-full max-w-md rounded-lg border border-red-300/20 bg-red-400/10 p-6 text-center">
                    <p className="font-semibold">{sessionError}</p>
                    <Link href={exitHref} className="pressable mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-zinc-950">
                        <ArrowLeft className="h-4 w-4" /> Tillbaka
                    </Link>
                </section>
            </main>
        );
    }

    if (!sessionId) {
        return (
            <main className="study-focus study-airlock flex min-h-screen items-center justify-center text-white">
                <div className="flex items-center gap-2 text-sm text-white/60">
                    <Loader2 className="h-4 w-4 animate-spin" /> Startar sessionen…
                </div>
            </main>
        );
    }

    if (isComplete) {
        return (
            <LiquidGlassQuestionView
                courseLabel={courseLabel}
                topicName={topicName}
                questionNumber={questions.length}
                totalQuestions={questions.length}
                xpEarned={xpEarned}
                streak={correct}
                exitHref={exitHref}
            >
                <motion.section
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={reduceMotion ? { duration: 0 } : focusTransition}
                    className="mx-auto max-w-xl rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-6 text-center shadow-2xl shadow-emerald-950/20"
                >
                    <Trophy className="mx-auto h-10 w-10 text-emerald-200" />
                    <p className="mt-3 text-xs font-bold uppercase text-emerald-200">Session klar</p>
                    <h1 className="mt-1 text-2xl font-bold">Bra arbete med {topicName}</h1>
                    <div className="mt-5 grid grid-cols-2 gap-2">
                        <SummaryStat icon={CheckCircle2} label="Klara frågor" value={`${correct}/${questions.length}`} />
                        <SummaryStat icon={Zap} label="Intjänad XP" value={`+${xpEarned}`} />
                    </div>
                    <div className="mt-5 rounded-lg border border-white/10 bg-black/10 p-4 text-left">
                        <MasteryIndicator mastery={mastery} />
                    </div>
                    <Link href={exitHref} className="pressable mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-bold text-zinc-950">
                        <ArrowLeft className="h-4 w-4" /> Tillbaka till {topicName}
                    </Link>
                </motion.section>
            </LiquidGlassQuestionView>
        );
    }

    const questionText = currentQuestion.content?.question?.text ?? '';
    const questionMath = currentQuestion.content?.question?.math;
    const activeHint = getActiveHint(currentQuestion, helpLevel);

    const rightPanel = (
        <div className="flex h-full flex-col">
            <div className="border-b border-white/10 p-4">
                <MasteryIndicator mastery={mastery} />
            </div>
            <div className="min-h-0 flex-1">
                <AssistancePanel
                    currentLevel={helpLevel}
                    onEscalate={escalate}
                    hasSteps={Boolean(currentQuestion.hasSteps)}
                    wrongAttempts={0}
                    activeHint={activeHint}
                    aiOpen={aiOpen}
                    aiPanel={
                        <AIPanel
                            isOpen={aiOpen}
                            onToggle={() => setAiOpen(false)}
                            position="panel"
                            context={{
                                currentPage: 'study',
                                mode: 'guided',
                                questionId: currentQuestion.id,
                                student: {
                                    masteryLevel: mastery,
                                    recentPerformance: mastery >= 0.75 ? 'proficient' : mastery >= 0.35 ? 'learning' : 'struggling',
                                },
                            }}
                        />
                    }
                />
            </div>
        </div>
    );

    return (
        <div className="study-airlock">
            <LiquidGlassQuestionView
                courseLabel={courseLabel}
                topicName={topicName}
                questionNumber={queueIndex + 1}
                totalQuestions={questions.length}
                xpEarned={xpEarned}
                streak={correct}
                rightPanel={rightPanel}
                isHelpOpen={helpOpen}
                onHelpToggle={setHelpOpen}
                exitHref={exitHref}
            >
                <FadingStepsSession
                    key={currentQuestion.id}
                    questionId={currentQuestion.id}
                    topicId={topicId}
                    sessionId={sessionId}
                    questionText={questionText}
                    questionMath={questionMath}
                    helpLevelReached={helpLevel}
                    revealNonce={revealNonce}
                    onMasteryChange={({ value }) => setMastery(value)}
                    onComplete={completeQuestion}
                />
            </LiquidGlassQuestionView>
        </div>
    );
}

function getActiveHint(question: QuestionWithHelp, level: AssistanceLevel) {
    if (level >= 4 && question.workedExampleMarkdown) {
        return { level: 4, text: question.workedExampleMarkdown };
    }
    if (level >= 2) return { level: 2, text: question.helps.guidedHint };
    if (level >= 1) return { level: 1, text: question.helps.nudgeHint };
    return null;
}

function SummaryStat({ icon: Icon, label, value }: { icon: typeof Sparkles; label: string; value: string }) {
    return (
        <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
            <Icon className="mx-auto h-5 w-5 text-emerald-200" />
            <p className="mt-2 text-xl font-bold tabular-nums">{value}</p>
            <p className="mt-1 text-xs text-white/50">{label}</p>
        </div>
    );
}
