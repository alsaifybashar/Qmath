/**
 * Learning Path Generator
 *
 * Uses the prerequisite knowledge graph + diagnostic screening results
 * to generate a personalized remediation path for students with
 * identified gaps.
 *
 * Research basis:
 * - "Prerequisite gaps are the #1 root cause of calculus failure"
 * - Bridge programs improved pass rates by 5.3 pp (d = 0.34)
 * - The path uses topological ordering of the prerequisite graph
 *   to ensure prerequisites are remediated before dependents.
 */

import { db } from '@/db/drizzle';
import { prerequisiteEdges, topics, diagnosticResults, curriculumStandards } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

// ============================================================================
// TYPES
// ============================================================================

export interface LearningPathNode {
    topicId: string;
    topicTitle: string;
    topicSlug: string;
    reason: 'prerequisite_gap' | 'direct_gap' | 'strengthening';
    priority: number;             // 1 = highest priority
    estimatedMinutes: number;
    gapSeverity: 'critical' | 'weak' | 'moderate';
    prerequisiteFor: string[];    // topic IDs that depend on this
}

export interface LearningPath {
    userId: string;
    generatedAt: Date;
    totalEstimatedMinutes: number;
    nodes: LearningPathNode[];
    summary: {
        criticalGaps: number;
        weakGaps: number;
        totalRemediationTopics: number;
    };
}

// ============================================================================
// PATH GENERATION
// ============================================================================

/**
 * Generate a personalized learning path from diagnostic results.
 *
 * Algorithm:
 * 1. Get the student's identified gaps from the diagnostic
 * 2. For each gap, find all prerequisite topics in the graph
 * 3. Topological sort the combined set (prerequisites first)
 * 4. Assign priorities and estimated times
 */
export async function generateLearningPath(
    userId: string,
    diagnosticResultId: string
): Promise<LearningPath> {
    // 1. Load the diagnostic result
    const result = await db.query.diagnosticResults.findFirst({
        where: eq(diagnosticResults.id, diagnosticResultId),
    });

    if (!result) {
        throw new Error(`Diagnostic result ${diagnosticResultId} not found`);
    }

    const gapsIdentified = (result.gapsIdentified as string[]) || [];
    const detailedResults = (result.detailedResults as Array<{
        standardCode: string;
        standardTitle: string;
        level: string;
        score: number;
        status: string;
    }>) || [];

    // 2. Find topics associated with each gap
    // Map curriculum standard codes to topic slugs/IDs
    const allTopics = await db.query.topics.findMany({
        with: { course: true },
    });

    const allEdges = await db.query.prerequisiteEdges.findMany();

    // Build adjacency list for the prerequisite graph
    const graph = new Map<string, string[]>();     // topicId → [prerequisite topic IDs]
    const reverseGraph = new Map<string, string[]>(); // topicId → [topics that depend on it]

    for (const edge of allEdges) {
        // fromTopicId is the prerequisite, toTopicId requires it
        if (!graph.has(edge.toTopicId)) graph.set(edge.toTopicId, []);
        graph.get(edge.toTopicId)!.push(edge.fromTopicId);

        if (!reverseGraph.has(edge.fromTopicId)) reverseGraph.set(edge.fromTopicId, []);
        reverseGraph.get(edge.fromTopicId)!.push(edge.toTopicId);
    }

    // 3. Identify weak topics — topics whose curriculum standards match the gaps
    const weakTopicIds = new Set<string>();
    const topicSeverity = new Map<string, 'critical' | 'weak' | 'moderate'>();

    for (const gap of detailedResults) {
        if (gap.status === 'critical' || gap.status === 'weak') {
            // Find topics that match this curriculum standard area
            const matchingTopics = allTopics.filter(t => {
                // Match by curriculum standard ID or by topic slug containing the area
                if (t.curriculumStandardId) {
                    // Direct match via linked standard
                    return gapsIdentified.includes(gap.standardCode);
                }
                // Fallback: match by slug keywords
                const slug = t.slug.toLowerCase();
                const area = gap.standardTitle.toLowerCase();
                return slug.includes(area) || area.includes(slug);
            });

            for (const topic of matchingTopics) {
                weakTopicIds.add(topic.id);
                topicSeverity.set(
                    topic.id,
                    gap.status === 'critical' ? 'critical' : 'weak'
                );
            }
        }
    }

    // 4. For each weak topic, also add its prerequisites (recursive)
    const allRemediationTopics = new Set<string>();
    const visited = new Set<string>();

    function addWithPrerequisites(topicId: string) {
        if (visited.has(topicId)) return;
        visited.add(topicId);
        allRemediationTopics.add(topicId);

        const prereqs = graph.get(topicId) || [];
        for (const prereq of prereqs) {
            if (!topicSeverity.has(prereq)) {
                topicSeverity.set(prereq, 'moderate');
            }
            addWithPrerequisites(prereq);
        }
    }

    for (const topicId of weakTopicIds) {
        addWithPrerequisites(topicId);
    }

    // 5. Topological sort — prerequisites first
    const sorted = topologicalSort(allRemediationTopics, graph);

    // 6. Build the learning path nodes
    const nodes: LearningPathNode[] = sorted.map((topicId, index) => {
        const topic = allTopics.find(t => t.id === topicId);
        const severity = topicSeverity.get(topicId) || 'moderate';
        const dependents = reverseGraph.get(topicId) || [];
        const isDirectGap = weakTopicIds.has(topicId);

        // Estimate time based on severity
        const estimatedMinutes = severity === 'critical' ? 20 : severity === 'weak' ? 15 : 10;

        return {
            topicId,
            topicTitle: topic?.title || topicId,
            topicSlug: topic?.slug || topicId,
            reason: isDirectGap ? 'direct_gap' : 'prerequisite_gap',
            priority: index + 1,
            estimatedMinutes,
            gapSeverity: severity,
            prerequisiteFor: dependents.filter(d => allRemediationTopics.has(d)),
        };
    });

    // 7. Build summary
    const criticalGaps = nodes.filter(n => n.gapSeverity === 'critical').length;
    const weakGaps = nodes.filter(n => n.gapSeverity === 'weak').length;
    const totalEstimatedMinutes = nodes.reduce((sum, n) => sum + n.estimatedMinutes, 0);

    return {
        userId,
        generatedAt: new Date(),
        totalEstimatedMinutes,
        nodes,
        summary: {
            criticalGaps,
            weakGaps,
            totalRemediationTopics: nodes.length,
        },
    };
}

// ============================================================================
// GRAPH UTILITIES
// ============================================================================

/**
 * Topological sort using Kahn's algorithm.
 * Returns topics in prerequisite-first order.
 */
function topologicalSort(
    nodeSet: Set<string>,
    graph: Map<string, string[]>
): string[] {
    // Build in-degree map for the subgraph
    const inDegree = new Map<string, number>();
    const subGraph = new Map<string, string[]>();

    for (const node of nodeSet) {
        inDegree.set(node, 0);
        subGraph.set(node, []);
    }

    for (const node of nodeSet) {
        const prereqs = graph.get(node) || [];
        for (const prereq of prereqs) {
            if (nodeSet.has(prereq)) {
                subGraph.get(prereq)!.push(node);
                inDegree.set(node, (inDegree.get(node) || 0) + 1);
            }
        }
    }

    // Kahn's algorithm
    const queue: string[] = [];
    for (const [node, degree] of inDegree.entries()) {
        if (degree === 0) queue.push(node);
    }

    const sorted: string[] = [];
    while (queue.length > 0) {
        const current = queue.shift()!;
        sorted.push(current);

        for (const neighbor of (subGraph.get(current) || [])) {
            const newDegree = (inDegree.get(neighbor) || 1) - 1;
            inDegree.set(neighbor, newDegree);
            if (newDegree === 0) queue.push(neighbor);
        }
    }

    // If there are remaining nodes (cycle), append them
    for (const node of nodeSet) {
        if (!sorted.includes(node)) {
            sorted.push(node);
        }
    }

    return sorted;
}
