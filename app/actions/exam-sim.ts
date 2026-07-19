'use server';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { eq, and, inArray } from 'drizzle-orm';
import { userTopicMastery, questionAttempts } from '@/db/dashboard-schema';
import { courses, topics, questions } from '@/db/schema';
import { enrollments } from '@/db/schema';
import { logAIRequest } from '@/lib/ai-logger';
import {
    anthropicModel,
    createAnthropicClient,
    isAnthropicConfigured,
} from '@/lib/ai/anthropic-client';

// ============ TYPES ============

export interface ExamSimConfig {
    courseId: string;
    duration: number; // minutes (60, 90, 120, 180)
    questionCount: number; // 15, 25, 40
    difficulty: 'adaptive' | 'easy' | 'medium' | 'hard';
    focusWeakTopics: boolean; // Over-sample weak topics
    aiMode?: boolean;         // Use AI to generate novel questions
    topicId?: string;         // 'all' or specific topic id
    pointsPerQuestion?: number | 'mix'; // Points setting
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
        courseName: course.name || 'Unknown',
        courseCode: course.code || 'N/A',
        questions: selectedQuestions,
        totalPoints,
        duration: config.duration,
        createdAt: new Date(),
    };
}

import { getExamAnalysis } from './exam-analysis';
import { callOllama } from '@/lib/ollama';

/**
 * Generate a novel exam simulation using AI (based on past exam analysis).
 */
export async function generateAIExamSimulation(config: ExamSimConfig): Promise<ExamSimulation | { error: string }> {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Not authenticated' };

    const [course] = await db.select()
        .from(courses)
        .where(eq(courses.id, config.courseId))
        .limit(1);

    if (!course) return { error: 'Course not found' };

    // Get exam analysis to inform AI
    const analysis = await getExamAnalysis(config.courseId);
    if ('error' in analysis) return { error: 'Exam analysis unavailable for this course.' };

    const topicMap = analysis.examTopicMap;
    const selectedTopic = config.topicId && config.topicId !== 'all' 
        ? topicMap.find(t => t.topicId === config.topicId) 
        : null;

    const topicPrompt = selectedTopic 
        ? `Focus EXCLUSIVELY on the topic: "${selectedTopic.topicName}". Context: ${selectedTopic.description}`
        : `Include a balanced mix of these topics: ${topicMap.map(t => t.topicName).join(', ')}.`;

    const pointsPrompt = config.pointsPerQuestion && config.pointsPerQuestion !== 'mix'
        ? `Make every question worth exactly ${config.pointsPerQuestion} points.`
        : `Assign appropriate points (1-10) based on question difficulty.`;

    const useAnthropic = isAnthropicConfigured();
    const simQuestions: SimQuestion[] = [];
    const chunkSize = 3;
    const totalNeeded = config.questionCount;

    for (let i = 0; i < totalNeeded; i += chunkSize) {
        const amountToGenerate = Math.min(chunkSize, totalNeeded - i);
        const batchPrompt = `You are an expert Math Professor creating an exam for a university course: ${course.name} (${course.code}).
Your task is to generate EXACTLY ${amountToGenerate} novel, original exam questions based on the course syllabus and past exam structures.

Requirements:
- Difficulty Level: ${config.difficulty}
- ${topicPrompt}
- ${pointsPrompt}

Return ONLY raw JSON in exactly this format (no markdown, no backticks, no explanatory text):
{
  "questions": [
    {
      "topicName": "topic name from the list",
      "questionText": "The text of the question. Include inline LaTeX using $$ or \\\\( \\\\)",
      "correctAnswer": "The exact expected final numerical or algebraic answer (e.g., '4', 'x^2+2x', 'pi/2')",
      "difficulty": 1-5,
      "points": number
    }
  ]
}`;

        let questionsJson = '';
        try {
            if (!useAnthropic) {
                questionsJson = await callOllama({
                    messages: [
                        { role: 'system', content: 'You are a precise JSON-generating math tutor AI.' },
                        { role: 'user', content: batchPrompt + '\n\nPlease output ONLY valid JSON. Make sure you close all arrays and objects. No conversational text.' }
                    ],
                    maxTokens: 4000,
                    timeoutMs: 120_000,
                    temperature: 0.7,
                });
            } else {
                const anthropic = createAnthropicClient();
                const _examSimStart = Date.now();
                const message = await anthropic.messages.create({
                    model: anthropicModel('claude-3-5-sonnet-20241022'),
                    max_tokens: 2000,
                    temperature: 0.7,
                    system: 'You are a precise JSON-generating math tutor AI. Return ONLY JSON without markdown.',
                    messages: [{ role: 'user', content: batchPrompt }]
                });
                void logAIRequest({
                    provider: 'anthropic',
                    model: 'claude-3-5-sonnet-20241022',
                    requestType: 'exam_sim_questions',
                    promptTokens: message.usage.input_tokens,
                    completionTokens: message.usage.output_tokens,
                    latencyMs: Date.now() - _examSimStart,
                    success: true,
                });
                questionsJson = message.content[0].type === 'text' ? message.content[0].text : '';
            }

            if (!questionsJson || questionsJson.trim() === '') {
                throw new Error('AI returned an empty response.');
            }

            let cleaned = questionsJson.trim();
            if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json/i, '').replace(/```$/, '').trim();
            else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();

            const start = cleaned.indexOf('{');
            const end = cleaned.lastIndexOf('}');
            if (start !== -1 && end !== -1) {
                cleaned = cleaned.substring(start, end + 1);
            }

            let parsed: any;
            try {
                parsed = JSON.parse(cleaned);
            } catch (e: any) {
                try {
                    parsed = JSON.parse(cleaned + ']}');
                } catch (e2) {
                    try {
                        parsed = JSON.parse(cleaned + '}');
                    } catch (e3) {
                        console.error('Raw AI Output:', questionsJson);
                        throw new Error('AI returned malformed JSON.');
                    }
                }
            }

            if (!parsed.questions || !Array.isArray(parsed.questions)) {
                throw new Error('Invalid JSON structure returned by AI (missing questions array)');
            }

            parsed.questions.forEach((q: any, j: number) => {
                simQuestions.push({
                    id: `ai_q_${Date.now()}_${i}_${j}`,
                    topicId: selectedTopic ? selectedTopic.topicId : 'ai_generated',
                    topicName: q.topicName || (selectedTopic ? selectedTopic.topicName : 'Mixed Topics'),
                    questionText: q.questionText || 'Generated question',
                    correctAnswer: q.correctAnswer || '',
                    difficulty: q.difficulty || (config.difficulty === 'hard' ? 4 : config.difficulty === 'easy' ? 2 : 3),
                    points: q.points || 3,
                    questionType: 'numeric',
                });
            });

            console.log(`[AI Exam Gen] Generated ${simQuestions.length}/${totalNeeded} questions...`);

        } catch (e: any) {
            console.error('AI Exam Gen Error in chunk:', e.message || e);
            if (simQuestions.length === 0) {
                return { error: 'Misslyckades att generera tenta via AI. Försök igen.' };
            }
            console.log(`[AI Exam Gen] Stopped early due to error. Returning ${simQuestions.length} questions already processed.`);
            break;
        }
    }

    const totalPoints = simQuestions.reduce((sum, q) => sum + q.points, 0);
    const simId = `sim_ai_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        return {
            id: simId,
            courseId: config.courseId,
            courseName: course.name || 'Unknown',
            courseCode: course.code || 'N/A',
            questions: simQuestions,
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
