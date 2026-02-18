# AI Study Plan Feature

## Overview

The AI Study Plan analyzes uploaded course exams using **Anthropic Claude** (Sonnet 4) to generate a detailed, personalized study roadmap for each course.

When a student visits a course page, the system:
1. Loads the **10 most recent** exams from the database
2. Sends **up to 3 exam PDFs + 2 solution PDFs** directly to Claude (native PDF support)
3. Describes remaining exams as text metadata
4. Generates a structured study plan with topic importance, weekly schedule, and strategy
5. Caches the result for 24 hours

## Architecture

```
  Course Page (Server Component)              StudyPlan (Client Component)
  /courses/[code]/page.tsx                     StudyPlan.tsx
  ┌──────────────────────┐                    ┌──────────────────────┐
  │ getCourseByCode()    │───── data prop ────▶│ Loading animation    │
  │ getCourseExams(10)   │                    │ generateStudyPlan()  │──┐
  │ getTopics()          │                    │ Radar chart          │  │
  └──────────────────────┘                    │ Priority list        │  │
                                              │ Study timeline       │  │
                                              └──────────────────────┘  │
                                                                        │
  AI Server Action                                                      │
  app/actions/ai.ts                                                    ◀┘
  ┌──────────────────────────────────────────────┐
  │  1. Check in-memory cache (24h TTL)          │
  │  2. Load up to 3 PDFs + 2 solutions as base64│
  │  3. Describe remaining exams as metadata text │
  │  4. Call Claude claude-sonnet-4-20250514               │
  │  5. Parse JSON response                      │
  │  6. Cache result, return to client            │
  └──────────────────────────────────────────────┘
```

## Rate Limit Strategy

Your Anthropic plan has a **30,000 input tokens/minute** limit.

| PDF Type | Count Sent | Approx. Tokens |
|----------|-----------|----------------|
| Exam PDFs | max 3 | ~3,000–5,000 each |
| Solution PDFs | max 2 | ~3,000–5,000 each |
| Text metadata | remaining exams | ~50 each |
| **Total** | | **≈ 15,000–25,000** ✅ |

The 3 most recent exams are prioritized because they best reflect current testing patterns.

## Caching

| Aspect | Detail |
|--------|--------|
| **Cache key** | `study-plan:{courseCode}:{md5(examPaths)}` |
| **TTL** | 24 hours |
| **Storage** | In-memory `Map` |
| **Invalidation** | Automatic when exam list changes |
| **Cost saving** | Only first visit costs API tokens |

## File Structure

| File | Role |
|------|------|
| `app/actions/ai.ts` | Core AI module — PDF loading, Claude API, caching |
| `app/actions/courses.ts` | DB queries (getCourseExams defaults to 10) |
| `app/(dashboard)/courses/[code]/page.tsx` | Server page, data fetching |
| `components/dashboard/StudyPlan.tsx` | Client UI with charts and animations |
| `tests/integration/ai-feature.test.ts` | Integration tests |

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | API key from console.anthropic.com |
| `DATABASE_URL` | Yes | Path to SQLite DB (`file:./qmath.db`) |

## What the Student Sees

1. **Source Material** section showing loaded exams with dates and solution badges
2. **Loading animation** with step-by-step progress (5 steps)
3. **Strategy banner** — gradient header with AI-generated strategy text
4. **Radar chart** — topic importance visualization
5. **Priority breakdown** — sortable list with importance bars and reasoning
6. **Study timeline** — week-by-week recommended activities
7. **Status badges** — shows if result is cached + number of PDFs analyzed

## API Response

```json
{
  "areas": [
    { "name": "Eigenvalues", "importance": 10, "reasoning": "Task 5 in every exam", "recommended_focus": "High" }
  ],
  "study_schedule": [
    { "week": 1, "focus": "Matrix operations", "activity": "Practice determinants and inverses" }
  ],
  "strategy": "Focus on eigenvalues first...",
  "cached": false,
  "generatedAt": "2026-02-17T19:30:00Z",
  "examsAnalyzed": 3
}
```

## Testing

```bash
npm run test:ai
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Generic study plan only | `ANTHROPIC_API_KEY` not set or expired | Check `.env.local` |
| Rate limit error (429) | Too many tokens sent | Reduce `MAX_EXAM_PDFS_PER_REQUEST` in `ai.ts` |
| "Failed to generate" | API error or parse failure | Check server terminal logs |
| Stale results | 24h cache | Restart dev server or wait for TTL |
