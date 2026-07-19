'use server';

import { db } from '@/db/drizzle';
import { users, profiles, userMastery } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';

const onboardingProfileSchema = z.object({
    universityId: z.string().uuid(),
    universityProgram: z.string().trim().min(1).max(200),
    studyYear: z.number().int().min(1).max(10),
}).strict();

const userProfileSchema = z.object({
    name: z.string().trim().min(1).max(100),
    universityId: z.union([z.string().uuid(), z.literal('')]),
    universityProgram: z.string().trim().max(200),
    enrollmentYear: z.coerce.number().int().min(1900).max(new Date().getUTCFullYear() + 10).nullable(),
    targetGpa: z.coerce.number().min(0).max(5).nullable(),
}).strict();

export async function getCurrentUser() {
    const userIdentity = await requireAuth();

    try {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userIdentity.id),
            with: {
                profile: {
                    with: {
                        university: true,
                    },
                },
            },
        });
        return { data: user };
    } catch {
        return { error: 'Failed to fetch user data' };
    }
}

export async function getUserProgress() {
    const userIdentity = await requireAuth();

    try {
        const masteryData = await db.query.userMastery.findMany({
            where: eq(userMastery.userId, userIdentity.id),
            with: {
                topic: {
                    with: {
                        course: true,
                    },
                },
            },
        });

        // Calculate overall progress
        const totalMastery = masteryData.reduce((sum, item) => {
            const prob = typeof item.masteryProbability === 'number' ? item.masteryProbability : parseFloat(String(item.masteryProbability || '0'));
            return sum + (isNaN(prob) ? 0 : prob);
        }, 0);

        const overallProgress = masteryData.length > 0
            ? (totalMastery / masteryData.length) * 100
            : 0;

        return {
            data: {
                topics: masteryData,
                overallProgress: Math.round(overallProgress),
                topicsCompleted: masteryData.filter(m => {
                    const p = typeof m.masteryProbability === 'number' ? m.masteryProbability : parseFloat(String(m.masteryProbability || '0'));
                    return !isNaN(p) && p >= 0.8;
                }).length,
                totalTopics: masteryData.length,
            }
        };
    } catch {
        return { error: 'Failed to fetch progress data' };
    }
}

export async function saveOnboardingProfile(data: {
    universityId: string;
    universityProgram: string;
    studyYear: number;
}) {
    const userIdentity = await requireAuth();
    const parsed = onboardingProfileSchema.safeParse(data);
    if (!parsed.success) return { error: 'Invalid profile data' };

    try {
        await db.update(profiles)
            .set({
                universityId: parsed.data.universityId,
                universityProgram: parsed.data.universityProgram,
                studyYear: parsed.data.studyYear,
            })
            .where(eq(profiles.id, userIdentity.id));

        revalidatePath('/onboarding/courses');
        return { success: true };
    } catch {
        return { error: 'Failed to save profile. Please try again.' };
    }
}

export async function updateUserProfile(formData: FormData) {
    const userIdentity = await requireAuth();
    const parsed = userProfileSchema.safeParse({
        name: formData.get('name'),
        universityId: formData.get('universityId') || '',
        universityProgram: formData.get('universityProgram') || '',
        enrollmentYear: formData.get('enrollmentYear') || null,
        targetGpa: formData.get('targetGpa') || null,
    });
    if (!parsed.success) return { error: 'Invalid profile data' };

    try {
        await db.transaction(async (transaction) => {
            await transaction.update(users)
                .set({ name: parsed.data.name, updatedAt: new Date() })
                .where(eq(users.id, userIdentity.id))
                .run();
            await transaction.update(profiles)
                .set({
                    universityId: parsed.data.universityId || null,
                    universityProgram: parsed.data.universityProgram,
                    enrollmentYear: parsed.data.enrollmentYear,
                    targetGpa: parsed.data.targetGpa,
                })
                .where(eq(profiles.id, userIdentity.id))
                .run();
        });

        return { message: 'Profile updated successfully' };
    } catch {
        return { error: 'Failed to update profile' };
    }
}
