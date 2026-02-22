'use server';

import { db } from '@/db/drizzle';
import { topics, questions, courses } from '@/db/schema';
import { eq, and, asc, sql, inArray } from 'drizzle-orm';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { getExamAnalysis } from './exam-analysis';
import type { ExamTopicNode } from './exam-analysis';

// ── Auth ─────────────────────────────────────────────────────────────────────

async function checkAdmin() {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
        throw new Error('Unauthorized');
    }
    return session.user;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface AdminTopic {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    source: string | null;
    phase: string | null;
    aiImportance: number | null;
    aiDifficulty: string | null;
    studyTips: string[] | null;
    commonMistakes: string[] | null;
    examFrequency: string | null;
    examSections: string[] | null;
    sortOrder: number | null;
    questionCount: number;
}

// ── Get all topics for a course (with question count) ────────────────────────

export async function getAdminCourseTopics(
    courseId: string
): Promise<{ success: true; topics: AdminTopic[] } | { success: false; error: string }> {
    try {
        await checkAdmin();

        const courseTopics = await db
            .select({
                id: topics.id,
                slug: topics.slug,
                title: topics.title,
                description: topics.description,
                source: topics.source,
                phase: topics.phase,
                aiImportance: topics.aiImportance,
                aiDifficulty: topics.aiDifficulty,
                studyTips: topics.studyTips,
                commonMistakes: topics.commonMistakes,
                examFrequency: topics.examFrequency,
                examSections: topics.examSections,
                sortOrder: topics.sortOrder,
            })
            .from(topics)
            .where(eq(topics.courseId, courseId))
            .orderBy(asc(topics.sortOrder), asc(topics.title));

        if (courseTopics.length === 0) {
            return { success: true, topics: [] };
        }

        // Get question counts
        const topicIds = courseTopics.map(t => t.id);
        const counts = await db
            .select({
                topicId: questions.topicId,
                count: sql<number>`count(*)`.mapWith(Number),
            })
            .from(questions)
            .where(inArray(questions.topicId, topicIds))
            .groupBy(questions.topicId);

        const countMap = new Map(counts.map(c => [c.topicId, c.count]));

        const result: AdminTopic[] = courseTopics.map(t => ({
            ...t,
            studyTips: t.studyTips as string[] | null,
            commonMistakes: t.commonMistakes as string[] | null,
            examSections: t.examSections as string[] | null,
            questionCount: countMap.get(t.id) ?? 0,
        }));

        return { success: true, topics: result };
    } catch (error) {
        console.error('Failed to fetch course topics:', error);
        return { success: false, error: 'Failed to fetch topics' };
    }
}

// ── Sync AI topics from exam analysis into topics table ──────────────────────

export async function syncAITopics(
    courseId: string
): Promise<{ success: true; imported: number; updated: number; total: number } | { success: false; error: string }> {
    try {
        await checkAdmin();

        // 1. Get exam analysis for this course
        const analysis = await getExamAnalysis(courseId);
        if ('error' in analysis) {
            return { success: false, error: analysis.error };
        }

        const aiNodes = analysis.examTopicMap;
        if (aiNodes.length === 0) {
            return { success: false, error: 'No AI topics found in exam analysis.' };
        }

        // 2. Get existing topics for this course
        const existingTopics = await db
            .select({ id: topics.id, slug: topics.slug, title: topics.title, source: topics.source })
            .from(topics)
            .where(eq(topics.courseId, courseId));

        // Key by normalised title — slug has a random suffix so it can't be used for lookup
        const existingByTitle = new Map(
            existingTopics.map(t => [t.title.toLowerCase().trim(), t])
        );

        let imported = 0;
        let updated = 0;

        // 3. Upsert each AI topic — match by normalised title to prevent duplicates
        for (const node of aiNodes) {
            const slug = node.slug || slugify(node.topicName);
            const normalizedTitle = node.topicName.toLowerCase().trim();
            const existing = existingByTitle.get(normalizedTitle);

            const topicData = {
                courseId,
                title: node.topicName,
                description: node.description || node.aiReasoning,
                source: 'ai' as const,
                phase: node.phase,
                aiImportance: node.aiImportance,
                aiDifficulty: node.aiDifficulty,
                studyTips: node.studyTips,
                commonMistakes: node.commonMistakes,
                examFrequency: node.frequencyLabel,
                examSections: node.examSections,
                sortOrder: node.learningOrder,
                baseDifficulty: node.aiDifficulty === 'hard' ? 4 : node.aiDifficulty === 'medium' ? 3 : 2,
            };

            if (existing) {
                // Update existing topic with fresh AI data
                await db.update(topics)
                    .set(topicData)
                    .where(eq(topics.id, existing.id));
                updated++;
            } else {
                // Insert new topic
                await db.insert(topics).values({
                    ...topicData,
                    slug: slug + '-' + crypto.randomUUID().slice(0, 6),
                });
                imported++;
            }
        }

        revalidatePath('/admin/courses');
        revalidatePath('/admin/questions');

        return {
            success: true,
            imported,
            updated,
            total: aiNodes.length,
        };
    } catch (error) {
        console.error('Failed to sync AI topics:', error);
        return { success: false, error: 'Failed to sync AI topics' };
    }
}

// ── Update a topic ───────────────────────────────────────────────────────────

export async function updateTopic(
    id: string,
    data: Partial<{
        title: string;
        description: string;
        phase: string;
        aiDifficulty: string;
        sortOrder: number;
        studyTips: string[];
        commonMistakes: string[];
    }>
): Promise<{ success: boolean; error?: string }> {
    try {
        await checkAdmin();

        await db.update(topics)
            .set(data)
            .where(eq(topics.id, id));

        revalidatePath('/admin/courses');
        revalidatePath('/admin/questions');
        return { success: true };
    } catch (error) {
        console.error('Failed to update topic:', error);
        return { success: false, error: 'Failed to update topic' };
    }
}

// ── Delete a topic ───────────────────────────────────────────────────────────

export async function deleteTopic(
    id: string
): Promise<{ success: boolean; error?: string }> {
    try {
        await checkAdmin();

        await db.delete(topics).where(eq(topics.id, id));

        revalidatePath('/admin/courses');
        revalidatePath('/admin/questions');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete topic:', error);
        return { success: false, error: 'Failed to delete topic' };
    }
}

// ── Reorder topics ───────────────────────────────────────────────────────────

export async function reorderTopics(
    updates: Array<{ id: string; sortOrder: number }>
): Promise<{ success: boolean; error?: string }> {
    try {
        await checkAdmin();

        for (const { id, sortOrder } of updates) {
            await db.update(topics)
                .set({ sortOrder })
                .where(eq(topics.id, id));
        }

        revalidatePath('/admin/courses');
        return { success: true };
    } catch (error) {
        console.error('Failed to reorder topics:', error);
        return { success: false, error: 'Failed to reorder topics' };
    }
}

// ── Get all courses (for admin topic management — not restricted to exams) ──

export async function getAllAdminCourses(): Promise<{ success: true; courses: any[] } | { success: false; error: string }> {
    try {
        await checkAdmin();

        const result = await db.query.courses.findMany({
            with: { university: true },
            orderBy: (courses, { asc }) => [asc(courses.code)],
        });

        return { success: true, courses: result };
    } catch (error) {
        console.error('Failed to fetch courses:', error);
        return { success: false, error: 'Failed to fetch courses' };
    }
}

// ── Helper ───────────────────────────────────────────────────────────────────

function slugify(name: string): string {
    return name
        .toLowerCase()
        .replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o')
        .replace(/é/g, 'e').replace(/è/g, 'e').replace(/ü/g, 'u')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}
