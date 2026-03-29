import { NextResponse } from 'next/server';

export interface ClaudeModelMeta {
    id: string;
    name: string;
    description: string;
}

export interface GoogleModelMeta {
    id: string;
    name: string;
    description: string;
    /** 'free' = generous free quota; 'limited' = small free quota (~25 req/day); 'paid' = paid plan required */
    tier: 'free' | 'limited' | 'paid';
}

export interface OllamaModelMeta {
    id: string;
    name: string;
    family: string;
    parameterSize: string;
}

const CLAUDE_MODELS: ClaudeModelMeta[] = [
    { id: 'claude-sonnet-4-6',          name: 'Claude Sonnet 4.6',  description: 'Most capable · best for complex math' },
    { id: 'claude-haiku-4-5-20251001',  name: 'Claude Haiku 4.5',   description: 'Fast & efficient · quick answers' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet',  description: 'Reliable · proven math tutor' },
];

const GOOGLE_MODELS: GoogleModelMeta[] = [
    // ── Free tier (generous quota) ─────────────────────────────────────────────
    {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        description: 'Fast & capable · free tier · tools & visualisations',
        tier: 'free',
    },
    {
        id: 'gemini-2.5-flash-lite',
        name: 'Gemini 2.5 Flash-Lite',
        description: 'Ultra-fast responses · free tier · lowest latency',
        tier: 'free',
    },
    // ── Limited free tier (~25 req/day) ───────────────────────────────────────
    {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        description: 'Deep reasoning · limited free quota (~25 req/day)',
        tier: 'limited',
    },
    // ── Gemini 3 series (paid plan / preview access) ──────────────────────────
    {
        id: 'gemini-3-flash-preview',
        name: 'Gemini 3 Flash Preview',
        description: 'Next-gen Flash · faster than 2.5 · preview access',
        tier: 'paid',
    },
    {
        id: 'gemini-3.1-flash-lite-preview',
        name: 'Gemini 3.1 Flash-Lite Preview',
        description: 'Latest lightweight model · ultra-fast · preview access',
        tier: 'paid',
    },
    {
        id: 'gemini-3.1-pro-preview',
        name: 'Gemini 3.1 Pro Preview',
        description: 'Most capable Gemini · deep reasoning · preview access',
        tier: 'paid',
    },
];

export async function GET() {
    const ollamaBase = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
    let ollamaModels: OllamaModelMeta[] = [];

    try {
        const res = await fetch(`${ollamaBase}/api/tags`, {
            signal: AbortSignal.timeout(3000),
            cache: 'no-store',
        });
        if (res.ok) {
            const data = await res.json() as { models?: {
                name: string;
                details?: { family?: string; parameter_size?: string };
            }[] };
            ollamaModels = (data.models ?? []).map((m) => ({
                id: m.name,
                name: m.name.replace(/:latest$/i, ''),
                family: m.details?.family ?? '',
                parameterSize: m.details?.parameter_size ?? '',
            }));
        }
    } catch {
        // Ollama not running — return empty list, not an error
    }

    return NextResponse.json({
        claude: CLAUDE_MODELS,
        google: GOOGLE_MODELS,
        ollama: ollamaModels
    });
}
