import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import crypto from 'crypto';
import { courses, topics, users } from './schema';

// Helper for generating UUIDs
const generateId = () => crypto.randomUUID();

// ============================================================================
// SOURCE EXAMS - Exam documents uploaded for processing
// ============================================================================
export const sourceExams = sqliteTable('source_exams', {
    id: text('id').primaryKey().$defaultFn(generateId),
    courseId: text('course_id').references(() => courses.id, { onDelete: 'cascade' }),
    examDate: integer('exam_date', { mode: 'timestamp' }),
    examType: text('exam_type'), // 'midterm', 'final', 'retake'
    fileName: text('file_name').notNull(),
    filePath: text('file_path').notNull(),
    fileSize: integer('file_size'),
    format: text('format'), // 'pdf', 'latex', 'docx'
    parsedContent: text('parsed_content'), // JSON blob of extracted content
    processingStatus: text('processing_status').default('pending'), // 'pending', 'processing', 'completed', 'failed'
    processingError: text('processing_error'),
    uploadedBy: text('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const sourceExamsRelations = relations(sourceExams, ({ one, many }) => ({
    course: one(courses, {
        fields: [sourceExams.courseId],
        references: [courses.id],
    }),
    uploader: one(users, {
        fields: [sourceExams.uploadedBy],
        references: [users.id],
    }),
    examQuestions: many(examQuestions),
}));

// ============================================================================
// EXAM QUESTIONS - Individual questions extracted from source exams
// ============================================================================
export const examQuestions = sqliteTable('exam_questions', {
    id: text('id').primaryKey().$defaultFn(generateId),
    sourceExamId: text('source_exam_id').references(() => sourceExams.id, { onDelete: 'cascade' }).notNull(),
    topicId: text('topic_id').references(() => topics.id, { onDelete: 'set null' }),
    questionNumber: integer('question_number'),
    originalText: text('original_text').notNull(),
    latexForm: text('latex_form'),
    points: integer('points'),
    difficultyEstimate: real('difficulty_estimate'), // 0-1 scale
    topicTags: text('topic_tags', { mode: 'json' }), // Array of topic strings
    concepts: text('concepts', { mode: 'json' }), // Array of concept identifiers
    prerequisites: text('prerequisites', { mode: 'json' }), // Array of prerequisite topics
    questionType: text('question_type'), // 'calculation', 'proof', 'conceptual', 'multiple_choice'
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
    sourceExamIdx: index('exam_questions_source_idx').on(table.sourceExamId),
    topicIdx: index('exam_questions_topic_idx').on(table.topicId),
}));

export const examQuestionsRelations = relations(examQuestions, ({ one, many }) => ({
    sourceExam: one(sourceExams, {
        fields: [examQuestions.sourceExamId],
        references: [sourceExams.id],
    }),
    topic: one(topics, {
        fields: [examQuestions.topicId],
        references: [topics.id],
    }),
    generatedContent: many(generatedContent),
}));

// ============================================================================
// COURSE AREAS - Hierarchical course structure (derived from exam analysis)
// ============================================================================
export const courseAreas = sqliteTable('course_areas', {
    id: text('id').primaryKey().$defaultFn(generateId),
    courseId: text('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
    name: text('name').notNull(),
    nameEn: text('name_en'),
    description: text('description'),
    orderIndex: integer('order_index').default(0),
    examFrequency: real('exam_frequency'), // How often this area appears on exams (0-1)
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const courseAreasRelations = relations(courseAreas, ({ one }) => ({
    course: one(courses, {
        fields: [courseAreas.courseId],
        references: [courses.id],
    }),
}));

// ============================================================================
// GENERATED CONTENT - Polymorphic table for all 8 content types
// ============================================================================
export const generatedContent = sqliteTable('generated_content', {
    id: text('id').primaryKey().$defaultFn(generateId),
    topicId: text('topic_id').references(() => topics.id, { onDelete: 'cascade' }).notNull(),

    // Content type discriminator
    contentType: text('content_type').notNull(), // See ContentType enum below

    // The actual content (JSON structure varies by contentType)
    content: text('content', { mode: 'json' }).notNull(),

    // Source tracking
    sourceExamQuestions: text('source_exam_questions', { mode: 'json' }), // Array of exam question IDs

    // Difficulty & metadata
    difficulty: real('difficulty'), // 0-1 scale
    estimatedMinutes: integer('estimated_minutes'),
    tags: text('tags', { mode: 'json' }), // Array of tags

    // Verification status
    verificationStatus: text('verification_status').default('pending'), // 'pending', 'auto_verified', 'human_verified', 'rejected'
    verifiedBy: text('verified_by'),
    verifiedAt: integer('verified_at', { mode: 'timestamp' }),
    verificationNotes: text('verification_notes'),

    // Generation metadata
    generatedBy: text('generated_by'), // Model name/version
    generationPrompt: text('generation_prompt'), // For debugging

    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
    topicIdx: index('generated_content_topic_idx').on(table.topicId),
    typeIdx: index('generated_content_type_idx').on(table.contentType),
    statusIdx: index('generated_content_status_idx').on(table.verificationStatus),
}));

export const generatedContentRelations = relations(generatedContent, ({ one, many }) => ({
    topic: one(topics, {
        fields: [generatedContent.topicId],
        references: [topics.id],
    }),
    attempts: many(contentAttempts),
    qualityMetrics: one(contentQuality),
}));

// ============================================================================
// CONTENT ATTEMPTS - Student interactions with generated content
// ============================================================================
export const contentAttempts = sqliteTable('content_attempts', {
    id: text('id').primaryKey().$defaultFn(generateId),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    contentId: text('content_id').references(() => generatedContent.id, { onDelete: 'cascade' }).notNull(),

    // Attempt data
    attemptData: text('attempt_data', { mode: 'json' }), // Steps taken, intermediate answers, etc.
    isCorrect: integer('is_correct', { mode: 'boolean' }),
    partialScore: real('partial_score'), // For multi-step problems (0-1)

    // Metacognition (confidence tagging)
    confidenceRating: text('confidence_rating'), // 'low', 'medium', 'high'

    // Timing
    timeSpentSeconds: integer('time_spent_seconds'),

    // Feedback
    feedbackReceived: text('feedback_received', { mode: 'json' }), // Hints used, explanations shown

    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
    userIdx: index('content_attempts_user_idx').on(table.userId),
    contentIdx: index('content_attempts_content_idx').on(table.contentId),
}));

export const contentAttemptsRelations = relations(contentAttempts, ({ one }) => ({
    user: one(users, {
        fields: [contentAttempts.userId],
        references: [users.id],
    }),
    content: one(generatedContent, {
        fields: [contentAttempts.contentId],
        references: [generatedContent.id],
    }),
}));

// ============================================================================
// CONTENT QUALITY METRICS - Aggregate quality tracking per content item
// ============================================================================
export const contentQuality = sqliteTable('content_quality', {
    id: text('id').primaryKey().$defaultFn(generateId),
    contentId: text('content_id').references(() => generatedContent.id, { onDelete: 'cascade' }).notNull().unique(),

    // Usage metrics
    totalAttempts: integer('total_attempts').default(0),
    successRate: real('success_rate'), // 0-1
    avgTimeSeconds: real('avg_time_seconds'),

    // Calibration metrics
    overconfidenceRate: real('overconfidence_rate'), // % who were confident but wrong
    underconfidenceRate: real('underconfidence_rate'), // % who were not confident but right

    // Flags
    flaggedForReview: integer('flagged_for_review', { mode: 'boolean' }).default(false),
    flagReason: text('flag_reason'),

    lastCalculated: integer('last_calculated', { mode: 'timestamp' }),
});

export const contentQualityRelations = relations(contentQuality, ({ one }) => ({
    content: one(generatedContent, {
        fields: [contentQuality.contentId],
        references: [generatedContent.id],
    }),
}));

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Content types supported by the generation system
 */
export type ContentType =
    | 'free_form_symbolic'      // Free-form symbolic input with equivalence checking
    | 'faded_worked_example'    // Scaffolded worked examples (3 levels)
    | 'parsons_problem'         // Drag-and-drop proof ordering
    | 'line_by_line'            // Step-by-step with CAS validation
    | 'graphical_manipulation'  // Interactive visual problems
    | 'counter_example'         // Counter-example generation
    | 'error_spotting'          // Find the mistake
    | 'confidence_tagged';      // Any problem with confidence tagging

/**
 * Content structures for each type (stored in generated_content.content)
 */
export interface FreeFormSymbolicContent {
    problem: string;           // LaTeX problem statement
    problemMath?: string;      // Optional KaTeX-only expression
    expectedAnswer: string;    // Expected answer (for equivalence checking)
    alternativeForms?: string[]; // Alternative correct forms
    hints?: string[];          // Progressive hints
    explanation?: string;      // Solution explanation
}

export interface FadedWorkedExampleContent {
    problem: string;
    solutionSteps: Array<{
        content: string;       // Step content (LaTeX)
        explanation?: string;  // Why this step
    }>;
    levels: Array<{
        level: number;
        prefilledSteps: number[];  // Indices of pre-filled steps
        studentSteps: number[];    // Indices student must complete
    }>;
    hints?: string[];
}

export interface ParsonsContent {
    problemStatement: string;
    correctOrder: string[];      // Steps in correct order
    distractorSteps?: string[];  // Wrong steps to include
    explanation: string;         // Why this order is correct
}

export interface ErrorSpottingContent {
    problem: string;
    solution: Array<{
        line: number;
        content: string;
        isError: boolean;
    }>;
    errorLine: number;
    errorType: string;           // 'sign_error', 'domain_error', etc.
    explanation: string;
    correctLine: string;
}

export interface GraphicalContent {
    problemType: string;         // 'vector_orthogonal', 'tangent_line', etc.
    initialState: Record<string, unknown>;
    successCondition: Record<string, unknown>;
    hints?: string[];
}

export interface CounterExampleContent {
    falseConjecture: string;
    inputFields: Array<{
        name: string;
        type: string;            // 'expression', 'point', 'function'
        placeholder?: string;
    }>;
    validationRules: Record<string, unknown>;
    hints?: string[];
    exampleSolution?: string;
}
