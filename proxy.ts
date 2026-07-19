import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function contentSecurityPolicy(nonce: string): string {
    return [
        "default-src 'self'",
        "base-uri 'none'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com",
        "img-src 'self' data: blob: https://api.dicebear.com",
        "font-src 'self' data: https://fonts.gstatic.com",
        "connect-src 'self'",
        "worker-src 'self' blob: https://unpkg.com",
        "frame-src 'self' blob:",
        "manifest-src 'self'",
        "upgrade-insecure-requests",
    ].join('; ');
}

export const proxy = auth((request) => {
    const pathname = request.nextUrl.pathname;
    if (
        pathname.startsWith('/api/')
        && !pathname.startsWith('/api/auth/')
        && MUTATING_METHODS.has(request.method)
    ) {
        const origin = request.headers.get('origin');
        const fetchSite = request.headers.get('sec-fetch-site');
        const originMatches = origin === request.nextUrl.origin;
        if (fetchSite === 'cross-site' || (process.env.NODE_ENV === 'production' && !originMatches)) {
            return NextResponse.json(
                { error: 'Cross-site request rejected' },
                { status: 403, headers: { 'Cache-Control': 'no-store' } },
            );
        }
    }

    const nonce = crypto.randomBytes(16).toString('base64');
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set('Content-Security-Policy', contentSecurityPolicy(nonce));

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set('Content-Security-Policy', contentSecurityPolicy(nonce));
    return response;
});

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)',
    ],
};
