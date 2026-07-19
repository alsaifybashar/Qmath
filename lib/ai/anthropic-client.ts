import Anthropic from '@anthropic-ai/sdk';

const VERCEL_AI_GATEWAY_URL = 'https://ai-gateway.vercel.sh';

function directApiKey(): string | undefined {
    return process.env.ANTHROPIC_API_KEY || undefined;
}

function gatewayCredential(): string | undefined {
    return process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || undefined;
}

export function usesVercelAiGateway(): boolean {
    return !directApiKey() && Boolean(gatewayCredential());
}

export function isAnthropicConfigured(): boolean {
    return Boolean(directApiKey() || gatewayCredential());
}

export function createAnthropicClient(): Anthropic {
    const directKey = directApiKey();
    const gatewayKey = gatewayCredential();

    return new Anthropic({
        // A non-secret sentinel keeps module evaluation/builds deterministic. Every
        // request path checks isAnthropicConfigured() before making a network call.
        apiKey: directKey ?? gatewayKey ?? 'not-configured',
        ...(directKey || !gatewayKey ? {} : { baseURL: VERCEL_AI_GATEWAY_URL }),
    });
}

export function anthropicModel(model: string): string {
    if (!usesVercelAiGateway() || model.includes('/')) return model;

    // AI Gateway uses provider-qualified, current model aliases. Keep direct
    // Anthropic model IDs unchanged for local/BYOK development.
    if (model.includes('haiku')) return 'anthropic/claude-haiku-4.5';
    return 'anthropic/claude-sonnet-4.6';
}
