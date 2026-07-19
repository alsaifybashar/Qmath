import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { SymbolicValidator } from '@/lib/content-generation';
import { checkRateLimit } from '@/lib/rate-limit';
import { parseStrictJson, problem, requireSameOrigin } from '@/lib/security/request';

const validateSchema = z.object({
    studentAnswer: z.string().min(1).max(1000),
    // This compatibility endpoint is non-authoritative. Persistent grading
    // always retrieves the expected answer from the database server-side.
    expectedAnswer: z.string().min(1).max(1000),
    alternativeForms: z.array(z.string().max(1000)).max(20).optional(),
    problemType: z.enum(['algebraic', 'trigonometric', 'calculus', 'linear_algebra']).optional(),
}).strict();

export async function POST(request: NextRequest) {
    try {
        const csrfFailure = requireSameOrigin(request);
        if (csrfFailure) return csrfFailure;

        const session = await auth();
        if (!session?.user?.id) return problem(401, 'authentication_required');
        const rateLimit = await checkRateLimit(session.user.id, 'grading');
        if (!rateLimit.allowed) return problem(429, 'rate_limit_exceeded');

        const parsed = await parseStrictJson(request, validateSchema);
        if (!parsed.success) return parsed.response;

        const validator = new SymbolicValidator();
        const result = await validator.validate(parsed.data);
        return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
    } catch {
        return problem(500, 'internal_server_error');
    }
}
