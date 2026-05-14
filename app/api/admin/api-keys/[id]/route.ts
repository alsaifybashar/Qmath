import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { apiKeys } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logAuditEvent } from '@/lib/audit-log';

async function getAdminSession() {
    const session = await auth();
    if (!session?.user?.id) return null;
    if (session.user.role !== 'admin') return null;
    return session;
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

        const [key] = await db
            .select({ id: apiKeys.id, name: apiKeys.name, isActive: apiKeys.isActive })
            .from(apiKeys)
            .where(eq(apiKeys.id, id))
            .limit(1);

        if (!key) {
            return NextResponse.json({ error: 'API key not found' }, { status: 404 });
        }

        if (!key.isActive) {
            return NextResponse.json({ error: 'API key is already revoked' }, { status: 400 });
        }

        await db.update(apiKeys).set({ isActive: false }).where(eq(apiKeys.id, id));

        await logAuditEvent({
            type: 'key_revoke',
            actorId: session.user.id,
            actorEmail: session.user.email ?? '',
            description: `Revoked API key: "${key.name}"`,
            targetId: id,
            targetType: 'api_key',
            ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API key revoke error:', error);
        return NextResponse.json({ error: 'Failed to revoke API key' }, { status: 500 });
    }
}
