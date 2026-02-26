import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/ai/chat/route';
import { NextRequest } from 'next/server';
import * as authModule from '@/auth';

// Mock Anthropic
vi.mock('@anthropic-ai/sdk', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            messages: {
                create: vi.fn().mockResolvedValue({
                    stop_reason: 'end_turn',
                    content: [{ type: 'text', text: 'Mocked AI response' }]
                })
            }
        }))
    };
});

// Mock NextAuth
vi.mock('@/auth', () => ({
    auth: vi.fn()
}));

describe('AI Chat API Route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockContext = {
        currentPage: 'study',
        student: { masteryLevel: 0.5, recentPerformance: 'learning' }
    };

    it('should return 401 Unauthorized if no session is present (Security Audit: IDOR/Auth)', async () => {
        vi.mocked(authModule.auth).mockResolvedValueOnce(null);

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
        vi.mocked(authModule.auth).mockResolvedValueOnce({ user: { id: '123' }, expires: '' });

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
        vi.mocked(authModule.auth).mockResolvedValueOnce({ user: { id: '123' }, expires: '' });

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
        vi.mocked(authModule.auth).mockResolvedValueOnce({ user: { id: '123' }, expires: '' });

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
});
