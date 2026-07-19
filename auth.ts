
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import { db } from './db/drizzle';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';
import {
    consumeEquivalentPasswordCost,
    hashPassword,
    normalizeEmail,
    verifyPassword,
} from './lib/security/password';
import { normalizeRole } from './lib/security/roles';
import { checkRateLimit } from './lib/rate-limit';
import { emitSecurityEvent } from './lib/security/events';
import { getTrustedClientAddress } from './lib/security/request';

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    callbacks: authConfig.callbacks,
    cookies: {
        sessionToken: {
            name: process.env.NODE_ENV === 'production' ? '__Host-qmath_session' : 'qmath_session',
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
    },
    providers: [
        Credentials({
            async authorize(credentials, request) {
                const parsedCredentials = z
                    .object({
                        email: z.string().email().max(254),
                        password: z.string().min(1).max(128),
                    })
                    .strict()
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { password } = parsedCredentials.data;
                    const email = normalizeEmail(parsedCredentials.data.email);
                    const sourceAddress = getTrustedClientAddress(request);
                    const [accountLimit, sourceLimit] = await Promise.all([
                        checkRateLimit(email, 'login-account'),
                        checkRateLimit(sourceAddress, 'login-source'),
                    ]);
                    if (!accountLimit.allowed || !sourceLimit.allowed) {
                        emitSecurityEvent({
                            category: 'authentication',
                            action: 'login',
                            outcome: 'denied',
                            severity: 'medium',
                            sourceAddress,
                            reason: 'rate_limited',
                        });
                        return null;
                    }

                    const user = await db.query.users.findFirst({
                        where: eq(users.email, email)
                    });

                    if (!user?.password) {
                        await consumeEquivalentPasswordCost(password);
                        emitSecurityEvent({
                            category: 'authentication',
                            action: 'login',
                            outcome: 'failure',
                            sourceAddress,
                            reason: 'invalid_credentials',
                        });
                        return null;
                    }

                    const verification = await verifyPassword(user.password, password);
                    if (verification.valid) {
                        if (verification.needsRehash) {
                            await db.update(users)
                                .set({ password: await hashPassword(password), updatedAt: new Date() })
                                .where(eq(users.id, user.id));
                        }
                        emitSecurityEvent({
                            category: 'authentication',
                            action: 'login',
                            outcome: 'success',
                            actorId: user.id,
                            actorRole: normalizeRole(user.role),
                            sourceAddress,
                        });
                        // Map database user to NextAuth User type (null -> undefined)
                        return {
                            id: user.id,
                            email: user.email,
                            name: user.name || undefined,
                            image: user.image || undefined,
                            role: normalizeRole(user.role),
                            sessionVersion: user.sessionVersion,
                        };
                    }

                    emitSecurityEvent({
                        category: 'authentication',
                        action: 'login',
                        outcome: 'failure',
                        actorId: user.id,
                        sourceAddress,
                        reason: 'invalid_credentials',
                    });
                }

                return null;
            },
        }),
    ],
});
