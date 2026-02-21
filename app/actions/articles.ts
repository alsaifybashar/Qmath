'use server';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { articles, users, courses, topics } from '@/db/schema';
import { eq, desc, asc, like, or, and, sql, type SQL } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
    type ArticleBlock,
    type ArticleStatus,
    type CreateArticlePayload,
    type UpdateArticlePayload,
    type LatexBlock,
    type ImageBlock,
    type CalloutBlock,
    slugify,
    estimateReadingTime,
    MAX_TITLE_LENGTH,
    MAX_EXCERPT_LENGTH,
    MAX_BLOCKS,
    ALLOWED_IMAGE_SCHEMES,
} from '@/types/articles';

// ── Auth helper ───────────────────────────────────────────────────────────────

async function requireAdminSession() {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: { id: true, role: true },
    });
    if (!user || user.role !== 'admin') throw new Error('Forbidden');
    return user;
}

// ── Input Validation & Sanitization ──────────────────────────────────────────

function sanitizeBlocks(blocks: unknown): ArticleBlock[] {
    if (!Array.isArray(blocks)) throw new Error('contentBlocks must be an array');
    if (blocks.length > MAX_BLOCKS) throw new Error(`Maximum ${MAX_BLOCKS} blocks allowed`);

    return blocks.map((block: unknown, i: number) => {
        if (typeof block !== 'object' || block === null) {
            throw new Error(`Block ${i} is invalid`);
        }
        const b = block as Record<string, unknown>;

        switch (b.type) {
            case 'heading': {
                if (![2, 3, 4].includes(b.level as number)) throw new Error(`Block ${i}: invalid heading level`);
                if (typeof b.text !== 'string' || b.text.length > 500) throw new Error(`Block ${i}: invalid heading text`);
                return { type: 'heading' as const, level: b.level as 2 | 3 | 4, text: b.text.slice(0, 500) };
            }
            case 'text': {
                if (typeof b.markdown !== 'string') throw new Error(`Block ${i}: text block requires markdown`);
                return { type: 'text' as const, markdown: b.markdown.slice(0, 50000) };
            }
            case 'latex': {
                if (typeof b.formula !== 'string') throw new Error(`Block ${i}: latex block requires formula`);
                if (b.display !== 'block') throw new Error(`Block ${i}: invalid latex display`);
                const latexBlock: LatexBlock = {
                    type: 'latex',
                    display: 'block',
                    formula: b.formula.slice(0, 5000),
                    ...(typeof b.caption === 'string' ? { caption: b.caption.slice(0, 300) } : {}),
                };
                return latexBlock;
            }
            case 'image': {
                if (typeof b.url !== 'string') throw new Error(`Block ${i}: image requires url`);
                // Only allow HTTPS URLs — prevent data: URIs and local paths
                if (!ALLOWED_IMAGE_SCHEMES.some(scheme => (b.url as string).startsWith(scheme))) {
                    throw new Error(`Block ${i}: image URL must use HTTPS`);
                }
                if (typeof b.alt !== 'string') throw new Error(`Block ${i}: image requires alt text`);
                const imageBlock: ImageBlock = {
                    type: 'image',
                    url: (b.url as string).slice(0, 2000),
                    alt: b.alt.slice(0, 300),
                    ...(typeof b.caption === 'string' ? { caption: b.caption.slice(0, 300) } : {}),
                };
                return imageBlock;
            }
            case 'callout': {
                const validVariants = ['info', 'warning', 'tip', 'example', 'definition', 'success'] as const;
                type CalloutVariant = typeof validVariants[number];
                if (!validVariants.includes(b.variant as CalloutVariant)) throw new Error(`Block ${i}: invalid callout variant`);
                if (typeof b.text !== 'string') throw new Error(`Block ${i}: callout requires text`);
                const calloutBlock: CalloutBlock = {
                    type: 'callout',
                    variant: b.variant as CalloutVariant,
                    text: b.text.slice(0, 5000),
                    ...(typeof b.title === 'string' ? { title: b.title.slice(0, 200) } : {}),
                };
                return calloutBlock;
            }
            case 'divider': {
                return { type: 'divider' as const };
            }
            case 'code': {
                if (typeof b.code !== 'string') throw new Error(`Block ${i}: code block requires code`);
                const lang = typeof b.language === 'string' ? b.language.slice(0, 50) : 'text';
                return { type: 'code' as const, language: lang, code: b.code.slice(0, 50000) };
            }
            default:
                throw new Error(`Block ${i}: unknown block type "${b.type}"`);
        }
    });
}

function validatePayload(payload: CreateArticlePayload) {
    if (!payload.title || typeof payload.title !== 'string') throw new Error('Title is required');
    if (payload.title.length > MAX_TITLE_LENGTH) throw new Error(`Title too long (max ${MAX_TITLE_LENGTH} chars)`);
    if (payload.excerpt && payload.excerpt.length > MAX_EXCERPT_LENGTH) {
        throw new Error(`Excerpt too long (max ${MAX_EXCERPT_LENGTH} chars)`);
    }
    if (!payload.contentBlocks || !Array.isArray(payload.contentBlocks)) {
        throw new Error('contentBlocks is required');
    }
}

// ── Unique slug generator ─────────────────────────────────────────────────────

async function generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
    const base = slugify(title);
    let candidate = base;
    let attempt = 0;

    while (true) {
        const existing = await db.query.articles.findFirst({
            where: eq(articles.slug, candidate),
            columns: { id: true },
        });
        if (!existing || existing.id === excludeId) return candidate;
        attempt++;
        candidate = `${base}-${attempt}`;
    }
}

// ── CRUD Server Actions ───────────────────────────────────────────────────────

export async function createArticle(payload: CreateArticlePayload): Promise<{ id: string; slug: string }> {
    const admin = await requireAdminSession();
    validatePayload(payload);

    // Validate foreign key references exist before insert
    if (payload.courseId) {
        const courseExists = await db.query.courses.findFirst({
            where: eq(courses.id, payload.courseId),
            columns: { id: true },
        });
        if (!courseExists) throw new Error('Invalid courseId: course not found');
    }
    if (payload.topicId) {
        const topicExists = await db.query.topics.findFirst({
            where: eq(topics.id, payload.topicId),
            columns: { id: true },
        });
        if (!topicExists) throw new Error('Invalid topicId: topic not found');
    }

    const cleanBlocks = sanitizeBlocks(payload.contentBlocks);
    const slug = await generateUniqueSlug(payload.title);
    const readingTime = estimateReadingTime(cleanBlocks);

    const [article] = await db.insert(articles).values({
        slug,
        title: payload.title.trim(),
        titleSv: payload.titleSv?.trim() ?? null,
        excerpt: payload.excerpt?.trim() ?? null,
        courseId: payload.courseId ?? null,
        topicId: payload.topicId ?? null,
        contentBlocks: cleanBlocks,
        status: payload.status ?? 'draft',
        authorId: admin.id,
        tags: payload.tags ?? [],
        readingTimeMinutes: readingTime,
    }).returning({ id: articles.id, slug: articles.slug });

    revalidatePath('/admin/articles');
    revalidatePath('/articles');
    return article;
}

export async function updateArticle(id: string, payload: UpdateArticlePayload): Promise<void> {
    await requireAdminSession();

    const existing = await db.query.articles.findFirst({
        where: eq(articles.id, id),
        columns: { id: true, title: true, slug: true, status: true },
    });
    if (!existing) throw new Error('Article not found');

    const updates: Partial<typeof articles.$inferInsert> = {};

    if (payload.title !== undefined) {
        if (!payload.title.trim()) throw new Error('Title cannot be empty');
        if (payload.title.length > MAX_TITLE_LENGTH) throw new Error('Title too long');
        updates.title = payload.title.trim();
        // Regenerate slug only if title changed
        if (payload.title.trim() !== existing.title) {
            updates.slug = await generateUniqueSlug(payload.title, id);
        }
    }
    if (payload.titleSv !== undefined) updates.titleSv = payload.titleSv?.trim() ?? null;
    if (payload.excerpt !== undefined) {
        if (payload.excerpt && payload.excerpt.length > MAX_EXCERPT_LENGTH) throw new Error('Excerpt too long');
        updates.excerpt = payload.excerpt?.trim() ?? null;
    }
    if (payload.courseId !== undefined) {
        if (payload.courseId) {
            const courseExists = await db.query.courses.findFirst({
                where: eq(courses.id, payload.courseId),
                columns: { id: true },
            });
            if (!courseExists) throw new Error('Invalid courseId: course not found');
        }
        updates.courseId = payload.courseId ?? null;
    }
    if (payload.topicId !== undefined) {
        if (payload.topicId) {
            const topicExists = await db.query.topics.findFirst({
                where: eq(topics.id, payload.topicId),
                columns: { id: true },
            });
            if (!topicExists) throw new Error('Invalid topicId: topic not found');
        }
        updates.topicId = payload.topicId ?? null;
    }
    if (payload.tags !== undefined) updates.tags = payload.tags;
    if (payload.contentBlocks !== undefined) {
        const cleanBlocks = sanitizeBlocks(payload.contentBlocks);
        updates.contentBlocks = cleanBlocks;
        updates.readingTimeMinutes = estimateReadingTime(cleanBlocks);
    }
    if (payload.status !== undefined) {
        const validStatuses: ArticleStatus[] = ['draft', 'published', 'archived'];
        if (!validStatuses.includes(payload.status)) throw new Error('Invalid status');
        updates.status = payload.status;
        if (payload.status === 'published' && existing.status !== 'published') {
            updates.publishedAt = new Date();
        }
    }

    updates.updatedAt = new Date();

    await db.update(articles).set(updates).where(eq(articles.id, id));

    revalidatePath('/admin/articles');
    revalidatePath(`/admin/articles/${id}/edit`);
    revalidatePath('/articles');
    if (updates.slug) revalidatePath(`/articles/${updates.slug}`);
    else revalidatePath(`/articles/${existing.slug}`);
}

export async function deleteArticle(id: string): Promise<void> {
    await requireAdminSession();
    await db.delete(articles).where(eq(articles.id, id));
    revalidatePath('/admin/articles');
    revalidatePath('/articles');
}

export async function publishArticle(id: string): Promise<void> {
    await updateArticle(id, { status: 'published' });
}

export async function unpublishArticle(id: string): Promise<void> {
    await updateArticle(id, { status: 'draft' });
}

// ── Admin Queries ─────────────────────────────────────────────────────────────

export async function getAdminArticles(opts?: {
    search?: string;
    status?: ArticleStatus;
    courseId?: string;
    limit?: number;
    offset?: number;
}) {
    await requireAdminSession();

    const conditions = [];
    if (opts?.search) {
        conditions.push(
            or(
                like(articles.title, `%${opts.search}%`),
                like(articles.excerpt, `%${opts.search}%`),
            )
        );
    }
    if (opts?.status) conditions.push(eq(articles.status, opts.status));
    if (opts?.courseId) conditions.push(eq(articles.courseId, opts.courseId));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    return db
        .select({
            id: articles.id,
            slug: articles.slug,
            title: articles.title,
            status: articles.status,
            courseId: articles.courseId,
            topicId: articles.topicId,
            tags: articles.tags,
            readingTimeMinutes: articles.readingTimeMinutes,
            viewCount: articles.viewCount,
            publishedAt: articles.publishedAt,
            createdAt: articles.createdAt,
            updatedAt: articles.updatedAt,
            courseName: courses.name,
            courseCode: courses.code,
            topicTitle: topics.title,
            authorName: users.name,
        })
        .from(articles)
        .leftJoin(courses, eq(articles.courseId, courses.id))
        .leftJoin(topics, eq(articles.topicId, topics.id))
        .leftJoin(users, eq(articles.authorId, users.id))
        .where(where)
        .orderBy(desc(articles.updatedAt))
        .limit(opts?.limit ?? 50)
        .offset(opts?.offset ?? 0);
}

export async function getAdminArticleById(id: string) {
    await requireAdminSession();

    return db
        .select({
            id: articles.id,
            slug: articles.slug,
            title: articles.title,
            titleSv: articles.titleSv,
            excerpt: articles.excerpt,
            courseId: articles.courseId,
            topicId: articles.topicId,
            contentBlocks: articles.contentBlocks,
            status: articles.status,
            authorId: articles.authorId,
            tags: articles.tags,
            readingTimeMinutes: articles.readingTimeMinutes,
            viewCount: articles.viewCount,
            publishedAt: articles.publishedAt,
            createdAt: articles.createdAt,
            updatedAt: articles.updatedAt,
            courseName: courses.name,
            courseCode: courses.code,
            topicTitle: topics.title,
        })
        .from(articles)
        .leftJoin(courses, eq(articles.courseId, courses.id))
        .leftJoin(topics, eq(articles.topicId, topics.id))
        .where(eq(articles.id, id))
        .limit(1)
        .then(r => r[0] ?? null);
}

// ── Public Queries (students) ─────────────────────────────────────────────────

export async function getPublishedArticles(opts?: {
    search?: string;
    courseId?: string;
    topicId?: string;
    tag?: string;
    limit?: number;
    offset?: number;
}) {
    const conditions: SQL<unknown>[] = [eq(articles.status, 'published')];

    if (opts?.courseId) conditions.push(eq(articles.courseId, opts.courseId));
    if (opts?.topicId) conditions.push(eq(articles.topicId, opts.topicId));
    if (opts?.tag) {
        // SQLite JSON tag filter: match any element in the tags array
        conditions.push(sql`EXISTS (SELECT 1 FROM json_each(${articles.tags}) WHERE value = ${opts.tag})`);
    }
    if (opts?.search) {
        const searchClause = or(
            like(articles.title, `%${opts.search}%`),
            like(articles.excerpt, `%${opts.search}%`),
        );
        if (searchClause) conditions.push(searchClause);
    }

    return db
        .select({
            id: articles.id,
            slug: articles.slug,
            title: articles.title,
            titleSv: articles.titleSv,
            excerpt: articles.excerpt,
            tags: articles.tags,
            readingTimeMinutes: articles.readingTimeMinutes,
            viewCount: articles.viewCount,
            publishedAt: articles.publishedAt,
            courseCode: courses.code,
            courseName: courses.name,
            topicTitle: topics.title,
            authorName: users.name,
        })
        .from(articles)
        .leftJoin(courses, eq(articles.courseId, courses.id))
        .leftJoin(topics, eq(articles.topicId, topics.id))
        .leftJoin(users, eq(articles.authorId, users.id))
        .where(and(...conditions))
        .orderBy(asc(articles.sortOrder), desc(articles.publishedAt))
        .limit(opts?.limit ?? 24)
        .offset(opts?.offset ?? 0);
}

export async function getPublishedArticleBySlug(slug: string) {
    const row = await db
        .select({
            id: articles.id,
            slug: articles.slug,
            title: articles.title,
            titleSv: articles.titleSv,
            excerpt: articles.excerpt,
            courseId: articles.courseId,
            topicId: articles.topicId,
            contentBlocks: articles.contentBlocks,
            tags: articles.tags,
            readingTimeMinutes: articles.readingTimeMinutes,
            viewCount: articles.viewCount,
            publishedAt: articles.publishedAt,
            courseCode: courses.code,
            courseName: courses.name,
            topicTitle: topics.title,
            topicTitleSv: topics.titleSv,
            authorName: users.name,
        })
        .from(articles)
        .leftJoin(courses, eq(articles.courseId, courses.id))
        .leftJoin(topics, eq(articles.topicId, topics.id))
        .leftJoin(users, eq(articles.authorId, users.id))
        .where(and(eq(articles.slug, slug), eq(articles.status, 'published')))
        .limit(1)
        .then(r => r[0] ?? null);

    // Increment view count (fire and forget)
    if (row) {
        db.update(articles)
            .set({ viewCount: sql`${articles.viewCount} + 1` })
            .where(eq(articles.id, row.id))
            .catch(() => {}); // Non-critical
    }

    return row;
}

export async function getAllCoursesAndTopics() {
    const [courseList, topicList] = await Promise.all([
        db.select({ id: courses.id, code: courses.code, name: courses.name }).from(courses).orderBy(courses.code),
        db.select({ id: topics.id, title: topics.title, courseId: topics.courseId }).from(topics).orderBy(topics.title),
    ]);
    return { courses: courseList, topics: topicList };
}

// ── Article Navigation (Course → Topic → Article tree) ─────────────────────

export interface NavArticle {
    slug: string;
    title: string;
    sortOrder: number | null;
    readingTimeMinutes: number | null;
}

export interface NavTopic {
    id: string;
    title: string;
    articles: NavArticle[];
}

export interface NavCourse {
    id: string;
    code: string;
    name: string;
    topics: NavTopic[];
    /** Articles in this course but with no topic assigned */
    uncategorized: NavArticle[];
}

export interface ArticleNavigation {
    courses: NavCourse[];
    /** Articles with no course at all */
    general: NavArticle[];
}

export async function getArticleNavigation(): Promise<ArticleNavigation> {
    // Fetch all published articles with their course/topic info, ordered
    const allArticles = await db
        .select({
            slug: articles.slug,
            title: articles.title,
            sortOrder: articles.sortOrder,
            readingTimeMinutes: articles.readingTimeMinutes,
            courseId: articles.courseId,
            topicId: articles.topicId,
        })
        .from(articles)
        .where(eq(articles.status, 'published'))
        .orderBy(asc(articles.sortOrder), asc(articles.title));

    // Fetch all courses that have at least one published article
    const courseIds = [...new Set(allArticles.map(a => a.courseId).filter(Boolean))] as string[];
    const topicIds = [...new Set(allArticles.map(a => a.topicId).filter(Boolean))] as string[];

    const [courseRows, topicRows] = await Promise.all([
        courseIds.length > 0
            ? db.select({ id: courses.id, code: courses.code, name: courses.name })
                .from(courses)
                .orderBy(courses.code)
            : Promise.resolve([]),
        topicIds.length > 0
            ? db.select({ id: topics.id, title: topics.title, courseId: topics.courseId })
                .from(topics)
                .orderBy(topics.title)
            : Promise.resolve([]),
    ]);

    // Build the tree
    const topicMap = new Map<string, { id: string; title: string; courseId: string | null }>();
    for (const t of topicRows) topicMap.set(t.id, t);

    const navCourses: NavCourse[] = [];

    for (const course of courseRows) {
        const courseArticles = allArticles.filter(a => a.courseId === course.id);
        if (courseArticles.length === 0) continue;

        // Group by topic
        const topicGroups = new Map<string, NavArticle[]>();
        const uncategorized: NavArticle[] = [];

        for (const a of courseArticles) {
            const art: NavArticle = {
                slug: a.slug,
                title: a.title,
                sortOrder: a.sortOrder,
                readingTimeMinutes: a.readingTimeMinutes,
            };
            if (a.topicId && topicMap.has(a.topicId)) {
                if (!topicGroups.has(a.topicId)) topicGroups.set(a.topicId, []);
                topicGroups.get(a.topicId)!.push(art);
            } else {
                uncategorized.push(art);
            }
        }

        const navTopics: NavTopic[] = [];
        for (const [tid, arts] of topicGroups.entries()) {
            const topicInfo = topicMap.get(tid);
            if (topicInfo) {
                navTopics.push({ id: tid, title: topicInfo.title, articles: arts });
            }
        }

        navCourses.push({
            id: course.id,
            code: course.code,
            name: course.name,
            topics: navTopics,
            uncategorized,
        });
    }

    // General: articles with no course
    const general: NavArticle[] = allArticles
        .filter(a => !a.courseId)
        .map(a => ({
            slug: a.slug,
            title: a.title,
            sortOrder: a.sortOrder,
            readingTimeMinutes: a.readingTimeMinutes,
        }));

    return { courses: navCourses, general };
}

// ── Admin: Reorder articles ─────────────────────────────────────────────────

export async function reorderArticles(
    updates: Array<{ id: string; sortOrder: number }>
): Promise<void> {
    await requireAdminSession();
    // Update each article's sortOrder — simple batch approach
    for (const { id, sortOrder } of updates) {
        await db
            .update(articles)
            .set({ sortOrder, updatedAt: new Date() })
            .where(eq(articles.id, id));
    }
    revalidatePath('/articles');
    revalidatePath('/admin/articles');
}
