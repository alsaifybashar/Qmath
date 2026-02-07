'use server';

import { db } from '@/db/drizzle';
import { questionAttempts } from '@/db/dashboard-schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export async function classifyError(attemptId: string, errorType: string, reflection?: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    try {
        await db.update(questionAttempts)
            .set({
                errorType,
                reflectionText: reflection
            })
            .where(
                and(
                    eq(questionAttempts.id, attemptId),
                    eq(questionAttempts.userId, session.user.id)
                )
            );

        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Failed to classify error:', error);
        return { success: false, error: 'Failed to update error classification' };
    }
}
