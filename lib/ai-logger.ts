import { db } from '@/db/drizzle';
import { aiRequestLogs } from '@/db/schema';

export async function logAIRequest(params: {
    provider: 'anthropic' | 'google';
    model: string;
    requestType: string;
    promptTokens?: number;
    completionTokens?: number;
    latencyMs?: number;
    success: boolean;
    errorMessage?: string;
    userId?: string;
}): Promise<void> {
    try {
        await db.insert(aiRequestLogs).values({
            provider: params.provider,
            model: params.model,
            requestType: params.requestType,
            promptTokens: params.promptTokens,
            completionTokens: params.completionTokens,
            latencyMs: params.latencyMs,
            success: params.success,
            errorMessage: params.errorMessage,
            userId: params.userId,
        });
    } catch (err) {
        // Never crash the primary AI call over a logging failure
        console.error('[ai-logger] Failed to write AI request log:', err);
    }
}
