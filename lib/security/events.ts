import crypto from 'node:crypto';

export type SecurityEventCategory =
    | 'authentication'
    | 'authorization'
    | 'validation'
    | 'session'
    | 'data_access'
    | 'administration'
    | 'rate_limit';

export interface SecurityEvent {
    category: SecurityEventCategory;
    action: string;
    outcome: 'success' | 'failure' | 'denied';
    severity?: 'info' | 'low' | 'medium' | 'high' | 'critical';
    actorId?: string | null;
    actorRole?: string | null;
    resourceType?: string;
    resourceId?: string | null;
    requestId?: string | null;
    sourceAddress?: string | null;
    reason?: string;
    metadata?: Record<string, string | number | boolean | null>;
}

function correlationKey(): string {
    const key = process.env.AUDIT_HMAC_KEY ?? process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
    if (key) return key;
    if (process.env.NODE_ENV === 'production') {
        throw new Error('AUDIT_HMAC_KEY or AUTH_SECRET is required in production');
    }
    return 'qmath-development-audit-key';
}

export function pseudonymize(value: string | null | undefined): string | undefined {
    if (!value) return undefined;
    return `hmac:v1:${crypto.createHmac('sha256', correlationKey()).update(value).digest('base64url')}`;
}

function normalizeText(value: string): string {
    return value.replace(/[\r\n\u001b]/g, ' ').slice(0, 256);
}

export function emitSecurityEvent(event: SecurityEvent): void {
    const record = {
        '@timestamp': new Date().toISOString(),
        schema_version: '1.0',
        event: {
            category: event.category,
            action: normalizeText(event.action),
            outcome: event.outcome,
            severity: event.severity ?? 'info',
            ...(event.reason ? { reason: normalizeText(event.reason) } : {}),
        },
        actor: {
            id: pseudonymize(event.actorId),
            role: event.actorRole,
        },
        resource: {
            type: event.resourceType,
            id: pseudonymize(event.resourceId),
        },
        http: {
            request_id: event.requestId?.slice(0, 128),
            source: pseudonymize(event.sourceAddress),
        },
        metadata: event.metadata,
        deployment: {
            environment: process.env.NODE_ENV ?? 'development',
            version: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GIT_SHA ?? 'unknown',
        },
    };

    // One JSON object per line prevents attacker-controlled log formatting.
    console.info(JSON.stringify(record));
}

