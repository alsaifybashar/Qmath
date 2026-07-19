/**
 * Minimal Ollama client using the native /api/chat endpoint.
 *
 * Configure via env vars (add to .env.local):
 *   OLLAMA_BASE_URL  — default: http://localhost:11434
 *   OLLAMA_MODELS    — comma-separated fallback chain, e.g. "glm-4.7-flash:latest,qwen3.5:latest,llama3.2:latest"
 *   OLLAMA_MODEL     — single model override (legacy; ignored when OLLAMA_MODELS is set)
 *
 * Uses the native endpoint (not OpenAI-compat) so that num_ctx is respected,
 * preventing out-of-memory errors on models with large default context windows.
 *
 * Fallback behaviour: models are tried in order. If a model-level error occurs
 * (not found, load failure, OOM, timeout) the next model in the chain is tried.
 * If the Ollama server itself is unreachable the error is thrown immediately.
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL
    ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:11434');

// Fallback chain: most-capable first, smallest last.
const OLLAMA_MODELS: string[] = process.env.OLLAMA_MODELS
    ? process.env.OLLAMA_MODELS.split(',').map(m => m.trim()).filter(Boolean)
    : process.env.OLLAMA_MODEL
    ? [process.env.OLLAMA_MODEL]
    : ['glm-4.7-flash:latest', 'qwen3.5:latest', 'llama3.2:latest'];

export interface OllamaMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface OllamaCallOptions {
    messages: OllamaMessage[];
    maxTokens?: number;
    temperature?: number;
    /** Request timeout in ms per model attempt. Default: 30 000 (30s). */
    timeoutMs?: number;
    /** Context window size. Default: 4096. Keep low to avoid OOM on large-ctx models. */
    numCtx?: number;
    format?: 'json';
    /**
     * Specific model name to use (e.g. "qwen3.5:latest").
     * When set, the fallback chain is bypassed and only this model is tried.
     */
    model?: string;
}

/** Errors that are specific to a model — safe to skip to the next in the chain. */
function isModelError(err: Error): boolean {
    const msg = err.message;
    return (
        msg.includes('not found') ||
        msg.includes('404') ||
        msg.includes('model') ||
        msg.includes('timed out') ||
        msg.includes('AbortError') ||
        // Ollama returns 5xx for OOM / load failures
        /HTTP 5\d\d/.test(msg)
    );
}

/**
 * Call a specific model. Throws on any error.
 * The thrown error is annotated with the model name so callers can log it.
 */
async function callOllamaModel(
    model: string,
    options: OllamaCallOptions,
): Promise<string> {
    const { messages, maxTokens = 500, temperature = 0.2, timeoutMs = 30_000, numCtx = 4096, format } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                model,
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
            if (response.status === 404) {
                throw new Error(`Ollama model "${model}" not found (HTTP 404). Pull it: ollama pull ${model}`);
            }
            throw new Error(`Ollama HTTP ${response.status}: ${response.statusText}${body ? ` — ${body}` : ''}`);
        }

        const data = await response.json() as { message?: { content?: string }; error?: string };
        if (data.error) throw new Error(`Ollama API Error (${model}): ${data.error}`);

        return data.message?.content ?? '';
    } catch (err: unknown) {
        const error = err as Error;
        if (error.name === 'AbortError') {
            throw new Error(`Ollama model "${model}" timed out after ${timeoutMs / 1000}s.`);
        }
        // Server-level errors: Ollama is not running — rethrow immediately, no point trying other models.
        if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
            throw new Error(`Cannot connect to Ollama at ${OLLAMA_BASE_URL}. Make sure Ollama is running: ollama serve`);
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Send a chat request to the local Ollama server.
 *
 * - If `options.model` is set, that specific model is used (no fallback).
 * - Otherwise, tries each model in OLLAMA_MODELS in order, skipping to the
 *   next on model-level failures.
 *
 * Returns the assistant's reply text, or throws if all models fail.
 */
export async function callOllama(options: OllamaCallOptions): Promise<string> {
    if (!OLLAMA_BASE_URL) {
        throw new Error('Ollama is disabled in production unless OLLAMA_BASE_URL is explicitly configured.');
    }
    // Specific model requested — bypass the fallback chain.
    if (options.model) {
        return callOllamaModel(options.model, options);
    }

    const lastError: Error[] = [];

    for (const model of OLLAMA_MODELS) {
        try {
            return await callOllamaModel(model, options);
        } catch (err: unknown) {
            const error = err as Error;

            // Server unreachable — no point trying other models.
            if (error.message.includes('Cannot connect to Ollama')) {
                throw error;
            }

            console.warn(`[Ollama] Model "${model}" failed: ${error.message} — trying next model.`);
            lastError.push(error);
        }
    }

    // All models exhausted — throw a summary error.
    const tried = OLLAMA_MODELS.join(', ');
    const lastMsg = lastError[lastError.length - 1]?.message ?? 'unknown error';
    throw new Error(
        `All Ollama models failed (tried: ${tried}). Last error: ${lastMsg}`
    );
}
