// ── Article Content Block Types ───────────────────────────────────────────────
// Each block is a self-contained unit of content. The editor and renderer
// both operate on this typed union — no raw HTML strings, preventing XSS.

export type HeadingBlock = {
    type: 'heading';
    level: 2 | 3 | 4;
    text: string;
};

export type TextBlock = {
    type: 'text';
    /** Markdown-formatted plain text. Rendered via remark — no raw HTML exec. */
    markdown: string;
};

export type LatexBlock = {
    type: 'latex';
    display: 'block';
    /** Pure LaTeX formula — rendered via KaTeX on the client. */
    formula: string;
    /** Optional caption shown below block-display formulas. */
    caption?: string;
};

export type ImageBlock = {
    type: 'image';
    /** Absolute URL (HTTPS). Validated server-side before save. */
    url: string;
    alt: string;
    caption?: string;
};

export type CalloutBlock = {
    type: 'callout';
    variant: 'info' | 'warning' | 'tip' | 'example' | 'definition' | 'success';
    title?: string;
    text: string;
};

export type DividerBlock = {
    type: 'divider';
};

export type CodeBlock = {
    type: 'code';
    language: string; // e.g. "python", "matlab", "text"
    code: string;
};

export type ArticleBlock =
    | HeadingBlock
    | TextBlock
    | LatexBlock
    | ImageBlock
    | CalloutBlock
    | DividerBlock
    | CodeBlock;

// ── Article Status ────────────────────────────────────────────────────────────
export type ArticleStatus = 'draft' | 'published' | 'archived';

// ── Full Article ──────────────────────────────────────────────────────────────
export interface Article {
    id: string;
    slug: string;
    title: string;
    titleSv: string | null;
    excerpt: string | null;
    courseId: string | null;
    topicId: string | null;
    contentBlocks: ArticleBlock[];
    status: ArticleStatus;
    authorId: string | null;
    tags: string[];
    readingTimeMinutes: number | null;
    viewCount: number;
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    // Populated from joins when needed
    courseName?: string;
    courseCode?: string;
    topicTitle?: string;
    authorName?: string;
}

// ── Create/Update payloads ────────────────────────────────────────────────────
export interface CreateArticlePayload {
    title: string;
    titleSv?: string;
    excerpt?: string;
    courseId?: string;
    topicId?: string;
    contentBlocks: ArticleBlock[];
    tags?: string[];
    status?: ArticleStatus;
}

export interface UpdateArticlePayload extends Partial<CreateArticlePayload> {
    status?: ArticleStatus;
}

// ── Validation helpers ────────────────────────────────────────────────────────
export const MAX_TITLE_LENGTH = 200;
export const MAX_EXCERPT_LENGTH = 500;
export const MAX_BLOCKS = 200;
export const ALLOWED_IMAGE_SCHEMES = ['https://'];

/** Estimate reading time from blocks (200 wpm average). */
export function estimateReadingTime(blocks: ArticleBlock[]): number {
    let wordCount = 0;
    for (const block of blocks) {
        if (block.type === 'text') wordCount += block.markdown.split(/\s+/).length;
        if (block.type === 'heading') wordCount += block.text.split(/\s+/).length;
        if (block.type === 'callout') wordCount += block.text.split(/\s+/).length;
        if (block.type === 'latex') wordCount += 15; // Estimate per formula
    }
    return Math.max(1, Math.ceil(wordCount / 200));
}

/** Generate a slug from a title. */
export function slugify(title: string): string {
    return title
        .toLowerCase()
        .replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 80);
}
