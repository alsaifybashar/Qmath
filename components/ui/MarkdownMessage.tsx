'use client';

/**
 * MarkdownMessage — renders AI chat responses with:
 *  - LaTeX math via KaTeX (inline $...$ and block $$...$$, also \(...\) / \[...\])
 *  - Markdown structure: **bold**, *italic*, `code`, numbered/bullet lists
 *
 * Used in AIPanel for assistant message bubbles.
 */

import dynamic from 'next/dynamic';
import 'katex/dist/katex.min.css';
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
    | { type: 'block-math'; content: string };

// ── Tokenizer ─────────────────────────────────────────────────────────────────
// Extracts math segments first; remaining text goes through markdown rendering.
// Pattern order matters: $$ before $ to avoid partial matching.

function tokenize(text: string): Token[] {
    // eslint-disable-next-line no-useless-escape
    const MATH_RE = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^\$\n]{1,400}?\$|\\\([\s\S]{0,400}?\\\))/g;
    const tokens: Token[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = MATH_RE.exec(text)) !== null) {
        if (match.index > lastIndex) {
            tokens.push({ type: 'text', content: text.slice(lastIndex, match.index) });
        }
        const raw = match[0];
        if (raw.startsWith('$$')) {
            tokens.push({ type: 'block-math', content: raw.slice(2, -2).trim() });
        } else if (raw.startsWith('\\[')) {
            tokens.push({ type: 'block-math', content: raw.slice(2, -2).trim() });
        } else if (raw.startsWith('\\(')) {
            tokens.push({ type: 'inline-math', content: raw.slice(2, -2).trim() });
        } else {
            // $...$
            tokens.push({ type: 'inline-math', content: raw.slice(1, -1).trim() });
        }
        lastIndex = match.index + raw.length;
    }

    if (lastIndex < text.length) {
        tokens.push({ type: 'text', content: text.slice(lastIndex) });
    }
    return tokens;
}

// ── Inline markdown renderer ──────────────────────────────────────────────────
// Handles **bold**, *italic*, `code` within a single line of text.

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
                    className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded text-[0.8em] font-mono leading-none"
                >
                    {raw.slice(1, -1)}
                </code>
            );
        } else if (raw.startsWith('**')) {
            parts.push(<strong key={m.index} className="font-semibold">{raw.slice(2, -2)}</strong>);
        } else {
            parts.push(<em key={m.index} className="italic">{raw.slice(1, -1)}</em>);
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

// ── Block text renderer ───────────────────────────────────────────────────────
// Turns a plain-text block (no math) into structured paragraphs and lists.

function renderTextBlock(text: string): ReactNode {
    if (!text) return null;

    const lines = text.split('\n');
    const elements: ReactNode[] = [];
    let i = 0;
    let key = 0;

    while (i < lines.length) {
        const line = lines[i];

        // Blank line → small spacer (only between real content)
        if (line.trim() === '') {
            if (i > 0 && i < lines.length - 1) {
                elements.push(<div key={`gap_${key++}`} className="h-1.5" />);
            }
            i++;
            continue;
        }

        // Markdown headings  (# / ## / ### / ####)
        const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const text = headingMatch[2];
            const headingStyles: Record<number, string> = {
                1: 'text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-4 mb-1.5 leading-tight',
                2: 'text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-3 mb-1 leading-tight',
                3: 'text-lg font-semibold text-zinc-800 dark:text-zinc-200 mt-2.5 mb-0.5 leading-snug',
                4: 'text-base font-semibold text-zinc-800 dark:text-zinc-200 mt-2 mb-0.5 leading-snug',
            };
            const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4';
            elements.push(
                <Tag key={`h${level}_${key++}`} className={headingStyles[level]}>
                    {renderInline(text)}
                </Tag>
            );
            i++;
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
                <ol key={`ol_${key++}`} className="list-decimal list-outside ml-5 space-y-1 my-2">
                    {items.map((item, idx) => (
                        <li key={idx}>{renderInline(item)}</li>
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
                <ul key={`ul_${key++}`} className="list-disc list-outside ml-5 space-y-1 my-2">
                    {items.map((item, idx) => (
                        <li key={idx}>{renderInline(item)}</li>
                    ))}
                </ul>
            );
            continue;
        }

        // Regular line — add <br> if followed by another regular line
        const nextLine = lines[i + 1];
        const nextIsBlank = !nextLine || nextLine.trim() === '';
        const nextIsList = nextLine && (/^\d+[\.\)]\s/.test(nextLine) || /^[-*•]\s/.test(nextLine));
        const nextIsHeading = nextLine && /^#{1,4}\s/.test(nextLine);

        elements.push(
            <span key={`ln_${key++}`}>
                {renderInline(line)}
                {!nextIsBlank && !nextIsList && !nextIsHeading && i < lines.length - 1 && <br />}
            </span>
        );
        i++;
    }

    return elements.length > 0 ? <>{elements}</> : null;
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
                    return (
                        <div key={i} className="my-3 overflow-x-auto text-center">
                            <BlockMath math={token.content} />
                        </div>
                    );
                }
                if (token.type === 'inline-math') {
                    return <InlineMath key={i} math={token.content} />;
                }
                const rendered = renderTextBlock(token.content);
                return rendered ? <span key={i}>{rendered}</span> : null;
            })}
        </div>
    );
}
