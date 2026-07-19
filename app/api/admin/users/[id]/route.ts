import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { users } from '@/db/schema';
import { count, eq, sql } from 'drizzle-orm';
import { logAuditEvent } from '@/lib/audit-log';
import { z } from 'zod';
import { getTrustedClientAddress, parseStrictJson, problem, requireSameOrigin } from '@/lib/security/request';
import { checkRateLimit } from '@/lib/rate-limit';

const roleChangeSchema = z.object({
    role: z.enum(['student', 'professor', 'admin']),
}).strict();

async function getAdminSession() {
    const session = await auth();
    if (!session?.user?.id) return null;
    if (session.user.role !== 'admin') return null;
    return session;
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const csrfFailure = requireSameOrigin(request);
        if (csrfFailure) return csrfFailure;
        const session = await getAdminSession();
        if (!session) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const limit = await checkRateLimit(session.user.id, 'admin-mutation');
        if (!limit.allowed) return problem(429, 'rate_limit_exceeded');
        const { id } = await params;
        if (!/^[0-9a-f-]{36}$/i.test(id)) return problem(400, 'invalid_user_id');
        const parsed = await parseStrictJson(request, roleChangeSchema);
        if (!parsed.success) return parsed.response;
        const { role } = parsed.data;

        const [target] = await db
            .select({ id: users.id, role: users.role })
            .from(users)
            .where(eq(users.id, id))
            .limit(1);

        if (!target) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (target.role === 'admin' && role !== 'admin') {
            const [adminCount] = await db.select({ value: count() }).from(users).where(eq(users.role, 'admin'));
            if ((adminCount?.value ?? 0) <= 1) return problem(409, 'last_admin_cannot_be_removed');
        }

        await db.update(users).set({
            role,
            sessionVersion: sql`${users.sessionVersion} + 1`,
            updatedAt: new Date(),
        }).where(eq(users.id, id));

        await logAuditEvent({
            type: 'user_role_change',
            actorId: session.user.id,
            actorRole: session.user.role,
            description: `Changed user role from ${target.role} to ${role}`,
            targetId: id,
            targetType: 'user',
            metadata: { previousRole: target.role, newRole: role },
            sourceAddress: getTrustedClientAddress(request),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin user PATCH error:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const csrfFailure = requireSameOrigin(request);
        if (csrfFailure) return csrfFailure;
        const session = await getAdminSession();
        if (!session) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const limit = await checkRateLimit(session.user.id, 'admin-mutation');
        if (!limit.allowed) return problem(429, 'rate_limit_exceeded');
        const { id } = await params;
        if (!/^[0-9a-f-]{36}$/i.test(id)) return problem(400, 'invalid_user_id');

        if (id === session.user.id) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
        }

        const [target] = await db
            .select({ id: users.id, email: users.email })
            .from(users)
            .where(eq(users.id, id))
            .limit(1);

        if (!target) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        await db.delete(users).where(eq(users.id, id));

        await logAuditEvent({
            type: 'user_delete',
            actorId: session.user.id,
            actorRole: session.user.role,
            description: 'Deleted user account',
            targetId: id,
            targetType: 'user',
            sourceAddress: getTrustedClientAddress(request),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin user DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
