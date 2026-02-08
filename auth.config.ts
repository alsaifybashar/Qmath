import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
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
        jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as { role?: string }).role;
            }
            return token;
        },
        session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string | undefined;
            }
            return session;
        },
    },
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
