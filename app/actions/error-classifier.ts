'use server';

import Anthropic from '@anthropic-ai/sdk';

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
    remediation: string;        // Internal — what the next question should target
    confidence: number;         // 0-1 how confident the classification is
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

Return JSON only:
{
  "errorType": "one_of_above",
  "feedback": "One sentence explaining what went wrong, addressed to the student. Be specific. Don't say 'incorrect'.",
  "remediation": "What type of follow-up question would help (one sentence, for internal use)",
  "confidence": 0.85
}`;

        const startTime = Date.now();
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 200,
            temperature: 0.2,
            system: 'You are a concise math error classifier. Return JSON only. Be kind but specific in feedback.',
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
            feedback: 'It looks like you might have been rushing. Take your time with this one.',
            remediation: 'Repeat same difficulty, no time pressure',
            confidence: 0.9,
        };
    }

    // Sign error detection (common computational mistake)
    if (correct.replace(/-/g, '') === student.replace(/-/g, '') && correct !== student) {
        return {
            errorType: 'computational',
            feedback: 'Check the sign of your answer — the magnitude is correct but the sign is off.',
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
                feedback: 'Your answer is off by a factor of 2. Double-check your multiplication or division steps.',
                remediation: 'Same topic, simpler numbers',
                confidence: 0.85,
            };
        }
    }

    // Student gave the derivative instead of the value (e.g., "6x-2" instead of "10")
    if (student.includes('x') && !correct.includes('x')) {
        return {
            errorType: 'incomplete',
            feedback: `You found the general expression, but the question asks for a specific numerical value. Try substituting in the given value.`,
            remediation: 'Practice evaluating expressions at specific points',
            confidence: 0.9,
        };
    }

    return null; // Can't determine quickly — need AI
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
        feedback: `The expected answer is ${correctAnswer}. Review your calculation steps carefully.`,
        remediation: 'Repeat similar problem at same difficulty',
        confidence: 0.3,
    };
}
