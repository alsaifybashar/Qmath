'use server';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { eq, and, inArray } from 'drizzle-orm';
import { userTopicMastery, questionAttempts } from '@/db/dashboard-schema';
import { courses, topics, questions } from '@/db/schema';
import { enrollments } from '@/db/schema';

// ============ TYPES ============

export interface ExamSimConfig {
    courseId: string;
    duration: number; // minutes (60, 90, 120, 180)
    questionCount: number; // 15, 25, 40
    difficulty: 'adaptive' | 'easy' | 'medium' | 'hard';
    focusWeakTopics: boolean; // Over-sample weak topics
}

export interface SimQuestion {
    id: string;
    topicId: string;
    topicName: string;
    questionText: string;
    questionMath?: string;
    correctAnswer: string;
    difficulty: number; // 1-5
    points: number;
    questionType: string;
}

export interface ExamSimulation {
    id: string;
    courseId: string;
    courseName: string;
    courseCode: string;
    questions: SimQuestion[];
    totalPoints: number;
    duration: number; // minutes
    createdAt: Date;
}

export interface SimAnswer {
    questionId: string;
    answer: string;
    timeTakenMs: number;
    flagged: boolean; // student flagged it for review
}

export interface ExamResult {
    simulationId: string;
    courseName: string;
    courseCode: string;
    totalPoints: number;
    earnedPoints: number;
    percentage: number;
    estimatedGrade: string;
    duration: number; // actual time taken in minutes
    questionResults: QuestionResult[];
    topicPerformance: TopicPerformance[];
    insights: string[];
    improvements: string[];
}

export interface QuestionResult {
    questionId: string;
    topicName: string;
    isCorrect: boolean;
    studentAnswer: string;
    correctAnswer: string;
    points: number;
    earnedPoints: number;
    timeTakenMs: number;
    difficulty: number;
}

export interface TopicPerformance {
    topicId: string;
    topicName: string;
    questionsAttempted: number;
    questionsCorrect: number;
    accuracy: number;
    avgTimeMs: number;
    mastery: number; // current mastery level
}

// ============ SIMULATION GENERATION ============

/**
 * Generate an exam simulation.
 * Zero AI cost — pure database queries + algorithmic selection.
 */
export async function generateExamSimulation(config: ExamSimConfig): Promise<ExamSimulation | { error: string }> {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Not authenticated' };

    const userId = session.user.id;

    // 1. Verify enrollment
    const [course] = await db.select()
        .from(courses)
        .where(eq(courses.id, config.courseId))
        .limit(1);

    if (!course) return { error: 'Course not found' };

    // 2. Get all topics + questions for this course
    const courseTopics = await db.select().from(topics).where(eq(topics.courseId, config.courseId));
    if (courseTopics.length === 0) return { error: 'No topics found for this course' };

    const topicIds = courseTopics.map(t => t.id);

    const courseQuestions = await db.select().from(questions)
        .where(and(
            inArray(questions.topicId, topicIds),
            eq(questions.isPublished, true)
        ));

    if (courseQuestions.length < 5) return { error: 'Not enough questions available for a simulation' };

    // 3. Get mastery data for adaptive selection
    const mastery = await db.select().from(userTopicMastery)
        .where(and(
            eq(userTopicMastery.userId, userId),
            inArray(userTopicMastery.topicId, topicIds),
        ));

    // 4. Select questions intelligently
    const selectedQuestions = selectQuestions(
        courseQuestions,
        courseTopics,
        mastery,
        config,
    );

    // 5. Calculate points
    const totalPoints = selectedQuestions.reduce((sum, q) => sum + q.points, 0);

    const simId = `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    return {
        id: simId,
        courseId: config.courseId,
        courseName: course.name,
        courseCode: course.code || 'N/A',
        questions: selectedQuestions,
        totalPoints,
        duration: config.duration,
        createdAt: new Date(),
    };
}

// ============ EXAM BREAKDOWN ============

/**
 * Generate a post-exam breakdown.
 * Zero AI cost — pure computation from answers.
 */
export async function generateExamBreakdown(
    simulation: ExamSimulation,
    answers: SimAnswer[],
    totalTimeTakenMs: number,
): Promise<ExamResult> {
    // Grade each question
    const questionResults: QuestionResult[] = simulation.questions.map(q => {
        const answer = answers.find(a => a.questionId === q.id);
        const studentAnswer = answer?.answer?.trim() || '';
        const isCorrect = studentAnswer.toLowerCase() === q.correctAnswer.toLowerCase().trim();

        return {
            questionId: q.id,
            topicName: q.topicName,
            isCorrect,
            studentAnswer,
            correctAnswer: q.correctAnswer,
            points: q.points,
            earnedPoints: isCorrect ? q.points : 0,
            timeTakenMs: answer?.timeTakenMs || 0,
            difficulty: q.difficulty,
        };
    });

    // Topic performance
    const topicGroups = new Map<string, QuestionResult[]>();
    questionResults.forEach(qr => {
        const existing = topicGroups.get(qr.topicName) || [];
        existing.push(qr);
        topicGroups.set(qr.topicName, existing);
    });

    const topicPerformance: TopicPerformance[] = Array.from(topicGroups.entries()).map(([topicName, results]) => {
        const correct = results.filter(r => r.isCorrect).length;
        const q = simulation.questions.find(q => q.topicName === topicName);
        return {
            topicId: q?.topicId || '',
            topicName,
            questionsAttempted: results.length,
            questionsCorrect: correct,
            accuracy: results.length > 0 ? correct / results.length : 0,
            avgTimeMs: results.length > 0
                ? results.reduce((sum, r) => sum + r.timeTakenMs, 0) / results.length
                : 0,
            mastery: 0, // Populated separately if needed
        };
    });

    // Calculate overall score
    const earnedPoints = questionResults.reduce((sum, qr) => sum + qr.earnedPoints, 0);
    const percentage = simulation.totalPoints > 0
        ? Math.round((earnedPoints / simulation.totalPoints) * 100)
        : 0;

    const estimatedGrade = estimateGrade(percentage);

    // Generate insights (zero AI cost)
    const insights = generateInsights(questionResults, topicPerformance, totalTimeTakenMs, simulation.duration);
    const improvements = generateImprovements(topicPerformance, questionResults);

    return {
        simulationId: simulation.id,
        courseName: simulation.courseName,
        courseCode: simulation.courseCode,
        totalPoints: simulation.totalPoints,
        earnedPoints,
        percentage,
        estimatedGrade,
        duration: Math.round(totalTimeTakenMs / 60000),
        questionResults,
        topicPerformance: topicPerformance.sort((a, b) => a.accuracy - b.accuracy),
        insights,
        improvements,
    };
}

// ============ HELPERS ============

function selectQuestions(
    allQuestions: any[],
    allTopics: any[],
    mastery: any[],
    config: ExamSimConfig,
): SimQuestion[] {
    const targetCount = Math.min(config.questionCount, allQuestions.length);
    const topicMap = new Map(allTopics.map(t => [t.id, t]));
    const masteryMap = new Map(mastery.map(m => [m.topicId, (m.masteryLevel || 0) / 5]));

    // Shuffle questions
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);

    // Score each question for selection priority
    const scored = shuffled.map(q => {
        const topic = topicMap.get(q.topicId);
        const topicMastery = masteryMap.get(q.topicId) || 0;
        const diff = q.difficultyTier || 1;

        let score = Math.random(); // Base randomness

        // Adaptive difficulty
        if (config.difficulty === 'adaptive') {
            // Prefer questions matching student's mastery level
            const idealDiff = Math.round(topicMastery * 5);
            score += 1 - Math.abs(diff - idealDiff) / 5;
        } else if (config.difficulty === 'hard') {
            score += diff / 5;
        } else if (config.difficulty === 'easy') {
            score += (5 - diff) / 5;
        }

        // Focus weak topics
        if (config.focusWeakTopics && topicMastery < 0.5) {
            score += 2; // Strong bias toward weak topics
        }

        return {
            question: q,
            topic,
            score,
        };
    });

    // Sort by score and pick top N, ensure topic diversity
    scored.sort((a, b) => b.score - a.score);

    const selected: SimQuestion[] = [];
    const topicCounts = new Map<string, number>();
    const maxPerTopic = Math.max(2, Math.ceil(targetCount / allTopics.length) + 1);

    for (const item of scored) {
        if (selected.length >= targetCount) break;

        const currentCount = topicCounts.get(item.question.topicId) || 0;
        if (currentCount >= maxPerTopic) continue; // Ensure diversity

        const content = typeof item.question.content === 'string'
            ? JSON.parse(item.question.content || '{}')
            : (item.question.content || {});

        selected.push({
            id: item.question.id,
            topicId: item.question.topicId,
            topicName: item.topic?.title || 'Unknown Topic',
            questionText: content?.question?.text || item.question.questionStem || 'Question text unavailable',
            questionMath: content?.question?.math,
            correctAnswer: item.question.correctAnswer || '',
            difficulty: item.question.difficultyTier || 1,
            points: getPointsForDifficulty(item.question.difficultyTier || 1),
            questionType: item.question.answerType || 'numeric',
        });

        topicCounts.set(item.question.topicId, currentCount + 1);
    }

    return selected;
}

function getPointsForDifficulty(diff: number): number {
    const pointMap: Record<number, number> = { 1: 2, 2: 3, 3: 5, 4: 7, 5: 10 };
    return pointMap[diff] || 3;
}

function estimateGrade(percentage: number): string {
    if (percentage >= 90) return 'A';
    if (percentage >= 85) return 'A-';
    if (percentage >= 80) return 'B+';
    if (percentage >= 75) return 'B';
    if (percentage >= 70) return 'B-';
    if (percentage >= 65) return 'C+';
    if (percentage >= 60) return 'C';
    if (percentage >= 55) return 'C-';
    if (percentage >= 50) return 'D';
    return 'F';
}

function generateInsights(
    results: QuestionResult[],
    topicPerf: TopicPerformance[],
    totalTimeMs: number,
    budgetMinutes: number,
): string[] {
    const insights: string[] = [];

    const totalCorrect = results.filter(r => r.isCorrect).length;
    const pct = Math.round((totalCorrect / results.length) * 100);
    insights.push(`You got ${totalCorrect}/${results.length} questions correct (${pct}%).`);

    // Time management
    const actualMinutes = Math.round(totalTimeMs / 60000);
    if (actualMinutes < budgetMinutes * 0.7) {
        insights.push(`You finished ${budgetMinutes - actualMinutes} minutes early. Consider using remaining time to double-check your work.`);
    } else if (actualMinutes > budgetMinutes) {
        insights.push(`You went over time by ${actualMinutes - budgetMinutes} minutes. Practice time management to stay within the exam window.`);
    }

    // Difficulty analysis
    const hardQuestions = results.filter(r => r.difficulty >= 4);
    const hardCorrect = hardQuestions.filter(r => r.isCorrect).length;
    if (hardQuestions.length > 0) {
        insights.push(`On hard questions (difficulty 4-5): ${hardCorrect}/${hardQuestions.length} correct.`);
    }

    // Weakest topic
    const weakest = topicPerf.find(t => t.accuracy < 0.5 && t.questionsAttempted >= 2);
    if (weakest) {
        insights.push(`Your weakest area was "${weakest.topicName}" (${Math.round(weakest.accuracy * 100)}% accuracy). Focus your review here.`);
    }

    return insights;
}

function generateImprovements(topicPerf: TopicPerformance[], results: QuestionResult[]): string[] {
    const improvements: string[] = [];

    // Topics below 50% accuracy
    const weakTopics = topicPerf.filter(t => t.accuracy < 0.5 && t.questionsAttempted >= 2);
    weakTopics.forEach(t => {
        improvements.push(`Review "${t.topicName}" — you got ${t.questionsCorrect}/${t.questionsAttempted} correct.`);
    });

    // Slow questions
    const avgTime = results.reduce((sum, r) => sum + r.timeTakenMs, 0) / results.length;
    const slowQuestions = results.filter(r => r.timeTakenMs > avgTime * 2);
    if (slowQuestions.length > 0) {
        improvements.push(`${slowQuestions.length} questions took more than twice your average time. Practice speed on similar problems.`);
    }

    // Easy questions missed
    const easyMissed = results.filter(r => r.difficulty <= 2 && !r.isCorrect);
    if (easyMissed.length > 0) {
        improvements.push(`You missed ${easyMissed.length} easy question${easyMissed.length > 1 ? 's' : ''}. These are free points — double-check your work on simpler problems.`);
    }

    if (improvements.length === 0) {
        improvements.push('Great work! Keep practicing to maintain your performance.');
    }

    return improvements;
}
