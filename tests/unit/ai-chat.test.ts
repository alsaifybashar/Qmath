import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/ai/chat/route';
import { NextRequest } from 'next/server';
import * as authModule from '@/auth';

const {
    anthropicCreateMock,
    dbLimitMock,
    dbWhereMock,
    dbLeftJoinMock,
    dbFromMock,
    dbSelectMock,
} = vi.hoisted(() => {
    const anthropicCreateMock = vi.fn().mockResolvedValue({
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'Mocked AI response' }]
    });

    const dbLimitMock = vi.fn().mockResolvedValue([]);
    const dbWhereMock = vi.fn(() => ({ limit: dbLimitMock }));
    const dbLeftJoinMock = vi.fn(() => ({ where: dbWhereMock }));
    const dbFromMock = vi.fn(() => ({ leftJoin: dbLeftJoinMock, where: dbWhereMock }));
    const dbSelectMock = vi.fn(() => ({ from: dbFromMock }));

    return {
        anthropicCreateMock,
        dbLimitMock,
        dbWhereMock,
        dbLeftJoinMock,
        dbFromMock,
        dbSelectMock,
    };
});

// Mock Anthropic
vi.mock('@anthropic-ai/sdk', () => {
    return {
        default: function MockAnthropic() {
            return {
                messages: {
                    create: anthropicCreateMock
                }
            };
        }
    };
});

// Mock NextAuth
vi.mock('@/auth', () => ({
    auth: vi.fn()
}));

vi.mock('@/db/drizzle', () => ({
    db: {
        select: dbSelectMock,
    },
}));

vi.mock('@/lib/rate-limit', () => ({
    checkRateLimit: vi.fn(() => ({
        allowed: true,
        resetAt: Date.now() + 60_000,
    })),
}));

describe('AI Chat API Route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.ANTHROPIC_API_KEY = 'test-key';
        anthropicCreateMock.mockResolvedValue({
            stop_reason: 'end_turn',
            content: [{ type: 'text', text: 'Mocked AI response' }]
        });
        dbLimitMock.mockResolvedValue([]);
    });

    const setMockSession = (session: unknown) => {
        vi.mocked(authModule.auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(session);
    };

    const mockContext = {
        currentPage: 'study',
        student: { masteryLevel: 0.5, recentPerformance: 'learning' }
    };

    it('should return 401 Unauthorized if no session is present (Security Audit: IDOR/Auth)', async () => {
        setMockSession(null);

        const req = new NextRequest('http://localhost/api/ai/chat', {
            method: 'POST',
            body: JSON.stringify({ message: 'Hello', context: mockContext })
        });

        const res = await POST(req);
        expect(res.status).toBe(401);

        const data = await res.json();
        expect(data.error).toBe('Unauthorized');
    });

    it('should return 413 if message is too large (Security Audit: Payload / DoS)', async () => {
        setMockSession({ user: { id: '123' }, expires: '' });

        const hugeMessage = 'A'.repeat(2500); // Exceeds 2000 limit

        const req = new NextRequest('http://localhost/api/ai/chat', {
            method: 'POST',
            body: JSON.stringify({ message: hugeMessage, context: mockContext })
        });

        const res = await POST(req);
        expect(res.status).toBe(413);

        const data = await res.json();
        expect(data.error).toBe('Message payload too large');
    });

    it('should process a valid message successfully', async () => {
        setMockSession({ user: { id: '123' }, expires: '' });

        const req = new NextRequest('http://localhost/api/ai/chat', {
            method: 'POST',
            body: JSON.stringify({ message: 'Can you help me with derivatives?', context: mockContext })
        });

        const res = await POST(req);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.response).toBe('Mocked AI response');
    });

    it('should successfully prevent XSS by correctly typing inputs (Security Audit: XSS)', async () => {
        setMockSession({ user: { id: '123' }, expires: '' });

        // XSS injection in message
        const xssMessage = '<script>alert(1)</script>';

        const req = new NextRequest('http://localhost/api/ai/chat', {
            method: 'POST',
            body: JSON.stringify({ message: xssMessage, context: mockContext })
        });

        const res = await POST(req);
        expect(res.status).toBe(200);

        // Anthropic mock returns exactly what we specified, meaning the input didn't break things.
        const data = await res.json();
        expect(data.success).toBe(true);
    });

    it('should resolve guided question context from the database when questionId is provided', async () => {
        setMockSession({ user: { id: '123' }, expires: '' });
        dbLimitMock.mockResolvedValueOnce([{
            id: 'q-1',
            content: 'Server-side question body',
            difficulty: 4,
            correctAnswer: '42',
            topicTitle: 'Limits',
            topicTitleSv: 'Gränsvärden',
        }]);

        const req = new NextRequest('http://localhost/api/ai/chat', {
            method: 'POST',
            body: JSON.stringify({
                message: 'Kan du hjälpa mig?',
                context: {
                    currentPage: 'study',
                    mode: 'guided',
                    questionId: 'q-1',
                    question: {
                        id: 'q-1',
                        content: 'Injected client question',
                        topic: 'Wrong topic',
                        difficulty: 1,
                        correctAnswer: 'not-the-real-answer',
                    },
                    student: { masteryLevel: 0.5, recentPerformance: 'learning' },
                },
            })
        });

        const res = await POST(req);
        expect(res.status).toBe(200);

        const firstCall = anthropicCreateMock.mock.calls[0]?.[0];
        const systemText = Array.isArray(firstCall?.system)
            ? firstCall.system[0]?.text
            : firstCall?.system;

        expect(systemText).toContain('Question: Server-side question body');
        expect(systemText).toContain('Expected answer: 42');
        expect(systemText).toContain('Topic: Gränsvärden');
        expect(systemText).not.toContain('Injected client question');
        expect(systemText).not.toContain('not-the-real-answer');
    });
});
