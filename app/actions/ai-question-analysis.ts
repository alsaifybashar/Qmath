'use server';

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import Anthropic from '@anthropic-ai/sdk';
import { callOllama } from '@/lib/ollama';
import { db } from '@/db/drizzle';
import { questions, topics, courses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { z } from 'zod';

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

/** Extract the JSON object from Claude's output, handling code fences and surrounding text */
function stripMarkdownFences(text: string): string {
    // Strip markdown code fences
    let stripped = text
        .replace(/^```(?:json)?\s*\n?/i, '')
        .replace(/\n?```\s*$/i, '')
        .trim();

    // If there's still surrounding prose, grab the first {...} block
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        stripped = jsonMatch[0];
    }

    return stripped;
}

/**
 * Repair invalid backslash escapes inside JSON string literals.
 * Models frequently emit LaTeX such as \frac, \Rightarrow or \left inside
 * JSON strings. Those are invalid JSON escapes and make JSON.parse fail.
 * This sanitizer only operates while inside JSON strings and preserves valid
 * JSON escapes like \n, \t, \\, \" and \u1234.
 */
function fixLatexBackslashes(json: string): string {
    let result = '';
    let inString = false;
    let escaped = false;

    for (let i = 0; i < json.length; i++) {
        const char = json[i];

        if (!inString) {
            result += char;
            if (char === '"') {
                inString = true;
            }
            continue;
        }

        if (escaped) {
            result += char;
            escaped = false;
            continue;
        }

        if (char === '\\') {
            const next = json[i + 1];

            if (
                next === '"' ||
                next === '\\' ||
                next === '/' ||
                next === 'b' ||
                next === 'f' ||
                next === 'n' ||
                next === 'r' ||
                next === 't'
            ) {
                result += char;
                escaped = true;
                continue;
            }

            if (
                next === 'u' &&
                /^[0-9a-fA-F]{4}$/.test(json.slice(i + 2, i + 6))
            ) {
                result += char;
                escaped = true;
                continue;
            }

            result += '\\\\';
            continue;
        }

        result += char;

        if (char === '"') {
            inString = false;
        }
    }

    return result;
}

function normalizeJsonQuotes(text: string): string {
    return text
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'");
}

function removeTrailingCommas(text: string): string {
    return text.replace(/,\s*([}\]])/g, '$1');
}

function collectAnthropicTextBlocks(
    content: Anthropic.Messages.Message['content']
): string {
    return content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n')
        .trim();
}

function parseAiJson<T>(rawText: string): T {
    const candidates = [
        rawText,
        stripMarkdownFences(rawText),
        fixLatexBackslashes(stripMarkdownFences(rawText)),
        removeTrailingCommas(fixLatexBackslashes(stripMarkdownFences(rawText))),
        removeTrailingCommas(fixLatexBackslashes(normalizeJsonQuotes(stripMarkdownFences(rawText)))),
    ].filter(Boolean);

    let lastError: unknown;
    for (const candidate of candidates) {
        try {
            return JSON.parse(candidate) as T;
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError ?? new Error('Unknown JSON parse error');
}

const suggestedSolutionSchema = z.object({
    steps: z.array(z.object({
        label: z.string().trim().min(1),
        content: z.string().trim().min(1),
        expectedAnswer: z.string().optional().default(''),
    })).min(1),
});

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

        // 3. Build prompt
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

        // 4. Call Ollama
        const rawText = await callOllama({
            messages: [
                { role: 'system', content: 'Du är en matematikpedagogik-expert specialiserad på universitetsmatematik för svenska ingenjörsstudenter. Du analyserar matematikuppgifter och ger strukturerade svårighetsbedömningar. Svara alltid med giltig JSON — ingen markdown, inga förklaringar utanför JSON. Fälten feedbackForAdmin och suggestedHints MÅSTE vara på svenska.' },
                { role: 'user', content: prompt },
            ],
            maxTokens: 800,
            temperature: 0.2,
            timeoutMs: 60_000,
        });

        let analysis: AIQuestionAnalysis;
        try {
            analysis = JSON.parse(fixLatexBackslashes(stripMarkdownFences(rawText)));
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

// ============ GUIDANCE STEPS SUGGESTION (from form content) ============

/**
 * Generate guidance step suggestions from raw form content — no saved question needed.
 * Called from the admin form for both new and existing questions.
 */
export async function suggestGuidanceSteps(input: {
    questionContent: string;
    correctAnswer: string;
    questionType: string;
    solutionSteps?: { label: string; content: string }[];
    topicName?: string;
    courseCode?: string;
    existingGuidanceSteps?: { id: string; order: number; content: string }[];
}): Promise<{ success: true; steps: GuidanceStep[] } | { success: false; error: string }> {
    try {
        await checkAdmin();

        if (!input.questionContent.trim()) {
            return { success: false, error: 'Frågeinnehållet får inte vara tomt.' };
        }

        const solutionText = input.solutionSteps
            ?.filter(s => s.content.trim())
            .map((s, i) => `### ${i + 1}. ${s.label}\n${s.content}`)
            .join('\n\n') ?? '';

        const existingText = input.existingGuidanceSteps?.length
            ? '\n\nAdmins befintliga vägledningssteg:\n' +
            input.existingGuidanceSteps.map((s, i) => `${i + 1}. ${s.content}`).join('\n') +
            '\n\nFörbättra dessa eller föreslå nya.'
            : '';

        const prompt = `Du är en erfaren matematiklektor som skapar pedagogiska ledtrådar för studenter.

## Uppgift
${input.courseCode ? `Kurs: ${input.courseCode}` : ''}${input.topicName ? ` — Ämne: ${input.topicName}` : ''}
Frågetyp: ${input.questionType}

Frågetext:
${input.questionContent}

Korrekt svar: ${input.correctAnswer}
${solutionText ? `\nLösningssteg:\n${solutionText}` : ''}${existingText}

## Din uppgift
Skapa 3–5 progressiva vägledningssteg som hjälper en student att TÄNKA rätt utan att avslöja svaret. Varje steg ska:
- Vägleda studentens resonemang (inte avslöja lösningsvägen direkt)
- Vara kort och tydligt (1-2 meningar)
- Bygga vidare på föregående steg
- Vara på svenska
- Inte innehålla det korrekta svaret
- Gärna inkludera en reflektionsfråga eller ett tips om vilken metod/formel som kan hjälpa

Svara med JSON:
{
  "steps": [
    { "order": 1, "content": "<vägledningstext>" },
    { "order": 2, "content": "<nästa steg>" }
  ]
}

Svara med JSON only.`;

        const rawText = await callOllama({
            messages: [
                {
                    role: 'system',
                    content: 'Du är en matematikpedagog. Skapa vägledningssteg som hjälper studenter TÄNKA rätt utan att avslöja svaret. Skriv på svenska. Svara med JSON only.',
                },
                { role: 'user', content: prompt },
            ],
            maxTokens: 800,
            temperature: 0.45,
            timeoutMs: 60_000,
        });

        let parsed: { steps: Array<{ order: number; content: string }> };
        try {
            parsed = JSON.parse(fixLatexBackslashes(stripMarkdownFences(rawText)));
        } catch {
            console.error('[Guidance Suggest] Failed to parse JSON:', rawText);
            return { success: false, error: 'AI-förslaget kunde inte tolkas. Försök igen.' };
        }

        if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) {
            return { success: false, error: 'AI returnerade inga vägledningssteg.' };
        }

        const steps: GuidanceStep[] = parsed.steps.map((s, i) => ({
            id: crypto.randomUUID(),
            order: typeof s.order === 'number' ? s.order : i + 1,
            content: String(s.content ?? '').trim(),
        }));

        return { success: true, steps };
    } catch (error) {
        console.error('[Guidance Suggest] Error:', error);
        return { success: false, error: 'Kunde inte generera vägledningssteg. Försök igen.' };
    }
}

// ============ AI SOLUTION SUGGESTION ============

export interface SuggestedSolutionStep {
    label: string;
    content: string;
    expectedAnswer: string;
}

/**
 * AI-powered solution suggestion. Generates a step-by-step solution for a given question.
 * The AI acts as an elite teacher providing formulas and clear reasoning.
 */
export async function suggestSolutionSteps(input: {
    questionContent: string;
    correctAnswer: string;
    questionType: string;
    topicName?: string;
    courseCode?: string;
    courseName?: string;
}): Promise<{ success: true; steps: SuggestedSolutionStep[] } | { success: false; error: string }> {
    try {
        await checkAdmin();

        if (!input.questionContent.trim()) {
            return { success: false, error: 'Frågeinnehållet får inte vara tomt.' };
        }

        const prompt = `Du är en elit-lärare i matematik vid ett svenskt universitet. Din uppgift är att ta fram en pedagogisk, steg-för-steg-lösning till en matematikuppgift.

## Uppgiftskontext
- Kurs: ${input.courseCode ?? '?'} ${input.courseName ?? ''}
- Ämne: ${input.topicName ?? 'Ej angivet'}
- Frågetyp: ${input.questionType}

## Frågetext
${input.questionContent}

${input.correctAnswer ? `## Korrekt slutresultat\n${input.correctAnswer}` : ''}

## Din uppgift
Skapa en fullständig lösning uppdelad i 3-6 logiska steg. Varje steg ska vara tydligt, pedagogiskt och innehålla de formler som används för att lösa just det steget.

För varje steg ska du ange:
1. En kort etikett/rubrik (label) som beskriver vad man gör i steget (t.ex. "Faktorisera uttrycket").
2. En utförlig förklaring (content) med Markdown och LaTeX ($...$ för inline, $$...$$ för block). Förklara VARFÖR man gör som man gör och vilka regler/formler som tillämpas.
3. Ett förväntat svar (expectedAnswer) för just det steget. Detta är vad studenten bör ha kommit fram till efter att ha utfört steget (t.ex. ett förenklat uttryck eller ett delresultat).

Svara med JSON:
{
  "steps": [
    {
      "label": "<kort rubrik>",
      "content": "<pedagogisk förklaring med LaTeX>",
      "expectedAnswer": "<delresultat efter steget>"
    }
  ]
}

Regler:
- Svara på svenska.
- Var noggrann med LaTeX-formatering.
- Se till att lösningen leder fram till det korrekta slutresultatet.
- Inkludera de matematiska formler som används explicit i förklaringen.
- Svara med JSON only.`;

        let rawText: string;
        const apiKey = process.env.ANTHROPIC_API_KEY;

        if (apiKey) {
            // Use Claude if API key is available
            const message = await anthropic.messages.create({
                model: 'claude-sonnet-4-5',
                max_tokens: 8192,
                temperature: 0.3,
                system: 'Du är en elit-lärare i matematik. Skapa pedagogiska lösningar med formler och steg-för-steg-instruktioner. Skriv på svenska. Svara med JSON only.',
                messages: [{ role: 'user', content: prompt }],
            });
            rawText = collectAnthropicTextBlocks(message.content);
        } else {
            // Fallback to Ollama
            rawText = await callOllama({
                messages: [
                    {
                        role: 'system',
                        content: 'Du är en elit-lärare i matematik. Skapa pedagogiska lösningar med formler och steg-för-steg-instruktioner. Skriv på svenska. Svara med JSON only.',
                    },
                    { role: 'user', content: prompt },
                ],
                maxTokens: 8192,
                temperature: 0.3,
                timeoutMs: 120_000,
                format: 'json',
            });
        }

        let parsed: unknown;
        try {
            parsed = parseAiJson(rawText);
        } catch (parseErr) {
            console.error('[AI Solution Suggest] Failed to parse JSON. Raw:', rawText);
            console.error('[AI Solution Suggest] Parse error:', parseErr);
            return { success: false, error: 'AI-förslaget kunde inte tolkas. Försök igen.' };
        }

        const candidate = (
            parsed &&
            typeof parsed === 'object' &&
            !Array.isArray(parsed)
        )
            ? {
                ...(parsed as Record<string, unknown>),
                steps:
                    (parsed as Record<string, unknown>).steps ??
                    (parsed as Record<string, unknown>).solutionSteps ??
                    (parsed as Record<string, unknown>).suggestedSteps,
            }
            : parsed;

        const validated = suggestedSolutionSchema.safeParse(candidate);
        if (!validated.success) {
            console.error('[AI Solution Suggest] Invalid JSON shape:', validated.error.flatten());
            return { success: false, error: 'AI returnerade inga lösningssteg.' };
        }

        return {
            success: true,
            steps: validated.data.steps.map(step => ({
                label: step.label.trim(),
                content: step.content.trim(),
                expectedAnswer: step.expectedAnswer.trim(),
            })),
        };
    } catch (error) {
        console.error('[AI Solution Suggest] Error:', error);
        return { success: false, error: 'Kunde inte generera lösningssteg. Kontrollera API-nyckeln och försök igen.' };
    }
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

        const prompt = buildSolutionReviewPrompt(input);

        let rawText: string;
        const apiKey = process.env.ANTHROPIC_API_KEY;

        if (apiKey) {
            const message = await anthropic.messages.create({
                model: 'claude-sonnet-4-5',
                max_tokens: 2500,
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
            rawText = collectAnthropicTextBlocks(message.content);
        } else {
            rawText = await callOllama({
                messages: [
                    {
                        role: 'system',
                        content: `Du är en erfaren matematiklektor vid ett svenskt universitet som granskar lösningsförslag till matematikuppgifter. Din uppgift är att granska varje steg i lösningen och föreslå förbättringar som ökar tydligheten, pedagogiken och den matematiska korrektheten.

Dina förslag ska:
- Vara på svenska
- Förbättra pedagogisk tydlighet (t.ex. lägga till motiveringar, mellsteg)
- Korrigera eventuella matematiska fel
- Förbättra LaTeX-formateringen om det behövs
- Föreslå saknade steg om lösningen hoppar över viktiga resonemang
- Behålla den övergripande strukturen och stilen

Svara ALLTID med giltig JSON utan markdown-formatering utanför JSON.`,
                    },
                    { role: 'user', content: prompt },
                ],
                maxTokens: 2000,
                temperature: 0.3,
                timeoutMs: 90_000,
            });
        }

        let review: AISolutionReview;
        try {
            review = JSON.parse(fixLatexBackslashes(stripMarkdownFences(rawText)));
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

// ============ GUIDANCE STEPS GENERATION ============

export interface GuidanceStep {
    id: string;
    order: number;
    content: string;  // Markdown/plain text with optional inline math $...$
}

/**
 * Generate pedagogical guidance steps for a question using Ollama.
 * Returns suggested steps WITHOUT saving to DB — admin decides whether to accept.
 *
 * Guidance steps guide the student's THINKING without revealing the answer.
 * They are shown progressively after a wrong answer, one at a time.
 */
export async function generateGuidanceSteps(
    questionId: string
): Promise<{ success: true; steps: GuidanceStep[] } | { success: false; error: string }> {
    try {
        await checkAdmin();

        // Fetch question with topic/course context
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
            return { success: false, error: 'Frågan hittades inte.' };
        }

        const topicName = question.topic?.title ?? 'Okänt ämne';
        const courseCode = question.topic?.course?.code ?? '';

        const prompt = `Du är en erfaren matematiklektor som skapar pedagogiska ledtrådar för studenter som svarar fel på en uppgift.

## Uppgift
Kurs: ${courseCode} — Ämne: ${topicName}
Fråga:
${question.contentMarkdown}

Korrekt svar: ${question.correctAnswer}
${question.explanationMarkdown ? `\nLösningsskiss:\n${question.explanationMarkdown}` : ''}

## Din uppgift
Skapa 3–5 progressiva vägledningssteg som hjälper en student att TÄNKA rätt utan att avslöja svaret. Varje steg ska:
- Vägleda studentens resonemang (inte avslöja lösningsvägen direkt)
- Vara kort och tydligt (1-2 meningar max)
- Bygga vidare på föregående steg
- Vara på svenska
- Inte innehålla det korrekta svaret
- Gärna inkludera en reflektionsfråga

Svara med JSON:
{
  "steps": [
    { "order": 1, "content": "<vägledningstext med eventuell $latex$>" },
    { "order": 2, "content": "<nästa steg>" },
    ...
  ]
}

Svara med JSON only.`;

        const rawText = await callOllama({
            messages: [
                {
                    role: 'system',
                    content: 'Du är en matematikpedagog som skapar vägledningssteg för studenter. Skriv alltid på svenska. Svara med JSON only.',
                },
                { role: 'user', content: prompt },
            ],
            maxTokens: 800,
            temperature: 0.4,
            timeoutMs: 60_000,
        });

        let parsed: { steps: Array<{ order: number; content: string }> };
        try {
            parsed = JSON.parse(fixLatexBackslashes(stripMarkdownFences(rawText)));
        } catch {
            console.error('[Guidance Steps] Failed to parse JSON:', rawText);
            return { success: false, error: 'AI-förslaget kunde inte tolkas. Försök igen.' };
        }

        if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) {
            return { success: false, error: 'AI returnerade inga vägledningssteg.' };
        }

        // Assign UUIDs to each step
        const steps: GuidanceStep[] = parsed.steps.map((s, i) => ({
            id: crypto.randomUUID(),
            order: s.order ?? i + 1,
            content: String(s.content ?? '').trim(),
        }));

        return { success: true, steps };
    } catch (error) {
        console.error('[Guidance Steps] Error:', error);
        return { success: false, error: 'Kunde inte generera vägledningssteg. Försök igen.' };
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
