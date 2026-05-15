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

export async function deleteAdminCourse(courseId: string): Promise<{ success: true } | { success: false; error: string }> {
    try {
        await checkAdmin();

        const course = await db.query.courses.findFirst({
            where: eq(courses.id, courseId),
        });

        if (!course) {
            return { success: false, error: 'Course not found' };
        }

        const [{ count: sameCodeCount }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(courses)
            .where(eq(courses.code, course.code));
        const isLastCourseForCode = Number(sameCodeCount) <= 1;

        await db.transaction(async (tx) => {
            tx.run(sql`
                delete from content_attempts
                where content_id in (
                    select gc.id
                    from generated_content gc
                    inner join topics t on t.id = gc.topic_id
                    where t.course_id = ${courseId}
                )
            `);
            tx.run(sql`
                delete from content_quality
                where content_id in (
                    select gc.id
                    from generated_content gc
                    inner join topics t on t.id = gc.topic_id
                    where t.course_id = ${courseId}
                )
            `);
            tx.run(sql`
                delete from generated_content
                where topic_id in (select id from topics where course_id = ${courseId})
            `);

            tx.run(sql`
                delete from question_attempts
                where question_id in (
                    select q.id
                    from questions q
                    inner join topics t on t.id = q.topic_id
                    where t.course_id = ${courseId}
                )
            `);
            tx.run(sql`
                delete from question_steps
                where question_id in (
                    select q.id
                    from questions q
                    inner join topics t on t.id = q.topic_id
                    where t.course_id = ${courseId}
                )
            `);
            tx.run(sql`
                delete from attempt_logs
                where question_id in (
                    select q.id
                    from questions q
                    inner join topics t on t.id = q.topic_id
                    where t.course_id = ${courseId}
                )
            `);
            tx.run(sql`
                delete from diagnostic_item_responses
                where topic_id in (select id from topics where course_id = ${courseId})
                   or question_id in (
                        select q.id
                        from questions q
                        inner join topics t on t.id = q.topic_id
                        where t.course_id = ${courseId}
                   )
            `);

            tx.run(sql`
                delete from user_mastery
                where topic_id in (select id from topics where course_id = ${courseId})
            `);
            tx.run(sql`
                delete from user_topic_mastery
                where topic_id in (select id from topics where course_id = ${courseId})
            `);
            tx.run(sql`
                delete from calibration_logs
                where topic_id in (select id from topics where course_id = ${courseId})
            `);
            tx.run(sql`
                delete from prerequisite_edges
                where from_topic_id in (select id from topics where course_id = ${courseId})
                   or to_topic_id in (select id from topics where course_id = ${courseId})
            `);
            tx.run(sql`
                update misconceptions
                set remediation_topic_id = null
                where remediation_topic_id in (select id from topics where course_id = ${courseId})
            `);

            tx.run(sql`
                delete from exam_questions
                where topic_id in (select id from topics where course_id = ${courseId})
                   or source_exam_id in (select id from source_exams where course_id = ${courseId})
            `);
            tx.run(sql`delete from source_exams where course_id = ${courseId}`);
            tx.run(sql`delete from articles where course_id = ${courseId} or topic_id in (select id from topics where course_id = ${courseId})`);
            tx.run(sql`delete from questions where topic_id in (select id from topics where course_id = ${courseId})`);
            tx.run(sql`delete from topics where course_id = ${courseId}`);

            tx.run(sql`delete from enrollments where course_id = ${courseId}`);
            tx.run(sql`delete from user_city where course_id = ${courseId}`);
            tx.run(sql`delete from course_areas where course_id = ${courseId}`);
            tx.run(sql`update study_sessions set course_id = null where course_id = ${courseId}`);
            tx.run(sql`update diagnostic_results set course_id = null where course_id = ${courseId}`);

            if (isLastCourseForCode) {
                tx.run(sql`delete from exams where course_code = ${course.code}`);
                tx.run(sql`delete from course_exam_analysis_cache where course_code = ${course.code}`);
            }
            tx.delete(courses).where(eq(courses.id, courseId)).run();
        });

        revalidatePath('/admin/questions');
        revalidatePath('/admin/courses');
        revalidatePath('/courses');
        revalidatePath('/archive');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete course:', error);
        return { success: false, error: 'Failed to delete course' };
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

export async function deleteTopic(topicId: string): Promise<{ success: true } | { success: false; error: string }> {
    try {
        await checkAdmin();

        const topic = await db.query.topics.findFirst({
            where: eq(topics.id, topicId),
        });

        if (!topic) {
            return { success: false, error: 'Topic not found' };
        }

        await db.transaction(async (tx) => {
            // Delete content related to this topic
            tx.run(sql`
                delete from content_attempts
                where content_id in (
                    select id from generated_content where topic_id = ${topicId}
                )
            `);
            tx.run(sql`
                delete from content_quality
                where content_id in (
                    select id from generated_content where topic_id = ${topicId}
                )
            `);
            tx.run(sql`delete from generated_content where topic_id = ${topicId}`);

            // Delete question related to this topic
            tx.run(sql`
                delete from question_attempts
                where question_id in (
                    select id from questions where topic_id = ${topicId}
                )
            `);
            tx.run(sql`
                delete from question_steps
                where question_id in (
                    select id from questions where topic_id = ${topicId}
                )
            `);
            tx.run(sql`
                delete from attempt_logs
                where question_id in (
                    select id from questions where topic_id = ${topicId}
                )
            `);

            // Delete other topic relations
            tx.run(sql`
                delete from diagnostic_item_responses
                where topic_id = ${topicId}
                   or question_id in (select id from questions where topic_id = ${topicId})
            `);

            tx.run(sql`delete from user_mastery where topic_id = ${topicId}`);
            tx.run(sql`delete from user_topic_mastery where topic_id = ${topicId}`);
            tx.run(sql`delete from calibration_logs where topic_id = ${topicId}`);
            tx.run(sql`
                delete from prerequisite_edges
                where from_topic_id = ${topicId}
                   or to_topic_id = ${topicId}
            `);

            tx.run(sql`
                update misconceptions
                set remediation_topic_id = null
                where remediation_topic_id = ${topicId}
            `);

            tx.run(sql`update articles set topic_id = null where topic_id = ${topicId}`);
            tx.run(sql`update exam_questions set topic_id = null where topic_id = ${topicId}`);

            tx.run(sql`delete from questions where topic_id = ${topicId}`);
            tx.run(sql`delete from topics where id = ${topicId}`);
        });

        revalidatePath('/admin/questions');
        revalidatePath('/study');
        revalidatePath('/practice');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete topic:', error);
        return { success: false, error: 'Failed to delete topic' };
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
