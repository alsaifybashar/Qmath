'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle, Loader2 } from 'lucide-react';
import { getQuestionWithSteps } from '@/app/actions/study-questions';
import { checkStep, recordStepRevealed, recordQuestionCompleted } from '@/app/actions/steps';
import { StepRenderer } from '@/components/study/StepRenderer';
import { MathRenderer } from '@/components/study/MathRenderer';
import { getRevealedSteps, fadePhase, type RevealedStep } from '@/lib/math/fade-logic';
import { focusSpring, motionDuration } from '@/lib/motion';

type FadingStep = RevealedStep & {
    hintNudge?: string | null;
    hintGuided?: string | null;
    explanation?: string | null;
};

export interface FadingStepsSessionProps {
    questionId: string;
    topicId: string;
    sessionId: string | null;
    /** Question text shown above the steps */
    questionText: string;
    questionMath?: string;
    /** Highest assistance level used (for the question_completed event) */
    helpLevelReached: number;
    /**
     * Increment to reveal one more hidden step (assistance ladder level 3).
     * The session reveals the next unrevealed step as a worked line.
     */
    revealNonce: number;
    onMasteryChange?: (m: { value: number; phase: 1 | 2 | 3 | 4; phaseChanged: boolean }) => void;
    /** Called once when every remaining step is answered correctly */
    onComplete: () => void;
    /** No more steps can be revealed via the ladder (all shown or only one left) */
    onRevealExhausted?: () => void;
    /**
     * Admin preview: render draft steps at a chosen mastery without touching
     * the DB — grading is a local normalized compare against the draft facit,
     * and no events are emitted.
     */
    preview?: {
        steps: Array<Omit<RevealedStep, 'revealed'> & {
            hintNudge?: string | null;
            hintGuided?: string | null;
            explanation?: string | null;
            correctAnswer: string;
        }>;
        mastery: number;
    };
}

function normalizeAnswer(s: string): string {
    return s.toLowerCase().replace(/\s+/g, '').replace(/,/g, '.');
}

/**
 * The signature fading-steps experience ("tonande lösningssteg").
 *
 * Steps the fade engine reveals at the student's mastery render as worked
 * lines to study; the rest must be answered, one at a time, graded
 * server-side via checkStep. The last step is always the student's to answer,
 * even at full support. Fading is computed once at load — mid-question
 * mastery changes affect the NEXT question, never the one being worked.
 */
export function FadingStepsSession({
    questionId,
    topicId,
    sessionId,
    questionText,
    questionMath,
    helpLevelReached,
    revealNonce,
    onMasteryChange,
    onComplete,
    onRevealExhausted,
    preview,
}: FadingStepsSessionProps) {
    const [steps, setSteps] = useState<FadingStep[]>([]);
    const [phase, setPhase] = useState<1 | 2 | 3 | 4>(1);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    // Step ids shown as worked lines: fade-prefilled at load + ladder reveals
    const [prefilledIds, setPrefilledIds] = useState<Set<string>>(new Set());
    // Steps the student has answered correctly, with their answers
    const [doneAnswers, setDoneAnswers] = useState<Map<string, string>>(new Map());
    const [isComplete, setIsComplete] = useState(false);
    const reduceMotion = useReducedMotion();
    const attemptsRef = useRef(0);
    const lastRevealNonceRef = useRef(revealNonce);
    const completedRef = useRef(false);

    // Preview data is derived locally — mirror it into state whenever it changes
    const previewKey = preview
        ? `${preview.mastery}:${preview.steps.map((s) => s.id).join(',')}`
        : null;
    useEffect(() => {
        if (!preview) return;
        const sorted = [...preview.steps].sort((a, b) => a.stepNumber - b.stepNumber);
        const revealed = getRevealedSteps(sorted, preview.mastery);
        setSteps(revealed);
        setPhase(fadePhase(preview.mastery));
        setPrefilledIds(new Set(revealed.filter((s, i) => s.revealed && i < revealed.length - 1).map((s) => s.id)));
        setDoneAnswers(new Map());
        setIsComplete(false);
        completedRef.current = false;
        setIsLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [previewKey]);

    useEffect(() => {
        if (preview) return;
        let cancelled = false;
        setIsLoading(true);
        setLoadError(null);
        setDoneAnswers(new Map());
        setIsComplete(false);
        completedRef.current = false;
        attemptsRef.current = 0;

        getQuestionWithSteps(questionId, topicId)
            .then((data) => {
                if (cancelled) return;
                const sorted = [...data.revealedSteps].sort((a, b) => a.stepNumber - b.stepNumber);
                setSteps(sorted);
                setPhase(data.phase);
                // Last step is always the student's — never prefilled
                const prefilled = new Set(
                    sorted.filter((s, i) => s.revealed && i < sorted.length - 1).map((s) => s.id)
                );
                setPrefilledIds(prefilled);
                // Surface mastery immediately so the progression bar shows at load
                onMasteryChange?.({ value: data.mastery, phase: data.phase, phaseChanged: false });
            })
            .catch((err) => {
                console.error('[FadingSteps] Failed to load steps:', err);
                if (!cancelled) setLoadError('Kunde inte ladda lösningsstegen. Försök ladda om sidan.');
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [questionId, topicId]);

    // Assistance ladder L3: reveal the next hidden step as a worked line
    useEffect(() => {
        if (revealNonce === lastRevealNonceRef.current) return;
        lastRevealNonceRef.current = revealNonce;
        if (isLoading || isComplete) return;

        const remaining = steps.filter(
            (s) => !prefilledIds.has(s.id) && !doneAnswers.has(s.id)
        );
        // Keep at least the final remaining step for the student
        if (remaining.length <= 1) {
            onRevealExhausted?.();
            return;
        }
        const next = remaining[0];
        setPrefilledIds((prev) => new Set(prev).add(next.id));
        if (!preview) {
            recordStepRevealed({
                sessionId,
                questionId,
                topicId,
                stepId: next.id,
                stepNumber: next.stepNumber,
                trigger: 'ladder',
                fadePhase: phase,
            }).catch(() => { /* telemetry only */ });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [revealNonce]);

    const handleStepSubmit = useCallback(
        async (stepId: string, input: string): Promise<{ isCorrect: boolean; feedback?: string }> => {
            attemptsRef.current += 1;

            // Preview grading: local normalized compare against the draft facit.
            // (Students get the full CAS pipeline — this approximates it.)
            if (preview) {
                const draft = preview.steps.find((s) => s.id === stepId);
                const isCorrect = !!draft && normalizeAnswer(input) === normalizeAnswer(draft.correctAnswer);
                if (isCorrect) {
                    setDoneAnswers((prev) => new Map(prev).set(stepId, input));
                }
                return {
                    isCorrect,
                    feedback: isCorrect ? undefined : 'Inte riktigt — (förhandsgranskning: enkel jämförelse, studenter får CAS-rättning).',
                };
            }

            const result = await checkStep({ stepId, questionId, topicId, studentInput: input, sessionId });

            if (!result.ok) {
                return { isCorrect: false, feedback: result.error };
            }

            if (onMasteryChange) {
                onMasteryChange({
                    value: result.newMastery,
                    phase: result.fadePhase,
                    phaseChanged: result.phaseChanged,
                });
            }

            if (result.isCorrect) {
                setDoneAnswers((prev) => {
                    const next = new Map(prev).set(stepId, input);
                    return next;
                });
            }

            return { isCorrect: result.isCorrect, feedback: result.feedback };
        },
        [questionId, topicId, sessionId, onMasteryChange, preview]
    );

    // Completion: every step is either prefilled or answered
    const remainingSteps = steps.filter((s) => !prefilledIds.has(s.id) && !doneAnswers.has(s.id));
    useEffect(() => {
        if (isLoading || steps.length === 0 || remainingSteps.length > 0 || completedRef.current) return;
        completedRef.current = true;
        setIsComplete(true);
        if (!preview) {
            recordQuestionCompleted({
                sessionId,
                questionId,
                topicId,
                totalAttempts: Math.max(1, attemptsRef.current),
                helpLevelReached,
            }).catch(() => { /* telemetry only */ });
        }
        onComplete();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [remainingSteps.length, isLoading, steps.length]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white p-8 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
                <Loader2 className="h-4 w-4 animate-spin" />
                Laddar lösningssteg…
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700 dark:border-orange-700 dark:bg-orange-500/10 dark:text-orange-300">
                {loadError}
            </div>
        );
    }

    // Worked lines in step order: fade-prefilled (with explanation) and answered (with the student's answer)
    const workedLines = steps.filter((s) => prefilledIds.has(s.id) || doneAnswers.has(s.id));

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]">
                <MathRenderer text={questionText} className="text-base text-[var(--foreground)] [text-wrap:pretty]" />
                {questionMath && <MathRenderer text={questionMath} block className="mt-2" />}
            </div>

            {workedLines.length > 0 && (
                <div className="space-y-2">
                    <p className="px-1 text-xs font-semibold uppercase tracking-widest text-[var(--foreground-subtle)]">
                        {prefilledIds.size > 0 ? 'Visade steg — läs och förstå' : 'Dina klara steg'}
                    </p>
                    {/* Notebook page: worked lines sit on parchment behind an ink margin rule */}
                    <div className="overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--background-alt)]">
                        {workedLines.map((step, i) => {
                            const studentAnswer = doneAnswers.get(step.id);
                            return (
                                <motion.div
                                    key={step.id}
                                    initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={reduceMotion ? { duration: 0 } : focusSpring}
                                    className={`relative py-3.5 pl-12 pr-4 ${i > 0 ? 'border-t border-[var(--border-light)]' : ''}`}
                                >
                                    {/* Margin rule + step marker */}
                                    <span className="absolute inset-y-0 left-8 w-px bg-[var(--border-medium)]" />
                                    <span className={`absolute left-2.5 top-3.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold tabular-nums ${
                                        studentAnswer
                                            ? 'bg-[var(--success-500)] text-white'
                                            : 'bg-[var(--foreground)] text-[var(--surface)]'
                                    }`}>
                                        {studentAnswer ? <CheckCircle className="h-3 w-3" /> : step.stepNumber}
                                    </span>
                                    <p className="text-sm font-medium text-[var(--foreground)]">
                                        {step.instruction}
                                    </p>
                                    {step.displayLatex && (
                                        <MathRenderer text={step.displayLatex} block className="my-2 text-[var(--foreground)]" />
                                    )}
                                    {studentAnswer ? (
                                        <p className="mt-1 font-mono text-sm text-[var(--success-600)]">
                                            Ditt svar: {studentAnswer}
                                        </p>
                                    ) : (
                                        step.explanation && (
                                            <p className="mt-1 text-sm leading-6 text-[var(--foreground-muted)] [text-wrap:pretty]">
                                                {step.explanation}
                                            </p>
                                        )
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {isComplete ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: reduceMotion ? 0 : motionDuration.correct }}
                    className="rounded-2xl border border-[var(--border-light)] bg-[var(--surface)] p-6 text-center shadow-[var(--shadow-sm)]"
                >
                    <CheckCircle className="mx-auto mb-3 h-10 w-10 text-[var(--success-500)]" />
                    <p className="text-lg font-semibold text-[var(--foreground)] [text-wrap:balance]">
                        Alla steg klara
                    </p>
                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                        Du löste <span className="tabular-nums">{doneAnswers.size}</span> av{' '}
                        <span className="tabular-nums">{steps.length}</span> steg själv.
                    </p>
                </motion.div>
            ) : (
                remainingSteps.length > 0 && (
                    <div className="space-y-2">
                        <p className="px-1 text-xs font-semibold uppercase tracking-widest text-[var(--foreground-subtle)]">
                            Din tur
                        </p>
                        <StepRenderer
                            steps={remainingSteps.map((s) => ({ ...s, revealed: true }))}
                            onStepSubmit={handleStepSubmit}
                        />
                    </div>
                )
            )}
        </div>
    );
}
