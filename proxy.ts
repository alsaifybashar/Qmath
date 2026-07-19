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
        // 'strict-dynamic' allows scripts loaded by a nonced script to run.
        // 'unsafe-inline' is ignored by browsers that support nonces but keeps
        // older browsers functional.
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline'`,
        // Google Fonts stylesheet is served from fonts.googleapis.com;
        // the actual font files are served from fonts.gstatic.com.
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com",
        "img-src 'self' data: blob: https://api.dicebear.com",
        "font-src 'self' data: https://fonts.gstatic.com",
        // Vercel Speed Insights and Web Analytics call vitals.vercel-insights.com.
        // Next.js HMR in dev also calls the same origin via websocket.
        "connect-src 'self' https://vitals.vercel-insights.com https://vercel.live",
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

    // Prevent Vercel's edge network from caching HTML pages. A cached HTML
    // response would contain a nonce that no longer matches the CSP header
    // sent on subsequent requests, breaking all inline scripts.
    // Static assets under /_next/static/ are intentionally excluded from this
    // middleware via the matcher below and are still edge-cached normally.
    response.headers.set('Cache-Control', 'private, no-store, must-revalidate');

    return response;
});

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)',
    ],
};
