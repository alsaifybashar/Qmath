import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const MAX_JSON_BYTES = 64 * 1024;

export function problem(status: number, code: string, detail?: string): NextResponse {
    return NextResponse.json(
        {
            type: `https://qmath.app/problems/${code}`,
            title: code.replaceAll('_', ' '),
            status,
            ...(detail ? { detail } : {}),
        },
        {
            status,
            headers: {
                'Cache-Control': 'no-store',
                'Content-Type': 'application/problem+json',
            },
        },
    );
}

export function hasJsonContentType(request: Request): boolean {
    return request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase() === 'application/json';
}

export async function parseStrictJson<T extends z.ZodType>(
    request: Request,
    schema: T,
    maxBytes = MAX_JSON_BYTES,
): Promise<{ success: true; data: z.output<T> } | { success: false; response: NextResponse }> {
    if (!hasJsonContentType(request)) {
        return { success: false, response: problem(415, 'unsupported_content_type') };
    }

    const declaredLength = Number(request.headers.get('content-length') ?? '0');
    if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
        return { success: false, response: problem(413, 'request_too_large') };
    }

    let raw: string;
    try {
        raw = await request.text();
    } catch {
        return { success: false, response: problem(400, 'invalid_request_body') };
    }
    if (Buffer.byteLength(raw, 'utf8') > maxBytes) {
        return { success: false, response: problem(413, 'request_too_large') };
    }

    let json: unknown;
    try {
        json = JSON.parse(raw);
    } catch {
        return { success: false, response: problem(400, 'invalid_json') };
    }

    const parsed = schema.safeParse(json);
    if (!parsed.success) {
        return { success: false, response: problem(400, 'invalid_request') };
    }
    return { success: true, data: parsed.data };
}

export function isSameOrigin(request: NextRequest): boolean {
    const origin = request.headers.get('origin');
    if (!origin) return process.env.NODE_ENV !== 'production';

    try {
        const originUrl = new URL(origin);
        return originUrl.protocol === request.nextUrl.protocol && originUrl.host === request.nextUrl.host;
    } catch {
        return false;
    }
}

export function requireSameOrigin(request: NextRequest): NextResponse | null {
    return isSameOrigin(request) ? null : problem(403, 'cross_site_request_rejected');
}

export function getTrustedClientAddress(request: Request): string {
    const platformIp = request.headers.get('x-vercel-forwarded-for')
        ?? (process.env.TRUST_PROXY_IP_HEADER === 'true' ? request.headers.get('x-real-ip') : null);
    if (platformIp) return platformIp.split(',')[0].trim().slice(0, 64);
    return 'unknown';
}
