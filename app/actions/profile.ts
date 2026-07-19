
'use server';

import { db } from '@/db/drizzle';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';

const profileSchema = z.object({
    universityProgram: z.string().trim().max(200),
    enrollmentYear: z.coerce.number().int().min(1900).max(new Date().getUTCFullYear() + 10).optional(),
    targetGpa: z.coerce.number().min(0).max(5).optional(),
}).strict();

export async function updateProfile(formData: FormData) {
    const user = await requireAuth();
    const parsed = profileSchema.safeParse({
        universityProgram: formData.get('universityProgram'),
        enrollmentYear: formData.get('enrollmentYear') || undefined,
        targetGpa: formData.get('targetGpa') || undefined,
    });
    if (!parsed.success) return { error: 'Invalid profile data' };

    try {
        await db.update(profiles)
            .set({
                universityProgram: parsed.data.universityProgram,
                enrollmentYear: parsed.data.enrollmentYear,
                targetGpa: parsed.data.targetGpa,
            })
            .where(eq(profiles.id, user.id));

        revalidatePath('/dashboard/profile');
        return { message: 'Profile updated successfully' };
    } catch {
        return { error: 'Failed to update profile' };
    }
}
