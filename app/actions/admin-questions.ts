'use server';

import { db } from '@/db/drizzle';
import { questions, topics, courses, exams } from '@/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

// Helper to check admin access
async function checkAdmin() {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
        throw new Error('Unauthorized');
    }
    return session.user;
}

export async function getAdminCourses() {
    try {
        await checkAdmin();

        // Get codes of courses that have exams
        const coursesWithExams = await db
            .selectDistinct({ code: exams.courseCode })
            .from(exams);

        const validCodes = coursesWithExams.map(c => c.code);

        if (validCodes.length === 0) {
            return { data: [] };
        }

        const result = await db.query.courses.findMany({
            where: inArray(courses.code, validCodes),
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

export async function createTopic(data: {
    courseId: string;
    title: string;
    description?: string;
}): Promise<{ success: true; data: { id: string; title: string; slug: string } } | { success: false; error: string }> {
    try {
        await checkAdmin();

        // Use a random suffix to avoid slug collisions on concurrent inserts
        const slug = data.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            + '-' + crypto.randomUUID().slice(0, 8);

        const [newTopic] = await db.insert(topics).values({
            courseId: data.courseId,
            slug,
            title: data.title,
            description: data.description,
        }).returning();

        revalidatePath('/admin/questions');
        return { success: true, data: { id: newTopic.id, title: newTopic.title, slug: newTopic.slug } };
    } catch (error) {
        console.error('Failed to create topic:', error);
        return { success: false, error: 'Failed to create topic' };
    }
}

export async function getAdminTopics(courseId: string) {
    try {
        await checkAdmin();
        const result = await db.query.topics.findMany({
            where: eq(topics.courseId, courseId),
            orderBy: (topics, { asc }) => [asc(topics.title)],
        });
        return { data: result };
    } catch (error) {
        console.error('Failed to fetch topics:', error);
        return { error: 'Failed to fetch topics' };
    }
}

export async function getAdminQuestions(topicId: string) {
    try {
        await checkAdmin();
        const result = await db.query.questions.findMany({
            where: eq(questions.topicId, topicId),
            orderBy: [desc(questions.createdAt)],
        });
        return { data: result };
    } catch (error) {
        console.error('Failed to fetch questions:', error);
        return { error: 'Failed to fetch questions' };
    }
}

export async function createQuestion(data: {
    topicId: string;
    contentMarkdown: string;
    questionType: string;
    correctAnswer: string;
    options?: any;
    explanationMarkdown?: string;
    difficultyTier: number;
    isPublished?: boolean;
}) {
    try {
        await checkAdmin();

        await db.insert(questions).values({
            topicId: data.topicId,
            contentMarkdown: data.contentMarkdown,
            questionType: data.questionType,
            correctAnswer: data.correctAnswer,
            options: data.options,
            explanationMarkdown: data.explanationMarkdown,
            difficultyTier: data.difficultyTier,
            isPublished: data.isPublished ?? false,
        });

        revalidatePath('/admin/questions');
        return { success: true };
    } catch (error) {
        console.error('Failed to create question:', error);
        return { error: 'Failed to create question' };
    }
}

export async function updateQuestion(id: string, data: Partial<{
    contentMarkdown: string;
    questionType: string;
    correctAnswer: string;
    options: any;
    explanationMarkdown: string;
    difficultyTier: number;
    isPublished: boolean;
}>) {
    try {
        await checkAdmin();

        await db.update(questions)
            .set(data)
            .where(eq(questions.id, id));

        revalidatePath('/admin/questions');
        return { success: true };
    } catch (error) {
        console.error('Failed to update question:', error);
        return { error: 'Failed to update question' };
    }
}

export async function deleteQuestion(id: string) {
    try {
        await checkAdmin();

        await db.delete(questions).where(eq(questions.id, id));

        revalidatePath('/admin/questions');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete question:', error);
        return { error: 'Failed to delete question' };
    }
}
