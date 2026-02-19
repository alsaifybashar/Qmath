'use server';

import { db } from '@/db/drizzle';
import { diagnosticResults, diagnosticItemResponses, profiles, curriculumStandards } from '@/db/schema';
import { auth } from '@/auth';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

// ============================================================================
// TYPES
// ============================================================================

export interface DiagnosticQuestion {
    id: string;
    curriculumStandardCode: string;
    topicArea: string;
    question: string;
    questionType: 'numeric' | 'multiple_choice';
    correctAnswer: string;
    options?: string[];
    difficulty: number;          // 1-10
    prerequisiteLevel: string;   // gy_1c, gy_2c, gy_3c, etc.
}

export interface DiagnosticResponse {
    questionId: string;
    curriculumStandardCode: string;
    studentAnswer: string;
    isCorrect: boolean;
    timeTakenMs: number;
    confidence: number;          // 1-5
}

export interface DiagnosticGap {
    standardCode: string;
    standardTitle: string;
    level: string;
    category: string;
    score: number;               // 0-1
    status: 'strong' | 'moderate' | 'weak' | 'critical';
}

// ============================================================================
// SCREENING QUESTIONS — 10 critical prerequisite questions
// These cover the areas research identifies as primary blockers:
//   - Algebraic manipulation (fractions, exponents, sign rules)
//   - Basic function understanding
//   - Elementary trigonometry
//   - Equation solving
// ============================================================================

const SCREENING_QUESTIONS: DiagnosticQuestion[] = [
    {
        id: 'diag_01',
        curriculumStandardCode: 'MA_2C_ALG',
        topicArea: 'Algebra',
        question: 'Förenkla: \\frac{2x}{3} + \\frac{x}{6}',
        questionType: 'multiple_choice',
        correctAnswer: '\\frac{5x}{6}',
        options: ['\\frac{5x}{6}', '\\frac{3x}{9}', '\\frac{2x}{6}', '\\frac{x}{2}'],
        difficulty: 3,
        prerequisiteLevel: 'gy_2c',
    },
    {
        id: 'diag_02',
        curriculumStandardCode: 'MA_1C_NUM',
        topicArea: 'Aritmetik',
        question: 'Beräkna: (-3)^2 - (-2)^3',
        questionType: 'numeric',
        correctAnswer: '17',
        difficulty: 2,
        prerequisiteLevel: 'gy_1c',
    },
    {
        id: 'diag_03',
        curriculumStandardCode: 'MA_2C_ALG',
        topicArea: 'Algebra',
        question: 'Utveckla: (2x - 3)^2',
        questionType: 'multiple_choice',
        correctAnswer: '4x^2 - 12x + 9',
        options: ['4x^2 - 12x + 9', '4x^2 + 9', '4x^2 - 6x + 9', '2x^2 - 12x + 9'],
        difficulty: 4,
        prerequisiteLevel: 'gy_2c',
    },
    {
        id: 'diag_04',
        curriculumStandardCode: 'MA_2C_EQ',
        topicArea: 'Ekvationer',
        question: 'Lös ekvationen: 2x^2 - 8 = 0. Ange det positiva svaret.',
        questionType: 'numeric',
        correctAnswer: '2',
        difficulty: 3,
        prerequisiteLevel: 'gy_2c',
    },
    {
        id: 'diag_05',
        curriculumStandardCode: 'MA_3C_TRIG',
        topicArea: 'Trigonometri',
        question: 'Vad är \\sin(\\pi/6)?',
        questionType: 'multiple_choice',
        correctAnswer: '1/2',
        options: ['1/2', '\\sqrt{3}/2', '\\sqrt{2}/2', '1'],
        difficulty: 3,
        prerequisiteLevel: 'gy_3c',
    },
    {
        id: 'diag_06',
        curriculumStandardCode: 'MA_3C_FUNC',
        topicArea: 'Funktioner',
        question: 'Om f(x) = x^2 + 3x, vad är f(-2)?',
        questionType: 'numeric',
        correctAnswer: '-2',
        difficulty: 2,
        prerequisiteLevel: 'gy_3c',
    },
    {
        id: 'diag_07',
        curriculumStandardCode: 'MA_3C_LOG',
        topicArea: 'Logaritmer',
        question: 'Förenkla: \\ln(e^3)',
        questionType: 'numeric',
        correctAnswer: '3',
        difficulty: 2,
        prerequisiteLevel: 'gy_3c',
    },
    {
        id: 'diag_08',
        curriculumStandardCode: 'MA_2C_ALG',
        topicArea: 'Algebra',
        question: 'Förenkla: \\frac{x^2 - 4}{x + 2}',
        questionType: 'multiple_choice',
        correctAnswer: 'x - 2',
        options: ['x - 2', 'x + 2', 'x^2 - 2', '\\frac{x-4}{2}'],
        difficulty: 4,
        prerequisiteLevel: 'gy_2c',
    },
    {
        id: 'diag_09',
        curriculumStandardCode: 'MA_4_DERIV',
        topicArea: 'Derivata',
        question: 'Vad är derivatan av f(x) = 3x^2 + 2x - 1?',
        questionType: 'multiple_choice',
        correctAnswer: '6x + 2',
        options: ['6x + 2', '3x + 2', '6x^2 + 2', '6x - 1'],
        difficulty: 3,
        prerequisiteLevel: 'gy_4',
    },
    {
        id: 'diag_10',
        curriculumStandardCode: 'MA_2C_INEQ',
        topicArea: 'Olikheter',
        question: 'Lös olikheten: 2x - 6 > 0. Vad är den minsta heltalslösningen?',
        questionType: 'numeric',
        correctAnswer: '4',
        difficulty: 3,
        prerequisiteLevel: 'gy_2c',
    },
];

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Get the screening questions for the diagnostic test.
 * Returns the fixed set of 10 prerequisite screening questions.
 */
export async function getScreeningQuestions(): Promise<{ data: DiagnosticQuestion[] }> {
    return { data: SCREENING_QUESTIONS };
}

/**
 * Submit the diagnostic screening results.
 * Scores responses, identifies gaps, and stores results in the database.
 */
export async function submitDiagnosticScreening(responses: DiagnosticResponse[]) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Not authenticated' };

    try {
        // Score the responses
        const totalCorrect = responses.filter(r => r.isCorrect).length;
        const screeningScore = totalCorrect / responses.length;

        // Group by curriculum standard and calculate per-area scores
        const areaScores: Record<string, { correct: number; total: number; level: string }> = {};
        for (const response of responses) {
            const question = SCREENING_QUESTIONS.find(q => q.id === response.questionId);
            if (!question) continue;

            const code = response.curriculumStandardCode;
            if (!areaScores[code]) {
                areaScores[code] = { correct: 0, total: 0, level: question.prerequisiteLevel };
            }
            areaScores[code].total++;
            if (response.isCorrect) areaScores[code].correct++;
        }

        // Identify gaps: areas where score < 0.5
        const gaps: DiagnosticGap[] = [];
        for (const [code, data] of Object.entries(areaScores)) {
            const score = data.correct / data.total;
            let status: DiagnosticGap['status'] = 'strong';
            if (score < 0.25) status = 'critical';
            else if (score < 0.5) status = 'weak';
            else if (score < 0.75) status = 'moderate';

            // Look up the standard title
            const question = SCREENING_QUESTIONS.find(q => q.curriculumStandardCode === code);
            gaps.push({
                standardCode: code,
                standardTitle: question?.topicArea || code,
                level: data.level,
                category: question?.topicArea || 'Unknown',
                score,
                status,
            });
        }

        // Determine if learning path remediation is needed
        const weakGaps = gaps.filter(g => g.status === 'weak' || g.status === 'critical');
        const needsRemediation = weakGaps.length > 0;

        // Store diagnostic result
        const [diagnosticResult] = await db.insert(diagnosticResults).values({
            userId: session.user.id,
            diagnosticType: 'screening',
            screeningScore,
            detailedResults: gaps as unknown as Record<string, unknown>,
            gapsIdentified: weakGaps.map(g => g.standardCode) as unknown as string[],
            learningPathGenerated: needsRemediation,
        }).returning();

        // Store individual responses
        if (diagnosticResult) {
            await db.insert(diagnosticItemResponses).values(
                responses.map(r => ({
                    diagnosticResultId: diagnosticResult.id,
                    questionId: r.questionId,
                    curriculumStandardId: r.curriculumStandardCode,
                    isCorrect: r.isCorrect,
                    timeTakenMs: r.timeTakenMs,
                    confidence: r.confidence,
                    studentAnswer: r.studentAnswer,
                }))
            );
        }

        return {
            data: {
                score: screeningScore,
                totalCorrect,
                totalQuestions: responses.length,
                gaps,
                needsRemediation,
                diagnosticResultId: diagnosticResult?.id,
            },
        };
    } catch (error) {
        console.error('Failed to submit diagnostic:', error);
        return { error: 'Failed to process diagnostic results' };
    }
}

/**
 * Save the math anxiety level from the onboarding screening.
 * Called after the diagnostic when the anxiety questionnaire is shown.
 */
export async function saveAnxietyScreening(anxietyLevel: number, selfEfficacy: number) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Not authenticated' };

    try {
        await db.update(profiles).set({
            mathAnxietyLevel: Math.max(1, Math.min(5, anxietyLevel)),
            selfEfficacyScore: Math.max(1, Math.min(5, selfEfficacy)),
        }).where(eq(profiles.id, session.user.id));

        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Failed to save anxiety screening:', error);
        return { error: 'Failed to save screening results' };
    }
}

/**
 * Complete the onboarding diagnostic flow and redirect to dashboard.
 */
export async function completeDiagnosticOnboarding() {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Not authenticated' };

    revalidatePath('/dashboard');
    redirect('/onboarding/complete');
}
