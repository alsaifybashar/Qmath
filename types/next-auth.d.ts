import NextAuth, { DefaultSession, DefaultUser } from 'next-auth';
import type { AppRole } from '@/lib/security/roles';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            role: AppRole;
            sessionVersion: number;
        } & DefaultSession['user'];
    }

    interface User extends DefaultUser {
        role: AppRole;
        sessionVersion: number;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id?: string;
        role?: AppRole;
        sessionVersion?: number;
        invalid?: boolean;
    }
}
