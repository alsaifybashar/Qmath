'use server';

import { db } from '@/db/drizzle';
import { courses, topics, universities, users, enrollments, exams } from '@/db/schema';
import { eq, inArray, desc } from 'drizzle-orm';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

// ============ UNIVERSITIES ============

export async function getUniversities() {
    try {
        const result = await db.query.universities.findMany({
            orderBy: (universities, { asc }) => [asc(universities.name)],
        });
        return { data: result };
    } catch (error) {
        console.error('Failed to fetch universities:', error);
        return { error: 'Failed to fetch universities' };
    }
}

export async function getUniversityById(id: string) {
    try {
        const result = await db.query.universities.findFirst({
            where: eq(universities.id, id),
            with: {
                courses: true,
            },
        });
        return { data: result };
    } catch (error) {
        console.error('Failed to fetch university:', error);
        return { error: 'Failed to fetch university' };
    }
}

// ============ COURSES ============

export async function getCourses(universityId?: string) {
    try {
        const result = await db.query.courses.findMany({
            where: universityId ? eq(courses.universityId, universityId) : undefined,
            with: {
                university: true,
            },
            orderBy: (courses, { asc }) => [asc(courses.code)],
        });
        return { data: result };
    } catch (error) {
        console.error('Failed to fetch courses:', error);
        return { error: 'Failed to fetch courses' };
    }
}

export async function getCourseById(id: string) {
    try {
        const result = await db.query.courses.findFirst({
            where: eq(courses.id, id),
            with: {
                university: true,
                topics: true,
            },
        });
        return { data: result };
    } catch (error) {
        console.error('Failed to fetch course:', error);
        return { error: 'Failed to fetch course' };
    }
}


export async function getCourseByCode(code: string) {
    try {
        const result = await db.query.courses.findFirst({
            where: eq(courses.code, code.toUpperCase()),
            with: {
                university: true,
                topics: true,
            },
        });
        return { data: result };
    } catch (error) {
        console.error('Failed to fetch course by code:', error);
        return { error: 'Failed to fetch course' };
    }
}

export async function getCourseExams(courseCode: string, limit = 10) {
    try {
        const safeLimit = Math.min(limit, 50); // Security cap
        const result = await db.query.exams.findMany({
            where: eq(exams.courseCode, courseCode.toUpperCase()),
            orderBy: [desc(exams.examDate)],
            limit: safeLimit,
        });
        return { data: result };
    } catch (error) {
        console.error('Failed to fetch course exams:', error);
        return { error: 'Failed to fetch course exams' };
    }
}

// ============ TOPICS ============

export async function getTopics(courseId?: string) {
    try {
        const result = await db.query.topics.findMany({
            where: courseId ? eq(topics.courseId, courseId) : undefined,
            with: {
                course: true,
            },
            orderBy: (topics, { asc }) => [asc(topics.title)],
        });
        return { data: result };
    } catch (error) {
        console.error('Failed to fetch topics:', error);
        return { error: 'Failed to fetch topics' };
    }
}

export async function getTopicBySlug(slug: string) {
    try {
        const result = await db.query.topics.findFirst({
            where: eq(topics.slug, slug),
            with: {
                course: {
                    with: {
                        university: true,
                    },
                },
                questions: true,
            },
        });
        return { data: result };
    } catch (error) {
        console.error('Failed to fetch topic:', error);
        return { error: 'Failed to fetch topic' };
    }
}

// ============ USER COURSES (ONBOARDING) ============

export async function getSuggestedCourses() {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Not authenticated' };

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

        if (!user?.profile?.university) {
            return { data: [] };
        }

        const { university, universityProgram } = user.profile;
        let coursesData = [];

        // Check for Linköping University + Information Technology match
        // "civilingenjör i informationsteknologi" is the key string
        const programLower = universityProgram?.toLowerCase() || '';
        const isLiu = university.name.includes('Linköping');
        const isIT = programLower.includes('informationsteknologi') || programLower.includes('datateknik');

        if (isLiu && isIT) {
            const specificCodes = ['TDDC75', 'TATB04', 'TANA23', 'TATA41', 'TATA24', 'TATA91', 'TAMS42'];

            coursesData = await db.query.courses.findMany({
                where: (courses, { inArray, and, eq }) => and(
                    eq(courses.universityId, university.id),
                    inArray(courses.code, specificCodes)
                )
            });

            // If some courses are missing (not seeded yet), we just return what we find.
        } else {
            // Default: Return up to 10 courses for that university
            coursesData = await db.query.courses.findMany({
                where: eq(courses.universityId, university.id),
                limit: 10,
            });
        }

        return { data: coursesData, universityName: university.name };
    } catch (error) {
        console.error('Failed to fetch suggested courses:', error);
        return { error: 'Failed to fetch suggested courses' };
    }
}

export async function saveUserCourses(courseIds: string[]) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Not authenticated' };

    if (!courseIds || courseIds.length === 0) {
        // Allow skipping selection? Maybe. Let's redirect anyway.
        redirect('/dashboard');
        return;
    }

    try {
        // Use a transaction to safely handle enrollment updates
        db.transaction((tx) => {
            // Existing enrollments check is skipped for simplicity in onboarding
            // We just ensure we don't duplicate (if user re-runs onboarding)

            // Delete existing enrollments for this user to allow clean slate updates
            tx.delete(enrollments).where(eq(enrollments.userId, session.user.id)).run();

            // Bulk insert new enrollments
            if (courseIds.length > 0) {
                tx.insert(enrollments).values(
                    courseIds.map(cid => ({
                        userId: session.user.id!,
                        courseId: cid
                    }))
                ).run();
            }
        });

        revalidatePath('/dashboard');
    } catch (error) {
        console.error('Failed to save courses:', error);
        return { error: 'Failed to save courses' };
    }

    redirect('/dashboard');
}
