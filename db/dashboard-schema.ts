import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import crypto from 'crypto';
import { users, courses, topics, questions } from './schema';

const generateId = () => crypto.randomUUID();

// ============================================================================
// STUDY SESSIONS - Track individual study periods with Pomodoro support
// ============================================================================
export const studySessions = sqliteTable('study_sessions', {
    id: text('id').primaryKey().$defaultFn(generateId),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    courseId: text('course_id').references(() => courses.id, { onDelete: 'set null' }),
    startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
    endedAt: integer('ended_at', { mode: 'timestamp' }),
    sessionType: text('session_type').notNull(), // 'pomodoro', 'free', 'exam_sim'
    topicId: text('topic_id').references(() => topics.id, { onDelete: 'set null' }),
    source: text('source').default('study'), // which surface started the session, e.g. 'study'
    focusScore: real('focus_score'), // 0.0 - 1.0 calculated from activity patterns
    breaksTaken: integer('breaks_taken').default(0),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// QUESTION ATTEMPTS - Enhanced version with error tracking and reflection
// ============================================================================
export const questionAttempts = sqliteTable('question_attempts', {
    id: text('id').primaryKey().$defaultFn(generateId),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    sessionId: text('session_id').references(() => studySessions.id, { onDelete: 'set null' }),
    questionId: text('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
    topicId: text('topic_id').notNull().references(() => topics.id, { onDelete: 'cascade' }),
    difficultyLevel: integer('difficulty_level').notNull(), // 1-5
    startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
    completedAt: integer('completed_at', { mode: 'timestamp' }),
    isCorrect: integer('is_correct', { mode: 'boolean' }).notNull(),
    attempts: integer('attempts').default(1), // Number of tries
    hintsUsed: integer('hints_used').default(0),
    errorType: text('error_type'), // 'conceptual', 'procedural', 'computational', 'interpretation', 'notation', 'incomplete', 'time_pressure'
    confidenceBefore: integer('confidence_before'), // 1-5 rating before answering
    reflectionText: text('reflection_text'), // Student's reflection on the error
    xpEarned: integer('xp_earned').default(0),
    timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// USER TOPIC MASTERY - Enhanced with spaced repetition
// ============================================================================
export const userTopicMastery = sqliteTable('user_topic_mastery', {
    id: text('id').primaryKey().$defaultFn(generateId),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    topicId: text('topic_id').notNull().references(() => topics.id, { onDelete: 'cascade' }),
    masteryLevel: integer('mastery_level').default(0), // 0-5 (not started, familiar, practicing, competent, skilled, master)
    totalAttempts: integer('total_attempts').default(0),
    correctAttempts: integer('correct_attempts').default(0),
    lastPracticedAt: integer('last_practiced_at', { mode: 'timestamp' }),
    nextReviewDate: integer('next_review_date', { mode: 'timestamp' }), // For spaced repetition
    consecutiveCorrect: integer('consecutive_correct').default(0), // For spaced repetition interval calculation
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// USER STREAKS - Daily study streak tracking with freeze days
// ============================================================================
export const userStreaks = sqliteTable('user_streaks', {
    userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    currentStreak: integer('current_streak').default(0),
    longestStreak: integer('longest_streak').default(0),
    lastStudyDate: integer('last_study_date', { mode: 'timestamp' }),
    freezeDaysAvailable: integer('freeze_days_available').default(2), // Reset monthly
    freezeDaysUsed: integer('freeze_days_used').default(0),
    freezeDaysResetAt: integer('freeze_days_reset_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    totalStudyDays: integer('total_study_days').default(0),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// USER ACHIEVEMENTS - Gamification achievements
// ============================================================================
export const userAchievements = sqliteTable('user_achievements', {
    id: text('id').primaryKey().$defaultFn(generateId),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    achievementId: text('achievement_id').notNull(), // e.g., 'first_mastery', 'streak_7', 'comeback'
    category: text('category').notNull(), // 'learning', 'habits', 'growth'
    earnedAt: integer('earned_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    metadata: text('metadata', { mode: 'json' }), // Additional context (e.g., which topic, streak count)
});

// ============================================================================
// USER CITY - Gamification city state per course
// ============================================================================
export const userCity = sqliteTable('user_city', {
    id: text('id').primaryKey().$defaultFn(generateId),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    courseId: text('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
    cityLevel: integer('city_level').default(1), // 1-7
    totalXp: integer('total_xp').default(0),
    buildings: text('buildings', { mode: 'json' }).$defaultFn(() => JSON.stringify({})), // { "library": 2, "observatory": 1, ... }
    weather: text('weather').default('sunny'), // 'sunny', 'cloudy', 'rainy'
    lastUpdated: integer('last_updated', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// USER GOALS - Personalized learning goals
// ============================================================================
export const userGoals = sqliteTable('user_goals', {
    id: text('id').primaryKey().$defaultFn(generateId),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // 'grade', 'mastery', 'habit'
    description: text('description').notNull(),
    targetValue: text('target_value'), // e.g., "C", "95%", "5 days"
    targetDate: integer('target_date', { mode: 'timestamp' }),
    progress: integer('progress').default(0), // 0-100
    completed: integer('completed', { mode: 'boolean' }).default(false),
    completedAt: integer('completed_at', { mode: 'timestamp' }),
    metadata: text('metadata', { mode: 'json' }), // Topic IDs, course IDs, etc.
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// USER PERSONAL RECORDS - Track personal bests
// ============================================================================
export const userPersonalRecords = sqliteTable('user_personal_records', {
    userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    longestStreak: integer('longest_streak').default(0),
    mostProblemsOneDay: integer('most_problems_one_day').default(0),
    fastestMasteryDays: integer('fastest_mastery_days'),
    fastestMasteryTopic: text('fastest_mastery_topic'),
    highestAccuracySession: real('highest_accuracy_session').default(0),
    highestAccuracyDate: integer('highest_accuracy_date', { mode: 'timestamp' }),
    totalXpEarned: integer('total_xp_earned').default(0),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const studySessionsRelations = relations(studySessions, ({ one, many }) => ({
    user: one(users, {
        fields: [studySessions.userId],
        references: [users.id],
    }),
    course: one(courses, {
        fields: [studySessions.courseId],
        references: [courses.id],
    }),
    questionAttempts: many(questionAttempts),
}));

export const questionAttemptsRelations = relations(questionAttempts, ({ one }) => ({
    user: one(users, {
        fields: [questionAttempts.userId],
        references: [users.id],
    }),
    session: one(studySessions, {
        fields: [questionAttempts.sessionId],
        references: [studySessions.id],
    }),
    question: one(questions, {
        fields: [questionAttempts.questionId],
        references: [questions.id],
    }),
    topic: one(topics, {
        fields: [questionAttempts.topicId],
        references: [topics.id],
    }),
}));

export const userTopicMasteryRelations = relations(userTopicMastery, ({ one }) => ({
    user: one(users, {
        fields: [userTopicMastery.userId],
        references: [users.id],
    }),
    topic: one(topics, {
        fields: [userTopicMastery.topicId],
        references: [topics.id],
    }),
}));

export const userStreaksRelations = relations(userStreaks, ({ one }) => ({
    user: one(users, {
        fields: [userStreaks.userId],
        references: [users.id],
    }),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
    user: one(users, {
        fields: [userAchievements.userId],
        references: [users.id],
    }),
}));

export const userCityRelations = relations(userCity, ({ one }) => ({
    user: one(users, {
        fields: [userCity.userId],
        references: [users.id],
    }),
    course: one(courses, {
        fields: [userCity.courseId],
        references: [courses.id],
    }),
}));

export const userGoalsRelations = relations(userGoals, ({ one }) => ({
    user: one(users, {
        fields: [userGoals.userId],
        references: [users.id],
    }),
}));

export const userPersonalRecordsRelations = relations(userPersonalRecords, ({ one }) => ({
    user: one(users, {
        fields: [userPersonalRecords.userId],
        references: [users.id],
    }),
}));

// ============================================================================
// FLASHCARD DECKS
// ============================================================================
export const flashcardDecks = sqliteTable('flashcard_decks', {
    id: text('id').primaryKey().$defaultFn(generateId),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    color: text('color').default('blue'), // tailwind colour token used by the UI
    topicId: text('topic_id').references(() => topics.id, { onDelete: 'set null' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// FLASHCARDS - card content + source context
// ============================================================================
export const flashcards = sqliteTable('flashcards', {
    id: text('id').primaryKey().$defaultFn(generateId),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    deckId: text('deck_id').notNull().references(() => flashcardDecks.id, { onDelete: 'cascade' }),
    topicId: text('topic_id').references(() => topics.id, { onDelete: 'set null' }),
    type: text('type').notNull().default('basic'), // 'basic' | 'image_occlusion'
    front: text('front'),
    back: text('back'),
    frontMath: text('front_math'),
    backMath: text('back_math'),
    imageUrl: text('image_url'),
    occlusionMasks: text('occlusion_masks', { mode: 'json' }), // [{ x, y, w, h, label? }] (0-1 coords)
    sourceContextType: text('source_context_type').default('manual'), // 'manual' | 'question' | 'article' | 'ai_draft'
    sourceContextId: text('source_context_id'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// FLASHCARD CARD STATE - denormalised FSRS state (1:1 with flashcards)
// ============================================================================
export const flashcardCardState = sqliteTable('flashcard_card_state', {
    cardId: text('card_id').primaryKey().references(() => flashcards.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    stability: real('stability').default(0),
    difficulty: real('difficulty').default(0),
    elapsedDays: real('elapsed_days').default(0),
    scheduledDays: real('scheduled_days').default(0),
    reps: integer('reps').default(0),
    lapses: integer('lapses').default(0),
    state: text('state').notNull().default('new'), // 'new' | 'learning' | 'review' | 'relearning'
    lastReview: integer('last_review', { mode: 'timestamp' }),
    nextReview: integer('next_review', { mode: 'timestamp' }).notNull(),
});

// ============================================================================
// FLASHCARD REVIEWS - immutable append-only log
// ============================================================================
export const flashcardReviews = sqliteTable('flashcard_reviews', {
    id: text('id').primaryKey().$defaultFn(generateId),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    cardId: text('card_id').notNull().references(() => flashcards.id, { onDelete: 'cascade' }),
    reviewedAt: integer('reviewed_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    rating: integer('rating').notNull(), // 1=Again, 2=Hard, 3=Good, 4=Easy
    elapsedDays: real('elapsed_days').notNull(),
    scheduledDays: real('scheduled_days').notNull(),
    stability: real('stability').notNull(),
    difficulty: real('difficulty').notNull(),
    state: text('state').notNull(),
    lapses: integer('lapses').notNull(),
});

// ============================================================================
// FLASHCARD RELATIONS
// ============================================================================

export const flashcardDecksRelations = relations(flashcardDecks, ({ one, many }) => ({
    user: one(users, { fields: [flashcardDecks.userId], references: [users.id] }),
    topic: one(topics, { fields: [flashcardDecks.topicId], references: [topics.id] }),
    cards: many(flashcards),
}));

export const flashcardsRelations = relations(flashcards, ({ one, many }) => ({
    user: one(users, { fields: [flashcards.userId], references: [users.id] }),
    deck: one(flashcardDecks, { fields: [flashcards.deckId], references: [flashcardDecks.id] }),
    topic: one(topics, { fields: [flashcards.topicId], references: [topics.id] }),
    state: one(flashcardCardState, { fields: [flashcards.id], references: [flashcardCardState.cardId] }),
    reviews: many(flashcardReviews),
}));

export const flashcardCardStateRelations = relations(flashcardCardState, ({ one }) => ({
    card: one(flashcards, { fields: [flashcardCardState.cardId], references: [flashcards.id] }),
    user: one(users, { fields: [flashcardCardState.userId], references: [users.id] }),
}));

export const flashcardReviewsRelations = relations(flashcardReviews, ({ one }) => ({
    card: one(flashcards, { fields: [flashcardReviews.cardId], references: [flashcards.id] }),
    user: one(users, { fields: [flashcardReviews.userId], references: [users.id] }),
}));
