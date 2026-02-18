'use server';

import { db } from '@/db/drizzle';
import { auth } from '@/auth';
import { courses, exams, enrollments } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { generateExamAnalysis, type AIExamAnalysisResult, type AIExamSection } from '@/app/actions/ai';

// ============================================================================
// TYPES
// ============================================================================

/** One section of the exam (e.g. Del A, Del B, Section I…) */
export interface ExamSection {
    id: string;             // 'A' | 'A1' | 'A2' | 'B' | 'C' | 'I' | 'II' …
    label: string;          // "Del A – Differentialkalkyl"
    shortLabel: string;     // "Del A"
    description: string;    // "Kortsvarsuppgifter, uppgift 1–2"
    taskRange: string;      // "Uppgift 1–2"
    pointsPerTask: number;  // 3
    taskCount: number;      // 2
    maxPoints: number;      // 6
    passPoints: number;     // 4
    difficultyProfile: 'easy' | 'medium' | 'hard' | 'mixed';
    color: string;          // hex
    topicDomain?: string;
}

/** Grading threshold for a single grade level */
export interface GradeThreshold {
    grade: string;          // "3" | "4" | "5"
    label: string;          // "Godkänd"
    totalPoints: number;    // 8
    approvedTasks?: number;
    sectionRequirements: { sectionId: string; minPoints: number }[];
    color: string;
}

/** Course-level profile — derived from AI exam structure analysis */
export interface CourseProfile {
    courseCode: string;
    courseName: string;
    subject: string;
    examSections: ExamSection[];
    gradeThresholds: GradeThreshold[];
    maxTotalPoints: number;
    language: 'sv' | 'en';
    gradingInfo?: string;       // e.g. "Grade 3 ≥8p, Grade 4 ≥12p"
}

/**
 * Summary of what Claude found after reading the actual exam PDFs.
 * Always present (not null) — AI is the primary data source.
 */
export interface AIAnalysisSummary {
    strategy: string;
    examsAnalyzed: number;
    generatedAt: string;
    cached: boolean;
    examStructure: {
        sections: AIExamSection[];
        totalPoints: number;
        gradingInfo: string;
    };
}

/**
 * A single node in the Tentamenskarta — represents one AI-extracted topic
 * from the exam PDFs. No mastery or student progress data.
 */
export interface ExamTopicNode {
    topicId: string;            // slugified topic name
    topicName: string;          // display name from AI
    slug: string;               // URL-safe slug
    description: string;        // AI reasoning / explanation

    // Exam presence (from AI)
    frequency: number;          // 0–10 mapped from AI importance
    frequencyLabel: string;     // e.g. "8/10 tentor" (descriptive, from AI)
    examSections: string[];     // e.g. ["C"] — which exam section it appears in

    // Learning order (from AI)
    learningOrder: number;      // 1 = first to study
    phase: 'foundation' | 'core' | 'advanced';

    // AI analysis fields
    aiImportance: number;           // 1–10 importance score
    aiReasoning: string;            // Claude's explanation
    aiFocus: 'High' | 'Medium' | 'Low';
    aiDifficulty: 'easy' | 'medium' | 'hard';
    studyTips: string[];            // 2–3 actionable study tips from AI
    commonMistakes: string[];       // 2–3 common mistakes from AI

    // Derived
    priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface ExamAnalysisData {
    courseId: string;
    courseName: string;
    courseCode: string;

    courseProfile: CourseProfile;

    totalExamsAnalyzed: number;
    totalTopics: number;

    // Tentamenskarta nodes — from AI, primary data source
    examTopicMap: ExamTopicNode[];

    // AI analysis summary — always present
    aiAnalysis: AIAnalysisSummary;
}

// ============================================================================
// HELPERS
// ============================================================================

function slugify(name: string): string {
    return name
        .toLowerCase()
        .replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o')
        .replace(/é/g, 'e').replace(/è/g, 'e').replace(/ü/g, 'u')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

function importanceToPriority(importance: number): 'critical' | 'high' | 'medium' | 'low' {
    if (importance >= 8) return 'critical';
    if (importance >= 6) return 'high';
    if (importance >= 4) return 'medium';
    return 'low';
}

function sectionColor(index: number): string {
    const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];
    return colors[index % colors.length];
}

// ============================================================================
// COURSE PROFILE BUILDER FROM AI
// Converts AI-detected exam sections into a CourseProfile.
// Falls back to a generic 3-section layout if AI provided no sections.
// ============================================================================

function buildCourseProfileFromAI(
    courseCode: string,
    courseName: string,
    aiResult: AIExamAnalysisResult,
): CourseProfile {
    const { examStructure } = aiResult;

    // Build ExamSection[] from AI sections
    const examSections: ExamSection[] = examStructure.sections.length > 0
        ? examStructure.sections.map((s, idx) => ({
            id: s.id,
            label: `${s.label}${s.description ? ' – ' + s.description : ''}`,
            shortLabel: s.label,
            description: s.description,
            taskRange: `${s.taskCount} uppgift${s.taskCount !== 1 ? 'er' : ''}`,
            pointsPerTask: s.taskCount > 0 ? Math.round(s.points / s.taskCount) : s.points,
            taskCount: s.taskCount,
            maxPoints: s.points,
            passPoints: Math.round(s.points * 0.5),
            difficultyProfile: s.difficulty,
            color: sectionColor(idx),
        }))
        : [
            // Generic fallback sections
            {
                id: 'I', label: 'Del I – Grundläggande', shortLabel: 'Del I',
                description: 'Grundläggande teori och beräkningar',
                taskRange: 'Uppgift 1–4', pointsPerTask: 2, taskCount: 4,
                maxPoints: 8, passPoints: 4, difficultyProfile: 'easy', color: '#10B981',
            },
            {
                id: 'II', label: 'Del II – Tillämpning', shortLabel: 'Del II',
                description: 'Tillämpade problem och analys',
                taskRange: 'Uppgift 5–8', pointsPerTask: 2, taskCount: 4,
                maxPoints: 8, passPoints: 3, difficultyProfile: 'medium', color: '#3B82F6',
            },
            {
                id: 'III', label: 'Del III – Fördjupning', shortLabel: 'Del III',
                description: 'Avancerade uppgifter och bevis',
                taskRange: 'Uppgift 9–12', pointsPerTask: 2, taskCount: 4,
                maxPoints: 8, passPoints: 0, difficultyProfile: 'hard', color: '#8B5CF6',
            },
        ];

    const maxTotalPoints = examStructure.totalPoints > 0
        ? examStructure.totalPoints
        : examSections.reduce((s, sec) => s + sec.maxPoints, 0);

    // Build generic grade thresholds (3 / 4 / 5 system)
    const gradeThresholds: GradeThreshold[] = [
        {
            grade: '3', label: 'Godkänd',
            totalPoints: Math.round(maxTotalPoints * 0.45),
            color: '#F59E0B',
            sectionRequirements: examSections.slice(0, 1).map(s => ({ sectionId: s.id, minPoints: Math.round(s.maxPoints * 0.5) })),
        },
        {
            grade: '4', label: 'Väl godkänd',
            totalPoints: Math.round(maxTotalPoints * 0.65),
            color: '#3B82F6',
            sectionRequirements: examSections.slice(0, 2).map(s => ({ sectionId: s.id, minPoints: Math.round(s.maxPoints * 0.5) })),
        },
        {
            grade: '5', label: 'Mycket väl godkänd',
            totalPoints: Math.round(maxTotalPoints * 0.85),
            color: '#10B981',
            sectionRequirements: examSections.map(s => ({ sectionId: s.id, minPoints: Math.round(s.maxPoints * 0.6) })),
        },
    ];

    return {
        courseCode: courseCode.toUpperCase(),
        courseName,
        subject: courseName,
        examSections,
        gradeThresholds,
        maxTotalPoints,
        language: 'sv',
        gradingInfo: examStructure.gradingInfo || undefined,
    };
}

// ============================================================================
// EXAM TOPIC MAP BUILDER
// Builds ExamTopicNode[] purely from AI-extracted topics.
// Sorted: by phase (foundation → core → advanced), then by importance desc.
// ============================================================================

function buildExamTopicMap(aiResult: AIExamAnalysisResult): ExamTopicNode[] {
    const { topics } = aiResult;
    if (topics.length === 0) return [];

    // Sort: phase order first, then importance descending within each phase
    const phaseOrder = { foundation: 0, core: 1, advanced: 2 };
    const sorted = [...topics].sort((a, b) => {
        const phaseDiff = phaseOrder[a.phase] - phaseOrder[b.phase];
        if (phaseDiff !== 0) return phaseDiff;
        return b.importance - a.importance;
    });

    return sorted.map((topic, idx) => {
        const slug = slugify(topic.name);
        return {
            topicId: slug || `topic-${idx}`,
            topicName: topic.name,
            slug,
            description: topic.reasoning,
            frequency: topic.importance,           // use importance as frequency proxy (0–10 scale)
            frequencyLabel: topic.frequency,       // descriptive string from AI e.g. "8/10 exams"
            examSections: topic.examSection ? [topic.examSection] : [],
            learningOrder: idx + 1,
            phase: topic.phase,
            aiImportance: topic.importance,
            aiReasoning: topic.reasoning,
            aiFocus: topic.recommended_focus,
            aiDifficulty: topic.difficulty,
            studyTips: Array.isArray(topic.studyTips) ? topic.studyTips : [],
            commonMistakes: Array.isArray(topic.commonMistakes) ? topic.commonMistakes : [],
            priority: importanceToPriority(topic.importance),
        };
    });
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export async function getExamAnalysis(courseId: string): Promise<ExamAnalysisData | { error: string }> {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Not authenticated' };
    const userId = session.user.id;

    // Enrollment check
    const enrollment = await db.select().from(enrollments)
        .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
        .limit(1);
    if (enrollment.length === 0) return { error: 'Not enrolled in this course' };

    // Fetch course first (needed for course.code)
    const courseData = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
    if (courseData.length === 0) return { error: 'Course not found' };
    const course = courseData[0];
    const courseCodeStr = course.code ?? '';

    console.log(`[ExamAnalysis] Course: ${courseCodeStr} (id: ${courseId})`);

    // Fetch exams by courseCode (not courseId — bug fix)
    const courseExams = await db.select().from(exams)
        .where(eq(exams.courseCode, courseCodeStr))
        .orderBy(desc(exams.examDate));

    console.log(`[ExamAnalysis] Found: ${courseExams.length} exams for ${courseCodeStr}`);

    // Build exam metadata for AI (up to 5 exams: 3 questions + 2 solutions)
    const examMeta = courseExams.map(e => ({
        filePath: e.filePath ?? '',
        solutionFilePath: e.solutionFilePath ?? null,
        year: e.examDate ? String(new Date(e.examDate).getFullYear()) : 'Okänt',
        type: e.examType ?? 'TEN',
    })).filter(e => e.filePath.length > 0);

    // Call AI — primary data source
    const aiResult: AIExamAnalysisResult = await generateExamAnalysis(
        course.name ?? '',
        courseCodeStr,
        examMeta,
    );

    console.log(`[ExamAnalysis] AI returned: ${aiResult.topics.length} topics, ${aiResult.examStructure.sections.length} sections`);

    // Build course profile from AI-detected exam structure
    const courseProfile = buildCourseProfileFromAI(courseCodeStr, course.name ?? '', aiResult);

    // Build topic map from AI topics
    const examTopicMap = buildExamTopicMap(aiResult);

    // Build AI analysis summary
    const aiAnalysis: AIAnalysisSummary = {
        strategy: aiResult.strategy,
        examsAnalyzed: aiResult.examsAnalyzed,
        generatedAt: aiResult.generatedAt,
        cached: aiResult.cached,
        examStructure: aiResult.examStructure,
    };

    return {
        courseId,
        courseName: course.name ?? 'Okänd kurs',
        courseCode: courseCodeStr || 'N/A',
        courseProfile,
        totalExamsAnalyzed: aiResult.examsAnalyzed,
        totalTopics: examTopicMap.length,
        examTopicMap,
        aiAnalysis,
    };
}

// ============================================================================
// GET USER'S ENROLLED COURSES
// ============================================================================

export async function getUserCoursesForAnalysis(): Promise<{ id: string; name: string; code: string }[]> {
    const session = await auth();
    if (!session?.user?.id) return [];

    const userCourses = await db
        .select({ id: courses.id, name: courses.name, code: courses.code })
        .from(enrollments)
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .where(eq(enrollments.userId, session.user.id));

    return userCourses.map(c => ({ id: c.id, name: c.name ?? 'Okänd', code: c.code ?? 'N/A' }));
}
