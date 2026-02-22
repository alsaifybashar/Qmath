'use server';

import { db } from '@/db/drizzle';
import { questions, topics, courses } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import type { QuestionWithHelp } from '@/lib/hooks/useStudySession';

// ============================================================================
// HELPERS
// ============================================================================

type MCOption = { id: string; label: string; isCorrect: boolean };

function mapDbQuestion(q: {
    id: string;
    topicId: string;
    contentMarkdown: string;
    questionType: string;
    correctAnswer: string;
    options: unknown;
    difficultyTier: number | null;
    aiAnalysis: unknown;
}): QuestionWithHelp {
    const aiAnalysis = (q.aiAnalysis as Record<string, any>) ?? {};
    const hints: string[] = Array.isArray(aiAnalysis.suggestedHints)
        ? aiAnalysis.suggestedHints
        : [];

    // Map admin question types to QuestionWithHelp union
    const typeMap: Record<string, QuestionWithHelp['type']> = {
        multiple_choice: 'multiple_choice',
        numeric: 'numeric_input',
        free_response: 'numeric_input',
    };
    const type: QuestionWithHelp['type'] = typeMap[q.questionType] ?? 'numeric_input';

    // Build content object depending on type
    let content: any;

    if (type === 'multiple_choice') {
        const rawOptions = Array.isArray(q.options) ? (q.options as string[]) : [];
        const optionObjs: MCOption[] = rawOptions.map((label, idx) => ({
            id: String.fromCharCode(97 + idx), // 'a', 'b', 'c', 'd'…
            label,
            isCorrect: label === q.correctAnswer,
        }));
        const correctOpt = optionObjs.find(o => o.isCorrect);
        content = {
            question: { text: q.contentMarkdown },
            options: optionObjs,
            correctOptionId: correctOpt?.id ?? 'a',
        };
    } else {
        // For numeric / free-response: extract an optional inline LaTeX block
        const mathMatch = q.contentMarkdown.match(/\$\$([\s\S]*?)\$\$/);
        const math = mathMatch ? mathMatch[1].trim() : undefined;
        const text = q.contentMarkdown.replace(/\$\$[\s\S]*?\$\$/g, '').trim()
            || q.contentMarkdown;
        content = {
            question: { text, ...(math ? { math } : {}) },
        };
    }

    return {
        id: q.id,
        type,
        topicId: q.topicId,
        difficulty: q.difficultyTier ?? 1,
        content,
        correctAnswer: q.correctAnswer,
        helps: {
            nudgeHint:
                hints[0] ?? 'Fundera på vilken metod som passar bäst för den här typen av uppgift.',
            guidedHint:
                hints[1] ?? 'Titta på definitionen och försök applicera den steg för steg.',
            relatedFormulas: [],
            relatedTopics: [],
        },
        aiContext: {
            conceptsTested: Array.isArray(aiAnalysis.conceptsTested)
                ? aiAnalysis.conceptsTested
                : [],
            commonMistakes: [],
            prerequisiteTopics: Array.isArray(aiAnalysis.prerequisiteTopics)
                ? aiAnalysis.prerequisiteTopics
                : [],
        },
    };
}

// ============================================================================
// PUBLIC ACTION
// ============================================================================

// ============================================================================
// PRACTICE PAGE — topic discovery
// ============================================================================

export interface PracticeTopic {
    id: string;
    title: string;
    courseCode: string;
    courseName: string;
    publishedCount: number;
}

/**
 * Fetch topics that have at least one published question.
 * Used by the practice page to show real topics with correct study links.
 */
export async function getPracticeTopics(): Promise<PracticeTopic[]> {
    // Get all topics joined with their course
    const allTopics = await db.query.topics.findMany({
        with: { course: true },
        orderBy: (t, { asc }) => [asc(t.title)],
    });

    const result: PracticeTopic[] = [];

    for (const topic of allTopics) {
        const [row] = await db
            .select({ count: sql<number>`count(*)` })
            .from(questions)
            .where(and(eq(questions.topicId, topic.id), eq(questions.isPublished, true)));

        const count = Number(row?.count ?? 0);
        if (count > 0) {
            result.push({
                id: topic.id,
                title: topic.title,
                courseCode: (topic.course as any)?.code ?? '',
                courseName: (topic.course as any)?.name ?? '',
                publishedCount: count,
            });
        }
    }

    return result;
}

// ============================================================================
// STUDY SESSION — questions by topic
// ============================================================================

/**
 * Fetch all published questions for a given topic, mapped to the
 * QuestionWithHelp shape expected by useStudySession.
 */
export async function getStudyQuestions(topicId: string): Promise<QuestionWithHelp[]> {
    if (!topicId) return [];

    const rows = await db
        .select()
        .from(questions)
        .where(
            and(
                eq(questions.topicId, topicId),
                eq(questions.isPublished, true),
            ),
        );

    return rows.map(mapDbQuestion);
}
