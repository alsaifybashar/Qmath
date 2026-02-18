# API Reference — Course Endpoints

Two endpoints expose the list of available courses (courses that have at least one uploaded exam).

---

## `GET /api/courses`

**Authentication**: None required — public endpoint.

**Used by**: Student archive page (`/archive`) to populate the "All Available Courses" browse list.

### Request

```http
GET /api/courses
```

No query parameters.

### Success Response — `200 OK`

```json
{
  "courses": [
    {
      "courseCode": "TATA24",
      "courseName": "Analys och linjär algebra, del 1",
      "examCount": 12,
      "withSolutions": 9,
      "latestExamDate": "2024-10-28"
    },
    {
      "courseCode": "TATA41",
      "courseName": "Calculus in One Variable 1",
      "examCount": 7,
      "withSolutions": 5,
      "latestExamDate": "2024-06-03"
    }
  ]
}
```

### Response fields

| Field | Type | Description |
|-------|------|-------------|
| `courseCode` | `string` | Course identifier (uppercase, e.g. `"TATA24"`) |
| `courseName` | `string` | Full course name |
| `examCount` | `number` | Total uploaded exam PDFs |
| `withSolutions` | `number` | Exams that include a solution PDF (≥ 0, never `null`) |
| `latestExamDate` | `string \| null` | ISO date of the most recent exam, or `null` if no date recorded |

Courses are sorted alphabetically by `courseCode`.

### Error Response — `500 Internal Server Error`

```json
{ "error": "Failed to list courses" }
```

### Notes

- Returns an empty `courses` array (not an error) when no exams exist yet.
- Exposes no personally identifiable information (PII).
- Safe to call from client components without credentials.

---

## `GET /api/admin/courses`

**Authentication**: Required — caller must have `role: 'admin'` in their NextAuth session.

**Used by**: Admin courses page (`/admin/courses`).

### Request

```http
GET /api/admin/courses
Cookie: next-auth.session-token=...
```

No query parameters.

### Success Response — `200 OK`

```json
{
  "courses": [
    {
      "id": "course_01J...",
      "code": "TATA24",
      "name": "Analys och linjär algebra, del 1",
      "description": null,
      "universityId": "uni_liu",
      "courseCode": "TATA24",
      "courseName": "Analys och linjär algebra, del 1",
      "examCount": 12,
      "withSolutions": 9,
      "latestExamDate": "2024-10-28"
    }
  ]
}
```

### Response fields

All fields from `GET /api/courses`, plus any additional columns from the `courses` table record for that course code (if one exists):

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string \| undefined` | Primary key from the `courses` table, if a record exists |
| `code` | `string \| undefined` | Same as `courseCode`, from the `courses` record |
| `name` | `string \| undefined` | Same as `courseName`, from the `courses` record |
| `description` | `string \| null \| undefined` | Optional course description |
| `universityId` | `string \| null \| undefined` | Foreign key to the `universities` table |
| `courseCode` | `string` | Always present — from the `exams` aggregate |
| `courseName` | `string` | Always present — from the `exams` aggregate |
| `examCount` | `number` | Total uploaded exam PDFs |
| `withSolutions` | `number` | Exams with solutions (≥ 0, never `null`) |
| `latestExamDate` | `string \| null` | ISO date of most recent exam |

> **Note**: `courseCode` / `courseName` from the aggregate are always present. The `courses` table fields (`id`, `code`, etc.) may be `undefined` if no matching course record exists (the exam was uploaded before a course record was created, or the auto-create failed silently).

Courses are sorted alphabetically by `courseCode`.

### Error Responses

| Status | Body | Cause |
|--------|------|-------|
| `401 Unauthorized` | `{ "error": "Unauthorized" }` | No session, or `role !== 'admin'` |
| `500 Internal Server Error` | `{ "error": "Internal Server Error" }` | Database query failed |

---

## Implementation details

Both endpoints use the same core SQL query (via Drizzle ORM):

```typescript
const results = await db
    .select({
        courseCode: exams.courseCode,
        courseName: exams.courseName,
        examCount: sql<number>`count(*)`,
        withSolutions: sql<number>`coalesce(sum(case when ${exams.hasSolution} then 1 else 0 end), 0)`,
        latestExamDate: sql<number>`max(${exams.examDate})`,
    })
    .from(exams)
    .groupBy(exams.courseCode, exams.courseName)
    .orderBy(exams.courseCode);
```

Key design decisions:

- **`COALESCE(..., 0)` on `SUM`**: SQLite returns `NULL` for `SUM` over an empty set or a set of all-NULL values. Without `COALESCE`, `Number(null)` becomes `NaN`, which `JSON.stringify` serializes as `null` — silently breaking the UI. The `COALESCE` guarantees `withSolutions` is always a number ≥ 0.
- **Derived from `exams` table**: Neither endpoint queries the `courses` table for the list itself. A course exists in the response if and only if there is at least one row in `exams` with that `courseCode`. This is the single source of truth.
- **`GET /api/admin/courses` joins with `courses` table**: After building the aggregate list from `exams`, the admin endpoint does a second query (`inArray(courses.code, codes)`) to fetch any extra metadata (e.g. `universityId`). This is additive — missing `courses` records do not remove a course from the response.

---

## Source files

| File | Route |
|------|-------|
| `app/api/courses/route.ts` | `GET /api/courses` |
| `app/api/admin/courses/route.ts` | `GET /api/admin/courses` |
