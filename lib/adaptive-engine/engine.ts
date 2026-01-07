/**
 * Main Adaptive Learning Engine
 * 
 * Combines IRT, Knowledge Tracing, and Spaced Repetition to provide
 * personalized question selection and learning path optimization.
 */

import { IRTModel } from './irt';
import { KnowledgeStateManager, BayesianKnowledgeTracing } from './knowledge-tracing';
import { SpacedRepetitionManager } from './spaced-repetition';
import {
    StudentLearningState,
    AnswerAnalysis,
    QuestionParameters,
    AdaptiveRecommendation,
    PerformanceMetrics,
    TemporalMetrics,
    EngagementMetrics,
    StudySession,
    IRTParameters
} from './parameters';

// ============================================================================
// QUESTION BANK TYPE
// ============================================================================

export interface QuestionItem {
    id: string;
    topicId: string;
    content: string;
    type: 'multiple_choice' | 'numeric' | 'proof_step';
    options?: string[];
    correctAnswer: string;
    difficulty: number;  // 1-10
    characterCount: number;
    stepsRequired: number;
    prerequisites: string[];
    irtParams: IRTParameters;
    scaffoldQuestions?: QuestionItem[];  // Breakdown questions
}

// ============================================================================
// ADAPTIVE ENGINE
// ============================================================================

export class AdaptiveLearningEngine {
    private knowledgeManager: KnowledgeStateManager;
    private spacedRepetition: SpacedRepetitionManager;
    private studentState: StudentLearningState;
    private currentSession: StudySession | null = null;

    constructor(userId: string, initialState?: Partial<StudentLearningState>) {
        this.knowledgeManager = new KnowledgeStateManager();
        this.spacedRepetition = new SpacedRepetitionManager();

        // Initialize student state
        this.studentState = {
            userId,
            performance: this.initializePerformanceMetrics(),
            temporal: this.initializeTemporalMetrics(),
            engagement: this.initializeEngagementMetrics(),
            knowledge: this.knowledgeManager.getState(),
            spacedRepetition: this.spacedRepetition.getState(),
            lastUpdated: new Date(),
            examReadinessScore: 0,
            riskLevel: 'medium',
            recommendedFocusAreas: [],
            ...initialState
        };
    }

    // ========================================================================
    // INITIALIZATION HELPERS
    // ========================================================================

    private initializePerformanceMetrics(): PerformanceMetrics {
        return {
            correctAnswers: 0,
            wrongAnswers: 0,
            accuracyRate: 0,
            firstAttemptSuccessRate: 0,
            errorPatterns: [],
            hintUsage: {
                totalHintsUsed: 0,
                avgHintsPerQuestion: 0,
                questionsWithHints: 0,
                questionsWithoutHints: 0
            },
            abandonRate: 0
        };
    }

    private initializeTemporalMetrics(): TemporalMetrics {
        return {
            avgTimePerQuestion: 0,
            timeVariance: 0,
            totalHoursSpent: 0,
            avgSessionDuration: 0,
            peakPerformanceWindow: 'Unknown',
            hourlyPerformance: {},
            daysUntilExam: null,
            avgDaysBetweenSessions: 0
        };
    }

    private initializeEngagementMetrics(): EngagementMetrics {
        return {
            currentStreak: 0,
            longestStreak: 0,
            totalQuestionsSolved: 0,
            questionsByTopic: {},
            learningVelocity: 0,
            preferredModality: 'mixed',
            sessionRegularity: 0,
            reviewBeforePractice: false
        };
    }

    // ========================================================================
    // QUESTION SELECTION
    // ========================================================================

    /**
     * Select the next best question for the student
     * Uses a multi-factor scoring system
     */
    selectNextQuestion(
        availableQuestions: QuestionItem[],
        targetTopicId?: string
    ): QuestionItem | null {
        if (availableQuestions.length === 0) return null;

        // Get student's current ability
        const ability = this.studentState.knowledge.estimatedAbility;

        // Get topics that need review (spaced repetition)
        const dueItems = this.spacedRepetition.getDueItems();

        // Score each question
        const scoredQuestions = availableQuestions.map(q => ({
            question: q,
            score: this.calculateQuestionScore(q, ability, dueItems, targetTopicId)
        }));

        // Sort by score (highest first)
        scoredQuestions.sort((a, b) => b.score - a.score);

        // Add some randomness to avoid predictability (among top 3)
        const topCandidates = scoredQuestions.slice(0, 3);
        const randomIndex = Math.floor(Math.random() * topCandidates.length);

        return topCandidates[randomIndex]?.question ?? null;
    }

    /**
     * Calculate a score for question selection
     * Higher score = better choice for this student right now
     */
    private calculateQuestionScore(
        question: QuestionItem,
        studentAbility: number,
        dueItems: string[],
        targetTopicId?: string
    ): number {
        let score = 0;

        // 1. IRT Information - how informative is this question?
        // Questions are most informative near the student's ability level
        const information = IRTModel.itemInformation(studentAbility, question.irtParams);
        score += information * 30;

        // 2. Zone of Proximal Development (ZPD)
        // Optimal difficulty is slightly above current ability
        const optimalDifficulty = studentAbility + 0.3;
        const difficultyMatch = 1 - Math.abs(
            IRTModel.difficultyToIRT(question.difficulty) - optimalDifficulty
        );
        score += difficultyMatch * 25;

        // 3. Mastery-based scoring
        // Prioritize topics with lower mastery
        const topicMastery = this.knowledgeManager.getTopicMastery(question.topicId);
        score += (1 - topicMastery) * 20;

        // 4. Spaced repetition bonus
        // If this topic is due for review, boost priority
        if (dueItems.includes(question.topicId)) {
            score += 15;
        }

        // 5. Target topic bonus
        if (targetTopicId && question.topicId === targetTopicId) {
            score += 10;
        }

        // 6. Prerequisite check penalty
        // Penalize questions where prerequisites aren't met
        const prerequisiteMet = this.checkPrerequisites(question.prerequisites);
        if (!prerequisiteMet) {
            score -= 30;
        }

        // 7. Exam proximity factor
        if (this.studentState.temporal.daysUntilExam !== null) {
            const daysLeft = this.studentState.temporal.daysUntilExam;
            if (daysLeft < 7) {
                // Close to exam - focus on weak areas
                score += (1 - topicMastery) * 10;
            }
        }

        return score;
    }

    /**
     * Check if all prerequisites are met for a question
     */
    private checkPrerequisites(prerequisites: string[]): boolean {
        const masteryThreshold = 0.5; // 50% mastery required

        for (const prereq of prerequisites) {
            const mastery = this.knowledgeManager.getTopicMastery(prereq);
            if (mastery < masteryThreshold) {
                return false;
            }
        }
        return true;
    }

    /**
     * Calculate optimal difficulty for the student on a given topic
     */
    calculateOptimalDifficulty(topicId: string): number {
        const ability = this.studentState.knowledge.estimatedAbility;
        const topicMastery = this.knowledgeManager.getTopicMastery(topicId);

        // Start slightly above current level for challenge
        let targetAbility = ability + 0.3;

        // If mastery is low, start easier
        if (topicMastery < 0.3) {
            targetAbility = ability - 0.5;
        }

        // Convert to 1-10 scale
        return Math.max(1, Math.min(10, IRTModel.irtToDifficulty(targetAbility)));
    }

    // ========================================================================
    // ANSWER PROCESSING
    // ========================================================================

    /**
     * Process a student's answer and update all tracking systems
     */
    processAnswer(
        question: QuestionItem,
        analysis: AnswerAnalysis
    ): {
        masteryUpdate: number;
        abilityUpdate: number;
        shouldScaffold: boolean;
        nextReviewDate: Date | null;
    } {
        const previousMastery = this.knowledgeManager.getTopicMastery(question.topicId);
        const previousAbility = this.studentState.knowledge.estimatedAbility;

        // 1. Update knowledge state
        this.knowledgeManager.processAnswer(question.topicId, analysis, question.type);

        // 2. Update IRT ability estimate
        const irtUpdate = IRTModel.updateAbilityMLE(
            previousAbility,
            [{ itemParams: question.irtParams, isCorrect: analysis.isCorrect }]
        );
        this.studentState.knowledge.estimatedAbility = irtUpdate;

        // 3. Update spaced repetition
        const quality = SpacedRepetitionManager.answerToQuality(
            analysis.isCorrect,
            analysis.timeTaken,
            30000,  // Expected time: 30s
            analysis.hintsUsed
        );
        this.spacedRepetition.processReview(question.topicId, quality);

        // 4. Update performance metrics
        this.updatePerformanceMetrics(analysis);

        // 5. Update temporal metrics
        this.updateTemporalMetrics(analysis);

        // 6. Check if scaffolding is needed
        const shouldScaffold = this.shouldTriggerScaffolding(
            question,
            analysis,
            previousMastery
        );

        // 7. Update session if active
        if (this.currentSession) {
            this.currentSession.questionsAttempted.push(analysis);
            if (!this.currentSession.topicsCovered.includes(question.topicId)) {
                this.currentSession.topicsCovered.push(question.topicId);
            }
        }

        // 8. Get next review date
        const nextReviewDate = this.spacedRepetition.getNextReviewDate(question.topicId);

        // 9. Update student state
        this.studentState.knowledge = this.knowledgeManager.getState();
        this.studentState.spacedRepetition = this.spacedRepetition.getState();
        this.studentState.lastUpdated = new Date();

        // 10. Recalculate readiness score
        this.updateExamReadiness();

        return {
            masteryUpdate: this.knowledgeManager.getTopicMastery(question.topicId) - previousMastery,
            abilityUpdate: this.studentState.knowledge.estimatedAbility - previousAbility,
            shouldScaffold,
            nextReviewDate
        };
    }

    /**
     * Determine if we should break down a question into simpler steps
     */
    private shouldTriggerScaffolding(
        question: QuestionItem,
        analysis: AnswerAnalysis,
        previousMastery: number
    ): boolean {
        // Don't scaffold if already at basic level
        if (question.difficulty <= 2) return false;

        // Don't scaffold if answer was correct
        if (analysis.isCorrect) return false;

        // Scaffold if:
        // 1. Topic mastery is low
        if (previousMastery < 0.4) return true;

        // 2. Multiple consecutive failures on topic
        // (Would need to track this in session)

        // 3. Answer was very far from correct
        if (analysis.distanceFromCorrect > 0.7) return true;

        // 4. Question has scaffold questions available
        if (question.scaffoldQuestions && question.scaffoldQuestions.length > 0) {
            return true;
        }

        return false;
    }

    /**
     * Update performance metrics based on answer
     */
    private updatePerformanceMetrics(analysis: AnswerAnalysis): void {
        const perf = this.studentState.performance;

        if (analysis.isCorrect) {
            perf.correctAnswers++;
        } else {
            perf.wrongAnswers++;
        }

        const total = perf.correctAnswers + perf.wrongAnswers;
        perf.accuracyRate = total > 0 ? perf.correctAnswers / total : 0;

        // Update hint usage
        if (analysis.hintsUsed > 0) {
            perf.hintUsage.totalHintsUsed += analysis.hintsUsed;
            perf.hintUsage.questionsWithHints++;
        } else {
            perf.hintUsage.questionsWithoutHints++;
        }

        const hintsTotal = perf.hintUsage.questionsWithHints + perf.hintUsage.questionsWithoutHints;
        perf.hintUsage.avgHintsPerQuestion = hintsTotal > 0
            ? perf.hintUsage.totalHintsUsed / hintsTotal
            : 0;

        // Update first attempt success rate
        if (analysis.attemptNumber === 1) {
            const prevTotal = this.studentState.engagement.totalQuestionsSolved;
            const prevRate = perf.firstAttemptSuccessRate;
            const prevSuccesses = prevTotal * prevRate;
            const newSuccesses = prevSuccesses + (analysis.isCorrect ? 1 : 0);
            perf.firstAttemptSuccessRate = (prevTotal + 1) > 0
                ? newSuccesses / (prevTotal + 1)
                : 0;
        }
    }

    /**
     * Update temporal metrics based on answer
     */
    private updateTemporalMetrics(analysis: AnswerAnalysis): void {
        const temp = this.studentState.temporal;
        const total = this.studentState.engagement.totalQuestionsSolved;

        // Update average time per question
        temp.avgTimePerQuestion = total > 0
            ? (temp.avgTimePerQuestion * total + analysis.timeTaken) / (total + 1)
            : analysis.timeTaken;

        // Track hourly performance
        const hour = new Date().getHours();
        const hourlyData = temp.hourlyPerformance[hour] ?? 0;
        temp.hourlyPerformance[hour] = hourlyData + (analysis.isCorrect ? 1 : 0);

        // Find peak performance window
        const hourlyEntries = Object.entries(temp.hourlyPerformance);
        if (hourlyEntries.length > 0) {
            const best = hourlyEntries.reduce((a, b) =>
                Number(a[1]) > Number(b[1]) ? a : b
            );
            temp.peakPerformanceWindow = `${best[0]}:00 - ${(Number(best[0]) + 1) % 24}:00`;
        }

        // Update engagement metrics
        this.studentState.engagement.totalQuestionsSolved++;
    }

    // ========================================================================
    // SESSION MANAGEMENT
    // ========================================================================

    /**
     * Start a new study session
     */
    startSession(sessionType: StudySession['sessionType'] = 'practice'): void {
        this.currentSession = {
            sessionId: `session_${Date.now()}`,
            userId: this.studentState.userId,
            startTime: new Date(),
            questionsAttempted: [],
            focusTimeMs: 0,
            pauseCount: 0,
            topicsCovered: [],
            sessionType
        };

        // Update streak
        this.updateStreak();
    }

    /**
     * End the current study session
     */
    endSession(): StudySession | null {
        if (!this.currentSession) return null;

        this.currentSession.endTime = new Date();

        // Calculate session duration
        const duration = this.currentSession.endTime.getTime() -
            this.currentSession.startTime.getTime();

        // Update engagement metrics
        const engagement = this.studentState.engagement;
        const prevSessions = engagement.totalQuestionsSolved > 0 ?
            Math.max(1, engagement.totalQuestionsSolved / 10) : 1; // Rough estimate

        this.studentState.temporal.avgSessionDuration =
            (this.studentState.temporal.avgSessionDuration * prevSessions + duration / 60000) /
            (prevSessions + 1);

        this.studentState.temporal.totalHoursSpent += duration / (1000 * 60 * 60);

        const session = this.currentSession;
        this.currentSession = null;

        return session;
    }

    /**
     * Update study streak
     */
    private updateStreak(): void {
        const engagement = this.studentState.engagement;

        // In a real implementation, this would check the database
        // for the last session date
        engagement.currentStreak++;

        if (engagement.currentStreak > engagement.longestStreak) {
            engagement.longestStreak = engagement.currentStreak;
        }
    }

    // ========================================================================
    // RECOMMENDATIONS
    // ========================================================================

    /**
     * Generate personalized recommendations for the student
     */
    getRecommendations(count: number = 3): AdaptiveRecommendation[] {
        const recommendations: AdaptiveRecommendation[] = [];

        // 1. Check for spaced repetition due items
        const dueItems = this.spacedRepetition.getDueItems();
        if (dueItems.length > 0) {
            recommendations.push({
                type: 'review',
                priority: 'high',
                target: `${dueItems.length} topics due for review`,
                targetId: dueItems[0],
                reason: 'Spaced repetition - optimal time to strengthen memory',
                estimatedMinutes: dueItems.length * 5,
                expectedImpact: 5,
                recommendedDifficulty: 4
            });
        }

        // 2. Find weakest topics
        const weakTopics = this.getWeakTopics(3);
        for (const topic of weakTopics) {
            recommendations.push({
                type: 'topic',
                priority: 'high',
                target: topic.id,
                targetId: topic.id,
                reason: `Low mastery (${Math.round(topic.mastery * 100)}%) - needs focused practice`,
                estimatedMinutes: 15,
                expectedImpact: 10,
                recommendedDifficulty: this.calculateOptimalDifficulty(topic.id)
            });
        }

        // 3. Exam proximity recommendations
        const daysUntilExam = this.studentState.temporal.daysUntilExam;
        if (daysUntilExam !== null && daysUntilExam < 7) {
            recommendations.push({
                type: 'concept',
                priority: 'high',
                target: 'High-yield concepts review',
                targetId: 'exam_prep',
                reason: `${daysUntilExam} days until exam - focus on core concepts`,
                estimatedMinutes: 30,
                expectedImpact: 15,
                recommendedDifficulty: 5
            });
        }

        // 4. Break recommendation if needed
        if (this.currentSession) {
            const sessionDuration = Date.now() - this.currentSession.startTime.getTime();
            if (sessionDuration > 45 * 60 * 1000) { // 45 minutes
                recommendations.push({
                    type: 'break',
                    priority: 'medium',
                    target: 'Take a short break',
                    targetId: 'break',
                    reason: 'Studies show breaks improve retention and focus',
                    estimatedMinutes: 10,
                    expectedImpact: 5,
                    recommendedDifficulty: 0
                });
            }
        }

        // Sort by priority and expected impact
        recommendations.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return b.expectedImpact - a.expectedImpact;
        });

        return recommendations.slice(0, count);
    }

    /**
     * Get topics with lowest mastery
     */
    private getWeakTopics(count: number): { id: string; mastery: number }[] {
        const knowledge = this.studentState.knowledge;

        return Object.entries(knowledge.masteryByTopic)
            .map(([id, mastery]) => ({ id, mastery }))
            .sort((a, b) => a.mastery - b.mastery)
            .slice(0, count);
    }

    // ========================================================================
    // EXAM READINESS
    // ========================================================================

    /**
     * Calculate overall exam readiness score
     */
    updateExamReadiness(): void {
        const knowledge = this.studentState.knowledge;
        const masteries = Object.values(knowledge.masteryByTopic);

        if (masteries.length === 0) {
            this.studentState.examReadinessScore = 0;
            this.studentState.riskLevel = 'critical';
            return;
        }

        // Calculate weighted average mastery
        const avgMastery = masteries.reduce((a, b) => a + b, 0) / masteries.length;

        // Factor in performance metrics
        const accuracy = this.studentState.performance.accuracyRate;

        // Factor in engagement
        const streak = Math.min(this.studentState.engagement.currentStreak / 7, 1); // 7-day streak = 100%

        // Calculate readiness
        const readiness = Math.round(
            (avgMastery * 0.5 + accuracy * 0.3 + streak * 0.2) * 100
        );

        this.studentState.examReadinessScore = readiness;

        // Determine risk level
        if (readiness >= 80) {
            this.studentState.riskLevel = 'low';
        } else if (readiness >= 60) {
            this.studentState.riskLevel = 'medium';
        } else if (readiness >= 40) {
            this.studentState.riskLevel = 'high';
        } else {
            this.studentState.riskLevel = 'critical';
        }

        // Update recommended focus areas
        this.studentState.recommendedFocusAreas = this.getWeakTopics(3).map(t => t.id);
    }

    /**
     * Set exam date
     */
    setExamDate(date: Date): void {
        const now = new Date();
        const diffTime = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        this.studentState.temporal.daysUntilExam = Math.max(0, diffDays);
    }

    // ========================================================================
    // STATE ACCESS
    // ========================================================================

    /**
     * Get current student state
     */
    getStudentState(): StudentLearningState {
        return { ...this.studentState };
    }

    /**
     * Get topic mastery for a specific topic
     */
    getTopicMastery(topicId: string): number {
        return this.knowledgeManager.getTopicMastery(topicId);
    }

    /**
     * Get estimated ability level
     */
    getAbilityLevel(): number {
        return this.studentState.knowledge.estimatedAbility;
    }

    /**
     * Export state for persistence
     */
    exportState(): string {
        return JSON.stringify(this.studentState);
    }

    /**
     * Import state from persistence
     */
    importState(json: string): void {
        const state = JSON.parse(json);
        this.studentState = state;

        // Reinitialize managers with imported state
        this.knowledgeManager = new KnowledgeStateManager(state.knowledge);
        this.spacedRepetition = new SpacedRepetitionManager(state.spacedRepetition);
    }
}

// Export main class and types
export { BayesianKnowledgeTracing, KnowledgeStateManager } from './knowledge-tracing';
export { IRTModel } from './irt';
export { SM2Algorithm, FSRSAlgorithm, SpacedRepetitionManager } from './spaced-repetition';
export * from './parameters';
