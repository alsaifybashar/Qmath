import { NextResponse } from 'next/server';

export interface ClaudeModelMeta {
    id: string;
    name: string;
    description: string;
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

    return NextResponse.json({ claude: CLAUDE_MODELS, ollama: ollamaModels });
}
