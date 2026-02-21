# Articles Feature — Technical Documentation

## Overview

The Articles feature lets admins publish rich study-material articles linked to courses and topics. Students can browse, search, and read articles from the student sidebar.

**Key design decisions:**
- Content is stored as a typed JSON block array — never raw HTML — which eliminates XSS at the architecture level.
- LaTeX is rendered client-side via KaTeX; no server-side eval.
- Public endpoints always filter `status = 'published'` and call `notFound()` on miss, preventing information disclosure about drafts.
- View counts are incremented atomically at the DB level (fire-and-forget, non-blocking).

---

## File Map

```
types/articles.ts                       Block types + validation constants + utility functions
app/actions/articles.ts                 All server actions (CRUD + public queries)
components/articles/ArticleBlock.tsx    Block renderer (ArticleContent, ArticleBlock)
components/articles/ArticleEditor.tsx  Block-based editor with live preview

app/admin/articles/page.tsx            Admin: list articles with search/filter
app/admin/articles/new/page.tsx        Admin: create new article
app/admin/articles/[id]/edit/page.tsx  Admin: edit/publish/delete article

app/articles/page.tsx                  Student: browse articles (grouped by course)
app/articles/[slug]/page.tsx           Student: read article
```

---

## Database Schema

Table: **`articles`** (in `db/schema.ts`)

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | Nanoid generated |
| `slug` | text UNIQUE | URL-safe, auto-generated from title, Swedish chars normalized |
| `title` | text | English title |
| `title_sv` | text | Optional Swedish title |
| `excerpt` | text | Short description (max 500 chars) |
| `course_id` | text FK → courses | Optional; `SET NULL` on course delete |
| `topic_id` | text FK → topics | Optional; `SET NULL` on topic delete |
| `content_blocks` | text (json) | `ArticleBlock[]` — typed block array |
| `status` | text | `draft` \| `published` \| `archived` |
| `author_id` | text FK → users | `SET NULL` on user delete |
| `tags` | text (json) | `string[]` |
| `reading_time_minutes` | integer | Computed from block word counts at save time |
| `view_count` | integer | Atomically incremented on each public read |
| `published_at` | integer (timestamp) | Set once on first publish |
| `created_at` | integer (timestamp) | Auto-set on insert |
| `updated_at` | integer (timestamp) | Set on every update |

**Relations:** `articles` → `courses` (many-to-one), `topics` (many-to-one), `users` (many-to-one).

**Migration:** Run `npm run db:push` to apply the schema.

---

## Content Block Types

All article body content is represented as an array of strongly-typed blocks:

```typescript
type ArticleBlock =
  | HeadingBlock      // { type:'heading', level:2|3|4, text }
  | TextBlock         // { type:'text', markdown }
  | LatexBlock        // { type:'latex', display:'block', formula, caption? }
  | ImageBlock        // { type:'image', url, alt, caption? }
  | CalloutBlock      // { type:'callout', variant, text, title? }
  | DividerBlock      // { type:'divider' }
  | CodeBlock         // { type:'code', language, code }
```

**Callout variants:** `info` | `warning` | `tip` | `example` | `definition`

**TextBlock markdown** supports inline formatting only: `**bold**`, `*italic*`, `` `code` ``, and `[link text](url)`. No raw HTML is ever executed.

---

## Server Actions API

All actions are in `app/actions/articles.ts` (`'use server'`).

### Admin Actions (require admin session)

```typescript
createArticle(payload: CreateArticlePayload): Promise<{ id: string; slug: string }>
```
Creates a new article. Validates title, sanitizes all blocks, checks courseId/topicId exist, generates a unique slug, estimates reading time. Returns the new article's `id` and `slug`.

```typescript
updateArticle(id: string, payload: UpdateArticlePayload): Promise<void>
```
Partially updates an article. Only fields present in `payload` are changed. Regenerates slug only when title changes. Sets `publishedAt` on the first transition to `published`. Validates courseId/topicId existence if provided.

```typescript
deleteArticle(id: string): Promise<void>
publishArticle(id: string): Promise<void>    // shortcut: updateArticle(id, { status:'published' })
unpublishArticle(id: string): Promise<void>  // shortcut: updateArticle(id, { status:'draft' })
```

```typescript
getAdminArticles(opts?: { search?:string, status?:ArticleStatus, courseId?:string,
                          limit?:number, offset?:number }): Promise<ArticleRow[]>
getAdminArticleById(id: string): Promise<FullArticleRow | null>
getAllCoursesAndTopics(): Promise<{ courses: CourseRow[], topics: TopicRow[] }>
```

### Public Actions (no auth required)

```typescript
getPublishedArticles(opts?: { search?:string, courseId?:string, topicId?:string,
                              tag?:string, limit?:number, offset?:number }): Promise<PublicArticleRow[]>
```
Always filters `status = 'published'`. Safe to call from any server component.

```typescript
getPublishedArticleBySlug(slug: string): Promise<PublicArticleRow | null>
```
Returns `null` for drafts, archived, or missing articles (consistent — no information disclosure). Also fires an atomic view count increment.

---

## Security Properties

| Threat | Mitigation |
|---|---|
| XSS via content | Typed block system — no raw HTML stored or rendered; InlineMarkdown parser uses React elements only |
| XSS via LaTeX | KaTeX renders in a sandboxed DOM subtree; formula is a plain string, never eval'd |
| Malicious image URLs | `ALLOWED_IMAGE_SCHEMES = ['https://']` enforced in `sanitizeBlocks()` — `data:` URIs and `http:` blocked |
| IDOR (draft exposure) | `getPublishedArticles*` always applies `WHERE status = 'published'`; student reader calls `notFound()` for any miss |
| Oversized payloads | `MAX_BLOCKS = 200`, text ≤ 50 000 chars, formula ≤ 5 000 chars, URL ≤ 2 000 chars per block |
| Unknown block types | `sanitizeBlocks()` throws on any `type` not in the enum — never stored |
| Unauthorized DB access | `requireAdminSession()` checks live DB role on every mutation |
| Dangling foreign keys | courseId/topicId checked for existence before insert/update |
| Race conditions on view count | DB-level `SET view_count = view_count + 1` — no read-modify-write |
| Admin route access | `middleware.ts` + `auth.config.ts` rejects non-admin JWT at the edge; server actions double-check in DB |

---

## Admin User Guide

### Creating an Article

1. Go to **Admin → Articles** and click **Ny artikel**.
2. Fill in the **title** (required). Add an optional Swedish title and excerpt.
3. Link to a **course** (e.g., TATA24) and optionally a **topic** within that course.
4. Add **tags** (press Enter after each tag).
5. Build the article body using the block palette on the right:
   - **Rubrik** — Section heading (H2/H3/H4)
   - **Text** — Paragraph with inline formatting (bold, italic, code, links)
   - **LaTeX** — Mathematical formula; type standard LaTeX syntax
   - **Bild** — Image from an HTTPS URL with alt text
   - **Callout** — Highlighted box (info, warning, tip, example, definition)
   - **Kod** — Code block with syntax language
   - **Avdelare** — Horizontal rule
6. Use **Förhandsgranska** to see the rendered article before saving.
7. Save as **Utkast** (draft) or change status to **Publicerad** to publish immediately.

### LaTeX Syntax

LaTeX formulas use standard KaTeX syntax. Examples:

```latex
\frac{d}{dx}\left(x^n\right) = nx^{n-1}      % Power rule

\int_a^b f(x)\,dx = F(b) - F(a)               % Fundamental theorem

\begin{pmatrix} a & b \\ c & d \end{pmatrix}  % Matrix
```

KaTeX supports most standard LaTeX math-mode commands. See [KaTeX supported functions](https://katex.org/docs/supported.html) for the complete list.

### Inline Text Formatting

Inside **Text** blocks, use markdown shortcuts:

| Syntax | Result |
|---|---|
| `**text**` | **Bold** |
| `*text*` | *Italic* |
| `` `code` `` | `inline code` |
| `[label](https://url)` | Hyperlink |

### Editing and Publishing

- **Save** updates the article without changing its status.
- The **Publicera / Avpublicera** button in the top bar toggles visibility without saving other changes.
- **Öppna publik artikel** appears when an article is published — opens the student view in a new tab.
- **Radera** requires confirmation and permanently deletes the article.

### Slug Behavior

A URL slug is auto-generated from the title on creation (e.g., "Partiell integration" → `partiell-integration`). If the title is updated, the slug is regenerated — existing links will redirect via Next.js `notFound()` fallback to the articles list.

---

## Student Experience

Students access articles via **Artiklar** in the left sidebar.

- **Browse page** (`/articles`): Articles are grouped by course. Use the search box or filter by course to narrow results.
- **Article page** (`/articles/[slug]`): Full article with breadcrumb navigation, reading time, view count, tags, and a related-articles section at the bottom (3 articles from the same topic or course).
- Articles that are drafts or archived return a 404 — students never see unpublished content.

---

## Extending the Feature

### Adding a New Block Type

1. Add the type to `types/articles.ts` (union member + interface).
2. Add a `case` in `sanitizeBlocks()` in `app/actions/articles.ts`.
3. Add a render branch in `ArticleBlock` component in `components/articles/ArticleBlock.tsx`.
4. Add the block to `BLOCK_TYPES` palette in `components/articles/ArticleEditor.tsx` and implement `BlockEditor` fields for it.

### Full-Text Search

The current search uses SQL `LIKE` against title and excerpt. For production scale, replace with SQLite FTS5:

```sql
CREATE VIRTUAL TABLE articles_fts USING fts5(title, excerpt, content='articles', content_rowid='rowid');
```

Then update `getPublishedArticles` and `getAdminArticles` to query via FTS5.

### Tag Filtering

Tag filtering uses SQLite's `json_each` function to match elements in the stored JSON array:

```typescript
// Already implemented in getPublishedArticles:
conditions.push(sql`EXISTS (SELECT 1 FROM json_each(${articles.tags}) WHERE value = ${opts.tag})`);
```

Tags are linked from the article reader page — clicking a tag on `/articles/[slug]` navigates to `/articles?tag=<tag>` which activates this filter.
