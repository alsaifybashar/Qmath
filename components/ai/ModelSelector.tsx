'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Cpu, Sparkles, Loader2 } from 'lucide-react';

export interface SelectedModel {
    provider: 'anthropic' | 'ollama' | 'google';
    model: string;
    displayName: string;
}

interface ClaudeModelMeta { id: string; name: string; description: string }
interface GoogleModelMeta { id: string; name: string; description: string; tier?: 'free' | 'limited' | 'paid' }
interface OllamaModelMeta { id: string; name: string; family: string; parameterSize: string }

interface ModelSelectorProps {
    value: SelectedModel;
    onChange: (model: SelectedModel) => void;
    /** 'up' opens the dropdown above the button (default), 'down' opens below */
    direction?: 'up' | 'down';
    compact?: boolean;
}

export const DEFAULT_MODEL: SelectedModel = {
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    displayName: 'Sonnet 4.6',
};

export function ModelSelector({ value, onChange, direction = 'up', compact = false }: ModelSelectorProps) {
    const [open, setOpen] = useState(false);
    const [claudeModels, setClaudeModels] = useState<ClaudeModelMeta[]>([]);
    const [googleModels, setGoogleModels] = useState<GoogleModelMeta[]>([]);
    const [ollamaModels, setOllamaModels] = useState<OllamaModelMeta[]>([]);
    const [loading, setLoading] = useState(true);
    const [ollamaError, setOllamaError] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Fetch available models once on mount
    useEffect(() => {
        fetch('/api/ai/models')
            .then(r => r.json())
            .then((data: { claude: ClaudeModelMeta[]; google: GoogleModelMeta[]; ollama: OllamaModelMeta[] }) => {
                setClaudeModels(data.claude ?? []);
                setGoogleModels(data.google ?? []);
                setOllamaModels(data.ollama ?? []);
                setOllamaError((data.ollama ?? []).length === 0);
            })
            .catch(() => setOllamaError(true))
            .finally(() => setLoading(false));
    }, []);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const isOllama = value.provider === 'ollama';

    return (
        <div ref={ref} className="relative">
            {/* Trigger button */}
            <button
                onClick={() => setOpen(v => !v)}
                className={`flex items-center gap-1.5 rounded-xl border transition-all
                    ${compact
                        ? 'px-2.5 py-1.5 text-xs'
                        : 'px-3 py-1.5 text-xs'
                    }
                    bg-[var(--surface-hover)] border-[var(--glass-border)]
                    hover:border-[var(--glass-border-strong)] hover:bg-[var(--surface-elevated)]
                    text-[var(--foreground-muted)] hover:text-[var(--foreground)]
                `}
                title="Switch AI model"
            >
                {/* Provider dot */}
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    isOllama
                        ? 'bg-emerald-400'
                        : 'bg-gradient-to-br from-blue-400 to-violet-400'
                }`} />
                <span className="font-medium max-w-[100px] truncate">{value.displayName}</span>
                <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {open && (
                <div className={`absolute z-50 w-72 rounded-2xl border border-[var(--glass-border-strong)] bg-[var(--surface)] shadow-[var(--shadow-xl)] overflow-hidden
                    ${direction === 'up' ? 'bottom-full mb-2 right-0' : 'top-full mt-2 right-0'}
                `}>

                    {/* Claude section */}
                    <div>
                        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--glass-border)]">
                            <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--foreground-subtle)]">
                                Claude · Anthropic
                            </span>
                        </div>
                        {loading ? (
                            <div className="flex items-center gap-2 px-4 py-3 text-xs text-[var(--foreground-muted)]">
                                <Loader2 className="w-3 h-3 animate-spin" /> Loading…
                            </div>
                        ) : (
                            claudeModels.map(m => {
                                const active = value.provider === 'anthropic' && value.model === m.id;
                                return (
                                    <button
                                        key={m.id}
                                        onClick={() => { onChange({ provider: 'anthropic', model: m.id, displayName: m.name }); setOpen(false); }}
                                        className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors
                                            ${active
                                                ? 'bg-violet-50 dark:bg-violet-500/10'
                                                : 'hover:bg-[var(--surface-hover)]'
                                            }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[13px] font-medium text-[var(--foreground)]">{m.name}</span>
                                                {active && <Check className="w-3 h-3 text-violet-500 flex-shrink-0" />}
                                            </div>
                                            <span className="text-[11px] text-[var(--foreground-muted)]">{m.description}</span>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Google Gemini section */}
                    <div className="border-t border-[var(--glass-border)]">
                        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--glass-border)]">
                            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-blue-500 via-red-500 to-yellow-500" />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--foreground-subtle)]">
                                Gemini · Google
                            </span>
                        </div>
                        {loading ? (
                            <div className="flex items-center gap-2 px-4 py-3 text-xs text-[var(--foreground-muted)]">
                                <Loader2 className="w-3 h-3 animate-spin" /> Loading…
                            </div>
                        ) : (
                            googleModels.map(m => {
                                const active = value.provider === 'google' && value.model === m.id;
                                const tier = m.tier ?? (m.id.includes('pro') ? 'limited' : 'free');
                                const tierBadge =
                                    tier === 'free'    ? { label: 'FREE',    cls: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/25', tip: 'Generous free tier quota' } :
                                    tier === 'limited' ? { label: 'LIMITED', cls: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/25', tip: 'Free tier: ~25 requests/day' } :
                                                         { label: 'PAID',    cls: 'bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/25', tip: 'Requires paid Google AI API plan' };
                                return (
                                    <button
                                        key={m.id}
                                        onClick={() => { onChange({ provider: 'google', model: m.id, displayName: m.name }); setOpen(false); }}
                                        className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors
                                            ${active
                                                ? 'bg-blue-50 dark:bg-blue-500/10'
                                                : 'hover:bg-[var(--surface-hover)]'
                                            }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[13px] font-medium text-[var(--foreground)]">{m.name}</span>
                                                <span
                                                    className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border flex-shrink-0 ${tierBadge.cls}`}
                                                    title={tierBadge.tip}
                                                >
                                                    {tierBadge.label}
                                                </span>
                                                {active && <Check className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                                            </div>
                                            <span className="text-[11px] text-[var(--foreground-muted)]">{m.description}</span>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Ollama section */}
                    <div className="border-t border-[var(--glass-border)]">
                        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--glass-border)]">
                            <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--foreground-subtle)]">
                                Local · Ollama
                            </span>
                        </div>
                        {loading ? (
                            <div className="flex items-center gap-2 px-4 py-3 text-xs text-[var(--foreground-muted)]">
                                <Loader2 className="w-3 h-3 animate-spin" /> Checking Ollama…
                            </div>
                        ) : ollamaError || ollamaModels.length === 0 ? (
                            <div className="px-4 py-3 text-[11px] text-[var(--foreground-subtle)] italic">
                                No local models found — run <code className="font-mono not-italic text-emerald-600 dark:text-emerald-400">ollama serve</code>
                            </div>
                        ) : (
                            ollamaModels.map(m => {
                                const active = value.provider === 'ollama' && value.model === m.id;
                                return (
                                    <button
                                        key={m.id}
                                        onClick={() => { onChange({ provider: 'ollama', model: m.id, displayName: m.name }); setOpen(false); }}
                                        className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors
                                            ${active
                                                ? 'bg-emerald-50 dark:bg-emerald-500/10'
                                                : 'hover:bg-[var(--surface-hover)]'
                                            }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[13px] font-medium text-[var(--foreground)] truncate">{m.name}</span>
                                                {active && <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />}
                                            </div>
                                            <span className="text-[11px] text-[var(--foreground-muted)]">
                                                {[m.family, m.parameterSize].filter(Boolean).join(' · ')}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
