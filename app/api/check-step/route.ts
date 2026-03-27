import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { questionSteps, userMastery } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { preParseInput } from '@/lib/math/pre-parser';
import { gradeAnswer } from '@/lib/math/cas-grader';
import { runFeedbackTree } from '@/lib/math/feedback-tree';
import { BayesianKnowledgeTracing } from '@/lib/adaptive-engine/knowledge-tracing';
import { getRevealedSteps } from '@/lib/math/fade-logic';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
    // 1. Auth
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // 2. Rate limit
    const { allowed, remaining } = checkRateLimit(userId);
    if (!allowed) {
        return NextResponse.json(
            { error: 'För många förfrågningar. Vänta en stund.' },
            { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
        );
    }

    // 3. Parse body
    const body = await req.json();
    const { stepId, questionId, topicId, studentInput } = body;

    // G. Type coercion guard — ensure all fields are non-empty strings
    if (
        typeof stepId !== 'string' || !stepId.trim() ||
        typeof questionId !== 'string' || !questionId.trim() ||
        typeof topicId !== 'string' || !topicId.trim() ||
        typeof studentInput !== 'string' || !studentInput.trim()
    ) {
        return NextResponse.json({ error: 'Missing or invalid required fields' }, { status: 400 });
    }

    // F. Input length guard — prevent oversized payloads from reaching the CAS grader
    if (studentInput.length > 1000) {
        return NextResponse.json({ error: 'Inmatningen är för lång (max 1000 tecken).' }, { status: 400 });
    }

    // 4. Fetch correctAnswer from DB (never from client)
    const step = await db.select().from(questionSteps).where(eq(questionSteps.id, stepId)).get();
    if (!step || step.questionId !== questionId) {
        return NextResponse.json({ error: 'Step not found' }, { status: 404 });
    }

    // 5. CAS grading pipeline
    const parsed = preParseInput(studentInput);
    const gradeResult = await gradeAnswer(parsed, step.correctAnswer);
    const { isCorrect } = gradeResult;

    // 6. Feedback if wrong
    let feedback: string | undefined;
    if (!isCorrect) {
        const result = await runFeedbackTree(studentInput, step.correctAnswer, {
            questionType: (step.questionType as any) ?? 'algebra',
        });
        feedback = result?.message;
    }

    // 7. BKT update
    const bkt = new BayesianKnowledgeTracing();
    const existingMastery = await db.select()
        .from(userMastery)
        .where(and(eq(userMastery.userId, userId), eq(userMastery.topicId, topicId)))
        .get();
    const currentMastery = existingMastery?.masteryProbability ?? 0.1;
    const newMastery = bkt.updateMastery(currentMastery, isCorrect);

    // 8. Upsert mastery
    if (existingMastery) {
        await db.update(userMastery)
            .set({ masteryProbability: newMastery, lastPracticedAt: new Date() })
            .where(and(eq(userMastery.userId, userId), eq(userMastery.topicId, topicId)));
    } else {
        await db.insert(userMastery).values({
            userId,
            topicId,
            masteryProbability: newMastery,
            lastPracticedAt: new Date(),
        });
    }

    // 9. Recompute revealed steps (strip correctAnswer — never sent to client)
    const allSteps = await db.select({
        id: questionSteps.id,
        stepNumber: questionSteps.stepNumber,
        instruction: questionSteps.instruction,
        displayLatex: questionSteps.displayLatex,
        hint: questionSteps.hint,
        questionType: questionSteps.questionType,
    }).from(questionSteps).where(eq(questionSteps.questionId, questionId));

    const sorted = allSteps.sort((a, b) => a.stepNumber - b.stepNumber);
    const revealedSteps = getRevealedSteps(sorted, newMastery);

    return NextResponse.json({
        isCorrect,
        parsedStudent: parsed,
        feedback,
        newMastery,
        revealedSteps,
        allStepsComplete: false, // caller tracks this
    }, { headers: { 'X-RateLimit-Remaining': String(remaining) } });
}
