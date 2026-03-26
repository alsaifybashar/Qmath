'use client';

/**
 * MathCASInput — A CAS-powered math answer input.
 *
 * Features:
 * - Inline live KaTeX preview as the student types
 * - Pre-parser that accepts informal notation (2x, x^2, 2(x+1), sin x …)
 * - CAS grading via /api/grade-math (symbolic equivalence, not string matching)
 * - Feedback tree that explains *why* the answer is wrong
 * - Shortcut buttons for common symbols (π, ^, √, ÷, ±)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check, X, Loader2, AlertCircle, ChevronRight, RotateCcw, Info,
} from 'lucide-react';
import { toDisplayLatex } from '@/lib/math/pre-parser';

// KaTeX for rendering (avoid SSR issues)
let katex: typeof import('katex') | null = null;
if (typeof window !== 'undefined') {
    import('katex').then((m) => { katex = m.default ?? m; });
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type CASQuestionType = 'integral' | 'derivative' | 'algebra' | 'other';

export interface MathCASInputProps {
    /** Displayed question text (LaTeX supported via $$…$$) */
    questionText: string;
    /** The correct answer (e.g. "x^2 + C", "2*x", "(x+1)^2") */
    correctAnswer: string;
    /** Whether to accept any antiderivative (±C) */
    ignoreConstant?: boolean;
    /** Context for the feedback tree */
    questionType?: CASQuestionType;
    /** Called when student submits (isCorrect, studentInput) */
    onAnswer: (studentInput: string, isCorrect: boolean) => void;
    disabled?: boolean;
}

// ── Palette ───────────────────────────────────────────────────────────────────

const C = {
    bg: '#FAFAFA',
    surface: '#FFFFFF',
    border: '#E4E7F1',
    text: '#1A1D2E',
    textMuted: '#9CA3AF',
    blue: '#3B82F6',
    green: '#22C55E',
    red: '#EF4444',
    amber: '#F59E0B',
};

// ── Symbol shortcuts ──────────────────────────────────────────────────────────

const SYMBOLS = [
    { label: 'π', value: 'pi' },
    { label: '√', value: 'sqrt(' },
    { label: 'x²', value: 'x^2' },
    { label: 'eˣ', value: 'e^x' },
    { label: '±', value: '±' },
    { label: '÷', value: '/' },
    { label: '∞', value: 'Infinity' },
];

// ── KaTeX preview component ───────────────────────────────────────────────────

function LatexPreview({ input }: { input: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const latex = toDisplayLatex(input);

    useEffect(() => {
        if (!ref.current || !katex) return;
        try {
            katex.render(latex || '\\phantom{x}', ref.current, {
                throwOnError: false,
                displayMode: false,
                output: 'html',
            });
        } catch {
            if (ref.current) ref.current.textContent = input;
        }
    }, [latex, input]);

    return (
        <div
            ref={ref}
            className="min-h-[1.5em] text-lg font-serif"
            style={{ color: C.text }}
        />
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MathCASInput({
    questionText,
    correctAnswer,
    ignoreConstant = false,
    questionType = 'other',
    onAnswer,
    disabled = false,
}: MathCASInputProps) {
    const [value, setValue] = useState('');
    const [state, setState] = useState<'idle' | 'checking' | 'correct' | 'wrong'>('idle');
    const [feedback, setFeedback] = useState<{ message: string; hint?: string } | null>(null);
    const [parsedPreview, setParsedPreview] = useState('');
    const [showHint, setShowHint] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Reset when correct answer changes (new question)
    useEffect(() => {
        setValue('');
        setState('idle');
        setFeedback(null);
        setShowHint(false);
        setParsedPreview('');
    }, [correctAnswer]);

    // Debounced preview update
    useEffect(() => {
        if (previewTimer.current) clearTimeout(previewTimer.current);
        previewTimer.current = setTimeout(() => {
            setParsedPreview(value);
        }, 120);
        return () => { if (previewTimer.current) clearTimeout(previewTimer.current); };
    }, [value]);

    const insertSymbol = useCallback((sym: string) => {
        const el = inputRef.current;
        if (!el) return;
        const start = el.selectionStart ?? value.length;
        const end = el.selectionEnd ?? value.length;
        const next = value.slice(0, start) + sym + value.slice(end);
        setValue(next);
        // Restore cursor after the inserted text
        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(start + sym.length, start + sym.length);
        });
    }, [value]);

    const handleSubmit = useCallback(async () => {
        if (!value.trim() || state === 'checking' || disabled) return;
        setState('checking');
        setFeedback(null);
        setShowHint(false);

        try {
            const res = await fetch('/api/grade-math', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentInput: value,
                    correctAnswer,
                    ignoreConstant,
                    questionType,
                }),
            });
            const data = await res.json();

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
            setFeedback({ message: 'Något gick fel. Försök igen.' });
            onAnswer(value, false);
        }
    }, [value, state, disabled, correctAnswer, ignoreConstant, questionType, onAnswer]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSubmit();
    };

    const handleReset = () => {
        setValue('');
        setState('idle');
        setFeedback(null);
        setShowHint(false);
        setParsedPreview('');
        inputRef.current?.focus();
    };

    const borderColor = state === 'correct' ? C.green : state === 'wrong' ? C.red : C.border;
    const isSubmitted = state === 'correct' || state === 'wrong';

    return (
        <div
            className="rounded-2xl overflow-hidden"
            style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: '0 2px 12px rgba(26,29,46,0.06)' }}
        >
            {/* ── Symbol shortcuts ── */}
            <div className="flex items-center gap-1.5 px-4 pt-3 pb-2 flex-wrap">
                {SYMBOLS.map((s) => (
                    <button
                        key={s.label}
                        onClick={() => insertSymbol(s.value)}
                        disabled={isSubmitted || disabled}
                        className="px-2.5 py-1 text-sm rounded-lg border transition-all hover:border-blue-400 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ borderColor: C.border, color: C.text, background: C.bg, fontFamily: 'serif' }}
                        title={`Infoga: ${s.value}`}
                    >
                        {s.label}
                    </button>
                ))}
                <div className="ml-auto text-xs" style={{ color: C.textMuted }}>
                    Använd <code className="bg-zinc-100 px-1 rounded">*</code> för multiplikation
                </div>
            </div>

            {/* ── Input area ── */}
            <div className="px-4 pb-3">
                <div
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
                    style={{
                        background: C.bg,
                        border: `2px solid ${borderColor}`,
                        transition: 'border-color 0.2s',
                    }}
                >
                    {/* Live KaTeX preview */}
                    <div className="flex-1 min-w-0">
                        {parsedPreview ? (
                            <LatexPreview input={parsedPreview} />
                        ) : (
                            <span className="text-base" style={{ color: C.textMuted }}>
                                Skriv ditt svar här…
                            </span>
                        )}
                    </div>

                    {/* State indicator */}
                    <div className="shrink-0">
                        {state === 'checking' && (
                            <Loader2 size={20} className="animate-spin" style={{ color: C.blue }} />
                        )}
                        {state === 'correct' && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-7 h-7 rounded-full flex items-center justify-center"
                                style={{ background: C.green }}
                            >
                                <Check size={14} className="text-white" />
                            </motion.div>
                        )}
                        {state === 'wrong' && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-7 h-7 rounded-full flex items-center justify-center"
                                style={{ background: C.red }}
                            >
                                <X size={14} className="text-white" />
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Hidden real input */}
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => !isSubmitted && !disabled && setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSubmitted || disabled}
                    className="sr-only"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="Svar…"
                />

                {/* Visible text input (mirrors the hidden one for UX) */}
                <div className="mt-2">
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => !isSubmitted && !disabled && setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isSubmitted || disabled}
                        className="w-full px-4 py-2 rounded-lg text-sm font-mono border outline-none transition-all focus:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ borderColor: C.border, background: 'white', color: C.text }}
                        placeholder="t.ex.  x^2 + C  eller  2*x + 1"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                    />
                </div>
            </div>

            {/* ── Feedback ── */}
            <AnimatePresence>
                {state === 'wrong' && feedback && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div
                            className="mx-4 mb-3 px-4 py-3 rounded-xl text-sm"
                            style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}
                        >
                            <div className="flex items-start gap-2">
                                <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-medium text-amber-900">{feedback.message}</p>
                                    {feedback.hint && showHint && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-1 text-amber-700"
                                        >
                                            {feedback.hint}
                                        </motion.p>
                                    )}
                                    {feedback.hint && !showHint && (
                                        <button
                                            onClick={() => setShowHint(true)}
                                            className="mt-1 flex items-center gap-1 text-amber-700 hover:text-amber-900 transition-colors"
                                        >
                                            <Info size={13} />
                                            <span>Visa tips</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Actions ── */}
            <div className="px-4 pb-4 flex items-center gap-2">
                {!isSubmitted ? (
                    <button
                        onClick={handleSubmit}
                        disabled={!value.trim() || state === 'checking' || disabled}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0"
                        style={{ background: value.trim() ? C.blue : C.textMuted }}
                    >
                        {state === 'checking' ? (
                            <>
                                <Loader2 size={15} className="animate-spin" />
                                Kontrollerar…
                            </>
                        ) : (
                            <>
                                Svara
                                <ChevronRight size={15} />
                            </>
                        )}
                    </button>
                ) : (
                    <>
                        {state === 'wrong' && (
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:bg-zinc-50"
                                style={{ borderColor: C.border, color: C.text }}
                            >
                                <RotateCcw size={14} />
                                Försök igen
                            </button>
                        )}
                        {state === 'correct' && (
                            <div
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                                style={{ background: '#F0FDF4', color: C.green }}
                            >
                                <Check size={15} />
                                Rätt svar!
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
