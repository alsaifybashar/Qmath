import { NextRequest, NextResponse } from 'next/server';
import type { BoardStateSnapshot } from '@/types/jsxgraph-widgets';

function buildNarrationPrompt(boardState: BoardStateSnapshot): string {
    return `A student is interacting with the ${boardState.widgetType} visualization.
Current board state: ${JSON.stringify(boardState.data)}

In 1-2 short sentences, acknowledge what the student is currently exploring and ask ONE guiding question to deepen their thinking. Be warm and encouraging. Do NOT reveal the answer. Focus on what they might observe or try next.`;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { boardState, provider = 'ollama' } = body as {
            boardState: BoardStateSnapshot;
            provider?: 'anthropic' | 'ollama';
        };

        if (!boardState || !boardState.widgetType) {
            return NextResponse.json({ error: 'boardState is required' }, { status: 400 });
        }

        const narrationPrompt = buildNarrationPrompt(boardState);

        if (provider === 'ollama') {
            const ollamaResponse = await fetch('http://localhost:11434/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'qwen3:8b',
                    messages: [
                        { role: 'system', content: 'You are a concise, encouraging math tutor. Respond in 1-2 sentences only.' },
                        { role: 'user', content: narrationPrompt },
                    ],
                    stream: false,
                    options: { num_ctx: 1024 },
                }),
            });

            if (!ollamaResponse.ok) {
                return NextResponse.json({ narration: null }, { status: 200 });
            }

            const data = await ollamaResponse.json();
            const narration = data.message?.content || null;
            return NextResponse.json({ narration });
        }

        // Anthropic fallback
        const Anthropic = (await import('@anthropic-ai/sdk')).default;
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 100,
            system: 'You are a concise, encouraging math tutor. Respond in 1-2 sentences only.',
            messages: [{ role: 'user', content: narrationPrompt }],
        });

        const textContent = response.content.find(c => c.type === 'text');
        const narration = textContent && textContent.type === 'text' ? textContent.text : null;
        return NextResponse.json({ narration });

    } catch {
        // Return no narration gracefully — the UI handles null silently
        return NextResponse.json({ narration: null }, { status: 200 });
    }
}
