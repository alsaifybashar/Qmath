'use server';

import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/db/drizzle';
import { questions, topics, courses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

// ============ ANTHROPIC CLIENT ============

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// ============ TYPES ============

export interface AIQuestionAnalysis {
    difficulty: number;                  // 1-5 scale matching admin tiers
    bloomLevel: string;                  // remember | understand | apply | analyze | evaluate | create
    conceptsTested: string[];            // e.g. ["matrix_multiplication", "determinant"]
    prerequisiteTopics: string[];        // e.g. ["linear_equations", "basic_algebra"]
    strategyTag: string;                 // e.g. "gaussian_elimination"
    estimatedTimeMinutes: number;        // estimated solving time
    feedbackForAdmin: string;            // human-readable analysis summary
    suggestedHints: string[];            // 2-3 progressive hints for students
}

// ============ HELPERS ============

async function checkAdmin() {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
        throw new Error('Unauthorized');
    }
    return session.user;
}

/** Strip markdown code fences from Claude's JSON output */
function stripMarkdownFences(text: string): string {
    return text
        .replace(/^```(?:json)?\s*\n?/i, '')
        .replace(/\n?```\s*$/i, '')
        .trim();
}

// ============ SINGLE QUESTION ANALYSIS ============

export async function analyzeQuestionDifficulty(
    questionId: string
): Promise<{ success: true; analysis: AIQuestionAnalysis } | { success: false; error: string }> {
    try {
        await checkAdmin();

        // 1. Fetch question with topic and course context
        const question = await db.query.questions.findFirst({
            where: eq(questions.id, questionId),
            with: {
                topic: {
                    with: {
                        course: true,
                    },
                },
            },
        });

        if (!question) {
            return { success: false, error: 'Question not found' };
        }

        // 2. Mark as under review
        await db.update(questions)
            .set({ status: 'ai_review' })
            .where(eq(questions.id, questionId));

        // 3. Check for API key
        if (!process.env.ANTHROPIC_API_KEY) {
            // Fallback: generate a reasonable default analysis without AI
            const fallback = generateFallbackAnalysis(question);
            await db.update(questions)
                .set({
                    status: 'ready',
                    aiDifficultyTier: fallback.difficulty,
                    aiAnalysis: fallback,
                    aiAnalyzedAt: new Date(),
                    strategyTag: question.strategyTag || fallback.strategyTag,
                })
                .where(eq(questions.id, questionId));

            revalidatePath('/admin/questions');
            return { success: true, analysis: fallback };
        }

        // 4. Build prompt
        const topicName = question.topic?.title ?? 'Unknown topic';
        const courseCode = question.topic?.course?.code ?? '';
        const courseName = question.topic?.course?.name ?? '';

        const prompt = buildAnalysisPrompt({
            questionContent: question.contentMarkdown,
            solutionSteps: question.explanationMarkdown ?? '',
            correctAnswer: question.correctAnswer,
            questionType: question.questionType,
            adminDifficulty: question.difficultyTier ?? 1,
            topicName,
            courseCode,
            courseName,
        });

        // 5. Call Claude
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 800,
            temperature: 0.2,
            system: `Du är en matematikpedagogik-expert specialiserad på universitetsmatematik för svenska ingenjörsstudenter. Du analyserar matematikuppgifter och ger strukturerade svårighetsbedömningar. Svara alltid med giltig JSON — ingen markdown, inga förklaringar utanför JSON. Fälten feedbackForAdmin och suggestedHints MÅSTE vara på svenska.`,
            messages: [{ role: 'user', content: prompt }],
        });

        // 6. Parse response
        const rawText = response.content[0].type === 'text'
            ? response.content[0].text
            : '';

        let analysis: AIQuestionAnalysis;
        try {
            analysis = JSON.parse(stripMarkdownFences(rawText));
        } catch {
            console.error('[AI Analysis] Failed to parse JSON:', rawText);
            // Use fallback on parse failure
            analysis = generateFallbackAnalysis(question);
        }

        // Clamp difficulty to 1-5
        analysis.difficulty = Math.max(1, Math.min(5, Math.round(analysis.difficulty)));

        // 7. Store results
        await db.update(questions)
            .set({
                status: 'ready',
                aiDifficultyTier: analysis.difficulty,
                aiAnalysis: analysis,
                aiAnalyzedAt: new Date(),
                strategyTag: question.strategyTag || analysis.strategyTag || null,
            })
            .where(eq(questions.id, questionId));

        revalidatePath('/admin/questions');
        return { success: true, analysis };
    } catch (error) {
        console.error('[AI Analysis] Error:', error);
        // Revert to draft on failure
        try {
            await db.update(questions)
                .set({ status: 'draft' })
                .where(eq(questions.id, questionId));
        } catch { /* ignore revert errors */ }
        return { success: false, error: 'AI analysis failed. Please try again.' };
    }
}

// ============ BATCH ANALYSIS ============

export async function analyzeQuestionsBatch(
    questionIds: string[]
): Promise<{ success: true; results: Record<string, { success: boolean; error?: string }> } | { success: false; error: string }> {
    try {
        await checkAdmin();

        const results: Record<string, { success: boolean; error?: string }> = {};

        // Process sequentially to respect rate limits (max 5)
        const batch = questionIds.slice(0, 5);
        for (const qId of batch) {
            const result = await analyzeQuestionDifficulty(qId);
            results[qId] = result.success
                ? { success: true }
                : { success: false, error: result.error };
        }

        return { success: true, results };
    } catch (error) {
        console.error('[AI Batch Analysis] Error:', error);
        return { success: false, error: 'Batch analysis failed' };
    }
}

// ============ PROMPT BUILDER ============

function buildAnalysisPrompt(ctx: {
    questionContent: string;
    solutionSteps: string;
    correctAnswer: string;
    questionType: string;
    adminDifficulty: number;
    topicName: string;
    courseCode: string;
    courseName: string;
}): string {
    return `Analyze this university-level math question and provide a structured difficulty assessment.

## Question Context
- Course: ${ctx.courseCode} ${ctx.courseName}
- Topic: ${ctx.topicName}
- Question type: ${ctx.questionType}
- Admin's difficulty estimate: ${ctx.adminDifficulty}/5

## Question Content
${ctx.questionContent}

## Correct Answer
${ctx.correctAnswer}

## Solution Steps
${ctx.solutionSteps || 'No solution provided.'}

## Instructions
Analyze this question and respond with a JSON object matching this exact structure:
{
  "difficulty": <number 1-5>,
  "bloomLevel": "<remember|understand|apply|analyze|evaluate|create>",
  "conceptsTested": ["<concept1>", "<concept2>"],
  "prerequisiteTopics": ["<topic1>", "<topic2>"],
  "strategyTag": "<strategy_identifier>",
  "estimatedTimeMinutes": <number>,
  "feedbackForAdmin": "<1-2 sentence analysis of the question's difficulty and what it tests>",
  "suggestedHints": ["<hint1>", "<hint2>", "<hint3>"]
}

Difficulty scale:
1 = Beginner (direct application of formula)
2 = Easy (one-step reasoning)
3 = Intermediate (multi-step, combines 2 concepts)
4 = Hard (requires insight or non-obvious approach)
5 = Expert (proof-level or competition-level)

Use snake_case for strategyTag (e.g. "gaussian_elimination", "chain_rule").
IMPORTANT: feedbackForAdmin and all suggestedHints MUST be written in Swedish.
Respond with JSON only.`;
}

// ============ FALLBACK (NO API KEY) ============

function generateFallbackAnalysis(question: any): AIQuestionAnalysis {
    const tier = question.difficultyTier ?? 3;
    const bloomLevels = ['remember', 'understand', 'apply', 'analyze', 'evaluate'];

    return {
        difficulty: tier,
        bloomLevel: bloomLevels[Math.min(tier - 1, 4)],
        conceptsTested: [question.topic?.title?.toLowerCase().replace(/\s+/g, '_') ?? 'general'],
        prerequisiteTopics: [],
        strategyTag: question.strategyTag ?? 'general',
        estimatedTimeMinutes: tier * 3,
        feedbackForAdmin: `Reservanalys: AI-nyckel inte konfigurerad. Använder admins svårighetsgrad (nivå ${tier}).`,
        suggestedHints: ['Gå igenom de relevanta definitionerna', 'Försök tillämpa formeln steg för steg'],
    };
}
