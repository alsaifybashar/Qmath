import { db } from '@/db/drizzle';
import { articles, topics, courses } from '@/db/schema';
import { eq, like, or } from 'drizzle-orm';

export interface RetrievedContext {
    id: string;
    title: string;
    content: string;
    source: 'article' | 'topic';
    relevance: 'high' | 'medium' | 'low';
}

/**
 * Retrieves relevant knowledge context based on the student's query and current course.
 * In a production PostgreSQL environment, this would use pgvector for semantic search.
 * Currently adapted for SQLite using text-matching heuristics over structured syllabus/articles.
 * 
 * @param query The student's question or mathematical concept (e.g. "Orthogonal Projection")
 * @param courseId The active course context (e.g. "TATA24")
 * @returns Array of retrieved context snippets to feed to the Socratic Prompt
 */
export async function retrieveContext(query: string, courseId?: string): Promise<RetrievedContext[]> {
    if (!query) return [];

    const keywords = extractKeywords(query);
    if (keywords.length === 0) return [];

    const results: RetrievedContext[] = [];

    // 1. Search Articles (Theorems, Textbook Chapters)
    // We'll do a simple LIKE query on the title for demonstration
    // Since contentBlocks is JSON, exact text search is harder in pure SQLite without FTS5,
    // so we prioritize Title and Excerpt matches.
    const articleConditions = keywords.map(kw => or(
        like(articles.title, `%${kw}%`),
        like(articles.excerpt, `%${kw}%`)
    ));

    // Combine conditions with OR (matching any keyword)
    const combinedArticleCondition = articleConditions.reduce((acc, curr) => or(acc, curr));

    const matchedArticles = await db.query.articles.findMany({
        where: (table, { and }) => {
            const conditions = [combinedArticleCondition];
            if (courseId) {
                conditions.push(eq(table.courseId, courseId));
            }
            return conditions.length > 1 ? and(...conditions) : conditions[0];
        },
        limit: 3
    });

    for (const article of matchedArticles) {
        // Build a plain text representation of the article blocks
        let plainTextContent = article.excerpt || '';
        try {
            if (article.contentBlocks) {
                const blocks = typeof article.contentBlocks === 'string' ? JSON.parse(article.contentBlocks) : article.contentBlocks;
                if (Array.isArray(blocks)) {
                    plainTextContent = blocks.map(b => b.content || '').join('\n').slice(0, 1000); // Take first 1k chars
                }
            }
        } catch (e) { }

        results.push({
            id: article.id,
            title: article.title,
            content: plainTextContent,
            source: 'article',
            relevance: 'high'
        });
    }

    // 2. Search Topics (Syllabus Definitions)
    const topicConditions = keywords.map(kw => or(
        like(topics.title, `%${kw}%`),
        like(topics.description, `%${kw}%`),
        like(topics.engineeringContext, `%${kw}%`)
    ));

    const combinedTopicCondition = topicConditions.reduce((acc, curr) => or(acc, curr));

    const matchedTopics = await db.query.topics.findMany({
        where: (table, { and }) => {
            const conditions = [combinedTopicCondition];
            if (courseId) {
                conditions.push(eq(table.courseId, courseId));
            }
            return conditions.length > 1 ? and(...conditions) : conditions[0];
        },
        limit: 2
    });

    for (const topic of matchedTopics) {
        results.push({
            id: topic.id,
            title: topic.title,
            content: topic.description || topic.engineeringContext || `Topic within the syllabus.`,
            source: 'topic',
            relevance: 'medium'
        });
    }

    return results;
}

/**
 * Super basic keyword extraction to avoid searching for stop words.
 */
function extractKeywords(query: string): string[] {
    const stopWords = new Set(['what', 'is', 'the', 'how', 'do', 'i', 'find', 'a', 'of', 'in', 'and', 'to', 'can', 'you', 'explain']);
    const words = query.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);

    return words.filter(word => word.length > 2 && !stopWords.has(word));
}
