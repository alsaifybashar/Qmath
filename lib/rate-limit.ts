import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { emitSecurityEvent } from '@/lib/security/events';

export type RateLimitPolicy =
    | 'legacy'
    | 'grading'
    | 'ai'
    | 'login-account'
    | 'login-source'
    | 'registration'
    | 'password-reset'
    | 'public-search'
    | 'admin-mutation'
    | 'telemetry';

const POLICIES: Record<RateLimitPolicy, { requests: number; windowSeconds: number }> = {
    legacy: { requests: 20, windowSeconds: 60 },
    grading: { requests: 30, windowSeconds: 60 },
    ai: { requests: 5, windowSeconds: 60 },
    'login-account': { requests: 5, windowSeconds: 15 * 60 },
    'login-source': { requests: 20, windowSeconds: 15 * 60 },
    registration: { requests: 3, windowSeconds: 60 * 60 },
    'password-reset': { requests: 3, windowSeconds: 60 * 60 },
    'public-search': { requests: 60, windowSeconds: 60 },
    'admin-mutation': { requests: 10, windowSeconds: 60 },
    telemetry: { requests: 20, windowSeconds: 60 },
};

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    limit: number;
}

interface LocalEntry {
    count: number;
    resetAt: number;
}

const localStore = new Map<string, LocalEntry>();
const distributedLimiters = new Map<RateLimitPolicy, Ratelimit>();
let redis: Redis | null | undefined;

function getRedis(): Redis | null {
    if (redis !== undefined) return redis;
    // Vercel's Upstash Marketplace integration currently injects KV_REST_API_*
    // names, while direct Upstash integrations use UPSTASH_REDIS_REST_*.
    // Accept both without copying or duplicating the managed credentials.
    const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
    redis = url && token ? new Redis({ url, token }) : null;
    return redis;
}

function localLimit(policy: RateLimitPolicy, identifier: string): RateLimitResult {
    const config = POLICIES[policy];
    const now = Date.now();
    const key = `${policy}:${identifier}`;
    const entry = localStore.get(key);

    if (!entry || now >= entry.resetAt) {
        const resetAt = now + config.windowSeconds * 1000;
        localStore.set(key, { count: 1, resetAt });
        return { allowed: true, remaining: config.requests - 1, resetAt, limit: config.requests };
    }

    if (entry.count >= config.requests) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt, limit: config.requests };
    }

    entry.count += 1;
    return {
        allowed: true,
        remaining: config.requests - entry.count,
        resetAt: entry.resetAt,
        limit: config.requests,
    };
}

function getDistributedLimiter(policy: RateLimitPolicy, redisClient: Redis): Ratelimit {
    const existing = distributedLimiters.get(policy);
    if (existing) return existing;

    const config = POLICIES[policy];
    const limiter = new Ratelimit({
        redis: redisClient,
        limiter: Ratelimit.slidingWindow(config.requests, `${config.windowSeconds} s`),
        prefix: `qmath:ratelimit:${policy}`,
        analytics: true,
        enableProtection: true,
    });
    distributedLimiters.set(policy, limiter);
    return limiter;
}

export async function checkRateLimit(
    identifier: string,
    policy: RateLimitPolicy = 'legacy',
): Promise<RateLimitResult> {
    const normalizedIdentifier = identifier.trim().slice(0, 256) || 'unknown';
    const redisClient = getRedis();

    if (!redisClient) {
        if (process.env.NODE_ENV === 'production') {
            emitSecurityEvent({
                category: 'rate_limit',
                action: policy,
                outcome: 'failure',
                severity: 'critical',
                reason: 'distributed_store_unavailable',
            });
            // Gracefully fall back to local (in-memory) limiting if Redis isn't configured
            // instead of failing closed and blocking all logins/registrations.
            return localLimit(policy, normalizedIdentifier);
        }
        return localLimit(policy, normalizedIdentifier);
    }

    try {
        const result = await getDistributedLimiter(policy, redisClient).limit(normalizedIdentifier);
        return {
            allowed: result.success,
            remaining: result.remaining,
            resetAt: result.reset,
            limit: result.limit,
        };
    } catch {
        emitSecurityEvent({
            category: 'rate_limit',
            action: policy,
            outcome: 'failure',
            severity: 'high',
            reason: 'distributed_store_error',
        });
        return { allowed: false, remaining: 0, resetAt: Date.now() + 60_000, limit: 0 };
    }
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
        'RateLimit-Limit': String(result.limit),
        'RateLimit-Remaining': String(result.remaining),
        'RateLimit-Reset': String(Math.max(0, Math.ceil((result.resetAt - Date.now()) / 1000))),
        ...(result.allowed
            ? {}
            : { 'Retry-After': String(Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))) }),
    };
}
