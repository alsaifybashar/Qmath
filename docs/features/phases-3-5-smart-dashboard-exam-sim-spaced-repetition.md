# Phases 3-5: Smart Dashboard, Exam Simulation & Spaced Repetition

This document covers the implementation details, usage guides, and architecture of Phases 3, 4, and 5 of the Qmath AI integration plan.

---

## Table of Contents

1. [Phase 3: Smart Dashboard](#phase-3-smart-dashboard)
2. [Phase 4: Exam Simulation](#phase-4-exam-simulation)
3. [Phase 5: Spaced Repetition Notifications](#phase-5-spaced-repetition-notifications)
4. [Architecture Overview](#architecture-overview)
5. [Security Model](#security-model)
6. [Testing](#testing)

---

## Phase 3: Smart Dashboard

### Overview

The Smart Dashboard provides algorithmic insights about the student's learning progress — all at **zero AI cost**. Every calculation is done via database queries and arithmetic.

### Features

| Feature | Description |
|---------|-------------|
| **Exam Readiness** | Per-course readiness percentage, estimated grade, topic breakdown with trends |
| **Smart Insights** | Contextual warnings (declining topics), tips (error patterns), milestones, consistency tracking |
| **Study Patterns** | Most productive day/hour, average session length, consistency score |

### API Reference

#### `getExamReadiness(): Promise<ExamReadiness[]>`

Returns an array of readiness objects per enrolled course.

```typescript
interface ExamReadiness {
    courseId: string;
    courseName: string;
    courseCode: string;
    overallReadiness: number;       // 0-100
    topicBreakdown: TopicBreakdown[];
    weakestTopics: string[];        // top 3
    strongestTopics: string[];      // top 3
    estimatedGrade: string;         // e.g. "B+"
    studyTimeThisWeek: number;      // minutes
    questionsThisWeek: number;
}
```

#### `getDashboardInsights(): Promise<DashboardInsight[]>`

Returns prioritized insights sorted by priority (1-10).

| Insight Type | Trigger Condition | Priority |
|-------------|-------------------|----------|
| Declining topics | Mastery ≥ 3 but recent accuracy < 50% (≥3 attempts) | 9 |
| Topics due for review | `nextReviewDate` ≤ now | 8 |
| Consistency tip | Studied ≤ 2 days this week | 7 |
| Error pattern | >50% computational or >40% conceptual errors | 6-7 |
| Mastery milestone | Reached 5, 10, 25, 50, or 100 mastered topics | 4 |
| Consistency praise | Studied ≥ 5 days this week | 3 |

#### `getStudyPatterns(): Promise<StudyPattern | null>`

```typescript
interface StudyPattern {
    mostProductiveDay: string;        // e.g. "Wednesday"
    mostProductiveHour: number;       // 0-23
    averageSessionMinutes: number;
    consistencyScore: number;         // 0-100 (activeDays/30)
    activeDays: number;               // last 30 days
}
```

### Components

| Component | Location | Description |
|-----------|----------|-------------|
| `ExamReadinessBar` | `components/dashboard/ExamReadinessBar.tsx` | Animated progress bar with expandable topic breakdown |
| `InsightCards` | `components/dashboard/InsightCards.tsx` | Priority-sorted insight cards with action buttons |
| `StudyPatternCard` | `components/dashboard/InsightCards.tsx` | Grid showing study habit analytics |

### How to Use

The Smart Dashboard features are automatically displayed on the `/dashboard` page when a user is authenticated. No configuration is needed. The data refreshes on each page load.

---

## Phase 4: Exam Simulation

### Overview

Simulates timed exams with intelligent question selection and provides detailed post-exam analysis — all at **zero AI cost**.

### Features

| Feature | Description |
|---------|-------------|
| **Configurable Exams** | Choose course, duration (60-180 min), question count, difficulty, weak-topic focus |
| **Adaptive Selection** | Questions selected based on mastery level, difficulty, and topic diversity |
| **Timed Interface** | Countdown timer, question navigation, answer flagging |
| **Detailed Breakdown** | Score, grade, per-topic accuracy, time analysis, improvement suggestions |

### API Reference

#### `generateExamSimulation(config: ExamSimConfig): Promise<ExamSimulation | { error: string }>`

```typescript
interface ExamSimConfig {
    courseId: string;
    duration: number;         // 60, 90, 120, or 180 minutes
    questionCount: number;    // 15, 25, or 40
    difficulty: 'adaptive' | 'easy' | 'medium' | 'hard';
    focusWeakTopics: boolean;
}
```

**Selection algorithm:**
1. Fetches all questions for the course
2. Scores each question based on:
   - **Adaptive difficulty**: questions matching student mastery get higher score
   - **Hard mode**: higher difficulty → higher score
   - **Easy mode**: lower difficulty → higher score
   - **Weak topic focus**: +2 score boost for topics with mastery < 50%
3. Sorts by score, picks top N ensuring topic diversity (max per topic = `ceil(count/topics) + 1`)

**Points per difficulty:**

| Difficulty | Points |
|-----------|--------|
| 1 (Easy) | 2 |
| 2 | 3 |
| 3 (Medium) | 5 |
| 4 | 7 |
| 5 (Hard) | 10 |

#### `generateExamBreakdown(simulation, answers, totalTimeTakenMs): Promise<ExamResult>`

Returns detailed results including:
- Overall score percentage and estimated grade
- Per-question grading (case-insensitive, whitespace-trimmed)
- Topic performance sorted by accuracy (weakest first)
- Algorithmic insights (time management, hard-question performance, weakest areas)
- Improvement suggestions (weak topics, slow questions, easy misses)

### Grade Scale

| Percentage | Grade |
|-----------|-------|
| ≥90% | A |
| ≥85% | A- |
| ≥80% | B+ |
| ≥75% | B |
| ≥70% | B- |
| ≥65% | C+ |
| ≥60% | C |
| ≥55% | C- |
| ≥50% | D |
| <50% | F |

### How to Use

1. Navigate to `/exam-sim`
2. Select a course, duration, question count, and difficulty
3. Click **Start Simulation**
4. Answer questions within the time limit (use flag ⚑ to mark uncertain ones)
5. Submit and review your detailed breakdown

---

## Phase 5: Spaced Repetition Notifications

### Overview

An SM-2 inspired spaced repetition system that schedules reviews based on performance, with a notification dashboard widget and a dedicated review page.

### Interval Schedule

Based on **consecutive correct answers**:

| Consecutive Correct | Review Interval |
|--------------------|----------------|
| 0 | 1 day |
| 1 | 2 days |
| 2 | 4 days |
| 3 | 1 week |
| 4 | 2 weeks |
| 5 | 1 month |
| 6 | 2 months |
| 7+ | 4 months |

**On wrong answer:** consecutive count is halved (e.g., 6 → 3), moving the topic back in the schedule. This prevents complete reset while still reinforcing struggling areas.

**Review completion threshold:** 80%+ accuracy in a review session counts as "correct" for scheduling.

### API Reference

#### `updateReviewSchedule(topicId: string, isCorrect: boolean): Promise<void>`

Called automatically after each answer submission. Updates `consecutiveCorrect` and `nextReviewDate` in the database.

#### `getReviewNotifications(): Promise<NotificationSummary>`

```typescript
interface NotificationSummary {
    overdue: number;     // Past due
    dueToday: number;    // Due today
    upcoming: number;    // Due within 3 days
    total: number;
    notifications: ReviewNotification[];  // Sorted by priority
}
```

**Urgency classification:**

| Urgency | Condition | Base Priority |
|---------|-----------|--------------|
| Overdue | `nextReviewDate` < today start | 9 |
| Due Today | `nextReviewDate` within today | 7 |
| Upcoming | `nextReviewDate` within 3 days | 5 |

Priority gets +1 if mastery level < 3 (max 10).

**Suggested actions based on mastery:**

| Mastery Level | Suggested Action |
|--------------|-----------------|
| 0-1 | Full practice session (15+ questions) |
| 2-3 | Focused review (10 questions) |
| 4-5 | Quick refresher (3 questions) |

#### `snoozeReview(masteryId: string): Promise<void>`

Bumps the topic's next review date by 24 hours.

#### `completeReview(topicId, questionsCorrect, totalQuestions): Promise<void>`

Marks a review complete. If accuracy ≥ 80%, the consecutive correct count increases; otherwise it halves.

### Components

| Component | Location | Description |
|-----------|----------|-------------|
| `ReviewWidget` | `components/dashboard/ReviewNotifications.tsx` | Dashboard widget with bell badge + top 3 reviews |
| `NotificationsPage` | `components/dashboard/ReviewNotifications.tsx` | Full page with grouped notifications, snooze/review actions |

### How to Use

- **Dashboard**: The Review Widget appears automatically when there are topics due for review. Click any topic to start a review session, or "View All" to see the full list.
- **Notifications page**: Navigate to `/notifications` to see all due, today, and upcoming reviews. Use the snooze button (⏰) to postpone by 1 day, or the book icon (📖) to start reviewing.
- **Automatic scheduling**: Reviews are scheduled automatically every time you answer a question. No manual setup needed.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Dashboard Page                     │
│   /dashboard                                         │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐│
│  │ExamReadiness │  │  InsightCards │  │ ReviewWidget ││
│  │    Bars      │  │              │  │   (Phase 5)  ││
│  │  (Phase 3)   │  │  (Phase 3)   │  │              ││
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘│
│         │                 │                  │        │
├─────────┴─────────────────┴──────────────────┴────────┤
│               Server Actions (Zero AI Cost)           │
├───────────────────────────────────────────────────────┤
│                                                       │
│  dashboard-insights.ts  │  notification-engine.ts     │
│  ├─ getExamReadiness()  │  ├─ updateReviewSchedule()  │
│  ├─ getDashboardInsights│  ├─ getReviewNotifications()│
│  └─ getStudyPatterns()  │  ├─ snoozeReview()          │
│                         │  └─ completeReview()        │
│  exam-sim.ts            │                             │
│  ├─ generateExamSim()   │  engine.ts (modified)       │
│  └─ generateBreakdown() │  └─ submitAnswer() → SR     │
│                         │                             │
├─────────────────────────┴─────────────────────────────┤
│              Database (SQLite via Drizzle)             │
│  userTopicMastery (+ nextReviewDate,consecutiveCorrect│
│  questionAttempts, studySessions, enrollments, etc.    │
└───────────────────────────────────────────────────────┘
```

### Data Flow

1. **Answer submission** (`engine.ts`) → updates mastery → triggers `updateReviewSchedule()` (Phase 5, async)
2. **Dashboard load** → parallel fetch: exam readiness, insights, study patterns, review notifications
3. **Exam simulation** → config → question selection algorithm → timed exam → breakdown analysis

---

## Security Model

| Concern | Mitigation |
|---------|-----------|
| **Authentication** | All server actions verify `auth()` session before any DB access |
| **Authorization (IDOR)** | All queries filter by `userId` from session — never from client input |
| **SQL Injection** | Drizzle ORM uses parameterized queries exclusively |
| **XSS** | React auto-escapes text content; no `dangerouslySetInnerHTML` usage |
| **Input Bounds** | Session duration capped at 180 min; question count capped to available |
| **Prototype Pollution** | `JSON.parse()` in Node.js does not pollute prototypes |

---

## Testing

Tests are located in `tests/integration/phases-3-5.test.ts`.

**71 tests across 4 categories:**

| Category | Tests | Coverage |
|----------|-------|----------|
| Phase 3: Dashboard Insights | 22 | Grade estimation, declining topics, error patterns, study analytics, readiness edge cases |
| Phase 4: Exam Simulation | 19 | Question selection, diversity, scoring, grading, time analysis, insight generation |
| Phase 5: Spaced Repetition | 21 | SM-2 intervals, wrong answer reset, urgency classification, priority, suggested actions, snooze, completion threshold |
| Security | 9 | XSS, SQLi architecture, IDOR prevention, input sanitization, prototype pollution, ID uniqueness |

Run tests:

```bash
npx vitest run tests/integration/phases-3-5.test.ts
```
