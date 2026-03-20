/**
 * Minimal Ollama client using the native /api/chat endpoint.
 *
 * Configure via env vars (add to .env.local):
 *   OLLAMA_BASE_URL  — default: http://localhost:11434
 *   OLLAMA_MODEL     — default: llama3.2
 *
 * Uses the native endpoint (not OpenAI-compat) so that num_ctx is respected,
 * preventing out-of-memory errors on models with large default context windows.
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'kimi-k2.5:cloud';

export interface OllamaMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface OllamaCallOptions {
    messages: OllamaMessage[];
    maxTokens?: number;
    temperature?: number;
    /** Request timeout in ms. Default: 30 000 (30s). */
    timeoutMs?: number;
    /** Context window size. Default: 4096. Keep low to avoid OOM on large-ctx models. */
    numCtx?: number;
    format?: 'json';
}

/**
 * Send a chat request to the local Ollama server.
 * Returns the assistant's reply text.
 * Throws on network error, timeout, or non-2xx HTTP status.
 */
export async function callOllama(options: OllamaCallOptions): Promise<string> {
    const { messages, maxTokens = 500, temperature = 0.2, timeoutMs = 30_000, numCtx = 4096, format } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                messages,
                stream: false,
                ...(format ? { format } : {}),
                options: {
                    num_ctx: numCtx,
                    num_predict: maxTokens,
                    temperature,
                },
            }),
        });

        if (!response.ok) {
            const body = await response.text().catch(() => '');
            throw new Error(`Ollama HTTP ${response.status}: ${response.statusText}${body ? ` — ${body}` : ''}`);
        }

        const data = await response.json() as any;
        if (data.error) throw new Error(`Ollama API Error: ${data.error}`);

        return data.message?.content ?? '';
    } finally {
        clearTimeout(timeoutId);
    }
}
