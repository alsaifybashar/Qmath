import { cookies } from 'next/headers';
import { db } from '@/db/drizzle';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface User {
    id: string;
    email: string;
    name: string | null;
    role: string;
}

/**
 * Get current user from session
 * This is a simplified auth helper - in production use proper auth library
 */
export async function getUser(): Promise<User | null> {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get('user_id')?.value;

        if (!userId) {
            return null;
        }

        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

        if (!user) {
            return null;
        }

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role ?? 'student',
        };
    } catch (error) {
        console.error('Error getting user:', error);
        return null;
    }
}

/**
 * Check if user is authenticated
 */
export async function requireAuth(): Promise<User> {
    const user = await getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    return user;
}

/**
 * Check if user is admin
 */
export async function requireAdmin(): Promise<User> {
    const user = await requireAuth();

    if (user.role !== 'admin') {
        throw new Error('Forbidden: Admin access required');
    }

    return user;
}
