'use server';

import { callOllama } from '@/lib/ollama';
import { auth } from '@/auth';
import { emitLearningEvent } from '@/lib/events/emit';

// ============ TYPES ============

export interface HintRequest {
    questionText: string;
    questionMath?: string;
    correctAnswer: string;
    topicId: string;
    studentAnswer?: string;      // Current (wrong) answer if any
    attemptCount: number;        // How many attempts so far
    hintLevel: 1 | 2 | 3;       // Progressive level
    existingHints?: string[];    // Pre-authored hints from question data
    relatedFormulas?: Array<{ name: string; latex: string }>;
    conceptsTested?: string[];
    // Telemetry (optional): lets hint_requested events join the session stream
    sessionId?: string | null;
    questionId?: string;
    trigger?: 'idle' | 'manual' | 'wrong_answer' | 'ladder';
}

export interface HintResult {
    hint: string;
    hintLevel: 1 | 2 | 3;
    mathExpression?: string;     // LaTeX formula if relevant
    source: 'ai' | 'authored';  // Whether it came from Claude or pre-authored
}

// ============ IN-MEMORY CACHE ============
// Cache hints per question+level to avoid repeated API calls
// Key: `${questionId}:${hintLevel}`

interface CachedHint {
    result: HintResult;
    createdAt: number;
}

const HINT_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const hintCache = new Map<string, CachedHint>();

function getHintCacheKey(questionText: string, hintLevel: number): string {
    // Use first 100 chars of question + level as key
    const qKey = questionText.slice(0, 100).replace(/\s+/g, ' ').trim();
    return `hint:${qKey}:L${hintLevel}`;
}

// ============ MAIN FUNCTION ============

export async function generateHint(request: HintRequest): Promise<HintResult> {
    const { questionText, questionMath, correctAnswer, topicId, studentAnswer, attemptCount, hintLevel, existingHints, relatedFormulas, conceptsTested } = request;

    console.log(`[Hint] Level ${hintLevel} requested for topic "${topicId}" (attempt #${attemptCount})`);

    const session = await auth();
    if (session?.user?.id) {
        await emitLearningEvent({
            eventType: 'hint_requested',
            userId: session.user.id,
            sessionId: request.sessionId,
            questionId: request.questionId,
            topicId,
            payload: { level: hintLevel, trigger: request.trigger ?? 'manual' },
        });
    }

    // --- 1. Check if pre-authored hint exists for this level ---
    // Use the question's built-in hints first (no AI cost)
    if (existingHints && existingHints.length > 0) {
        const authoredHint = existingHints[Math.min(hintLevel - 1, existingHints.length - 1)];
        if (authoredHint) {
            console.log(`[Hint] Using pre-authored hint (level ${hintLevel})`);

            // For level 2+, also include a formula if available
            let mathExpression: string | undefined;
            if (hintLevel >= 2 && relatedFormulas && relatedFormulas.length > 0) {
                mathExpression = relatedFormulas[0].latex;
            }

            return {
                hint: authoredHint,
                hintLevel,
                mathExpression,
                source: 'authored',
            };
        }
    }

    // --- 2. Check cache ---
    const cacheKey = getHintCacheKey(questionText + (questionMath || ''), hintLevel);
    const cached = hintCache.get(cacheKey);
    if (cached && Date.now() - cached.createdAt < HINT_CACHE_TTL_MS) {
        console.log(`[Hint] Cache HIT for level ${hintLevel}`);
        return cached.result;
    }

    // --- 4. Call Ollama with focused micro-prompt ---
    try {
        const levelInstructions = {
            1: `Ge en försiktig konceptuell knuff — EN mening. Avslöja INTE svaret eller metoden. Peka bara studentens tankegång i rätt riktning. Exempel: "Har du tänkt på vad som händer geometriskt här?"`,
            2: `Visa den relevanta formeln eller satsen. Ange den tydligt med dess namn. Ge sedan EN mening om hur den gäller här. LÖS INTE uppgiften.`,
            3: `Visa BARA FÖRSTA STEGET i lösningen. Förklara vad man ska göra och varför. Visa resultatet av det första steget. Slutför INTE lösningen.`,
        };

        const contextParts: string[] = [];
        if (questionMath) contextParts.push(`Math expression: ${questionMath}`);
        if (studentAnswer) contextParts.push(`Student's wrong answer: ${studentAnswer}`);
        if (conceptsTested?.length) contextParts.push(`Concepts: ${conceptsTested.join(', ')}`);
        if (relatedFormulas?.length) {
            contextParts.push(`Relevant formulas: ${relatedFormulas.map(f => `${f.name}: ${f.latex}`).join('; ')}`);
        }

        const prompt = `You are helping a university math student who is stuck on a problem.

Question: ${questionText}
${contextParts.join('\n')}
Correct answer: ${correctAnswer}
Student has attempted ${attemptCount} time(s).

${levelInstructions[hintLevel]}

Respond with ONLY a JSON object (no markdown):
{
  "hint": "your hint text here",
  "math": "optional LaTeX expression if showing a formula, or null"
}`;

        const startTime = Date.now();
        const raw = await callOllama({
            messages: [
                { role: 'system', content: 'Du är en kortfattad mattehandledare. Svara med JSON endast. Håll ledtrådar korta och naturliga — säg aldrig "AI" eller "jag", tala som plattformen. Svara alltid på svenska.' },
                { role: 'user', content: prompt },
            ],
            maxTokens: 200,
            temperature: 0.3,
        });

        const elapsed = Date.now() - startTime;
        console.log(`[Hint] Ollama responded in ${elapsed}ms`);

        // Parse response
        const parsed = parseHintJson(raw);
        const result: HintResult = {
            hint: parsed?.hint || getFallbackHint(hintLevel, relatedFormulas).hint,
            hintLevel,
            mathExpression: parsed?.math || undefined,
            source: 'ai',
        };

        // Cache it
        hintCache.set(cacheKey, { result, createdAt: Date.now() });
        console.log(`[Hint] ✅ Cached AI hint (level ${hintLevel})`);

        return result;

    } catch (error: any) {
        console.error('[Hint] ❌ AI error:', error?.message || error);
        return getFallbackHint(hintLevel, relatedFormulas);
    }
}

// ============ HELPERS ============

function parseHintJson(text: string): { hint: string; math?: string | null } | null {
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
    if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
    if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
    cleaned = cleaned.trim();

    try {
        return JSON.parse(cleaned);
    } catch {
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start !== -1 && end > start) {
            try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { return null; }
        }
        return null;
    }
}

function getFallbackHint(
    level: 1 | 2 | 3,
    relatedFormulas?: Array<{ name: string; latex: string }>
): HintResult {
    const hints: Record<number, string> = {
        1: 'Ta ett steg tillbaka och tänk på vilket begrepp eller vilken sats som gäller här.',
        2: 'Försök att skriva ner den relevanta formeln först, identifiera sedan vilka värden du känner till.',
        3: 'Börja med att sätta upp ekvationen. Identifiera vad du behöver hitta och vilken information du har.',
    };

    return {
        hint: hints[level],
        hintLevel: level,
        mathExpression: level >= 2 && relatedFormulas?.[0]?.latex || undefined,
        source: 'authored',
    };
}
