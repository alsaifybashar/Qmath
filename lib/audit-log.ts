import { db } from '@/db/drizzle';
import { auditLogs } from '@/db/schema';
import { emitSecurityEvent, pseudonymize } from '@/lib/security/events';

export type AuditEventType =
    | 'user_role_change'
    | 'user_delete'
    | 'exam_delete'
    | 'exam_update'
    | 'question_publish'
    | 'key_generate'
    | 'key_revoke'
    | 'admin_login'
    | 'course_assignment_change';

function safeDescription(value: string): string {
    return value
        .replace(/[\r\n\u001b]/g, ' ')
        .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
        .slice(0, 300);
}

function safeMetadata(metadata: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
    if (!metadata) return undefined;
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(metadata)) {
        if (/(email|password|secret|token|cookie|authorization|answer|prompt|key$)/i.test(key)) continue;
        if (typeof value === 'string') result[key] = value.replace(/[\r\n\u001b]/g, ' ').slice(0, 200);
        else if (typeof value === 'number' || typeof value === 'boolean' || value === null) result[key] = value;
        else if (Array.isArray(value)) result[key] = value.slice(0, 20).map((item) => String(item).slice(0, 80));
    }
    return result;
}

export async function logAuditEvent(params: {
    type: AuditEventType;
    actorId: string;
    actorRole?: string;
    description: string;
    targetId?: string;
    targetType?: string;
    metadata?: Record<string, unknown>;
    sourceAddress?: string;
    requestId?: string;
}): Promise<void> {
    const description = safeDescription(params.description);
    const metadata = safeMetadata(params.metadata);

    // Security-critical audit writes are intentionally not swallowed. Callers
    // must treat an unavailable audit store as a failed privileged operation.
    await db.insert(auditLogs).values({
        type: params.type,
        actorId: params.actorId,
        actorEmail: null,
        description,
        targetId: params.targetId,
        targetType: params.targetType,
        metadata,
        ipAddress: pseudonymize(params.sourceAddress),
    });

    emitSecurityEvent({
        category: 'administration',
        action: params.type,
        outcome: 'success',
        severity: 'high',
        actorId: params.actorId,
        actorRole: params.actorRole ?? 'admin',
        resourceType: params.targetType,
        resourceId: params.targetId,
        sourceAddress: params.sourceAddress,
        requestId: params.requestId,
        metadata: metadata as Record<string, string | number | boolean | null> | undefined,
    });
}
