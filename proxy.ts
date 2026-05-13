import { auth } from '@/auth';

/**
 * Next.js 16+ uses the `proxy` convention (Node.js runtime) instead of deprecated `middleware`.
 * Reuse the same NextAuth `auth` instance as route handlers and server actions so session
 * cookies issued by `signIn` are validated with identical configuration (providers, secret, callbacks).
 */
export const proxy = auth;

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
