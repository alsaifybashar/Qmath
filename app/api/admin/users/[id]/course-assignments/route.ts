import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, inArray } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { courseAssignments, courses, users } from '@/db/schema';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAuditEvent } from '@/lib/audit-log';
import { getTrustedClientAddress, parseStrictJson, problem, requireSameOrigin } from '@/lib/security/request';

const assignmentSchema = z.object({
    courseIds: z.array(z.string().uuid()).max(100),
}).strict();

async function requireAdminSession() {
    const session = await auth();
    return session?.user?.id && session.user.role === 'admin' ? session : null;
}

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const session = await requireAdminSession();
    if (!session) return problem(403, 'admin_access_required');
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return problem(400, 'invalid_user_id');

    const assignments = await db
        .select({ courseId: courseAssignments.courseId })
        .from(courseAssignments)
        .where(eq(courseAssignments.professorId, id));
    return NextResponse.json({ courseIds: assignments.map((item) => item.courseId) }, {
        headers: { 'Cache-Control': 'no-store' },
    });
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const csrfFailure = requireSameOrigin(request);
    if (csrfFailure) return csrfFailure;
    const session = await requireAdminSession();
    if (!session) return problem(403, 'admin_access_required');
    const rateLimit = await checkRateLimit(session.user.id, 'admin-mutation');
    if (!rateLimit.allowed) return problem(429, 'rate_limit_exceeded');

    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return problem(400, 'invalid_user_id');
    const parsed = await parseStrictJson(request, assignmentSchema);
    if (!parsed.success) return parsed.response;
    const courseIds = [...new Set(parsed.data.courseIds)];

    const professor = await db
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(eq(users.id, id))
        .limit(1)
        .get();
    if (!professor || professor.role !== 'professor') return problem(409, 'user_is_not_professor');

    if (courseIds.length > 0) {
        const existingCourses = await db
            .select({ id: courses.id })
            .from(courses)
            .where(inArray(courses.id, courseIds));
        if (existingCourses.length !== courseIds.length) return problem(400, 'unknown_course_id');
    }

    await db.transaction(async (transaction) => {
        await transaction.delete(courseAssignments)
            .where(eq(courseAssignments.professorId, id))
            .run();
        if (courseIds.length > 0) {
            await transaction.insert(courseAssignments).values(courseIds.map((courseId) => ({
                professorId: id,
                courseId,
                assignedBy: session.user.id,
            }))).run();
        }
    });

    await logAuditEvent({
        type: 'course_assignment_change',
        actorId: session.user.id,
        actorRole: session.user.role,
        description: 'Changed professor course assignments',
        targetId: id,
        targetType: 'user',
        metadata: { courseCount: courseIds.length },
        sourceAddress: getTrustedClientAddress(request),
    });

    return NextResponse.json({ success: true, courseIds }, { headers: { 'Cache-Control': 'no-store' } });
}
