import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPublishedArticleBySlug, getPublishedArticles } from '@/app/actions/articles';
import { ArticleContent, TableOfContents } from '@/components/articles/ArticleBlock';
import type { ArticleBlock } from '@/types/articles';
import { ArrowLeft, Clock, Eye, Calendar, Tag, BookOpen, ChevronRight } from 'lucide-react';
import { FlashcardContextBridge } from '@/components/flashcards/FlashcardContextBridge';

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
        <div className="liquid-page pb-20">
            <FlashcardContextBridge
                sourceContextType="article"
                sourceContextId={article.id}
                topicId={article.topicId}
                topicName={article.topicTitle ?? article.title}
                snippet={article.excerpt ?? article.title}
            />
            <div className="liquid-bg" />
            <div className="liquid-sheen" />
            {/* ── Article container ──────────────────────────────────────────── */}
            <div className="relative z-10 max-w-3xl mx-auto px-6 py-10">
                {/* ── Breadcrumb ─────────────────────────────────────────────── */}
                <nav
                    className="liquid-muted flex items-center gap-2 text-sm mb-6"
                    aria-label="Brödsmulor"
                >
                    <Link
                        href="/articles"
                        className="flex items-center gap-1.5 transition-colors hover:text-blue-700 dark:hover:text-blue-200"
                    >
                        <BookOpen className="w-3.5 h-3.5" /> Artiklar
                    </Link>
                    {article.courseCode && (
                        <>
                            <ChevronRight className="w-3.5 h-3.5" />
                            <Link
                                href={`/articles?courseId=${article.courseId}`}
                                className="transition-colors hover:text-blue-700 dark:hover:text-blue-200"
                            >
                                {article.courseCode}
                            </Link>
                        </>
                    )}
                    {article.topicTitle && (
                        <>
                            <ChevronRight className="w-3.5 h-3.5" />
                            <span>{article.topicTitle}</span>
                        </>
                    )}
                </nav>

                {/* ── Article header ─────────────────────────────────────────── */}
                <header className="liquid-card mb-8 p-5 sm:p-6">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-100">
                        <BookOpen className="h-3.5 w-3.5" />
                        Artikel
                    </div>
                    <h1
                        className="font-bold leading-tight mb-4 text-[clamp(28px,5vw,40px)] tracking-normal"
                    >
                        {article.title}
                    </h1>

                    {article.titleSv && article.titleSv !== article.title && (
                        <p
                            className="liquid-muted italic mb-5 text-lg"
                        >
                            {article.titleSv}
                        </p>
                    )}

                    {article.excerpt && (
                        <p
                            className="liquid-muted mb-6 border-l-4 border-blue-300/40 pl-5 text-[17px] leading-7"
                        >
                            {article.excerpt}
                        </p>
                    )}

                    {/* Metadata row */}
                    <div
                        className="liquid-muted flex flex-wrap items-center gap-4 text-sm"
                    >
                        {article.authorName && (
                            <span>
                                av{' '}
                                <span
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
                                    className="inline-flex items-center gap-1 rounded-lg border border-blue-300/20 bg-blue-400/10 px-2.5 py-1 text-xs font-bold text-blue-700 transition hover:shadow-sm dark:text-blue-100"
                                >
                                    <Tag className="w-3 h-3" />
                                    {tag}
                                </Link>
                            ))}
                        </div>
                    ) : null}

                    {/* Separator */}
                    <div className="mt-8 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-black/10 dark:bg-white/10" />
                        <span className="flex-1 h-px bg-black/10 dark:bg-white/10" />
                        <span className="w-1.5 h-1.5 rounded-full bg-black/10 dark:bg-white/10" />
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
                        <p className="liquid-muted italic text-center py-16">
                            Denna artikel har inget innehåll ännu.
                        </p>
                    ) : (
                        <ArticleContent blocks={blocks} />
                    )}
                </article>

                {/* ── Back link ───────────────────────────────────────────────── */}
                <div
                    className="mt-16 border-t border-black/10 pt-8 dark:border-white/10"
                >
                    <Link
                        href="/articles"
                        className="liquid-muted inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-blue-700 dark:hover:text-blue-200"
                    >
                        <ArrowLeft className="w-4 h-4" /> Tillbaka till alla artiklar
                    </Link>
                </div>
            </div>

            {/* ── Related articles ────────────────────────────────────────────── */}
            {relatedFiltered.length > 0 && (
                <div className="relative z-10 mt-8 border-t border-black/10 dark:border-white/10">
                    <div className="max-w-3xl mx-auto px-6 py-10">
                        <h2 className="text-lg font-semibold mb-5">
                            Relaterade artiklar
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {relatedFiltered.map(rel => (
                                <Link
                                    key={rel.slug}
                                    href={`/articles/${rel.slug}`}
                                    className="liquid-card group p-4 transition-all hover:-translate-y-0.5"
                                >
                                    <p
                                        className="text-sm font-medium group-hover:text-blue-700 dark:group-hover:text-blue-200 transition-colors line-clamp-2 mb-2"
                                    >
                                        {rel.title}
                                    </p>
                                    <div
                                        className="liquid-muted flex items-center gap-2 text-[11px]"
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
