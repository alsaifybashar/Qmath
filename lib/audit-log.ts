import { db } from '@/db/drizzle';
import { auditLogs } from '@/db/schema';

export type AuditEventType =
    | 'user_role_change'
    | 'user_delete'
    | 'exam_delete'
    | 'question_publish'
    | 'key_generate'
    | 'key_revoke'
    | 'admin_login';

export async function logAuditEvent(params: {
    type: AuditEventType;
    actorId: string;
    actorEmail: string;
    description: string;
    targetId?: string;
    targetType?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
}): Promise<void> {
    try {
        await db.insert(auditLogs).values({
            type: params.type,
            actorId: params.actorId,
            actorEmail: params.actorEmail,
            description: params.description,
            targetId: params.targetId,
            targetType: params.targetType,
            metadata: params.metadata,
            ipAddress: params.ipAddress,
        });
    } catch (err) {
        // Audit log failures must never crash the primary operation
        console.error('[audit-log] Failed to write audit event:', err);
    }
}
