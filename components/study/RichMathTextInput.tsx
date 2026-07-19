'use client';

import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Bold, CheckCircle2, Italic, List, Sigma, SquareFunction, WholeWord } from 'lucide-react';
import { validateStudentAnswer } from '@/lib/study/answer-validation';
import { MarkdownMessage } from '@/components/ui/MarkdownMessage';
import type {
    RichMathTextAnswerConfig,
    RichMathTextAnswerPayload,
    RichMathTextGradingConfig,
    RichMathToolbarAction,
} from '@/types/study';

interface RichMathTextQuestionLike {
    id: string;
    type: 'rich_math_text';
    topicId: string;
    difficulty: number;
    correctAnswer?: unknown;
    answerConfig?: RichMathTextAnswerConfig | null;
    gradingConfig?: RichMathTextGradingConfig | null;
}

interface RichMathTextInputProps {
    question: RichMathTextQuestionLike;
    onAnswer: (answer: RichMathTextAnswerPayload, isCorrect: boolean) => void;
}

const DEFAULT_TOOLBAR: RichMathToolbarAction[] = [
    { id: 'bold', label: 'Fet', snippet: '**text**' },
    { id: 'italic', label: 'Kursiv', snippet: '*text*' },
    { id: 'bullet', label: 'Lista', snippet: '- punkt' },
    { id: 'inline_math', label: 'Inline-matte', snippet: '$x^2$' },
    { id: 'block_math', label: 'Blockmatte', snippet: '\n$$\n\\frac{a}{b}\n$$\n' },
    { id: 'fraction', label: 'Bråk', snippet: '\\frac{a}{b}' },
    { id: 'sqrt', label: 'Rot', snippet: '\\sqrt{x}' },
    { id: 'matrix', label: 'Matris', snippet: '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}' },
];

const TOOLBAR_ICONS = {
    bold: Bold,
    italic: Italic,
    bullet: List,
    inline_math: Sigma,
    block_math: SquareFunction,
    fraction: WholeWord,
    sqrt: Sigma,
    matrix: SquareFunction,
} as const;

export function RichMathTextInput({ question, onAnswer }: RichMathTextInputProps) {
    const answerConfig = question.answerConfig ?? {};
    const toolbar = answerConfig.toolbar?.length ? answerConfig.toolbar : DEFAULT_TOOLBAR;
    const requireFinalAnswer = answerConfig.requireFinalAnswer ?? true;
    const workingPlaceholder = answerConfig.workingPlaceholder ?? 'Skriv mellanled, resonemang eller notation här…';
    const finalAnswerPlaceholder = answerConfig.finalAnswerPlaceholder ?? 'Slutsvar';

    const [content, setContent] = useState('');
    const [finalAnswer, setFinalAnswer] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [activeField, setActiveField] = useState<'content' | 'final'>('content');
    const contentRef = useRef<HTMLTextAreaElement | null>(null);
    const finalRef = useRef<HTMLInputElement | null>(null);

    const previewSource = useMemo(() => {
        if (!content.trim() && !finalAnswer.trim()) return '*Förhandsgranskningen visas här när studenten börjar skriva.*';
        const answerBlock = finalAnswer.trim()
            ? `\n\n### Slutsvar\n$${finalAnswer.trim()}$`
            : '';
        return `${content.trim() || '*Inga mellanled ännu.*'}${answerBlock}`;
    }, [content, finalAnswer]);

    const insertSnippet = (snippet: string) => {
        const isContentTarget = activeField === 'content';
        const target = isContentTarget ? contentRef.current : finalRef.current;
        if (!target || isSubmitted) return;

        const start = target.selectionStart ?? target.value.length;
        const end = target.selectionEnd ?? target.value.length;
        const value = target.value;
        const next = `${value.slice(0, start)}${snippet}${value.slice(end)}`;

        if (isContentTarget) {
            setContent(next);
        } else {
            setFinalAnswer(next);
        }

        requestAnimationFrame(() => {
            target.focus();
            const cursor = start + snippet.length;
            target.setSelectionRange(cursor, cursor);
        });
    };

    const handleSubmit = () => {
        const payload: RichMathTextAnswerPayload = {
            mode: 'rich_math_text',
            content,
            finalAnswer: finalAnswer.trim() || undefined,
        };
        const isCorrect = validateStudentAnswer(question, payload, question.correctAnswer);
        setIsSubmitted(true);
        onAnswer(payload, isCorrect);
    };

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 px-4 py-3">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Rik matematisk text</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Kombinera resonemang, Markdown och LaTeX. Verktygsraden lägger in vanliga matematikblock utan att studenten behöver memorera syntax.
                </p>
            </div>

            <div className="flex flex-wrap gap-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3">
                {toolbar.map((action) => {
                    const Icon = TOOLBAR_ICONS[action.id];
                    return (
                        <button
                            key={action.id}
                            type="button"
                            onClick={() => insertSnippet(action.snippet)}
                            disabled={isSubmitted}
                            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-blue-400 hover:text-blue-600 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200"
                        >
                            <Icon className="w-4 h-4" />
                            {action.label}
                        </button>
                    );
                })}
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
                <div className="space-y-4">
                    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
                        <label className="mb-2 block text-sm font-semibold text-zinc-900 dark:text-zinc-100">Arbetsyta</label>
                        <textarea
                            ref={contentRef}
                            value={content}
                            disabled={isSubmitted}
                            onFocus={() => setActiveField('content')}
                            onChange={(event) => setContent(event.target.value)}
                            rows={10}
                            placeholder={workingPlaceholder}
                            className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:text-zinc-100 placeholder:text-zinc-400"
                        />
                    </div>

                    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
                        <label className="mb-2 block text-sm font-semibold text-zinc-900 dark:text-zinc-100">Slutsvar</label>
                        <input
                            ref={finalRef}
                            type="text"
                            value={finalAnswer}
                            disabled={isSubmitted}
                            onFocus={() => setActiveField('final')}
                            onChange={(event) => setFinalAnswer(event.target.value)}
                            placeholder={finalAnswerPlaceholder}
                            className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-4 py-3 font-mono text-base text-zinc-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:text-zinc-100 placeholder:text-zinc-400"
                        />
                        {requireFinalAnswer && (
                            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                                Slutsvaret används för automatisk rättning. Arbetsytan sparar resonemanget.
                            </p>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">Förhandsgranskning</p>
                    <div className="prose max-w-none text-sm text-zinc-800 dark:text-zinc-200">
                        <MarkdownMessage content={previewSource} />
                    </div>
                </div>
            </div>

            <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitted || (requireFinalAnswer && !finalAnswer.trim())}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-semibold transition-colors ${
                    isSubmitted
                        ? 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                        : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-zinc-300 disabled:text-zinc-500'
                }`}
            >
                <CheckCircle2 className="w-4 h-4" />
                Skicka svar
            </motion.button>
        </div>
    );
}

export default RichMathTextInput;
