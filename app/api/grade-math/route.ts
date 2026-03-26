import { NextRequest, NextResponse } from 'next/server';
import { gradeAnswer } from '@/lib/math/cas-grader';
import { runFeedbackTree } from '@/lib/math/feedback-tree';
import { db } from '@/db/drizzle';
import { attemptLogs } from '@/db/schema';
import { BayesianKnowledgeTracing } from '@/lib/adaptive-engine/knowledge-tracing';

// ── In-memory result cache ─────────────────────────────────────────────────────
// Keyed by SHA-256 of (studentInput + correctAnswer + options JSON).
// Resets on cold start — fine for stateless serverless or local dev.

interface CacheEntry {
    response: GradeResponse;
    expiresAt: number;
}

const CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min
const bkt = new BayesianKnowledgeTracing();

// ── Request / Response schemas ─────────────────────────────────────────────────

interface GradeRequest {
    studentInput: string;
    correctAnswer: string;
    questionId?: string;
    topicId?: string;
    userId?: string;
    ignoreConstant?: boolean;
    questionType?: 'integral' | 'derivative' | 'algebra' | 'trigonometry' | 'limit' | 'series' | 'other';
    variables?: string[];            // e.g. ["x", "y"] for multi-variable
    domain?: 'real' | 'positive' | 'complex';
    confidenceRating?: number;       // 1–5 from frontend slider
    currentMastery?: number;         // 0–1, for BKT update
    timeTakenMs?: number;
}

export interface GradeResponse {
    isCorrect: boolean;
    partialScore: number;            // 0.0 – 1.0
    parsedStudent: string;           // what we actually evaluated
    symbolicallyChecked: boolean;
    feedback: {
        code: string;
        message: string;
        hint?: string;
        remediationTopicSlug?: string;
    } | null;
    // Updated mastery after this attempt (only if topicId + userId provided)
    newMastery?: number;
    isMastered?: boolean;
}

// ── Hash helper ────────────────────────────────────────────────────────────────

async function hashKey(payload: object): Promise<string> {
    const text = JSON.stringify(payload);
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Node.js fallback
    const { createHash } = await import('crypto');
    return createHash('sha256').update(text).digest('hex');
}

// ── Route handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    const startMs = Date.now();

    try {
        const body = await req.json() as GradeRequest;

        const {
            studentInput,
            correctAnswer,
            questionId,
            topicId,
            userId,
            ignoreConstant = false,
            questionType = 'other',
            variables = ['x'],
            domain = 'real',
            confidenceRating,
            currentMastery = 0.1,
            timeTakenMs,
        } = body;

        if (!studentInput || !correctAnswer) {
            return NextResponse.json({ error: 'Missing studentInput or correctAnswer' }, { status: 400 });
        }

        // ── Cache lookup ────────────────────────────────────────────────
        const cacheKey = await hashKey({ studentInput, correctAnswer, ignoreConstant, variables, domain });
        const cached = CACHE.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
            // Still write telemetry even on cache hit (different user / attempt)
            writeTelemetry({
                userId, questionId, topicId, isCorrect: cached.response.isCorrect,
                studentInput, feedbackCode: cached.response.feedback?.code,
                partialScore: cached.response.partialScore, confidenceRating,
                timeTakenMs: timeTakenMs ?? (Date.now() - startMs),
                symbolicallyChecked: cached.response.symbolicallyChecked,
                currentMastery,
            });
            return NextResponse.json({ ...cached.response, cached: true });
        }

        // ── Grade the answer ────────────────────────────────────────────
        const grade = await gradeAnswer(studentInput, correctAnswer, {
            ignoreConstant,
            variables,
            domain,
        });

        // ── Run feedback tree if wrong ──────────────────────────────────
        const feedback = grade.isCorrect
            ? null
            : await runFeedbackTree(studentInput, correctAnswer, { questionType, topicId });

        // ── BKT mastery update ──────────────────────────────────────────
        let newMastery: number | undefined;
        let isMastered: boolean | undefined;
        if (topicId) {
            newMastery = bkt.updateMastery(currentMastery, grade.isCorrect);
            isMastered = bkt.isMastered(newMastery, 0.85);
        }

        const response: GradeResponse = {
            isCorrect: grade.isCorrect,
            partialScore: grade.partialScore,
            parsedStudent: grade.parsedStudent,
            symbolicallyChecked: grade.symbolicallyChecked,
            feedback: feedback
                ? {
                    code: feedback.code,
                    message: feedback.message,
                    hint: feedback.hint,
                    remediationTopicSlug: feedback.remediationTopicSlug,
                }
                : null,
            newMastery,
            isMastered,
        };

        // ── Cache store ─────────────────────────────────────────────────
        CACHE.set(cacheKey, { response, expiresAt: Date.now() + CACHE_TTL_MS });

        // ── Telemetry (non-blocking) ─────────────────────────────────────
        writeTelemetry({
            userId, questionId, topicId, isCorrect: grade.isCorrect,
            studentInput, feedbackCode: feedback?.code,
            partialScore: grade.partialScore, confidenceRating,
            timeTakenMs: timeTakenMs ?? (Date.now() - startMs),
            symbolicallyChecked: grade.symbolicallyChecked,
            currentMastery,
        });

        return NextResponse.json(response);

    } catch (err) {
        console.error('[grade-math]', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// ── Telemetry writer (fire-and-forget, non-blocking) ──────────────────────────

interface TelemetryPayload {
    userId?: string;
    questionId?: string;
    topicId?: string;
    isCorrect: boolean;
    studentInput: string;
    feedbackCode?: string;
    partialScore: number;
    confidenceRating?: number;
    timeTakenMs?: number;
    symbolicallyChecked: boolean;
    currentMastery: number;
}

function writeTelemetry(payload: TelemetryPayload): void {
    // Deliberately not awaited — best-effort telemetry
    (async () => {
        try {
            if (!payload.questionId && !payload.userId) return; // anonymous attempt, skip

            const userId = payload.userId ?? 'anonymous';

            await db.insert(attemptLogs).values({
                userId,
                questionId: payload.questionId ?? null,
                isCorrect: payload.isCorrect,
                timeTakenMs: payload.timeTakenMs ?? null,
                studentAnswerRaw: payload.studentInput,
                feedbackCode: payload.feedbackCode ?? null,
                partialScore: payload.partialScore,
                confidenceRating: payload.confidenceRating ?? null,
                symbolicallyChecked: payload.symbolicallyChecked,
            });
        } catch (e) {
            // Telemetry failure must never break the grading response
            console.warn('[grade-math telemetry]', e);
        }
    })();
}
