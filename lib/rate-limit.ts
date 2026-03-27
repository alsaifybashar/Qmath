// Sliding window rate limiter using in-memory Map (Redis-ready upgrade path)
// For production with 5000 students, swap to @upstash/redis

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 20;

export function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const key = `rl:${userId}`;
    const entry = store.get(key);

    if (!entry || now >= entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + WINDOW_MS });
        return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt: now + WINDOW_MS };
    }

    if (entry.count >= MAX_REQUESTS) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    entry.count++;
    return { allowed: true, remaining: MAX_REQUESTS - entry.count, resetAt: entry.resetAt };
}

// TODO: Replace with Redis/Upstash implementation for production scale:
// import { Redis } from '@upstash/redis';
// const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! });
// export async function checkRateLimit(userId: string) { ... sliding window with redis.pipeline() ... }
