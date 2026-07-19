import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { emitSecurityEvent } from '@/lib/security/events';
import { getTrustedClientAddress, parseStrictJson, problem, requireSameOrigin } from '@/lib/security/request';

const telemetrySchema = z.object({
    type: z.string().trim().min(1).max(64),
    url: z.string().max(512).optional(),
    source: z.string().max(200).optional(),
    lineno: z.number().int().min(0).max(10_000_000).optional(),
    colno: z.number().int().min(0).max(100_000).optional(),
    message: z.string().max(500).optional(),
    stack: z.string().max(4000).optional(),
}).strict();

export async function POST(req: NextRequest) {
    const csrfFailure = requireSameOrigin(req);
    if (csrfFailure) return csrfFailure;

    const session = await auth();
    if (!session?.user?.id) return problem(401, 'authentication_required');

    const sourceAddress = getTrustedClientAddress(req);
    const rateLimit = await checkRateLimit(session.user.id, 'telemetry');
    if (!rateLimit.allowed) return problem(429, 'rate_limit_exceeded');

    const parsed = await parseStrictJson(req, telemetrySchema, 8 * 1024);
    if (!parsed.success) return parsed.response;

    emitSecurityEvent({
        category: 'validation',
        action: 'browser_error',
        outcome: 'failure',
        severity: 'low',
        actorId: session.user.id,
        actorRole: session.user.role,
        sourceAddress,
        metadata: {
            errorType: parsed.data.type,
            hasStack: Boolean(parsed.data.stack),
            line: parsed.data.lineno ?? null,
        },
    });

    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
}
