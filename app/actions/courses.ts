'use server';

import { db } from '@/db/drizzle';
import { courses, topics, universities } from '@/db/schema';
import { eq } from 'drizzle-orm';

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
