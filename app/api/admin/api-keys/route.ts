import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { apiKeys } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import crypto from 'crypto';
import { logAuditEvent } from '@/lib/audit-log';
import { z } from 'zod';
import { getTrustedClientAddress, parseStrictJson, problem, requireSameOrigin } from '@/lib/security/request';
import { checkRateLimit } from '@/lib/rate-limit';

const createKeySchema = z.object({
    name: z.string().trim().min(1).max(100),
    permissions: z.array(z.enum([
        'read:questions', 'read:users', 'write:questions', 'ai:invoke', 'admin:full',
    ])).max(5).default([]),
    expiresInDays: z.number().int().min(1).max(365).nullable().optional(),
}).strict();

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
        const csrfFailure = requireSameOrigin(request);
        if (csrfFailure) return csrfFailure;
        const session = await getAdminSession();
        if (!session) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const limit = await checkRateLimit(session.user.id, 'admin-mutation');
        if (!limit.allowed) return problem(429, 'rate_limit_exceeded');
        const parsed = await parseStrictJson(request, createKeySchema);
        if (!parsed.success) return parsed.response;
        const { name, permissions, expiresInDays } = parsed.data;

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
                permissions,
                createdBy: session.user.id,
                expiresAt: expiresAt ?? undefined,
                isActive: true,
            })
            .returning({ id: apiKeys.id });

        await logAuditEvent({
            type: 'key_generate',
            actorId: session.user.id,
            actorRole: session.user.role,
            description: `Generated API key: "${name.trim()}"`,
            targetId: inserted.id,
            targetType: 'api_key',
            metadata: { keyPrefix, permissions },
            sourceAddress: getTrustedClientAddress(request),
        });

        // Return the full key ONCE — it is never stored in plaintext
        return NextResponse.json(
            { id: inserted.id, key: rawKey, keyPrefix },
            { headers: { 'Cache-Control': 'no-store' } },
        );
    } catch (error) {
        console.error('API key generate error:', error);
        return NextResponse.json({ error: 'Failed to generate API key' }, { status: 500 });
    }
}
