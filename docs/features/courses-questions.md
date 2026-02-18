# Feature Guide: Course-Linked Question Bank

This guide covers the **Course Overview** and **Question Bank** features added to the Qmath admin panel.

---

## Overview

Qmath derives its list of available courses directly from the `exams` table. A course is considered "available" if and only if at least one exam PDF has been uploaded for it. This keeps the admin panel and student-facing archive in sync automatically — no manual course configuration required.

```
Admin uploads exam for TATA24
    │
    ▼
exams table gains a row (courseCode = "TATA24")
    │
    ├──▶ GET /api/courses          → students see TATA24 in archive browse list
    └──▶ GET /api/admin/courses    → admins see TATA24 in Courses page
```

---

## For Admins

### Step 1 — Upload an exam to activate a course

Before a course appears anywhere in Qmath, you must upload at least one exam PDF.

1. Navigate to **Upload Exam** (`/admin/upload-exam`) in the sidebar.
2. Fill in:
   - **Course Code** — e.g. `TATA24`
   - **Course Name** — e.g. `Analys och linjär algebra`
   - Exam date, type, has-solution checkbox
3. Attach the PDF and submit.

The course now appears in:
- `/admin/courses` (admin view)
- `/archive` browse list (student view)

---

### Step 2 — Browse courses (`/admin/courses`)

The Courses page shows every course that has at least one uploaded exam.

| Column | Description |
|--------|-------------|
| Course Code | Monospaced identifier (e.g. `TATA24`) |
| Course Name | Full name |
| Exams | Total number of uploaded exam PDFs |
| With Solutions | Exams that include a solution PDF |
| Latest Exam | Date of most recent uploaded exam |

**Action buttons per course:**

| Button | Destination | Purpose |
|--------|-------------|---------|
| Add Questions | `/admin/questions?course=<id>` | Open question editor pre-filtered to this course |
| Archive | `/archive/<courseCode>` | Preview what students see for this course |
| Exams | `/admin/exams?course=<courseCode>` | Filter the exam list to this course |

---

### Step 3 — Add questions (`/admin/questions`)

The Questions page uses a 3-step flow.

#### Step 1 of 3 — Select a course

A card grid shows all courses with exams. Click a card to select it.

> **Tip**: If you arrived here via the "Add Questions" button from the Courses page, the course is already pre-selected. You can skip straight to Step 2.

#### Step 2 of 3 — Select or create a topic

Topics group related questions within a course (e.g. "Integration by Parts", "Eigenvalues").

- **Select existing topic**: Click a chip to select it.
- **Create new topic**: Click **+ New Topic**, fill in a title and optional description, then click **Create**. The new topic is automatically selected.

#### Step 3 of 3 — Add a question

Fill in the question form:

| Field | Description |
|-------|-------------|
| **Question Content** | The problem statement — supports full LaTeX. Live KaTeX preview updates as you type. |
| **Question Type** | `multiple_choice`, `numeric`, `proof`, or `free_form` |
| **Difficulty** | 1 (easy) → 5 (hard) |
| **Correct Answer** | The expected answer string |
| **Options** | For multiple choice: a JSON array, e.g. `["A", "B", "C", "D"]` |
| **Solution Steps** | One or more labeled steps with LaTeX content and live preview (see below) |

Click **Add Question** to save.

---

### Writing step-by-step solutions

The solution editor lets you break a solution into named steps. Each step has:

- **Label** — a short heading, e.g. `"Set up the integral"` or `"Apply power rule"`
- **LaTeX Content** — the mathematical working for that step
- **Live Preview** — rendered KaTeX preview updates on every keystroke

Use **+ Add Step** to add more steps. Use the **×** button to remove a step.

**Example — computing a definite integral:**

```
Step 1  Label: "Set up the integral"
        Content: \int_0^1 x^2 \, dx

Step 2  Label: "Apply the power rule"
        Content: \left[ \frac{x^3}{3} \right]_0^1

Step 3  Label: "Evaluate at bounds"
        Content: \frac{1^3}{3} - \frac{0^3}{3} = \frac{1}{3}
```

The steps are stored in the database as Markdown:

```markdown
### Set up the integral
\int_0^1 x^2 \, dx

### Apply the power rule
\left[ \frac{x^3}{3} \right]_0^1

### Evaluate at bounds
\frac{1^3}{3} - \frac{0^3}{3} = \frac{1}{3}
```

Empty steps are filtered out automatically before saving.

---

### LaTeX tips

| What you want | LaTeX |
|--------------|-------|
| Fraction | `\frac{a}{b}` |
| Square root | `\sqrt{x}` |
| Integral | `\int_a^b f(x) \, dx` |
| Sum | `\sum_{i=1}^{n} i` |
| Matrix | `\begin{pmatrix} a & b \\ c & d \end{pmatrix}` |
| Greek letters | `\alpha`, `\beta`, `\gamma`, `\theta`, `\lambda` |
| Limit | `\lim_{x \to \infty}` |
| Partial derivative | `\frac{\partial f}{\partial x}` |

All content fields (question and each solution step) have a live KaTeX preview — use it to verify your LaTeX before saving.

---

## For Students

### Browsing available courses (`/archive`)

The archive page now shows a **"All Available Courses"** section below the search bar, listing every course that has at least one uploaded exam.

- Courses are sorted alphabetically by course code.
- Each card shows exam count and solution count at a glance.
- Click any card to go directly to that course's exam archive.

The browse section appears:
- On first page load (before any search)
- After a search that returns zero results (so you can still discover courses)

### Searching by course code

Type a course code in the search bar (e.g. `TATA24`) and press Search or Enter.

- If exactly one course matches, you are redirected directly to `/archive/TATA24`.
- If multiple courses match, a results list is shown.
- If no courses match, the browse-all list appears below the "no results" message.

---

## Architecture — single source of truth

Both the public `/api/courses` and the admin `/api/admin/courses` endpoints derive the course list from the same SQL query:

```sql
SELECT
    course_code,
    course_name,
    COUNT(*)                                               AS exam_count,
    COALESCE(SUM(CASE WHEN has_solution THEN 1 ELSE 0 END), 0) AS with_solutions,
    MAX(exam_date)                                         AS latest_exam_date
FROM exams
GROUP BY course_code, course_name
ORDER BY course_code ASC;
```

This guarantees that:
- A course with no exams is invisible everywhere.
- Uploading an exam immediately makes the course visible everywhere.
- The student and admin views are never out of sync.

---

## Related documentation

- [API Reference — Course Endpoints](../api/courses-endpoints.md)
- [Exam Archive Feature](./exam-analysis.md)
- [Changelog](../../CHANGELOG.md)
