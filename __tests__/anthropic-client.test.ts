import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    anthropicModel,
    createAnthropicClient,
    isAnthropicConfigured,
    usesVercelAiGateway,
} from '../lib/ai/anthropic-client';

afterEach(() => {
    vi.unstubAllEnvs();
});

function clearAiCredentials() {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    vi.stubEnv('AI_GATEWAY_API_KEY', '');
    vi.stubEnv('VERCEL_OIDC_TOKEN', '');
}

describe('Anthropic runtime configuration', () => {
    it('uses Vercel OIDC with the Anthropic-compatible AI Gateway', () => {
        clearAiCredentials();
        vi.stubEnv('VERCEL_OIDC_TOKEN', 'test-oidc-token');

        const client = createAnthropicClient();

        expect(isAnthropicConfigured()).toBe(true);
        expect(usesVercelAiGateway()).toBe(true);
        expect(client.baseURL).toBe('https://ai-gateway.vercel.sh');
        expect(anthropicModel('claude-sonnet-4-20250514')).toBe(
            'anthropic/claude-sonnet-4.6',
        );
        expect(anthropicModel('claude-haiku-4-5-20251001')).toBe(
            'anthropic/claude-haiku-4.5',
        );
    });

    it('prefers a direct Anthropic key and preserves direct model IDs', () => {
        clearAiCredentials();
        vi.stubEnv('ANTHROPIC_API_KEY', 'test-direct-key');
        vi.stubEnv('VERCEL_OIDC_TOKEN', 'test-oidc-token');

        expect(isAnthropicConfigured()).toBe(true);
        expect(usesVercelAiGateway()).toBe(false);
        expect(anthropicModel('claude-sonnet-4-6')).toBe('claude-sonnet-4-6');
    });

    it('reports an unconfigured provider when no managed credential exists', () => {
        clearAiCredentials();

        expect(isAnthropicConfigured()).toBe(false);
        expect(usesVercelAiGateway()).toBe(false);
    });
});
