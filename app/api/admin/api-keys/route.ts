import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { apiKeys } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import crypto from 'crypto';
import { logAuditEvent } from '@/lib/audit-log';

async function getAdminSession() {
    const session = await auth();
    if (!session?.user?.id) return null;
    if (session.user.role !== 'admin') return null;
    return session;
}

export async function GET() {
    try {
        const session = await getAdminSession();
        if (!session) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const keys = await db
            .select({
                id: apiKeys.id,
                name: apiKeys.name,
                keyPrefix: apiKeys.keyPrefix,
                permissions: apiKeys.permissions,
                isActive: apiKeys.isActive,
                createdBy: apiKeys.createdBy,
                expiresAt: apiKeys.expiresAt,
                lastUsedAt: apiKeys.lastUsedAt,
                createdAt: apiKeys.createdAt,
            })
            .from(apiKeys)
            .where(eq(apiKeys.isActive, true))
            .orderBy(desc(apiKeys.createdAt));

        return NextResponse.json({ keys });
    } catch (error) {
        console.error('API keys fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getAdminSession();
        if (!session) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { name, permissions, expiresInDays } = body;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json({ error: 'Key name is required' }, { status: 400 });
        }

        // Generate a secure random key
        const rawKey = `qmk_${crypto.randomBytes(32).toString('hex')}`;
        const keyPrefix = rawKey.slice(0, 12);
        const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

        const expiresAt = expiresInDays
            ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
            : null;

        const [inserted] = await db
            .insert(apiKeys)
            .values({
                name: name.trim(),
                keyHash,
                keyPrefix,
                permissions: Array.isArray(permissions) ? permissions : [],
                createdBy: session.user.id,
                expiresAt: expiresAt ?? undefined,
                isActive: true,
            })
            .returning({ id: apiKeys.id });

        await logAuditEvent({
            type: 'key_generate',
            actorId: session.user.id,
            actorEmail: session.user.email ?? '',
            description: `Generated API key: "${name.trim()}"`,
            targetId: inserted.id,
            targetType: 'api_key',
            metadata: { keyPrefix, permissions },
            ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
        });

        // Return the full key ONCE — it is never stored in plaintext
        return NextResponse.json({ id: inserted.id, key: rawKey, keyPrefix });
    } catch (error) {
        console.error('API key generate error:', error);
        return NextResponse.json({ error: 'Failed to generate API key' }, { status: 500 });
    }
}
