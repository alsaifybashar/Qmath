# Changelog

All notable changes to Qmath are documented here.

## [Unreleased] — Core Curriculum Interactive Templates (JSXGraph)

### Summary
Built out 12 new modular JSXGraph rendering components wrapping mathematical geometries spanning Prerequisite Mathematics, Linear Algebra (TATA24), and Single-Variable Calculus. 

---

### What Changed

#### New React UI Components Added (components/interactive/templates/)
**1. Prerequisites:**
- \PolynomialRootFinder\: Interactive roots for factored form string evaluation.
- \InteractiveUnitCircle\: Draggable point translating unit circle angles into unrolled sine/cosine wave projections.
- \InequalitiesVisualizer\: Graphical mapping for dashed/solid regions for 2-point lines.

**2. Linear Algebra (TATA24 focus):**
- \VectorOperationsBoard\: Interactive arrows demonstrating scaled parallelogram rules and resulting dot products.
- \MatrixDeformationBoard\: Dynamic area calculation and lattice grid distortion using two basis vector 'hats'.
- \LinearSpanExplorer\: Visual detection mapping the rank span of a target vector.
- \EigenvectorVisualizer\: Check mapping using determinant limits evaluating when an interactive $ parallel $ holds true over a  \times 2$ transform.
- \IntersectingPlanes3D\: Interactive 3D z-axis clipping mapping the line of intersection across  = x - y + k$.

**3. Single-Variable Calculus:**
- \DerivativeDefinitionBoard\: Moving secant evaluating converging to tangent with $.
- \CurveSketchingBoard\: Dual stacked UI splitting cubic polynomials (x)$ with interactive sweeping bounds over '(x)$ and ''(x)$.
- \RiemannSumsVisualizer\: Slider-based midpoint block rendering calculating approximated area boundaries.
- \TaylorSeriesApproximation\: Slider-based integer loops generating arbitrary degree $ polynomials projecting around a center $.

---

### UI Routes Updated
- \/test-interactive\: Injected massive scale testing wrappers containing all 12 modules side-by-side.

---
## [Unreleased] — Interactive Learning Integration (JSXGraph + AI)

### Summary
Built Phase 1 of the Interactive Learning Architecture. Introduced real-time geometry boards linked via WebSockets to a dedicated Python SymPy math engine.

---

### Problem Solved
Previously, Qmath lacked a highly interactive mathematical visualization component where AI could monitor and evaluate steps geometrically without generating conversational text.
 
---

### What Changed

#### Frontend Architecture
- **JSXGraph Integration**: Created the \JSXGraphBoard\ component wrapping the JSXGraph library cleanly for React Server Components.
- **WebSocket Streaming**: Created the \useGraphStream\ hook for duplex communication of interactions back to a math evaluation server.
- **Testing Interface**: Built an interactive preview demo at \/test-interactive\ that demonstrates dynamic edge-case gradient rendering based on spatial proximity.

#### Backend Architecture
- **Microservice Setup**: Initialize a standalone FastAPI application (\math-engine\) utilizing \sympy\ and \websockets\.

---

### Files Modified

| File | Change |
|---|---|
| \pp/test-interactive/page.tsx\ | Added \JSXGraphDemo\ showcasing realtime WebSockets |
| \package.json\ | Installed \jsxgraph\ dependencies |

### Files Added

| File | Purpose |
|---|---|
| \components/interactive/JSXGraphBoard.tsx\ | Next.js wrapper for JSXGraph interactive environments |
| \lib/hooks/useGraphStream.ts\ | React hook for managing math-engine WebSocket connections |
| \math-engine/main.py\ | Python FastAPI SymPy websocket server |
| \docs/features/*\ | Additional documentation outlining the new learning features |

---

### Security Notes (Agent B Audit)

| Risk | Mitigation |
|---|---|
| **Python Code Evaluation** | Math Engine strictly parses payloads utilizing \sp.sympify\ instead of raw \eval()\ preventing RCE attacks over the interactive geometry WebSocket. |
| **Invalid Messages** | Try-catch JSON blocks integrated across Next.js and FastAPI to drop ill-formed network interactions seamlessly. |

---


## [Unreleased] — Interactive AI Tutor & Math Validation

### Summary
Introduced an Interactive AI Tutor into the study experience that utilizes strict Socratic pedagogy. The AI acts as a gentle guide and does not give direct answers, instead scaffolding student learning. It also integrates a symbolic math tool (`validate_math`) to correctly compute algebraic equivalence, ensuring accurate feedback.

---

### Problem Solved
Previously, students lacked real-time, personalized guidance when struggling with mathematical problems. General LLMs without strict prompting often simply gave away the answers, and often hallucinated when comparing complex algebraic expressions.

---

### What Changed

#### Socratic Prompting & Context Pipeline
- **Strict Pedagogy:** Introduced `socratic.ts` defining `SOCRATIC_SYSTEM_PROMPT` which enforces hinting over answering.
- **Dynamic Context:** The `AIContext` object tracks the user's current question, topic, attempts, elapsed time, and mastery level, tailoring the AI's guidance depth.

#### Tool-Assisted Math Validation
- **`validate_math` Tool:** Given to Claude to algebraically compare the student's expression against the correct answer.
- **SymbolicValidator Integration:** The `/api/ai/chat` route captures the model's tool calls, invokes SymPy/algebraic validation logic, and feeds the boolean equivalence back into the conversation automatically.

#### User Experience
- **Seamless Chat UI:** Embedded `AIPanel` component into the `FocusedStudyLayout`. It maintains conversational history and floats within the study environment.
- **Interactive Trigger:** Students can click "Fråga AI-handledare" to open the tutor contextually during any question.

---

### Files Modified

| File | Change |
|---|---|
| `app/api/ai/chat/route.ts` | Complete rewrite using `@anthropic-ai/sdk`, added tool execution loop |
| `components/ai/AIPanel.tsx` | Enhanced context passing and persistent conversation history |
| `app/study/page.tsx` | Embedded the AI Tutor seamlessly into the help panel |

### Files Added

| File | Purpose |
|---|---|
| `lib/ai/prompts/socratic.ts` | Socratic system prompt and `validate_math` tool schema definition |
| `tests/unit/ai-chat.test.ts` | Comprehensive unit/security test suite for the AI API route |

---

### Security Notes (Agent B Audit — 4/4 tests passed)

| Risk | Mitigation |
|---|---|
| **Unauthorized AI Access (IDOR)** | Added `const session = await auth()` to `route.ts`. Unauthenticated POST requests are rejected with 401 Unauthorized. |
| **Payload Size DoS** | Included a strict 2000 character limit on the incoming `message` string to prevent massive API token exhaustion. |
| **XSS / Injection** | `message` values are passed as standard text to the Anthropic API. Tool responses (`validate_math`) are locally verified boolean outputs. Next.js natively mitigates XSS during chat rendering. |
| **Budget Exhaustion** | Strict `max_tokens: 500` imposed per API request. |

---

## [Unreleased] — Design Principles Implementation (Phase 1)

### Summary
Implemented the core UX/UI design principles from `design_principer.md`. This phase introduces AI-driven study prioritisation, a stress-conscious exam readiness gauge, an expanded error-reflection system, and enhanced study-habit analytics — all without alarming visual language or social comparison.

---

### What Changed

#### New Component — `components/dashboard/StudyIntelligencePanel.tsx`

A new panel replacing generic "AI recommendations" with a structured, priority-ranked study action list:

- **Smart next action** — dark card highlighting the single highest-impact topic to study now, showing expected % improvement and estimated minutes.
- **Priority list** — up to 6 topics ranked by urgency (1–5), with colour-coded urgency badges (amber/green, no alarming red for low urgency), course code, and reason.
- **Plan status banner** — `Du är före planen` / `Du ligger i fas` / `Lite efter planen` with soft gradient backgrounds (no alarm colours).
- **AI focus recommendation** — collapsible AI-generated text tailored to the student's profile.
- **Optimised time distribution** — stacked bar showing recommended study minutes per enrolled course.

All data is computed server-side from existing `masteryData` — no extra DB queries required.

#### Rewritten Component — `components/dashboard/ExamReadinessBar.tsx`

Replaced the linear progress bar with a circular ring gauge and a 4-stage progression system:

- **SVG ring gauge** — animated `strokeDashoffset` ring showing readiness % with stage-appropriate colour (slate → amber → blue → green; never alarming red).
- **Stage progression** (`Grund → God → Stabil → Redo`) — dot-and-line indicator below the ring showing current stage.
- **Stats grid** — estimated grade, pass probability, and questions this week in 3 tiles.
- **Expandable topic breakdown** — collapsible section with weakest/strongest topic lists and per-topic mastery mini-bars with trend icons.
- Pass probability capped at 99% — avoids false certainty.

#### Enhanced Component — `components/dashboard/ErrorAnalysis.tsx`

Added deep-reflection features to the error analysis view:

- **Expandable error-type rows** — clicking any error type reveals:
  - **3 micro-questions** (e.g. *"Kan du förklara definitionen med egna ord?"*) to prompt active recall.
  - **Concept sub-tree** — tagged chips linking the error type to specific sub-concepts (e.g. `Definitioner`, `Satser & bevis` for conceptual errors).
- **Stress-conscious insight card** — warm amber/yellow styling instead of red; constructive phrasing (never "you failed").
- **Fixed Recharts formatter** — `Tooltip formatter` typed as `(v: number | undefined)` to satisfy `Formatter<number, string>` constraint (lint ID `bbff8c20`).

#### Enhanced Component — `components/dashboard/StreakTracker.tsx`

Extended the stats section with two optional new tiles (rendered only when data is provided):

- **Efficiency score** (`efficiencyScore?: number`) — displays "rätt/min" metric in orange.
- **Weekday mini heatmap** (`weekdayPerformance?: number[]`) — 7-column bar chart (Mån–Sön) highlighting the best study day.
- **Fixed pre-existing ESLint violations** — `ConfettiParticle` `Math.random()` calls moved to deterministic props (`colorIndex`, `x`, `yExtra`) to satisfy `react-hooks/purity` rule.

#### Updated Page — `app/(dashboard)/dashboard/page.tsx`

- Imported `StudyIntelligencePanel` and `StudyAction` type.
- Computed `studyActions`, `avgMasteryGain`, `timeDistribution`, and `planStatus` from existing server-side mastery data.
- Rendered `StudyIntelligencePanel` between Row 1 (AI recommendation) and Row 2 (active courses).

#### Enhanced Page — `app/(dashboard)/exam-sim/page.tsx`

- **Förhandsprognos banner** added to `ConfigScreen` — shows estimated score range before the student starts (e.g. *"Du skulle få ca 62–74% idag"*) using a soft indigo gradient.
- **AI action plan** replaces the amber "Improvements" section in `ResultsScreen` — numbered steps on a dark card with a "Implementera planen…" footer note.

---

### Files Modified

| File | Change |
|---|---|
| `components/dashboard/ExamReadinessBar.tsx` | Full rewrite — circular ring gauge, stage indicator, pass probability |
| `components/dashboard/ErrorAnalysis.tsx` | Expandable error rows with micro-questions and concept trees |
| `components/dashboard/StreakTracker.tsx` | Added efficiency score + weekday heatmap tiles; fixed ConfettiParticle purity |
| `app/(dashboard)/dashboard/page.tsx` | StudyIntelligencePanel integration with server-computed priority data |
| `app/(dashboard)/exam-sim/page.tsx` | Förhandsprognos banner + dark AI action plan card |

### Files Added

| File | Purpose |
|---|---|
| `components/dashboard/StudyIntelligencePanel.tsx` | New AI-driven study prioritisation panel |

---

### Design Principles Applied

| Principle (from `design_principer.md`) | Implementation |
|---|---|
| Reduce uncertainty and stress | Circular readiness ring with stage names instead of raw %; no alarming red |
| Action-based UX | "Din smartaste nästa åtgärd" dark card as primary CTA |
| Avoid social comparison | No class average, no ranking, no percentile |
| Stress-aware colouring | Slate/amber/blue/green palette — red reserved only for critical system errors |
| Minimise cognitive load | Priority list capped at 6 items; collapsible AI recommendation |
| Save time | Time distribution bar shows optimal minutes per course |
| Control | Plan status banner tells student exactly where they stand |

---

### Security Notes (Agent B — No new endpoints or auth surface)

All new components are client-side presentational only. Data is derived server-side from existing authenticated queries in `dashboard/page.tsx`. No new API routes, server actions, or DB queries were added in this phase. Pre-existing security posture is unchanged.

---



### Summary
Admin-published questions are now the **sole source** of questions in the student study session. When a student opens `/study?topic=<id>`, the app fetches all questions with `isPublished = true` for that topic from the database and serves them through the existing adaptive-engine session. Hardcoded mock/demo questions have been removed entirely.

---

### Problem Solved

Previously, `useStudySession.tsx` loaded a hardcoded `getMockQuestions()` function — four fixed derivative questions that appeared regardless of which topic a student selected. Admin-published questions sitting in the database with `isPublished = true` and `status = 'published'` were never fetched for students.

---

### What Changed

#### New Server Action — `app/actions/study-questions.ts`

- `getStudyQuestions(topicId: string): Promise<QuestionWithHelp[]>` — queries the `questions` table for all rows where `topicId = ?` AND `isPublished = true`, then maps each row to the `QuestionWithHelp` shape required by `useStudySession`
- Type mapping: `'numeric'` → `'numeric_input'`, `'multiple_choice'` → `'multiple_choice'`, `'free_response'` → `'numeric_input'`
- Content mapping: For numeric questions, inline `$$...$$` LaTeX is extracted into `content.question.math`; the rest becomes `content.question.text`. For multiple-choice, option strings from the DB are converted to `{ id, label, isCorrect }` objects with `correctOptionId` set
- AI hints: `aiAnalysis.suggestedHints[0]` → `helps.nudgeHint`, `[1]` → `helps.guidedHint`. Falls back to Swedish default strings if hints are absent

#### Updated Hook — `lib/hooks/useStudySession.tsx`

- `loadQuestions()` is now `async` — calls `getStudyQuestions(topicId)` via server action RPC
- Added `isLoading: boolean` state (exposed in return value) — `true` during fetch, `false` after
- Added `questionsError: string | null` state — set on network/DB failure
- Hardcoded `getMockQuestions()` function **removed**
- All labels that were already Swedish remain unchanged

#### Updated Page — `app/study/page.tsx`

- `useSearchParams()` reads `?topic=<topicId>` from the URL and passes it to `useStudySession(topicId)`
- Page wrapped in `<Suspense>` boundary (required for `useSearchParams` in App Router)
- **Loading state**: spinner + "Hämtar frågor…" while DB fetch is in progress
- **Error state**: red error message + "Tillbaka till övning" link if fetch fails
- **Empty state**: "Inga övningsfrågor ännu" card with link back to practice, shown when topic has 0 published questions
- Main component renamed to `StudyHubContent` (inner); `StudyHubPage` is now the Suspense wrapper

---

### Student Experience

| Before | After |
|--------|-------|
| Always showed the same 4 hardcoded derivatives questions | Shows questions the admin published for the selected topic |
| Topic selection in URL had no effect | `/study?topic=<id>` loads questions specific to that topic |
| No loading or empty state | Loading spinner + Swedish empty-state when no questions exist |

### Security Notes

| Vector | Mitigation |
|--------|-----------|
| Unauthenticated question access | The study layout (`app/study/layout.tsx`) redirects to `/login` for unauthenticated users before the server action is ever called |
| Cross-topic data leakage | `getStudyQuestions` filters strictly by `topicId` AND `isPublished = true` — no extra data is returned |
| Server action called with arbitrary topicId | Returns an empty array for unrecognised IDs — no error thrown, no data leaked |

---

### Test Coverage

All 54 Agent B integration tests continue to pass (0 failures). Build: `npm run build` succeeds with `ƒ /study` listed as a dynamic server-rendered route.

---

## [Unreleased] — Admin Topics Management & AI Topic Sync

### Summary
AI-generated exam analysis topics (previously locked inside the `courseExamAnalysisCache` blob and invisible to admins) are now fully manageable from the admin panel. A one-click sync imports AI topics into the `topics` table, after which admins can edit, reorder, delete, and attach practice questions to them. The student-facing Course Overview now reads from this admin-managed source as its primary data path.

---

### Problem Solved

Previously, AI topics generated from exam analysis existed only as a raw JSON blob inside `courseExamAnalysisCache`. Admins had no way to:
1. View which AI topics existed for a course.
2. Correct inaccurate topic names, descriptions, or difficulty ratings produced by the AI.
3. Remove irrelevant topics or adjust the learning path order.
4. Attach practice questions to specific AI-generated topics.

The `topics` table (used by the question bank) and the AI analysis cache were two completely separate systems with no connection.

---

### What Changed

#### New Database Columns — `topics` table

Eight new columns added to the existing `topics` table to store AI-sourced metadata:

| Column | Type | Description |
|---|---|---|
| `source` | TEXT | `'ai'` (synced from exam analysis) or `'manual'` (created by admin) |
| `sort_order` | INTEGER | Admin-controlled display order within a phase |
| `phase` | TEXT | `'foundation'` \| `'core'` \| `'advanced'` |
| `ai_importance` | INTEGER | AI-scored importance 1–10 |
| `ai_difficulty` | TEXT | `'easy'` \| `'medium'` \| `'hard'` |
| `study_tips` | TEXT (JSON) | Array of study tips generated by AI |
| `common_mistakes` | TEXT (JSON) | Array of common student mistakes from AI |
| `exam_frequency` | TEXT | Human-readable frequency label (e.g. `"8/10 tentor"`) |
| `exam_sections` | TEXT (JSON) | Array of exam section labels this topic appears in |

#### New Admin Page — Topics Management (`/admin/courses/[courseId]/topics`)

A dedicated topics management page per course with:

- **Synka AI-ämnen** — one-click import of AI topics from exam analysis into the `topics` table. Shows count of new vs. updated topics on each sync.
- **Phase-grouped layout** — topics grouped under Grundläggande / Kärna / Fördjupning with colour-coded headers.
- **Inline edit** — click the edit icon on any topic to edit title, description, phase, and difficulty in-place without leaving the page.
- **Reorder** — up/down arrow buttons reorder topics within their phase group; order is persisted to `sort_order`.
- **Delete with warning** — topics with attached questions show a confirmation that mentions the question count before deletion.
- **Expandable details** — click the chevron to expand study tips, common mistakes, and exam sections imported from AI.
- **Source badge** — each topic shows whether it originated from AI or was created manually.
- **Questions link** — each topic row links directly to `/admin/questions?course=<id>` scoped to that course.

#### Updated Admin Page — Courses (`/admin/courses`)

Each course card now has a **Topics** button (purple) linking to `/admin/courses/[courseId]/topics`, alongside the existing Questions, Archive, and Exams buttons.

#### Updated Course Overview (`app/actions/course-overview.ts`)

`getCourseOverview()` now uses a two-path strategy:

```
Student requests course overview
    │
    ▼
Primary: Read from topics table (admin-managed)
    │  Topics exist → build modules from DB rows
    │  No topics ↓
    ▼
Fallback: Read from raw AI cache (courseExamAnalysisCache)
    │  AI cache has topics → build modules from JSON blob
    │  Still empty ↓
    ▼
Return error: "Synka AI-ämnen eller lägg till ämnen manuellt"
```

This means synced / edited topics immediately reflect in the student-facing Course Overview without any extra step.

#### Updated Admin Questions (`app/actions/admin-questions.ts`)

`getAdminCourses()` now returns **all** courses (not just those with uploaded exams), so admins can create questions for any course including those with manually-created topics only.

---

### Files Modified

| File | Change |
|---|---|
| `db/schema.ts` | Added 8 AI-metadata columns to `topics` table |
| `app/actions/course-overview.ts` | Full rewrite — topics table as primary source, AI cache as fallback |
| `app/actions/admin-questions.ts` | `getAdminCourses()` returns all courses; unused `exams`/`inArray` imports removed |
| `app/admin/courses/page.tsx` | Added "Topics" button on each course card |

### Files Added

| File | Purpose |
|---|---|
| `app/actions/admin-topics.ts` | New server actions: `getAdminCourseTopics`, `syncAITopics`, `updateTopic`, `deleteTopic`, `reorderTopics`, `getAllAdminCourses` |
| `app/admin/courses/[courseId]/topics/page.tsx` | New admin topics management UI |

---

### Security Notes (Agent B Audit — 53/53 tests passed)

| Risk | Mitigation |
|---|---|
| **Unauthorized topic management** | All actions in `admin-topics.ts` call `checkAdmin()` first; non-admin sessions receive `{ success: false, error: '...' }` |
| **SQLi via topic title/slug** | `slugify()` strips all non-alphanumeric characters; all DB writes use Drizzle ORM parameterized queries — verified by static code scan |
| **XSS via topic title in slug** | `slugify()` removes `<`, `>`, `"`, `'` HTML metacharacters — slug is always URL-safe and cannot inject HTML |
| **IDOR — editing another course's topics** | `updateTopic`/`deleteTopic` operate by primary key (`id`) which comes from admin UI only; `checkAdmin()` guards every call |
| **Slug collision on AI sync** | `syncAITopics` upserts by slug match (update existing, insert new) — never creates duplicates for the same AI topic |
| **AI data poisoning via sync** | Sync reads only from the validated `ExamAnalysisData` structure already produced by a trusted Claude pipeline — no user-supplied data flows into AI field values |

---

### How to Use

#### As an admin — Syncing and managing AI topics

1. Navigate to **Courses** (`/admin/courses`) in the sidebar.
2. Find a course that has uploaded exams with AI analysis and click **Topics**.
3. Click **Synka AI-ämnen från tenta** — the system imports all AI topics into the database. A summary shows how many were new vs. updated.
4. Topics appear grouped by phase (Grundläggande → Kärna → Fördjupning).
5. Click the ✏️ **edit icon** on any topic to fix the title, description, phase, or difficulty.
6. Use the **▲ / ▼** arrows to reorder topics within their phase.
7. Click the **chevron** (▼) to expand a topic and view AI-generated study tips, common mistakes, and exam sections.
8. To delete a topic, click the 🗑️ icon and confirm. Questions attached to the topic are also removed.
9. To create a new manual topic, click **Nytt ämne**, fill in the form, and choose a phase.

#### As an admin — Attaching questions to topics

After syncing AI topics, any topic is available in the Questions admin page:

1. Go to **Questions** (`/admin/questions`) and select the course.
2. Topics (both AI-synced and manual) appear as selectable chips in Step 2.
3. Select a topic and add questions normally.

#### As a student — Seeing managed topics in Course Overview

No change in navigation. If an admin has synced AI topics, the Course Overview (`/courses/[code]`) immediately reflects any edits:
- Corrected topic names and descriptions
- Reordered learning path
- Accurate difficulty ratings
- Study tips and common mistakes from AI

---

## [Unreleased] — Question Flow System (Draft → AI Review → Ready → Published)

### Summary
Questions now follow a structured four-stage workflow from admin creation through AI-powered difficulty analysis to publication. Admins can trigger Claude to independently review each question's difficulty, Bloom's taxonomy level, prerequisite topics, and estimated solving time before the question is published to students.

---

### Problem Solved

Previously, questions went from creation directly to publication with no review step. This meant:
1. Admin-assigned difficulty ratings were unchecked and could be inconsistent.
2. There was no way to see what concepts a question actually tested.
3. Students received questions without any AI-generated hints to scaffold their learning.
4. Batch-publishing questions bypassed any quality gate.

---

### What Changed

#### New Database Columns — `questions` table

Four new columns added to track AI analysis state:

| Column | Type | Description |
|---|---|---|
| `status` | TEXT | `'draft'` \| `'ai_review'` \| `'ready'` \| `'published'` |
| `ai_difficulty_tier` | INTEGER | AI-assessed difficulty 1–5 (may differ from admin's rating) |
| `ai_analysis` | TEXT (JSON) | Full `AIQuestionAnalysis` object from Claude |
| `ai_analyzed_at` | INTEGER | Timestamp of last AI analysis |

#### Question Status State Machine

```
[create / edit]
      │
      ▼
   DRAFT ──── "Analysera med AI" ──→ AI_REVIEW ──── (Claude responds) ──→ READY
      ↑                                                                       │
      └──── [any content edit resets to DRAFT] ◄──────────────────── "Publicera" ──→ PUBLISHED
                                                                              │
                                                                     "Avpublicera" ──→ READY
```

Rules enforced by server actions:
- `createQuestion`: always sets `status = 'draft'`, `isPublished = false`
- `updateQuestion`: resets to `status = 'draft'`, clears all AI analysis fields — content changes always require re-analysis
- `publishQuestions`: only acts on questions in `ready` or `published` state — draft/ai_review questions are silently skipped
- `unpublishQuestion`: sets `status = 'ready'`, `isPublished = false`
- `isPublished` boolean is kept in sync with status for backward compatibility with the adaptive engine

#### New Server Action — `analyzeQuestionDifficulty(questionId)`

Calls Claude Sonnet 4 with full question context (course, topic, content, solution, admin difficulty) and returns a structured `AIQuestionAnalysis`:

```typescript
interface AIQuestionAnalysis {
    difficulty: number;           // 1–5, independently assessed
    bloomLevel: string;           // remember | understand | apply | analyze | evaluate | create
    conceptsTested: string[];     // e.g. ["matrix_multiplication", "determinant"]
    prerequisiteTopics: string[]; // e.g. ["linear_equations", "basic_algebra"]
    strategyTag: string;          // e.g. "gaussian_elimination"
    estimatedTimeMinutes: number;
    feedbackForAdmin: string;     // 1–2 sentence human-readable summary
    suggestedHints: string[];     // 2–3 progressive hints for students
}
```

Fallback: if `ANTHROPIC_API_KEY` is not set, a deterministic fallback analysis is generated from the admin's difficulty tier — no API call, no failure.

#### New Server Action — `analyzeQuestionsBatch(questionIds)`

Processes up to 5 questions sequentially to respect Claude API rate limits. Returns per-question success/error results.

#### Rebuilt Admin Questions Page (`/admin/questions`)

Four workflow tabs replace the flat question list:

| Tab | Swedish label | Contents |
|---|---|---|
| `draft` | Utkast | Newly created / edited questions awaiting AI analysis |
| `ai_review` | AI-analys | Questions currently being processed by Claude |
| `ready` | Redo | Analysed questions ready to publish |
| `published` | Publicerad | Live questions visible to students |

**Per-question features:**
- **Difficulty comparison** — side-by-side Admin vs AI difficulty with coloured badges (green/amber/red)
- **Bloom's level** — shown as a labelled chip
- **Concepts & prerequisites** — tags listing what the question tests and requires
- **Strategy tag** — the solving approach Claude identified
- **Estimated time** — solving time in minutes
- **Suggested hints** — collapsible list of student-facing progressive hints
- **Admin feedback** — Claude's 1–2 sentence notes for the admin

**Batch actions:**
- Draft tab: **Analysera alla med AI** — triggers AI analysis for all draft questions in the current topic
- Ready tab: **Publicera alla** — batch-publishes all ready questions

---

### Files Modified

| File | Change |
|---|---|
| `db/schema.ts` | Added 4 AI-analysis columns to `questions` table |
| `app/actions/admin-questions.ts` | `createQuestion` defaults to draft; `updateQuestion` resets to draft + clears AI fields; added `updateQuestionStatus`, `publishQuestions`, `unpublishQuestion` |
| `app/admin/questions/page.tsx` | Full rewrite — 4-tab workflow UI with AI analysis cards |

### Files Added

| File | Purpose |
|---|---|
| `app/actions/ai-question-analysis.ts` | `analyzeQuestionDifficulty()` and `analyzeQuestionsBatch()` with Claude integration and fallback |
| `tests/integration/question-flow-and-topics.test.ts` | 53-test Agent B suite covering unit logic, security, and robustness |

---

### Security Notes (Agent B Audit — 53/53 tests passed)

| Risk | Mitigation |
|---|---|
| **Unauthorized AI analysis trigger** | `analyzeQuestionDifficulty()` calls `checkAdmin()` before any DB read or Claude call |
| **Unauthorized bulk publish** | `publishQuestions()` checks admin role; skips questions not in `ready` state — draft/ai_review questions cannot be published even if their IDs are submitted |
| **AI difficulty out of range** | `Math.max(1, Math.min(5, Math.round(analysis.difficulty)))` clamps Claude's output to 1–5 before storage |
| **Malformed Claude JSON** | `stripMarkdownFences()` + `JSON.parse()` in a try/catch; falls back to `generateFallbackAnalysis()` on any parse error — never crashes |
| **Rate limit abuse via batch** | `analyzeQuestionsBatch` hard-caps at `questionIds.slice(0, 5)` — verified by test |
| **SQLi via question content** | All DB operations use Drizzle ORM parameterized queries — static scan confirms no raw SQL string interpolation in any action file |
| **Hardcoded API key** | Static scan confirms `ANTHROPIC_API_KEY` is read only from `process.env`, never hardcoded |

---

### How to Use

#### As an admin — Full question workflow

1. Go to **Questions** (`/admin/questions`), select a course and topic.
2. Fill in the question form and click **Add Question** — it appears in the **Utkast** tab.
3. Click **Analysera med AI** on a single question (or **Analysera alla med AI** for the whole topic).
   - The question moves to **AI-analys** while Claude processes it (~5–10 seconds).
   - When done, it moves to **Redo** with the full AI breakdown visible.
4. Review the AI analysis card:
   - If the AI difficulty matches your assessment → proceed.
   - If the AI flags a mismatch → consider editing the question (which resets to draft for re-analysis).
5. Click **Publicera** (or **Publicera alla** on the Redo tab) to make the question live.
6. Published questions appear in the **Publicerad** tab. Use **Avpublicera** to pull a question back to draft.

#### Running the tests

```bash
nvm use 22
npx tsx tests/integration/question-flow-and-topics.test.ts
```

Expected output: `Results: 53 passed, 0 failed`

---

## [Unreleased] — AI Study Plan Generation & Caching

### Summary
Introduced an AI-powered Study Plan generator that uses Claude to analyze course content and produce weekly study schedules based on exam history and topic importance. Includes robust caching and security validations.

---

### Problem Solved
Students lacked structured guidance on what to study and in what order for specific courses. Existing study plans were manual and not connected to real exam statistics.

---

### What Changed

#### New AI Study Plan Engine
- Generates a 6-week study plan dynamically based on uploaded exams using Claude.
- Evaluates the importance of topics on a scale of 1-10.
- Handles edge cases such as empty exams or missing PDFs gracefully.

#### Enhanced Security and Stability (Agent B Audited)
- XSS inputs are sanitized and safely cached without leaking.
- Implemented robust caching using SQLite and a 24-hour TTL mechanism to optimize API usage and speed up repeated requests.

#### Test Coverage
- Added comprehensive integration tests (`tests/integration/ai-feature.test.ts`) covering cache hits, XSS, empty inputs, and validation of importance scores.

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
