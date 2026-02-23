'use server';

import { db } from '@/db/drizzle';
import { questions, topics, courses } from '@/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

// ── Auth helper ──────────────────────────────────────────────────────────────

async function checkAdmin() {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
        throw new Error('Unauthorized');
    }
    return session.user;
}

// ── Courses ──────────────────────────────────────────────────────────────────

export async function getAdminCourses() {
    try {
        await checkAdmin();

        const result = await db.query.courses.findMany({
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

// ── Topics ───────────────────────────────────────────────────────────────────

export async function createTopic(data: {
    courseId: string;
    title: string;
    description?: string;
}): Promise<{ success: true; data: { id: string; title: string; slug: string } } | { success: false; error: string }> {
    try {
        await checkAdmin();

        // Guard: reject duplicate titles within the same course (case-insensitive)
        const duplicate = await db
            .select({ id: topics.id })
            .from(topics)
            .where(
                and(
                    eq(topics.courseId, data.courseId),
                    sql`lower(trim(${topics.title})) = lower(trim(${data.title}))`,
                )
            )
            .limit(1);

        if (duplicate.length > 0) {
            return { success: false, error: `Ett ämne med namnet "${data.title}" finns redan i den här kursen.` };
        }

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

// ── Questions — CRUD ─────────────────────────────────────────────────────────

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
    guidanceSteps?: any;
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
            guidanceSteps: data.guidanceSteps ?? null,
            status: 'draft',
            isPublished: false,
        });

        revalidatePath('/admin/questions');
        revalidatePath('/study');
        revalidatePath('/practice');
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
    guidanceSteps: any;
}>) {
    try {
        await checkAdmin();

        // When content is edited, reset to draft so it can be re-analyzed
        await db.update(questions)
            .set({
                ...data,
                status: 'draft',
                aiDifficultyTier: null,
                aiAnalysis: null,
                aiAnalyzedAt: null,
                isPublished: false,
            })
            .where(eq(questions.id, id));

        revalidatePath('/admin/questions');
        revalidatePath('/study');
        revalidatePath('/practice');
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
        revalidatePath('/study');
        revalidatePath('/practice');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete question:', error);
        return { error: 'Failed to delete question' };
    }
}

// ── Questions — Status & Publishing ──────────────────────────────────────────

export type QuestionStatus = 'draft' | 'ai_review' | 'ready' | 'published';

export async function updateQuestionStatus(
    id: string,
    status: QuestionStatus
): Promise<{ success: boolean; error?: string }> {
    try {
        await checkAdmin();

        await db.update(questions)
            .set({
                status,
                isPublished: status === 'published',
            })
            .where(eq(questions.id, id));

        revalidatePath('/admin/questions');
        revalidatePath('/study');
        revalidatePath('/practice');
        return { success: true };
    } catch (error) {
        console.error('Failed to update question status:', error);
        return { success: false, error: 'Failed to update status' };
    }
}

export async function publishQuestions(
    ids: string[]
): Promise<{ success: boolean; published: number; error?: string }> {
    try {
        await checkAdmin();

        // Only publish questions that are in 'ready' state
        let published = 0;
        for (const id of ids) {
            const q = await db.query.questions.findFirst({
                where: eq(questions.id, id),
            });
            if (q && (q.status === 'ready' || q.status === 'published')) {
                await db.update(questions)
                    .set({ status: 'published', isPublished: true })
                    .where(eq(questions.id, id));
                published++;
            }
        }

        revalidatePath('/admin/questions');
        revalidatePath('/study');
        revalidatePath('/practice');
        return { success: true, published };
    } catch (error) {
        console.error('Failed to publish questions:', error);
        return { success: false, published: 0, error: 'Failed to publish questions' };
    }
}

export async function unpublishQuestion(
    id: string
): Promise<{ success: boolean; error?: string }> {
    try {
        await checkAdmin();

        await db.update(questions)
            .set({ status: 'ready', isPublished: false })
            .where(eq(questions.id, id));

        revalidatePath('/admin/questions');
        revalidatePath('/study');
        revalidatePath('/practice');
        return { success: true };
    } catch (error) {
        console.error('Failed to unpublish question:', error);
        return { success: false, error: 'Failed to unpublish question' };
    }
}
