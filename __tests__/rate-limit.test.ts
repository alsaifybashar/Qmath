import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// We need to reload the module for each test group so the in-memory Map
// is fresh. We do this by using vi.resetModules() + dynamic import.
// ---------------------------------------------------------------------------

describe('checkRateLimit()', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.useRealTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // -----------------------------------------------------------------------
    // First 20 requests are allowed
    // -----------------------------------------------------------------------

    it('allows the first 20 requests for a given userId', async () => {
        const { checkRateLimit } = await import('../lib/rate-limit');
        const userId = 'user-allow-20';

        for (let i = 1; i <= 20; i++) {
            const result = checkRateLimit(userId);
            expect(result.allowed).toBe(true);
        }
    });

    it('first request returns remaining = 19', async () => {
        const { checkRateLimit } = await import('../lib/rate-limit');
        const result = checkRateLimit('user-remaining-check');
        expect(result.remaining).toBe(19);
    });

    it('remaining decrements with each request', async () => {
        const { checkRateLimit } = await import('../lib/rate-limit');
        const userId = 'user-decrement';

        for (let i = 1; i <= 20; i++) {
            const { remaining } = checkRateLimit(userId);
            expect(remaining).toBe(20 - i);
        }
    });

    // -----------------------------------------------------------------------
    // 21st request is blocked
    // -----------------------------------------------------------------------

    it('blocks the 21st request (MAX_REQUESTS = 20)', async () => {
        const { checkRateLimit } = await import('../lib/rate-limit');
        const userId = 'user-block-21';

        for (let i = 0; i < 20; i++) checkRateLimit(userId);
        const result = checkRateLimit(userId);

        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
    });

    it('continues to block all requests beyond limit in same window', async () => {
        const { checkRateLimit } = await import('../lib/rate-limit');
        const userId = 'user-block-many';

        for (let i = 0; i < 20; i++) checkRateLimit(userId);

        for (let i = 0; i < 5; i++) {
            const result = checkRateLimit(userId);
            expect(result.allowed).toBe(false);
        }
    });

    // -----------------------------------------------------------------------
    // Different userIds are independent
    // -----------------------------------------------------------------------

    it('different userIds have independent limits', async () => {
        const { checkRateLimit } = await import('../lib/rate-limit');
        const userA = 'user-A';
        const userB = 'user-B';

        // Exhaust userA
        for (let i = 0; i < 20; i++) checkRateLimit(userA);
        expect(checkRateLimit(userA).allowed).toBe(false);

        // userB should still be fresh
        const resultB = checkRateLimit(userB);
        expect(resultB.allowed).toBe(true);
        expect(resultB.remaining).toBe(19);
    });

    it('10 different users each get their own independent 20-request window', async () => {
        const { checkRateLimit } = await import('../lib/rate-limit');

        for (let u = 0; u < 10; u++) {
            const userId = `independent-user-${u}`;
            const result = checkRateLimit(userId);
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(19);
        }
    });

    // -----------------------------------------------------------------------
    // Window reset
    // -----------------------------------------------------------------------

    it('resets the count after the 1-minute window expires', async () => {
        vi.useFakeTimers();
        const now = Date.now();
        vi.setSystemTime(now);

        const { checkRateLimit } = await import('../lib/rate-limit');
        const userId = 'user-window-reset';

        // Exhaust the window
        for (let i = 0; i < 20; i++) checkRateLimit(userId);
        expect(checkRateLimit(userId).allowed).toBe(false);

        // Advance time past 1 minute (60 001 ms)
        vi.setSystemTime(now + 60_001);

        // Should now be allowed (new window)
        const result = checkRateLimit(userId);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(19);
    });

    it('does not reset before the window expires (at exactly resetAt - 1ms)', async () => {
        vi.useFakeTimers();
        const now = Date.now();
        vi.setSystemTime(now);

        const { checkRateLimit } = await import('../lib/rate-limit');
        const userId = 'user-no-early-reset';

        // Exhaust the window
        for (let i = 0; i < 20; i++) checkRateLimit(userId);
        const blocked = checkRateLimit(userId);
        expect(blocked.allowed).toBe(false);

        // Advance to just before the resetAt timestamp (resetAt = now + 60_000)
        vi.setSystemTime(now + 59_999);

        const stillBlocked = checkRateLimit(userId);
        expect(stillBlocked.allowed).toBe(false);
    });

    it('first request after reset returns remaining = 19', async () => {
        vi.useFakeTimers();
        const now = Date.now();
        vi.setSystemTime(now);

        const { checkRateLimit } = await import('../lib/rate-limit');
        const userId = 'user-after-reset-remaining';

        for (let i = 0; i < 20; i++) checkRateLimit(userId);

        vi.setSystemTime(now + 60_001);

        const result = checkRateLimit(userId);
        expect(result.remaining).toBe(19);
    });

    // -----------------------------------------------------------------------
    // resetAt is set correctly
    // -----------------------------------------------------------------------

    it('resetAt on first request is approximately now + 60000', async () => {
        vi.useFakeTimers();
        const now = 1_000_000;
        vi.setSystemTime(now);

        const { checkRateLimit } = await import('../lib/rate-limit');
        const result = checkRateLimit('user-resetAt');

        expect(result.resetAt).toBe(now + 60_000);
    });

    it('resetAt is stable within the same window (not extended by subsequent requests)', async () => {
        vi.useFakeTimers();
        const now = 1_000_000;
        vi.setSystemTime(now);

        const { checkRateLimit } = await import('../lib/rate-limit');
        const userId = 'user-stable-resetAt';

        const first = checkRateLimit(userId);

        // Advance time slightly and make more requests
        vi.setSystemTime(now + 5_000);
        const later = checkRateLimit(userId);

        // resetAt should be unchanged (sliding window doesn't extend)
        expect(later.resetAt).toBe(first.resetAt);
    });
});
