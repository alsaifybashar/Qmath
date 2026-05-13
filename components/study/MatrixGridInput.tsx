'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Grid2x2Plus, Grid2x2X, Minus, Plus } from 'lucide-react';
import { MathRenderer } from './MathRenderer';
import { validateStudentAnswer } from '@/lib/study/answer-validation';
import type {
    MatrixGridAnswerConfig,
    MatrixGridAnswerPayload,
    MatrixGridGradingConfig,
    MatrixPresentationMode,
} from '@/types/study';

interface MatrixGridQuestionLike {
    id: string;
    type: 'matrix_grid';
    topicId: string;
    difficulty: number;
    correctAnswer?: unknown;
    answerConfig?: MatrixGridAnswerConfig | null;
    gradingConfig?: MatrixGridGradingConfig | null;
}

interface MatrixGridInputProps {
    question: MatrixGridQuestionLike;
    onAnswer: (answer: MatrixGridAnswerPayload, isCorrect: boolean) => void;
}

function buildMatrix(rows: number, cols: number, existing?: string[][]): string[][] {
    return Array.from({ length: rows }, (_, rowIndex) =>
        Array.from({ length: cols }, (_, colIndex) => existing?.[rowIndex]?.[colIndex] ?? ''),
    );
}

function clampDimension(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function getPresentation(answerConfig: MatrixGridAnswerConfig, rows: number, cols: number): MatrixPresentationMode {
    if (answerConfig.presentation) return answerConfig.presentation;
    if (rows === 1 && cols > 1) return 'row_vector';
    if (cols === 1 && rows > 1) return 'column_vector';
    return 'matrix';
}

function toMatrixLatex(values: string[][], presentation: MatrixPresentationMode): string {
    const body = values
        .map((row) => row.map((cell) => cell.trim() || '\\square').join(' & '))
        .join(' \\\\ ');
    const environment = presentation === 'matrix' ? 'bmatrix' : 'pmatrix';
    return `\\begin{${environment}}${body}\\end{${environment}}`;
}

export function MatrixGridInput({ question, onAnswer }: MatrixGridInputProps) {
    const answerConfig = question.answerConfig ?? {};
    const gradingConfig = question.gradingConfig ?? { expectedValues: [] };
    const expectedRows = gradingConfig.expectedValues?.length || 2;
    const expectedCols = gradingConfig.expectedValues?.[0]?.length || 2;

    const minRows = answerConfig.minRows ?? 1;
    const maxRows = answerConfig.maxRows ?? Math.max(expectedRows, 6);
    const minCols = answerConfig.minCols ?? 1;
    const maxCols = answerConfig.maxCols ?? Math.max(expectedCols, 6);
    const allowResize = answerConfig.allowResize ?? true;
    const placeholder = answerConfig.placeholder ?? '0';

    const [rows, setRows] = useState(clampDimension(answerConfig.initialRows ?? expectedRows, minRows, maxRows));
    const [cols, setCols] = useState(clampDimension(answerConfig.initialCols ?? expectedCols, minCols, maxCols));
    const [values, setValues] = useState<string[][]>(() => buildMatrix(rows, cols));
    const [isSubmitted, setIsSubmitted] = useState(false);
    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    useEffect(() => {
        const nextRows = clampDimension(answerConfig.initialRows ?? expectedRows, minRows, maxRows);
        const nextCols = clampDimension(answerConfig.initialCols ?? expectedCols, minCols, maxCols);
        setRows(nextRows);
        setCols(nextCols);
        setValues(buildMatrix(nextRows, nextCols));
        setIsSubmitted(false);
    }, [question.id, answerConfig.initialRows, answerConfig.initialCols, expectedRows, expectedCols, minRows, maxRows, minCols, maxCols]);

    const presentation = getPresentation(answerConfig, rows, cols);
    const previewLatex = useMemo(() => toMatrixLatex(values, presentation), [presentation, values]);
    const openingBracket = presentation === 'matrix' ? '[' : '(';
    const closingBracket = presentation === 'matrix' ? ']' : ')';
    const surfaceLabel = presentation === 'matrix'
        ? 'Matrisinmatning'
        : presentation === 'row_vector'
            ? 'Radvektor'
            : 'Kolumnvektor';

    const focusCell = (row: number, col: number) => {
        const next = inputRefs.current[`${row}:${col}`];
        next?.focus();
        next?.select();
    };

    const resizeMatrix = (nextRows: number, nextCols: number) => {
        setRows(nextRows);
        setCols(nextCols);
        setValues((current) => buildMatrix(nextRows, nextCols, current));
    };

    const adjustRows = (delta: number) => {
        const nextRows = clampDimension(rows + delta, minRows, maxRows);
        if (nextRows !== rows) resizeMatrix(nextRows, cols);
    };

    const adjustCols = (delta: number) => {
        const nextCols = clampDimension(cols + delta, minCols, maxCols);
        if (nextCols !== cols) resizeMatrix(rows, nextCols);
    };

    const updateCell = (rowIndex: number, colIndex: number, value: string) => {
        setValues((current) => {
            const next = current.map((row) => [...row]);
            next[rowIndex][colIndex] = value;
            return next;
        });
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
        if (event.key === 'ArrowRight' && colIndex < cols - 1) {
            event.preventDefault();
            focusCell(rowIndex, colIndex + 1);
        }
        if (event.key === 'ArrowLeft' && colIndex > 0) {
            event.preventDefault();
            focusCell(rowIndex, colIndex - 1);
        }
        if (event.key === 'ArrowDown' && rowIndex < rows - 1) {
            event.preventDefault();
            focusCell(rowIndex + 1, colIndex);
        }
        if (event.key === 'ArrowUp' && rowIndex > 0) {
            event.preventDefault();
            focusCell(rowIndex - 1, colIndex);
        }
        if (event.key === 'Tab' && !event.shiftKey && rowIndex === rows - 1 && colIndex === cols - 1 && allowResize) {
            event.preventDefault();
            if (presentation === 'row_vector' && cols < maxCols) {
                const nextCols = clampDimension(cols + 1, minCols, maxCols);
                resizeMatrix(rows, nextCols);
                requestAnimationFrame(() => focusCell(rowIndex, nextCols - 1));
                return;
            }

            if (presentation === 'column_vector' && rows < maxRows) {
                const nextRows = clampDimension(rows + 1, minRows, maxRows);
                resizeMatrix(nextRows, cols);
                requestAnimationFrame(() => focusCell(nextRows - 1, colIndex));
                return;
            }

            if (rows < maxRows) {
                const nextRows = clampDimension(rows + 1, minRows, maxRows);
                resizeMatrix(nextRows, cols);
                requestAnimationFrame(() => focusCell(nextRows - 1, 0));
            }
        }
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>, startRow: number, startCol: number) => {
        const raw = event.clipboardData.getData('text/plain');
        if (!raw) return;

        const pastedRows = raw
            .trim()
            .split(/\r?\n/)
            .map((line) => line.split('\t').map((cell) => cell.trim()));

        if (!pastedRows.length) return;

        event.preventDefault();

        const neededRows = Math.min(maxRows, Math.max(rows, startRow + pastedRows.length));
        const neededCols = Math.min(maxCols, Math.max(cols, startCol + Math.max(...pastedRows.map((row) => row.length))));

        if (allowResize) {
            resizeMatrix(neededRows, neededCols);
        }

        setValues((current) => {
            const next = buildMatrix(allowResize ? neededRows : rows, allowResize ? neededCols : cols, current);
            pastedRows.forEach((row, rowOffset) => {
                row.forEach((value, colOffset) => {
                    const targetRow = startRow + rowOffset;
                    const targetCol = startCol + colOffset;
                    if (targetRow < next.length && targetCol < next[targetRow].length) {
                        next[targetRow][targetCol] = value;
                    }
                });
            });
            return next;
        });
    };

    const handleSubmit = () => {
        const payload: MatrixGridAnswerPayload = {
            mode: 'matrix_grid',
            rows,
            cols,
            values,
        };
        const isCorrect = validateStudentAnswer(question, payload, question.correctAnswer);
        setIsSubmitted(true);
        onAnswer(payload, isCorrect);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 px-4 py-3">
                <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{surfaceLabel}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Tabba genom cellerna eller klistra in data direkt från kalkylblad.
                    </p>
                </div>

                {allowResize && (
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        <div className="flex items-center gap-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1">
                            <Grid2x2Plus className="w-4 h-4 text-zinc-500" />
                            <span className="text-zinc-500">Rader</span>
                            <button type="button" onClick={() => adjustRows(-1)} className="rounded-md p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800" disabled={rows <= minRows || isSubmitted}>
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-6 text-center font-semibold text-zinc-900 dark:text-zinc-100">{rows}</span>
                            <button type="button" onClick={() => adjustRows(1)} className="rounded-md p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800" disabled={rows >= maxRows || isSubmitted}>
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex items-center gap-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1">
                            <Grid2x2X className="w-4 h-4 text-zinc-500" />
                            <span className="text-zinc-500">Kolumner</span>
                            <button type="button" onClick={() => adjustCols(-1)} className="rounded-md p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800" disabled={cols <= minCols || isSubmitted}>
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-6 text-center font-semibold text-zinc-900 dark:text-zinc-100">{cols}</span>
                            <button type="button" onClick={() => adjustCols(1)} className="rounded-md p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800" disabled={cols >= maxCols || isSubmitted}>
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
                <div className="inline-flex items-center gap-2">
                    <div className="text-3xl text-zinc-300 dark:text-zinc-700">{openingBracket}</div>
                    <div className="space-y-2">
                        {values.map((row, rowIndex) => (
                            <div key={`row-${rowIndex}`} className="flex items-center gap-2">
                                {row.map((cell, colIndex) => (
                                    <input
                                        key={`cell-${rowIndex}-${colIndex}`}
                                        ref={(node) => {
                                            inputRefs.current[`${rowIndex}:${colIndex}`] = node;
                                        }}
                                        type="text"
                                        inputMode="text"
                                        value={cell}
                                        disabled={isSubmitted}
                                        onChange={(event) => updateCell(rowIndex, colIndex, event.target.value)}
                                        onKeyDown={(event) => handleKeyDown(event, rowIndex, colIndex)}
                                        onPaste={(event) => handlePaste(event, rowIndex, colIndex)}
                                        placeholder={placeholder}
                                        className="h-12 w-20 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 text-center font-mono text-base text-zinc-900 dark:text-zinc-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-zinc-300"
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className="text-3xl text-zinc-300 dark:text-zinc-700">{closingBracket}</div>
                </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">Förhandsgranskning</p>
                <div className="overflow-x-auto text-zinc-900 dark:text-zinc-100">
                    <MathRenderer text={previewLatex} block />
                </div>
            </div>

            <motion.button
                type="button"
                onClick={handleSubmit}
                whileHover={!isSubmitted ? { scale: 1.01 } : {}}
                whileTap={!isSubmitted ? { scale: 0.99 } : {}}
                disabled={isSubmitted}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-semibold transition-colors ${
                    isSubmitted
                        ? 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
            >
                <CheckCircle2 className="w-4 h-4" />
                {presentation === 'matrix' ? 'Skicka matris' : 'Skicka vektor'}
            </motion.button>
        </div>
    );
}

export default MatrixGridInput;
