import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import crypto from 'crypto';

// Helper for generating UUIDs
const generateId = () => crypto.randomUUID();

// Universities
export const universities = sqliteTable('universities', {
    id: text('id').primaryKey().$defaultFn(generateId),
    name: text('name').notNull(),
    country: text('country'),
    logoUrl: text('logo_url'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Courses
export const courses = sqliteTable('courses', {
    id: text('id').primaryKey().$defaultFn(generateId),
    universityId: text('university_id').references(() => universities.id, { onDelete: 'set null' }),
    code: text('code').notNull(),
    name: text('name').notNull(),
    nameSv: text('name_sv'), // Swedish name
    description: text('description'),
    semester: text('semester'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const coursesRelations = relations(courses, ({ one, many }) => ({
    university: one(universities, {
        fields: [courses.universityId],
        references: [universities.id],
    }),
    topics: many(topics),
    enrollments: many(enrollments),
}));

export const universitiesRelations = relations(universities, ({ many }) => ({
    courses: many(courses),
    profiles: many(profiles),
}));

// Users (Replacing auth.users)
export const users = sqliteTable('users', {
    id: text('id').primaryKey().$defaultFn(generateId),
    email: text('email').unique().notNull(),
    password: text('password'),
    name: text('name'),
    role: text('role').default('student'),
    image: text('image'), // Added image field for profile
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const usersRelations = relations(users, ({ one, many }) => ({
    profile: one(profiles),
    userMastery: many(userMastery),
    attemptLogs: many(attemptLogs),
    enrollments: many(enrollments),
}));

// Profiles
export const profiles = sqliteTable('profiles', {
    id: text('id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    universityId: text('university_id').references(() => universities.id, { onDelete: 'set null' }),
    enrollmentYear: integer('enrollment_year'),
    studyYear: integer('study_year'),
    universityProgram: text('university_program'),
    targetGpa: real('target_gpa'),
    // Math anxiety & self-efficacy (Phase 5)
    mathAnxietyLevel: integer('math_anxiety_level'), // 1-5 scale from screening
    selfEfficacyScore: integer('self_efficacy_score'), // 1-5 scale from screening
    studySkillsCompleted: integer('study_skills_completed', { mode: 'boolean' }).default(false),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const profilesRelations = relations(profiles, ({ one }) => ({
    user: one(users, {
        fields: [profiles.id],
        references: [users.id],
    }),
    university: one(universities, {
        fields: [profiles.universityId],
        references: [universities.id],
    }),
}));

// Enrollments (New table for user-course selection)
export const enrollments = sqliteTable('enrollments', {
    id: text('id').primaryKey().$defaultFn(generateId),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    courseId: text('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
    enrolledAt: integer('enrolled_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
    user: one(users, {
        fields: [enrollments.userId],
        references: [users.id],
    }),
    course: one(courses, {
        fields: [enrollments.courseId],
        references: [courses.id],
    }),
}));

// Topics
export const topics = sqliteTable('topics', {
    id: text('id').primaryKey().$defaultFn(generateId),
    courseId: text('course_id').references(() => courses.id, { onDelete: 'set null' }),
    slug: text('slug').unique().notNull(),
    title: text('title').notNull(),
    titleSv: text('title_sv'), // Swedish title
    description: text('description'),
    prerequisites: text('prerequisites', { mode: 'json' }), // Legacy JSON — prefer prerequisiteEdges table
    baseDifficulty: integer('base_difficulty'),
    engineeringContext: text('engineering_context'), // Why this topic matters in engineering
    curriculumStandardId: text('curriculum_standard_id').references(() => curriculumStandards.id, { onDelete: 'set null' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const topicsRelations = relations(topics, ({ one, many }) => ({
    course: one(courses, {
        fields: [topics.courseId],
        references: [courses.id],
    }),
    curriculumStandard: one(curriculumStandards, {
        fields: [topics.curriculumStandardId],
        references: [curriculumStandards.id],
    }),
    questions: many(questions),
    userMastery: many(userMastery),
    prerequisitesFrom: many(prerequisiteEdges, { relationName: 'prerequisiteFrom' }),
    prerequisitesTo: many(prerequisiteEdges, { relationName: 'prerequisiteTo' }),
}));

// Questions
export const questions = sqliteTable('questions', {
    id: text('id').primaryKey().$defaultFn(generateId),
    topicId: text('topic_id').references(() => topics.id, { onDelete: 'cascade' }).notNull(),
    contentMarkdown: text('content_markdown').notNull(),
    questionType: text('question_type').notNull(),
    correctAnswer: text('correct_answer').notNull(),
    options: text('options', { mode: 'json' }),
    explanationMarkdown: text('explanation_markdown'),
    difficultyTier: integer('difficulty_tier').default(1),
    strategyTag: text('strategy_tag'), // e.g. "chain_rule", "integration_by_parts" — for interleaved practice
    isPublished: integer('is_published', { mode: 'boolean' }).default(false),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const questionsRelations = relations(questions, ({ one, many }) => ({
    topic: one(topics, {
        fields: [questions.topicId],
        references: [topics.id],
    }),
    attemptLogs: many(attemptLogs),
}));

// User Mastery
export const userMastery = sqliteTable('user_mastery', {
    id: text('id').primaryKey().$defaultFn(generateId),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    topicId: text('topic_id').references(() => topics.id, { onDelete: 'cascade' }).notNull(),
    masteryProbability: real('mastery_probability').default(0.1),
    lastPracticedAt: integer('last_practiced_at', { mode: 'timestamp' }),
});

export const userMasteryRelations = relations(userMastery, ({ one }) => ({
    user: one(users, {
        fields: [userMastery.userId],
        references: [users.id],
    }),
    topic: one(topics, {
        fields: [userMastery.topicId],
        references: [topics.id],
    }),
}));

// Interaction Logs
export const attemptLogs = sqliteTable('attempt_logs', {
    id: text('id').primaryKey().$defaultFn(generateId),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    questionId: text('question_id').references(() => questions.id, { onDelete: 'set null' }),
    isCorrect: integer('is_correct', { mode: 'boolean' }).notNull(),
    timeTakenMs: integer('time_taken_ms'),
    timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const attemptLogsRelations = relations(attemptLogs, ({ one }) => ({
    user: one(users, {
        fields: [attemptLogs.userId],
        references: [users.id],
    }),
    question: one(questions, {
        fields: [attemptLogs.questionId],
        references: [questions.id],
    }),
}));

// Exams (Old Exam Archive)
export const exams = sqliteTable('exams', {
    id: text('id').primaryKey().$defaultFn(generateId),
    courseCode: text('course_code').notNull(),
    courseName: text('course_name').notNull(),
    examDate: integer('exam_date', { mode: 'timestamp' }).notNull(),
    examType: text('exam_type').notNull(), // "TEN1", "TEN2", "KON", etc.
    // Exam file
    fileName: text('file_name').notNull(),
    filePath: text('file_path').notNull(),
    fileSize: integer('file_size'), // bytes
    // Solution file (optional)
    hasSolution: integer('has_solution', { mode: 'boolean' }).default(false),
    solutionFileName: text('solution_file_name'),
    solutionFilePath: text('solution_file_path'),
    solutionFileSize: integer('solution_file_size'), // bytes
    // Metadata
    uploadedBy: text('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const examsRelations = relations(exams, ({ one }) => ({
    uploader: one(users, {
        fields: [exams.uploadedBy],
        references: [users.id],
    }),
}));

// ── Curriculum Standards (Swedish Gymnasium Matematik 1c–5) ───────────────────
// Maps the prerequisite knowledge from secondary school that university courses build on.
export const curriculumStandards = sqliteTable('curriculum_standards', {
    id: text('id').primaryKey().$defaultFn(generateId),
    code: text('code').unique().notNull(), // e.g. "gy3_trig_identities", "gy4_complex_numbers"
    level: text('level').notNull(), // gy_1c, gy_2c, gy_3c, gy_4, gy_5
    title: text('title').notNull(),
    titleSv: text('title_sv'),
    description: text('description'),
    category: text('category'), // algebra, geometry, trigonometry, calculus, statistics, proof
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const curriculumStandardsRelations = relations(curriculumStandards, ({ many }) => ({
    topics: many(topics),
}));

// ── Prerequisite Edges (Directed Graph) ──────────────────────────────────────
// Replaces the JSON-blob prerequisites field with a proper traversable graph.
// fromTopicId requires toTopicId — "to learn X, you must first know Y".
export const prerequisiteEdges = sqliteTable('prerequisite_edges', {
    id: text('id').primaryKey().$defaultFn(generateId),
    fromTopicId: text('from_topic_id').references(() => topics.id, { onDelete: 'cascade' }).notNull(),
    toTopicId: text('to_topic_id').references(() => topics.id, { onDelete: 'cascade' }).notNull(),
    strength: real('strength').default(1.0), // 0-1: how critical this prerequisite is
    edgeType: text('edge_type').default('required'), // required | recommended
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const prerequisiteEdgesRelations = relations(prerequisiteEdges, ({ one }) => ({
    fromTopic: one(topics, {
        fields: [prerequisiteEdges.fromTopicId],
        references: [topics.id],
        relationName: 'prerequisiteFrom',
    }),
    toTopic: one(topics, {
        fields: [prerequisiteEdges.toTopicId],
        references: [topics.id],
        relationName: 'prerequisiteTo',
    }),
}));

// ── Misconception Catalog ────────────────────────────────────────────────────
// Known student misconceptions with error patterns, enabling the error classifier
// to match answers to specific conceptual gaps and provide targeted remediation.
export const misconceptions = sqliteTable('misconceptions', {
    id: text('id').primaryKey().$defaultFn(generateId),
    code: text('code').unique().notNull(), // e.g. "sqrt_sum_distributive", "sign_error_negation"
    description: text('description').notNull(), // Human-readable description
    descriptionSv: text('description_sv'), // Swedish description
    affectedTopicIds: text('affected_topic_ids', { mode: 'json' }), // JSON array of topic IDs
    commonWrongPatterns: text('common_wrong_patterns', { mode: 'json' }), // JSON array of regex/string patterns
    feedbackEn: text('feedback_en'), // Specific feedback when this misconception is detected
    feedbackSv: text('feedback_sv'), // Swedish feedback
    remediationTopicId: text('remediation_topic_id').references(() => topics.id, { onDelete: 'set null' }),
    severity: text('severity').default('medium'), // low | medium | high
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const misconceptionsRelations = relations(misconceptions, ({ one }) => ({
    remediationTopic: one(topics, {
        fields: [misconceptions.remediationTopicId],
        references: [topics.id],
    }),
}));

// ── Diagnostic Results (Progressive Assessment) ──────────────────────────────
// Stores the results of onboarding screening and progressive diagnostic deepening.
export const diagnosticResults = sqliteTable('diagnostic_results', {
    id: text('id').primaryKey().$defaultFn(generateId),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    courseId: text('course_id').references(() => courses.id, { onDelete: 'set null' }),
    diagnosticType: text('diagnostic_type').notNull(), // screening | deepening
    completedAt: integer('completed_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    screeningScore: real('screening_score'), // 0-1 overall score
    detailedResults: text('detailed_results', { mode: 'json' }), // Per-topic breakdown
    gapsIdentified: text('gaps_identified', { mode: 'json' }), // Topic IDs with gaps
    learningPathGenerated: integer('learning_path_generated', { mode: 'boolean' }).default(false),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const diagnosticResultsRelations = relations(diagnosticResults, ({ one, many }) => ({
    user: one(users, {
        fields: [diagnosticResults.userId],
        references: [users.id],
    }),
    course: one(courses, {
        fields: [diagnosticResults.courseId],
        references: [courses.id],
    }),
    itemResponses: many(diagnosticItemResponses),
}));

// Individual responses within a diagnostic assessment
export const diagnosticItemResponses = sqliteTable('diagnostic_item_responses', {
    id: text('id').primaryKey().$defaultFn(generateId),
    diagnosticResultId: text('diagnostic_result_id').references(() => diagnosticResults.id, { onDelete: 'cascade' }).notNull(),
    questionId: text('question_id'),
    topicId: text('topic_id'),
    curriculumStandardId: text('curriculum_standard_id'),
    isCorrect: integer('is_correct', { mode: 'boolean' }).notNull(),
    timeTakenMs: integer('time_taken_ms'),
    confidence: integer('confidence'), // 1-5
    studentAnswer: text('student_answer'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const diagnosticItemResponsesRelations = relations(diagnosticItemResponses, ({ one }) => ({
    diagnosticResult: one(diagnosticResults, {
        fields: [diagnosticItemResponses.diagnosticResultId],
        references: [diagnosticResults.id],
    }),
}));

// ── Calibration Logs (Predict-then-Compare) ──────────────────────────────────
// Tracks students' prediction accuracy to combat overconfidence and improve metacognition.
export const calibrationLogs = sqliteTable('calibration_logs', {
    id: text('id').primaryKey().$defaultFn(generateId),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    sessionId: text('session_id'),
    topicId: text('topic_id'),
    predictedScore: integer('predicted_score').notNull(), // How many correct the student predicted
    actualScore: integer('actual_score'), // Filled after session
    totalQuestions: integer('total_questions').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const calibrationLogsRelations = relations(calibrationLogs, ({ one }) => ({
    user: one(users, {
        fields: [calibrationLogs.userId],
        references: [users.id],
    }),
}));

// ── Persistent AI Exam Analysis Cache ────────────────────────────────────────
// Survives server restarts. Keyed by (courseCode, examFingerprint).
// Invalidated when a new exam is uploaded for that courseCode.
export const courseExamAnalysisCache = sqliteTable('course_exam_analysis_cache', {
    id: text('id').primaryKey().$defaultFn(generateId),
    // Course identifier (e.g. "TATA24")
    courseCode: text('course_code').notNull(),
    // MD5 fingerprint of sorted filePaths+years — changes when exams change
    examFingerprint: text('exam_fingerprint').notNull(),
    // Full AIExamAnalysisResult serialized as JSON
    analysisJson: text('analysis_json').notNull(),
    // How many PDFs were analyzed (mirrors AIExamAnalysisResult.examsAnalyzed)
    examsAnalyzed: integer('exams_analyzed').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    // Updated whenever we write a fresh Claude result
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});
