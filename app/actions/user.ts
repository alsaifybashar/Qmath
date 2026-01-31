'use server';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { users, profiles, userMastery } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getCurrentUser() {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'Not authenticated' };
    }

    try {
        const user = await db.query.users.findFirst({
            where: eq(users.id, session.user.id),
            with: {
                profile: {
                    with: {
                        university: true,
                    },
                },
            },
        });
        return { data: user };
    } catch (error) {
        console.error('Failed to fetch user:', error);
        return { error: 'Failed to fetch user data' };
    }
}

export async function getUserProgress() {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'Not authenticated' };
    }

    try {
        const masteryData = await db.query.userMastery.findMany({
            where: eq(userMastery.userId, session.user.id),
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
            return sum + parseFloat(item.masteryProbability as string || '0');
        }, 0);

        const overallProgress = masteryData.length > 0
            ? (totalMastery / masteryData.length) * 100
            : 0;

        return {
            data: {
                topics: masteryData,
                overallProgress: Math.round(overallProgress),
                topicsCompleted: masteryData.filter(m => parseFloat(m.masteryProbability as string) >= 0.8).length,
                totalTopics: masteryData.length,
            }
        };
    } catch (error) {
        console.error('Failed to fetch progress:', error);
        return { error: 'Failed to fetch progress data' };
    }
}

export async function updateUserProfile(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'Not authenticated' };
    }

    const name = formData.get('name') as string;
    const universityId = formData.get('universityId') as string;
    const universityProgram = formData.get('universityProgram') as string;
    const enrollmentYear = parseInt(formData.get('enrollmentYear') as string);
    const targetGpa = formData.get('targetGpa') as string;

    try {
        // Update user name
        if (name) {
            await db.update(users)
                .set({ name, updatedAt: new Date() })
                .where(eq(users.id, session.user.id));
        }

        // Update profile
        await db.update(profiles)
            .set({
                universityId: universityId || null,
                universityProgram,
                enrollmentYear: isNaN(enrollmentYear) ? null : enrollmentYear,
                targetGpa: targetGpa || null,
            })
            .where(eq(profiles.id, session.user.id));

        return { message: 'Profile updated successfully' };
    } catch (error) {
        console.error('Failed to update profile:', error);
        return { error: 'Failed to update profile' };
    }
}
