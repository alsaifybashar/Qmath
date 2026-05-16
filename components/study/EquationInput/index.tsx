'use client';

/**
 * MathCASInput — Premium CAS-powered equation input component.
 *
 * Pipeline:
 *   Student types → live KaTeX preview → submits
 *   → POST /api/grade-math (pre-parser → mathjs Tier 1 → SymPy Tier 2)
 *   → Response tree determines WHY it's wrong
 *   → FeedbackRenderer shows tiered Swedish feedback
 *
 * Features:
 *   - Virtual keyboard (5 tab groups, 40+ keys)
 *   - Live KaTeX preview as student types (debounced 120ms)
 *   - Confidence slider before submission (1–5 scale)
 *   - Tiered animated feedback (correct / nearly-correct / wrong)
 *   - Parse preview: shows "Tolkades som: …" to build transparency
 *   - Accessibility: full keyboard navigation, aria labels
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, RotateCcw, Loader2, ChevronRight } from 'lucide-react';
import { toDisplayLatex } from '@/lib/math/pre-parser';
import { VirtualKeyboard } from './VirtualKeyboard';
import { FeedbackRenderer, type FeedbackData } from './FeedbackRenderer';

// Lazy-load KaTeX to avoid SSR issues
interface KatexLike {
    render(tex: string, element: HTMLElement, options?: { throwOnError?: boolean; displayMode?: boolean; output?: string }): void;
}
let katex: KatexLike | null = null;
if (typeof window !== 'undefined') {
    import('katex').then((m) => { katex = (m.default ?? m) as unknown as KatexLike; });
}

// ── Types ──────────────────────────────────────────────────────────────────────

export type CASQuestionType =
    | 'integral' | 'derivative' | 'algebra'
    | 'trigonometry' | 'limit' | 'series' | 'other';

export interface MathCASInputProps {
    /** The correct answer in mathjs-parseable notation */
    correctAnswer: string;
    /** Question metadata for the API */
    questionId?: string;
    topicId?: string;
    userId?: string;
    /** Whether to accept antiderivatives (±C) */
    ignoreConstant?: boolean;
    questionType?: CASQuestionType;
    /** Called when answer is submitted */
    onAnswer: (studentInput: string, isCorrect: boolean) => void;
    disabled?: boolean;
    /** Show the virtual keyboard by default */
    showKeyboard?: boolean;
}

// ── Live KaTeX preview ─────────────────────────────────────────────────────────

function LatexPreview({ input }: { input: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const latex = toDisplayLatex(input);

    useEffect(() => {
        if (!ref.current || !katex) return;
        try {
            katex.render(latex || '\\phantom{x}', ref.current, {
                throwOnError: false,
                displayMode: true,
                output: 'html',
            });
        } catch {
            if (ref.current) ref.current.textContent = input;
        }
    }, [latex, input]);

    return (
        <div
            ref={ref}
            className="min-h-[2.5em] flex items-center justify-center text-zinc-800 dark:text-zinc-100 text-lg"
        />
    );
}

// ── Confidence slider ─────────────────────────────────────────────────────────

const CONFIDENCE_LABELS = ['Gissar', 'Osäker', 'Hyfsat', 'Säker', 'Helt säker'];
const CONFIDENCE_COLORS = [
    'bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-lime-400', 'bg-emerald-400'
];

function ConfidenceSlider({
    value,
    onChange,
}: {
    value: number; // 1–5
    onChange: (v: number) => void;
}) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Hur säker är du på ditt svar?
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full text-white ${CONFIDENCE_COLORS[value - 1]}`}>
                    {CONFIDENCE_LABELS[value - 1]}
                </span>
            </div>
            <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((v) => (
                    <button
                        key={v}
                        onClick={() => onChange(v)}
                        className={`flex-1 h-2 rounded-full transition-all ${
                            v <= value
                                ? CONFIDENCE_COLORS[value - 1]
                                : 'bg-zinc-200 dark:bg-zinc-700'
                        }`}
                        aria-label={CONFIDENCE_LABELS[v - 1]}
                    />
                ))}
            </div>
        </div>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function MathCASInput({
    correctAnswer,
    questionId,
    topicId,
    userId,
    ignoreConstant = false,
    questionType = 'other',
    onAnswer,
    disabled = false,
    showKeyboard = true,
}: MathCASInputProps) {
    const [value, setValue] = useState('');
    const [parsedPreview, setParsedPreview] = useState('');
    const [state, setState] = useState<'idle' | 'checking' | 'correct' | 'wrong'>('idle');
    const [feedback, setFeedback] = useState<FeedbackData | null>(null);
    const [partialScore, setPartialScore] = useState(0);
    const [parsedStudent, setParsedStudent] = useState('');
    const [showKeyboardPanel, setShowKeyboardPanel] = useState(showKeyboard);
    const [confidence, setConfidence] = useState(3);
    const [showConfidence, setShowConfidence] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const startTimeRef = useRef<number>(Date.now());

    // Reset when question changes
    useEffect(() => {
        setValue('');
        setState('idle');
        setFeedback(null);
        setParsedPreview('');
        setParsedStudent('');
        setConfidence(3);
        setShowConfidence(false);
        setPartialScore(0);
        startTimeRef.current = Date.now();
        inputRef.current?.focus();
    }, [correctAnswer]);

    // Debounced live preview
    useEffect(() => {
        if (previewTimer.current) clearTimeout(previewTimer.current);
        previewTimer.current = setTimeout(() => setParsedPreview(value), 120);
        return () => { if (previewTimer.current) clearTimeout(previewTimer.current); };
    }, [value]);

    // Insert symbol at cursor position
    const insertSymbol = useCallback((sym: string) => {
        const el = inputRef.current;
        if (!el) return;
        const start = el.selectionStart ?? value.length;
        const end = el.selectionEnd ?? value.length;
        const next = value.slice(0, start) + sym + value.slice(end);
        setValue(next);
        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(start + sym.length, start + sym.length);
        });
    }, [value]);

    // Submit handler
    const handleSubmit = useCallback(async () => {
        if (!value.trim() || state === 'checking' || disabled) return;

        // Show confidence slider before final submission
        if (!showConfidence) {
            setShowConfidence(true);
            return;
        }

        setState('checking');
        setFeedback(null);

        try {
            const res = await fetch('/api/grade-math', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentInput: value,
                    correctAnswer,
                    questionId,
                    topicId,
                    userId,
                    ignoreConstant,
                    questionType,
                    confidenceRating: confidence,
                    timeTakenMs: Date.now() - startTimeRef.current,
                }),
            });

            const data = await res.json();

            setPartialScore(data.partialScore ?? 0);
            setParsedStudent(data.parsedStudent ?? '');

            if (data.isCorrect) {
                setState('correct');
                onAnswer(value, true);
            } else {
                setState('wrong');
                setFeedback(data.feedback ?? null);
                onAnswer(value, false);
            }
        } catch {
            setState('wrong');
            setFeedback({ code: 'unknown_error', message: 'Något gick fel — ladda om sidan.' });
            onAnswer(value, false);
        }
    }, [value, state, disabled, showConfidence, correctAnswer, questionId, topicId, userId, ignoreConstant, questionType, confidence, onAnswer]);

    const handleReset = () => {
        setValue('');
        setState('idle');
        setFeedback(null);
        setParsedPreview('');
        setParsedStudent('');
        setShowConfidence(false);
        setPartialScore(0);
        startTimeRef.current = Date.now();
        inputRef.current?.focus();
    };

    const isSubmitted = state === 'correct' || state === 'wrong';

    return (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">

            {/* ── Live KaTeX preview ── */}
            <div className="px-6 pt-5 pb-3 min-h-[5rem] bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-700/50 flex items-center justify-center">
                {parsedPreview ? (
                    <LatexPreview input={parsedPreview} />
                ) : (
                    <span className="text-zinc-400 dark:text-zinc-500 text-base italic">
                        Skriv ditt svar nedan…
                    </span>
                )}
            </div>

            {/* ── Text input row ── */}
            <div className="px-4 py-3 flex gap-2 items-center border-b border-zinc-100 dark:border-zinc-700/50">
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => !isSubmitted && !disabled && setValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSubmit();
                    }}
                    disabled={isSubmitted || disabled}
                    placeholder="t.ex.  x^2 + C  eller  sin(x)/2"
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-mono border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-label="Mata in matematisk ekvation"
                />

                {/* Keyboard toggle */}
                <button
                    onClick={() => setShowKeyboardPanel(v => !v)}
                    disabled={isSubmitted || disabled}
                    title="Visa/dölj tangentbord"
                    className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all disabled:opacity-40 ${
                        showKeyboardPanel
                            ? 'border-blue-400 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300'
                    }`}
                    aria-label="Symboler"
                >
                    ƒ(x)
                </button>
            </div>

            {/* ── Virtual keyboard (collapsible) ── */}
            <AnimatePresence>
                {showKeyboardPanel && !isSubmitted && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden border-b border-zinc-100 dark:border-zinc-700/50"
                    >
                        <div className="px-4 py-3">
                            <VirtualKeyboard
                                onInsert={insertSymbol}
                                disabled={isSubmitted || disabled}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Confidence slider (shown after first submit click) ── */}
            <AnimatePresence>
                {showConfidence && !isSubmitted && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-700/50 bg-zinc-50/60 dark:bg-zinc-800/30">
                            <ConfidenceSlider value={confidence} onChange={setConfidence} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Feedback ── */}
            <AnimatePresence mode="wait">
                {isSubmitted && (
                    <motion.div
                        key="feedback"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-700/50">
                            <FeedbackRenderer
                                isCorrect={state === 'correct'}
                                partialScore={partialScore}
                                feedback={feedback}
                                parsedStudent={state === 'wrong' ? parsedStudent : undefined}
                                onTryAgain={state === 'wrong' ? handleReset : undefined}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Actions ── */}
            <div className="px-4 py-3 flex items-center gap-2">
                {!isSubmitted ? (
                    <>
                        <button
                            onClick={handleSubmit}
                            disabled={!value.trim() || state === 'checking' || disabled}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                        >
                            {state === 'checking' ? (
                                <>
                                    <Loader2 size={15} className="animate-spin" />
                                    Kontrollerar…
                                </>
                            ) : showConfidence ? (
                                <>
                                    Bekräfta svar
                                    <Send size={14} />
                                </>
                            ) : (
                                <>
                                    Svara
                                    <ChevronRight size={15} />
                                </>
                            )}
                        </button>

                        {value && (
                            <button
                                onClick={handleReset}
                                className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                title="Rensa"
                                aria-label="Rensa svar"
                            >
                                <RotateCcw size={14} />
                            </button>
                        )}
                    </>
                ) : (
                    state === 'wrong' && (
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <RotateCcw size={14} />
                            Skriv om
                        </button>
                    )
                )}
            </div>
        </div>
    );
}
