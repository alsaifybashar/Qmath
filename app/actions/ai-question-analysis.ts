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

// ============ AI SOLUTION REVIEW ============

export interface AISolutionStepReview {
    stepIndex: number;
    originalLabel: string;
    verdict: 'ok' | 'improve' | 'missing_step';
    suggestion: string;         // Improved version of the step content (markdown+LaTeX)
    suggestedLabel: string;     // Improved label if applicable
    reason: string;             // Why the AI suggests this change (Swedish)
}

export interface AISolutionReview {
    overallAssessment: string;  // General comment on the solution (Swedish)
    overallRating: number;      // 1-5 quality rating
    stepReviews: AISolutionStepReview[];
    additionalSteps: {          // Steps the AI suggests adding (e.g. missing justification)
        afterStepIndex: number; // Insert after this step (-1 = before first step)
        label: string;
        content: string;
        reason: string;
    }[];
}

/**
 * AI-powered solution review. Sends the question + admin's solution steps to Claude
 * for pedagogical review. Returns suggestions that the admin can accept or reject.
 */
export async function reviewSolutionSteps(input: {
    questionContent: string;
    correctAnswer: string;
    questionType: string;
    solutionSteps: { label: string; content: string }[];
    topicName?: string;
    courseCode?: string;
    courseName?: string;
}): Promise<{ success: true; review: AISolutionReview } | { success: false; error: string }> {
    try {
        await checkAdmin();

        if (input.solutionSteps.length === 0 || input.solutionSteps.every(s => !s.content.trim())) {
            return { success: false, error: 'Inga lösningssteg att granska. Skriv minst ett steg.' };
        }

        // Check for API key
        if (!process.env.ANTHROPIC_API_KEY) {
            return {
                success: true,
                review: {
                    overallAssessment: 'AI-granskning ej tillgänglig — API-nyckel saknas. Lösningen sparas som den är.',
                    overallRating: 3,
                    stepReviews: input.solutionSteps.map((s, i) => ({
                        stepIndex: i,
                        originalLabel: s.label,
                        verdict: 'ok' as const,
                        suggestion: s.content,
                        suggestedLabel: s.label,
                        reason: 'Ingen AI-granskning genomförd.',
                    })),
                    additionalSteps: [],
                },
            };
        }

        const prompt = buildSolutionReviewPrompt(input);

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2000,
            temperature: 0.3,
            system: `Du är en erfaren matematiklektor vid ett svenskt universitet som granskar lösningsförslag till matematikuppgifter. Din uppgift är att granska varje steg i lösningen och föreslå förbättringar som ökar tydligheten, pedagogiken och den matematiska korrektheten.

Dina förslag ska:
- Vara på svenska
- Förbättra pedagogisk tydlighet (t.ex. lägga till motiveringar, mellsteg)
- Korrigera eventuella matematiska fel
- Förbättra LaTeX-formateringen om det behövs
- Föreslå saknade steg om lösningen hoppar över viktiga resonemang
- Behålla den övergripande strukturen och stilen

Svara ALLTID med giltig JSON utan markdown-formatering utanför JSON.`,
            messages: [{ role: 'user', content: prompt }],
        });

        const rawText = response.content[0].type === 'text' ? response.content[0].text : '';

        let review: AISolutionReview;
        try {
            review = JSON.parse(stripMarkdownFences(rawText));
        } catch {
            console.error('[AI Solution Review] Failed to parse JSON:', rawText);
            return { success: false, error: 'AI-granskningen kunde inte tolkas. Försök igen.' };
        }

        // Validate and clamp rating
        review.overallRating = Math.max(1, Math.min(5, Math.round(review.overallRating ?? 3)));

        // Ensure arrays exist
        review.stepReviews = review.stepReviews ?? [];
        review.additionalSteps = review.additionalSteps ?? [];

        return { success: true, review };
    } catch (error) {
        console.error('[AI Solution Review] Error:', error);
        return { success: false, error: 'AI-granskning misslyckades. Kontrollera API-nyckeln och försök igen.' };
    }
}

function buildSolutionReviewPrompt(input: {
    questionContent: string;
    correctAnswer: string;
    questionType: string;
    solutionSteps: { label: string; content: string }[];
    topicName?: string;
    courseCode?: string;
    courseName?: string;
}): string {
    const stepsText = input.solutionSteps
        .map((s, i) => `### Steg ${i} — ${s.label}\n${s.content}`)
        .join('\n\n');

    return `Granska denna lösning till en matematikuppgift och föreslå förbättringar.

## Uppgiftskontext
- Kurs: ${input.courseCode ?? '?'} ${input.courseName ?? ''}
- Ämne: ${input.topicName ?? 'Ej angivet'}
- Frågetyp: ${input.questionType}

## Frågetext
${input.questionContent}

## Korrekt svar
${input.correctAnswer}

## Admins lösningssteg
${stepsText}

## Instruktioner
Granska varje steg och ge förslag till förbättringar. Svara med JSON:

{
  "overallAssessment": "<Övergripande bedömning av lösningens kvalitet, max 2-3 meningar>",
  "overallRating": <1-5 kvalitetsbetyg>,
  "stepReviews": [
    {
      "stepIndex": <0-baserat index>,
      "originalLabel": "<stegets etikett>",
      "verdict": "<ok|improve|missing_step>",
      "suggestion": "<förbättrad version av stegets innehåll (behåll Markdown + LaTeX, eller tom sträng om ok)>",
      "suggestedLabel": "<förbättrad etikett om tillämpligt, annars samma>",
      "reason": "<kort motivering till förslaget>"
    }
  ],
  "additionalSteps": [
    {
      "afterStepIndex": <infoga efter detta steg, -1 = före första steget>,
      "label": "<etikett för det nya steget>",
      "content": "<innehåll med Markdown + LaTeX>",
      "reason": "<varför detta steg bör läggas till>"
    }
  ]
}

Bedömningsskala (overallRating):
1 = Bristfällig (allvarliga fel eller saknade steg)
2 = Behöver förbättring (flera oklarheter)
3 = Godkänd (fungerar men kan förbättras)
4 = Bra (tydlig och korrekt, smärre förbättringsmöjligheter)
5 = Utmärkt (pedagogiskt exemplarisk)

Regler:
- Sätt verdict "ok" om steget är bra som det är
- Sätt verdict "improve" om du har ett konkret förbättringsförslag
- suggestion SKA innehålla hela det förbättrade steget (inte bara ändringen)
- Om lösningen saknar viktiga mellansteg, lägg till dem i additionalSteps
- Alla texter MÅSTE vara på svenska
- Behåll korrekt LaTeX-syntax ($...$ för inline, $$...$$ för block)

Svara med JSON only.`;
}
