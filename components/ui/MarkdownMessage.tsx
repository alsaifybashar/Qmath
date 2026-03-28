'use client';

/**
 * MarkdownMessage — renders AI chat responses with:
 *  - LaTeX math via KaTeX (inline $...$ and block $$...$$, also \(...\) / \[...\])
 *  - Markdown structure: **bold**, *italic*, `code`, ``` code blocks ```, numbered/bullet lists,
 *    headings (#–####), tables, horizontal rules (---), blockquotes (>)
 *  - Progressive disclosure for complex block math (>100 chars of LaTeX source)
 *  - Horizontal scroll on tables and code blocks for mobile safety
 *
 * Used in AIPanel for assistant message bubbles.
 */

import dynamic from 'next/dynamic';
import 'katex/dist/katex.min.css';
import { useState } from 'react';
import type { ReactNode } from 'react';

// Dynamically load KaTeX components to avoid SSR issues
const BlockMath = dynamic(
    () => import('react-katex').then((mod) => mod.BlockMath),
    { ssr: false, loading: () => <span className="text-zinc-400 dark:text-zinc-500 text-xs italic">…</span> }
);
const InlineMath = dynamic(
    () => import('react-katex').then((mod) => mod.InlineMath),
    { ssr: false }
);

// ── Token types ───────────────────────────────────────────────────────────────

type Token =
    | { type: 'text'; content: string }
    | { type: 'inline-math'; content: string }
    | { type: 'block-math'; content: string }
    | { type: 'code-block'; lang: string; content: string };

// ── Tokenizer ─────────────────────────────────────────────────────────────────
// Order: code blocks first (so $ inside ``` isn't parsed as math),
// then block math ($$), then inline math ($).

function tokenize(text: string): Token[] {
    // eslint-disable-next-line no-useless-escape
    const PATTERN = /(```[\w]*\n[\s\S]*?```|\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^\$\n]{1,400}?\$|\\\([\s\S]{0,400}?\\\))/g;
    const tokens: Token[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = PATTERN.exec(text)) !== null) {
        if (match.index > lastIndex) {
            tokens.push({ type: 'text', content: text.slice(lastIndex, match.index) });
        }
        const raw = match[0];

        if (raw.startsWith('```')) {
            const firstNewline = raw.indexOf('\n');
            const lang = firstNewline > 3 ? raw.slice(3, firstNewline).trim() : '';
            const content = firstNewline !== -1 ? raw.slice(firstNewline + 1, -3).trim() : raw.slice(3, -3).trim();
            tokens.push({ type: 'code-block', lang, content });
        } else if (raw.startsWith('$$') || raw.startsWith('\\[')) {
            tokens.push({ type: 'block-math', content: raw.slice(2, -2).trim() });
        } else {
            // $...$ or \(...\)
            tokens.push({ type: 'inline-math', content: raw.startsWith('\\(') ? raw.slice(2, -2).trim() : raw.slice(1, -1).trim() });
        }
        lastIndex = match.index + raw.length;
    }

    if (lastIndex < text.length) {
        tokens.push({ type: 'text', content: text.slice(lastIndex) });
    }
    return tokens;
}

// ── Inline markdown renderer ──────────────────────────────────────────────────
// Handles **bold**, *italic*, `code` within a single line.

function renderInline(text: string): ReactNode {
    const INLINE_RE = /(`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g;
    const parts: ReactNode[] = [];
    let lastIdx = 0;
    let m: RegExpExecArray | null;

    while ((m = INLINE_RE.exec(text)) !== null) {
        if (m.index > lastIdx) parts.push(text.slice(lastIdx, m.index));
        const raw = m[0];
        if (raw.startsWith('`')) {
            parts.push(
                <code
                    key={m.index}
                    className="px-1.5 py-0.5 bg-[var(--code-bg-light)] dark:bg-[var(--code-bg)] text-[var(--code-text-light)] dark:text-[var(--code-text)] rounded text-[0.8em] font-mono leading-none"
                >
                    {raw.slice(1, -1)}
                </code>
            );
        } else if (raw.startsWith('**')) {
            parts.push(<strong key={m.index} className="font-semibold text-[var(--foreground)]">{raw.slice(2, -2)}</strong>);
        } else {
            parts.push(<em key={m.index} className="italic text-[var(--foreground-muted)]">{raw.slice(1, -1)}</em>);
        }
        lastIdx = m.index + raw.length;
    }
    if (lastIdx < text.length) parts.push(text.slice(lastIdx));

    return parts.length === 0
        ? null
        : parts.length === 1 && typeof parts[0] === 'string'
            ? parts[0]
            : <>{parts}</>;
}

// ── Table renderer ────────────────────────────────────────────────────────────
// Parses GFM-style | col | col | table rows into a scrollable <table>.

function renderTable(lines: string[], keyPrefix: number): ReactNode {
    const separatorRe = /^[-: ]+$/;
    const rows = lines
        .filter(l => l.trim().startsWith('|'))
        .map(l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()));

    // Remove separator rows (e.g. | --- | --- |)
    const tableRows = rows.filter(row => !row.every(cell => separatorRe.test(cell)));
    if (tableRows.length === 0) return null;

    const [headerRow, ...bodyRows] = tableRows;

    return (
        <div key={keyPrefix} className="my-3 overflow-x-auto rounded-lg border border-[var(--glass-border)] shadow-[var(--shadow-sm)]">
            <table className="min-w-full text-sm border-collapse">
                <thead className="bg-[var(--surface-hover)]">
                    <tr>
                        {headerRow.map((cell, ci) => (
                            <th key={ci} className="px-3 py-2 text-left font-semibold text-[var(--foreground)] border-b border-[var(--glass-border)] whitespace-nowrap">
                                {renderInline(cell)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {bodyRows.map((row, ri) => (
                        <tr key={ri} className={ri % 2 === 0 ? 'bg-[var(--surface)]' : 'bg-[var(--surface-hover)]/50'}>
                            {row.map((cell, ci) => (
                                <td key={ci} className="px-3 py-2 text-[var(--foreground-muted)] border-b border-[var(--glass-border)]">
                                    {renderInline(cell)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ── Block text renderer ───────────────────────────────────────────────────────
// Turns a plain-text block (no math/code) into structured paragraphs and lists.

function renderTextBlock(text: string): ReactNode {
    if (!text) return null;

    const lines = text.split('\n');
    const elements: ReactNode[] = [];
    let i = 0;
    let key = 0;

    while (i < lines.length) {
        const line = lines[i];

        // Blank line → small spacer
        if (line.trim() === '') {
            if (i > 0 && i < lines.length - 1) {
                elements.push(<div key={`gap_${key++}`} className="h-1.5" />);
            }
            i++;
            continue;
        }

        // Horizontal rule  (--- / *** / ___ on its own line)
        if (/^[-*_]{3,}\s*$/.test(line.trim())) {
            elements.push(<hr key={`hr_${key++}`} className="my-3 border-zinc-200 dark:border-zinc-700" />);
            i++;
            continue;
        }

        // Markdown headings  (# / ## / ### / ####)
        const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const headingText = headingMatch[2];
            if (level === 1) {
                elements.push(
                    <h1 key={`h1_${key++}`} className="text-2xl font-bold mt-6 mb-2 leading-tight bg-gradient-to-r from-violet-600 to-blue-500 dark:from-violet-400 dark:to-blue-400 bg-clip-text text-transparent">
                        {renderInline(headingText)}
                    </h1>
                );
            } else if (level === 2) {
                elements.push(
                    <h2 key={`h2_${key++}`} className="text-lg font-bold mt-5 mb-1.5 leading-tight text-[var(--foreground)] flex items-center gap-2">
                        <span className="inline-block w-1 h-5 rounded-full bg-gradient-to-b from-violet-500 to-blue-500 flex-shrink-0" />
                        {renderInline(headingText)}
                    </h2>
                );
            } else if (level === 3) {
                elements.push(
                    <h3 key={`h3_${key++}`} className="text-base font-semibold mt-4 mb-1 leading-snug text-[var(--foreground)]">
                        {renderInline(headingText)}
                    </h3>
                );
            } else {
                elements.push(
                    <h4 key={`h4_${key++}`} className="text-sm font-semibold mt-3 mb-0.5 leading-snug text-[var(--foreground-muted)] uppercase tracking-wide">
                        {renderInline(headingText)}
                    </h4>
                );
            }
            i++;
            continue;
        }

        // Table  — collect consecutive | lines
        if (line.trim().startsWith('|')) {
            const tableLines: string[] = [];
            while (i < lines.length && lines[i].trim().startsWith('|')) {
                tableLines.push(lines[i]);
                i++;
            }
            const tableNode = renderTable(tableLines, key++);
            if (tableNode) elements.push(tableNode);
            continue;
        }

        // Numbered list  (1. / 1) )
        if (/^\d+[\.\)]\s/.test(line)) {
            const items: string[] = [];
            while (i < lines.length && /^\d+[\.\)]\s/.test(lines[i])) {
                items.push(lines[i].replace(/^\d+[\.\)]\s+/, ''));
                i++;
            }
            elements.push(
                <ol key={`ol_${key++}`} className="list-decimal list-outside ml-5 space-y-1.5 my-3 text-[var(--foreground)] leading-relaxed">
                    {items.map((item, idx) => (
                        <li key={idx} className="pl-1">{renderInline(item)}</li>
                    ))}
                </ol>
            );
            continue;
        }

        // Bullet list  (- / * / •)
        if (/^[-*•]\s/.test(line)) {
            const items: string[] = [];
            while (i < lines.length && /^[-*•]\s/.test(lines[i])) {
                items.push(lines[i].replace(/^[-*•]\s+/, ''));
                i++;
            }
            elements.push(
                <ul key={`ul_${key++}`} className="list-disc list-outside ml-5 space-y-1.5 my-3 text-[var(--foreground)] leading-relaxed">
                    {items.map((item, idx) => (
                        <li key={idx} className="pl-1">{renderInline(item)}</li>
                    ))}
                </ul>
            );
            continue;
        }

        // Blockquote  (> ...)
        if (line.startsWith('> ') || line === '>') {
            const quoteLines: string[] = [];
            while (i < lines.length && (lines[i].startsWith('> ') || lines[i] === '>')) {
                quoteLines.push(lines[i].replace(/^>\s?/, ''));
                i++;
            }
            elements.push(
                <blockquote key={`bq_${key++}`} className="my-3 pl-4 pr-3 py-2.5 border-l-[3px] border-violet-500 bg-violet-50/60 dark:bg-violet-500/[0.07] rounded-r-lg text-[var(--foreground)] not-italic">
                    {quoteLines.map((ql, idx) => (
                        <span key={idx} className="block leading-relaxed">
                            {renderInline(ql)}
                        </span>
                    ))}
                </blockquote>
            );
            continue;
        }

        // Regular line — collect consecutive plain lines into a paragraph
        const plainLines: string[] = [];
        while (
            i < lines.length &&
            lines[i].trim() !== '' &&
            !/^(#{1,4}\s|[-*•]\s|\d+[\.\)]\s|> |>\s*$|[-*_]{3,}\s*$|\|)/.test(lines[i])
        ) {
            plainLines.push(lines[i]);
            i++;
        }
        if (plainLines.length > 0) {
            elements.push(
                <p key={`p_${key++}`} className="leading-relaxed text-[var(--foreground)] my-1.5">
                    {plainLines.map((pl, idx) => (
                        <span key={idx}>
                            {renderInline(pl)}
                            {idx < plainLines.length - 1 && <br />}
                        </span>
                    ))}
                </p>
            );
        }
    }

    return elements.length > 0 ? <>{elements}</> : null;
}

// ── Progressive disclosure for complex block math ─────────────────────────────
// Formulas with >100 chars of LaTeX source start collapsed to avoid overwhelming
// beginners (Bayes, binomial distribution, etc.). A clear toggle reveals them.

function CollapsibleBlockMath({ math }: { math: string }) {
    const isComplex = math.length > 100;
    const [open, setOpen] = useState(!isComplex);

    if (!isComplex) {
        return (
            <div className="my-3 overflow-x-auto text-center">
                <BlockMath math={math} />
            </div>
        );
    }

    return (
        <div className="my-3">
            <button
                onClick={() => setOpen(v => !v)}
                className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 mb-1 cursor-pointer"
                aria-expanded={open}
            >
                <span>{open ? '▾' : '▸'}</span>
                <span>{open ? 'Dölj formel' : 'Visa formel'}</span>
            </button>
            {open && (
                <div className="overflow-x-auto text-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <BlockMath math={math} />
                </div>
            )}
        </div>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface MarkdownMessageProps {
    /** Raw text from the AI — may contain LaTeX delimiters and markdown */
    content: string;
    /** Additional Tailwind classes applied to the wrapper div */
    className?: string;
}

export function MarkdownMessage({ content, className = '' }: MarkdownMessageProps) {
    const tokens = tokenize(content);

    return (
        <div className={`leading-relaxed ${className}`}>
            {tokens.map((token, i) => {
                if (token.type === 'block-math') {
                    return <CollapsibleBlockMath key={i} math={token.content} />;
                }
                if (token.type === 'inline-math') {
                    return <InlineMath key={i} math={token.content} />;
                }
                if (token.type === 'code-block') {
                    return (
                        <div key={i} className="my-3 rounded-lg overflow-hidden border border-[var(--code-border)] shadow-[var(--shadow-sm)]">
                            {token.lang && (
                                <div className="px-3 py-1.5 text-xs text-[var(--foreground-subtle)] bg-[var(--surface-elevated)] border-b border-[var(--code-border)] font-mono tracking-wide">
                                    {token.lang}
                                </div>
                            )}
                            <pre className="p-4 text-sm text-[var(--code-text-light)] dark:text-[var(--code-text)] bg-[var(--code-bg-light)] dark:bg-[var(--code-bg)] overflow-x-auto leading-relaxed">
                                <code>{token.content}</code>
                            </pre>
                        </div>
                    );
                }
                const rendered = renderTextBlock(token.content);
                return rendered ? <span key={i}>{rendered}</span> : null;
            })}
        </div>
    );
}
