'use client';

import { useState, useCallback, useRef, useEffect, useTransition, type KeyboardEvent } from 'react';
import dynamic from 'next/dynamic';
import {
    Plus, Trash2, GripVertical, Save, Loader2,
    Heading2, Heading3, Heading4, AlignLeft, Sigma, Image, AlertCircle,
    Minus, Code, ChevronDown, ChevronUp, Check
} from 'lucide-react';
import type { ArticleBlock, ArticleStatus, LatexBlock, ImageBlock, CalloutBlock, CodeBlock, HeadingBlock, TextBlock } from '@/types/articles';
import { ArticleBlock as ArticleBlockRenderer } from './ArticleBlock';
import 'katex/dist/katex.min.css';

const BlockMath = dynamic(() => import('react-katex').then(m => m.BlockMath), { ssr: false });

// ── Design tokens (dashboard palette) ────────────────────────────────────────
const C = {
    text: '#1A1D2E',
    textSec: '#6B7194',
    textMuted: '#A0A5C0',
    blue: '#4361EE',
    purple: '#7C5CFC',
    blueLight: '#EEF1FF',
    blueBorder: '#D6DAFB',
    bg: '#F0F2F8',
    surface: '#FFFFFF',
    surfaceAlt: '#F7F8FC',
    border: '#EFF1F8',
    borderDark: '#E2E5F0',
};

// ── Slash command menu items ─────────────────────────────────────────────────
const SLASH_COMMANDS = [
    { type: 'text',     label: 'Text',           desc: 'Vanlig text med formatering',     icon: AlignLeft,   defaultValue: { type: 'text', markdown: '' } as TextBlock },
    { type: 'heading2', label: 'Rubrik H2',      desc: 'Stor sektionsrubrik',             icon: Heading2,    defaultValue: { type: 'heading', level: 2, text: '' } as HeadingBlock },
    { type: 'heading3', label: 'Rubrik H3',      desc: 'Underrubrik',                     icon: Heading3,    defaultValue: { type: 'heading', level: 3, text: '' } as HeadingBlock },
    { type: 'heading4', label: 'Rubrik H4',      desc: 'Liten rubrik',                    icon: Heading4,    defaultValue: { type: 'heading', level: 4, text: '' } as HeadingBlock },
    { type: 'latex',    label: 'Formel (LaTeX)',  desc: 'Matematisk formel med KaTeX',     icon: Sigma,       defaultValue: { type: 'latex', display: 'block', formula: '', caption: '' } as LatexBlock },
    { type: 'image',    label: 'Bild',            desc: 'Bild via URL (HTTPS)',             icon: Image,       defaultValue: { type: 'image', url: '', alt: '', caption: '' } as ImageBlock },
    { type: 'callout',  label: 'Ruta',            desc: 'Info, tips, varning, exempel',     icon: AlertCircle, defaultValue: { type: 'callout', variant: 'info', title: '', text: '' } as CalloutBlock },
    { type: 'code',     label: 'Kodblock',        desc: 'Kod med syntaxmarkering',          icon: Code,        defaultValue: { type: 'code', language: 'python', code: '' } as CodeBlock },
    { type: 'divider',  label: 'Avdelare',        desc: 'Horisontell linje',               icon: Minus,       defaultValue: { type: 'divider' } as ArticleBlock },
] as const;

// ── Inline Block Editor ──────────────────────────────────────────────────────
function InlineBlockEditor({
    block,
    isFocused,
    onFocus,
    onChange,
    onDelete,
    onInsertAfter,
    onKeyDown,
}: {
    block: ArticleBlock;
    isFocused: boolean;
    onFocus: () => void;
    onChange: (b: ArticleBlock) => void;
    onDelete: () => void;
    onInsertAfter: () => void;
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
}) {
    const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);

    useEffect(() => {
        if (isFocused && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isFocused]);

    const inputClass = "w-full px-3 py-2.5 bg-white border rounded-xl text-sm placeholder:text-[#A0A5C0] outline-none transition-all focus:ring-2 focus:ring-[#4361EE]/30 focus:border-[#4361EE]";
    const inputStyle = { color: C.text, borderColor: C.border };

    // ── Preview mode (unfocused) ─────────────────────────────────────────────
    if (!isFocused) {
        const isEmpty = (
            (block.type === 'text' && !block.markdown.trim()) ||
            (block.type === 'heading' && !block.text.trim()) ||
            (block.type === 'latex' && !block.formula.trim()) ||
            (block.type === 'image' && !block.url.trim()) ||
            (block.type === 'callout' && !block.text.trim()) ||
            (block.type === 'code' && !block.code.trim()) ||
            false // divider is never "empty"
        );

        if (isEmpty) {
            const placeholders: Record<string, string> = {
                text: 'Klicka för att skriva text...',
                heading: 'Klicka för att skriva rubrik...',
                latex: 'Klicka för att lägga till formel...',
                image: 'Klicka för att lägga till bild...',
                callout: 'Klicka för att skriva i rutan...',
                code: 'Klicka för att lägga till kod...',
                divider: '',
            };
            if (block.type === 'divider') {
                return <hr className="my-4" style={{ borderColor: C.border }} />;
            }
            return (
                <div
                    className="py-3 px-1 cursor-text text-sm italic"
                    style={{ color: C.textMuted }}
                    onClick={onFocus}
                >
                    {placeholders[block.type]}
                </div>
            );
        }

        return (
            <div className="cursor-text" onClick={onFocus}>
                <ArticleBlockRenderer block={block} />
            </div>
        );
    }

    // ── Edit mode (focused) ──────────────────────────────────────────────────
    switch (block.type) {
        case 'heading':
            return (
                <input
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    type="text"
                    value={block.text}
                    onChange={e => onChange({ ...block, text: e.target.value })}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            onInsertAfter();
                        }
                        onKeyDown(e);
                    }}
                    placeholder={block.level === 2 ? 'Stor rubrik...' : block.level === 3 ? 'Underrubrik...' : 'Liten rubrik...'}
                    className={`w-full px-1 py-2 bg-transparent border-none outline-none ${
                        block.level === 2 ? 'text-2xl font-bold' : block.level === 3 ? 'text-xl font-semibold' : 'text-lg font-medium'
                    }`}
                    style={{ color: C.text }}
                />
            );

        case 'text':
            return (
                <textarea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                    value={block.markdown}
                    onChange={e => onChange({ ...block, markdown: e.target.value })}
                    onKeyDown={onKeyDown}
                    placeholder="Skriv text... (**fet**, *kursiv*, $formel$, 1. numrerad lista, - punktlista, > citat)"
                    rows={Math.max(3, block.markdown.split('\n').length + 1)}
                    className="w-full px-1 py-2 bg-transparent border-none outline-none text-[15px] leading-relaxed resize-none"
                    style={{ color: C.textSec }}
                />
            );

        case 'latex':
            return (
                <div className="space-y-3">
                    <textarea
                        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                        value={block.formula}
                        onChange={e => onChange({ ...block, formula: e.target.value })}
                        onKeyDown={onKeyDown}
                        placeholder="\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}"
                        rows={Math.max(2, block.formula.split('\n').length + 1)}
                        className={`${inputClass} resize-none font-mono text-xs`}
                        style={inputStyle}
                    />
                    {block.formula.trim() && (
                        <div className="overflow-x-auto py-4 px-5 rounded-xl" style={{ background: C.blueLight, border: `1px solid ${C.blueBorder}` }}>
                            <BlockMath math={block.formula} />
                        </div>
                    )}
                    <input
                        type="text"
                        value={block.caption ?? ''}
                        onChange={e => onChange({ ...block, caption: e.target.value })}
                        placeholder="Bildtext (valfritt, t.ex. Ekvation 1)"
                        className={`${inputClass} text-xs`}
                        style={inputStyle}
                    />
                </div>
            );

        case 'image':
            return (
                <div className="space-y-2">
                    <input
                        ref={inputRef as React.RefObject<HTMLInputElement>}
                        type="url"
                        value={block.url}
                        onChange={e => onChange({ ...block, url: e.target.value })}
                        onKeyDown={onKeyDown}
                        placeholder="https://example.com/bild.png"
                        className={inputClass}
                        style={inputStyle}
                    />
                    {block.url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={block.url}
                            alt={block.alt}
                            className="w-full rounded-xl max-h-60 object-contain"
                            style={{ border: `1px solid ${C.border}` }}
                        />
                    )}
                    <input
                        type="text"
                        value={block.alt}
                        onChange={e => onChange({ ...block, alt: e.target.value })}
                        placeholder="Alt-text (tillgänglighet)"
                        className={`${inputClass} text-xs`}
                        style={inputStyle}
                    />
                    <input
                        type="text"
                        value={block.caption ?? ''}
                        onChange={e => onChange({ ...block, caption: e.target.value })}
                        placeholder="Bildtext (valfritt)"
                        className={`${inputClass} text-xs`}
                        style={inputStyle}
                    />
                </div>
            );

        case 'callout': {
            const variants: Array<{ value: CalloutBlock['variant']; label: string }> = [
                { value: 'info', label: 'Info' },
                { value: 'tip', label: 'Tips' },
                { value: 'warning', label: 'Observera' },
                { value: 'example', label: 'Exempel' },
                { value: 'definition', label: 'Definition' },
                { value: 'success', label: 'Svar' },
            ];
            return (
                <div className="space-y-2">
                    <div className="flex gap-2">
                        {variants.map(v => (
                            <button
                                key={v.value}
                                onClick={() => onChange({ ...block, variant: v.value })}
                                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                                    block.variant === v.value
                                        ? 'text-white shadow-sm'
                                        : 'hover:bg-[#F7F8FC]'
                                }`}
                                style={
                                    block.variant === v.value
                                        ? { background: C.blue, color: '#fff' }
                                        : { color: C.textSec, border: `1px solid ${C.border}` }
                                }
                            >
                                {v.label}
                            </button>
                        ))}
                    </div>
                    <input
                        type="text"
                        value={block.title ?? ''}
                        onChange={e => onChange({ ...block, title: e.target.value })}
                        placeholder="Rubrik (valfritt)"
                        className={`${inputClass} text-xs font-semibold`}
                        style={inputStyle}
                    />
                    <textarea
                        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                        value={block.text}
                        onChange={e => onChange({ ...block, text: e.target.value })}
                        onKeyDown={onKeyDown}
                        rows={3}
                        placeholder="Skriv innehållet..."
                        className={`${inputClass} resize-none`}
                        style={inputStyle}
                    />
                </div>
            );
        }

        case 'code':
            return (
                <div className="space-y-2">
                    <select
                        value={block.language}
                        onChange={e => onChange({ ...block, language: e.target.value })}
                        className={`${inputClass} w-auto`}
                        style={inputStyle}
                    >
                        {['python', 'matlab', 'javascript', 'typescript', 'c', 'cpp', 'java', 'bash', 'text'].map(lang => (
                            <option key={lang} value={lang}>{lang}</option>
                        ))}
                    </select>
                    <textarea
                        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                        value={block.code}
                        onChange={e => onChange({ ...block, code: e.target.value })}
                        onKeyDown={onKeyDown}
                        rows={Math.max(4, block.code.split('\n').length + 1)}
                        placeholder="Skriv kod här..."
                        className={`${inputClass} resize-none font-mono text-xs leading-relaxed`}
                        style={inputStyle}
                    />
                </div>
            );

        case 'divider':
            return (
                <div className="py-2 text-center">
                    <hr style={{ borderColor: C.border }} />
                    <span className="text-[10px] italic" style={{ color: C.textMuted }}>Avdelare</span>
                </div>
            );

        default:
            return null;
    }
}

// ── Inline Slash Command Menu (rendered in document flow) ────────────────────
function InlineSlashMenu({
    onSelect,
    onClose,
}: {
    onSelect: (cmd: typeof SLASH_COMMANDS[number]) => void;
    onClose: () => void;
}) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [filter, setFilter] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = SLASH_COMMANDS.filter(cmd =>
        cmd.label.toLowerCase().includes(filter.toLowerCase()) ||
        cmd.desc.toLowerCase().includes(filter.toLowerCase())
    );

    // Auto-focus search input
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Reset selection when filter changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [filter]);

    // Scroll into view when menu appears
    useEffect(() => {
        menuRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, []);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filtered[selectedIndex]) onSelect(filtered[selectedIndex]);
        }
    };

    // Close on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            className="my-2 rounded-xl overflow-hidden"
            style={{
                background: C.surface,
                border: `1px solid ${C.borderDark}`,
                boxShadow: '0 4px 24px rgba(26,29,46,0.10)',
            }}
        >
            {/* Search input */}
            <div className="px-3 py-2.5" style={{ borderBottom: `1px solid ${C.border}` }}>
                <input
                    ref={inputRef}
                    type="text"
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Sök blocktyp..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-[#A0A5C0]"
                    style={{ color: C.text }}
                />
            </div>

            {/* Block type list */}
            <div className="max-h-72 overflow-y-auto py-1">
                {filtered.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs" style={{ color: C.textMuted }}>
                        Inga blocktyper hittades
                    </div>
                ) : (
                    filtered.map((cmd, i) => (
                        <button
                            key={cmd.type}
                            onClick={() => onSelect(cmd)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left"
                            style={{
                                background: i === selectedIndex ? C.blueLight : 'transparent',
                            }}
                            onMouseEnter={() => setSelectedIndex(i)}
                        >
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: i === selectedIndex ? C.surface : C.surfaceAlt, border: `1px solid ${C.border}` }}>
                                <cmd.icon className="w-4 h-4" style={{ color: C.blue }} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium" style={{ color: C.text }}>{cmd.label}</p>
                                <p className="text-[11px] truncate" style={{ color: C.textMuted }}>{cmd.desc}</p>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}

// ── Insert line between blocks ───────────────────────────────────────────────
function InsertLine({ onInsert }: { onInsert: () => void }) {
    const [hover, setHover] = useState(false);
    return (
        <div
            className="relative h-6 flex items-center group cursor-pointer"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onClick={onInsert}
        >
            <div className="absolute inset-x-0 top-1/2 h-px transition-colors"
                style={{ background: hover ? C.blue : 'transparent' }} />
            {hover && (
                <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-transform"
                    style={{ background: C.blue }}>
                    <Plus className="w-3.5 h-3.5 text-white" />
                </div>
            )}
        </div>
    );
}

// ── Main ArticleEditor ───────────────────────────────────────────────────────
interface ArticleEditorProps {
    initialTitle?: string;
    initialTitleSv?: string;
    initialExcerpt?: string;
    initialBlocks?: ArticleBlock[];
    initialTags?: string[];
    initialCourseId?: string;
    initialTopicId?: string;
    initialStatus?: ArticleStatus;
    courses: Array<{ id: string; code: string; name: string }>;
    topics: Array<{ id: string; title: string; courseId: string | null }>;
    onSave: (payload: {
        title: string;
        titleSv: string;
        excerpt: string;
        contentBlocks: ArticleBlock[];
        tags: string[];
        courseId: string;
        topicId: string;
        status: ArticleStatus;
    }) => Promise<void>;
    saveLabel?: string;
}

export function ArticleEditor({
    initialTitle = '',
    initialTitleSv = '',
    initialExcerpt = '',
    initialBlocks = [],
    initialTags = [],
    initialCourseId = '',
    initialTopicId = '',
    initialStatus = 'draft',
    courses,
    topics,
    onSave,
    saveLabel = 'Spara utkast',
}: ArticleEditorProps) {
    const [title, setTitle] = useState(initialTitle);
    const [titleSv, setTitleSv] = useState(initialTitleSv);
    const [excerpt, setExcerpt] = useState(initialExcerpt);
    const [blocks, setBlocks] = useState<ArticleBlock[]>(initialBlocks);
    const [tagsInput, setTagsInput] = useState(initialTags.join(', '));
    const [courseId, setCourseId] = useState(initialCourseId);
    const [topicId, setTopicId] = useState(initialTopicId);
    const [status, setStatus] = useState<ArticleStatus>(initialStatus);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [focusedBlock, setFocusedBlock] = useState<number | null>(null);
    const [metadataOpen, setMetadataOpen] = useState(true);

    // Slash menu: just the insertion index (null = closed)
    const [slashMenuAt, setSlashMenuAt] = useState<number | null>(null);

    const filteredTopics = topics.filter(t => !courseId || t.courseId === courseId);

    // ── Block operations ─────────────────────────────────────────────────────
    const updateBlock = useCallback((index: number, newBlock: ArticleBlock) => {
        setBlocks(prev => prev.map((b, i) => i === index ? newBlock : b));
    }, []);

    const deleteBlock = useCallback((index: number) => {
        setBlocks(prev => prev.filter((_, i) => i !== index));
        setFocusedBlock(prev => {
            if (prev === null) return null;
            if (prev === index) return Math.max(0, index - 1);
            if (prev > index) return prev - 1;
            return prev;
        });
    }, []);

    const insertBlockAt = useCallback((index: number, block: ArticleBlock) => {
        setBlocks(prev => {
            const next = [...prev];
            next.splice(index, 0, block);
            return next;
        });
        setFocusedBlock(index);
        setSlashMenuAt(null);
    }, []);

    const moveBlock = useCallback((index: number, direction: 'up' | 'down') => {
        setBlocks(prev => {
            const next = [...prev];
            const swap = direction === 'up' ? index - 1 : index + 1;
            if (swap < 0 || swap >= next.length) return prev;
            [next[index], next[swap]] = [next[swap], next[index]];
            return next;
        });
        setFocusedBlock(prev => {
            if (prev === index) return direction === 'up' ? index - 1 : index + 1;
            return prev;
        });
    }, []);

    // ── Handle key in blocks ─────────────────────────────────────────────────
    const handleBlockKeyDown = useCallback((index: number, e: KeyboardEvent<HTMLElement>) => {
        if (e.key === 'Backspace') {
            const block = blocks[index];
            const isEmpty = (
                (block.type === 'text' && !block.markdown) ||
                (block.type === 'heading' && !block.text) ||
                (block.type === 'latex' && !block.formula) ||
                (block.type === 'code' && !block.code) ||
                (block.type === 'callout' && !block.text) ||
                (block.type === 'image' && !block.url) ||
                (block.type === 'divider')
            );
            if (isEmpty && blocks.length > 0) {
                e.preventDefault();
                deleteBlock(index);
            }
        }
    }, [blocks, deleteBlock]);

    // ── Save ─────────────────────────────────────────────────────────────────
    const handleSave = () => {
        setError(null);
        setSuccess(false);
        startTransition(async () => {
            try {
                const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
                await onSave({ title, titleSv, excerpt, contentBlocks: blocks, tags, courseId, topicId, status });
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Något gick fel';
                setError(message);
            }
        });
    };

    const inputClass = "w-full px-3 py-2.5 bg-white border rounded-xl text-sm placeholder:text-[#A0A5C0] outline-none transition-all focus:ring-2 focus:ring-[#4361EE]/30 focus:border-[#4361EE]";
    const labelClass = "block text-[11px] font-semibold mb-1.5 uppercase tracking-wider";

    // ── Handler to insert a block from slash menu ────────────────────────────
    const handleSlashSelect = useCallback((cmd: typeof SLASH_COMMANDS[number]) => {
        if (slashMenuAt === null) return;
        insertBlockAt(slashMenuAt, { ...cmd.defaultValue } as ArticleBlock);
    }, [slashMenuAt, insertBlockAt]);

    const handleSlashClose = useCallback(() => {
        setSlashMenuAt(null);
    }, []);

    return (
        <div className="h-full flex flex-col">
            {/* ── Top bar ─────────────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 flex-wrap pb-4 mb-4"
                style={{ borderBottom: `1px solid ${C.border}` }}>
                {/* Status selector */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium"
                    style={{ background: C.surfaceAlt, border: `1px solid ${C.border}` }}>
                    <div className={`w-2 h-2 rounded-full ${
                        status === 'published' ? 'bg-emerald-500' : status === 'archived' ? 'bg-zinc-400' : 'bg-amber-500'
                    }`} />
                    <select
                        value={status}
                        onChange={e => setStatus(e.target.value as ArticleStatus)}
                        className="bg-transparent outline-none text-xs font-medium"
                        style={{ color: C.text }}
                    >
                        <option value="draft">Utkast</option>
                        <option value="published">Publicerad</option>
                        <option value="archived">Arkiverad</option>
                    </select>
                </div>

                <div className="flex-1" />

                {error && <span className="text-sm text-red-500 font-medium">{error}</span>}
                {success && (
                    <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                        <Check className="w-4 h-4" /> Sparad!
                    </span>
                )}

                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-all shadow-lg hover:shadow-xl"
                    style={{
                        background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`,
                        boxShadow: `0 4px 14px ${C.blue}30`,
                    }}
                >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isPending ? 'Sparar...' : saveLabel}
                </button>
            </div>

            {/* ── Scrollable writing area ─────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto pb-32">
                    {/* ── Metadata (collapsible) ──────────────────────────────── */}
                    <div className="mb-8 rounded-2xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                        <button
                            onClick={() => setMetadataOpen(v => !v)}
                            className="w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors"
                            style={{ background: C.surfaceAlt }}
                        >
                            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>
                                Metadata & inställningar
                            </span>
                            {metadataOpen
                                ? <ChevronUp className="w-4 h-4" style={{ color: C.textMuted }} />
                                : <ChevronDown className="w-4 h-4" style={{ color: C.textMuted }} />
                            }
                        </button>
                        {metadataOpen && (
                            <div className="p-5 grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className={labelClass} style={{ color: C.textMuted }}>Titel (svenska, valfritt)</label>
                                    <input type="text" value={titleSv} onChange={e => setTitleSv(e.target.value)}
                                        placeholder="t.ex. Egenvärden och egenvektorer"
                                        className={inputClass} style={{ color: C.text, borderColor: C.border }} />
                                </div>
                                <div className="col-span-2">
                                    <label className={labelClass} style={{ color: C.textMuted }}>Kort beskrivning</label>
                                    <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)}
                                        rows={2} placeholder="En kort sammanfattning av artikeln (max 500 tecken)..."
                                        className={`${inputClass} resize-none`} style={{ color: C.text, borderColor: C.border }} />
                                </div>
                                <div>
                                    <label className={labelClass} style={{ color: C.textMuted }}>Kurs</label>
                                    <select value={courseId} onChange={e => { setCourseId(e.target.value); setTopicId(''); }}
                                        className={inputClass} style={{ color: C.text, borderColor: C.border }}>
                                        <option value="">Ingen kurs</option>
                                        {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass} style={{ color: C.textMuted }}>Ämne</label>
                                    <select value={topicId} onChange={e => setTopicId(e.target.value)}
                                        className={inputClass} style={{ color: C.text, borderColor: C.border }}
                                        disabled={filteredTopics.length === 0}>
                                        <option value="">Inget ämne</option>
                                        {filteredTopics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className={labelClass} style={{ color: C.textMuted }}>Taggar (kommaseparerade)</label>
                                    <input type="text" value={tagsInput} onChange={e => setTagsInput(e.target.value)}
                                        placeholder="egenvärden, linjär algebra, matris"
                                        className={inputClass} style={{ color: C.text, borderColor: C.border }} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Title field ──────────────────────────────────────────── */}
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Artikelns titel..."
                        className="w-full text-3xl sm:text-4xl font-bold bg-transparent border-none outline-none mb-8 placeholder:text-[#C8CAD8]"
                        style={{ color: C.text }}
                    />

                    {/* ── Content blocks ───────────────────────────────────────── */}
                    {blocks.length === 0 && slashMenuAt === null && (
                        <div className="py-12 text-center rounded-2xl" style={{ border: `2px dashed ${C.border}` }}>
                            <AlignLeft className="w-8 h-8 mx-auto mb-3 opacity-30" style={{ color: C.textMuted }} />
                            <p className="text-sm mb-4" style={{ color: C.textMuted }}>
                                Börja skriva din artikel. Klicka + för att lägga till innehåll.
                            </p>
                            <button
                                onClick={() => setSlashMenuAt(0)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all"
                                style={{ background: C.blue }}
                            >
                                <Plus className="w-4 h-4" /> Lägg till block
                            </button>
                        </div>
                    )}

                    {/* Show inline slash menu at position 0 (before first block or when empty) */}
                    {slashMenuAt === 0 && (
                        <InlineSlashMenu
                            onSelect={handleSlashSelect}
                            onClose={handleSlashClose}
                        />
                    )}

                    {blocks.map((block, i) => (
                        <div key={i}>
                            {/* Insert line between blocks (only when menu not open here) */}
                            {slashMenuAt !== i && (
                                <InsertLine onInsert={() => setSlashMenuAt(i)} />
                            )}

                            {/* Inline slash menu at this position */}
                            {slashMenuAt === i && (
                                <InlineSlashMenu
                                    onSelect={handleSlashSelect}
                                    onClose={handleSlashClose}
                                />
                            )}

                            {/* Block wrapper with hover controls */}
                            <div
                                className="group relative flex gap-0"
                                style={{ minHeight: 20 }}
                            >
                                {/* Hover controls (left gutter) */}
                                <div className="absolute -left-10 top-1 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => setSlashMenuAt(i)}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[#EEF1FF]"
                                        style={{ color: C.textMuted }}
                                        title="Lägg till block ovanför"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                    <button
                                        className="w-7 h-7 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors"
                                        style={{ color: C.textMuted }}
                                        title="Dra för att flytta"
                                    >
                                        <GripVertical className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Block action buttons (right gutter) */}
                                <div className="absolute -right-10 top-1 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {i > 0 && (
                                        <button
                                            onClick={() => moveBlock(i, 'up')}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[#F7F8FC]"
                                            style={{ color: C.textMuted }}
                                            title="Flytta uppåt"
                                        >
                                            <ChevronUp className="w-4 h-4" />
                                        </button>
                                    )}
                                    {i < blocks.length - 1 && (
                                        <button
                                            onClick={() => moveBlock(i, 'down')}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[#F7F8FC]"
                                            style={{ color: C.textMuted }}
                                            title="Flytta nedåt"
                                        >
                                            <ChevronDown className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteBlock(i)}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50 hover:text-red-500"
                                        style={{ color: C.textMuted }}
                                        title="Radera block"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Block content */}
                                <div className="flex-1 pl-2 min-w-0">
                                    <InlineBlockEditor
                                        block={block}
                                        isFocused={focusedBlock === i}
                                        onFocus={() => { setFocusedBlock(i); setSlashMenuAt(null); }}
                                        onChange={b => updateBlock(i, b)}
                                        onDelete={() => deleteBlock(i)}
                                        onInsertAfter={() => {
                                            insertBlockAt(i + 1, { type: 'text', markdown: '' });
                                        }}
                                        onKeyDown={e => handleBlockKeyDown(i, e)}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Final insert line + slash menu at end */}
                    {blocks.length > 0 && slashMenuAt !== blocks.length && (
                        <InsertLine onInsert={() => setSlashMenuAt(blocks.length)} />
                    )}
                    {slashMenuAt === blocks.length && blocks.length > 0 && (
                        <InlineSlashMenu
                            onSelect={handleSlashSelect}
                            onClose={handleSlashClose}
                        />
                    )}

                    {/* Bottom add block button */}
                    {blocks.length > 0 && slashMenuAt === null && (
                        <div className="mt-4">
                            <button
                                onClick={() => setSlashMenuAt(blocks.length)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:border-[#4361EE] hover:text-[#4361EE]"
                                style={{
                                    color: C.textMuted,
                                    border: `2px dashed ${C.border}`,
                                }}
                            >
                                <Plus className="w-4 h-4" /> Lägg till block
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
