import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPublishedArticleBySlug, getPublishedArticles } from '@/app/actions/articles';
import { ArticleContent, TableOfContents } from '@/components/articles/ArticleBlock';
import type { ArticleBlock } from '@/types/articles';
import { ArrowLeft, Clock, Eye, Calendar, Tag, BookOpen, ChevronRight } from 'lucide-react';

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
    text:       '#1A1D2E',
    textSec:    '#6B7194',
    textMuted:  '#9CA3AF',
    blue:       '#4361EE',
    purple:     '#7C5CFC',
    blueLight:  '#EEF1FF',
    blueBorder: '#D6DAFB',
    border:     '#E5E7EB',
    surface:    '#FFFFFF',
    surfaceAlt: '#F9FAFB',
};

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
    const { slug } = await params;
    const article = await getPublishedArticleBySlug(slug);
    if (!article) return { title: 'Artikel hittades inte' };
    return {
        title: `${article.title} — Qmath`,
        description: article.excerpt ?? undefined,
    };
}

export default async function ArticleReaderPage({ params }: Props) {
    const { slug } = await params;
    const article = await getPublishedArticleBySlug(slug);

    if (!article) notFound();

    const blocks = (article.contentBlocks as ArticleBlock[] | null) ?? [];

    // Count headings — show ToC for articles with enough structure
    const headingCount = blocks.filter(b => b.type === 'heading').length;

    // Related articles from same topic/course
    const related = article.topicId
        ? await getPublishedArticles({ topicId: article.topicId, limit: 4 })
        : article.courseId
            ? await getPublishedArticles({ courseId: article.courseId, limit: 4 })
            : [];
    const relatedFiltered = related.filter(r => r.slug !== slug).slice(0, 3);

    return (
        <div className="min-h-screen" style={{ background: '#FAFBFE' }}>
            {/* ── Article container ──────────────────────────────────────────── */}
            <div className="max-w-3xl mx-auto px-6 py-10">
                {/* ── Breadcrumb ─────────────────────────────────────────────── */}
                <nav
                    className="flex items-center gap-2 text-sm mb-10"
                    aria-label="Brödsmulor"
                    style={{ color: C.textMuted }}
                >
                    <Link
                        href="/articles"
                        className="flex items-center gap-1.5 transition-colors hover:text-[#4361EE]"
                    >
                        <BookOpen className="w-3.5 h-3.5" /> Artiklar
                    </Link>
                    {article.courseCode && (
                        <>
                            <ChevronRight className="w-3.5 h-3.5" />
                            <Link
                                href={`/articles?courseId=${article.courseId}`}
                                className="transition-colors hover:text-[#4361EE]"
                            >
                                {article.courseCode}
                            </Link>
                        </>
                    )}
                    {article.topicTitle && (
                        <>
                            <ChevronRight className="w-3.5 h-3.5" />
                            <span style={{ color: C.textSec }}>{article.topicTitle}</span>
                        </>
                    )}
                </nav>

                {/* ── Article header ─────────────────────────────────────────── */}
                <header className="mb-12">
                    <h1
                        className="font-bold leading-tight mb-4"
                        style={{
                            color: C.text,
                            fontSize: 'clamp(28px, 5vw, 40px)',
                            lineHeight: '1.2',
                            letterSpacing: '-0.02em',
                        }}
                    >
                        {article.title}
                    </h1>

                    {article.titleSv && article.titleSv !== article.title && (
                        <p
                            className="italic mb-5"
                            style={{ color: C.textMuted, fontSize: '18px' }}
                        >
                            {article.titleSv}
                        </p>
                    )}

                    {article.excerpt && (
                        <p
                            className="leading-relaxed pl-5 mb-6"
                            style={{
                                color: C.textSec,
                                fontSize: '17px',
                                lineHeight: '1.7',
                                borderLeft: `3px solid ${C.blueBorder}`,
                            }}
                        >
                            {article.excerpt}
                        </p>
                    )}

                    {/* Metadata row */}
                    <div
                        className="flex flex-wrap items-center gap-4 text-sm"
                        style={{ color: C.textMuted }}
                    >
                        {article.authorName && (
                            <span>
                                av{' '}
                                <span
                                    style={{ color: C.textSec }}
                                    className="font-medium"
                                >
                                    {article.authorName}
                                </span>
                            </span>
                        )}
                        {article.publishedAt && (
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(article.publishedAt).toLocaleDateString('sv-SE', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </span>
                        )}
                        {article.readingTimeMinutes && (
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {article.readingTimeMinutes} min läsning
                            </span>
                        )}
                        <span className="flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5" />
                            {article.viewCount ?? 0} visningar
                        </span>
                    </div>

                    {/* Tags */}
                    {(article.tags as string[] | null)?.length ? (
                        <div className="flex gap-2 flex-wrap mt-4">
                            {(article.tags as string[]).map(tag => (
                                <Link
                                    key={tag}
                                    href={`/articles?tag=${encodeURIComponent(tag)}`}
                                    className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-full transition-colors hover:shadow-sm"
                                    style={{
                                        background: C.blueLight,
                                        color: C.blue,
                                        border: `1px solid ${C.blueBorder}`,
                                    }}
                                >
                                    <Tag className="w-3 h-3" />
                                    {tag}
                                </Link>
                            ))}
                        </div>
                    ) : null}

                    {/* Separator */}
                    <div
                        className="mt-8 flex items-center gap-2"
                    >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.border }} />
                        <span className="flex-1 h-px" style={{ background: C.border }} />
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.border }} />
                    </div>
                </header>

                {/* ── Table of Contents (collapsible, for structured articles) ── */}
                {headingCount >= 3 && (
                    <div className="mb-10">
                        <TableOfContents blocks={blocks} />
                    </div>
                )}

                {/* ── Article body ───────────────────────────────────────────── */}
                <article className="max-w-none">
                    {blocks.length === 0 ? (
                        <p
                            className="italic text-center py-16"
                            style={{ color: C.textMuted }}
                        >
                            Denna artikel har inget innehåll ännu.
                        </p>
                    ) : (
                        <ArticleContent blocks={blocks} />
                    )}
                </article>

                {/* ── Back link ───────────────────────────────────────────────── */}
                <div
                    className="mt-16 pt-8"
                    style={{ borderTop: `1px solid ${C.border}` }}
                >
                    <Link
                        href="/articles"
                        className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#4361EE]"
                        style={{ color: C.textMuted }}
                    >
                        <ArrowLeft className="w-4 h-4" /> Tillbaka till alla artiklar
                    </Link>
                </div>
            </div>

            {/* ── Related articles ────────────────────────────────────────────── */}
            {relatedFiltered.length > 0 && (
                <div
                    className="mt-8"
                    style={{
                        background: C.surfaceAlt,
                        borderTop: `1px solid ${C.border}`,
                    }}
                >
                    <div className="max-w-3xl mx-auto px-6 py-10">
                        <h2
                            className="text-lg font-semibold mb-5"
                            style={{ color: C.text }}
                        >
                            Relaterade artiklar
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {relatedFiltered.map(rel => (
                                <Link
                                    key={rel.slug}
                                    href={`/articles/${rel.slug}`}
                                    className="group p-4 rounded-xl transition-all hover:shadow-md hover:-translate-y-0.5"
                                    style={{
                                        background: C.surface,
                                        border: `1px solid ${C.border}`,
                                    }}
                                >
                                    <p
                                        className="text-sm font-medium group-hover:text-[#4361EE] transition-colors line-clamp-2 mb-2"
                                        style={{ color: C.text }}
                                    >
                                        {rel.title}
                                    </p>
                                    <div
                                        className="flex items-center gap-2"
                                        style={{ color: C.textMuted, fontSize: '11px' }}
                                    >
                                        {rel.readingTimeMinutes && (
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {rel.readingTimeMinutes} min
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
