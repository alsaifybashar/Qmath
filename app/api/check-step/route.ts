import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit';
import { checkStepCore } from '@/lib/study/check-step-core';
import { z } from 'zod';
import { parseStrictJson, problem, requireSameOrigin } from '@/lib/security/request';

const checkStepRequestSchema = z.object({
    stepId: z.string().uuid(),
    questionId: z.string().uuid(),
    topicId: z.string().uuid(),
    studentInput: z.string().min(1).max(1000),
    sessionId: z.string().uuid().nullable().optional(),
}).strict();

export async function POST(req: NextRequest) {
    const csrfFailure = requireSameOrigin(req);
    if (csrfFailure) return csrfFailure;

    const session = await auth();
    if (!session?.user?.id) {
        return problem(401, 'authentication_required');
    }
    const userId = session.user.id;

    const rateLimit = await checkRateLimit(userId, 'grading');
    if (!rateLimit.allowed) {
        return NextResponse.json(
            { error: 'För många förfrågningar. Vänta en stund.' },
            { status: 429, headers: rateLimitHeaders(rateLimit) }
        );
    }

    const parsed = await parseStrictJson(req, checkStepRequestSchema);
    if (!parsed.success) return parsed.response;
    const body = parsed.data;
    const result = await checkStepCore(userId, {
        stepId: body.stepId,
        questionId: body.questionId,
        topicId: body.topicId,
        studentInput: body.studentInput,
        sessionId: body.sessionId ?? null,
    });

    if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(
        {
            isCorrect: result.isCorrect,
            parsedStudent: result.parsedStudent,
            feedback: result.feedback,
            newMastery: result.newMastery,
            fadePhase: result.fadePhase,
            phaseChanged: result.phaseChanged,
            revealedSteps: result.revealedSteps,
            allStepsComplete: false, // caller tracks completion
        },
        { headers: { ...rateLimitHeaders(rateLimit), 'Cache-Control': 'no-store' } }
    );
}
