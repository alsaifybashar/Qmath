# Changelog

All notable changes to Qmath are documented here.

---

## [Unreleased] — Persistent AI Exam Analysis Cache

### Summary
AI exam analysis results are now stored in SQLite and survive server restarts. Claude is only called when a new exam is uploaded for a course — eliminating redundant API costs at scale.

---

### Problem Solved

Previously, `generateExamAnalysis()` used an **in-memory Map** with a 24-hour TTL. This cache was lost on every server restart or deployment, causing Claude to be called repeatedly for courses whose exam data had not changed — burning API budget unnecessarily.

---

### What Changed

#### New Database Table — `course_exam_analysis_cache`

A new SQLite table persists AI results keyed by `(course_code, exam_fingerprint)`.

| Column | Type | Description |
|---|---|---|
| `id` | TEXT (PK) | UUID |
| `course_code` | TEXT | e.g. `"TATA24"` |
| `exam_fingerprint` | TEXT | MD5 of sorted `filePath\|year` strings |
| `analysis_json` | TEXT | Full `AIExamAnalysisResult` as JSON |
| `exams_analyzed` | INTEGER | Mirror of `AIExamAnalysisResult.examsAnalyzed` |
| `created_at` | INTEGER | Unix timestamp |
| `updated_at` | INTEGER | Updated on each fresh Claude write |

A compound index on `(course_code, exam_fingerprint)` ensures O(1) cache lookups.

#### Two-Layer Cache Architecture

```
Student request
    │
    ▼
L1: In-memory Map (examAnalysisCache)
    │  Hit → return in < 1ms
    │  Miss ↓
    ▼
L2: SQLite DB (course_exam_analysis_cache)
    │  Hit → return in ~5ms, promote to L1
    │  Miss ↓
    ▼
Claude API (claude-sonnet-4-20250514)
    │  ~15–30 seconds, ~6000 output tokens
    │  On success:
    ├─ Write to L1 (in-memory, 24h TTL)
    └─ Write to L2 (SQLite, permanent until invalidated)
```

#### Exam Fingerprinting

The fingerprint is an MD5 hash (first 12 hex chars) of all exam `filePath|year` pairs, sorted and joined. It changes when and only when the exam set for a course changes:

```
fingerprint = MD5( sort([ "uploads/exams/TATA24/TEN1_2024.pdf|2024",
                          "uploads/exams/TATA24/TEN1_2023.pdf|2023" ]).join(";") ).slice(0, 12)
```

#### Cache Invalidation

When an admin uploads a new exam via `POST /api/admin/upload-exam`:

1. The exam is saved to disk and inserted into the `exams` table (existing behaviour).
2. `invalidateExamAnalysisCache(courseCode)` is called immediately after.
3. This deletes all `course_exam_analysis_cache` rows for that `courseCode` **and** clears matching L1 entries.
4. The next student who visits exam analysis for that course triggers a fresh Claude call with the new PDF included.

---

### Files Modified

| File | Change |
|---|---|
| `db/schema.ts` | Added `courseExamAnalysisCache` table definition |
| `app/actions/ai.ts` | Added `readDbCache()`, `writeDbCache()`, `invalidateExamAnalysisCache()`; modified `generateExamAnalysis()` to use L1+L2 |
| `app/api/admin/upload-exam/route.ts` | Added `invalidateExamAnalysisCache(courseCode)` call after exam insert |

### Files Added

| File | Purpose |
|---|---|
| `tests/unit/exam-cache.test.ts` | 27 unit + security tests for the cache feature |

---

### Security Notes (Agent B Audit)

| Risk | Mitigation |
|---|---|
| **SQL injection via courseCode** | `courseCode` is always `.toUpperCase()`-d from validated form input; used in parameterized Drizzle ORM queries — no string interpolation into SQL |
| **SQL injection via fingerprint** | Fingerprint is MD5 output — always 12 hex chars `[a-f0-9]`, never contains SQL metacharacters |
| **IDOR — user A reading user B's course data** | `getExamAnalysis()` performs enrollment check before reaching the cache. Unenrolled users receive `{ error: 'Not enrolled in this course' }` and never hit the cache read path |
| **XSS via cached strategy/topic text** | `analysisJson` is stored as a plain string and parsed with `JSON.parse()`. The UI renders it as React text nodes — no `dangerouslySetInnerHTML` |
| **Cache poisoning** | Cache is only written after a successful Claude API response that passes `parseExamAnalysisJson()`. Malformed responses fall through to the fallback and are never cached |
| **Stale data after exam upload** | `invalidateExamAnalysisCache()` is called synchronously in the upload handler before the success response — guaranteed freshness on next analysis request |

---

### How to Use

#### As a student
No change in behaviour — the exam analysis page works identically. Cached results load in ~5ms instead of ~20s. The `aiAnalysis.cached` field in the response will be `true` when served from cache.

#### As an admin
1. Go to the admin exam upload panel.
2. Upload a new PDF for any course (e.g. TATA24).
3. The system automatically invalidates the cached analysis for that course.
4. The next student to open the exam analysis tab for TATA24 will trigger a fresh Claude analysis that includes the new exam.

#### Running the tests
```bash
# Ensure you're on Node v22 (the version Next.js uses):
nvm use 22

# Run the cache test suite:
npx tsx tests/unit/exam-cache.test.ts
```

Expected output: `Results: 27 passed, 0 failed`

---

### Cost Impact

Before this change: Claude API called on **every server restart** per course (potentially many times per day in development).

After this change: Claude API called **once per new exam upload** per course. In a stable production environment with infrequent uploads, this reduces Claude API calls from O(restarts × courses) to O(new uploads).
