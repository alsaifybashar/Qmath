'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
    AlertCircle, Info, Lightbulb, BookOpen, FileText,
    Terminal, CheckCircle2,
} from 'lucide-react';
import type { ArticleBlock as ArticleBlockType } from '@/types/articles';
import 'katex/dist/katex.min.css';

// KaTeX loaded lazily — avoids SSR hydration issues with math rendering
const BlockMath = dynamic(() => import('react-katex').then(m => m.BlockMath), { ssr: false });
const InlineMath = dynamic(() => import('react-katex').then(m => m.InlineMath), { ssr: false });

// ── Design tokens (refined for comfortable reading) ─────────────────────────
const C = {
    text:       '#1A1D2E',    // headings, emphasis
    body:       '#374151',    // body text — dark enough for long reading
    textSec:    '#6B7194',    // secondary prose
    textMuted:  '#9CA3AF',    // captions, muted UI
    blue:       '#4361EE',
    purple:     '#7C5CFC',
    blueLight:  '#EEF1FF',
    blueBorder: '#D6DAFB',
    border:     '#E5E7EB',
    surfaceAlt: '#F9FAFB',
    latexBg:    '#FAFBFF',    // very-subtle blue tint for math
    latexBorder:'#E8ECFC',
};

// ── Inline Markdown Renderer ─────────────────────────────────────────────────
// Handles: inline math ($…$), bold, italic, inline code, links.
// No dangerouslySetInnerHTML, no eval — safe by construction.

function InlineMarkdown({ text }: { text: string }) {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    const patterns: Array<{
        re: RegExp;
        render: (match: string, ...groups: string[]) => React.ReactNode;
    }> = [
        // Inline math: $...$
        {
            re: /\$(.+?)\$/,
            render: (_, formula) => <InlineMath key={key++} math={formula} />,
        },
        // Bold: **...**
        {
            re: /\*\*(.+?)\*\*/,
            render: (_, inner) => (
                <strong key={key++} className="font-semibold" style={{ color: C.text }}>
                    {inner}
                </strong>
            ),
        },
        // Italic: *...*
        {
            re: /\*(.+?)\*/,
            render: (_, inner) => <em key={key++} className="italic">{inner}</em>,
        },
        // Inline code: `...`
        {
            re: /`(.+?)`/,
            render: (_, inner) => (
                <code
                    key={key++}
                    className="px-1.5 py-0.5 rounded text-[0.9em] font-mono"
                    style={{
                        background: '#F3F4F6',
                        color: '#4B5563',
                        border: '1px solid #E5E7EB',
                    }}
                >
                    {inner}
                </code>
            ),
        },
        // Links: [label](url)
        {
            re: /\[(.+?)\]\((https?:\/\/[^\s)]+)\)/,
            render: (_, label, url) => (
                <a
                    key={key++}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 decoration-[#D6DAFB] hover:decoration-[#4361EE] transition-colors"
                    style={{ color: C.blue }}
                >
                    {label}
                </a>
            ),
        },
    ];

    while (remaining.length > 0) {
        let earliest: {
            index: number;
            match: RegExpExecArray;
            render: (m: string, ...g: string[]) => React.ReactNode;
        } | null = null;

        for (const { re, render } of patterns) {
            const m = re.exec(remaining);
            if (m && (earliest === null || m.index < earliest.index)) {
                earliest = { index: m.index, match: m, render };
            }
        }

        if (!earliest) {
            parts.push(remaining);
            break;
        }

        if (earliest.index > 0) parts.push(remaining.slice(0, earliest.index));
        parts.push(earliest.render(earliest.match[0], ...earliest.match.slice(1)));
        remaining = remaining.slice(earliest.index + earliest.match[0].length);
    }

    return <>{parts}</>;
}

// ── Markdown Segment Parser ──────────────────────────────────────────────────
// Parses a text block's markdown string into structured segments for rich
// rendering: paragraphs, ordered/unordered lists, and blockquotes.

type Segment =
    | { type: 'paragraph'; lines: string[] }
    | { type: 'ordered-list'; items: string[] }
    | { type: 'unordered-list'; items: string[] }
    | { type: 'blockquote'; lines: string[] };

function parseTextToSegments(text: string): Segment[] {
    const segments: Segment[] = [];
    const lines = text.split('\n');
    let i = 0;

    while (i < lines.length) {
        const trimmed = lines[i].trim();

        // Skip empty lines
        if (!trimmed) { i++; continue; }

        // ── Ordered list: 1. / 2. / etc ──────────────────────────────────
        if (/^\d+\.\s/.test(trimmed)) {
            const items: string[] = [];
            while (i < lines.length) {
                const l = lines[i].trim();
                if (/^\d+\.\s/.test(l)) {
                    items.push(l.replace(/^\d+\.\s/, ''));
                    i++;
                } else if (
                    !l &&
                    i + 1 < lines.length &&
                    /^\d+\.\s/.test(lines[i + 1]?.trim() ?? '')
                ) {
                    i++; // skip blank line between consecutive numbered items
                } else {
                    break;
                }
            }
            segments.push({ type: 'ordered-list', items });
            continue;
        }

        // ── Unordered list: - or * ───────────────────────────────────────
        if (/^[-*]\s/.test(trimmed)) {
            const items: string[] = [];
            while (i < lines.length) {
                const l = lines[i].trim();
                if (/^[-*]\s/.test(l)) {
                    items.push(l.replace(/^[-*]\s/, ''));
                    i++;
                } else if (
                    !l &&
                    i + 1 < lines.length &&
                    /^[-*]\s/.test(lines[i + 1]?.trim() ?? '')
                ) {
                    i++;
                } else {
                    break;
                }
            }
            segments.push({ type: 'unordered-list', items });
            continue;
        }

        // ── Blockquote: > ────────────────────────────────────────────────
        if (/^>\s?/.test(trimmed)) {
            const qLines: string[] = [];
            while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
                qLines.push(lines[i].trim().replace(/^>\s?/, ''));
                i++;
            }
            segments.push({ type: 'blockquote', lines: qLines });
            continue;
        }

        // ── Regular paragraph ────────────────────────────────────────────
        const paraLines: string[] = [];
        while (i < lines.length) {
            const l = lines[i].trim();
            if (!l) { i++; break; }
            if (/^\d+\.\s/.test(l) || /^[-*]\s/.test(l) || /^>\s?/.test(l)) break;
            paraLines.push(lines[i]);
            i++;
        }
        if (paraLines.length > 0) {
            segments.push({ type: 'paragraph', lines: paraLines });
        }
    }

    return segments;
}

// ── Text Block Renderer ──────────────────────────────────────────────────────
// Renders a text block's markdown with full support for paragraphs, ordered
// lists (numbered steps — essential for math articles), unordered lists
// (definitions, bullet points), and blockquotes (exam questions).

function TextBlockRenderer({ markdown }: { markdown: string }) {
    const segments = useMemo(() => parseTextToSegments(markdown), [markdown]);

    return (
        <div style={{ color: C.body, fontSize: '16px', lineHeight: '1.8' }}>
            {segments.map((seg, i) => {
                switch (seg.type) {
                    case 'paragraph':
                        return (
                            <p key={i} className="my-4 first:mt-0 last:mb-0">
                                {seg.lines.map((line, j) => (
                                    <span key={j}>
                                        <InlineMarkdown text={line} />
                                        {j < seg.lines.length - 1 && <br />}
                                    </span>
                                ))}
                            </p>
                        );

                    case 'ordered-list':
                        return (
                            <ol key={i} className="my-5 space-y-3 first:mt-0 last:mb-0">
                                {seg.items.map((item, j) => (
                                    <li key={j} className="flex gap-3.5 items-start">
                                        <span
                                            className="flex-shrink-0 w-[26px] h-[26px] rounded-full flex items-center justify-center font-semibold mt-[3px]"
                                            style={{
                                                background: C.blueLight,
                                                color: C.blue,
                                                fontSize: '12px',
                                                border: `1px solid ${C.blueBorder}`,
                                            }}
                                        >
                                            {j + 1}
                                        </span>
                                        <span className="flex-1 min-w-0 pt-[2px]">
                                            <InlineMarkdown text={item} />
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        );

                    case 'unordered-list':
                        return (
                            <ul key={i} className="my-5 space-y-2.5 first:mt-0 last:mb-0">
                                {seg.items.map((item, j) => (
                                    <li key={j} className="flex gap-3 items-start pl-1">
                                        <span
                                            className="flex-shrink-0 w-[7px] h-[7px] rounded-full mt-[9px]"
                                            style={{
                                                background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`,
                                            }}
                                        />
                                        <span className="flex-1 min-w-0">
                                            <InlineMarkdown text={item} />
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        );

                    case 'blockquote':
                        return (
                            <blockquote
                                key={i}
                                className="my-5 pl-5 py-2 first:mt-0 last:mb-0"
                                style={{
                                    borderLeft: `3px solid ${C.blueBorder}`,
                                    color: C.textSec,
                                }}
                            >
                                {seg.lines.map((line, j) => (
                                    <p key={j} className="my-1">
                                        <InlineMarkdown text={line} />
                                    </p>
                                ))}
                            </blockquote>
                        );

                    default:
                        return null;
                }
            })}
        </div>
    );
}

// ── Multi-line callout text renderer ─────────────────────────────────────────
// Supports paragraphs, line breaks, and inline math within callout bodies.

function CalloutTextRenderer({ text }: { text: string }) {
    const paragraphs = text.split(/\n\n+/);
    return (
        <div style={{ fontSize: '15px', lineHeight: '1.7', color: C.body }}>
            {paragraphs.map((para, i) => {
                const lines = para.split('\n');
                return (
                    <p key={i} className="my-2 first:mt-0 last:mb-0">
                        {lines.map((line, j) => (
                            <span key={j}>
                                <InlineMarkdown text={line} />
                                {j < lines.length - 1 && <br />}
                            </span>
                        ))}
                    </p>
                );
            })}
        </div>
    );
}

// ── Callout styles ───────────────────────────────────────────────────────────
const calloutConfig: Record<string, {
    icon: typeof Info;
    bg: string;
    border: string;
    iconColor: string;
    iconBg: string;
    label: string;
}> = {
    info:       { icon: Info,           bg: '#EFF6FF', border: '#BFDBFE', iconColor: '#3B82F6', iconBg: '#DBEAFE', label: 'Info' },
    warning:    { icon: AlertCircle,    bg: '#FFFBEB', border: '#FDE68A', iconColor: '#D97706', iconBg: '#FEF3C7', label: 'Observera' },
    tip:        { icon: Lightbulb,      bg: '#ECFDF5', border: '#A7F3D0', iconColor: '#059669', iconBg: '#D1FAE5', label: 'Tips' },
    example:    { icon: BookOpen,       bg: '#F5F3FF', border: '#DDD6FE', iconColor: '#7C3AED', iconBg: '#EDE9FE', label: 'Exempel' },
    definition: { icon: FileText,       bg: '#ECFEFF', border: '#A5F3FC', iconColor: '#0891B2', iconBg: '#CFFAFE', label: 'Definition' },
    success:    { icon: CheckCircle2,   bg: '#F0FDF4', border: '#BBF7D0', iconColor: '#16A34A', iconBg: '#DCFCE7', label: 'Svar' },
};

// ── Main Block Renderer ──────────────────────────────────────────────────────
export function ArticleBlock({ block, index }: { block: ArticleBlockType; index?: number }) {
    switch (block.type) {
        // ── Headings ─────────────────────────────────────────────────────
        case 'heading': {
            const headingId = index !== undefined ? `heading-${index}` : undefined;
            const Tag = `h${block.level}` as 'h2' | 'h3' | 'h4';

            if (block.level === 2) {
                return (
                    <Tag
                        id={headingId}
                        className="flex items-start gap-3 mt-14 mb-5 pb-3 first:mt-0 scroll-mt-6"
                        style={{
                            color: C.text,
                            fontSize: '28px',
                            fontWeight: 700,
                            lineHeight: '1.3',
                            borderBottom: `2px solid ${C.blueLight}`,
                        }}
                    >
                        <span
                            className="flex-shrink-0 w-1 self-stretch rounded-full mt-1"
                            style={{
                                background: `linear-gradient(to bottom, ${C.blue}, ${C.purple})`,
                                minHeight: '24px',
                            }}
                        />
                        {block.text}
                    </Tag>
                );
            }

            if (block.level === 3) {
                return (
                    <Tag
                        id={headingId}
                        className="mt-10 mb-4 scroll-mt-6"
                        style={{
                            color: C.text,
                            fontSize: '22px',
                            fontWeight: 600,
                            lineHeight: '1.35',
                        }}
                    >
                        {block.text}
                    </Tag>
                );
            }

            // H4
            return (
                <Tag
                    id={headingId}
                    className="mt-8 mb-3 scroll-mt-6"
                    style={{
                        color: C.text,
                        fontSize: '18px',
                        fontWeight: 500,
                        lineHeight: '1.4',
                    }}
                >
                    {block.text}
                </Tag>
            );
        }

        // ── Text ─────────────────────────────────────────────────────────
        case 'text':
            return <TextBlockRenderer markdown={block.markdown} />;

        // ── LaTeX ────────────────────────────────────────────────────────
        case 'latex':
            return (
                <div className="my-7">
                    <div
                        className="overflow-x-auto py-6 px-6 rounded-xl"
                        style={{
                            background: C.latexBg,
                            border: `1px solid ${C.latexBorder}`,
                        }}
                    >
                        <BlockMath math={block.formula} />
                    </div>
                    {block.caption && (
                        <p
                            className="text-center mt-3 italic"
                            style={{ color: C.textMuted, fontSize: '13px' }}
                        >
                            {block.caption}
                        </p>
                    )}
                </div>
            );

        // ── Image ────────────────────────────────────────────────────────
        case 'image':
            return (
                <figure className="my-8">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={block.url}
                        alt={block.alt}
                        className="w-full rounded-xl object-contain max-h-[520px]"
                        style={{
                            border: `1px solid ${C.border}`,
                            boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
                        }}
                        loading="lazy"
                    />
                    {block.caption && (
                        <figcaption
                            className="text-center mt-3 italic"
                            style={{ color: C.textMuted, fontSize: '13px' }}
                        >
                            {block.caption}
                        </figcaption>
                    )}
                </figure>
            );

        // ── Callout ──────────────────────────────────────────────────────
        case 'callout': {
            const cfg = calloutConfig[block.variant] ?? calloutConfig.info;
            const Icon = cfg.icon;
            return (
                <div
                    className="my-7 rounded-xl overflow-hidden"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                >
                    <div className="flex items-start gap-3.5 p-5">
                        <div
                            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
                            style={{ background: cfg.iconBg }}
                        >
                            <Icon
                                className="w-[18px] h-[18px]"
                                style={{ color: cfg.iconColor }}
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p
                                className="font-semibold mb-1.5"
                                style={{ color: cfg.iconColor, fontSize: '14px' }}
                            >
                                {block.title ?? cfg.label}
                            </p>
                            <CalloutTextRenderer text={block.text} />
                        </div>
                    </div>
                </div>
            );
        }

        // ── Divider ──────────────────────────────────────────────────────
        case 'divider':
            return (
                <div className="my-10 flex items-center justify-center">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.border }} />
                        <span className="w-12 h-px" style={{ background: C.border }} />
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.border }} />
                        <span className="w-12 h-px" style={{ background: C.border }} />
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.border }} />
                    </div>
                </div>
            );

        // ── Code ─────────────────────────────────────────────────────────
        case 'code':
            return (
                <div
                    className="my-7 rounded-xl overflow-hidden"
                    style={{ border: `1px solid ${C.border}` }}
                >
                    <div
                        className="flex items-center gap-2 px-4 py-2.5"
                        style={{
                            background: '#F9FAFB',
                            borderBottom: `1px solid ${C.border}`,
                        }}
                    >
                        <Terminal className="w-3.5 h-3.5" style={{ color: C.textMuted }} />
                        <span
                            className="font-mono font-medium uppercase tracking-wider"
                            style={{ color: C.textMuted, fontSize: '11px' }}
                        >
                            {block.language}
                        </span>
                    </div>
                    <pre
                        className="p-5 overflow-x-auto"
                        style={{ background: '#FAFAFA', fontSize: '14px' }}
                    >
                        <code
                            className="font-mono"
                            style={{ color: '#1F2937', lineHeight: '1.7' }}
                        >
                            {block.code}
                        </code>
                    </pre>
                </div>
            );

        default:
            return null;
    }
}

// ── Full article content renderer ────────────────────────────────────────────
export function ArticleContent({ blocks }: { blocks: ArticleBlockType[] }) {
    return (
        <div className="article-content">
            {blocks.map((block, i) => (
                <ArticleBlock key={i} block={block} index={i} />
            ))}
        </div>
    );
}

// ── Table of Contents (auto-generated from heading blocks) ───────────────────
export function TableOfContents({ blocks }: { blocks: ArticleBlockType[] }) {
    const headings = blocks
        .map((block, index) => {
            if (block.type === 'heading') {
                return { level: block.level, text: block.text, index };
            }
            return null;
        })
        .filter(Boolean) as Array<{ level: 2 | 3 | 4; text: string; index: number }>;

    // Only render ToC for articles with enough headings
    if (headings.length < 3) return null;

    return (
        <nav
            className="rounded-xl overflow-hidden"
            style={{ background: C.surfaceAlt, border: `1px solid ${C.border}` }}
        >
            <div
                className="px-5 py-3"
                style={{ borderBottom: `1px solid ${C.border}` }}
            >
                <p
                    className="font-semibold uppercase tracking-wider"
                    style={{ color: C.textMuted, fontSize: '11px' }}
                >
                    Innehåll
                </p>
            </div>
            <ul className="px-5 py-3 space-y-1">
                {headings.map((h, i) => (
                    <li
                        key={i}
                        style={{
                            paddingLeft:
                                h.level === 3 ? '14px' : h.level === 4 ? '28px' : '0',
                        }}
                    >
                        <a
                            href={`#heading-${h.index}`}
                            className="block py-1 transition-colors hover:text-[#4361EE]"
                            style={{
                                color: h.level === 2 ? C.text : C.textSec,
                                fontSize: h.level === 2 ? '13px' : '12px',
                                fontWeight: h.level === 2 ? 600 : 400,
                                lineHeight: '1.4',
                            }}
                        >
                            {h.text}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
