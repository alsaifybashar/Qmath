'use server';

import { db } from '@/db/drizzle';
import { courses, topics, universities, users, enrollments, exams } from '@/db/schema';
import { eq, inArray, desc, and } from 'drizzle-orm';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export interface CourseSearchCatalogItem {
    id: string;
    code: string;
    name: string;
    nameSv: string | null;
    universityName: string | null;
    examCount: number;
}

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
        // Get codes of courses that have exams
        const coursesWithExams = await db
            .selectDistinct({ code: exams.courseCode })
            .from(exams);

        const validCodes = coursesWithExams.map(c => c.code);

        if (validCodes.length === 0) {
            return { data: [] };
        }

        const result = await db.query.courses.findMany({
            where: (courses, { and, eq, inArray }) => and(
                universityId ? eq(courses.universityId, universityId) : undefined,
                inArray(courses.code, validCodes)
            ),
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

export async function getCourseSearchCatalog(): Promise<CourseSearchCatalogItem[]> {
    try {
        const examRows = await db
            .select({
                courseCode: exams.courseCode,
            })
            .from(exams);

        const examCounts = examRows.reduce<Record<string, number>>((acc, exam) => {
            const code = exam.courseCode?.toUpperCase();
            if (!code) return acc;
            acc[code] = (acc[code] ?? 0) + 1;
            return acc;
        }, {});

        const validCodes = Object.keys(examCounts);
        if (validCodes.length === 0) return [];

        const result = await db.query.courses.findMany({
            where: (courses, { inArray }) => inArray(courses.code, validCodes),
            with: {
                university: true,
            },
            orderBy: (courses, { asc }) => [asc(courses.code)],
        });

        return result.map((course) => ({
            id: course.id,
            code: course.code,
            name: course.name,
            nameSv: course.nameSv ?? null,
            universityName: course.university?.name ?? null,
            examCount: examCounts[course.code.toUpperCase()] ?? 0,
        }));
    } catch (error) {
        console.error('Failed to fetch course search catalog:', error);
        return [];
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
                questions: {
                    where: (questions, { eq }) => eq(questions.isPublished, true),
                },
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

        const universityName = user.profile.university.name;

        // Get codes of courses that have exams (global availability filter)
        const coursesWithExams = await db
            .selectDistinct({ code: exams.courseCode })
            .from(exams);
        const validCodes = coursesWithExams.map(c => c.code);

        if (validCodes.length === 0) return { data: [], universityName };

        // Users should see a list of all courses that are available with old exams
        const coursesData = await db.query.courses.findMany({
            where: (courses, { inArray }) => inArray(courses.code, validCodes),
            orderBy: (courses, { asc }) => [asc(courses.code)],
        });

        return { data: coursesData, universityName };
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
        await db.transaction(async (tx) => {
            // Existing enrollments check is skipped for simplicity in onboarding
            // We just ensure we don't duplicate (if user re-runs onboarding)

            // Delete existing enrollments for this user to allow clean slate updates
            await tx.delete(enrollments).where(eq(enrollments.userId, session.user.id)).run();

            // Bulk insert new enrollments
            if (courseIds.length > 0) {
                await tx.insert(enrollments).values(
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

    redirect('/onboarding/diagnostic');
}

// ============ ADD / REMOVE SINGLE ENROLLMENT ============

/**
 * Add a single course to the user's enrollments without touching existing ones.
 * Used from the Courses page "Discover" section.
 */
export async function addCourseEnrollment(courseId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Not authenticated' };

    try {
        // Check if already enrolled
        const existing = await db.query.enrollments.findFirst({
            where: and(
                eq(enrollments.userId, session.user.id),
                eq(enrollments.courseId, courseId)
            ),
        });

        if (existing) return { error: 'Already enrolled in this course' };

        await db.insert(enrollments).values({
            userId: session.user.id,
            courseId,
        });

        revalidatePath('/courses');
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Failed to add enrollment:', error);
        return { error: 'Failed to add course' };
    }
}

/**
 * Search for courses that have old exams in the archive.
 * Returns courses (from the courses table) whose code matches the query,
 * plus a count of available archive exams, so students can discover and add them.
 */
export async function searchCoursesWithExams(query: string) {
    if (!query || query.trim().length < 2) return { data: [] };

    const q = query.trim().toUpperCase();

    try {
        // Get all exams matching the query
        const matchingExams = await db
            .select({
                courseCode: exams.courseCode,
                courseName: exams.courseName,
            })
            .from(exams)
            .where(eq(exams.courseCode, q));

        if (matchingExams.length === 0) return { data: [] };

        // Deduplicate by courseCode
        const uniqueCodes = [...new Set(matchingExams.map((e) => e.courseCode))];

        // Look up matching courses in the courses table
        const matchedCourses = await db.query.courses.findMany({
            where: inArray(courses.code, uniqueCodes),
        });

        // Count exams per code
        const examCounts = matchingExams.reduce<Record<string, number>>((acc, e) => {
            acc[e.courseCode] = (acc[e.courseCode] || 0) + 1;
            return acc;
        }, {});

        // Build result: matched courses first, then phantom entries for codes not yet in courses table
        const result = uniqueCodes.map((code) => {
            const course = matchedCourses.find((c) => c.code === code);
            const nameFromExam = matchingExams.find((e) => e.courseCode === code)?.courseName ?? code;
            return {
                id: course?.id ?? null,           // null = not in courses table yet
                code,
                name: course?.name ?? nameFromExam,
                examCount: examCounts[code] ?? 0,
                canEnroll: !!course,               // only enroll if course record exists
            };
        });

        return { data: result };
    } catch (error) {
        console.error('Failed to search courses with exams:', error);
        return { data: [], error: 'Search failed' };
    }
}

/**
 * Get the current user's enrolled course IDs (lightweight — just the IDs).
 */
export async function getEnrolledCourseIds(): Promise<string[]> {
    const session = await auth();
    if (!session?.user?.id) return [];

    const rows = await db
        .select({ courseId: enrollments.courseId })
        .from(enrollments)
        .where(eq(enrollments.userId, session.user.id));

    return rows.map((r) => r.courseId);
}
