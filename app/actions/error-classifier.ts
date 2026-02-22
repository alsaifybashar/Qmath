'use server';

import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/db/drizzle';
import { misconceptions } from '@/db/schema';

// ============ TYPES ============

export type ErrorType =
    | 'conceptual'      // Student misunderstands the underlying concept
    | 'computational'   // Arithmetic or algebraic mistake
    | 'notation'        // Wrong mathematical notation
    | 'interpretation'  // Misread or misunderstood the question
    | 'incomplete'      // Right approach but didn't finish
    | 'time_pressure';  // Left blank or random answer

export interface ErrorClassification {
    errorType: ErrorType;
    feedback: string;           // Shown to student — specific, not generic
    feedbackSv?: string;        // Swedish version of feedback
    remediation: string;        // Internal — what the next question should target
    confidence: number;         // 0-1 how confident the classification is
    misconceptionCode?: string; // If matched to a known misconception
    misconceptionId?: string;   // Database ID of the matched misconception
    remediationTopicId?: string; // Topic to remediate if misconception detected
}

export interface ClassifyRequest {
    questionText: string;
    questionMath?: string;
    correctAnswer: string;
    studentAnswer: string;
    topicId: string;
    conceptsTested?: string[];
    timeTakenMs?: number;
}

// ============ CACHE ============

interface CachedClassification {
    result: ErrorClassification;
    createdAt: number;
}

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const classificationCache = new Map<string, CachedClassification>();

function getCacheKey(questionText: string, studentAnswer: string): string {
    const qKey = questionText.slice(0, 80).replace(/\s+/g, '');
    const aKey = studentAnswer.slice(0, 40).replace(/\s+/g, '');
    return `error:${qKey}:${aKey}`;
}

// ============ MAIN FUNCTION ============

export async function classifyError(request: ClassifyRequest): Promise<ErrorClassification> {
    const { questionText, questionMath, correctAnswer, studentAnswer, topicId, conceptsTested, timeTakenMs } = request;

    console.log(`[ErrorClassifier] Classifying error for topic "${topicId}": "${studentAnswer}" vs correct "${correctAnswer}"`);

    // --- 1. Quick heuristics (no AI needed) ---
    const quickResult = quickClassify(correctAnswer, studentAnswer, timeTakenMs);
    if (quickResult) {
        console.log(`[ErrorClassifier] ⚡ Quick classification: ${quickResult.errorType}`);
        return quickResult;
    }

    // --- 1b. Misconception matching (no AI needed, saves API calls) ---
    const misconceptionResult = await matchMisconception(request);
    if (misconceptionResult) {
        console.log(`[ErrorClassifier] ⚡ Misconception match: ${misconceptionResult.misconceptionCode}`);
        return misconceptionResult;
    }

    // --- 2. Check cache ---
    const cacheKey = getCacheKey(questionText, studentAnswer);
    const cached = classificationCache.get(cacheKey);
    if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
        console.log(`[ErrorClassifier] Cache HIT: ${cached.result.errorType}`);
        return cached.result;
    }

    // --- 3. Check API key ---
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return getFallbackClassification(correctAnswer, studentAnswer);
    }

    // --- 4. Call Claude ---
    try {
        const anthropic = new Anthropic({ apiKey });

        const contextParts: string[] = [];
        if (questionMath) contextParts.push(`Math: ${questionMath}`);
        if (conceptsTested?.length) contextParts.push(`Concepts: ${conceptsTested.join(', ')}`);
        if (timeTakenMs) contextParts.push(`Time taken: ${Math.round(timeTakenMs / 1000)}s`);

        const prompt = `A university math student answered incorrectly. Classify the error type.

Question: ${questionText}
${contextParts.join('\n')}
Correct answer: ${correctAnswer}
Student's answer: ${studentAnswer}

Classify the error as ONE of:
- "conceptual" — student misunderstands the concept
- "computational" — arithmetic/algebraic mistake (right approach, wrong calculation)
- "notation" — wrong mathematical notation or formatting
- "interpretation" — misread or misunderstood the question
- "incomplete" — right approach but didn't complete

Return JSON only (feedback MUST be in Swedish):
{
  "errorType": "one_of_above",
  "feedback": "En mening på svenska som förklarar vad som gick fel, riktad till studenten. Var specifik. Säg inte 'fel'.",
  "remediation": "What type of follow-up question would help (one sentence, for internal use)",
  "confidence": 0.85
}`;

        const startTime = Date.now();
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 200,
            temperature: 0.2,
            system: 'Du är en kortfattad klassificerare av matematikfel. Returnera endast JSON. Var vänlig men specifik i återkopplingen. Svara alltid på svenska — feedback-fältet ska vara på svenska.',
            messages: [{ role: 'user', content: prompt }],
        });

        const elapsed = Date.now() - startTime;
        const raw = message.content[0].type === 'text' ? message.content[0].text : '';
        console.log(`[ErrorClassifier] Claude responded in ${elapsed}ms (${message.usage.input_tokens}+${message.usage.output_tokens} tokens)`);

        const parsed = parseClassificationJson(raw);
        if (parsed) {
            // Cache it
            classificationCache.set(cacheKey, { result: parsed, createdAt: Date.now() });
            console.log(`[ErrorClassifier] ✅ ${parsed.errorType} (confidence: ${parsed.confidence})`);
            return parsed;
        }

        return getFallbackClassification(correctAnswer, studentAnswer);

    } catch (error: any) {
        console.error('[ErrorClassifier] ❌ Error:', error?.message || error);
        return getFallbackClassification(correctAnswer, studentAnswer);
    }
}

// ============ QUICK HEURISTICS ============

function quickClassify(correctAnswer: string, studentAnswer: string, timeTakenMs?: number): ErrorClassification | null {
    const correct = correctAnswer.toLowerCase().trim();
    const student = studentAnswer.toLowerCase().trim();

    // Empty or very short answer with little time = time pressure
    if (student.length === 0 || (timeTakenMs && timeTakenMs < 3000 && student.length < 3)) {
        return {
            errorType: 'time_pressure',
            feedback: 'Det verkar som om du kan ha skyndat dig. Ta den tid du behöver på den här uppgiften.',
            remediation: 'Repeat same difficulty, no time pressure',
            confidence: 0.9,
        };
    }

    // Sign error detection (common computational mistake)
    if (correct.replace(/-/g, '') === student.replace(/-/g, '') && correct !== student) {
        return {
            errorType: 'computational',
            feedback: 'Kontrollera tecknet på ditt svar — beloppet stämmer, men tecknet är fel.',
            remediation: 'Same topic, focus on sign conventions',
            confidence: 0.95,
        };
    }

    // Factor-of-2 or similar simple arithmetic errors
    const correctNum = parseFloat(correct);
    const studentNum = parseFloat(student);
    if (!isNaN(correctNum) && !isNaN(studentNum)) {
        if (Math.abs(studentNum) === Math.abs(correctNum) * 2 || Math.abs(studentNum) * 2 === Math.abs(correctNum)) {
            return {
                errorType: 'computational',
                feedback: 'Ditt svar skiljer sig med en faktor 2. Dubbelkolla dina multiplikations- eller divisionssteg.',
                remediation: 'Same topic, simpler numbers',
                confidence: 0.85,
            };
        }
    }

    // Student gave the derivative instead of the value (e.g., "6x-2" instead of "10")
    if (student.includes('x') && !correct.includes('x')) {
        return {
            errorType: 'incomplete',
            feedback: `Du hittade det allmänna uttrycket, men uppgiften frågar efter ett specifikt numeriskt värde. Försök sätta in det givna värdet.`,
            remediation: 'Practice evaluating expressions at specific points',
            confidence: 0.9,
        };
    }

    return null; // Can't determine quickly — need AI
}

// ============ MISCONCEPTION MATCHING ============

interface MisconceptionPattern {
    type: 'regex' | 'description';
    pattern: string;
}

interface MisconceptionRecord {
    id: string;
    code: string;
    description: string;
    affectedTopicIds: string[] | null;
    commonWrongPatterns: MisconceptionPattern[] | null;
    feedbackEn: string | null;
    feedbackSv: string | null;
    remediationTopicId: string | null;
    severity: string | null;
}

/**
 * Match a student's error against the misconception catalog.
 * This runs BEFORE the AI classifier to save API calls.
 *
 * Matching strategy:
 * 1. Filter misconceptions to those affecting the current topic
 * 2. For each, check regex patterns against the student answer
 * 3. For description-based patterns, do keyword matching against
 *    the relationship between the student answer and correct answer
 *
 * Research: elaborated feedback (d = 0.49) vastly outperforms simple
 * correctness feedback (d = 0.05).
 */
async function matchMisconception(request: ClassifyRequest): Promise<ErrorClassification | null> {
    const { topicId, correctAnswer, studentAnswer, questionText } = request;

    try {
        // Load misconceptions that affect this topic
        const allMisconceptions = await db.query.misconceptions.findMany();

        // Filter to those that affect the current topic
        const relevant = allMisconceptions.filter(m => {
            const affected = m.affectedTopicIds as string[] | null;
            if (!affected) return true; // If no topic filter, apply globally
            return affected.some(tid =>
                topicId.toLowerCase().includes(tid.toLowerCase()) ||
                tid.toLowerCase().includes(topicId.toLowerCase())
            );
        });

        if (relevant.length === 0) return null;

        const student = studentAnswer.trim();
        const correct = correctAnswer.trim();

        for (const misconception of relevant) {
            const patterns = misconception.commonWrongPatterns as MisconceptionPattern[] | null;
            if (!patterns) continue;

            for (const pattern of patterns) {
                let matched = false;

                if (pattern.type === 'regex') {
                    try {
                        const regex = new RegExp(pattern.pattern, 'i');
                        // Test against the combined "student wrote X when correct was Y" context
                        const testString = `${questionText} = ${student}`;
                        matched = regex.test(testString) || regex.test(student);
                    } catch {
                        // Invalid regex — skip
                    }
                } else if (pattern.type === 'description') {
                    // Keyword-based matching on the error signature
                    matched = matchDescriptionPattern(pattern.pattern, student, correct, questionText);
                }

                if (matched) {
                    return {
                        errorType: 'conceptual',
                        feedback: misconception.feedbackEn || `This looks like a common misconception: ${misconception.description}`,
                        feedbackSv: misconception.feedbackSv || undefined,
                        remediation: `Remediate misconception: ${misconception.code}`,
                        confidence: 0.85,
                        misconceptionCode: misconception.code,
                        misconceptionId: misconception.id,
                        remediationTopicId: misconception.remediationTopicId || undefined,
                    };
                }
            }
        }

        return null;
    } catch (error) {
        console.error('[ErrorClassifier] Misconception matching failed:', error);
        return null;
    }
}

/**
 * Heuristic matching for description-based misconception patterns.
 * Checks if the relationship between student answer and correct answer
 * matches the described error signature.
 */
function matchDescriptionPattern(
    description: string,
    studentAnswer: string,
    correctAnswer: string,
    questionText: string
): boolean {
    const desc = description.toLowerCase();
    const student = studentAnswer.toLowerCase();
    const correct = correctAnswer.toLowerCase();

    // "Answer differs from correct only by sign"
    if (desc.includes('differs') && desc.includes('sign')) {
        const sNum = parseFloat(student);
        const cNum = parseFloat(correct);
        if (!isNaN(sNum) && !isNaN(cNum) && Math.abs(sNum) === Math.abs(cNum) && sNum !== cNum) {
            return true;
        }
    }

    // "Forgot to negate" or "missing minus"
    if (desc.includes('negate') || desc.includes('minus')) {
        const sNum = parseFloat(student);
        const cNum = parseFloat(correct);
        if (!isNaN(sNum) && !isNaN(cNum) && sNum === -cNum) return true;
    }

    // "Missing +C" (integration constant)
    if (desc.includes('+c') || desc.includes('missing +c')) {
        if (!student.includes('c') && correct.includes('c')) return true;
    }

    // "Squared sum without cross term"
    if (desc.includes('cross term') || desc.includes('2ab')) {
        // If the question involves squaring a sum and the student answer lacks middle terms
        if (questionText.includes('^2') || questionText.includes('²')) {
            // Simple heuristic: student answer has fewer terms than expected
            const studentTerms = student.split(/[+-]/).filter(Boolean).length;
            const correctTerms = correct.split(/[+-]/).filter(Boolean).length;
            if (studentTerms < correctTerms) return true;
        }
    }

    // "Answer contains x when a number was expected"
    if (desc.includes('contains x') && desc.includes('number')) {
        if (student.includes('x') && !correct.includes('x')) return true;
    }

    // "Added numerators and denominators separately"
    if (desc.includes('numerators') && desc.includes('denominators')) {
        // Hard to detect without parsing — skip for now
    }

    return false;
}

// ============ HELPERS ============

function parseClassificationJson(text: string): ErrorClassification | null {
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
    if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
    if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
    cleaned = cleaned.trim();

    try {
        const parsed = JSON.parse(cleaned);
        // Validate
        const validTypes: ErrorType[] = ['conceptual', 'computational', 'notation', 'interpretation', 'incomplete', 'time_pressure'];
        if (!validTypes.includes(parsed.errorType)) return null;
        return {
            errorType: parsed.errorType,
            feedback: parsed.feedback || 'Check your work and try again.',
            remediation: parsed.remediation || 'Repeat similar problem',
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
        };
    } catch {
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start !== -1 && end > start) {
            try {
                const inner = JSON.parse(cleaned.slice(start, end + 1));
                return {
                    errorType: inner.errorType || 'computational',
                    feedback: inner.feedback || 'Check your work and try again.',
                    remediation: inner.remediation || 'Repeat similar problem',
                    confidence: typeof inner.confidence === 'number' ? inner.confidence : 0.5,
                };
            } catch { return null; }
        }
        return null;
    }
}

function getFallbackClassification(correctAnswer: string, studentAnswer: string): ErrorClassification {
    return {
        errorType: 'computational',
        feedback: `Det förväntade svaret är ${correctAnswer}. Gå igenom dina beräkningssteg noggrant.`,
        remediation: 'Repeat similar problem at same difficulty',
        confidence: 0.3,
    };
}
