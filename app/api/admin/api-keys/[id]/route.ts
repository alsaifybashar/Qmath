import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { apiKeys } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logAuditEvent } from '@/lib/audit-log';
import { getTrustedClientAddress, problem, requireSameOrigin } from '@/lib/security/request';
import { checkRateLimit } from '@/lib/rate-limit';

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
        const csrfFailure = requireSameOrigin(request);
        if (csrfFailure) return csrfFailure;
        const session = await getAdminSession();
        if (!session) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const limit = await checkRateLimit(session.user.id, 'admin-mutation');
        if (!limit.allowed) return problem(429, 'rate_limit_exceeded');
        const { id } = await params;
        if (!/^[0-9a-f-]{36}$/i.test(id)) return problem(400, 'invalid_key_id');

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
            actorRole: session.user.role,
            description: `Revoked API key: "${key.name}"`,
            targetId: id,
            targetType: 'api_key',
            sourceAddress: getTrustedClientAddress(request),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API key revoke error:', error);
        return NextResponse.json({ error: 'Failed to revoke API key' }, { status: 500 });
    }
}
