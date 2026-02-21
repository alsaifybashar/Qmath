
'use server';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'Not authenticated' };
    }

    const universityProgram = formData.get('universityProgram') as string;
    const enrollmentYear = parseInt(formData.get('enrollmentYear') as string);
    const targetGpaRaw = formData.get('targetGpa') as string;
    const targetGpa = targetGpaRaw ? parseFloat(targetGpaRaw) : undefined;

    try {
        await db.update(profiles)
            .set({
                universityProgram,
                enrollmentYear: isNaN(enrollmentYear) ? undefined : enrollmentYear,
                targetGpa: targetGpa === undefined || isNaN(targetGpa) ? undefined : targetGpa,
            })
            .where(eq(profiles.id, session.user.id));

        revalidatePath('/dashboard/profile');
        return { message: 'Profile updated successfully' };
    } catch (error) {
        console.error('Failed to update profile:', error);
        return { error: 'Failed to update profile' };
    }
}
