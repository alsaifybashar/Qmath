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
}));

// Profiles
export const profiles = sqliteTable('profiles', {
    id: text('id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    universityId: text('university_id').references(() => universities.id, { onDelete: 'set null' }),
    enrollmentYear: integer('enrollment_year'),
    universityProgram: text('university_program'),
    targetGpa: real('target_gpa'),
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

// Topics
export const topics = sqliteTable('topics', {
    id: text('id').primaryKey().$defaultFn(generateId),
    courseId: text('course_id').references(() => courses.id, { onDelete: 'set null' }),
    slug: text('slug').unique().notNull(),
    title: text('title').notNull(),
    description: text('description'),
    prerequisites: text('prerequisites', { mode: 'json' }), // Stored as JSON string
    baseDifficulty: integer('base_difficulty'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const topicsRelations = relations(topics, ({ one, many }) => ({
    course: one(courses, {
        fields: [topics.courseId],
        references: [courses.id],
    }),
    questions: many(questions),
    userMastery: many(userMastery),
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
    examType: text('exam_type').notNull(), // "Midterm", "Final", "Retake"
    fileName: text('file_name').notNull(),
    filePath: text('file_path').notNull(),
    fileSize: integer('file_size'), // bytes
    hasSolution: integer('has_solution', { mode: 'boolean' }).default(false),
    uploadedBy: text('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const examsRelations = relations(exams, ({ one }) => ({
    uploader: one(users, {
        fields: [exams.uploadedBy],
        references: [users.id],
    }),
}));
