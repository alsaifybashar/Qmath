# Articles Feature Rebuild — Plan

## Problem
The current articles editor is a form-based block editor with dark-themed zinc UI that doesn't match the dashboard's light theme (#F0F2F8). The editing experience is clunky (labeled form fields per block) — far from the smooth Notion-like writing experience requested.

## What stays (already solid)
- **Database schema** (`db/schema.ts` — `articles` table) ✅
- **Type definitions** (`types/articles.ts` — ArticleBlock union, validation) ✅
- **Server actions** (`app/actions/articles.ts` — CRUD, sanitization, slug generation) ✅
- **Navigation wiring** (DashboardSidebar "Artiklar" link, AdminLayout "Articles" link) ✅
- **Articles layout** (`app/articles/layout.tsx` — DashboardSidebar + auth) ✅

## What gets rebuilt (7 files)

### Step 1: Article Renderer — `components/articles/ArticleBlock.tsx`
Redesign to match the dashboard light theme:
- Light backgrounds, dark text (#1A1D2E), card-based callouts
- KaTeX blocks with subtle blue-tinted bg (#EEF1FF)
- Callout boxes using dashboard color palette (blue, amber, emerald, purple, cyan)
- Image blocks with rounded-2xl, soft shadow
- Code blocks with light gray bg, language badge
- Clean Inter typography, proper spacing
- Keep the InlineMarkdown parser (secure, no dangerouslySetInnerHTML)

### Step 2: Article Editor — `components/articles/ArticleEditor.tsx`
Complete rewrite for a Notion-like editing flow:
- **Inline editing**: Click a block to edit it directly, renders preview when unfocused
- **Slash command menu**: Type `/` or click "+" between blocks to open a block picker
- **Hover controls**: Block move/delete controls appear on hover (not always visible)
- **Live LaTeX preview**: Show rendered KaTeX below the formula input as you type
- **Metadata panel**: Collapsible top section for title, course, topic, tags
- **Light theme**: Match dashboard palette (#F0F2F8 bg, white cards, blue accents)
- **Keyboard shortcuts**: Enter for new text block, Backspace on empty block to delete
- Keep the same `onSave` interface and block data model for compatibility

### Step 3: Admin Articles List — `app/admin/articles/page.tsx`
Light refresh keeping the existing structure but ensuring it works reliably:
- Keep the table layout, search, filter — it's functional
- Fix any remaining type issues

### Step 4: Admin New/Edit Pages — `app/admin/articles/new/page.tsx` + `app/admin/articles/[id]/edit/page.tsx`
Align with new editor:
- Full-width writing layout (editor takes most of the viewport)
- Top bar: back button, title, publish/status toggle, save
- Clean distraction-free writing experience
- Proper loading states and error handling

### Step 5: Student Browse — `app/articles/page.tsx`
Redesign to match dashboard light theme:
- White article cards with subtle shadows (matching course cards)
- Search bar at top
- Group by course with course-code badges
- Reading time, view count, tags
- Same color palette as dashboard (blue, gradients, #F0F2F8 bg)

### Step 6: Student Article Reader — `app/articles/[slug]/page.tsx`
Redesign for comfortable reading:
- Clean, centered reading layout (max-w-3xl)
- Light theme with high readability
- Breadcrumb navigation
- Article header with metadata
- ArticleContent renderer
- Related articles at bottom
- Back to articles link

## Execution order
1. ArticleBlock.tsx (renderer) — foundation for both editor preview and student reading
2. ArticleEditor.tsx (editor) — the core Notion-like experience
3. Admin new + edit pages — wiring the editor
4. Student browse page — light theme cards
5. Student reader page — light theme reader
6. Admin list page — minor type fix already done
