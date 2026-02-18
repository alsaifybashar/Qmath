# Changelog

All notable changes to Qmath are documented here.

---

## [Unreleased] — Course-Linked Question Bank & Admin Courses Page

### Summary
Admins can now browse all available courses (those with at least one uploaded exam), add learning topics to each course, and create practice questions with step-by-step LaTeX solutions. Students see the same course list on the archive browse page. A single source of truth — the `exams` table — drives course availability across the entire platform.

---

### Problem Solved

Previously there was no way for admins to:
1. See which courses were available in the system at a glance.
2. Add practice questions (with structured, step-by-step LaTeX solutions) to those courses.
3. Ensure that the student-facing course list and the admin course list were always in sync.

Courses existed in an isolated `courses` table that could diverge from the `exams` table. Students had no browse-all view on the archive page.

---

### What Changed

#### New Admin Page — Courses (`/admin/courses`)

- Lists every course that has at least one uploaded exam.
- Shows exam count, solution count, and latest exam date per course.
- **Add Questions** button deep-links to `/admin/questions?course=<id>`.
- **Archive** button links to the public student view `/archive/<code>`.
- **Exams** button links to the admin exam list filtered by course code.
- Includes an info banner explaining that courses are auto-created on first exam upload.

#### Enhanced Admin Page — Questions (`/admin/questions`)

Rebuilt as a 3-step workflow:

```
Step 1 — Select Course
    Displays course cards (only courses with exams)
    Deep-link from /admin/courses?course=<id> auto-selects the course

Step 2 — Select / Create Topic
    Shows existing topics as clickable chips
    Inline "New Topic" form creates a topic without leaving the page
    New topic is automatically selected after creation

Step 3 — Add Question
    Rich form: question content (LaTeX), type, difficulty, answer/options
    Multi-step solution editor (Add Step / Remove Step)
    Side-by-side live KaTeX preview for every LaTeX field
```

#### Multi-step LaTeX Solution Editor

Each question can have an unlimited number of named solution steps:

```
Step 1: [Label field]     [LaTeX content field]     [Live preview]
Step 2: [Label field]     [LaTeX content field]     [Live preview]
        [+ Add Step]
```

Steps are stored as Markdown in the `solutionMarkdown` column using the format:

```markdown
### Step 1 — Set up the integral
\int_0^1 x^2 \, dx

### Step 2 — Apply power rule
\left[ \frac{x^3}{3} \right]_0^1 = \frac{1}{3}
```

#### Updated Student Archive Page (`/archive`)

- On page load, fetches all available courses from `GET /api/courses`.
- Displays a **"All Available Courses"** browse section below the search bar.
- Browse section also appears when a search returns zero results (previously it was hidden).
- Clicking any course card navigates directly to `/archive/<courseCode>`.
- Each card shows exam count and solution count badges.

#### New API Endpoint — `GET /api/courses` (public)

Returns all courses that have at least one exam. No authentication required. Used by the student archive page. See [API reference →](./docs/api/courses-endpoints.md).

#### New API Endpoint — `GET /api/admin/courses` (admin only)

Returns the same data plus full course metadata (university ID, etc.). Protected by admin role check. Used by the admin courses page. See [API reference →](./docs/api/courses-endpoints.md).

---

### Files Modified

| File | Change |
|---|---|
| `app/admin/questions/page.tsx` | Full rewrite — 3-step course/topic/question workflow with LaTeX editor |
| `app/(dashboard)/archive/page.tsx` | Added course browse list; fixed `showBrowse` logic; extracted `CourseCard` |
| `components/AdminLayout.tsx` | Added "Courses" nav item; changed Questions icon to `HelpCircle` |

### Files Added

| File | Purpose |
|---|---|
| `app/admin/courses/page.tsx` | Admin course overview page |
| `app/api/admin/courses/route.ts` | Auth-protected courses API (admin) |
| `app/api/courses/route.ts` | Public courses API (students) |
| `docs/features/courses-questions.md` | User-facing feature guide |
| `docs/api/courses-endpoints.md` | API reference for both course endpoints |

---

### Security Notes (Agent B Audit)

| Risk | Mitigation |
|---|---|
| **Unauthorized question creation** | All server actions call `checkAdmin()` first; throws if session missing or role ≠ admin |
| **Admin courses endpoint IDOR** | `GET /api/admin/courses` checks `session.user.role === 'admin'` before querying |
| **Public courses endpoint data exposure** | Returns only `courseCode`, `courseName`, `examCount`, `withSolutions`, `latestExamDate` — no PII |
| **SQL injection** | All queries use Drizzle ORM parameterized bindings — no string interpolation |
| **Slug collision on topic creation** | Slug is `slugified-title-<8-char UUID>` — UUID suffix prevents concurrent-insert collisions |
| **`JSON.parse` options field** | Validated with `Array.isArray()` after parse; rejects non-array values with user-visible error |
| **NULL aggregation (NaN in JSON)** | `SUM` wrapped in `COALESCE(..., 0)` in both course API routes — prevents `NaN` serialized as `null` |

---

### How to Use

#### As an admin — Adding questions to a course

1. Upload at least one exam for a course via **Upload Exam** (`/admin/upload-exam`). The course is created automatically.
2. Navigate to **Courses** (`/admin/courses`) in the sidebar.
3. Find the course and click **Add Questions**.
4. On the Questions page, the course is pre-selected. Choose an existing topic or create a new one.
5. Fill in the question form:
   - Write the problem statement using LaTeX (live preview on the right).
   - Choose question type (multiple choice, numeric, proof, etc.).
   - Add solution steps — each step has a label and a LaTeX content field with live preview.
   - Set difficulty (1–5) and correct answer.
6. Click **Add Question**. The question is immediately available to students in the adaptive practice engine.

#### As a student — Browsing courses

1. Navigate to `/archive` (or click "Old Exams" in the header).
2. The page loads a list of all courses that have uploaded exams.
3. Click any course card to go directly to that course's exam archive.
4. Or type a course code in the search bar to jump directly.

#### Deep-link from courses to questions

The URL `?course=<id>` parameter on `/admin/questions` pre-selects a course:

```
/admin/questions?course=abc123   →   Opens questions page with course abc123 selected
```

The admin courses page generates these links automatically via the "Add Questions" button.

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
