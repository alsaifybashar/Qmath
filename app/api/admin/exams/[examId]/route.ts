import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import { exams } from '@/db/schema';
import { requireAdmin } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit-log';
import {
    deleteExamFile,
    validateUploadedExamBlob,
} from '@/lib/exam-storage';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit';
import { getTrustedClientAddress, problem, requireSameOrigin } from '@/lib/security/request';

const idSchema = z.string().uuid();
const metadataSchema = z.object({
    courseCode: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{2,24}$/),
    courseName: z.string().trim().min(1).max(200),
    examDate: z.iso.date().transform((value) => new Date(`${value}T00:00:00.000Z`)),
    examType: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{1,32}$/),
    removeSolution: z.boolean().default(false),
    examBlobUrl: z.url().optional(),
    solutionBlobUrl: z.url().optional(),
}).strict();

const MAX_JSON_BYTES = 16 * 1024;

async function context(request: NextRequest) {
    let user: Awaited<ReturnType<typeof requireAdmin>>;
    try {
        user = await requireAdmin();
    } catch {
        return null;
    }
    const sourceAddress = getTrustedClientAddress(request);
    const rate = await checkRateLimit(user.id, 'admin-mutation');
    return { user, sourceAddress, rate };
}

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ examId: string }> },
) {
    try {
        await requireAdmin();
    } catch {
        return problem(403, 'admin_access_required');
    }
    const parsedId = idSchema.safeParse((await params).examId);
    if (!parsedId.success) return problem(400, 'invalid_exam_id');

    const exam = await db.query.exams.findFirst({ where: eq(exams.id, parsedId.data) });
    if (!exam) return problem(404, 'exam_not_found');
    return NextResponse.json({ exam }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ examId: string }> },
) {
    const csrfFailure = requireSameOrigin(request);
    if (csrfFailure) return csrfFailure;
    const secured = await context(request);
    if (!secured) return problem(403, 'admin_access_required');
    const { user, sourceAddress, rate } = secured;
    if (!rate.allowed) return problem(429, 'rate_limit_exceeded');

    const parsedId = idSchema.safeParse((await params).examId);
    if (!parsedId.success) return problem(400, 'invalid_exam_id');
    const exam = await db.query.exams.findFirst({ where: eq(exams.id, parsedId.data) });
    if (!exam) return problem(404, 'exam_not_found');

    await db.delete(exams).where(eq(exams.id, exam.id));
    if (exam.filePath) await deleteExamFile(exam.filePath);
    if (exam.solutionFilePath) await deleteExamFile(exam.solutionFilePath);
    await logAuditEvent({
        actorId: user.id,
        actorRole: user.role,
        type: 'exam_delete',
        description: 'Exam deleted',
        targetType: 'exam',
        targetId: exam.id,
        sourceAddress,
    });

    return NextResponse.json({ success: true }, { headers: rateLimitHeaders(rate) });
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ examId: string }> },
) {
    const csrfFailure = requireSameOrigin(request);
    if (csrfFailure) return csrfFailure;
    const secured = await context(request);
    if (!secured) return problem(403, 'admin_access_required');
    const { user, sourceAddress, rate } = secured;
    if (!rate.allowed) return problem(429, 'rate_limit_exceeded');

    const declaredLength = Number(request.headers.get('content-length') ?? '0');
    if (Number.isFinite(declaredLength) && declaredLength > MAX_JSON_BYTES) {
        return problem(413, 'request_too_large');
    }

    const parsedId = idSchema.safeParse((await params).examId);
    if (!parsedId.success) return problem(400, 'invalid_exam_id');
    const existing = await db.query.exams.findFirst({ where: eq(exams.id, parsedId.data) });
    if (!existing) return problem(404, 'exam_not_found');

    let payload: unknown;
    try {
        payload = await request.json();
    } catch {
        return problem(400, 'invalid_json_body');
    }
    const parsed = metadataSchema.safeParse(payload);
    if (!parsed.success) return problem(400, 'invalid_exam_metadata');
    const metadata = parsed.data;

    const updateData: Partial<typeof exams.$inferInsert> = {
        courseCode: metadata.courseCode,
        courseName: metadata.courseName,
        examDate: metadata.examDate,
        examType: metadata.examType,
        updatedAt: new Date(),
    };

    if (metadata.examBlobUrl) {
        try {
            const uploaded = await validateUploadedExamBlob(metadata.examBlobUrl);
            updateData.fileName = uploaded.fileName;
            updateData.filePath = metadata.examBlobUrl;
            updateData.fileSize = uploaded.size;
        } catch {
            return problem(400, 'invalid_exam_pdf');
        }
    }

    if (metadata.removeSolution) {
        updateData.hasSolution = false;
        updateData.solutionFileName = null;
        updateData.solutionFilePath = null;
        updateData.solutionFileSize = null;
    } else if (metadata.solutionBlobUrl) {
        try {
            const uploaded = await validateUploadedExamBlob(metadata.solutionBlobUrl);
            updateData.hasSolution = true;
            updateData.solutionFileName = uploaded.fileName;
            updateData.solutionFilePath = metadata.solutionBlobUrl;
            updateData.solutionFileSize = uploaded.size;
        } catch {
            return problem(400, 'invalid_solution_pdf');
        }
    }

    const [updatedExam] = await db
        .update(exams)
        .set(updateData)
        .where(eq(exams.id, existing.id))
        .returning();

    if (existing.filePath && existing.filePath !== updatedExam.filePath) await deleteExamFile(existing.filePath);
    if (existing.solutionFilePath && existing.solutionFilePath !== updatedExam.solutionFilePath) {
        await deleteExamFile(existing.solutionFilePath);
    }

    await logAuditEvent({
        actorId: user.id,
        actorRole: user.role,
        type: 'exam_update',
        description: 'Exam updated',
        targetType: 'exam',
        targetId: existing.id,
        sourceAddress,
    });

    return NextResponse.json(
        { success: true, exam: updatedExam },
        { headers: { ...rateLimitHeaders(rate), 'Cache-Control': 'no-store' } },
    );
}
