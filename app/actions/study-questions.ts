'use server';

import crypto from 'crypto';
import { db } from '@/db/drizzle';
import { questions, topics, courses, questionSteps, userMastery } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getRevealedSteps } from '@/lib/math/fade-logic';
import type { QuestionWithHelp } from '@/lib/hooks/useStudySession';

// ============================================================================
// HELPERS
// ============================================================================

type MCOption = { id: string; label: string; isCorrect: boolean };

/**
 * Parse the admin's explanationMarkdown (format: "### Label\nContent\n\n### Label2\nContent2")
 * back into a structured stepBreakdown for the student view.
 */
function parseExplanationMarkdown(
    markdown: string | null | undefined,
): QuestionWithHelp['helps']['stepBreakdown'] {
    if (!markdown?.trim()) return undefined;

    const steps: Array<{ prompt: string; correctAnswer: string; hint?: string }> = [];
    const stepRegex = /###\s+(.+?)\n([\s\S]*?)(?=###\s|\s*$)/g;
    let match: RegExpExecArray | null;

    while ((match = stepRegex.exec(markdown)) !== null) {
        const rawContent = match[2].trim();
        const answerMatch = rawContent.match(/^ANSWER:\s*(.+)\n?/);
        const correctAnswer = answerMatch ? answerMatch[1].trim() : rawContent;
        // Keep the full explanation (without the ANSWER: line) as hint — shown only in solution view
        const hint = answerMatch ? rawContent.replace(/^ANSWER:\s*.+\n?/, '').trim() || undefined : undefined;
        if (correctAnswer) steps.push({ prompt: match[1].trim(), correctAnswer, hint });
    }

    // Fallback: no ### headers found — treat entire text as one step
    if (steps.length === 0) {
        steps.push({ prompt: 'Lösning', correctAnswer: markdown.trim() });
    }

    return { intro: '', steps, conclusion: '' };
}

function mapDbQuestion(q: {
    id: string;
    topicId: string;
    contentMarkdown: string;
    explanationMarkdown: string | null;
    questionType: string;
    correctAnswer: string;
    options: unknown;
    difficultyTier: number | null;
    aiAnalysis: unknown;
    guidanceSteps: unknown;
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

    // Parse admin-authored guidance steps (progressive thinking hints, no answers)
    const rawGuidanceSteps = Array.isArray(q.guidanceSteps) ? q.guidanceSteps : [];
    const guidanceSteps = rawGuidanceSteps
        .filter((s: any) => s && typeof s.content === 'string' && s.content.trim())
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
        .map((s: any) => ({
            id: String(s.id ?? crypto.randomUUID()),
            order: Number(s.order ?? 0),
            content: String(s.content),
        }));

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
            guidanceSteps: guidanceSteps.length > 0 ? guidanceSteps : undefined,
            stepBreakdown: parseExplanationMarkdown(q.explanationMarkdown),
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

// ============================================================================
// FADING STEPS — question steps with mastery-based reveal
// ============================================================================

/**
 * Fetch question steps for a given question, applying fading-steps logic
 * based on the user's current mastery for the topic.
 *
 * IMPORTANT: correctAnswer is never included in the returned data.
 */
export async function getQuestionWithSteps(questionId: string, userId: string, topicId: string) {
    // Fetch steps WITHOUT correctAnswer
    const steps = await db.select({
        id: questionSteps.id,
        stepNumber: questionSteps.stepNumber,
        instruction: questionSteps.instruction,
        displayLatex: questionSteps.displayLatex,
        hint: questionSteps.hint,
        questionType: questionSteps.questionType,
    }).from(questionSteps).where(eq(questionSteps.questionId, questionId));

    // Get current mastery
    const mastery = await db.select()
        .from(userMastery)
        .where(and(eq(userMastery.userId, userId), eq(userMastery.topicId, topicId)))
        .get();
    const masteryProbability = mastery?.masteryProbability ?? 0.1;

    const sorted = steps.sort((a, b) => a.stepNumber - b.stepNumber);
    const revealedSteps = getRevealedSteps(sorted, masteryProbability);

    return { revealedSteps, mastery: masteryProbability };
}
