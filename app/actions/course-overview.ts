'use server';

import { db } from '@/db/drizzle';
import { topics, questions, courses } from '@/db/schema';
import { eq, and, inArray, sql, asc } from 'drizzle-orm';
import { getExamAnalysis } from './exam-analysis';
import type { ExamAnalysisData, ExamTopicNode } from './exam-analysis';

// ============================================================================
// TYPES — Course Overview data structures
// ============================================================================

/** Source of the topic: AI (from exam analysis) or manually added in admin */
export type OverviewTopicSource = 'ai' | 'manual';

/** A single topic within a learning module */
export interface OverviewTopic {
    id: string;
    name: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    importance: number;          // 1–10
    examFrequency: string;       // e.g. "8/10 tentor"
    examSections: string[];      // which exam sections it appears in
    studyTips: string[];
    commonMistakes: string[];
    estimatedHours: number;      // rough study time estimate
    prerequisites: string[];     // IDs of prerequisite topics
    priority: 'critical' | 'high' | 'medium' | 'low';
    /** When set, topic was added manually in admin (Topics → Questions) */
    source?: OverviewTopicSource;
    /** Number of published practice questions */
    questionCount?: number;
}

/** A learning module — groups related topics in order */
export interface LearningModule {
    id: string;
    title: string;
    description: string;
    phase: 'foundation' | 'core' | 'advanced';
    orderIndex: number;          // 1-based global order
    topics: OverviewTopic[];
    totalEstimatedHours: number;
    moduleImportance: number;    // average importance of topics
    color: string;               // hex color for UI
    icon: string;                // icon name hint for UI
}

/** Full course overview result */
export interface CourseOverviewData {
    courseId: string;
    courseCode: string;
    courseName: string;
    totalModules: number;
    totalTopics: number;
    totalEstimatedHours: number;
    examsAnalyzed: number;
    modules: LearningModule[];
    learningPath: string[];      // ordered list of topic IDs (full path)
    generatedAt: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PHASE_CONFIG = {
    foundation: {
        label: 'Grundläggande',
        color: '#10B981',
        icon: 'foundation',
        description: 'Grundläggande begrepp och metoder som krävs för att förstå resten av kursen.',
    },
    core: {
        label: 'Kärna',
        color: '#3B82F6',
        icon: 'core',
        description: 'De viktigaste ämnena som utgör kursens kärna och testas mest på tentan.',
    },
    advanced: {
        label: 'Fördjupning',
        color: '#8B5CF6',
        icon: 'advanced',
        description: 'Avancerade ämnen som krävs för högre betyg och djupare förståelse.',
    },
} as const;

// ============================================================================
// HELPERS
// ============================================================================

function estimateStudyHours(difficulty: string, importance: number): number {
    const base = difficulty === 'hard' ? 5 : difficulty === 'medium' ? 3 : 2;
    const scaled = base * (importance / 10);
    return Math.max(1, Math.round(scaled * 2) / 2);
}

function importanceToPriority(importance: number): 'critical' | 'high' | 'medium' | 'low' {
    if (importance >= 8) return 'critical';
    if (importance >= 6) return 'high';
    if (importance >= 4) return 'medium';
    return 'low';
}

// ============================================================================
// BUILD FROM TOPICS TABLE (admin-managed, primary source)
// ============================================================================

/**
 * Fetch all topics for a course from the DB with question counts,
 * and build the overview from them. This is the primary path now
 * that AI topics are imported into the topics table.
 */
async function buildOverviewFromTopicsTable(
    courseId: string,
    examsAnalyzed: number,
): Promise<LearningModule[]> {
    // Fetch all topics for this course
    const courseTopics = await db
        .select({
            id: topics.id,
            slug: topics.slug,
            title: topics.title,
            description: topics.description,
            source: topics.source,
            phase: topics.phase,
            aiImportance: topics.aiImportance,
            aiDifficulty: topics.aiDifficulty,
            studyTips: topics.studyTips,
            commonMistakes: topics.commonMistakes,
            examFrequency: topics.examFrequency,
            examSections: topics.examSections,
            sortOrder: topics.sortOrder,
        })
        .from(topics)
        .where(eq(topics.courseId, courseId))
        .orderBy(asc(topics.sortOrder), asc(topics.title));

    if (courseTopics.length === 0) return [];

    // Get question counts
    const topicIds = courseTopics.map(t => t.id);
    const counts = await db
        .select({
            topicId: questions.topicId,
            count: sql<number>`count(*)`.mapWith(Number),
        })
        .from(questions)
        .where(and(inArray(questions.topicId, topicIds), eq(questions.isPublished, true)))
        .groupBy(questions.topicId);
    const countMap = new Map(counts.map(c => [c.topicId, c.count]));

    // Convert DB topics to OverviewTopic
    const overviewTopics: (OverviewTopic & { phase: string })[] = courseTopics.map(t => {
        const importance = t.aiImportance ?? 5;
        const difficulty = (t.aiDifficulty || 'medium') as 'easy' | 'medium' | 'hard';
        return {
            id: t.id,
            name: t.title,
            description: t.description ?? '',
            difficulty,
            importance,
            examFrequency: t.examFrequency ?? '',
            examSections: (t.examSections as string[]) ?? [],
            studyTips: (t.studyTips as string[]) ?? [],
            commonMistakes: (t.commonMistakes as string[]) ?? [],
            estimatedHours: estimateStudyHours(difficulty, importance),
            prerequisites: [],
            priority: importanceToPriority(importance),
            source: (t.source || 'manual') as OverviewTopicSource,
            questionCount: countMap.get(t.id) ?? 0,
            phase: t.phase || 'core',
        };
    });

    // Group by phase
    const phaseGroups = new Map<string, typeof overviewTopics>();
    for (const t of overviewTopics) {
        const list = phaseGroups.get(t.phase) || [];
        list.push(t);
        phaseGroups.set(t.phase, list);
    }

    // Build modules
    const modules: LearningModule[] = [];
    let globalOrderIndex = 0;
    const orderedPhases: ('foundation' | 'core' | 'advanced')[] = ['foundation', 'core', 'advanced'];

    for (const phase of orderedPhases) {
        const phaseTopics = phaseGroups.get(phase);
        if (!phaseTopics || phaseTopics.length === 0) continue;

        globalOrderIndex++;
        const config = PHASE_CONFIG[phase];
        const totalHours = phaseTopics.reduce((sum, t) => sum + t.estimatedHours, 0);
        const avgImportance = phaseTopics.reduce((sum, t) => sum + t.importance, 0) / phaseTopics.length;

        modules.push({
            id: `module-${phase}`,
            title: config.label,
            description: config.description,
            phase,
            orderIndex: globalOrderIndex,
            topics: phaseTopics,
            totalEstimatedHours: Math.round(totalHours * 2) / 2,
            moduleImportance: Math.round(avgImportance * 10) / 10,
            color: config.color,
            icon: config.icon,
        });
    }

    return modules;
}

// ============================================================================
// FALLBACK: BUILD FROM RAW AI CACHE (legacy path)
// ============================================================================

function nodeToOverviewTopic(
    node: ExamTopicNode,
    allNodes: ExamTopicNode[],
): OverviewTopic {
    return {
        id: node.topicId,
        name: node.topicName,
        description: node.description || node.aiReasoning,
        difficulty: node.aiDifficulty,
        importance: node.aiImportance,
        examFrequency: node.frequencyLabel,
        examSections: node.examSections,
        studyTips: node.studyTips,
        commonMistakes: node.commonMistakes,
        estimatedHours: estimateStudyHours(node.aiDifficulty, node.aiImportance),
        prerequisites: [],
        priority: node.priority,
        source: 'ai',
    };
}

function groupByPhase(nodes: ExamTopicNode[]): Map<'foundation' | 'core' | 'advanced', ExamTopicNode[]> {
    const groups = new Map<'foundation' | 'core' | 'advanced', ExamTopicNode[]>();
    groups.set('foundation', []);
    groups.set('core', []);
    groups.set('advanced', []);

    for (const node of nodes) {
        const phase = node.phase || 'core';
        const list = groups.get(phase) || [];
        list.push(node);
        groups.set(phase, list);
    }

    for (const [, list] of groups) {
        list.sort((a, b) => a.learningOrder - b.learningOrder);
    }

    return groups;
}

function buildModulesFromAICache(nodes: ExamTopicNode[]): LearningModule[] {
    const phaseGroups = groupByPhase(nodes);
    const modules: LearningModule[] = [];
    let globalOrderIndex = 0;
    const orderedPhases: ('foundation' | 'core' | 'advanced')[] = ['foundation', 'core', 'advanced'];

    for (const phase of orderedPhases) {
        const phaseNodes = phaseGroups.get(phase) || [];
        if (phaseNodes.length === 0) continue;

        globalOrderIndex++;
        const config = PHASE_CONFIG[phase];
        const phaseTopics = phaseNodes.map(node => nodeToOverviewTopic(node, nodes));
        const totalHours = phaseTopics.reduce((sum, t) => sum + t.estimatedHours, 0);
        const avgImportance = phaseTopics.reduce((sum, t) => sum + t.importance, 0) / phaseTopics.length;

        modules.push({
            id: `module-${phase}`,
            title: config.label,
            description: config.description,
            phase,
            orderIndex: globalOrderIndex,
            topics: phaseTopics,
            totalEstimatedHours: Math.round(totalHours * 2) / 2,
            moduleImportance: Math.round(avgImportance * 10) / 10,
            color: config.color,
            icon: config.icon,
        });
    }

    return modules;
}

// ============================================================================
// MAIN: BUILD COURSE OVERVIEW
// ============================================================================

/**
 * Generates a structured course overview. Primary source is the topics table
 * (admin-managed). Falls back to raw AI cache if no topics have been imported.
 */
export async function getCourseOverview(
    courseId: string,
): Promise<CourseOverviewData | { error: string }> {

    // 1. Fetch the exam analysis (for metadata: course name, exams analyzed)
    const analysisResult = await getExamAnalysis(courseId);

    if ('error' in analysisResult) {
        return { error: analysisResult.error };
    }

    const analysis: ExamAnalysisData = analysisResult;

    // 2. Try building from topics table first (admin-managed)
    let modules = await buildOverviewFromTopicsTable(courseId, analysis.totalExamsAnalyzed);

    // 3. If no topics in DB, fall back to raw AI cache
    if (modules.length === 0 && analysis.examTopicMap.length > 0) {
        modules = buildModulesFromAICache(analysis.examTopicMap);
    }

    // 4. If still nothing, return error
    if (modules.length === 0) {
        return {
            error: 'Inga ämnen hittades. Synka AI-ämnen eller lägg till ämnen manuellt under Admin → Kurser.',
        };
    }

    // 5. Build the full learning path
    const learningPath: string[] = [];
    for (const mod of modules) {
        for (const topic of mod.topics) {
            learningPath.push(topic.id);
        }
    }

    // 6. Calculate totals
    const totalTopics = modules.reduce((sum, m) => sum + m.topics.length, 0);
    const totalEstimatedHours = modules.reduce((sum, m) => sum + m.totalEstimatedHours, 0);

    return {
        courseId: analysis.courseId,
        courseCode: analysis.courseCode,
        courseName: analysis.courseName,
        totalModules: modules.length,
        totalTopics,
        totalEstimatedHours,
        examsAnalyzed: analysis.totalExamsAnalyzed,
        modules,
        learningPath,
        generatedAt: new Date().toISOString(),
    };
}
