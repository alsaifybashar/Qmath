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
    /** Number of published practice questions (for manual topics) */
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

/**
 * Estimate study hours for a topic based on difficulty and importance.
 */
function estimateStudyHours(difficulty: string, importance: number): number {
    const base = difficulty === 'hard' ? 5 : difficulty === 'medium' ? 3 : 2;
    // Scale between 1-8 hours based on importance
    const scaled = base * (importance / 10);
    return Math.max(1, Math.round(scaled * 2) / 2); // Round to nearest 0.5
}

/**
 * Group ExamTopicNodes by phase, then sort by learning order within each phase.
 */
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

    // Sort each group by learningOrder
    for (const [, list] of groups) {
        list.sort((a, b) => a.learningOrder - b.learningOrder);
    }

    return groups;
}

/**
 * Build prerequisite edges from the learning order.
 * Topics earlier in the same phase (or a lower phase) are prerequisites.
 */
function buildPrerequisites(
    topic: ExamTopicNode,
    allTopics: ExamTopicNode[],
): string[] {
    const prereqs: string[] = [];
    const phaseOrder = { foundation: 0, core: 1, advanced: 2 };
    const currentPhaseIdx = phaseOrder[topic.phase];

    for (const other of allTopics) {
        if (other.topicId === topic.topicId) continue;
        const otherPhaseIdx = phaseOrder[other.phase];

        // A topic is a prerequisite if:
        // 1. It's in an earlier phase, OR
        // 2. It's in the same phase but has an earlier learningOrder
        if (
            otherPhaseIdx < currentPhaseIdx ||
            (otherPhaseIdx === currentPhaseIdx && other.learningOrder < topic.learningOrder)
        ) {
            // Only add direct prerequisites (same phase, one step back OR last topic from previous phase)
            if (otherPhaseIdx === currentPhaseIdx && other.learningOrder === topic.learningOrder - 1) {
                prereqs.push(other.topicId);
            } else if (otherPhaseIdx === currentPhaseIdx - 1) {
                // Only add the last topic from the previous phase
                const prevPhaseTopics = allTopics.filter(
                    t => phaseOrder[t.phase] === currentPhaseIdx - 1
                );
                const lastInPrevPhase = prevPhaseTopics[prevPhaseTopics.length - 1];
                if (lastInPrevPhase && lastInPrevPhase.topicId === other.topicId && topic.learningOrder === 1) {
                    prereqs.push(other.topicId);
                }
            }
        }
    }

    return prereqs;
}

/**
 * Transform an ExamTopicNode into an OverviewTopic.
 */
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
        prerequisites: buildPrerequisites(node, allNodes),
        priority: node.priority,
        source: 'ai',
    };
}

// ============================================================================
// MANUAL TOPICS (admin-added Topics → Questions)
// ============================================================================

const MANUAL_MODULE_CONFIG = {
    id: 'module-practice',
    title: 'Övningsämnen',
    description: 'Ämnen med manuellt tillagda frågor och svar. Öva här för att förstärka din förståelse.',
    phase: 'core' as const,
    color: '#0EA5E9',
    icon: 'practice',
};

/**
 * Fetches manually added topics for a course with published question count.
 * Used by course overview (no admin check — students see these).
 */
async function getManualTopicsWithQuestionCount(courseId: string): Promise<{ slug: string; title: string; description: string | null; questionCount: number }[]> {
    const courseTopics = await db
        .select({
            id: topics.id,
            slug: topics.slug,
            title: topics.title,
            description: topics.description,
        })
        .from(topics)
        .where(eq(topics.courseId, courseId))
        .orderBy(asc(topics.title));

    if (courseTopics.length === 0) return [];

    const topicIds = courseTopics.map((t) => t.id);

    const counts = await db
        .select({
            topicId: questions.topicId,
            count: sql<number>`count(*)`.mapWith(Number),
        })
        .from(questions)
        .where(and(inArray(questions.topicId, topicIds), eq(questions.isPublished, true)))
        .groupBy(questions.topicId);

    const countMap = new Map(counts.map((c) => [c.topicId, c.count]));

    return courseTopics.map((t) => ({
        slug: t.slug,
        title: t.title,
        description: t.description,
        questionCount: countMap.get(t.id) ?? 0,
    }));
}

/** Map a DB manual topic to OverviewTopic (id = slug for URL routing). */
function manualTopicToOverviewTopic(
    t: { slug: string; title: string; description: string | null; questionCount: number },
): OverviewTopic {
    return {
        id: t.slug,
        name: t.title,
        description: t.description ?? '',
        difficulty: 'medium',
        importance: 5,
        examFrequency: '',
        examSections: [],
        studyTips: [],
        commonMistakes: [],
        estimatedHours: 1,
        prerequisites: [],
        priority: 'medium',
        source: 'manual',
        questionCount: t.questionCount,
    };
}

// ============================================================================
// MAIN: BUILD COURSE OVERVIEW FROM EXAM ANALYSIS
// ============================================================================

/**
 * Generates a structured course overview from the exam analysis data and
 * manually added topics (admin: Topics → Questions). Reuses the existing
 * AI exam analysis (cached). Manual topics appear in an "Övningsämnen" module.
 */
export async function getCourseOverview(
    courseId: string,
): Promise<CourseOverviewData | { error: string }> {

    // 1. Fetch the exam analysis (leverages existing L1/L2 cache)
    const analysisResult = await getExamAnalysis(courseId);

    if ('error' in analysisResult) {
        return { error: analysisResult.error };
    }

    const analysis: ExamAnalysisData = analysisResult;

    // 2. Fetch manually added topics (with question count) for this course
    const manualTopicsRaw = await getManualTopicsWithQuestionCount(courseId);
    const manualOverviewTopics = manualTopicsRaw.map(manualTopicToOverviewTopic);

    // 3. If no AI topics, try overview from manual topics only
    if (analysis.examTopicMap.length === 0) {
        if (manualOverviewTopics.length === 0) {
            return {
                error: 'Inga ämnen hittades. Ladda upp tentamensfiler eller lägg till ämnen och frågor under Admin → Frågor.',
            };
        }
        const practiceModule: LearningModule = {
            id: MANUAL_MODULE_CONFIG.id,
            title: MANUAL_MODULE_CONFIG.title,
            description: MANUAL_MODULE_CONFIG.description,
            phase: MANUAL_MODULE_CONFIG.phase,
            orderIndex: 1,
            topics: manualOverviewTopics,
            totalEstimatedHours: manualOverviewTopics.length,
            moduleImportance: 5,
            color: MANUAL_MODULE_CONFIG.color,
            icon: MANUAL_MODULE_CONFIG.icon,
        };
        const modules = [practiceModule];
        const learningPath = manualOverviewTopics.map((t) => t.id);
        return {
            courseId: analysis.courseId,
            courseCode: analysis.courseCode,
            courseName: analysis.courseName,
            totalModules: 1,
            totalTopics: manualOverviewTopics.length,
            totalEstimatedHours: practiceModule.totalEstimatedHours,
            examsAnalyzed: analysis.totalExamsAnalyzed,
            modules,
            learningPath,
            generatedAt: new Date().toISOString(),
        };
    }

    // 4. Group AI topics by phase and build learning modules
    const phaseGroups = groupByPhase(analysis.examTopicMap);
    const modules: LearningModule[] = [];
    let globalOrderIndex = 0;
    const orderedPhases: ('foundation' | 'core' | 'advanced')[] = ['foundation', 'core', 'advanced'];

    for (const phase of orderedPhases) {
        const nodes = phaseGroups.get(phase) || [];
        if (nodes.length === 0) continue;

        globalOrderIndex++;
        const config = PHASE_CONFIG[phase];

        const topics = nodes.map(node =>
            nodeToOverviewTopic(node, analysis.examTopicMap)
        );

        const totalHours = topics.reduce((sum, t) => sum + t.estimatedHours, 0);
        const avgImportance = topics.reduce((sum, t) => sum + t.importance, 0) / topics.length;

        modules.push({
            id: `module-${phase}`,
            title: config.label,
            description: config.description,
            phase,
            orderIndex: globalOrderIndex,
            topics,
            totalEstimatedHours: Math.round(totalHours * 2) / 2,
            moduleImportance: Math.round(avgImportance * 10) / 10,
            color: config.color,
            icon: config.icon,
        });
    }

    // 5. Append "Övningsämnen" module with manual topics (if any)
    if (manualOverviewTopics.length > 0) {
        globalOrderIndex++;
        modules.push({
            id: MANUAL_MODULE_CONFIG.id,
            title: MANUAL_MODULE_CONFIG.title,
            description: MANUAL_MODULE_CONFIG.description,
            phase: MANUAL_MODULE_CONFIG.phase,
            orderIndex: globalOrderIndex,
            topics: manualOverviewTopics,
            totalEstimatedHours: manualOverviewTopics.length,
            moduleImportance: 5,
            color: MANUAL_MODULE_CONFIG.color,
            icon: MANUAL_MODULE_CONFIG.icon,
        });
    }

    // 6. Build the full learning path (ordered topic IDs)
    const learningPath: string[] = [];
    for (const mod of modules) {
        for (const topic of mod.topics) {
            learningPath.push(topic.id);
        }
    }

    // 7. Calculate totals
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
