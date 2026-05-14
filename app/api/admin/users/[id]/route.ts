import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logAuditEvent } from '@/lib/audit-log';

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
        const session = await getAdminSession();
        if (!session) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { role } = body;

        if (role !== 'admin' && role !== 'student') {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        const [target] = await db
            .select({ id: users.id, email: users.email, role: users.role })
            .from(users)
            .where(eq(users.id, id))
            .limit(1);

        if (!target) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id));

        await logAuditEvent({
            type: 'user_role_change',
            actorId: session.user.id,
            actorEmail: session.user.email ?? '',
            description: `Changed role of ${target.email} from ${target.role} to ${role}`,
            targetId: id,
            targetType: 'user',
            metadata: { previousRole: target.role, newRole: role, targetEmail: target.email },
            ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
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
        const session = await getAdminSession();
        if (!session) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { id } = await params;

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
            actorEmail: session.user.email ?? '',
            description: `Deleted user account: ${target.email}`,
            targetId: id,
            targetType: 'user',
            metadata: { deletedEmail: target.email },
            ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin user DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
