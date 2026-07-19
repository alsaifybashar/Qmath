import type { NextAuthConfig } from 'next-auth';
import { db } from '@/db/drizzle';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { normalizeRole } from '@/lib/security/roles';

export const authConfig = {
    // Host headers are security-sensitive; only trust a known platform or an
    // explicitly configured reverse proxy that overwrites forwarded headers.
    trustHost: Boolean(process.env.VERCEL) || process.env.AUTH_TRUST_HOST === 'true',
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user?.id;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            const isOnAdmin = nextUrl.pathname.startsWith('/admin');

            if (isOnAdmin) {
                if (!isLoggedIn) return false; // Redirect to login
                // Role is in session only when JWT/session callbacks run (see auth.ts)
                const role = (auth.user as { role?: string })?.role;
                if (role !== 'admin') {
                    return Response.redirect(new URL('/', nextUrl));
                }
                return true;
            }
            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            }
            if (isLoggedIn && (nextUrl.pathname === '/login' || nextUrl.pathname === '/register')) {
                return Response.redirect(new URL('/dashboard', nextUrl));
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = typeof user.id === 'string' ? user.id : undefined;
                token.role = normalizeRole(user.role);
                token.sessionVersion = typeof user.sessionVersion === 'number' ? user.sessionVersion : 0;
                token.invalid = false;
                return token;
            }

            const tokenId = typeof token.id === 'string' ? token.id : null;
            if (tokenId) {
                const current = await db.query.users.findFirst({
                    columns: { id: true, role: true, sessionVersion: true },
                    where: eq(users.id, tokenId),
                });
                if (!current || current.sessionVersion !== token.sessionVersion) {
                    token.invalid = true;
                    token.id = undefined;
                    token.role = undefined;
                } else {
                    token.role = normalizeRole(current.role);
                }
            }
            return token;
        },
        session({ session, token }) {
            if (token.invalid || !token.id) {
                // Auth.js' Session type always declares a user, but an invalidated
                // stateless token must not remain an authenticated principal.
                return { ...session, user: undefined } as unknown as typeof session;
            }
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = normalizeRole(token.role);
                session.user.sessionVersion = typeof token.sessionVersion === 'number' ? token.sessionVersion : 0;
            }
            return session;
        },
    },
    session: {
        strategy: 'jwt',
        maxAge: 12 * 60 * 60,
        updateAge: 15 * 60,
    },
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
