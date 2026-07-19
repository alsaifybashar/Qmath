import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db/drizzle';
import { exams } from '@/db/schema';
import { requireAdmin } from '@/lib/auth';
import { MAX_EXAM_FILE_SIZE } from '@/lib/exam-storage';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit';
import { problem, requireSameOrigin } from '@/lib/security/request';

const payloadSchema = z.object({
    examId: z.string().uuid(),
    kind: z.enum(['exam', 'solution']),
}).strict();

export async function POST(request: NextRequest) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) return problem(503, 'blob_storage_not_configured');
    const declaredLength = Number(request.headers.get('content-length') ?? '0');
    if (declaredLength > 64 * 1024) return problem(413, 'request_too_large');

    let body: HandleUploadBody;
    try {
        body = await request.json() as HandleUploadBody;
    } catch {
        return problem(400, 'invalid_upload_request');
    }

    const isTokenRequest = body.type === 'blob.generate-client-token';
    let headers: Record<string, string> = {};
    if (isTokenRequest) {
        const csrfFailure = requireSameOrigin(request);
        if (csrfFailure) return csrfFailure;
        let user: Awaited<ReturnType<typeof requireAdmin>>;
        try {
            user = await requireAdmin();
        } catch {
            return problem(403, 'admin_access_required');
        }
        const rate = await checkRateLimit(user.id, 'admin-mutation');
        if (!rate.allowed) return problem(429, 'rate_limit_exceeded');
        headers = rateLimitHeaders(rate);
    }

    try {
        const result = await handleUpload({
            request,
            body,
            onBeforeGenerateToken: async (pathname, clientPayload) => {
                const payload = payloadSchema.parse(JSON.parse(clientPayload ?? 'null'));
                const exam = await db.query.exams.findFirst({
                    columns: { id: true },
                    where: eq(exams.id, payload.examId),
                });
                if (!exam) throw new Error('Exam not found');
                const expectedPrefix = `exams/${payload.examId}/${payload.kind}-`;
                if (!pathname.startsWith(expectedPrefix) || !pathname.toLowerCase().endsWith('.pdf')) {
                    throw new Error('Invalid exam Blob pathname');
                }
                return {
                    allowedContentTypes: ['application/pdf'],
                    maximumSizeInBytes: MAX_EXAM_FILE_SIZE,
                    addRandomSuffix: true,
                    allowOverwrite: false,
                    cacheControlMaxAge: 60,
                    validUntil: Date.now() + 10 * 60 * 1000,
                    tokenPayload: JSON.stringify(payload),
                };
            },
        });
        return NextResponse.json(result, { headers });
    } catch (error) {
        console.error('Exam Blob upload authorization failed:', error);
        return problem(400, 'invalid_blob_upload');
    }
}
