import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import { topics } from '@/db/schema';
import { AuthenticationError, AuthorizationError, requireCourseEditor } from '@/lib/auth';
import { ContentGenerator } from '@/lib/content-generation';
import { checkRateLimit } from '@/lib/rate-limit';
import { parseStrictJson, problem, requireSameOrigin } from '@/lib/security/request';
import type { ContentType } from '@/db/content-schema';

const contentTypes = [
    'free_form_symbolic', 'faded_worked_example', 'parsons_problem', 'line_by_line',
    'graphical_manipulation', 'counter_example', 'error_spotting', 'confidence_tagged',
] as const satisfies readonly ContentType[];

const generateSchema = z.object({
    topicId: z.string().uuid(),
    contentType: z.enum(contentTypes),
    difficulty: z.number().int().min(1).max(5).optional(),
    sourceExamQuestionIds: z.array(z.string().uuid()).max(20).optional(),
    count: z.number().int().min(1).max(5).default(1),
}).strict();

export async function POST(request: NextRequest) {
    try {
        const csrfFailure = requireSameOrigin(request);
        if (csrfFailure) return csrfFailure;

        const parsed = await parseStrictJson(request, generateSchema);
        if (!parsed.success) return parsed.response;
        const { topicId, contentType, difficulty, sourceExamQuestionIds, count } = parsed.data;

        const topic = await db
            .select({ courseId: topics.courseId })
            .from(topics)
            .where(eq(topics.id, topicId))
            .limit(1)
            .get();
        if (!topic?.courseId) return problem(404, 'topic_not_found');

        const user = await requireCourseEditor(topic.courseId);
        const rateLimit = await checkRateLimit(user.id, 'ai');
        if (!rateLimit.allowed) return problem(429, 'rate_limit_exceeded');

        const generator = new ContentGenerator(process.env.AI_PROVIDER || 'mock');
        const results = [];
        for (let index = 0; index < count; index += 1) {
            results.push(await generator.generate({
                topicId,
                contentType,
                difficulty,
                sourceExamQuestionIds,
            }));
        }

        if (count === 1) return NextResponse.json(results[0], { headers: { 'Cache-Control': 'no-store' } });
        return NextResponse.json({
            success: results.every((result) => result.success),
            results,
            successCount: results.filter((result) => result.success).length,
            failCount: results.filter((result) => !result.success).length,
        }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        if (error instanceof AuthenticationError) return problem(401, 'authentication_required');
        if (error instanceof AuthorizationError) return problem(403, 'forbidden');
        return problem(500, 'internal_server_error');
    }
}
